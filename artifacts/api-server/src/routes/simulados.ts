import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, simuladosTable, simuladoResultsTable, gamificationTable, performanceLogTable, questionsTable, examSessionsTable } from "@workspace/db";
import {
  CreateSimuladoBody,
  GetSimuladoParams,
  SubmitSimuladoParams,
  SubmitSimuladoBody,
  StartSimuladoParams,
  StartSimuladoBody,
  GetSimuladosResponse,
  GetSimuladoResponse,
  SubmitSimuladoResponse,
  GetRecentSimuladoResultsResponse,
  StartSimuladoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

// Fallback questions if DB has none
const FALLBACK_QUESTIONS = [
  {
    id: -1,
    subject: "História",
    topic: "Primeira Guerra Mundial",
    statement: "Em relação à Primeira Guerra Mundial (1914-1918), qual foi o principal estopim do conflito?",
    contextText: null,
    difficulty: "medio",
    estimatedTimeSeconds: 120,
    alternatives: [
      { id: "A", text: "A Revolução Industrial na Inglaterra" },
      { id: "B", text: "O assassinato do Arquiduque Francisco Fernando em Sarajevo" },
      { id: "C", text: "A criação da Liga das Nações" },
      { id: "D", text: "A expansão do Império Otomano na Europa" },
      { id: "E", text: "A Revolução Russa de 1917" },
    ],
    correctAnswer: "B",
    explanation: "O estopim da Primeira Guerra Mundial foi o assassinato do Arquiduque Francisco Fernando, herdeiro do trono austro-húngaro, em Sarajevo em 28 de junho de 1914. O atentado desencadeou uma série de ultimatos e declarações de guerra entre as potências europeias.",
  },
  {
    id: -2,
    subject: "Matemática",
    topic: "Equação do 2º Grau",
    statement: "Qual é o valor de x na equação 2x² - 8x + 6 = 0?",
    contextText: null,
    difficulty: "medio",
    estimatedTimeSeconds: 150,
    alternatives: [
      { id: "A", text: "x = 1 e x = 3" },
      { id: "B", text: "x = 2 e x = 4" },
      { id: "C", text: "x = -1 e x = -3" },
      { id: "D", text: "x = 0 e x = 4" },
      { id: "E", text: "x = 3 e x = 5" },
    ],
    correctAnswer: "A",
    explanation: "Dividindo por 2: x² - 4x + 3 = 0. Usando a fórmula de Bhaskara: Δ = 16 - 12 = 4. x = (4 ± 2)/2. Logo x₁ = 3 e x₂ = 1.",
  },
  {
    id: -3,
    subject: "Biologia",
    topic: "Fotossíntese",
    statement: "A fotossíntese é o processo pelo qual as plantas produzem glicose a partir de:",
    contextText: null,
    difficulty: "facil",
    estimatedTimeSeconds: 90,
    alternatives: [
      { id: "A", text: "Oxigênio e água" },
      { id: "B", text: "CO₂ e luz solar (com água como reagente)" },
      { id: "C", text: "Nitrogênio e minerais" },
      { id: "D", text: "Glicose e proteínas" },
      { id: "E", text: "Água e nitrogênio" },
    ],
    correctAnswer: "B",
    explanation: "Na fotossíntese, as plantas capturam energia luminosa para converter CO₂ e H₂O em glicose e O₂. A equação geral é: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂.",
  },
  {
    id: -4,
    subject: "Física",
    topic: "Gravitação Universal",
    statement: "Qual das alternativas representa corretamente a Lei da Gravitação Universal de Newton?",
    contextText: null,
    difficulty: "medio",
    estimatedTimeSeconds: 120,
    alternatives: [
      { id: "A", text: "F = ma" },
      { id: "B", text: "F = G·m₁·m₂/d²" },
      { id: "C", text: "E = mc²" },
      { id: "D", text: "F = qv×B" },
      { id: "E", text: "PV = nRT" },
    ],
    correctAnswer: "B",
    explanation: "A Lei da Gravitação Universal enuncia que a força gravitacional entre dois corpos é diretamente proporcional ao produto de suas massas e inversamente proporcional ao quadrado da distância entre eles: F = G·m₁·m₂/d², onde G = 6,67×10⁻¹¹ N·m²/kg².",
  },
  {
    id: -5,
    subject: "Português",
    topic: "Figuras de Linguagem",
    statement: "Identifique a figura de linguagem presente na frase: 'A vida é uma viagem sem destino certo.'",
    contextText: null,
    difficulty: "facil",
    estimatedTimeSeconds: 90,
    alternatives: [
      { id: "A", text: "Hipérbole" },
      { id: "B", text: "Metonímia" },
      { id: "C", text: "Metáfora" },
      { id: "D", text: "Personificação" },
      { id: "E", text: "Ironia" },
    ],
    correctAnswer: "C",
    explanation: "A frase 'A vida é uma viagem sem destino certo' é uma metáfora, pois estabelece uma comparação implícita (sem uso de 'como') entre dois elementos de naturezas diferentes: 'vida' e 'viagem'.",
  },
];

function getFallbackCorrectAnswer(qId: number): string {
  const map: Record<number, string> = { [-1]: "B", [-2]: "A", [-3]: "B", [-4]: "B", [-5]: "C" };
  return map[qId] ?? "A";
}

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
  const questionCount = parsed.data.questionCount ?? 10;
  const durationMinutes = Math.round(questionCount * 2.5);

  const [simulado] = await db.insert(simuladosTable).values({
    userId: DEFAULT_USER_ID,
    title: parsed.data.title,
    type: parsed.data.type,
    subject: parsed.data.subject ?? null,
    difficulty: parsed.data.difficulty,
    questionCount,
    durationMinutes,
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
      triScore: null,
      questionResults: (r.subjectBreakdown as any) ?? [],
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
    questions: FALLBACK_QUESTIONS.map(q => ({
      id: q.id,
      text: q.statement,
      subject: q.subject,
      alternatives: q.alternatives,
    })),
  }));
});

