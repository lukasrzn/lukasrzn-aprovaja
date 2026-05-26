import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { stripeStorage } from "../stripeStorage";

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        error: "unauthenticated",
        message: "Você precisa estar logado.",
      });
      return;
    }

    // Admin users + lifetime access bypass the subscription gate
    const [user] = await db
      .select({ role: usersTable.role, lifetimeAccess: usersTable.lifetimeAccess })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (user?.role === "admin" || user?.lifetimeAccess) {
      next();
      return;
    }

    const subscription = await stripeStorage.getSubscriptionByUser(userId);
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
    res.status(503).json({
      error: "service_unavailable",
      message: "Não foi possível verificar sua assinatura.",
    });
  }
}
