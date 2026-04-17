import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: {
      status: 'up' | 'down'
      latency_ms: number
    }
  }
  uptime_ms?: number
}

const startTime = Date.now()

export async function GET(req: NextRequest): Promise<NextResponse<HealthResponse>> {
  const requestStart = Date.now()

  try {
    // Check database connectivity
    const dbStart = Date.now()
    const supabase = supabaseAdmin()

    // Perform a simple query to verify database connection
    const { error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(0)

    const dbLatency = Date.now() - dbStart

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected for a limit(0) query
      throw error
    }

    const responseTime = Date.now() - requestStart
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Degrade if database latency is high
    if (dbLatency > 1000) {
      overallStatus = 'degraded'
    }

    return NextResponse.json<HealthResponse>(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: {
            status: 'up',
            latency_ms: dbLatency,
          },
        },
        uptime_ms: Date.now() - startTime,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Health check failed:', error)

    return NextResponse.json<HealthResponse>(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: {
            status: 'down',
            latency_ms: Date.now() - requestStart,
          },
        },
        uptime_ms: Date.now() - startTime,
      },
      { status: 503 }
    )
  }
}
