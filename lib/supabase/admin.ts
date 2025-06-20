import { createClient } from '@supabase/supabase-js'
import { isSupabaseEnabled, supabaseServiceKey, supabaseUrl } from './config'

// Note: this should only be used in server-side code
// that needs to bypass RLS.
//
// Never expose this to the client.

export function createAdminClient() {
  if (!isSupabaseEnabled || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} 