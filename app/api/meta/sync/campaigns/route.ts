import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'
import { MetaClient } from '@/lib/meta'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const accountId = req.nextUrl.searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id query parameter is required' },
        { status: 400 }
      )
    }

    // Get the Meta account with access token
    const { data: account, error: accountError } = await supabase
      .from('meta_accounts')
      .select('access_token, token_expires_at')
      .eq('id', accountId)
      .eq('user_id', req.userId)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const tokenExpires = new Date(account.token_expires_at || now)
    if (tokenExpires < now) {
      return NextResponse.json(
        { error: 'Access token has expired. Please reconnect your account.' },
        { status: 401 }
      )
    }

    // Create Meta client and fetch campaigns
    const client = new MetaClient(account.access_token)
    const metaCampaigns = await client.getCampaigns(accountId, 1000)

    if (!metaCampaigns || metaCampaigns.length === 0) {
      return NextResponse.json(
        { success: true, synced: 0, message: 'No campaigns found for this account' },
        { status: 200 }
      )
    }

    // Sync campaigns to database
    const campaignsToUpsert = metaCampaigns.map((campaign: any) => ({
      id: campaign.id,
      meta_account_id: accountId,
      campaign_name: campaign.name,
      campaign_status: campaign.status,
      campaign_objective: campaign.objective,
      daily_budget: campaign.daily_budget ? campaign.daily_budget / 100 : null,
      lifetime_budget: campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null,
      start_date: campaign.created_time ? new Date(campaign.created_time).toISOString().split('T')[0] : null,
      end_date: null,
    }))

    // Upsert campaigns
    const { error: syncError } = await supabase
      .from('campaigns')
      .upsert(campaignsToUpsert, { onConflict: 'id' })

    if (syncError) {
      console.error('Error syncing campaigns:', syncError)
      return NextResponse.json(
        { error: 'Failed to sync campaigns to database' },
        { status: 500 }
      )
    }

    // Now sync ad sets for each campaign
    let adSetCount = 0
    for (const campaign of metaCampaigns) {
      try {
        const adSets = await fetch(
          `https://graph.facebook.com/v21.0/${campaign.id}/adsets`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          }
        )
          .then((res) => res.json())
          .catch(() => ({ data: [] }))

        if (adSets.data && Array.isArray(adSets.data)) {
          const adSetsToUpsert = adSets.data.map((adSet: any) => ({
            id: adSet.id,
            campaign_id: campaign.id,
            ad_set_name: adSet.name,
            ad_set_status: adSet.status,
            daily_budget: adSet.daily_budget ? adSet.daily_budget / 100 : null,
            lifetime_budget: adSet.lifetime_budget ? adSet.lifetime_budget / 100 : null,
            optimization_goal: adSet.optimization_goal,
            targeting: adSet.targeting || null,
          }))

          const { error: adSetError } = await supabase
            .from('meta_ad_sets')
            .upsert(adSetsToUpsert, { onConflict: 'id' })

          if (adSetError) {
            console.error('Error syncing ad sets:', adSetError)
          }

          adSetCount += adSets.data.length
        }
      } catch (error) {
        console.error(`Error syncing ad sets for campaign ${campaign.id}:`, error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        synced: metaCampaigns.length,
        adSetsSynced: adSetCount,
        message: `Synced ${metaCampaigns.length} campaigns and ${adSetCount} ad sets`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'An error occurred during sync' },
      { status: 500 }
    )
  }
}

export const POST = createProtectedRoute(handler)
export const GET = createProtectedRoute(handler)
