'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'

interface MetricsResponse {
  service: 'meta'
  period: {
    from: string
    to: string
  }
  summary: {
    total_posts: number
    total_reach: number
    total_engagement: number
    avg_engagement_rate: number
    analyzed_posts: number
    avg_hook_score?: number
    avg_thumbnail_score?: number
    ad_spend?: number
    ad_impressions?: number
    ad_clicks?: number
    ad_conversions?: number
    roas?: number
  }
}

type TimeRange = '24h' | '7d' | '30d'

export default function MetaMetricsCard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  async function fetchMetrics() {
    setLoading(true)
    try {
      const now = new Date()
      let from: Date

      switch (timeRange) {
        case '24h':
          from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      const res = await fetch(
        `/api/meta/metrics?from=${from.toISOString()}&to=${now.toISOString()}`
      )
      const data = await res.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !metrics) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-muted"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { summary } = metrics

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Organic Metrics */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Organic Content</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricTile
            label="Posts"
            value={summary.total_posts}
            format="number"
          />
          <MetricTile
            label="Total Reach"
            value={summary.total_reach}
            format="number"
          />
          <MetricTile
            label="Engagement"
            value={summary.total_engagement}
            format="number"
          />
          <MetricTile
            label="Engagement Rate"
            value={summary.avg_engagement_rate}
            format="percentage"
            suffix="%"
          />
        </div>
      </div>

      {/* AI Analysis Metrics */}
      {summary.analyzed_posts > 0 && (
        <div className="space-y-4 mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">AI Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricTile
              label="Analyzed"
              value={summary.analyzed_posts}
              format="number"
            />
            {summary.avg_hook_score !== undefined && (
              <MetricTile
                label="Avg Hook Score"
                value={summary.avg_hook_score}
                format="score"
                suffix="/100"
              />
            )}
            {summary.avg_thumbnail_score !== undefined && (
              <MetricTile
                label="Avg Thumbnail"
                value={summary.avg_thumbnail_score}
                format="score"
                suffix="/100"
              />
            )}
          </div>
        </div>
      )}

      {/* Ad Metrics */}
      {summary.ad_spend !== undefined && summary.ad_spend > 0 && (
        <div className="space-y-4 mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Ad Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricTile
              label="Ad Spend"
              value={summary.ad_spend}
              format="currency"
              prefix="$"
            />
            <MetricTile
              label="Impressions"
              value={summary.ad_impressions || 0}
              format="number"
            />
            <MetricTile
              label="Clicks"
              value={summary.ad_clicks || 0}
              format="number"
            />
            <MetricTile
              label="Conversions"
              value={summary.ad_conversions || 0}
              format="number"
            />
            {summary.roas !== undefined && (
              <MetricTile
                label="ROAS"
                value={summary.roas}
                format="ratio"
                suffix="x"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricTileProps {
  label: string
  value: number
  format: 'number' | 'currency' | 'percentage' | 'score' | 'ratio'
  prefix?: string
  suffix?: string
  trend?: number
}

function MetricTile({ label, value, format, prefix = '', suffix = '', trend }: MetricTileProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'number':
        return formatNumber(val)
      case 'currency':
        return val.toFixed(2)
      case 'percentage':
      case 'score':
      case 'ratio':
        return val.toFixed(1)
      default:
        return val.toString()
    }
  }

  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {prefix}{formatValue(value)}{suffix}
      </p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </p>
      )}
    </div>
  )
}
