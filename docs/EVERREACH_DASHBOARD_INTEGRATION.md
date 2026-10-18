# Everreach Dashboard Integration Guide

## Connect MetaCoach Status & Metrics to Everreach Reports

This guide shows how to integrate MetaCoach's Meta (Instagram/Facebook) monitoring and analytics into your Everreach dashboard at **https://reports.everreach.app/**

---

## 🎯 Overview

MetaCoach provides real-time API health monitoring and performance metrics that can be consumed by your Everreach dashboard. This integration allows you to:

- 📊 Display Instagram/Facebook API health status
- 📈 Show organic content performance metrics
- 🤖 Track AI content analysis scores
- 💰 Monitor ad campaign performance
- 🔔 Set up alerts for API issues or performance drops

---

## 🔗 Available API Endpoints

### Base URL
```
Production: https://www.matrixloop.app
Development: http://localhost:3000
```

### Authentication
All endpoints require authentication via `meta_access_token` cookie. For server-to-server calls, you'll need to implement token passing.

---

## 1️⃣ Health Check Endpoint

Monitor Meta API connectivity, latency, and rate limits.

### Endpoint
```
GET /api/meta/health
```

### Request Example
```bash
curl https://www.matrixloop.app/api/meta/health \
  -H "Cookie: meta_access_token=YOUR_TOKEN"
```

### Response Format
```json
{
  "service": "meta",
  "status": "UP",
  "latency_ms": 125,
  "timestamp": "2025-11-08T19:00:00.000Z",
  "details": {
    "authenticated": true,
    "token_valid": true,
    "rate_limit": {
      "calls_used": 150,
      "total_calls": 600,
      "calls_remaining": 450,
      "percentage_used": 25
    }
  }
}
```

### Status Values
- `UP` - All systems operational (green 🟢)
- `DEGRADED` - Rate limit >80% or latency >1000ms (yellow 🟡)
- `DOWN` - API unreachable or authentication failed (red 🔴)

---

## 2️⃣ Performance Metrics Endpoint

Get aggregated performance data for organic content, AI analysis, and ads.

### Endpoint
```
GET /api/meta/metrics
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | ISO 8601 Date | No | Start date (default: 7 days ago) |
| `to` | ISO 8601 Date | No | End date (default: now) |

### Request Examples

**Last 7 days (default):**
```bash
curl https://www.matrixloop.app/api/meta/metrics \
  -H "Cookie: meta_access_token=YOUR_TOKEN"
```

**Last 24 hours:**
```bash
curl "https://www.matrixloop.app/api/meta/metrics?from=2025-11-07T00:00:00Z&to=2025-11-08T00:00:00Z" \
  -H "Cookie: meta_access_token=YOUR_TOKEN"
```

**Last 30 days:**
```bash
curl "https://www.matrixloop.app/api/meta/metrics?from=2025-10-08T00:00:00Z&to=2025-11-08T00:00:00Z" \
  -H "Cookie: meta_access_token=YOUR_TOKEN"
