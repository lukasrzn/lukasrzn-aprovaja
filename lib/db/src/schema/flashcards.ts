import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const flashcardDecksTable = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => flashcardDecksTable.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  mastered: text("mastered").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFlashcardDeckSchema = createInsertSchema(flashcardDecksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFlashcardDeck = z.infer<typeof insertFlashcardDeckSchema>;
export type FlashcardDeck = typeof flashcardDecksTable.$inferSelect;
export type Flashcard = typeof flashcardsTable.$inferSelect;
