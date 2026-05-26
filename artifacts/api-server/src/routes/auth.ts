import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  gamificationTable,
  medalsTable,
  resetPasswordTokensTable,
  emailVerificationTokensTable,
  flashcardDecksTable,
  flashcardsTable,
  redacoesTable,
  studyPlansTable,
  studySessionsTable,
  simuladosTable,
  simuladoResultsTable,
  examSessionsTable,
  missionsTable,
  performanceLogTable,
  conversations,
  messages,
} from "@workspace/db";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";
import { requireAuth, getUserId } from "../middleware/requireAuth";
import { getUncachableStripeClient } from "../stripeClient";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const BCRYPT_ROUNDS = 12;

const router: IRouter = Router();

// ─── Rate limiters ──────────────────────────────────────────────────────────

// 5 attempts per 15 min per IP — protects login from brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
});

// 5 accounts per hour per IP — protects from mass-registration / spam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas contas criadas deste IP. Tente novamente em 1 hora." },
});

// 3 reset requests per hour per IP — protects from email-bombing
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas solicitações. Tente novamente em 1 hora." },
});

// Independent bucket so resend-verification and forgot-password don't share quota
const resendVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas solicitações. Tente novamente em 1 hora." },
});

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

function getVerifyUrl(rawToken: string): string {
  return `${getBaseUrl()}/verificar-email?token=${rawToken}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Strong password: min 8 chars, at least one letter and one digit
function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha precisa de pelo menos 8 caracteres.";
  if (!/[A-Za-z]/.test(password)) return "A senha precisa conter pelo menos uma letra.";
  if (!/[0-9]/.test(password)) return "A senha precisa conter pelo menos um número.";
  return null;
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

async function sendVerificationEmail(toEmail: string, name: string, verifyUrl: string): Promise<void> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    body: JSON.stringify({
      from: "AprovaJá <noreply@aprovaja.api.br>",
      to: [toEmail],
      subject: "Confirme seu email — AprovaJá",
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Confirme seu email</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#13131c;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
        <tr><td style="padding:48px 40px 32px;text-align:center;">
          <h1 style="margin:0 0 16px;color:#fff;font-size:28px;">Bem-vindo, ${name.split(" ")[0]}!</h1>
          <p style="color:#a0a0b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
            Para garantir a segurança da sua conta, confirme que este email é realmente seu clicando no botão abaixo:
          </p>
          <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;background:linear-gradient(135deg,#06b6d4 0%,#8b5cf6 100%);border-radius:50px;">
            <tr><td style="padding:0;">
              <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
                Confirmar meu email
              </a>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:32px 0 0;">
            Este link expira em 24 horas. Se você não criou a conta, ignore este email.
          </p>
          <p style="color:#6b7280;font-size:11px;margin:16px 0 0;word-break:break-all;">
            Link direto: <a href="${verifyUrl}" style="color:#06b6d4;">${verifyUrl}</a>
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

async function createAndSendVerification(userId: number, email: string, name: string): Promise<void> {
  // Invalidate previous tokens for this user
  await db
    .delete(emailVerificationTokensTable)
    .where(eq(emailVerificationTokensTable.userId, userId));

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);

  await db.insert(emailVerificationTokensTable).values({
    userId,
    tokenHash,
    expiresAt,
  });

  const verifyUrl = getVerifyUrl(rawToken);
  await sendVerificationEmail(email, name, verifyUrl);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /auth/register — create a new user account with password
router.post("/auth/register", registerLimiter, async (req, res): Promise<void> => {
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
    const pwErr = validatePassword(password);
    if (pwErr) {
      res.status(400).json({ error: pwErr });
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

    // Send verification email (non-blocking — failure shouldn't kill signup)
    try {
      await createAndSendVerification(user.id, user.email, user.name);
      logger.info({ userId: user.id }, "Verification email sent on register");
    } catch (verifyErr) {
      logger.error({ err: verifyErr, userId: user.id }, "Failed to send verification email on register");
    }

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
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    logger.error({ err }, "register error");
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

// POST /auth/login — authenticate with email + password
router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
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
      emailVerified: user.emailVerified,
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

// GET /auth/session — returns current session info
router.get("/auth/session", async (req, res, next): Promise<void> => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.json({ authenticated: false, role: "user", isAdmin: false });
      return;
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        email: usersTable.email,
        name: usersTable.name,
        emailVerified: usersTable.emailVerified,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
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
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    logger.error({ err }, "auth/session error");
    next(err);
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res): Promise<void> => {
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
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      res.status(400).json({ error: pwErr });
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

// POST /auth/verify-email — confirm the email with the token from the email link
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token ausente." });
      return;
    }

    const tokenHash = hashToken(token);
    const [row] = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.tokenHash, tokenHash),
          eq(emailVerificationTokensTable.used, false),
          gt(emailVerificationTokensTable.expiresAt, new Date()),
        ),
      );

    if (!row) {
      res.status(404).json({ error: "Token inválido ou expirado." });
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ emailVerified: true, emailVerifiedAt: new Date() })
        .where(eq(usersTable.id, row.userId));

      await tx
        .update(emailVerificationTokensTable)
        .set({ used: true })
        .where(eq(emailVerificationTokensTable.id, row.id));
    });

    logger.info({ userId: row.userId }, "Email verified");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "verify-email error");
    res.status(500).json({ error: "Erro ao verificar email." });
  }
});

// POST /auth/resend-verification — resend the verification email (requires auth)
router.post("/auth/resend-verification", requireAuth, resendVerifyLimiter, async (req, res): Promise<void> => {
  try {
    const userId = getUserId(req);
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        emailVerified: usersTable.emailVerified,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }
    if (user.emailVerified) {
      res.json({ ok: true, alreadyVerified: true });
      return;
    }

    await createAndSendVerification(user.id, user.email, user.name);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "resend-verification error");
    res.status(500).json({ error: "Erro ao reenviar email." });
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
    emailVerified: user.emailVerified,
  });
});

// DELETE /auth/me — permanently delete the user's account and all data (LGPD)
router.delete("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        stripeSubscriptionId: usersTable.stripeSubscriptionId,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    // Protect the seed admin account from accidental self-deletion
    if (user.role === "admin") {
      res.status(403).json({ error: "Conta de administrador não pode ser excluída pela interface." });
      return;
    }

    // Cancel active Stripe subscription FIRST. If this fails we MUST abort —
    // otherwise the user gets deleted locally but keeps being billed.
    // Stripe treats "already cancelled / not found" as 404; we tolerate those.
    if (user.stripeSubscriptionId) {
      try {
        const stripe = await getUncachableStripeClient();
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        logger.info({ userId, subId: user.stripeSubscriptionId }, "Stripe subscription cancelled on account deletion");
      } catch (stripeErr: any) {
        const code = stripeErr?.statusCode ?? stripeErr?.raw?.statusCode;
        const alreadyGone = code === 404 || stripeErr?.code === "resource_missing";
        if (!alreadyGone) {
          logger.error({ err: stripeErr, userId }, "Stripe cancel failed — ABORTING account deletion");
          res.status(502).json({
            error: "Não foi possível cancelar sua assinatura no Stripe agora. Sua conta não foi excluída para evitar cobranças futuras. Tente novamente em alguns minutos ou contate o suporte: cttvertice@gmail.com",
          });
          return;
        }
        logger.warn({ userId, subId: user.stripeSubscriptionId }, "Stripe subscription already gone — continuing deletion");
      }
    }

    // Delete child rows in a transaction (most FKs are not ON DELETE CASCADE).
    // Order matters: children before parents.
    await db.transaction(async (tx) => {
      // Flashcards belong to decks
      const userDecks = await tx
        .select({ id: flashcardDecksTable.id })
        .from(flashcardDecksTable)
        .where(eq(flashcardDecksTable.userId, userId));
      for (const d of userDecks) {
        await tx.delete(flashcardsTable).where(eq(flashcardsTable.deckId, d.id));
      }
      await tx.delete(flashcardDecksTable).where(eq(flashcardDecksTable.userId, userId));

      // Study plan children
      await tx.delete(studySessionsTable).where(eq(studySessionsTable.userId, userId));
      await tx.delete(studyPlansTable).where(eq(studyPlansTable.userId, userId));

      // Simulado children
      await tx.delete(simuladoResultsTable).where(eq(simuladoResultsTable.userId, userId));
      await tx.delete(examSessionsTable).where(eq(examSessionsTable.userId, userId));
      await tx.delete(simuladosTable).where(eq(simuladosTable.userId, userId));

      // Conversations CASCADE delete messages already, but be explicit
      const userConvs = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.userId, userId));
      for (const c of userConvs) {
        await tx.delete(messages).where(eq(messages.conversationId, c.id));
      }
      await tx.delete(conversations).where(eq(conversations.userId, userId));

      // Misc per-user data
      await tx.delete(redacoesTable).where(eq(redacoesTable.userId, userId));
      await tx.delete(missionsTable).where(eq(missionsTable.userId, userId));
      await tx.delete(performanceLogTable).where(eq(performanceLogTable.userId, userId));
      await tx.delete(medalsTable).where(eq(medalsTable.userId, userId));
      await tx.delete(gamificationTable).where(eq(gamificationTable.userId, userId));

      // Token tables (CASCADE will also handle, but be explicit & safe)
      await tx.delete(resetPasswordTokensTable).where(eq(resetPasswordTokensTable.userId, userId));
      await tx.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, userId));

      // Finally, the user row
      await tx.delete(usersTable).where(eq(usersTable.id, userId));
    });

    // Also drop any other server-side sessions for this user (defence in depth)
    try {
      await pool.query(`DELETE FROM user_sessions WHERE sess::jsonb -> 'userId' = $1::jsonb`, [JSON.stringify(userId)]);
    } catch (sErr) {
      logger.error({ err: sErr, userId }, "Failed to purge user_sessions rows (continuing)");
    }

    // Destroy the current session and clear cookie
    await new Promise<void>((resolve) => {
      req.session.destroy(() => resolve());
    });
    res.clearCookie("connect.sid");

    logger.info({ userId, email: user.email }, "Account deleted (LGPD)");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, userId }, "delete account error");
    res.status(500).json({ error: "Erro ao excluir conta. Tente novamente." });
  }
});

export default router;
