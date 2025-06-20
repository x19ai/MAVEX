import { Database } from "@/app/types/database.types"
import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminBrowserClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { isSupabaseEnabled, supabaseServiceKey } from "./config"

export const createAdminClient = () => {
  if (!isSupabaseEnabled) {
    return null
  }

  if (!supabaseServiceKey) {
    throw new Error("Supabase service key is not configured.")
  }

  return createAdminBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export const createClient = async () => {
  if (!isSupabaseEnabled) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore for middleware
          }
        },
      },
    }
  )
}
