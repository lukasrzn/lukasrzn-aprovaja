import { getStripeSync } from './stripeClient';
import { stripeService } from './stripeService';
import { logger } from './lib/logger';

// Checkout events that mean money has actually been captured and access can be
// granted. `completed` covers instant methods (card, Pix); `async_payment_succeeded`
// covers delayed methods (Boleto) that confirm hours/days after the redirect.
const GRANT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    // This validates the webhook signature (throws on mismatch) and persists the
    // event/objects into the stripe.* schema. Must run first.
    await sync.processWebhook(payload, signature);

    // The signature was just validated above, so the payload is authentic and we
    // can safely parse it to drive access grants. `verifyAndGrantAccess` is
    // idempotent and returns gracefully (no throw) when a session is not yet
    // paid — so a grant failure here means a genuine transient error. We rethrow
    // it so the route responds non-2xx and Stripe retries the delivery; this is
    // critical for Boleto, where the webhook is the only post-payment signal.
    const event = JSON.parse(payload.toString('utf8')) as {
      type?: string;
      data?: { object?: { id?: string } };
    };

    if (event.type && GRANT_EVENTS.has(event.type)) {
      const sessionId = event.data?.object?.id;
      if (sessionId) {
        const result = await stripeService.verifyAndGrantAccess(sessionId);
        logger.info({ sessionId, eventType: event.type, result }, 'Processed access grant from webhook');
      }
    }
  }
}
