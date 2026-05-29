import type Stripe from 'stripe';
import { stripeStorage } from './stripeStorage';
import { getUncachableStripeClient } from './stripeClient';
import { logger } from './lib/logger';

// Plan definitions — single source of truth for product/price config.
// Amounts in smallest currency unit (centavos).
const PLAN_CONFIG = {
  pro: {
    name: 'Pro',
    amountCentavos: 3490,
    nickname: 'Pro Mensal',
    billingType: 'subscription' as const, // recurring monthly
  },
  premium: {
    name: 'Vitalício',
    amountCentavos: 9590,
    nickname: 'Vitalício',
    billingType: 'lifetime' as const, // one-time payment
  },
} as const;

type PlanSlug = keyof typeof PLAN_CONFIG;

// In-memory cache of resolved live price IDs. Populated on first checkout.
const livePriceIdCache = new Map<PlanSlug, string>();

async function resolveLivePriceId(stripe: Stripe, planSlug: PlanSlug): Promise<string> {
  const cached = livePriceIdCache.get(planSlug);
  if (cached) return cached;

  const cfg = PLAN_CONFIG[planSlug];

  const productsResp = await stripe.products.list({ active: true, limit: 100 });
  let product = productsResp.data.find(
    (p) => p.name.toLowerCase() === cfg.name.toLowerCase()
  );

  if (!product) {
    logger.info({ plan: planSlug }, `Stripe product "${cfg.name}" not found — creating it`);
    product = await stripe.products.create({
      name: cfg.name,
      metadata: { plan: planSlug },
    });
  }

  const pricesResp = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 50,
  });

  const existingPrice = pricesResp.data.find((p) => {
    if (p.currency !== 'brl') return false;
    if (cfg.billingType === 'subscription') {
      return p.recurring?.interval === 'month';
    }
    return p.recurring === null && p.unit_amount === cfg.amountCentavos;
  });

  let priceId: string;
  if (existingPrice) {
    priceId = existingPrice.id;
    logger.info({ plan: planSlug, priceId }, 'Resolved live Stripe price from API');
  } else {
    logger.info(
      { plan: planSlug, billingType: cfg.billingType, amount: cfg.amountCentavos },
      `No matching active BRL price found — creating one`,
    );
    const newPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: cfg.amountCentavos,
      currency: 'brl',
      ...(cfg.billingType === 'subscription' ? { recurring: { interval: 'month' as const } } : {}),
      nickname: cfg.nickname,
      metadata: { plan: planSlug, billing_type: cfg.billingType },
    });
    priceId = newPrice.id;
    logger.info({ plan: planSlug, priceId }, 'Created new Stripe price');
  }

  livePriceIdCache.set(planSlug, priceId);
  return priceId;
}

