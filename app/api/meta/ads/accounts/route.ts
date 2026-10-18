import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch ad accounts
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const client = new MetaClient(token)
    const accounts = await client.getAdAccounts()

    return NextResponse.json({
      accounts,
      total: accounts.length,
    })
  } catch (error: any) {
    console.error('Error fetching ad accounts:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch ad accounts', details: error.response?.data },
      { status: 500 }
    )
  }
}
