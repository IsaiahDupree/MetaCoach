import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import axios from 'axios'

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

interface HealthStatus {
  service: 'meta'
  status: 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'
  latency_ms: number
  last_check: string
  last_success: string | null
  message: string
  details?: {
    api_version: string
    rate_limit?: {
      calls_used: number
      total_calls: number
      calls_remaining: number
      cpu_time: number
      total_time: number
    }
    token_valid: boolean
    scopes?: string[]
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('meta_access_token')?.value

    if (!token) {
      return NextResponse.json<HealthStatus>({
        service: 'meta',
        status: 'DOWN',
        latency_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        last_success: null,
        message: 'No access token found',
      })
    }

    // Ping Graph API to check health
    const response = await axios.get(`${META_GRAPH_URL}/me`, {
      params: {
        access_token: token,
        fields: 'id,name',
      },
      timeout: 5000,
    })

    const latency = Date.now() - startTime

    // Parse rate limit headers
    const rateLimitHeader = response.headers['x-app-usage']
    let rateLimit = undefined

    if (rateLimitHeader) {
      try {
        const parsed = JSON.parse(rateLimitHeader)
        rateLimit = {
          calls_used: parsed.call_count || 0,
          total_calls: 600, // Meta's default hourly limit
          calls_remaining: 600 - (parsed.call_count || 0),
          cpu_time: parsed.total_cputime || 0,
          total_time: parsed.total_time || 0,
        }
      } catch (e) {
        console.error('Failed to parse rate limit header:', e)
      }
    }

    // Determine status based on rate limit
    let status: 'UP' | 'DEGRADED' | 'DOWN' = 'UP'
    let message = 'All systems operational'

    if (rateLimit && rateLimit.calls_remaining < 100) {
      status = 'DEGRADED'
      message = `API rate limit approaching (${rateLimit.calls_remaining} calls remaining)`
    }

    if (latency > 2000) {
      status = 'DEGRADED'
      message = `High latency detected (${latency}ms)`
    }

    return NextResponse.json<HealthStatus>({
      service: 'meta',
      status,
      latency_ms: latency,
      last_check: new Date().toISOString(),
      last_success: new Date().toISOString(),
      message,
      details: {
        api_version: 'v21.0',
        rate_limit: rateLimit,
        token_valid: true,
      },
    })

  } catch (error: any) {
    const latency = Date.now() - startTime

    console.error('Meta health check failed:', error.message)

    return NextResponse.json<HealthStatus>({
      service: 'meta',
      status: 'DOWN',
      latency_ms: latency,
      last_check: new Date().toISOString(),
      last_success: null,
      message: `API error: ${error.response?.data?.error?.message || error.message}`,
      details: {
        api_version: 'v21.0',
        token_valid: false,
      },
    }, {
      status: 503,
    })
  }
}
