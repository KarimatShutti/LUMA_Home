import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL) as string | undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_PUBLISHABLE_KEY) as string | undefined

const normalizedUrl = url?.trim()
const normalizedKey = key?.trim()

const isPlaceholderValue = (value: string | undefined) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return lower.includes('your-project') || lower.includes('your-supabase') || lower.includes('replace-me') || lower.includes('example-project')
}

export const supabase = normalizedUrl && normalizedKey && !isPlaceholderValue(normalizedUrl) && !isPlaceholderValue(normalizedKey)
  ? createClient(normalizedUrl, normalizedKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

export const isConfigured = Boolean(supabase)
