import type Stripe from 'stripe';
import { stripeStorage } from './stripeStorage';
import { getUncachableStripeClient } from './stripeClient';
import { logger } from './lib/logger';

const DEFAULT_USER_ID = 1;

// Plan definitions — single source of truth for product/price config.
// Amounts in smallest currency unit (centavos).
const PLAN_CONFIG = {
  pro: {
    name: 'Pro',
    amountCentavos: 2990,
    nickname: 'Pro Mensal',
  },
  premium: {
    name: 'Premium',
    amountCentavos: 5990,
    nickname: 'Premium Mensal',
  },
} as const;

type PlanSlug = keyof typeof PLAN_CONFIG;

// In-memory cache of resolved live price IDs. Populated on first checkout.
// Avoids an extra API round-trip on every subsequent request within the same
// process lifetime while always referencing IDs that exist in this Stripe account.
const livePriceIdCache = new Map<PlanSlug, string>();

/**
 * Resolves the live Stripe Price ID for a plan by querying the Stripe API
 * directly (never from DB cache). Creates the product and/or price in Stripe
 * if they don't already exist. Results are cached in-memory.
 *
 * This is environment-agnostic: it works regardless of which Stripe account
 * the credentials belong to (test, production, any key rotation).
 */
async function resolveLivePriceId(stripe: Stripe, planSlug: PlanSlug): Promise<string> {
  const cached = livePriceIdCache.get(planSlug);
  if (cached) return cached;

  const cfg = PLAN_CONFIG[planSlug];

  // 1. Find or create the product by exact name match.
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

  // 2. Find or create the active monthly recurring price for this product.
  const pricesResp = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 50,
  });
  const existingPrice = pricesResp.data.find(
    (p) => p.recurring?.interval === 'month' && p.currency === 'brl'
  );

  let priceId: string;
  if (existingPrice) {
    priceId = existingPrice.id;
    logger.info({ plan: planSlug, priceId }, 'Resolved live Stripe price from API');
  } else {
    logger.info({ plan: planSlug }, `No active monthly BRL price found — creating one`);
    const newPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: cfg.amountCentavos,
      currency: 'brl',
      recurring: { interval: 'month' },
      nickname: cfg.nickname,
      metadata: { plan: planSlug },
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
    planSlug: PlanSlug,
    successUrl: string,
    cancelUrl: string,
  ) {
    const stripe = await getUncachableStripeClient();
    const user = await stripeStorage.getDefaultUser();

    if (!user) throw new Error('User not found');

    // Resolve price ID directly from the live Stripe API — never trust the DB cache.
    const priceId = await resolveLivePriceId(stripe, planSlug);

    let customerId = await this.getOrCreateCustomer(DEFAULT_USER_ID, user.email);

    const buildParams = (cid: string) => ({
      customer: cid,
      payment_method_types: ['card' as const],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription' as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'pt-BR' as const,
      subscription_data: {
        metadata: { userId: String(DEFAULT_USER_ID), plan: planSlug },
      },
    });

    try {
      return await stripe.checkout.sessions.create(buildParams(customerId));
    } catch (err: any) {
      if (isStaleCustomerError(err)) {
        logger.warn(
          { staleCustomerId: customerId },
          'Stale Stripe customer ID — creating fresh customer and retrying',
        );
        const freshId = await this.forceCreateCustomer(DEFAULT_USER_ID, user.email);
        return await stripe.checkout.sessions.create(buildParams(freshId));
      }
      throw err;
    }
  }

  async createPortalSession(returnUrl: string) {
    const user = await stripeStorage.getDefaultUser();
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
