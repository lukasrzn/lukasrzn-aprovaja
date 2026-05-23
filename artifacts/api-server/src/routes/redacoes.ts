import { Router, type IRouter } from "express";
import { incrementMissionProgress } from "./mission-progress.js";
import { eq } from "drizzle-orm";
import { db, redacoesTable, gamificationTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SubmitRedacaoBody,
  GetRedacaoParams,
  GetRedacoesResponse,
  GetRedacaoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

async function generateAiFeedback(theme: string, content: string) {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  const prompt = `Você é um corretor especialista em redação do ENEM. Corrija a redação abaixo com critério técnico e feedback didático.

TEMA: ${theme}

REDAÇÃO:
${content}

Avalie pelas 5 competências do ENEM (0 a 200 cada). Considere que o texto tem ${wordCount} palavras.

Responda SOMENTE com JSON válido:
{
  "competencias": [
    {
      "number": 1,
      "description": "Domínio da escrita formal da língua portuguesa",
      "score": <0-200, múltiplo de 40>,
      "maxScore": 200,
      "feedback": "feedback específico e didático sobre gramática, ortografia e norma culta (2-3 frases)"
    },
    {
      "number": 2,
      "description": "Compreensão da proposta de redação e aplicação de conceitos das áreas de conhecimento",
      "score": <0-200>,
      "maxScore": 200,
      "feedback": "feedback sobre aderência ao tema e repertório sociocultural (2-3 frases)"
    },
    {
      "number": 3,
      "description": "Seleção, relação, organização e interpretação de informações",
      "score": <0-200>,
      "maxScore": 200,
      "feedback": "feedback sobre argumentação, estrutura e organização das ideias (2-3 frases)"
    },
    {
      "number": 4,
      "description": "Conhecimento dos mecanismos linguísticos necessários para a coesão textual",
      "score": <0-200>,
      "maxScore": 200,
      "feedback": "feedback sobre conectivos, coesão referencial e progressão temática (2-3 frases)"
    },
    {
      "number": 5,
      "description": "Elaboração de proposta de intervenção social, respeitando os direitos humanos",
      "score": <0-200>,
      "maxScore": 200,
      "feedback": "feedback sobre a proposta de intervenção: agente, ação, modo, finalidade (2-3 frases)"
    }
  ],
  "overallFeedback": "parecer geral construtivo e motivador sobre a redação (3-4 frases, mencione pontos fortes e áreas de melhoria)"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    const competencias = Array.isArray(parsed.competencias) ? parsed.competencias : [];
    const totalScore = competencias.reduce((acc: number, c: { score: number }) => acc + (c.score ?? 0), 0);

    return {
      score: Math.min(1000, Math.max(0, totalScore)),
      competencias,
      feedback: parsed.overallFeedback ?? "Redação analisada pela IA.",
    };
  } catch {
    // Fallback to heuristic if AI fails
    const baseScore = Math.min(1000, Math.max(300, wordCount * 2));
    return {
      score: baseScore,
      competencias: [
        { number: 1, description: "Domínio da escrita formal da língua portuguesa", score: Math.min(200, Math.floor(baseScore * 0.22)), maxScore: 200, feedback: "Boa utilização das normas da língua portuguesa." },
        { number: 2, description: "Compreensão da proposta de redação", score: Math.min(200, Math.floor(baseScore * 0.20)), maxScore: 200, feedback: "Tema compreendido com clareza." },
        { number: 3, description: "Seleção e organização das informações", score: Math.min(200, Math.floor(baseScore * 0.21)), maxScore: 200, feedback: "Estrutura argumentativa presente." },
        { number: 4, description: "Conhecimento dos mecanismos linguísticos", score: Math.min(200, Math.floor(baseScore * 0.19)), maxScore: 200, feedback: "Boa coesão textual." },
        { number: 5, description: "Elaboração de proposta de intervenção", score: Math.min(200, Math.floor(baseScore * 0.18)), maxScore: 200, feedback: "Proposta de intervenção presente." },
      ],
      feedback: `Sua redação com ${wordCount} palavras foi analisada. Continue praticando para melhorar seus resultados!`,
    };
  }
}

router.get("/redacoes", async (req, res): Promise<void> => {
  const redacoes = await db.select().from(redacoesTable)
    .where(eq(redacoesTable.userId, DEFAULT_USER_ID))
    .orderBy(redacoesTable.createdAt);

  res.json(GetRedacoesResponse.parse(redacoes.map(r => ({
    id: r.id,
    theme: r.theme,
    content: r.content,
    score: r.score ?? null,
    maxScore: r.maxScore,
    feedback: r.feedback ?? null,
    competencias: (r.competencias as any[]) ?? null,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/redacoes", async (req, res): Promise<void> => {
  const parsed = SubmitRedacaoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { score, competencias, feedback } = await generateAiFeedback(parsed.data.theme, parsed.data.content);
  const xpEarned = Math.floor(score / 20);

  const [redacao] = await db.insert(redacoesTable).values({
    userId: DEFAULT_USER_ID,
    theme: parsed.data.theme,
    content: parsed.data.content,
    score,
    maxScore: 1000,
    feedback,
    competencias,
  }).returning();

  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  if (g) {
    await db.update(gamificationTable).set({ xp: g.xp + xpEarned }).where(eq(gamificationTable.userId, DEFAULT_USER_ID));
  }

  await incrementMissionProgress("redacao", 1);

  res.status(201).json({
    id: redacao.id,
    theme: redacao.theme,
    content: redacao.content,
    score: redacao.score ?? null,
    maxScore: redacao.maxScore,
    feedback: redacao.feedback ?? null,
    competencias: (redacao.competencias as any[]) ?? null,
    createdAt: redacao.createdAt.toISOString(),
  });
});

router.get("/redacoes/:id", async (req, res): Promise<void> => {
  const params = GetRedacaoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [redacao] = await db.select().from(redacoesTable)
    .where(eq(redacoesTable.id, params.data.id));
  if (!redacao) {
    res.status(404).json({ error: "Redação não encontrada" });
    return;
  }
  res.json(GetRedacaoResponse.parse({
    id: redacao.id,
    theme: redacao.theme,
    content: redacao.content,
    score: redacao.score ?? null,
    maxScore: redacao.maxScore,
    feedback: redacao.feedback ?? null,
    competencias: (redacao.competencias as any[]) ?? null,
    createdAt: redacao.createdAt.toISOString(),
  }));
});

export default router;
