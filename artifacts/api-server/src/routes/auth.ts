import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, resetPasswordTokensTable } from "@workspace/db";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";

const DEFAULT_USER_ID = 1;
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function getResetUrl(rawToken: string): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0];
  const base = domains ? `https://${domains}` : "http://localhost:80";
  return `${base}/recuperar-senha/redefinir?token=${rawToken}`;
}

async function sendResetEmail(toEmail: string, resetUrl: string): Promise<void> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    body: JSON.stringify({
      from: "AprovaJá <noreply@aprovaja.com.br>",
      to: [toEmail],
      subject: "Recuperação de Senha — AprovaJá",
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#7c3aed;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-size:20px;line-height:36px;">⚡</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:20px;font-weight:700;background:linear-gradient(90deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#7c3aed;">AprovaJá</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f1f5f9;">Recuperação de senha</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta AprovaJá. Clique no botão abaixo para criar uma nova senha.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="border-radius:50px;background:linear-gradient(135deg,#7c3aed,#06b6d4);">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
                    Redefinir minha senha
                  </a>
                </td>
              </tr>
            </table>
            <!-- Link fallback -->
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="margin:0 0 32px;font-size:12px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a>
            </p>
            <!-- Warning box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#fbbf24;">
                    ⏰ Este link expira em <strong>30 minutos</strong>. Após isso, você precisará solicitar um novo link.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              Se você não solicitou esta recuperação de senha, ignore este email com segurança — sua senha não será alterada.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
              Precisa de ajuda? Entre em contato: 
              <a href="mailto:cttvertice@gmail.com" style="color:#7c3aed;">cttvertice@gmail.com</a>
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#334155;text-align:center;">
              © ${new Date().getFullYear()} AprovaJá Educacional. Todos os direitos reservados.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /auth/session — public, no subscription required
router.get("/auth/session", async (_req, res, next): Promise<void> => {
  try {
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, DEFAULT_USER_ID));

    if (!user) {
      res.json({ authenticated: false, role: "user", isAdmin: false });
      return;
    }

    res.json({
      authenticated: true,
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

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (user) {
      // Invalidate any existing tokens for this user
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
        // Don't fail the request if email sending fails — log and continue
        logger.error({ err: emailErr, email: user.email }, "Failed to send reset email");
      }
    }

    // Always 200 — never expose whether the email exists
    res.json({ ok: true, message: "Se o email estiver cadastrado, você receberá um link em breve." });
  } catch (err) {
    logger.error({ err }, "forgot-password error");
    res.json({ ok: true });
  }
});

// GET /auth/reset-password/validate?token=xxx
router.get("/auth/reset-password/validate", async (req, res): Promise<void> => {
  const { token } = req.query as { token?: string };

  if (!token) {
    res.json({ valid: false, reason: "Token ausente." });
    return;
  }

  const tokenHash = hashToken(token);

  try {
    const [entry] = await db
      .select()
      .from(resetPasswordTokensTable)
      .where(
        and(
          eq(resetPasswordTokensTable.tokenHash, tokenHash),
          eq(resetPasswordTokensTable.used, false),
          gt(resetPasswordTokensTable.expiresAt, new Date()),
        ),
      );

    if (!entry) {
      res.json({ valid: false, reason: "Token inválido, expirado ou já utilizado." });
      return;
    }

    res.json({ valid: true });
  } catch (err) {
    logger.error({ err }, "reset-password/validate error");
    res.json({ valid: false, reason: "Erro ao validar token." });
  }
});

// POST /auth/reset-password
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

  try {
    const [entry] = await db
      .select()
      .from(resetPasswordTokensTable)
      .where(
        and(
          eq(resetPasswordTokensTable.tokenHash, tokenHash),
          eq(resetPasswordTokensTable.used, false),
          gt(resetPasswordTokensTable.expiresAt, new Date()),
        ),
      );

    if (!entry) {
      res.status(400).json({ error: "Token inválido, expirado ou já utilizado." });
      return;
    }

    // Hash and store the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ passwordHash })
        .where(eq(usersTable.id, entry.userId));

      // Mark token as used (one-time use)
      await tx
        .update(resetPasswordTokensTable)
        .set({ used: true })
        .where(eq(resetPasswordTokensTable.id, entry.id));
    });

    logger.info({ userId: entry.userId }, "Password reset completed successfully");

    res.json({ ok: true, message: "Senha redefinida com sucesso." });
  } catch (err) {
    logger.error({ err }, "reset-password error");
    res.status(500).json({ error: "Erro ao redefinir senha. Tente novamente." });
  }
});

export default router;
