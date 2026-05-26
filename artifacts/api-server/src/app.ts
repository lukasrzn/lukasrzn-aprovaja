import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

// Pre-create the session table ourselves so we don't rely on
// connect-pg-simple's bundled table.sql (which esbuild can't bundle).
async function ensureSessionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user_sessions" (
      "sid"    varchar      NOT NULL COLLATE "default",
      "sess"   json         NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE);
    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
  `);
}
void ensureSessionTable().catch((err) => {
  logger.error({ err }, "Failed to ensure user_sessions table exists");
});
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Stripe webhook MUST be registered before express.json() so the raw Buffer is preserved
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        logger.error("Stripe webhook: req.body is not a Buffer — express.json() ran first");
        res.status(500).json({ error: "Webhook processing error" });
        return;
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware — must come AFTER body parsers, BEFORE routes
const PgStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required.");
}
app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }),
);

app.use("/api", router);

// Global JSON error handler — must have 4 params so Express recognises it as an error handler.
// Returns a JSON body instead of the default HTML error page so the frontend
// can always parse the error message.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status: number = typeof err.status === "number" ? err.status
    : typeof err.statusCode === "number" ? err.statusCode
    : 500;
  const message: string =
    status < 500 ? (err.message ?? "Bad request")
    : "Ocorreu um erro interno. Tente novamente em instantes.";
  res.status(status).json({ error: message });
});

export default app;