```

### Response Format
```json
{
  "period": {
    "from": "2025-11-01T00:00:00.000Z",
    "to": "2025-11-08T00:00:00.000Z"
  },
  "organic": {
    "posts": 15,
    "reach": 45280,
    "engagement": 3245,
    "engagement_rate": 7.16
  },
  "ai_analysis": {
    "analyzed_posts": 8,
    "avg_hook_score": 78,
    "avg_thumbnail_score": 82,
    "avg_overall_score": 75
  },
  "ads": {
    "spend": 250.50,
    "impressions": 125340,
    "clicks": 3412,
    "conversions": 85,
    "roas": 3.4,
    "cpm": 2.0,
    "cpc": 0.07,
    "ctr": 2.72
  },
  "metrics": [
    {
      "date": "2025-11-01",
      "posts": 2,
      "reach": 6200,
      "engagement": 445
    }
    // ... more daily data points
  ]
}
```

### Field Descriptions

**Organic Metrics:**
- `posts` - Total Instagram posts published
- `reach` - Total unique accounts reached
- `engagement` - Sum of likes + comments + shares + saves
- `engagement_rate` - (engagement / reach) × 100

**AI Analysis Metrics:**
- `analyzed_posts` - Number of posts with AI analysis
- `avg_hook_score` - Average hook quality (0-100)
- `avg_thumbnail_score` - Average thumbnail quality (0-100)
- `avg_overall_score` - Average content quality (0-100)

**Ad Metrics:**
- `spend` - Total ad spend (USD)
- `impressions` - Total ad impressions
- `clicks` - Total ad clicks
- `conversions` - Total conversions
- `roas` - Return on ad spend (revenue / spend)
- `cpm` - Cost per 1000 impressions
- `cpc` - Cost per click
- `ctr` - Click-through rate (%)

---

## 🔧 Integration Options

### Option 1: Direct API Calls (Recommended for Server-Side)

Use your backend to fetch data from MetaCoach APIs and pass to Everreach frontend.

**Backend (Node.js/Express Example):**
```javascript
// routes/meta-status.js
import axios from 'axios';

