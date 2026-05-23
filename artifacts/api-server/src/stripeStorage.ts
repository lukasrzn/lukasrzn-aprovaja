import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const DEFAULT_USER_ID = 1;

export class StripeStorage {
  async getUserById(id: number) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  }

  async getDefaultUser() {
    return this.getUserById(DEFAULT_USER_ID);
  }

  async updateUserStripeInfo(userId: number, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const [user] = await db
      .update(usersTable)
      .set(info)
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      SELECT
        p.id            AS product_id,
        p.name          AS product_name,
        p.description   AS product_description,
        p.active        AS product_active,
        p.metadata      AS product_metadata,
        pr.id           AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active       AS price_active
      FROM stripe.products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY pr.unit_amount ASC
    `);
    return result.rows;
  }

  async getPriceByPlanSlug(planSlug: 'pro' | 'premium') {
    const name = planSlug === 'pro' ? 'Pro' : 'Premium';
    const result = await db.execute(sql`
      SELECT pr.id, pr.unit_amount, pr.currency, pr.recurring
      FROM stripe.prices pr
      JOIN stripe.products p ON p.id = pr.product
      WHERE p.name ILIKE ${'%' + name + '%'}
        AND pr.active = true
        AND p.active  = true
      ORDER BY pr.unit_amount ASC
      LIMIT 1
    `);
    return result.rows[0] ?? null;
  }

  async getSubscriptionByUser(userId: number) {
    const user = await this.getUserById(userId);
    if (!user?.stripeSubscriptionId) return null;
    const result = await db.execute(sql`
      SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}
    `);
    return result.rows[0] ?? null;
  }

  async getSubscriptionById(subscriptionId: string) {
    const result = await db.execute(sql`
      SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}
    `);
    return result.rows[0] ?? null;
  }
}

export const stripeStorage = new StripeStorage();
