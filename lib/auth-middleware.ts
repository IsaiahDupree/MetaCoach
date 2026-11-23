import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

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
    const secret = process.env.SUPABASE_JWT_SECRET
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
    if (!secret || secret.length < 32 || !projectUrl) {
      return { authenticated: false, error: 'Authentication is not configured' }
    }

    // Prefer an explicit bearer token. Browser sessions use the HttpOnly cookie.
    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (authHeader && !bearer) return { authenticated: false, error: 'Invalid authorization header' }
    const token = bearer || req.cookies.get('auth_token')?.value

    if (!bearer && token && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.get('origin')
      const host = req.headers.get('host')
      const expectedOrigin = host ? new URL(`${req.nextUrl.protocol}//${host}`).origin : req.nextUrl.origin
      if (!origin || origin !== expectedOrigin) {
        return { authenticated: false, error: 'Invalid request origin' }
      }
    }

    if (!token) {
      return {
        authenticated: false,
        error: 'Missing authentication token',
      }
    }

    // Verify JWT token
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
      requiredClaims: ['sub', 'exp'],
      issuer: `${projectUrl}/auth/v1`,
      audience: 'authenticated',
    })
    const payload = verified.payload as AuthPayload

    if (typeof payload.sub !== 'string' || !payload.sub || payload.role !== 'authenticated') {
      return { authenticated: false, error: 'Invalid user claims' }
    }

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
export function createProtectedRoute(handler: Function, options?: { allowCookieGet?: boolean }) {
  return async (req: NextRequest, ...args: any[]) => {
    const auth = await verifyAuth(req)

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Legacy GET handlers that write must not accept browser cookies: a
    // cross-site navigation can otherwise trigger their side effects.
    if (req.method === 'GET' && options?.allowCookieGet === false && !req.headers.get('authorization')) {
      return NextResponse.json({ error: 'Use an authenticated POST request' }, { status: 405 })
    }

    // Add auth info to request
    ;(req as any).userId = auth.userId
    ;(req as any).user = auth.user

    return handler(req, ...args)
  }
}
