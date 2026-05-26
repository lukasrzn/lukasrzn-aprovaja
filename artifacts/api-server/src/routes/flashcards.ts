import { Router, type IRouter } from "express";
import { getUserId } from "../middleware/requireAuth";
import { incrementMissionProgress } from "./mission-progress.js";
import { eq, and, gte } from "drizzle-orm";
import { db, flashcardDecksTable, flashcardsTable, gamificationTable } from "@workspace/db";
import {
  CreateFlashcardDeckBody,
  GetFlashcardCardsParams,
  CreateFlashcardParams,
  CreateFlashcardBody,
  ReviewFlashcardParams,
  ReviewFlashcardBody,
  GetFlashcardsResponse,
  GetFlashcardCardsResponse,
  ReviewFlashcardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/flashcards", async (req, res): Promise<void> => {
  const decks = await db.select().from(flashcardDecksTable)
    .where(eq(flashcardDecksTable.userId, getUserId(req)))
    .orderBy(flashcardDecksTable.createdAt);

  const deckData = await Promise.all(decks.map(async (deck) => {
    const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, deck.id));
    const now = new Date();
    return {
      id: deck.id,
      title: deck.title,
      subject: deck.subject,
      cardCount: cards.length,
      dueCount: cards.filter(c => !c.nextReviewAt || c.nextReviewAt <= now).length,
      masteredCount: cards.filter(c => c.mastered === "true").length,
      createdAt: deck.createdAt.toISOString(),
    };
  }));

  res.json(GetFlashcardsResponse.parse(deckData));
});

router.post("/flashcards", async (req, res): Promise<void> => {
  const parsed = CreateFlashcardDeckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deck] = await db.insert(flashcardDecksTable).values({
    ...parsed.data,
    userId: getUserId(req),
  }).returning();
  res.status(201).json({
    id: deck.id,
    title: deck.title,
    subject: deck.subject,
    cardCount: 0,
    dueCount: 0,
    masteredCount: 0,
    createdAt: deck.createdAt.toISOString(),
  });
});

async function assertDeckOwned(deckId: number, userId: number): Promise<boolean> {
  const [deck] = await db.select({ id: flashcardDecksTable.id })
    .from(flashcardDecksTable)
    .where(and(eq(flashcardDecksTable.id, deckId), eq(flashcardDecksTable.userId, userId)));
  return !!deck;
}

router.get("/flashcards/:deckId/cards", async (req, res): Promise<void> => {
  const params = GetFlashcardCardsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await assertDeckOwned(params.data.deckId, getUserId(req)))) {
    res.status(404).json({ error: "Deck não encontrado" });
    return;
  }
  const cards = await db.select().from(flashcardsTable)
    .where(eq(flashcardsTable.deckId, params.data.deckId));
  res.json(GetFlashcardCardsResponse.parse(cards.map(c => ({
    id: c.id,
    deckId: c.deckId,
    front: c.front,
    back: c.back,
    easeFactor: c.easeFactor,
    interval: c.interval,
    repetitions: c.repetitions,
    nextReviewAt: c.nextReviewAt?.toISOString() ?? null,
    mastered: c.mastered === "true",
  }))));
});

router.post("/flashcards/:deckId/cards", async (req, res): Promise<void> => {
  const params = CreateFlashcardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateFlashcardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await assertDeckOwned(params.data.deckId, getUserId(req)))) {
    res.status(404).json({ error: "Deck não encontrado" });
    return;
  }
  const [card] = await db.insert(flashcardsTable).values({
    deckId: params.data.deckId,
    front: parsed.data.front,
    back: parsed.data.back,
  }).returning();
  res.status(201).json({
    id: card.id,
    deckId: card.deckId,
    front: card.front,
    back: card.back,
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
    nextReviewAt: card.nextReviewAt?.toISOString() ?? null,
    mastered: card.mastered === "true",
  });
});

router.post("/flashcards/:deckId/cards/:cardId/review", async (req, res): Promise<void> => {
  const params = ReviewFlashcardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ReviewFlashcardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!(await assertDeckOwned(params.data.deckId, getUserId(req)))) {
    res.status(404).json({ error: "Card não encontrado" });
    return;
  }
  const [card] = await db.select().from(flashcardsTable)
    .where(and(eq(flashcardsTable.id, params.data.cardId), eq(flashcardsTable.deckId, params.data.deckId)));
  if (!card) {
    res.status(404).json({ error: "Card não encontrado" });
    return;
  }

  const q = parsed.data.quality;
  let ef = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  let interval = card.interval;
  let repetitions = card.repetitions;
  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(card.interval * ef);
    repetitions += 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  const mastered = repetitions >= 5 && q >= 4 ? "true" : "false";

  const [updated] = await db.update(flashcardsTable).set({
    easeFactor: ef,
    interval,
    repetitions,
    nextReviewAt,
    mastered,
  }).where(eq(flashcardsTable.id, params.data.cardId)).returning();

  const xpGained = q >= 5 ? 15 : q >= 4 ? 10 : q >= 2 ? 5 : 2;
  const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, getUserId(req)));
  if (g) {
    await db.update(gamificationTable).set({
      xp: g.xp + xpGained,
    }).where(eq(gamificationTable.userId, getUserId(req)));
  }

  await incrementMissionProgress("flashcard", 1, getUserId(req));

  res.json(ReviewFlashcardResponse.parse({
    id: updated.id,
    deckId: updated.deckId,
    front: updated.front,
    back: updated.back,
    easeFactor: updated.easeFactor,
    interval: updated.interval,
    repetitions: updated.repetitions,
    nextReviewAt: updated.nextReviewAt?.toISOString() ?? null,
    mastered: updated.mastered === "true",
  }));
});

export default router;
