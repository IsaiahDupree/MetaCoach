import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'
import axios from 'axios'

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const searchParams = req.nextUrl.searchParams
    const accountId = searchParams.get('account_id')
    const dateFrom = searchParams.get('date_from') // YYYY-MM-DD
    const dateTo = searchParams.get('date_to') // YYYY-MM-DD
    const level = searchParams.get('level') || 'ad' // ad, adset, campaign

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify account ownership
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
        { error: 'Access token has expired' },
        { status: 401 }
      )
    }

    // Determine the date range (default: last 30 days)
    const endDate = dateTo ? new Date(dateTo) : new Date()
    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch ads based on level
    let ads: any[] = []

    if (level === 'ad') {
      // Get all ads for this account
      const { data: adData } = await supabase
        .from('meta_ads')
        .select('id')
        .in(
          'meta_ad_set_id',
          (
            await supabase
              .from('meta_ad_sets')
              .select('id')
              .eq('meta_account_id', accountId)
          ).data?.map((as: any) => as.id) || []
        )

      ads = adData || []
    } else {
      // For adset or campaign level, get the corresponding IDs
      const { data: adSetData } = await supabase
        .from('meta_ad_sets')
        .select('id')
        .eq('meta_account_id', accountId)

      ads = adSetData || []
    }

    if (ads.length === 0) {
      return NextResponse.json(
        {
          success: true,
          metricsCount: 0,
          message: 'No ads found for this account',
        },
        { status: 200 }
      )
    }

    // Fetch metrics from Meta API for each ad
    const metricsPromises = ads.map(async (ad: any) => {
      try {
        const response = await axios.get(
          `${META_GRAPH_URL}/${ad.id}/insights`,
          {
            params: {
              access_token: account.access_token,
              date_preset: 'custom',
              date_start: startDate.toISOString().split('T')[0],
              date_stop: endDate.toISOString().split('T')[0],
              fields: 'impressions,clicks,spend,actions,action_values,ctr,cpc,cpm,cpa,roas',
              time_increment: 'day',
            },
            timeout: 10000,
          }
        )

        return response.data.data || []
      } catch (error) {
        console.error(`Error fetching metrics for ad ${ad.id}:`, error)
        return []
      }
    })

    const metricsArrays = await Promise.all(metricsPromises)
    const allMetrics = metricsArrays.flat()

    // Transform and store metrics in database
    const metricsToInsert = allMetrics
      .filter((metric: any) => metric.date_start)
      .map((metric: any) => {
        // Find which ad this metric belongs to
        const adId = ads[allMetrics.indexOf(metric)]?.id

        // Calculate derived metrics
        const impressions = parseInt(metric.impressions) || 0
        const clicks = parseInt(metric.clicks) || 0
        const spend = parseFloat(metric.spend) || 0
        const actions = parseInt(metric.actions) || 0
        const actionValue = parseFloat(metric.action_values) || 0

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
        const cpc = clicks > 0 ? spend / clicks : 0
        const cpa = actions > 0 ? spend / actions : 0
        const roas = spend > 0 ? actionValue / spend : 0

        return {
          meta_ad_id: adId,
          date: metric.date_start,
          impressions,
          clicks,
          spend: parseFloat(spend.toFixed(2)),
          actions,
          action_value: parseFloat(actionValue.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(4)),
          cpc: parseFloat(cpc.toFixed(4)),
          cpa: parseFloat(cpa.toFixed(4)),
          roas: parseFloat(roas.toFixed(4)),
        }
      })

    if (metricsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meta_ad_performance')
        .upsert(metricsToInsert, { onConflict: 'meta_ad_id,date' })

      if (insertError) {
        console.error('Error inserting metrics:', insertError)
        return NextResponse.json(
          { error: 'Failed to store metrics' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        metricsCount: metricsToInsert.length,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        message: `Fetched and stored ${metricsToInsert.length} performance metrics`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Metrics fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching metrics' },
      { status: 500 }
    )
  }
}

export const GET = createProtectedRoute(handler)
export const POST = createProtectedRoute(handler)
