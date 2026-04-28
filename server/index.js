import 'dotenv/config'
import express from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const app = express()

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const priceId = process.env.STRIPE_PRICE_ID || process.env.VITE_STRIPE_PRICE_ID
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!stripeSecretKey) {
  console.warn('[api] Missing STRIPE_SECRET_KEY')
}
if (!priceId) {
  console.warn('[api] Missing STRIPE_PRICE_ID / VITE_STRIPE_PRICE_ID')
}
if (!stripeWebhookSecret) {
  console.warn('[api] Missing STRIPE_WEBHOOK_SECRET')
}
if (!supabaseUrl) {
  console.warn('[api] Missing SUPABASE_URL / VITE_SUPABASE_URL')
}
if (!supabaseServiceRoleKey) {
  console.warn('[api] Missing SUPABASE_SERVICE_ROLE_KEY')
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null

function baseUrlFromReq(req) {
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin.startsWith('http')) return origin
  return process.env.APP_URL || 'http://localhost:5173'
}

// Stripe requires the raw body to verify signatures.
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' })
    if (!stripeWebhookSecret) return res.status(500).json({ error: 'Stripe webhook secret is not configured' })
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin is not configured' })

    const sig = req.headers['stripe-signature']
    if (typeof sig !== 'string' || !sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret)
    } catch (err) {
      console.error('[api] webhook signature verification failed', err)
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object
      const email =
        typeof session?.customer_email === 'string' ? session.customer_email.trim() : ''

      if (email) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_pro: true })
          .eq('email', email)

        if (error) {
          console.error('[api] supabase update profiles failed', error)
          return res.status(500).json({ error: 'Failed to update user profile' })
        }
      }
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('[api] stripe-webhook error', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
})

// JSON body parser for all other API routes.
app.use(express.json())

app.post('/api/create-checkout', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' })
    if (!priceId) return res.status(500).json({ error: 'Stripe price is not configured' })

    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    if (!email) return res.status(400).json({ error: 'email is required' })

    const baseUrl = baseUrlFromReq(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/pricing`,
    })

    return res.json({ sessionId: session.id })
  } catch (err) {
    console.error('[api] create-checkout error', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

const port = Number(process.env.PORT) || 4242
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)
})

