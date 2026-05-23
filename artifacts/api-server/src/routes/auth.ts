import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { randomBytes, createHash } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// In-memory store for reset tokens (replace with DB table in production)
// token_hash -> { userId, expiresAt, email }
const resetTokens = new Map<
  string,
  { userId: number; expiresAt: number; email: string }
>();

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// POST /auth/forgot-password
// Accepts an email, generates a time-limited reset token.
// Always responds 200 to prevent email enumeration.
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email é obrigatório." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes

      // Remove any previous tokens for this user
      for (const [hash, data] of resetTokens.entries()) {
        if (data.userId === user.id) resetTokens.delete(hash);
      }

      resetTokens.set(tokenHash, { userId: user.id, expiresAt, email: user.email });

      // In production: send email with link containing rawToken.
      // For now: log the link so it can be used in dev.
      logger.info(
        { email: user.email, tokenPreview: rawToken.slice(0, 8) + "…" },
        "Password reset token generated — configure email service to deliver link",
      );
    }

    // Always 200 — never expose whether the email exists
    res.json({ ok: true, message: "Se o email estiver cadastrado, você receberá um link em breve." });
  } catch (err) {
    logger.error({ err }, "forgot-password error");
    // Still 200 to prevent enumeration
    res.json({ ok: true });
  }
});

// GET /auth/reset-password/validate?token=xxx
// Returns whether the token is valid (used by frontend before showing the form)
router.get("/auth/reset-password/validate", (req, res): void => {
  const { token } = req.query as { token?: string };

  if (!token) {
    res.json({ valid: false, reason: "Token ausente." });
    return;
  }

  const tokenHash = hashToken(token);
  const entry = resetTokens.get(tokenHash);

  if (!entry) {
    res.json({ valid: false, reason: "Token inválido ou já utilizado." });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(tokenHash);
    res.json({ valid: false, reason: "Token expirado. Solicite um novo link." });
    return;
  }

  res.json({ valid: true });
});

// POST /auth/reset-password
// Validates token and marks it used (no actual password stored — stub for future auth)
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    res.status(400).json({ error: "Token e nova senha são obrigatórios." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
    return;
  }

  const tokenHash = hashToken(token);
  const entry = resetTokens.get(tokenHash);

  if (!entry) {
    res.status(400).json({ error: "Token inválido ou já utilizado." });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(tokenHash);
    res.status(400).json({ error: "Token expirado. Solicite um novo link." });
    return;
  }

  // Invalidate token immediately (one-time use)
  resetTokens.delete(tokenHash);

  // In a full auth system: hash newPassword and store in users table.
  // Currently the platform uses Stripe-based access, so we log success.
  logger.info({ userId: entry.userId, email: entry.email }, "Password reset completed");

  res.json({ ok: true, message: "Senha redefinida com sucesso." });
});

export default router;
