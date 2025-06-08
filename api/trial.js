import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Optional: CORS for frontend calls
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or replace with your frontend domain
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

async function sendWelcomeEmail(to) {
  try {
    await transporter.sendMail({
      from: `"Thomas @ 3DVR.Tech" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Welcome to 3DVR.Tech!',
      html: `
        <div style="font-family: sans-serif; font-size: 16px;">
          <h2>Welcome to 3DVR.Tech!</h2>
          <p>You’ve started your free trial — no card required. Excited to have you on board!</p>
          <p>Feel free to reach out any time with ideas or questions.</p>
          <p>- Thomas</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Email sending failed:', err);
  }
}

async function notifyTeam(email) {
  const team = [
    'tmsteph1290@gmail.com',
    'abrandon055@gmail.com',
    'gamboaesai@gmail.com',
    'mark.wells3050@gmail.com',
    'davidmartinezr@hotmail.com'
  ];

  try {
    await transporter.sendMail({
      from: `"3DVR.Tech Bot" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      bcc: team,
      subject: `New Free Trial: ${email}`,
      html: `<p><strong>${email}</strong> started a free trial.</p>`
    });
  } catch (err) {
    console.error('Team notify failed:', err);
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({ email });

    // Create trial subscription
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete' // No card required
    });

    await sendWelcomeEmail(email);
    await notifyTeam(email);

    res.status(200).json({ success: true, message: 'Free trial started' });

  } catch (err) {
    console.error('🔥 TRIAL ERROR:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
