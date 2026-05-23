import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, missionsTable, gamificationTable } from "@workspace/db";

const DEFAULT_USER_ID = 1;

/**
 * Increment progress on today's missions of a given type.
 * Auto-awards XP/coins when a mission reaches its target.
 */
export async function incrementMissionProgress(
  type: string,
  amount = 1,
  userId = DEFAULT_USER_ID,
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const missions = await db.select().from(missionsTable).where(
    and(
      eq(missionsTable.userId, userId),
      eq(missionsTable.type, type),
      eq(missionsTable.completed, "false"),
      gte(missionsTable.date, today),
      lt(missionsTable.date, tomorrow),
    ),
  );

  for (const mission of missions) {
    const newProgress = Math.min(mission.progress + amount, mission.target);
    const nowComplete = newProgress >= mission.target;

    await db.update(missionsTable)
      .set({
        progress: newProgress,
        completed: nowComplete ? "true" : "false",
      })
      .where(eq(missionsTable.id, mission.id));

    if (nowComplete) {
      const [g] = await db.select().from(gamificationTable).where(eq(gamificationTable.userId, userId));
      if (g) {
        await db.update(gamificationTable)
          .set({
            xp: sql`${gamificationTable.xp} + ${mission.xpReward}`,
            coins: sql`${gamificationTable.coins} + ${mission.coinReward}`,
          })
          .where(eq(gamificationTable.userId, userId));
      }
    }
  }
}
