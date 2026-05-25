import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { stripeStorage } from "../stripeStorage";

const DEFAULT_USER_ID = 1;

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Admin users + lifetime access bypass the subscription gate
    const [user] = await db
      .select({ role: usersTable.role, lifetimeAccess: usersTable.lifetimeAccess })
      .from(usersTable)
      .where(eq(usersTable.id, DEFAULT_USER_ID));

    if (user?.role === "admin" || user?.lifetimeAccess) {
      next();
      return;
    }

    const subscription = await stripeStorage.getSubscriptionByUser(DEFAULT_USER_ID);
    if (!subscription || subscription.status !== "active") {
      res.status(403).json({
        error: "subscription_required",
        message: "Você precisa de um plano ativo para acessar este recurso.",
        redirectTo: "/planos",
      });
      return;
    }
    next();
  } catch (err) {
    req.log.error({ err }, "requireSubscription middleware error");
    res.status(503).json({ error: "service_unavailable", message: "Não foi possível verificar sua assinatura." });
  }
}
