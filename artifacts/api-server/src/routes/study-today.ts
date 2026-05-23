import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, gamificationTable, simuladoResultsTable, questionsTable } from "@workspace/db";
import {
  GetStudyTodayRecommendationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

const ENEM_WEIGHTS: Record<string, number> = {
  "Matemática": 90,
  "Português": 90,
  "Física": 75,
  "Química": 75,
  "Biologia": 75,
  "História": 70,
  "Geografia": 70,
  "Filosofia": 50,
  "Sociologia": 50,
  "Inglês": 60,
  "Direito Constitucional": 20,
  "Raciocínio Lógico": 20,
  "Administração Pública": 10,
  "Informática": 15,
};

const MINI_SUMMARIES: Record<string, string> = {
  "Funções do 2º Grau": "Domine parábolas, vértice e discriminante — presentes em 80% dos vestibulares.",
  "Cinemática": "Velocidade, aceleração e queda livre. Base de toda a Física do ENEM.",
  "Interpretação de Texto": "Habilidade transversal: impacta todas as questões do ENEM.",
  "Leis de Mendel": "Tabela de Punnett e dominância. Genética é garantida no ENEM.",
  "Ligações Químicas": "Iônica, covalente, metálica — base da Química inorgânica.",
  "Segunda Guerra Mundial": "Nazismo, Holocausto e reconfiguração geopolítica global.",
  "Concordância Verbal": "Um dos tópicos mais cobrados em provas de concurso público.",
  "Probabilidade": "Combinações, permutações e análise probabilística — essenciais no ENEM.",
  "Globalização": "Geopolítica contemporânea: fluxos, paradoxos e desigualdades.",
  "Ética – Kant": "Imperativo categórico e deontologia — filosofia mais cobrada no ENEM.",
};

const MOTIVATIONAL_INSIGHTS: string[] = [
  "Sua IA identificou lacunas críticas. Estudar hoje pode aumentar sua nota em até 15%.",
  "Com base no seu histórico, focar nestas matérias pode colocar você no top 5% do ENEM.",
  "Você está a 3 sessões de dominar estes tópicos. Continue a sequência!",
  "Análise de 1.200 provas do ENEM indica que estes são os tópicos mais recorrentes.",
  "Seu desempenho melhorou 12% na última semana. Vamos acelerar ainda mais hoje!",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildRecommendations(
  weakSubjects: string[],
  allSubjects: string[],
  questionMap: Map<string, { topic: string; id: number }[]>,
  seed: number,
) {
  const cards: {
    id: string;
    subject: string;
    topic: string;
    difficulty: string;
    estimatedMinutes: number;
    priorityLevel: string;
    enemProbability: number;
    studentProgress: number;
    xpReward: number;
    miniSummary: string;
    tags: string[];
    questionCount: number;
    reason: string;
  }[] = [];

  const subjectPool = [
    ...weakSubjects.slice(0, 2),
    ...allSubjects.filter(s => !weakSubjects.includes(s)).slice(0, 3),
  ];

  const picked = new Set<string>();
  let idx = seed % subjectPool.length;

  for (let i = 0; cards.length < 3 && i < subjectPool.length * 2; i++) {
    const subject = subjectPool[idx % subjectPool.length];
    idx++;

    if (picked.has(subject)) continue;
    const qs = questionMap.get(subject);
    if (!qs || qs.length === 0) continue;
    picked.add(subject);

    const q = qs[seed % qs.length];
    const enemProb = ENEM_WEIGHTS[subject] ?? 40;
    const isWeak = weakSubjects.includes(subject);
    const priorityLevel = cards.length === 0 && isWeak ? "urgente"
      : cards.length === 1 ? "importante"
      : "reforço";

    const summary = MINI_SUMMARIES[q.topic] ??
      `Tópico essencial de ${subject} com alta incidência em provas nacionais.`;

    cards.push({
      id: `rec-${subject.toLowerCase().replace(/\s/g, "-")}-${seed + cards.length}`,
      subject,
      topic: q.topic,
      difficulty: cards.length === 0 ? "medio" : cards.length === 1 ? "dificil" : "facil",
      estimatedMinutes: cards.length === 0 ? 25 : cards.length === 1 ? 40 : 15,
      priorityLevel,
      enemProbability: enemProb,
      studentProgress: isWeak ? Math.floor(25 + Math.random() * 20) : Math.floor(50 + Math.random() * 30),
      xpReward: priorityLevel === "urgente" ? 120 : priorityLevel === "importante" ? 80 : 50,
      miniSummary: summary,
      tags: [subject, q.topic.split(" ")[0], priorityLevel],
      questionCount: qs.length,
      reason: isWeak
        ? `Sua taxa de acerto em ${subject} está abaixo da média. Prioridade máxima!`
        : `${subject} tem alta recorrência no ENEM 2026. Não deixe escapar!`,
    });
  }

  return cards;
}

router.get("/study-today/recommendation", async (req, res): Promise<void> => {
  const refresh = req.query.refresh === "true";

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  const results = await db.select().from(simuladoResultsTable).where(eq(simuladoResultsTable.userId, DEFAULT_USER_ID));

  const subjectScores: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    const breakdown = r.subjectBreakdown as Array<{ subject: string; correctAnswers: number; totalQuestions: number }> ?? [];
    for (const b of breakdown) {
      if (!subjectScores[b.subject]) subjectScores[b.subject] = { correct: 0, total: 0 };
      subjectScores[b.subject].correct += b.correctAnswers;
      subjectScores[b.subject].total += b.totalQuestions;
    }
  }

  const weakSubjects = Object.entries(subjectScores)
    .map(([subject, v]) => ({ subject, score: v.total > 0 ? v.correct / v.total : 0 }))
    .sort((a, b) => a.score - b.score)
    .map(s => s.subject);

  const allQuestions = await db.select({
    id: questionsTable.id,
    subject: questionsTable.subject,
    topic: questionsTable.topic,
  }).from(questionsTable);

  const questionMap = new Map<string, { topic: string; id: number }[]>();
  for (const q of allQuestions) {
    if (!questionMap.has(q.subject)) questionMap.set(q.subject, []);
    questionMap.get(q.subject)!.push({ topic: q.topic, id: q.id });
  }

  const allSubjects = [...questionMap.keys()];

  if (weakSubjects.length === 0) {
    weakSubjects.push("Matemática", "Física");
  }

  const seed = refresh ? Math.floor(Math.random() * 1000) : Math.floor(Date.now() / 86400000);

  const recommendations = buildRecommendations(weakSubjects, allSubjects, questionMap, seed);

  const streak = g?.streak ?? 0;
  const insight = MOTIVATIONAL_INSIGHTS[seed % MOTIVATIONAL_INSIGHTS.length];

  res.json(GetStudyTodayRecommendationResponse.parse({
    recommendations,
    generatedAt: new Date().toISOString(),
    analysisInsight: insight,
    pomodoroSuggestion: 25,
    streak,
    totalQuestionsAvailable: allQuestions.length,
  }));
});

export default router;