router.post("/simulados/:id/start", async (req, res): Promise<void> => {
  const params = StartSimuladoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = StartSimuladoBody.safeParse(req.body);

  const [simulado] = await db.select().from(simuladosTable)
    .where(and(eq(simuladosTable.id, params.data.id), eq(simuladosTable.userId, DEFAULT_USER_ID)));
  if (!simulado) {
    res.status(404).json({ error: "Simulado não encontrado" });
    return;
  }

  // Pull questions from question bank
  let allQuestions = await db.select().from(questionsTable);
  if (body.success && body.data.subject) {
    allQuestions = allQuestions.filter(q => q.subject === body.data.subject);
  }
  if (body.success && body.data.difficulty) {
    allQuestions = allQuestions.filter(q => q.difficulty === body.data.difficulty);
  }
  if (simulado.difficulty !== "custom") {
    const filtered = allQuestions.filter(q => q.difficulty === simulado.difficulty);
    if (filtered.length >= Math.floor(simulado.questionCount * 0.5)) {
      allQuestions = filtered;
    }
  }

  // Shuffle and pick
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, simulado.questionCount);

  // If not enough DB questions, pad with fallback
  const examQuestions = picked.length >= simulado.questionCount
    ? picked
    : [...picked, ...FALLBACK_QUESTIONS.slice(0, simulado.questionCount - picked.length)];

  const questionIds = examQuestions.map(q => (q.id > 0 ? q.id : q.id));

  const [session] = await db.insert(examSessionsTable).values({
    simuladoId: simulado.id,
    userId: DEFAULT_USER_ID,
    questionIds: questionIds.filter(id => id > 0),
  }).returning();

  res.json(StartSimuladoResponse.parse({
    sessionId: session.id,
    simuladoId: simulado.id,
    title: simulado.title,
    durationMinutes: simulado.durationMinutes,
    difficulty: simulado.difficulty,
    questions: examQuestions.map(q => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      statement: q.statement,
      contextText: (q as any).contextText ?? null,
      difficulty: q.difficulty,
      estimatedTimeSeconds: q.estimatedTimeSeconds,
      alternatives: q.alternatives as Array<{ id: string; text: string }>,
    })),
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

  // Look up correct answers from DB
  const questionIds = parsed.data.answers.map(a => a.questionId).filter(id => id > 0);
  const dbQuestions = questionIds.length > 0
    ? await db.select().from(questionsTable).where(inArray(questionsTable.id, questionIds))
    : [];
  const questionMap = new Map(dbQuestions.map(q => [q.id, q]));

  let correct = 0;
  const total = parsed.data.answers.length;
  const subjectMap: Record<string, { correct: number; total: number; triWeight: number }> = {};
  const questionResults: Array<{
    questionId: number; subject: string; topic: string;
    selectedAlternative: string; correctAnswer: string; isCorrect: boolean; explanation: string;
  }> = [];

  for (const answer of parsed.data.answers) {
    const dbQ = questionMap.get(answer.questionId);
    const fallbackQ = FALLBACK_QUESTIONS.find(q => q.id === answer.questionId);
    const correctAnswer = dbQ?.correctAnswer ?? fallbackQ?.correctAnswer ?? getFallbackCorrectAnswer(answer.questionId);
    const subject = dbQ?.subject ?? fallbackQ?.subject ?? "Geral";
    const topic = dbQ?.topic ?? fallbackQ?.topic ?? "Geral";
    const explanation = dbQ?.explanation ?? fallbackQ?.explanation ?? "Consulte o gabarito comentado para mais detalhes.";
    const isCorrect = answer.selectedAlternative === correctAnswer;
    if (isCorrect) correct++;

    if (!subjectMap[subject]) subjectMap[subject] = { correct: 0, total: 0, triWeight: dbQ?.triWeight ?? 1.0 };
    subjectMap[subject].total++;
    if (isCorrect) subjectMap[subject].correct++;

    questionResults.push({
      questionId: answer.questionId,
      subject,
      topic,
      selectedAlternative: answer.selectedAlternative,
      correctAnswer,
      isCorrect,
      explanation,
    });
  }

  const rawScore = total > 0 ? Math.round((correct / total) * 100) : 0;
  // TRI-style simulation: weighted score 0–1000
  const triScore = Math.round(rawScore * 9 + 100 + (correct > total * 0.7 ? 50 : 0));
  const xpEarned = Math.floor(correct * 25 + (rawScore > 80 ? 100 : 0));
  const timeSpentSeconds = parsed.data.timeSpentSeconds ?? (total * 120);
  const timeSpentMinutes = Math.round(timeSpentSeconds / 60);

  const subjectBreakdown = Object.entries(subjectMap).map(([subject, v]) => ({
    subject,
    score: Math.round((v.correct / v.total) * 100),
    totalQuestions: v.total,
    correctAnswers: v.correct,
    trend: "stable" as const,
  }));

  const [result] = await db.insert(simuladoResultsTable).values({
    simuladoId: simulado.id,
    userId: DEFAULT_USER_ID,
    score: rawScore,
    correctCount: correct,
    totalCount: total,
    xpEarned,
    timeSpentMinutes,
    subjectBreakdown,
  }).returning();

  await db.update(simuladosTable).set({ completedAt: new Date(), score: rawScore }).where(eq(simuladosTable.id, simulado.id));

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  if (g) {
    await db.update(gamificationTable).set({ xp: g.xp + xpEarned }).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  }

  await db.insert(performanceLogTable).values({
    userId: DEFAULT_USER_ID,
    xpEarned,
    minutesStudied: timeSpentMinutes,
    questionsCorrect: correct,
    questionsTotal: total,
  });

  res.json(SubmitSimuladoResponse.parse({
    id: result.id,
    simuladoId: result.simuladoId,
    simuladoTitle: simulado.title,
    score: rawScore,
    correctCount: correct,
    totalCount: total,
    xpEarned,
    timeSpentMinutes,
    completedAt: result.completedAt.toISOString(),
    subjectBreakdown: subjectBreakdown.filter(s => s.totalQuestions > 0),
    triScore,
    questionResults,
  }));
});

export default router;
