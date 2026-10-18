import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MetaClient } from '@/lib/meta'

interface MetricsRequest {
  from?: string // ISO date
  to?: string // ISO date
  metrics?: string[] // Specific metrics to fetch
}

interface MetricPoint {
  metric_name: string
  value: number
  timestamp: string
  unit?: string
  trend?: number // Percentage change from previous period
}

interface MetricsResponse {
  service: 'meta'
  period: {
    from: string
    to: string
  }
  summary: {
    // Organic metrics
    total_posts: number
    total_reach: number
    total_engagement: number
    avg_engagement_rate: number
    
    // AI analysis (if available)
    analyzed_posts: number
    avg_hook_score?: number
    avg_thumbnail_score?: number
    
    // Ad metrics (if available)
    ad_spend?: number
    ad_impressions?: number
    ad_clicks?: number
    ad_conversions?: number
    roas?: number
  }
  metrics: MetricPoint[]
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('meta_access_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()
    const requestedMetrics = searchParams.get('metrics')?.split(',') || []

    const client = new MetaClient(token)

    // Get pages
    const pages = await client.getPages()
    if (!pages || pages.length === 0) {
      return NextResponse.json<MetricsResponse>({
        service: 'meta',
        period: { from, to },
        summary: {
          total_posts: 0,
          total_reach: 0,
          total_engagement: 0,
          avg_engagement_rate: 0,
          analyzed_posts: 0,
        },
        metrics: [],
      })
    }

    const page = pages[0]
    
    // Get Instagram Business Account
    const igUserId = await client.getInstagramBusinessAccountId(page.id)
    if (!igUserId) {
      return NextResponse.json(
        { error: 'No Instagram Business Account found' },
        { status: 404 }
      )
    }

    // Fetch media in the time period
    const allMedia = await client.getMedia(igUserId, 100)
    const fromDate = new Date(from)
    const toDate = new Date(to)
    
    const mediaInPeriod = allMedia.filter((m) => {
      const timestamp = new Date(m.timestamp || '')
      return timestamp >= fromDate && timestamp <= toDate
    })

    // Calculate organic metrics
    let totalReach = 0
    let totalEngagement = 0
    
    // Fetch insights for each media item
    const mediaWithInsights = await Promise.allSettled(
      mediaInPeriod.map(async (media) => {
        try {
          const insights = await client.getMediaInsights(media.id)
          return {
            ...media,
            insights,
          }
        } catch (error) {
          return {
            ...media,
            insights: null,
          }
        }
      })
    )

    const successfulMedia = mediaWithInsights
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value)

    successfulMedia.forEach((media) => {
      if (media.insights) {
        totalReach += media.insights.reach || 0
        totalEngagement += media.insights.engagement || 0
      }
    })

    const avgEngagementRate = totalReach > 0
      ? (totalEngagement / totalReach) * 100
      : 0

    // Try to fetch ad metrics if ad account exists
    let adMetrics: {
      ad_spend?: number
      ad_impressions?: number
      ad_clicks?: number
      ad_conversions?: number
      roas?: number
    } = {}

    try {
      const adAccounts = await client.getAdAccounts()
      if (adAccounts && adAccounts.length > 0) {
        const adAccountId = adAccounts[0].id

        // Fetch ad insights for the period
        const campaigns = await client.getCampaigns(adAccountId, 50)
        
        let totalSpend = 0
        let totalImpressions = 0
        let totalClicks = 0
        let totalConversions = 0

        campaigns.forEach((campaign: any) => {
          if (campaign.insights) {
            totalSpend += parseFloat(campaign.insights.spend || '0')
            totalImpressions += parseInt(campaign.insights.impressions || '0')
            totalClicks += parseInt(campaign.insights.clicks || '0')
            
            if (campaign.insights.actions) {
              campaign.insights.actions.forEach((action: any) => {
                if (action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase') {
                  totalConversions += parseInt(action.value || '0')
                }
              })
            }
          }
        })

        adMetrics = {
          ad_spend: totalSpend,
          ad_impressions: totalImpressions,
          ad_clicks: totalClicks,
          ad_conversions: totalConversions,
          roas: totalSpend > 0 ? (totalConversions / totalSpend) : undefined,
        }
      }
    } catch (error) {
      console.log('Could not fetch ad metrics (may not have ads permissions):', error)
    }

    // Build metrics array
    const metrics: MetricPoint[] = [
      {
        metric_name: 'meta.organic.posts',
        value: mediaInPeriod.length,
        timestamp: to,
        unit: 'count',
      },
      {
        metric_name: 'meta.organic.reach',
        value: totalReach,
        timestamp: to,
        unit: 'count',
      },
      {
        metric_name: 'meta.organic.engagement',
        value: totalEngagement,
        timestamp: to,
        unit: 'count',
      },
      {
        metric_name: 'meta.organic.engagement_rate',
        value: parseFloat(avgEngagementRate.toFixed(2)),
        timestamp: to,
        unit: 'percentage',
      },
    ]

    // Add ad metrics if available
    if (adMetrics.ad_spend !== undefined) {
      metrics.push(
        {
          metric_name: 'meta.ads.spend',
          value: adMetrics.ad_spend,
          timestamp: to,
          unit: 'currency',
        },
        {
          metric_name: 'meta.ads.impressions',
          value: adMetrics.ad_impressions || 0,
          timestamp: to,
          unit: 'count',
        },
        {
          metric_name: 'meta.ads.clicks',
          value: adMetrics.ad_clicks || 0,
          timestamp: to,
          unit: 'count',
        },
        {
          metric_name: 'meta.ads.conversions',
          value: adMetrics.ad_conversions || 0,
          timestamp: to,
          unit: 'count',
        }
      )

      if (adMetrics.roas !== undefined) {
        metrics.push({
          metric_name: 'meta.ads.roas',
          value: parseFloat(adMetrics.roas.toFixed(2)),
          timestamp: to,
          unit: 'ratio',
        })
      }
    }

    return NextResponse.json<MetricsResponse>({
      service: 'meta',
      period: { from, to },
      summary: {
        total_posts: mediaInPeriod.length,
        total_reach: totalReach,
        total_engagement: totalEngagement,
        avg_engagement_rate: parseFloat(avgEngagementRate.toFixed(2)),
        analyzed_posts: 0, // TODO: Query AI analysis results from database
        ...adMetrics,
      },
      metrics,
    })

  } catch (error: any) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    )
  }
}
