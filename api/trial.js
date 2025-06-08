  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.log('⚠️ STRIPE_PRICE_ID is missing');
      return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
    }

    console.log('🚀 Creating customer and trial with:', {
      email,
      priceId: process.env.STRIPE_PRICE_ID
    });

    const customer = await stripe.customers.create({ email });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete'
    });

    console.log('✅ Subscription created:', subscription.id);

    await sendWelcomeEmail(email);
    await notifyTeam(email);

    res.status(200).json({ success: true, message: 'Free trial started' });

  } catch (err) {
    console.error('🔥 FINAL ERROR:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
