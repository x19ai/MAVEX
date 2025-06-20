export const isSupabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging
console.log("Supabase config check:", {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  isEnabled: isSupabaseEnabled
})
