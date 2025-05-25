import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendWelcomeEmail(to) {
  await transporter.sendMail({
    from: `"3DVR.Tech" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Welcome to 3DVR.Tech!',
    html: `<h1>Welcome!</h1><p>Thanks for subscribing to 3DVR.Tech. We’re glad to have you!</p>`,
  });
}

async function notifyTeam(newUserEmail) {
  const team = [
    'tmsteph1290@gmail.com',
    'abrandon05@gmail.com',
    'gamboaesai@gmail.com',
    'mark.wells3050@gmail.com',
    'davidmartinezr@hotmail.com'
    // Add Bodhi later when you have the email
  ];

  await transporter.sendMail({
    from: `"3DVR.Tech Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER, // visible sender
    bcc: team,
    subject: `New Subscriber: ${newUserEmail}`,
    html: `<p>A new user just subscribed: <strong>${newUserEmail}</strong></p>`,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;

    if (email) {
      console.log('New subscriber:', email);
      await sendWelcomeEmail(email);
      await notifyTeam(email);
    }
  }

  res.status(200).json({ received: true });
}
