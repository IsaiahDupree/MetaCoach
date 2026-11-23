import { supabaseAdmin } from './supabase'

type Account = { id: string; name?: string; currency?: string; timezone_name?: string }

/** Update only this user's existing account; a conflicting owner cannot be overwritten. */
export async function saveMetaAccounts(userId: string, accounts: Account[], token: string, expiresAt: string) {
  const db = supabaseAdmin()
  for (const account of accounts) {
    const values = {
      account_name: account.name, account_currency: account.currency,
      account_timezone: account.timezone_name, access_token: token,
      token_expires_at: expiresAt, is_active: true,
    }
    const { data, error } = await db.from('meta_accounts').update(values)
      .eq('id', account.id).eq('user_id', userId).select('id').maybeSingle()
    if (error) throw new Error('Could not update the connected account')
    if (!data) {
      const { error: insertError } = await db.from('meta_accounts').insert({ id: account.id, user_id: userId, ...values })
      // A conflicting account ID, including a concurrent insert, must fail closed.
      if (insertError) throw new Error('Could not attach the connected account')
    }
  }
}
