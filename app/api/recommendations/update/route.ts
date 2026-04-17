import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (req.method === 'OPTIONS') {
      return NextResponse.json({ ok: true })
    }

    const supabase = supabaseAdmin()
    const body = await req.json()
    const { recommendationId, isImplemented } = body

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'recommendationId is required' },
        { status: 400 }
      )
    }

    // Get the recommendation
    const { data: recommendation } = await supabase
      .from('meta_coach_recommendations')
      .select('meta_account_id')
      .eq('id', recommendationId)
      .single()

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Verify account ownership
    const { data: account } = await supabase
      .from('meta_accounts')
      .select('id')
      .eq('id', recommendation.meta_account_id)
      .eq('user_id', req.userId)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update recommendation
    const updateData: any = {
      is_implemented: isImplemented,
      updated_at: new Date().toISOString(),
    }

    if (isImplemented) {
      updateData.implemented_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('meta_coach_recommendations')
      .update(updateData)
      .eq('id', recommendationId)

    if (error) {
      console.error('Error updating recommendation:', error)
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: isImplemented ? 'Recommendation marked as implemented' : 'Implementation status updated',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export const POST = createProtectedRoute(handler)
export const PATCH = createProtectedRoute(handler)
