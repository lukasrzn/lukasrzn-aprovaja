import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const studyPlansTable = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  targetDate: timestamp("target_date", { withTimezone: true }),
  subjects: text("subjects").array().notNull().default([]),
  hoursPerDay: real("hours_per_day").notNull().default(2),
  progress: real("progress").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const studySessionsTable = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => studyPlansTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  subject: text("subject").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlansTable.$inferSelect;
export type StudySession = typeof studySessionsTable.$inferSelect;
