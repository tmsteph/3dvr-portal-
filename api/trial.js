import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Allow external calls (you can restrict this to your frontend domain later)
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Send welcome email
async function sendWelcomeEmail(to) {
  await transporter.sendMail({
    from: `"Thomas @ 3DVR.Tech" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Welcome to 3DVR.Tech!',
    html: `
      <div style="font-family: sans-serif; font-size: 16px;">
        <h2>Welcome to 3DVR.Tech!</h2>
        <p>You’ve started your free trial — no credit card required. Excited to have you on board!</p>
        <p>Let’s build something amazing together. If you have questions, reply to this email anytime.</p>
        <p>– Thomas</p>
      </div>
    `,
  });
}

// Notify team
async function notifyTeam(email) {
  const teamEmails = [
    'tmsteph1290@gmail.com',
    'abrandon055@gmail.com',
    'gamboaesai@gmail.com',
    'mark.wells3050@gmail.com',
    'davidmartinezr@hotmail.com'
  ];

  await transporter.sendMail({
    from: `"3DVR.Tech Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    bcc: teamEmails,
    subject: `New Free Trial Started: ${email}`,
    html: `<p><strong>${email}</strong> just signed up for a free trial.</p>`
  });
}

// Main route handler
export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return res.status(500).json({ error: 'Stripe configuration is missing.' });
  }

  try {
    console.log('📩 Creating customer for:', email);

    // Check for existing customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer = existingCustomers.data[0] || await stripe.customers.create({ email });

    // Check if the customer already has an active subscription
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });

    const alreadySubscribed = subs.data.some(sub => sub.status === 'active' || sub.status === 'trialing');

    if (alreadySubscribed) {
      return res.status(409).json({ error: 'You already have an active or trialing subscription.' });
    }

    // Create new trial subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
    });

    console.log('✅ Trial started:', subscription.id);

    // Notify user + team
    await sendWelcomeEmail(email);
    await notifyTeam(email);

    res.status(200).json({ success: true, subscriptionId: subscription.id });

  } catch (err) {
    console.error('🔥 FINAL ERROR:', err);
    res.status(500).json({ error: err.message || 'Unexpected error occurred.' });
  }
}
