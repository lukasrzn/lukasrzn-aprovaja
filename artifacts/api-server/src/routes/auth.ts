import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, gamificationTable, resetPasswordTokensTable } from "@workspace/db";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";
import { requireAuth, getUserId } from "../middleware/requireAuth";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const BCRYPT_ROUNDS = 12;

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function getBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domains ? `https://${domains}` : "http://localhost:80";
}

function getResetUrl(rawToken: string): string {
  return `${getBaseUrl()}/recuperar-senha/redefinir?token=${rawToken}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendResetEmail(toEmail: string, resetUrl: string): Promise<void> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    body: JSON.stringify({
      from: "AprovaJá <noreply@aprovaja.api.br>",
      to: [toEmail],
      subject: "Recuperação de Senha — AprovaJá",
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Recuperação de Senha</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#13131c;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
        <tr><td style="padding:48px 40px 32px;text-align:center;">
          <h1 style="margin:0 0 16px;color:#fff;font-size:28px;">Recupere seu acesso</h1>
          <p style="color:#a0a0b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
            Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova:
          </p>
          <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);border-radius:50px;">
            <tr><td style="padding:0;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
                Redefinir minha senha
              </a>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:32px 0 0;">
            Este link expira em 30 minutos. Se você não solicitou a recuperação, ignore este email.
          </p>
          <p style="color:#6b7280;font-size:11px;margin:16px 0 0;word-break:break-all;">
            Link direto: <a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#0f0f17;border-top:1px solid #2a2a3a;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0;">AprovaJá — Sua jornada até a aprovação</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim(),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /auth/register — create a new user account with password
// Body: { name, email, password, goal? }
router.post("/auth/register", async (req, res): Promise<void> => {
  try {
    const { name, email, password, goal } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      goal?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: "Email inválido." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "A senha precisa de pelo menos 6 caracteres." });
      return;
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (existing) {
      res.status(409).json({ error: "Este email já está cadastrado. Faça login." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        goal: goal?.trim() || "ENEM 2026",
      })
      .returning();

    // Bootstrap gamification row for the new user
    await db.insert(gamificationTable).values({ userId: user.id });

    // Log them in immediately
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    logger.info({ userId: user.id, email: user.email }, "User registered");

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error({ err }, "register error");
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

// POST /auth/login — authenticate with email + password
router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email e senha são obrigatórios." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    // Generic error message — avoid leaking which field was wrong
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Email ou senha incorretos." });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Email ou senha incorretos." });
      return;
    }

    // Regenerate session ID on login to prevent session fixation
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    logger.info({ userId: user.id, email: user.email }, "User logged in");

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error({ err }, "login error");
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// POST /auth/logout — destroy the session
router.post("/auth/logout", async (req, res): Promise<void> => {
  if (!req.session) {
    res.json({ ok: true });
    return;
  }
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, "logout error");
      res.status(500).json({ error: "Erro ao fazer logout." });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /auth/session — returns current session info (public, returns authenticated:false if not logged in)
router.get("/auth/session", async (req, res, next): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.json({ authenticated: false, role: "user", isAdmin: false });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      // Session points to a deleted user — clear it
      req.session.destroy(() => {});
      res.json({ authenticated: false, role: "user", isAdmin: false });
      return;
    }

    res.json({
      authenticated: true,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
    });
  } catch (err) {
    logger.error({ err }, "auth/session error");
    next(err);
  }
});

// POST /auth/forgot-password
// Generates a secure reset token, stores it in DB, and sends a real email.
// Always responds 200 to prevent email enumeration.
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email é obrigatório." });
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (user) {
      // Invalidate previous tokens for this user
      await db
        .delete(resetPasswordTokensTable)
        .where(eq(resetPasswordTokensTable.userId, user.id));

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

      await db.insert(resetPasswordTokensTable).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = getResetUrl(rawToken);

      try {
        await sendResetEmail(user.email, resetUrl);
        logger.info({ userId: user.id, email: user.email }, "Password reset email sent");
      } catch (emailErr) {
        logger.error({ err: emailErr, email: user.email }, "Failed to send reset email");
        // Still respond 200 — don't leak existence
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "forgot-password error");
    res.json({ ok: true });
  }
});

// GET /auth/reset-password/validate?token=xxx
router.get("/auth/reset-password/validate", async (req, res): Promise<void> => {
  try {
    const { token } = req.query as { token?: string };
    if (!token || typeof token !== "string") {
      res.status(400).json({ valid: false, error: "Token ausente." });
      return;
    }

    const tokenHash = hashToken(token);
    const [row] = await db
      .select({ id: resetPasswordTokensTable.id })
      .from(resetPasswordTokensTable)
      .where(
        and(
          eq(resetPasswordTokensTable.tokenHash, tokenHash),
          eq(resetPasswordTokensTable.used, false),
          gt(resetPasswordTokensTable.expiresAt, new Date()),
        ),
      );

    if (!row) {
      res.status(404).json({ valid: false, error: "Token inválido ou expirado." });
      return;
    }

    res.json({ valid: true });
  } catch (err) {
    logger.error({ err }, "reset-password/validate error");
    res.status(500).json({ valid: false, error: "Erro interno." });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };

    if (!token || !newPassword) {
      res.status(400).json({ error: "Token e nova senha são obrigatórios." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "A senha precisa de pelo menos 6 caracteres." });
      return;
    }

    const tokenHash = hashToken(token);
    const [row] = await db
      .select()
      .from(resetPasswordTokensTable)
      .where(
        and(
          eq(resetPasswordTokensTable.tokenHash, tokenHash),
          eq(resetPasswordTokensTable.used, false),
          gt(resetPasswordTokensTable.expiresAt, new Date()),
        ),
      );

    if (!row) {
      res.status(404).json({ error: "Token inválido ou expirado." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ passwordHash })
        .where(eq(usersTable.id, row.userId));

      await tx
        .update(resetPasswordTokensTable)
        .set({ used: true })
        .where(eq(resetPasswordTokensTable.id, row.id));
    });

    // Auto-login the user after successful reset
    req.session.userId = row.userId;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    logger.info({ userId: row.userId }, "Password reset successful");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "reset-password error");
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

// GET /auth/me — return current user details (requires auth)
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    goal: user.goal,
  });
});

export default router;
