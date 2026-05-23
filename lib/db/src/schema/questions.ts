import { pgTable, text, serial, timestamp, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  statement: text("statement").notNull(),
  contextText: text("context_text"),
  difficulty: text("difficulty").notNull().default("medio"),
  category: text("category").notNull().default("ENEM"),
  alternatives: jsonb("alternatives").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  tags: text("tags").array().notNull().default([]),
  estimatedTimeSeconds: integer("estimated_time_seconds").notNull().default(120),
  triWeight: real("tri_weight").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examSessionsTable = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  simuladoId: integer("simulado_id").notNull(),
  userId: integer("user_id").notNull(),
  questionIds: integer("question_ids").array().notNull().default([]),
  answers: jsonb("answers"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  timeSpentSeconds: integer("time_spent_seconds"),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
