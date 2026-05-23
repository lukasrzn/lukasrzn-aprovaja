import { stripeStorage } from './stripeStorage';
import { getUncachableStripeClient } from './stripeClient';
import { logger } from './lib/logger';

const DEFAULT_USER_ID = 1;

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

  // Creates a brand-new Stripe customer, overwrites any stale ID in the DB.
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

  async createCheckoutSession(planSlug: 'pro' | 'premium', successUrl: string, cancelUrl: string) {
    const stripe = await getUncachableStripeClient();
    const user = await stripeStorage.getDefaultUser();

    if (!user) throw new Error('User not found');

    const price = await stripeStorage.getPriceByPlanSlug(planSlug);
    if (!price) {
      throw new Error(
        `Price not found for plan "${planSlug}". Run the seed-products script first.`
      );
    }

    let customerId = await this.getOrCreateCustomer(DEFAULT_USER_ID, user.email);

    const buildSessionParams = (cid: string) => ({
      customer: cid,
      payment_method_types: ['card' as const],
      line_items: [{ price: price.id as string, quantity: 1 }],
      mode: 'subscription' as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'pt-BR' as const,
      subscription_data: {
        metadata: { userId: String(DEFAULT_USER_ID), plan: planSlug },
      },
    });

    try {
      return await stripe.checkout.sessions.create(buildSessionParams(customerId));
    } catch (err: any) {
      // Stale customer ID: exists in DB but not in this Stripe account/environment.
      // Common when dev data leaks into prod, or customer was deleted from Stripe dashboard.
      if (isStaleCustomerError(err)) {
        logger.warn(
          { staleCustomerId: customerId },
          'Stale Stripe customer ID detected — creating fresh customer and retrying checkout'
        );
        const freshId = await this.forceCreateCustomer(DEFAULT_USER_ID, user.email);
        return await stripe.checkout.sessions.create(buildSessionParams(freshId));
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
          'Stale Stripe customer ID on portal request — cannot recover without a new checkout'
        );
        throw new Error(
          'Sessão de cliente expirada. Por favor, inicie uma nova assinatura.'
        );
      }
      throw err;
    }
  }
}

// Stripe returns code:'resource_missing' + param:'customer' when the customer ID
// does not exist in the target Stripe account (different env, deleted, etc.)
function isStaleCustomerError(err: any): boolean {
  return (
    err?.type === 'StripeInvalidRequestError' &&
    err?.code === 'resource_missing' &&
    err?.param === 'customer'
  );
}

export const stripeService = new StripeService();
