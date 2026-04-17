import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = resetPasswordSchema.parse(body)
    const { token, password } = validated

    const supabase = supabaseAdmin()

    // Update user password using the recovery token
    const { error } = await supabase.auth.admin.updateUserById(
      token, // The token is provided by the client from the reset link
      { password }
    )

    if (error) {
      return NextResponse.json(
        { error: 'Failed to reset password. Token may be invalid or expired.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Password reset successfully. Please log in with your new password.' },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred during password reset' },
      { status: 500 }
    )
  }
}
