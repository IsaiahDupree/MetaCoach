import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase'

// Reads saved data only. Does not contact Meta or start a sync.
const handler = async (req: NextRequest & { userId?: string }) => {
  const accountId = req.nextUrl.searchParams.get('account_id')
  const period = req.nextUrl.searchParams.get('period') || '30d'
  const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[period]
  if (!accountId || !days) return NextResponse.json({ error: 'Invalid account or period' }, { status: 400 })

  try {
    const db = supabaseAdmin()
    const { data: account, error: accountError } = await db.from('meta_accounts').select('id')
      .eq('id', accountId).eq('user_id', req.userId).maybeSingle()
    if (accountError) return NextResponse.json({ error: 'Could not verify account' }, { status: 500 })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const end = new Date()
    const start = new Date(end)
    start.setUTCDate(end.getUTCDate() - (days - 1))
    const { data: rows, count, error: performanceError } = await db.from('meta_ad_performance')
      .select('date,impressions,clicks,spend,action_value,meta_ads!inner(meta_ad_sets!inner(meta_account_id))', { count: 'exact' })
      .eq('meta_ads.meta_ad_sets.meta_account_id', accountId)
      .gte('date', start.toISOString().slice(0, 10)).lte('date', end.toISOString().slice(0, 10))
      .order('date', { ascending: false }).limit(1000)
    if (performanceError) return NextResponse.json({ error: 'Could not load saved performance' }, { status: 500 })

    const { data: campaigns, count: campaignCount, error: campaignError } = await db.from('campaigns')
      .select('id,campaign_name,campaign_status,campaign_objective', { count: 'exact' })
      .eq('meta_account_id', accountId).order('id').limit(100)
    if (campaignError) return NextResponse.json({ error: 'Could not load saved campaigns' }, { status: 500 })
    if (count === null || campaignCount === null) {
      return NextResponse.json({ error: 'Could not verify saved data completeness' }, { status: 500 })
    }

    function total(key: string): number | null {
      if (!rows?.length) return null
      let sum = 0
      for (const row of rows) {
        const value = (row as Record<string, unknown>)[key]
        if (value === null || value === undefined || value === '') return null
        const n = Number(value)
        if (!Number.isFinite(n)) return null
        sum += n
      }
      return sum
    }
    const spend = total('spend'), impressions = total('impressions'), clicks = total('clicks')
    const actionValue = total('action_value')
    const performanceTruncated = count > (rows?.length || 0)
    return NextResponse.json({
      summary: rows?.length && !performanceTruncated ? {
        spend, impressions, clicks,
        ctr: clicks !== null && impressions !== null && impressions > 0 ? clicks / impressions : null,
        roas: actionValue !== null && spend !== null && spend > 0 ? actionValue / spend : null,
      } : null,
      campaigns: (campaigns || []).map((campaign) => ({
        id: campaign.id, name: campaign.campaign_name,
        status: campaign.campaign_status, objective: campaign.campaign_objective,
      })),
      truncated: performanceTruncated || campaignCount > (campaigns?.length || 0),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Saved dashboard read failed', error)
    return NextResponse.json({ error: 'Could not load saved dashboard data' }, { status: 500 })
  }
}

export const GET = createProtectedRoute(handler)
