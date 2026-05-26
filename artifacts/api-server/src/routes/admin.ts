import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin";
import { getUserId } from "../middleware/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// All routes here require admin role (which already enforces auth)
// Only gate /admin/* paths — otherwise non-admin requests would 403 here
// before falling through to other routers mounted alongside this one.
router.use("/admin", requireAdmin);

// GET /admin/stats — platform overview for admin dashboard
router.get("/admin/stats", async (req, res, next) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, getUserId(req)));

    // Subscription summary from stripe schema
    const subResult = await db.execute(sql`
      SELECT
        COUNT(*)                                          AS total_subscriptions,
        COUNT(*) FILTER (WHERE status = 'active')        AS active_subscriptions,
        COUNT(*) FILTER (WHERE status = 'trialing')      AS trialing,
        COUNT(*) FILTER (WHERE status = 'canceled')      AS canceled,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS paying_users
      FROM stripe.subscriptions
    `);

    // Revenue estimate from prices joined to subscriptions
    const revenueResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(pr.unit_amount), 0) AS monthly_revenue_centavos
      FROM stripe.subscriptions s
      JOIN stripe.prices pr ON pr.id = s.items->0->>'price'
      WHERE s.status = 'active'
    `).catch(() => ({ rows: [{ monthly_revenue_centavos: 0 }] }));

    // Content counts
    const contentResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM flashcards)     AS flashcards,
        (SELECT COUNT(*) FROM study_plans)    AS study_plans,
        (SELECT COUNT(*) FROM simulados)      AS simulados,
        (SELECT COUNT(*) FROM redacoes)       AS redacoes
    `);

    const subRow = subResult.rows[0] as any;
    const revenueRow = revenueResult.rows[0] as any;
    const contentRow = contentResult.rows[0] as any;

    res.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
      subscriptions: {
        total: Number(subRow?.total_subscriptions ?? 0),
        active: Number(subRow?.active_subscriptions ?? 0),
        trialing: Number(subRow?.trialing ?? 0),
        canceled: Number(subRow?.canceled ?? 0),
      },
      revenue: {
        monthlyEstimateCentavos: Number(revenueRow?.monthly_revenue_centavos ?? 0),
      },
      content: {
        flashcards: Number(contentRow?.flashcards ?? 0),
        studyPlans: Number(contentRow?.study_plans ?? 0),
        simulados: Number(contentRow?.simulados ?? 0),
        redacoes: Number(contentRow?.redacoes ?? 0),
      },
    });
  } catch (err) {
    logger.error({ err }, "Admin stats error");
    next(err);
  }
});

// GET /admin/user — current user details
router.get("/admin/user", async (req, res, next) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, getUserId(req)));
    res.json({ user: user ?? null });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/user — update user details (name, email, goal)
router.patch("/admin/user", async (req, res, next) => {
  try {
    const { name, email, goal, school } = req.body as {
      name?: string; email?: string; goal?: string; school?: string;
    };

    const updates: Record<string, unknown> = {};
    if (name)   updates.name   = name;
    if (email)  updates.email  = email;
    if (goal)   updates.goal   = goal;
    if (school !== undefined) updates.school = school;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nenhum campo para atualizar." });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, getUserId(req)))
      .returning();

    logger.info({ updates }, "Admin updated user record");
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