export async function getMetaStatus(req, res) {
  try {
    const token = req.cookies.meta_access_token; // Or from your auth system
    
    const healthResponse = await axios.get(
      'https://www.matrixloop.app/api/meta/health',
      {
        headers: {
          Cookie: `meta_access_token=${token}`
        }
      }
    );
    
    const metricsResponse = await axios.get(
      'https://www.matrixloop.app/api/meta/metrics',
      {
        headers: {
          Cookie: `meta_access_token=${token}`
        }
      }
    );
    
    res.json({
      health: healthResponse.data,
      metrics: metricsResponse.data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Meta data' });
  }
}
```

**Frontend (React Example):**
```typescript
// components/MetaStatusWidget.tsx
import { useEffect, useState } from 'react';

interface MetaHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latency_ms: number;
  details: {
    rate_limit: {
      calls_remaining: number;
      total_calls: number;
    };
  };
}

export function MetaStatusWidget() {
  const [health, setHealth] = useState<MetaHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/meta-status');
        const data = await response.json();
        setHealth(data.health);
      } catch (error) {
        console.error('Failed to fetch Meta status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!health) return <div>Failed to load status</div>;

  const statusColor = {
    UP: 'bg-green-500',
    DEGRADED: 'bg-yellow-500',
    DOWN: 'bg-red-500'
  }[health.status];

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Meta API</h3>
        <span className={`px-2 py-1 rounded text-white text-xs ${statusColor}`}>
          {health.status}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        <div>Latency: {health.latency_ms}ms</div>
        <div>
          Rate Limit: {health.details.rate_limit.calls_remaining} / {health.details.rate_limit.total_calls}
        </div>
      </div>
    </div>
  );
}
```

---

### Option 2: Embed MetaCoach Components (iFrame)

Embed MetaCoach dashboard components directly in Everreach.

```html
<!-- In your Everreach dashboard -->
<iframe 
  src="https://www.matrixloop.app/dashboard?embed=true"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>
```

**Note:** You'll need to add CORS headers and embed support to MetaCoach for this to work securely.

---

### Option 3: Webhook Integration (For Real-Time Alerts)

Set up webhooks to push updates to Everreach when status changes.

**MetaCoach Webhook Configuration:**
```typescript
// lib/webhooks.ts
export async function notifyEverreach(event: string, data: any) {
  await fetch('https://reports.everreach.app/api/webhooks/metacoach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.EVERREACH_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data
    })
  });
}
```

**Everreach Webhook Handler:**
```typescript
// pages/api/webhooks/metacoach.ts
export default async function handler(req, res) {
  const { event, data } = req.body;
  
  switch (event) {
    case 'meta.health.down':
      // Send alert notification
      await sendAlert('Meta API is down!', data);
      break;
    case 'meta.ratelimit.warning':
      // Notify about rate limit approaching
      await sendAlert('Meta API rate limit at 80%', data);
      break;
    case 'meta.metrics.updated':
      // Update dashboard cache
      await updateDashboardCache(data);
      break;
  }
  
  res.status(200).json({ received: true });
}
```

---

## 📊 Dashboard Widget Examples

### Status Indicator Card

```typescript
// Everreach Dashboard - MetaStatusCard.tsx
export function MetaStatusCard({ health }: { health: MetaHealth }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Instagram API
        </h3>
        <StatusBadge status={health.status} />
      </div>
      
      <div className="space-y-2">
        <MetricRow 
          label="Latency" 
          value={`${health.latency_ms}ms`}
          status={health.latency_ms < 500 ? 'good' : 'warning'} 
        />
        
        <MetricRow 
          label="Rate Limit" 
          value={`${health.details.rate_limit.calls_remaining} / ${health.details.rate_limit.total_calls}`}
          progress={
            (health.details.rate_limit.calls_remaining / 
             health.details.rate_limit.total_calls) * 100
          }
        />
      </div>
    </div>
  );
}
```

### Performance Metrics Card

```typescript
// Everreach Dashboard - MetaMetricsCard.tsx
export function MetaMetricsCard({ metrics }: { metrics: MetaMetrics }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Instagram Performance
      </h3>
      
      {/* Organic Content */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Organic Content
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <MetricBox label="Posts" value={metrics.organic.posts} />
          <MetricBox label="Reach" value={formatNumber(metrics.organic.reach)} />
          <MetricBox label="Engagement" value={formatNumber(metrics.organic.engagement)} />
          <MetricBox label="Eng. Rate" value={`${metrics.organic.engagement_rate.toFixed(1)}%`} />
        </div>
      </div>
      
      {/* AI Analysis */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          AI Analysis
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <MetricBox label="Analyzed" value={metrics.ai_analysis.analyzed_posts} />
          <MetricBox label="Hook Score" value={`${metrics.ai_analysis.avg_hook_score}/100`} />
          <MetricBox label="Thumbnail" value={`${metrics.ai_analysis.avg_thumbnail_score}/100`} />
        </div>
      </div>
      
      {/* Ad Performance */}
      {metrics.ads && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Ad Performance
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <MetricBox label="Spend" value={`$${metrics.ads.spend.toFixed(2)}`} />
            <MetricBox label="Impressions" value={formatNumber(metrics.ads.impressions)} />
            <MetricBox label="Clicks" value={formatNumber(metrics.ads.clicks)} />
            <MetricBox label="ROAS" value={`${metrics.ads.roas.toFixed(1)}x`} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
```

---

## 🔐 Authentication Flow

### Shared Token Approach

1. **User authenticates with MetaCoach** at https://www.matrixloop.app/connect
2. **MetaCoach stores token** in httpOnly cookie
3. **Pass token to Everreach** via secure backend API
4. **Everreach uses token** to fetch MetaCoach data

**Implementation:**

```typescript
// MetaCoach - Add endpoint to share token securely
// app/api/auth/share-token/route.ts
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('meta_access_token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Verify request is from Everreach
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.EVERREACH_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  return NextResponse.json({ token });
}
```

```typescript
// Everreach - Fetch token from MetaCoach
async function getMetaToken(userId: string) {
  const response = await fetch('https://www.matrixloop.app/api/auth/share-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.METACOACH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });
  
  const { token } = await response.json();
  return token;
}
```

---

## 🚀 Quick Start Integration

### Step 1: Set Up Backend Proxy

Create a simple proxy in Everreach to fetch MetaCoach data:

```typescript
// pages/api/meta/[...path].ts
export default async function handler(req, res) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  try {
    const response = await fetch(
      `https://www.matrixloop.app/api/meta/${pathString}${req.url.split('?')[1] || ''}`,
      {
        headers: {
          Cookie: `meta_access_token=${req.cookies.meta_access_token}`
        }
      }
    );
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
```

### Step 2: Create Dashboard Page

```typescript
// pages/reports/instagram.tsx
import { useEffect, useState } from 'react';
import { MetaStatusCard, MetaMetricsCard } from '@/components/meta';

export default function InstagramReportPage() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [healthRes, metricsRes] = await Promise.all([
          fetch('/api/meta/health'),
          fetch('/api/meta/metrics')
        ]);
        
        setHealth(await healthRes.json());
        setMetrics(await metricsRes.json());
      } catch (error) {
        console.error('Failed to load Meta data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading Instagram insights...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Instagram Performance</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <MetaStatusCard health={health} />
      </div>
      
      <MetaMetricsCard metrics={metrics} />
    </div>
  );
}
```

### Step 3: Add to Everreach Navigation

```typescript
// Add to your reports navigation
const reportPages = [
  // ... existing reports
  {
    name: 'Instagram',
    href: '/reports/instagram',
    icon: InstagramIcon,
    badge: health?.status === 'UP' ? 'green' : 'red'
  }
];
```

---

## 📈 Advanced Features

### Time Range Selector

```typescript
export function TimeRangeSelector({ onChange }: { onChange: (range: string) => void }) {
  const ranges = [
    { label: '24h', value: 'day' },
    { label: '7d', value: 'week' },
    { label: '30d', value: 'month' }
  ];

  return (
    <div className="flex gap-2">
      {ranges.map(range => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className="px-3 py-1 text-sm rounded border hover:bg-gray-50"
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
```

### Trend Indicators

```typescript
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  
  return (
    <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
    </span>
  );
}
```

### Alert Notifications

```typescript
// Set up alerts for important metrics
export function checkAndNotify(metrics: MetaMetrics) {
  // Alert if ROAS drops below 2.0
  if (metrics.ads?.roas < 2.0) {
    sendAlert('Low ROAS', `ROAS dropped to ${metrics.ads.roas.toFixed(2)}x`);
  }
  
  // Alert if engagement rate drops below 5%
  if (metrics.organic.engagement_rate < 5.0) {
    sendAlert('Low Engagement', `Engagement rate at ${metrics.organic.engagement_rate.toFixed(1)}%`);
  }
  
  // Alert if hook score is low
  if (metrics.ai_analysis.avg_hook_score < 60) {
    sendAlert('Low Hook Quality', `Average hook score: ${metrics.ai_analysis.avg_hook_score}/100`);
  }
}
```

---

## 🐛 Troubleshooting

### CORS Issues
If you get CORS errors, add CORS headers to MetaCoach API routes:

```typescript
// MetaCoach - app/api/meta/health/route.ts
export async function GET(request: Request) {
  // ... existing code
  
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': 'https://reports.everreach.app',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
```

### Authentication Errors
Ensure the `meta_access_token` is being passed correctly:

```typescript
// Debug token in Everreach
console.log('Token:', req.cookies.meta_access_token?.substring(0, 20) + '...');
```

### Rate Limiting
If you hit Meta rate limits, implement caching:

```typescript
// Cache metrics for 5 minutes
const cache = new Map();

export async function getMetrics() {
  const cacheKey = 'meta_metrics';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  const data = await fetchMetrics();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

---

## 🎯 Next Steps

1. **Set up backend proxy** in Everreach to fetch MetaCoach data
2. **Create dashboard components** using the examples above
3. **Add authentication** flow to share tokens securely
4. **Test with real data** using your Instagram account
5. **Add alerts** for critical metrics
6. **Deploy to production** at reports.everreach.app

---

## 📞 Support

- **MetaCoach Docs:** See `docs/DASHBOARD_INTEGRATION.md`
- **API Reference:** `docs/API_REFERENCE.md` (create if needed)
- **Issues:** Contact development team

---

## 🎊 Summary

You now have everything needed to integrate MetaCoach Instagram monitoring into Everreach:

✅ API endpoints for health & metrics  
✅ Authentication flow  
✅ Dashboard component examples  
✅ Real-time updates with polling  
✅ Alert configuration  
✅ Error handling  

**Ready to build an amazing unified dashboard!** 🚀
