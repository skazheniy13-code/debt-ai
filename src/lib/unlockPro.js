export async function unlockPro(email) {
  if (!email) throw new Error('Missing email')

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Failed to create checkout session')

  const url = typeof data?.url === 'string' ? data.url : ''
  if (!url) throw new Error('Missing checkout url from API')
  window.location.href = url
}

