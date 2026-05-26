import { Router, type IRouter } from "express";
import { getUserId } from "../middleware/requireAuth";
import { eq, and, gte } from "drizzle-orm";
import { db, missionsTable, gamificationTable } from "@workspace/db";
import {
  CompleteMissionParams,
  GetTodayMissionsResponse,
  CompleteMissionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_MISSIONS = [
  { title: "Estudar por 30 minutos", description: "Complete uma sessão de estudos de pelo menos 30 minutos", icon: "BookOpen", xpReward: 50, coinReward: 10, target: 1, type: "study" },
  { title: "Revisar 10 flashcards", description: "Revise 10 flashcards no sistema de repetição espaçada", icon: "Layers", xpReward: 30, coinReward: 5, target: 10, type: "flashcard" },
  { title: "Completar 1 simulado", description: "Finalize um simulado completo com todas as questões respondidas", icon: "FileText", xpReward: 100, coinReward: 20, target: 1, type: "simulado" },
  { title: "Enviar uma redação", description: "Escreva e envie uma redação para correção pela IA", icon: "PenTool", xpReward: 80, coinReward: 15, target: 1, type: "redacao" },
];

async function ensureTodayMissions(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.select().from(missionsTable)
    .where(and(eq(missionsTable.userId, userId), gte(missionsTable.date, today)));

  if (existing.length === 0) {
    await db.insert(missionsTable).values(
      DEFAULT_MISSIONS.map(m => ({ ...m, userId, date: new Date() }))
    );
    return db.select().from(missionsTable)
      .where(and(eq(missionsTable.userId, userId), gte(missionsTable.date, today)));
  }

  return existing;
}

router.get("/missions/today", async (req, res): Promise<void> => {
  const missions = await ensureTodayMissions(getUserId(req));
  res.json(GetTodayMissionsResponse.parse(missions.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    icon: m.icon,
    xpReward: m.xpReward,
    coinReward: m.coinReward,
    completed: m.completed === "true",
    progress: m.progress,
    target: m.target,
    type: m.type,
  }))));
});

router.post("/missions/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteMissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [mission] = await db.select().from(missionsTable)
    .where(and(eq(missionsTable.id, params.data.id), eq(missionsTable.userId, getUserId(req))));
  if (!mission) {
    res.status(404).json({ error: "Missão não encontrada" });
    return;
  }

  if (mission.completed === "true") {
    res.json(CompleteMissionResponse.parse({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      icon: mission.icon,
      xpReward: mission.xpReward,
      coinReward: mission.coinReward,
      completed: true,
      progress: mission.progress,
      target: mission.target,
      type: mission.type,
    }));
    return;
  }

  const [updated] = await db.update(missionsTable)
    .set({ completed: "true", progress: mission.target })
    .where(eq(missionsTable.id, params.data.id))
    .returning();

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, getUserId(req)));
  if (g) {
    await db.update(gamificationTable).set({
      xp: g.xp + mission.xpReward,
      coins: g.coins + mission.coinReward,
    }).where(eq(gamificationTable.userId, getUserId(req)));
  }

  res.json(CompleteMissionResponse.parse({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    icon: updated.icon,
    xpReward: updated.xpReward,
    coinReward: updated.coinReward,
    completed: true,
    progress: updated.progress,
    target: updated.target,
    type: updated.type,
  }));
});

export default router;
