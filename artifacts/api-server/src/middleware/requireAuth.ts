import type { Request, Response, NextFunction } from "express";
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session?.userId) {
    res.status(401).json({
      error: "unauthenticated",
      message: "Você precisa estar logado.",
    });
    return;
  }
  next();
}

export function getUserId(req: Request): number {
  const uid = req.session?.userId;
  if (!uid) {
    const err: any = new Error("Unauthenticated");
    err.status = 401;
    throw err;
  }
  return uid;
}

export function getOptionalUserId(req: Request): number | null {
  return req.session?.userId ?? null;
}
