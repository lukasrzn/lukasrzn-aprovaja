import { Router, type IRouter } from "express";
import { stripeStorage } from "../stripeStorage";
import { stripeService } from "../stripeService";

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

// POST /stripe/checkout — create Stripe Checkout session
// Body: { planSlug: 'pro' | 'premium' }
router.post("/stripe/checkout", async (req, res) => {
  const { planSlug } = req.body as { planSlug?: string };

  if (!planSlug || !['pro', 'premium'].includes(planSlug)) {
    res.status(400).json({ error: 'planSlug must be "pro" or "premium"' });
    return;
  }

  // Use REPLIT_DOMAINS for the correct public HTTPS URL; fall back to host header
  const publicDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = publicDomain
    ? `https://${publicDomain}`
    : `${req.protocol === "http" && req.get("x-forwarded-proto") === "https" ? "https" : req.protocol}://${req.get("host")}`;
  const cancelPath = (req.body as any)?.cancelPath ?? "/planos";
  const successUrl = `${baseUrl}/dashboard?plano=ativo`;
  const cancelUrl  = `${baseUrl}${cancelPath}?plano=cancelado`;

  const session = await stripeService.createCheckoutSession(
    planSlug as 'pro' | 'premium',
    successUrl,
    cancelUrl,
  );

  res.json({ url: session.url });
});

// POST /stripe/portal — create Stripe Billing Portal session
router.post("/stripe/portal", async (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const returnUrl = req.body?.returnUrl ?? `${host}/dashboard`;

  const session = await stripeService.createPortalSession(returnUrl);
  res.json({ url: session.url });
});

export default router;
