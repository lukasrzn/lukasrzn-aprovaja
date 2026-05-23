import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const simuladosTable = pgTable("simulados", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  type: text("type").notNull().default("ENEM"),
  subject: text("subject"),
  questionCount: integer("question_count").notNull().default(10),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  difficulty: text("difficulty").notNull().default("medio"),
  questionsData: jsonb("questions_data"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  score: real("score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const simuladoResultsTable = pgTable("simulado_results", {
  id: serial("id").primaryKey(),
  simuladoId: integer("simulado_id").notNull().references(() => simuladosTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  score: real("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalCount: integer("total_count").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
  subjectBreakdown: jsonb("subject_breakdown"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSimuladoSchema = createInsertSchema(simuladosTable).omit({ id: true, createdAt: true });
export type InsertSimulado = z.infer<typeof insertSimuladoSchema>;
export type Simulado = typeof simuladosTable.$inferSelect;
export type SimuladoResult = typeof simuladoResultsTable.$inferSelect;
