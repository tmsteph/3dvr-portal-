import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendWelcomeEmail(to) {
  try {
    await transporter.sendMail({
      from: `"Thomas @ 3DVR.Tech" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'You’re in! Welcome to 3DVR.Tech',
      text: `Thanks for joining 3DVR.Tech!\nEnjoy your trial.`,
      html: `<h2>Welcome!</h2><p>You're now on a free trial — no card needed. Let's build something great.</p><p>- Thomas</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

async function notifyTeam(email) {
  try {
    await transporter.sendMail({
      from: `"3DVR.Tech Subscription Notifier" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      bcc: [
        'tmsteph1290@gmail.com',
        'abrandon055@gmail.com',
        'gamboaesai@gmail.com',
        'mark.wells3050@gmail.com',
        'davidmartinezr@hotmail.com'
      ],
      subject: `New Free Trial User: ${email}`,
      html: `<p><strong>${email}</strong> just started a free trial.</p>`,
    });
  } catch (err) {
    console.error('Notify error:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // 1. Create Stripe Customer
    const customer = await stripe.customers.create({ email });

    // 2. Create a trial Subscription (e.g., 14-day trial)
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete', // no card required
    });

    await sendWelcomeEmail(email);
    await notifyTeam(email);

    res.status(200).json({ success: true, message: 'Trial started' });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}
