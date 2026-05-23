import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(50),
  coinReward: integer("coin_reward").notNull().default(10),
  completed: text("completed").notNull().default("false"),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(1),
  type: text("type").notNull().default("study"),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const performanceLogTable = pgTable("performance_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  xpEarned: integer("xp_earned").notNull().default(0),
  minutesStudied: integer("minutes_studied").notNull().default(0),
  questionsCorrect: integer("questions_correct").notNull().default(0),
  questionsTotal: integer("questions_total").notNull().default(0),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;
