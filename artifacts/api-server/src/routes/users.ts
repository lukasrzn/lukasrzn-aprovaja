import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, gamificationTable, medalsTable } from "@workspace/db";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  GetGamificationStatsResponse,
  GetMedalsResponse,
} from "@workspace/api-zod";
import { getUserId } from "../middleware/requireAuth";

const router: IRouter = Router();

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calcXpToNextLevel(xp: number): number {
  const level = calcLevel(xp);
  const nextLevelXp = Math.pow(level, 2) * 100;
  return nextLevelXp - xp;
}

router.get("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }
  res.json(GetMeResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    goal: user.goal,
    school: user.school ?? null,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, userId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json(UpdateMeResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    goal: user.goal,
    school: user.school ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.get("/gamification/stats", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  let [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, userId));
  if (!g) {
    [g] = await db.insert(gamificationTable).values({ userId }).returning();
  }
  const medals = await db.select().from(medalsTable)
    .where(eq(medalsTable.userId, userId));
  const medalsEarned = medals.filter(m => m.earned === "true").length;
  res.json(GetGamificationStatsResponse.parse({
    xp: g.xp,
    level: calcLevel(g.xp),
    xpToNextLevel: calcXpToNextLevel(g.xp),
    streak: g.streak,
    coins: g.coins,
    rank: 1,
    totalStudyMinutes: g.totalStudyMinutes,
    medalsEarned,
  }));
});

router.get("/gamification/medals", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const medals = await db.select().from(medalsTable)
    .where(eq(medalsTable.userId, userId));
  res.json(GetMedalsResponse.parse(medals.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    icon: m.icon,
    earned: m.earned === "true",
    earnedAt: m.earnedAt?.toISOString() ?? null,
    rarity: m.rarity,
  }))));
});

export default router;
