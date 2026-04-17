import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  redirectUrl: z.string().url('Invalid redirect URL').default('/reset-password'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = forgotPasswordSchema.parse(body)
    const { email, redirectUrl } = validated

    const supabase = supabaseAdmin()

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      )
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('Password reset error:', error)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'If an account exists with this email, you will receive a password reset link.' },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
