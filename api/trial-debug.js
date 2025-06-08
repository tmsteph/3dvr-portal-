export default async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'STRIPE_SECRET_KEY is undefined',
    });
  }

  return res.status(200).json({
    message: 'Stripe key is present',
    startsWith: key.slice(0, 8),
    isLiveKey: key.startsWith('sk_live_'),
  });
}
