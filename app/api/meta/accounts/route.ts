import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'
import { MetaClient } from '@/lib/meta'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = supabaseAdmin()

    // Get user's linked Meta ad accounts from database
    const { data: accounts, error } = await supabase
      .from('meta_accounts')
      .select('id, account_name, account_currency, account_timezone, is_active, access_token, token_expires_at')
      .eq('user_id', req.userId)
      .eq('is_active', true)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'No linked Meta ad accounts found. Please connect an account.',
        },
        { status: 200 }
      )
    }

    // Enrich account data with current balance and status from Meta API
    const enrichedAccounts = await Promise.all(
      accounts.map(async (account) => {
        try {
          // Check if token is still valid
          const now = new Date()
          const expiresAt = new Date(account.token_expires_at || now)

          if (expiresAt < now) {
            // Token has expired
            return {
              id: account.id,
              name: account.account_name,
              currency: account.account_currency,
              timezone: account.account_timezone,
              status: 'token_expired',
              balance: null,
              requiresReauth: true,
            }
          }

          // Fetch current account details from Meta API
          const client = new MetaClient(account.access_token)
          const response = await client.getAdAccounts()
          const metaAccount = response.find((acc: any) => acc.id === account.id)

          return {
            id: account.id,
            name: account.account_name,
            currency: account.account_currency || metaAccount?.currency,
            timezone: account.account_timezone || metaAccount?.timezone_name,
            status: metaAccount?.account_status || 'unknown',
            balance: metaAccount?.amount_spent,
            requiresReauth: false,
          }
        } catch (error) {
          console.error(`Error enriching account ${account.id}:`, error)
          // Return basic info if API call fails
          return {
            id: account.id,
            name: account.account_name,
            currency: account.account_currency,
            timezone: account.account_timezone,
            status: 'unknown',
            balance: null,
            requiresReauth: false,
          }
        }
      })
    )

    return NextResponse.json(
      {
        success: true,
        data: enrichedAccounts,
        count: enrichedAccounts.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching accounts' },
      { status: 500 }
    )
  }
}

export const GET = createProtectedRoute(handler)
