import { Router, type IRouter } from "express";
import { db, flashcardDecksTable, flashcardsTable, questionsTable, simuladosTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AiGenerateFlashcardsBody,
  AiGenerateQuestionsBody,
  AiGenerateSimuladoBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;
const MODEL = "gpt-4o-mini";

// ─── Flashcard generation ─────────────────────────────────────────────────────

router.post("/ai/generate/flashcards", async (req, res): Promise<void> => {
  const parsed = AiGenerateFlashcardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, subject, count = 10, difficulty = "medio" } = parsed.data;
  const diffLabel = difficulty === "facil" ? "básico" : difficulty === "dificil" ? "avançado" : "intermediário";

  const prompt = `Você é um professor especialista em ${subject} preparando estudantes brasileiros para o ENEM.

Gere exatamente ${count} flashcards sobre "${topic}" em nível ${diffLabel}.

Responda APENAS com JSON válido no formato:
{"cards": [{"front": "pergunta ou conceito conciso", "back": "resposta completa e didática em 1-3 frases"}]}

Regras:
- Frente: pergunta direta ou conceito-chave (máx 120 chars)
- Verso: resposta clara, completa e memorável (máx 300 chars)
- Varie os tipos: definição, exemplo, causa-efeito, fórmula, mnemônico
- Linguagem PT-BR acadêmica mas acessível
- Relevância ENEM garantida`;

  let cards: Array<{ front: string; back: string }> = [];

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
    if (Array.isArray(raw.cards)) {
      cards = raw.cards.filter(
        (c: unknown): c is { front: string; back: string } =>
          typeof c === "object" && c !== null &&
          typeof (c as Record<string, unknown>).front === "string" &&
          typeof (c as Record<string, unknown>).back === "string",
      );
    }
  } catch {
    res.status(502).json({ error: "Falha na geração pela IA. Tente novamente." });
    return;
  }

  if (cards.length === 0) {
    res.status(502).json({ error: "A IA não retornou flashcards válidos." });
    return;
  }

  const deckTitle = `${subject}: ${topic}`;
  const [deck] = await db.insert(flashcardDecksTable).values({
    userId: DEFAULT_USER_ID,
    title: deckTitle,
    subject,
  }).returning();

  await db.insert(flashcardsTable).values(
    cards.map(c => ({
      deckId: deck.id,
      front: c.front,
      back: c.back,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
    })),
  );

  res.status(201).json({
    deckId: deck.id,
    deckTitle: deck.title,
    cardsCreated: cards.length,
  });
});

// ─── Question generation ──────────────────────────────────────────────────────

router.post("/ai/generate/questions", async (req, res): Promise<void> => {
  const parsed = AiGenerateQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, topic, count = 5, difficulty = "medio", category = "ENEM" } = parsed.data;
  const diffLabel = difficulty === "facil" ? "fácil" : difficulty === "dificil" ? "difícil" : "médio";

  const prompt = `Você é um elaborador de questões para o ${category} especializado em ${subject}.

Gere exatamente ${count} questões de múltipla escolha sobre "${topic}", nível ${diffLabel}.

Responda APENAS com JSON válido:
{"questions": [{
  "statement": "enunciado completo da questão",
  "contextText": "texto de apoio ou null se não houver",
  "alternatives": [
    {"letter": "A", "text": "alternativa A"},
    {"letter": "B", "text": "alternativa B"},
    {"letter": "C", "text": "alternativa C"},
    {"letter": "D", "text": "alternativa D"},
    {"letter": "E", "text": "alternativa E"}
  ],
  "correctAnswer": "A",
  "explanation": "explicação didática da resposta correta",
  "estimatedTimeSeconds": 120
}]}

Regras:
- Estilo autêntico de prova ${category} 2024/2025
- Enunciados contextualizados e interdisciplinares quando possível
- Apenas UMA alternativa correta
- Explicação que ensina o conceito, não apenas justifica
- PT-BR acadêmico`;

  let rawQuestions: Array<{
    statement: string; contextText?: string | null;
    alternatives: Array<{ letter: string; text: string }>;
    correctAnswer: string; explanation: string; estimatedTimeSeconds?: number;
  }> = [];

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
    });
    const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
    if (Array.isArray(raw.questions)) rawQuestions = raw.questions;
  } catch {
    res.status(502).json({ error: "Falha na geração pela IA. Tente novamente." });
    return;
  }

  if (rawQuestions.length === 0) {
    res.status(502).json({ error: "A IA não retornou questões válidas." });
    return;
  }

  const inserted = await db.insert(questionsTable).values(
    rawQuestions.map(q => ({
      subject,
      topic,
      statement: q.statement,
      contextText: q.contextText ?? null,
      difficulty,
      category,
      alternatives: q.alternatives,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      estimatedTimeSeconds: q.estimatedTimeSeconds ?? 120,
      tags: [subject, topic, category],
      triWeight: difficulty === "dificil" ? 1.4 : difficulty === "facil" ? 0.8 : 1.0,
    })),
  ).returning();

  res.status(201).json({
    questionsCreated: inserted.length,
    questionIds: inserted.map(q => q.id),
  });
});

