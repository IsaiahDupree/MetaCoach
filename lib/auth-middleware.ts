import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET || 'your-secret-key'
)

interface AuthPayload {
  sub: string
  aud: string
  iat: number
  exp: number
  email?: string
  email_confirmed?: boolean
  phone_verified?: boolean
  app_metadata?: any
  user_metadata?: any
  role?: string
  aal?: string
  amr?: Array<{ method: string; timestamp: number }>
  session_id?: string
}

export async function verifyAuth(req: NextRequest): Promise<{
  authenticated: boolean
  userId?: string
  user?: AuthPayload
  error?: string
}> {
  try {
    // Get token from header or cookie
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return {
        authenticated: false,
        error: 'Missing authentication token',
      }
    }

    // Verify JWT token
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as AuthPayload

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return {
        authenticated: false,
        error: 'Token has expired',
      }
    }

    return {
      authenticated: true,
      userId: payload.sub,
      user: payload,
    }
  } catch (error: any) {
    return {
      authenticated: false,
      error: error.message || 'Invalid token',
    }
  }
}

export function authMiddleware(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const auth = await verifyAuth(req)

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Attach user to request context
    const requestWithUser = Object.assign(req, {
      user: auth.user,
      userId: auth.userId,
    })

    return handler(requestWithUser, ...args)
  }
}

/**
 * Middleware function to check authentication
 * Can be used in Next.js middleware.ts or directly in API routes
 */
export async function authMiddlewareHandler(req: NextRequest) {
  const auth = await verifyAuth(req)

  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    )
  }

  return null // No error, allow request to proceed
}

/**
 * Helper to create a protected API route
 */
export function createProtectedRoute(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const auth = await verifyAuth(req)

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Add auth info to request
    ;(req as any).userId = auth.userId
    ;(req as any).user = auth.user

    return handler(req, ...args)
  }
}
