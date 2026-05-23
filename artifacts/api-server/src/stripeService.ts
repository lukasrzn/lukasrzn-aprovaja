import { stripeStorage } from './stripeStorage';
import { getUncachableStripeClient } from './stripeClient';

const DEFAULT_USER_ID = 1;

export class StripeService {
  async getOrCreateCustomer(userId: number, email: string) {
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

    const customerId = await this.getOrCreateCustomer(DEFAULT_USER_ID, user.email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: price.id as string, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'pt-BR',
      subscription_data: {
        metadata: { userId: String(DEFAULT_USER_ID), plan: planSlug },
      },
    });

    return session;
  }

  async createPortalSession(returnUrl: string) {
    const user = await stripeStorage.getDefaultUser();
    if (!user?.stripeCustomerId) throw new Error('No Stripe customer found for this user');

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });
    return session;
  }
}

export const stripeService = new StripeService();
