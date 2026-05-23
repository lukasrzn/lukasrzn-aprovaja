import { Router, type IRouter } from "express";
import { eq, gte, sql } from "drizzle-orm";
import { db, gamificationTable, studySessionsTable, simuladoResultsTable, flashcardsTable, flashcardDecksTable, performanceLogTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetPerformanceDataResponse,
  GetWeakSubjectsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));

  const sessions = await db.select().from(studySessionsTable)
    .where(eq(studySessionsTable.userId, DEFAULT_USER_ID));
  const todaySessions = sessions.filter(s => s.createdAt >= today);
  const studyMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const results = await db.select().from(simuladoResultsTable)
    .where(eq(simuladoResultsTable.userId, DEFAULT_USER_ID));
  const simuladosCompleted = results.length;
  const questionsAnsweredToday = results
    .filter(r => r.completedAt >= today)
    .reduce((acc, r) => acc + r.totalCount, 0);

  const deckIds = await db.select({ id: flashcardDecksTable.id })
    .from(flashcardDecksTable)
    .where(eq(flashcardDecksTable.userId, DEFAULT_USER_ID));

  const flashcardsReviewedToday = 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = await db.select().from(performanceLogTable)
    .where(eq(performanceLogTable.userId, DEFAULT_USER_ID));
  const xpThisWeek = weekLogs
    .filter(l => l.date >= weekAgo)
    .reduce((acc, l) => acc + l.xpEarned, 0);

  res.json(GetDashboardSummaryResponse.parse({
    studyMinutesToday,
    questionsAnsweredToday,
    simuladosCompleted,
    flashcardsReviewedToday,
    currentStreak: g?.streak ?? 0,
    xpThisWeek,
    nextMilestone: "Completar 5 simulados ENEM 2026",
  }));
});

router.get("/dashboard/performance", async (req, res): Promise<void> => {
  const logs = await db.select().from(performanceLogTable)
    .where(eq(performanceLogTable.userId, DEFAULT_USER_ID));

  const byDate: Record<string, { xpEarned: number; minutesStudied: number; questionsCorrect: number; questionsTotal: number }> = {};
  for (const log of logs) {
    const key = log.date.toISOString().split("T")[0];
    if (!byDate[key]) byDate[key] = { xpEarned: 0, minutesStudied: 0, questionsCorrect: 0, questionsTotal: 0 };
    byDate[key].xpEarned += log.xpEarned;
    byDate[key].minutesStudied += log.minutesStudied;
    byDate[key].questionsCorrect += log.questionsCorrect;
    byDate[key].questionsTotal += log.questionsTotal;
  }

  const result = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({ date, ...v }));

  res.json(GetPerformanceDataResponse.parse(result));
});

router.get("/dashboard/weak-subjects", async (req, res): Promise<void> => {
  const results = await db.select().from(simuladoResultsTable)
    .where(eq(simuladoResultsTable.userId, DEFAULT_USER_ID));

  const subjectMap: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    const breakdown = r.subjectBreakdown as Array<{ subject: string; correctAnswers: number; totalQuestions: number }> ?? [];
    for (const b of breakdown) {
      if (!subjectMap[b.subject]) subjectMap[b.subject] = { correct: 0, total: 0 };
      subjectMap[b.subject].correct += b.correctAnswers;
      subjectMap[b.subject].total += b.totalQuestions;
    }
  }

  const subjects = Object.entries(subjectMap).map(([subject, v]) => ({
    subject,
    score: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    totalQuestions: v.total,
    correctAnswers: v.correct,
    trend: "stable" as const,
  }));

  if (subjects.length === 0) {
    res.json(GetWeakSubjectsResponse.parse([
      { subject: "Matemática", score: 58, totalQuestions: 50, correctAnswers: 29, trend: "down" },
      { subject: "Física", score: 62, totalQuestions: 30, correctAnswers: 19, trend: "stable" },
      { subject: "História", score: 75, totalQuestions: 40, correctAnswers: 30, trend: "up" },
      { subject: "Português", score: 80, totalQuestions: 60, correctAnswers: 48, trend: "up" },
      { subject: "Biologia", score: 70, totalQuestions: 35, correctAnswers: 25, trend: "stable" },
    ]));
    return;
  }

  res.json(GetWeakSubjectsResponse.parse(subjects.sort((a, b) => a.score - b.score).slice(0, 5)));
});

export default router;
