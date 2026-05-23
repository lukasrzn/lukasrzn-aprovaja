import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { stripeStorage } from "../stripeStorage";
import { stripeService } from "../stripeService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /stripe/plans — available products with prices from Stripe DB
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

// GET /stripe/subscription — current user subscription status
router.get("/stripe/subscription", async (_req, res) => {
  const subscription = await stripeStorage.getSubscriptionByUser(1);
  res.json({ subscription: subscription ?? null });
});

// Resolve the public HTTPS base URL for success/cancel/return URLs.
// Must be HTTPS — Stripe rejects http:// return URLs in live mode.
function getBaseUrl(req: Request): string {
  const publicDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (publicDomain) return `https://${publicDomain}`;
  const proto =
    req.get("x-forwarded-proto") === "https" ? "https" : req.protocol;
  return `${proto}://${req.get("host")}`;
}

// POST /stripe/checkout — create Stripe Checkout session
// Body: { planSlug: 'pro' | 'premium', cancelPath?: string }
router.post("/stripe/checkout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planSlug } = req.body as { planSlug?: string };

    if (!planSlug || !["pro", "premium"].includes(planSlug)) {
      res.status(400).json({ error: 'planSlug must be "pro" or "premium"' });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const cancelPath = (req.body as any)?.cancelPath ?? "/planos";
    const successUrl = `${baseUrl}/dashboard?plano=ativo`;
    const cancelUrl  = `${baseUrl}${cancelPath}?plano=cancelado`;

    const session = await stripeService.createCheckoutSession(
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
});

// POST /stripe/portal — create Stripe Billing Portal session
router.post("/stripe/portal", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseUrl = getBaseUrl(req);
    const returnUrl = (req.body as any)?.returnUrl ?? `${baseUrl}/dashboard`;

    const session = await stripeService.createPortalSession(returnUrl);
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create Stripe portal session");
    next(err);
  }
});

export default router;
