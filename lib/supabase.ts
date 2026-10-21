import { createClient, type SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'

type SupabaseClient = SupabaseClientType

let browserClient: SupabaseClient | undefined
let adminClient: SupabaseClient | undefined

function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  browserClient ??= createClient(url, anonKey)
  return browserClient
}

// Initialize on first use so public pages can be built without database
// credentials. The client still fails clearly if an auth/data action needs
// Supabase and the runtime environment has not been configured.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getBrowserClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Server-side Supabase client with service role (use only in API routes)
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!url) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  adminClient ??= createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  return adminClient
}

export const supabaseAdmin = (): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get(_target, property) {
      const client = getAdminClient()
      const value = Reflect.get(client, property, client)
      return typeof value === 'function' ? value.bind(client) : value
    },
  })
}