// ─── Simulado generation ──────────────────────────────────────────────────────

router.post("/ai/generate/simulado", async (req, res): Promise<void> => {
  const parsed = AiGenerateSimuladoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, subjects, difficulty = "medio", questionsPerSubject = 3 } = parsed.data;
  const diffLabel = difficulty === "facil" ? "fácil" : difficulty === "dificil" ? "difícil" : "médio";

  const allQuestions: Array<{
    id: number; text: string; subject: string; contextText: string | null;
    alternatives: Array<{ letter: string; text: string }>;
    correctAnswer: string; explanation: string;
  }> = [];

  for (const subject of subjects) {
    const prompt = `Você é um elaborador de questões para o ENEM especializado em ${subject}.

Gere exatamente ${questionsPerSubject} questões de múltipla escolha estilo ENEM, nível ${diffLabel}, sobre ${subject} (variedade de tópicos).

Responda APENAS com JSON válido:
{"questions": [{
  "statement": "enunciado completo",
  "contextText": "texto de apoio ou null",
  "topic": "tópico específico",
  "alternatives": [
    {"letter": "A", "text": "..."},
    {"letter": "B", "text": "..."},
    {"letter": "C", "text": "..."},
    {"letter": "D", "text": "..."},
    {"letter": "E", "text": "..."}
  ],
  "correctAnswer": "A",
  "explanation": "explicação didática"
}]}

PT-BR acadêmico. Estilo autêntico ENEM.`;

    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      });
      const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
      if (Array.isArray(raw.questions)) {
        const inserted = await db.insert(questionsTable).values(
          raw.questions.map((q: { statement: string; contextText?: string | null; topic?: string; alternatives: Array<{ letter: string; text: string }>; correctAnswer: string; explanation: string }) => ({
            subject,
            topic: q.topic ?? subject,
            statement: q.statement,
            contextText: q.contextText ?? null,
            difficulty,
            category: "ENEM",
            alternatives: q.alternatives,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            estimatedTimeSeconds: 120,
            tags: [subject, "ENEM", title],
            triWeight: difficulty === "dificil" ? 1.4 : difficulty === "facil" ? 0.8 : 1.0,
          })),
        ).returning();

        for (let i = 0; i < inserted.length; i++) {
          const dbQ = inserted[i];
          const srcQ = raw.questions[i];
          allQuestions.push({
            id: dbQ.id,
            text: dbQ.statement,
            subject,
            contextText: dbQ.contextText ?? null,
            alternatives: srcQ.alternatives,
            correctAnswer: dbQ.correctAnswer,
            explanation: dbQ.explanation,
          });
        }
      }
    } catch {
      // Skip subject on error, continue with others
    }
  }

  if (allQuestions.length === 0) {
    res.status(502).json({ error: "Não foi possível gerar questões. Tente novamente." });
    return;
  }

  const questionCount = allQuestions.length;
  const durationMinutes = Math.round(questionCount * 2.5);

  const [simulado] = await db.insert(simuladosTable).values({
    userId: DEFAULT_USER_ID,
    title,
    type: "ENEM",
    difficulty,
    questionCount,
    durationMinutes,
    questionsData: allQuestions,
  }).returning();

  res.status(201).json({
    simuladoId: simulado.id,
    title: simulado.title,
    totalQuestions: questionCount,
  });
});

export default router;
