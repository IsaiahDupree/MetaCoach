import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch campaigns for an ad account
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const adAccountId = req.nextUrl.searchParams.get('ad_account_id')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!adAccountId) {
      return NextResponse.json(
        { error: 'Missing ad_account_id parameter' },
        { status: 400 }
      )
    }

    const client = new MetaClient(token)
    const campaigns = await client.getCampaigns(adAccountId, 25)

    // Fetch insights for each campaign
    const campaignsWithInsights = await Promise.all(
      campaigns.map(async (campaign: any) => {
        try {
          const insights = await client.getCampaignInsights(campaign.id)
          return { ...campaign, insights }
        } catch (error) {
          console.error(`Failed to fetch insights for campaign ${campaign.id}:`, error)
          return { ...campaign, insights: null }
        }
      })
    )

    return NextResponse.json({
      campaigns: campaignsWithInsights,
      total: campaignsWithInsights.length,
    })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.response?.data },
      { status: 500 }
    )
  }
}
