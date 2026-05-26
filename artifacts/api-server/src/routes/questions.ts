import { Router, type IRouter } from "express";
import { getUserId } from "../middleware/requireAuth";
import { eq, and, sql, ilike } from "drizzle-orm";
import { db, questionsTable, gamificationTable } from "@workspace/db";
import {
  CreateQuestionBody,
  GetQuestionParams,
  PracticeQuestionParams,
  PracticeQuestionBody,
  GetQuestionsResponse,
  GetQuestionSubjectsResponse,
  GetQuestionResponse,
  PracticeQuestionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatQuestion(q: typeof questionsTable.$inferSelect, includeAnswer = false) {
  const base = {
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    statement: q.statement,
    contextText: q.contextText ?? null,
    difficulty: q.difficulty,
    category: q.category,
    alternatives: q.alternatives as Array<{ id: string; text: string }>,
    tags: q.tags ?? [],
    estimatedTimeSeconds: q.estimatedTimeSeconds,
  };
  if (includeAnswer) {
    return { ...base, correctAnswer: q.correctAnswer, explanation: q.explanation };
  }
  return base;
}

router.get("/questions/subjects", async (req, res): Promise<void> => {
  const questions = await db.select().from(questionsTable);

  const subjectMap: Record<string, { topics: Set<string>; facil: number; medio: number; dificil: number }> = {};
  for (const q of questions) {
    if (!subjectMap[q.subject]) {
      subjectMap[q.subject] = { topics: new Set(), facil: 0, medio: 0, dificil: 0 };
    }
    subjectMap[q.subject].topics.add(q.topic);
    if (q.difficulty === "facil") subjectMap[q.subject].facil++;
    else if (q.difficulty === "medio") subjectMap[q.subject].medio++;
    else if (q.difficulty === "dificil") subjectMap[q.subject].dificil++;
  }

  const result = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    questionCount: data.facil + data.medio + data.dificil,
    topics: Array.from(data.topics),
    difficulties: { facil: data.facil, medio: data.medio, dificil: data.dificil },
  }));

  res.json(GetQuestionSubjectsResponse.parse(result));
});

router.get("/questions", async (req, res): Promise<void> => {
  const { subject, topic, difficulty, category } = req.query;
  const limit = Math.min(parseInt(req.query.limit as string || "20", 10), 100);
  const offset = parseInt(req.query.offset as string || "0", 10);

  let questions = await db.select().from(questionsTable);

  if (subject) questions = questions.filter(q => q.subject === subject);
  if (topic) questions = questions.filter(q => q.topic === topic);
  if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
  if (category) questions = questions.filter(q => q.category === category);

  const total = questions.length;
  const paged = questions.slice(offset, offset + limit);

  res.json(GetQuestionsResponse.parse({
    questions: paged.map(q => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      statement: q.statement,
      difficulty: q.difficulty,
      category: q.category,
      estimatedTimeSeconds: q.estimatedTimeSeconds,
      tags: q.tags ?? [],
    })),
    total,
    offset,
    limit,
  }));
});

router.get("/questions/:id", async (req, res): Promise<void> => {
  const params = GetQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, params.data.id));
  if (!q) {
    res.status(404).json({ error: "Questão não encontrada" });
    return;
  }
  res.json(GetQuestionResponse.parse(formatQuestion(q, true)));
});

router.post("/questions", async (req, res): Promise<void> => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [q] = await db.insert(questionsTable).values({
    ...parsed.data,
    alternatives: parsed.data.alternatives,
  }).returning();
  res.status(201).json(formatQuestion(q, true));
});

router.post("/questions/:id/practice", async (req, res): Promise<void> => {
  const params = PracticeQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PracticeQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, params.data.id));
  if (!q) {
    res.status(404).json({ error: "Questão não encontrada" });
    return;
  }

  const isCorrect = parsed.data.selectedAlternative === q.correctAnswer;
  const xpEarned = isCorrect ? (q.difficulty === "dificil" ? 30 : q.difficulty === "medio" ? 20 : 10) : 5;

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, getUserId(req)));
  if (g) {
    await db.update(gamificationTable).set({ xp: g.xp + xpEarned, coins: g.coins + (isCorrect ? 2 : 0) })
      .where(eq(gamificationTable.userId, getUserId(req)));
  }

  res.json(PracticeQuestionResponse.parse({
    isCorrect,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    xpEarned,
  }));
});

export default router;
