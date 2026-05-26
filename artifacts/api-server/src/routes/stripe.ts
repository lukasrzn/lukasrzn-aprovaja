import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { stripeStorage } from "../stripeStorage";
import { stripeService } from "../stripeService";
import { logger } from "../lib/logger";
import { requireAuth, getUserId } from "../middleware/requireAuth";

const router: IRouter = Router();

// GET /stripe/plans — PUBLIC: available products with prices from Stripe DB
router.get("/stripe/plans", async (_req, res) => {
  const rows = await stripeStorage.listProductsWithPrices();

  const productsMap = new Map<string, any>();
  for (const row of rows) {
    if (!productsMap.has(row.product_id as string)) {
      productsMap.set(row.product_id as string, {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        active: row.product_active,
        prices: [],
      });
    }
    if (row.price_id) {
      productsMap.get(row.product_id as string).prices.push({
        id: row.price_id,
        unit_amount: row.unit_amount,
        currency: row.currency,
        recurring: row.recurring,
      });
    }
  }

  res.json({ data: Array.from(productsMap.values()) });
});

// GET /stripe/subscription — current user subscription status (incl. lifetime)
router.get("/stripe/subscription", requireAuth, async (req, res) => {
  const userId = getUserId(req);
  const user = await stripeStorage.getUserById(userId);

  if (user?.lifetimeAccess) {
    res.json({
      subscription: {
        id: "lifetime",
        status: "active",
        current_period_end: null,
        cancel_at_period_end: false,
        lifetime: true,
        plan: user.lifetimePlan ?? "premium",
        granted_at: user.lifetimeGrantedAt?.toISOString() ?? null,
      },
    });
    return;
  }
  const subscription = await stripeStorage.getSubscriptionByUser(userId);
  res.json({ subscription: subscription ?? null });
});

// POST /stripe/verify-session — confirm completed checkout, grant lifetime/link subscription
router.post(
  "/stripe/verify-session",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body as { sessionId?: string };
      if (!sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }
      const result = await stripeService.verifyAndGrantAccess(sessionId);
      res.json(result);
    } catch (err) {
      logger.error({ err }, "Failed to verify checkout session");
      next(err);
    }
  },
);

function getBaseUrl(req: Request): string {
  const publicDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (publicDomain) return `https://${publicDomain}`;
  const proto = req.get("x-forwarded-proto") === "https" ? "https" : req.protocol;
  return `${proto}://${req.get("host")}`;
}

// POST /stripe/checkout — create Stripe Checkout session (must be authenticated)
router.post(
  "/stripe/checkout",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const { planSlug } = req.body as { planSlug?: string };

      if (!planSlug || !["pro", "premium"].includes(planSlug)) {
        res.status(400).json({ error: 'planSlug must be "pro" or "premium"' });
        return;
      }

      const baseUrl = getBaseUrl(req);
      const cancelPath = (req.body as any)?.cancelPath ?? "/planos";
      const successUrl = `${baseUrl}/sucesso?plano=ativo&plan=${planSlug}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}${cancelPath}?plano=cancelado`;

      const session = await stripeService.createCheckoutSession(
        userId,
        planSlug as "pro" | "premium",
        successUrl,
        cancelUrl,
      );

      if (!session.url) {
        logger.error({ sessionId: session.id }, "Stripe session created but url is null");
        res.status(502).json({ error: "Checkout URL indisponível. Tente novamente." });
        return;
      }

      res.json({ url: session.url });
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe checkout session");
      next(err);
    }
  },
);

// POST /stripe/portal — create Stripe Billing Portal session
router.post(
  "/stripe/portal",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const baseUrl = getBaseUrl(req);
      const returnUrl = (req.body as any)?.returnUrl ?? `${baseUrl}/dashboard`;

      const session = await stripeService.createPortalSession(userId, returnUrl);
      res.json({ url: session.url });
    } catch (err) {
      logger.error({ err }, "Failed to create Stripe portal session");
      next(err);
    }
  },
);

export default router;