export class StripeService {
  async getOrCreateCustomer(userId: number, email: string): Promise<string> {
    const user = await stripeStorage.getUserById(userId);
    if (user?.stripeCustomerId) return user.stripeCustomerId;

    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });

    await stripeStorage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  private async forceCreateCustomer(userId: number, email: string): Promise<string> {
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });
    await stripeStorage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
    logger.info({ customerId: customer.id, userId }, 'Created fresh Stripe customer (replaced stale ID)');
    return customer.id;
  }

  async createCheckoutSession(
    userId: number,
    planSlug: PlanSlug,
    successUrl: string,
    cancelUrl: string,
  ) {
    const stripe = await getUncachableStripeClient();
    const user = await stripeStorage.getUserById(userId);

    if (!user) throw new Error('User not found');

    const cfg = PLAN_CONFIG[planSlug];
    const priceId = await resolveLivePriceId(stripe, planSlug);

    let customerId = await this.getOrCreateCustomer(userId, user.email);

    const buildParams = (cid: string): Stripe.Checkout.SessionCreateParams => {
      // Omitting `payment_method_types` lets Stripe Checkout show the methods
      // enabled in the Dashboard, automatically filtered by mode:
      // - subscription (Pro): only recurring-capable methods (card) are offered.
      // - payment (Vitalício): card + Pix + Boleto (if enabled in Dashboard).
      // Pix/Boleto cannot be used for recurring subscriptions — that's a Stripe rule.
      const base: Stripe.Checkout.SessionCreateParams = {
        customer: cid,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: cfg.billingType === 'subscription' ? 'subscription' : 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'pt-BR',
        client_reference_id: String(userId),
        metadata: { userId: String(userId), plan: planSlug },
      };
      if (cfg.billingType === 'subscription') {
        base.subscription_data = {
          metadata: { userId: String(userId), plan: planSlug },
        };
      } else {
        // Boleto requires the payer's full billing address + CPF, which Stripe
        // Checkout collects automatically once Boleto is an available method.
        base.billing_address_collection = 'required';
        base.payment_intent_data = {
          metadata: { userId: String(userId), plan: planSlug, billing_type: 'lifetime' },
        };
      }
      return base;
    };

    try {
      return await stripe.checkout.sessions.create(buildParams(customerId));
    } catch (err: any) {
      if (isStaleCustomerError(err)) {
        logger.warn(
          { staleCustomerId: customerId },
          'Stale Stripe customer ID — creating fresh customer and retrying',
        );
        const freshId = await this.forceCreateCustomer(userId, user.email);
        return await stripe.checkout.sessions.create(buildParams(freshId));
      }
      throw err;
    }
  }

  /**
   * Verifies a completed checkout session and:
   * - For lifetime plans: grants lifetime access to the user in metadata
   * - For subscription plans: stores stripeSubscriptionId on the user
   * Idempotent — safe to call multiple times.
   */
  async verifyAndGrantAccess(sessionId: string): Promise<{
    granted: boolean;
    plan: string | null;
    alreadyGranted: boolean;
    type: 'lifetime' | 'subscription' | null;
  }> {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return { granted: false, plan: null, alreadyGranted: false, type: null };
    }

    const plan = session.metadata?.plan ?? null;
    const userIdStr = session.metadata?.userId ?? session.client_reference_id;
    const userId = userIdStr ? Number(userIdStr) : null;

    if (!plan || !userId || Number.isNaN(userId)) {
      return { granted: false, plan, alreadyGranted: false, type: null };
    }

    const cfg = plan in PLAN_CONFIG ? PLAN_CONFIG[plan as PlanSlug] : null;
    if (!cfg) {
      return { granted: false, plan, alreadyGranted: false, type: null };
    }

    if (cfg.billingType === 'lifetime') {
      const existing = await stripeStorage.getUserById(userId);
      if (existing?.lifetimeAccess) {
        return { granted: true, plan, alreadyGranted: true, type: 'lifetime' };
      }
      await stripeStorage.grantLifetimeAccess(userId, plan);
      logger.info({ userId, plan, sessionId }, 'Granted lifetime access');
      return { granted: true, plan, alreadyGranted: false, type: 'lifetime' };
    }

    // Subscription plan — link the subscription to the user
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
    if (!subscriptionId) {
      return { granted: false, plan, alreadyGranted: false, type: 'subscription' };
    }

    const existing = await stripeStorage.getUserById(userId);
    if (existing?.stripeSubscriptionId === subscriptionId) {
      return { granted: true, plan, alreadyGranted: true, type: 'subscription' };
    }

    await stripeStorage.updateUserStripeInfo(userId, { stripeSubscriptionId: subscriptionId });
    logger.info({ userId, plan, sessionId, subscriptionId }, 'Linked subscription to user');
    return { granted: true, plan, alreadyGranted: false, type: 'subscription' };
  }

  async createPortalSession(userId: number, returnUrl: string) {
    const user = await stripeStorage.getUserById(userId);
    if (!user?.stripeCustomerId) throw new Error('No Stripe customer found for this user');

    const stripe = await getUncachableStripeClient();
    try {
      return await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });
    } catch (err: any) {
      if (isStaleCustomerError(err)) {
        logger.warn(
          { staleCustomerId: user.stripeCustomerId },
          'Stale Stripe customer ID on portal — cannot recover without new checkout',
        );
        throw new Error('Sessão de cliente expirada. Por favor, inicie uma nova assinatura.');
      }
      throw err;
    }
  }
}

function isStaleCustomerError(err: any): boolean {
  return (
    err?.type === 'StripeInvalidRequestError' &&
    err?.code === 'resource_missing' &&
    err?.param === 'customer'
  );
}

export const stripeService = new StripeService();
