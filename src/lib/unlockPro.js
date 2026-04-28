import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

function getStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!key) throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY')
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

export async function unlockPro(email) {
  if (!email) throw new Error('Missing email')

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Failed to create checkout session')

  const sessionId = data?.sessionId
  if (!sessionId) throw new Error('Missing sessionId from API')

  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe failed to load')

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw error
}

