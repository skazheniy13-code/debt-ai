import Stripe from 'stripe'

function baseUrlFromReq(req) {
  const origin = req.headers?.origin
  if (typeof origin === 'string' && origin.startsWith('http')) return origin
  return process.env.APP_URL || 'http://localhost:5173'
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const priceId =
      process.env.STRIPE_PRICE_ID ||
      process.env.VITE_STRIPE_PRICE_ID ||
      // fallback so deployments don't break if env is misconfigured
      'price_1TPla80VZXEB5VZ6qIwoklkc'
    if (!stripeSecretKey) return res.status(500).json({ error: 'Stripe is not configured' })
    if (!priceId) {
      return res.status(500).json({
        error: 'Stripe price is not configured',
        hint: 'Set STRIPE_PRICE_ID on Vercel (Project Settings → Environment Variables) and redeploy.',
      })
    }

    const body = req.body && typeof req.body === 'object' ? req.body : await readJsonBody(req)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    if (!email) return res.status(400).json({ error: 'email is required' })

    const stripe = new Stripe(stripeSecretKey)
    const baseUrl = baseUrlFromReq(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/pricing`,
    })

    // Newer Stripe.js removed redirectToCheckout(); client can redirect to session.url directly.
    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('[api] create-checkout error', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}

