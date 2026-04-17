import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const accountId = req.nextUrl.searchParams.get('account_id')
    const implementedOnly = req.nextUrl.searchParams.get('implemented') === 'true'
    const type = req.nextUrl.searchParams.get('type')

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify account ownership
    const { data: account } = await supabase
      .from('meta_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', req.userId)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or unauthorized' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('meta_coach_recommendations')
      .select('*')
      .eq('meta_account_id', accountId)
      .order('created_at', { ascending: false })

    if (implementedOnly) {
      query = query.eq('is_implemented', true)
    }

    if (type) {
      query = query.eq('recommendation_type', type)
    }

    const { data: recommendations, error } = await query

    if (error) {
      console.error('Error fetching recommendations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      )
    }

    // Calculate summary stats
    const summary = {
      total: recommendations?.length || 0,
      implemented: recommendations?.filter((r: any) => r.is_implemented).length || 0,
      pending: recommendations?.filter((r: any) => !r.is_implemented).length || 0,
      byType: {
        budget: recommendations?.filter((r: any) => r.recommendation_type === 'budget').length || 0,
        creative: recommendations?.filter((r: any) => r.recommendation_type === 'creative').length || 0,
        audience: recommendations?.filter((r: any) => r.recommendation_type === 'audience').length || 0,
        targeting: recommendations?.filter((r: any) => r.recommendation_type === 'targeting').length || 0,
      },
    }

    return NextResponse.json(
      {
        success: true,
        summary,
        recommendations: recommendations || [],
        count: recommendations?.length || 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export const GET = createProtectedRoute(handler)
