import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, simuladosTable, simuladoResultsTable, gamificationTable, performanceLogTable } from "@workspace/db";
import {
  CreateSimuladoBody,
  GetSimuladoParams,
  SubmitSimuladoParams,
  SubmitSimuladoBody,
  GetSimuladosResponse,
  GetSimuladoResponse,
  SubmitSimuladoResponse,
  GetRecentSimuladoResultsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    text: "Em relação à Primeira Guerra Mundial (1914-1918), qual foi o principal fator que desencadeou o conflito?",
    subject: "História",
    alternatives: [
      { id: "A", text: "A Revolução Industrial na Inglaterra" },
      { id: "B", text: "O assassinato do Arquiduque Francisco Fernando" },
      { id: "C", text: "A criação da Liga das Nações" },
      { id: "D", text: "A expansão do Império Otomano" },
      { id: "E", text: "A Revolução Russa de 1917" },
    ],
  },
  {
    id: 2,
    text: "Qual é o valor de x na equação 2x² - 8x + 6 = 0?",
    subject: "Matemática",
    alternatives: [
      { id: "A", text: "x = 1 e x = 3" },
      { id: "B", text: "x = 2 e x = 4" },
      { id: "C", text: "x = -1 e x = -3" },
      { id: "D", text: "x = 0 e x = 4" },
      { id: "E", text: "x = 3 e x = 5" },
    ],
  },
  {
    id: 3,
    text: "A fotossíntese é o processo pelo qual as plantas produzem glicose a partir de:",
    subject: "Biologia",
    alternatives: [
      { id: "A", text: "Oxigênio e água" },
      { id: "B", text: "CO₂ e luz solar" },
      { id: "C", text: "Nitrogênio e minerais" },
      { id: "D", text: "Glicose e proteínas" },
      { id: "E", text: "Água e nitrogênio" },
    ],
  },
  {
    id: 4,
    text: "Qual das alternativas representa corretamente a Lei de Newton da Gravitação Universal?",
    subject: "Física",
    alternatives: [
      { id: "A", text: "F = ma" },
      { id: "B", text: "F = Gm₁m₂/d²" },
      { id: "C", text: "E = mc²" },
      { id: "D", text: "F = qv×B" },
      { id: "E", text: "PV = nRT" },
    ],
  },
  {
    id: 5,
    text: "Identifique a figura de linguagem na frase: 'A vida é uma viagem sem destino certo.'",
    subject: "Português",
    alternatives: [
      { id: "A", text: "Hipérbole" },
      { id: "B", text: "Metonímia" },
      { id: "C", text: "Metáfora" },
      { id: "D", text: "Personificação" },
      { id: "E", text: "Ironia" },
    ],
  },
];

const CORRECT_ANSWERS: Record<number, string> = { 1: "B", 2: "A", 3: "B", 4: "B", 5: "C" };

router.get("/simulados", async (req, res): Promise<void> => {
  const simulados = await db.select().from(simuladosTable)
    .where(eq(simuladosTable.userId, DEFAULT_USER_ID))
    .orderBy(simuladosTable.createdAt);

  const results = await db.select().from(simuladoResultsTable)
    .where(eq(simuladoResultsTable.userId, DEFAULT_USER_ID));

  const resultMap = new Map(results.map(r => [r.simuladoId, r]));

  res.json(GetSimuladosResponse.parse(simulados.map(s => {
    const result = resultMap.get(s.id);
    return {
      id: s.id,
      title: s.title,
      type: s.type,
      subject: s.subject ?? null,
      questionCount: s.questionCount,
      durationMinutes: s.durationMinutes,
      difficulty: s.difficulty,
      completedAt: result?.completedAt?.toISOString() ?? null,
      score: result?.score ?? null,
      createdAt: s.createdAt.toISOString(),
    };
  })));
});

router.post("/simulados", async (req, res): Promise<void> => {
  const parsed = CreateSimuladoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [simulado] = await db.insert(simuladosTable).values({
    ...parsed.data,
    userId: DEFAULT_USER_ID,
    questionCount: 5,
    durationMinutes: 30,
    questionsData: SAMPLE_QUESTIONS,
  }).returning();
  res.status(201).json({
    id: simulado.id,
    title: simulado.title,
    type: simulado.type,
    subject: simulado.subject ?? null,
    questionCount: simulado.questionCount,
    durationMinutes: simulado.durationMinutes,
    difficulty: simulado.difficulty,
    completedAt: null,
    score: null,
    createdAt: simulado.createdAt.toISOString(),
  });
});

