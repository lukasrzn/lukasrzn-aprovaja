import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Checking for existing AprovaJá products...');

  // --- Pro Plan ---
  const existingPro = await stripe.products.search({
    query: "name:'AprovaJá Pro' AND active:'true'",
  });

  let proProductId: string;

  if (existingPro.data.length > 0) {
    proProductId = existingPro.data[0].id;
    console.log(`Pro Plan already exists: ${proProductId}`);
  } else {
    const pro = await stripe.products.create({
      name: 'AprovaJá Pro',
      description: 'Plano Pro — simulados ilimitados, flashcards, plano de estudos com IA e gamificação completa.',
      metadata: { plan: 'pro', platform: 'aprovaja' },
    });
    proProductId = pro.id;
    console.log(`Created Pro product: ${proProductId}`);

    const proPrice = await stripe.prices.create({
      product: proProductId,
      unit_amount: 2990,
      currency: 'brl',
      recurring: { interval: 'month' },
    });
    console.log(`Created Pro monthly price: R$29,90/mês (${proPrice.id})`);
  }

  // --- Premium Plan ---
  const existingPremium = await stripe.products.search({
    query: "name:'AprovaJá Premium' AND active:'true'",
  });

  let premiumProductId: string;

  if (existingPremium.data.length > 0) {
    premiumProductId = existingPremium.data[0].id;
    console.log(`Premium Plan already exists: ${premiumProductId}`);
  } else {
    const premium = await stripe.products.create({
      name: 'AprovaJá Premium',
      description: 'Plano Premium — redações ilimitadas, Professor IA 24/7, simulados semanais inéditos e métricas avançadas.',
      metadata: { plan: 'premium', platform: 'aprovaja' },
    });
    premiumProductId = premium.id;
    console.log(`Created Premium product: ${premiumProductId}`);

    const premiumPrice = await stripe.prices.create({
      product: premiumProductId,
      unit_amount: 5990,
      currency: 'brl',
      recurring: { interval: 'month' },
    });
    console.log(`Created Premium monthly price: R$59,90/mês (${premiumPrice.id})`);
  }

  console.log('\nProdutos e preços criados com sucesso!');
  console.log('Webhooks vão sincronizar os dados no banco automaticamente.');
}

seedProducts().catch((err) => {
  console.error('Error seeding products:', err.message);
  process.exit(1);
});
