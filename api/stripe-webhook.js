import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!stripeSecretKey) return res.status(500).json({ error: 'Stripe is not configured' })
    if (!stripeWebhookSecret)
      return res.status(500).json({ error: 'Stripe webhook secret is not configured' })
    if (!supabaseUrl || !supabaseServiceRoleKey)
      return res.status(500).json({ error: 'Supabase admin is not configured' })

    const sig = req.headers['stripe-signature']
    if (typeof sig !== 'string' || !sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }

    const stripe = new Stripe(stripeSecretKey)
    const rawBody = await readRawBody(req)

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret)
    } catch (err) {
      console.error('[api] webhook signature verification failed', err)
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object
      const email =
        typeof session?.customer_email === 'string' ? session.customer_email.trim() : ''

      if (email) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })

        const { error } = await supabaseAdmin.from('profiles').update({ is_pro: true }).eq('email', email)
        if (error) {
          console.error('[api] supabase update profiles failed', error)
          return res.status(500).json({ error: 'Failed to update user profile' })
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[api] stripe-webhook error', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}

