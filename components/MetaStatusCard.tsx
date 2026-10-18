'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'

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
  }
}

export default function MetaStatusCard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchHealth() {
    try {
      const res = await fetch('/api/meta/health')
      const data = await res.json()
      setHealth(data)
    } catch (error) {
      console.error('Failed to fetch health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !health) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-muted mb-4"></div>
          <div className="h-8 w-20 rounded bg-muted"></div>
        </div>
      </div>
    )
  }

  const statusColors = {
    UP: 'bg-green-500',
    DEGRADED: 'bg-yellow-500',
    DOWN: 'bg-red-500',
    UNKNOWN: 'bg-gray-500',
  }

  const statusTextColors = {
    UP: 'text-green-700',
    DEGRADED: 'text-yellow-700',
    DOWN: 'text-red-700',
    UNKNOWN: 'text-gray-700',
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Meta (Instagram) API
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusColors[health.status]}`} />
            <span className={`text-2xl font-bold ${statusTextColors[health.status]}`}>
              {health.status}
            </span>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          className="rounded-md px-3 py-1 text-sm border hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Latency</span>
          <span className="font-medium">{health.latency_ms}ms</span>
        </div>

        {health.details?.rate_limit && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">API Calls</span>
              <span className="font-medium">
                {health.details.rate_limit.calls_remaining} / {health.details.rate_limit.total_calls} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${(health.details.rate_limit.calls_remaining / health.details.rate_limit.total_calls) * 100}%`,
                }}
              />
            </div>
          </>
        )}

        <div className="pt-2 mt-2 border-t">
          <p className="text-xs text-muted-foreground">{health.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last checked: {new Date(health.last_check).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}
