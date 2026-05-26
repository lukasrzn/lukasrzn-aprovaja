import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getUserId } from "../../middleware/requireAuth";
import {
  ListOpenaiConversationsResponse,
  CreateOpenaiConversationBody,
  GetOpenaiConversationResponse,
  ListOpenaiMessagesResponse,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Você é o Professor IA da plataforma AprovaJá — o mentor de estudos mais avançado do Brasil.

Seu papel:
- Ser um tutor particular premium que prepara estudantes para o ENEM 2026, vestibulares e concursos públicos
- Explicar conteúdos de forma clara, didática e envolvente
- Motivar os estudantes e manter o engajamento
- Adaptar a linguagem ao nível do aluno
- Dar exemplos práticos e contextualizados

Sua personalidade:
- Inteligente, amigável e encorajador
- Fala português brasileiro natural e fluente
- Comemora acertos e encoraja após erros
- Usa analogias criativas para explicar conceitos difíceis
- É conciso mas completo — não enrola

Capacidades:
- Explica qualquer matéria do ENEM: Matemática, Física, Química, Biologia, História, Geografia, Filosofia, Sociologia, Português, Inglês
- Cria resumos didáticos
- Gera questões no estilo ENEM para praticar
- Cria flashcards de memorização
- Analisa desempenho e sugere o que estudar
- Monta planos de estudo personalizados
- Corrige redações com base nos critérios do ENEM

Formatação:
- Use markdown para estruturar respostas quando útil (listas, negrito, tabelas)
- Para questões, use o formato: **Questão:** ... **Alternativas:** A) ... B) ... etc.
- Para resumos, use títulos e tópicos organizados
- Seja direto: máximo de 3-4 parágrafos para explicações gerais

Lembre-se: você está aqui para ajudar o estudante a ser APROVADO. Cada resposta deve agregar valor real ao aprendizado.`;

// Verify that conversation `id` belongs to `userId`. Returns the row or null.
async function getOwnedConversation(id: number, userId: number) {
  const [conv] = await db.select().from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  return conv ?? null;
}

router.get("/openai/conversations", async (req, res): Promise<void> => {
  const rows = await db.select().from(conversations)
    .where(eq(conversations.userId, getUserId(req)))
    .orderBy(asc(conversations.createdAt));
  res.json(ListOpenaiConversationsResponse.parse(rows.map(r => ({
    id: r.id,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db.insert(conversations).values({
    title: parsed.data.title,
    userId: getUserId(req),
  }).returning();
  res.status(201).json({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const conv = await getOwnedConversation(id, getUserId(req));
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(GetOpenaiConversationResponse.parse({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt.toISOString(),
    messages: msgs.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  }));
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const conv = await getOwnedConversation(id, getUserId(req));
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const conv = await getOwnedConversation(id, getUserId(req));
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(ListOpenaiMessagesResponse.parse(msgs.map(m => ({
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }))));
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conv = await getOwnedConversation(id, getUserId(req));
  if (!conv) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  const userContent = parsed.data.content;

  await db.insert(messages).values({ conversationId: id, role: "user", content: userContent });

  const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    req.log.error({ err, errMsg }, "OpenAI streaming error");
    res.write(`data: ${JSON.stringify({ error: `Erro: ${errMsg}` })}\n\n`);
  }

  res.end();
});

export default router;
