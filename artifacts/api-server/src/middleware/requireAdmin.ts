import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Você precisa estar logado." });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user || user.role !== "admin") {
      logger.warn({ userId, email: user?.email }, "Admin access denied");
      res.status(403).json({ error: "Acesso restrito a administradores." });
      return;
    }

    next();
  } catch (err) {
    logger.error({ err }, "requireAdmin middleware error");
    next(err);
  }
}
