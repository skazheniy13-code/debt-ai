import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const looksLikeUrl =
  typeof supabaseUrl === 'string' &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))

if (!supabaseUrl || !supabaseKey || !looksLikeUrl) {
  console.warn(
    '[Supabase] Supabase keys not set (or URL invalid). Update .env (VITE_SUPABASE_URL must start with http/https), then restart the dev server.',
  )
}

export const supabase =
  supabaseUrl && supabaseKey && looksLikeUrl
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

