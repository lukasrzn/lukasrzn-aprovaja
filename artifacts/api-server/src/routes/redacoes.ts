import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, redacoesTable, gamificationTable } from "@workspace/db";
import {
  SubmitRedacaoBody,
  GetRedacaoParams,
  GetRedacoesResponse,
  GetRedacaoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_USER_ID = 1;

function generateAiFeedback(content: string) {
  const wordCount = content.split(/\s+/).length;
  const baseScore = Math.min(1000, Math.max(300, wordCount * 2));

  const competencias = [
    {
      number: 1,
      description: "Domínio da escrita formal da língua portuguesa",
      score: Math.min(200, Math.floor(baseScore * 0.22)),
      maxScore: 200,
      feedback: "Boa utilização das normas da língua portuguesa. Atenção à concordância verbal em alguns trechos.",
    },
    {
      number: 2,
      description: "Compreensão da proposta e desenvolvimento do tema",
      score: Math.min(200, Math.floor(baseScore * 0.20)),
      maxScore: 200,
      feedback: "Tema compreendido com clareza. Desenvolva mais os argumentos centrais para maior profundidade.",
    },
    {
      number: 3,
      description: "Seleção, relação e organização das informações",
      score: Math.min(200, Math.floor(baseScore * 0.21)),
      maxScore: 200,
      feedback: "Estrutura argumentativa presente. Fortaleça as evidências com dados concretos.",
    },
    {
      number: 4,
      description: "Conhecimento dos mecanismos linguísticos",
      score: Math.min(200, Math.floor(baseScore * 0.19)),
      maxScore: 200,
      feedback: "Boa coesão textual. Variar os conectivos pode enriquecer a progressão do texto.",
    },
    {
      number: 5,
      description: "Elaboração de proposta de intervenção social",
      score: Math.min(200, Math.floor(baseScore * 0.18)),
      maxScore: 200,
      feedback: "Proposta de intervenção presente. Detalhe melhor os agentes, ações e finalidades.",
    },
  ];

  const totalScore = competencias.reduce((acc, c) => acc + c.score, 0);
  const feedback = `Sua redação apresenta estrutura sólida com ${wordCount} palavras. ${totalScore >= 700 ? "Excelente trabalho! Continue desenvolvendo sua escrita." : totalScore >= 500 ? "Bom desenvolvimento. Há espaço para aprimorar os argumentos." : "Continue praticando! A consistência trará melhores resultados."}`;

  return { score: totalScore, competencias, feedback };
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

  const { score, competencias, feedback } = generateAiFeedback(parsed.data.content);
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
