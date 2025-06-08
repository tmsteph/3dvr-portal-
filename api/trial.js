import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      console.log('❌ Stripe config missing');
      return res.status(500).json({ error: 'Stripe config is missing' });
    }

    console.log('🔐 Using key:', process.env.STRIPE_SECRET_KEY.slice(0, 8));
    console.log('🧾 Using price:', process.env.STRIPE_PRICE_ID);

    const customer = await stripe.customers.create({ email });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
    });

    await transporter.sendMail({
      from: `"Thomas @ 3DVR.Tech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to 3DVR.Tech!',
      html: `<p>You're now on a free trial. Let's build something together!</p>`,
    });

    res.status(200).json({ success: true, subscriptionId: subscription.id });
  } catch (err) {
    console.error('🔥 FINAL ERROR:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
