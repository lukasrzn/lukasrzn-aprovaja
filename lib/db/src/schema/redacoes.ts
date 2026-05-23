import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const redacoesTable = pgTable("redacoes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  theme: text("theme").notNull(),
  content: text("content").notNull(),
  score: integer("score"),
  maxScore: integer("max_score").notNull().default(1000),
  feedback: text("feedback"),
  competencias: jsonb("competencias"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRedacaoSchema = createInsertSchema(redacoesTable).omit({ id: true, createdAt: true });
export type InsertRedacao = z.infer<typeof insertRedacaoSchema>;
export type Redacao = typeof redacoesTable.$inferSelect;
