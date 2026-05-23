import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studyPlansTable, studySessionsTable, gamificationTable, performanceLogTable } from "@workspace/db";
import {
  CreateStudyPlanBody,
  UpdateStudyPlanBody,
  GetStudyPlanParams,
  UpdateStudyPlanParams,
  DeleteStudyPlanParams,
  GetStudySessionsParams,
  CreateStudySessionParams,
  CreateStudySessionBody,
  GetStudyPlansResponse,
  GetStudyPlanResponse,
  UpdateStudyPlanResponse,
  GetStudySessionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

function formatPlan(plan: typeof studyPlansTable.$inferSelect) {
  return {
    id: plan.id,
    title: plan.title,
    goal: plan.goal,
    targetDate: plan.targetDate?.toISOString() ?? null,
    subjects: plan.subjects ?? [],
    hoursPerDay: plan.hoursPerDay,
    progress: plan.progress,
    createdAt: plan.createdAt.toISOString(),
  };
}

router.get("/study-plans", async (req, res): Promise<void> => {
  const plans = await db.select().from(studyPlansTable)
    .where(eq(studyPlansTable.userId, DEFAULT_USER_ID))
    .orderBy(studyPlansTable.createdAt);
  res.json(GetStudyPlansResponse.parse(plans.map(formatPlan)));
});

router.post("/study-plans", async (req, res): Promise<void> => {
  const parsed = CreateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { targetDate, ...rest } = parsed.data;
  const [plan] = await db.insert(studyPlansTable).values({
    ...rest,
    userId: DEFAULT_USER_ID,
    ...(targetDate ? { targetDate: new Date(targetDate) } : {}),
  }).returning();
  res.status(201).json(GetStudyPlanResponse.parse(formatPlan(plan)));
});

router.get("/study-plans/:id", async (req, res): Promise<void> => {
  const params = GetStudyPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [plan] = await db.select().from(studyPlansTable)
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, DEFAULT_USER_ID)));
  if (!plan) {
    res.status(404).json({ error: "Plano não encontrado" });
    return;
  }
  res.json(GetStudyPlanResponse.parse(formatPlan(plan)));
});

router.patch("/study-plans/:id", async (req, res): Promise<void> => {
  const params = UpdateStudyPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { targetDate: td, ...restUpdate } = parsed.data;
  const [plan] = await db.update(studyPlansTable)
    .set({ ...restUpdate, ...(td !== undefined ? { targetDate: td ? new Date(td) : null } : {}) })
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, DEFAULT_USER_ID)))
    .returning();
  if (!plan) {
    res.status(404).json({ error: "Plano não encontrado" });
    return;
  }
  res.json(UpdateStudyPlanResponse.parse(formatPlan(plan)));
});

router.delete("/study-plans/:id", async (req, res): Promise<void> => {
  const params = DeleteStudyPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(studyPlansTable)
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, DEFAULT_USER_ID)));
  res.sendStatus(204);
});

router.get("/study-plans/:id/sessions", async (req, res): Promise<void> => {
  const params = GetStudySessionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sessions = await db.select().from(studySessionsTable)
    .where(eq(studySessionsTable.planId, params.data.id))
    .orderBy(studySessionsTable.createdAt);
  res.json(GetStudySessionsResponse.parse(sessions.map(s => ({
    id: s.id,
    planId: s.planId,
    subject: s.subject,
    durationMinutes: s.durationMinutes,
    notes: s.notes ?? null,
    xpEarned: s.xpEarned,
    createdAt: s.createdAt.toISOString(),
  }))));
});

router.post("/study-plans/:id/sessions", async (req, res): Promise<void> => {
  const params = CreateStudySessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateStudySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const xpEarned = Math.floor(parsed.data.durationMinutes * 1.5);
  const [session] = await db.insert(studySessionsTable).values({
    planId: params.data.id,
    userId: DEFAULT_USER_ID,
    subject: parsed.data.subject,
    durationMinutes: parsed.data.durationMinutes,
    notes: parsed.data.notes ?? null,
    xpEarned,
  }).returning();

  // Update gamification
  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  if (g) {
    await db.update(gamificationTable).set({
      xp: g.xp + xpEarned,
      totalStudyMinutes: g.totalStudyMinutes + parsed.data.durationMinutes,
    }).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  }

  // Log performance
  await db.insert(performanceLogTable).values({
    userId: DEFAULT_USER_ID,
    xpEarned,
    minutesStudied: parsed.data.durationMinutes,
    questionsCorrect: 0,
    questionsTotal: 0,
  });

  res.status(201).json({
    id: session.id,
    planId: session.planId,
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    notes: session.notes ?? null,
    xpEarned: session.xpEarned,
    createdAt: session.createdAt.toISOString(),
  });
});

export default router;