router.get("/simulados/recent-results", async (req, res): Promise<void> => {
  const results = await db.select().from(simuladoResultsTable)
    .where(eq(simuladoResultsTable.userId, DEFAULT_USER_ID))
    .orderBy(simuladoResultsTable.completedAt);

  const enriched = await Promise.all(results.slice(-10).map(async r => {
    const [sim] = await db.select().from(simuladosTable).where(eq(simuladosTable.id, r.simuladoId));
    return {
      id: r.id,
      simuladoId: r.simuladoId,
      simuladoTitle: sim?.title ?? "Simulado",
      score: r.score,
      correctCount: r.correctCount,
      totalCount: r.totalCount,
      xpEarned: r.xpEarned,
      timeSpentMinutes: r.timeSpentMinutes,
      completedAt: r.completedAt.toISOString(),
      subjectBreakdown: (r.subjectBreakdown as any[]) ?? [],
    };
  }));

  res.json(GetRecentSimuladoResultsResponse.parse(enriched));
});

router.get("/simulados/:id", async (req, res): Promise<void> => {
  const params = GetSimuladoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [simulado] = await db.select().from(simuladosTable)
    .where(and(eq(simuladosTable.id, params.data.id), eq(simuladosTable.userId, DEFAULT_USER_ID)));
  if (!simulado) {
    res.status(404).json({ error: "Simulado não encontrado" });
    return;
  }
  res.json(GetSimuladoResponse.parse({
    id: simulado.id,
    title: simulado.title,
    type: simulado.type,
    difficulty: simulado.difficulty,
    durationMinutes: simulado.durationMinutes,
    questions: (simulado.questionsData as any[]) ?? SAMPLE_QUESTIONS,
  }));
});

router.post("/simulados/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitSimuladoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitSimuladoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [simulado] = await db.select().from(simuladosTable).where(eq(simuladosTable.id, params.data.id));
  if (!simulado) {
    res.status(404).json({ error: "Simulado não encontrado" });
    return;
  }

  let correct = 0;
  const total = parsed.data.answers.length;
  for (const answer of parsed.data.answers) {
    if (CORRECT_ANSWERS[answer.questionId] === answer.selectedAlternative) correct++;
  }
  const score = total > 0 ? Math.round((correct / total) * 1000) : 0;
  const xpEarned = Math.floor(score / 10) + correct * 20;

  const subjectBreakdown = [
    { subject: "História", correctAnswers: 0, totalQuestions: 0, score: 0, trend: "stable" },
    { subject: "Matemática", correctAnswers: 0, totalQuestions: 0, score: 0, trend: "stable" },
    { subject: "Biologia", correctAnswers: 0, totalQuestions: 0, score: 0, trend: "stable" },
    { subject: "Física", correctAnswers: 0, totalQuestions: 0, score: 0, trend: "stable" },
    { subject: "Português", correctAnswers: 0, totalQuestions: 0, score: 0, trend: "stable" },
  ];

  const questions = (simulado.questionsData as typeof SAMPLE_QUESTIONS) ?? SAMPLE_QUESTIONS;
  for (const answer of parsed.data.answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) continue;
    const subj = subjectBreakdown.find(s => s.subject === question.subject);
    if (subj) {
      subj.totalQuestions++;
      if (CORRECT_ANSWERS[answer.questionId] === answer.selectedAlternative) subj.correctAnswers++;
      subj.score = subj.totalQuestions > 0 ? Math.round((subj.correctAnswers / subj.totalQuestions) * 100) : 0;
    }
  }

  const [result] = await db.insert(simuladoResultsTable).values({
    simuladoId: simulado.id,
    userId: DEFAULT_USER_ID,
    score,
    correctCount: correct,
    totalCount: total,
    xpEarned,
    timeSpentMinutes: 15,
    subjectBreakdown,
  }).returning();

  await db.update(simuladosTable).set({ completedAt: new Date(), score }).where(eq(simuladosTable.id, simulado.id));

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  if (g) {
    await db.update(gamificationTable).set({ xp: g.xp + xpEarned }).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  }

  await db.insert(performanceLogTable).values({
    userId: DEFAULT_USER_ID,
    xpEarned,
    minutesStudied: 15,
    questionsCorrect: correct,
    questionsTotal: total,
  });

  res.json(SubmitSimuladoResponse.parse({
    id: result.id,
    simuladoId: result.simuladoId,
    simuladoTitle: simulado.title,
    score,
    correctCount: correct,
    totalCount: total,
    xpEarned,
    timeSpentMinutes: result.timeSpentMinutes,
    completedAt: result.completedAt.toISOString(),
    subjectBreakdown: subjectBreakdown.filter(s => s.totalQuestions > 0),
  }));
});

export default router;
