import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gamificationTable, usersTable } from "@workspace/db";
import { getUserId } from "../middleware/requireAuth";
import {
  GetGlobalRankingResponse,
  GetWeeklyRankingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MOCK_RANKING = [
  { rank: 1, userId: 2, name: "Ana Beatriz Santos", avatarUrl: null, xp: 15420, level: 12, streak: 45, goal: "Medicina", isCurrentUser: false },
  { rank: 2, userId: 3, name: "Carlos Eduardo Lima", avatarUrl: null, xp: 14200, level: 11, streak: 38, goal: "Direito", isCurrentUser: false },
  { rank: 3, userId: 4, name: "Fernanda Costa", avatarUrl: null, xp: 13100, level: 11, streak: 30, goal: "ENEM", isCurrentUser: false },
  { rank: 4, userId: 5, name: "Lucas Mendes", avatarUrl: null, xp: 12500, level: 10, streak: 25, goal: "Engenharia", isCurrentUser: false },
  { rank: 5, userId: 6, name: "Juliana Ferreira", avatarUrl: null, xp: 11800, level: 10, streak: 22, goal: "Medicina", isCurrentUser: false },
  { rank: 6, userId: 7, name: "Rafael Oliveira", avatarUrl: null, xp: 10900, level: 9, streak: 18, goal: "Concurso Federal", isCurrentUser: false },
  { rank: 7, userId: 8, name: "Mariana Silva", avatarUrl: null, xp: 9800, level: 9, streak: 15, goal: "ENEM", isCurrentUser: false },
  { rank: 8, userId: 9, name: "Diego Alves", avatarUrl: null, xp: 8700, level: 8, streak: 12, goal: "Vestibular", isCurrentUser: false },
  { rank: 9, userId: 10, name: "Larissa Monteiro", avatarUrl: null, xp: 7600, level: 8, streak: 10, goal: "ENEM", isCurrentUser: false },
  { rank: 10, userId: 11, name: "Bruno Carvalho", avatarUrl: null, xp: 6500, level: 7, streak: 8, goal: "Medicina", isCurrentUser: false },
];

router.get("/rankings/global", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const [user] = await db
    .select({ name: usersTable.name, goal: usersTable.goal, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  const [g] = await db
    .select()
    .from(gamificationTable)
    .where(eq(gamificationTable.userId, userId));

  const userEntry = {
    rank: 5,
    userId,
    name: user?.name ?? "Estudante AprovaJá",
    avatarUrl: user?.avatarUrl ?? null,
    xp: g?.xp ?? 0,
    level: Math.floor(Math.sqrt((g?.xp ?? 0) / 100)) + 1,
    streak: g?.streak ?? 0,
    goal: user?.goal ?? "ENEM 2026",
    isCurrentUser: true,
  };

  const ranking = [...MOCK_RANKING.slice(0, 4), userEntry, ...MOCK_RANKING.slice(4)];
  ranking.forEach((r, i) => { r.rank = i + 1; });

  res.json(GetGlobalRankingResponse.parse(ranking));
});

router.get("/rankings/weekly", async (req, res): Promise<void> => {
  const weeklyMock = MOCK_RANKING.map(r => ({
    ...r,
    xp: Math.floor(r.xp * 0.1),
    streak: Math.min(7, r.streak),
  }));
  res.json(GetWeeklyRankingResponse.parse(weeklyMock.map((r, i) => ({ ...r, rank: i + 1, isCurrentUser: false }))));
});

export default router;
