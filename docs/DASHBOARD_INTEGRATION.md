# Meta Dashboard Integration Guide

## Overview

MetaCoach now includes a comprehensive dashboard for monitoring Instagram organic content performance, ad campaigns, API health, and AI analysis metrics in real-time.

## ✅ Features Implemented

### 1. **API Health Monitoring** (`/api/meta/health`)
- Real-time Meta Graph API status (UP/DEGRADED/DOWN)
- Response latency tracking
- Rate limit monitoring
- Token validation

### 2. **Performance Metrics** (`/api/meta/metrics`)
- **Organic Content**:
  - Total posts in period
  - Total reach
  - Total engagement
  - Average engagement rate

- **AI Analysis** (when available):
  - Number of analyzed posts
  - Average hook score
  - Average thumbnail score

- **Ad Performance** (if `ads_read` permission):
  - Ad spend
  - Impressions
  - Clicks
  - Conversions
  - ROAS (Return on Ad Spend)

### 3. **Dashboard Components**
- `<MetaStatusCard />` - API health status widget
- `<MetaMetricsCard />` - Performance metrics with time range selector

---

## 📊 API Endpoints

### Health Check

**Endpoint:** `GET /api/meta/health`

**Response:**
```json
{
  "service": "meta",
  "status": "UP",
  "latency_ms": 125,
  "last_check": "2025-11-08T21:30:00Z",
  "last_success": "2025-11-08T21:30:00Z",
  "message": "All systems operational",
  "details": {
    "api_version": "v21.0",
    "rate_limit": {
      "calls_used": 150,
      "total_calls": 600,
      "calls_remaining": 450,
      "cpu_time": 25,
      "total_time": 50
    },
    "token_valid": true
  }
}
```

**Status Levels:**
- `UP` - All systems operational
- `DEGRADED` - High latency or approaching rate limits
- `DOWN` - API unreachable or token invalid
- `UNKNOWN` - Unable to determine status

---

### Metrics Aggregation

**Endpoint:** `GET /api/meta/metrics`

**Query Parameters:**
- `from` (ISO date) - Start of time range (default: 7 days ago)
- `to` (ISO date) - End of time range (default: now)
- `metrics` (comma-separated) - Specific metrics to fetch (optional)

**Response:**
```json
{
  "service": "meta",
  "period": {
    "from": "2025-11-01T00:00:00Z",
    "to": "2025-11-08T00:00:00Z"
  },
  "summary": {
    "total_posts": 15,
    "total_reach": 45000,
    "total_engagement": 3200,
    "avg_engagement_rate": 7.1,
    "analyzed_posts": 8,
    "avg_hook_score": 78.5,
    "avg_thumbnail_score": 82.3,
    "ad_spend": 250.50,
    "ad_impressions": 125000,
    "ad_clicks": 3400,
    "ad_conversions": 85,
    "roas": 3.4
  },
  "metrics": [
    {
      "metric_name": "meta.organic.posts",
      "value": 15,
      "timestamp": "2025-11-08T21:30:00Z",
      "unit": "count"
    },
    {
      "metric_name": "meta.organic.reach",
      "value": 45000,
      "timestamp": "2025-11-08T21:30:00Z",
      "unit": "count"
    },
    {
      "metric_name": "meta.organic.engagement_rate",
      "value": 7.1,
      "timestamp": "2025-11-08T21:30:00Z",
      "unit": "percentage"
    },
    {
      "metric_name": "meta.ads.spend",
      "value": 250.50,
      "timestamp": "2025-11-08T21:30:00Z",
      "unit": "currency"
    }
  ]
}
```

---

## 🎨 Using Dashboard Components

### 1. Add to Dashboard Page

```typescript
// app/dashboard/page.tsx
import MetaStatusCard from '@/components/MetaStatusCard'
import MetaMetricsCard from '@/components/MetaMetricsCard'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Status */}
        <MetaStatusCard />
        
        {/* Other status cards... */}
      </div>
      
      {/* Performance Metrics */}
      <div className="mt-6">
        <MetaMetricsCard />
      </div>
    </div>
  )
}
```

### 2. MetaStatusCard Component

**Features:**
- ✅ Real-time API health status
- ✅ Latency monitoring
- ✅ Rate limit progress bar
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button

**Props:** None (fetches data internally)

**Usage:**
```tsx
<MetaStatusCard />
```

### 3. MetaMetricsCard Component

**Features:**
- ✅ Time range selector (24h, 7d, 30d)
- ✅ Organic content metrics
- ✅ AI analysis scores
- ✅ Ad performance (if available)
- ✅ Responsive grid layout

**Props:** None (fetches data internally)

**Usage:**
```tsx
<MetaMetricsCard />
```

---

## 🔧 Setup & Configuration

### 1. Environment Variables

No additional environment variables needed beyond existing Meta OAuth setup:

```bash
# .env.local (already configured)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Permissions Required

**Minimum (Organic Content Only):**
- `instagram_basic` ✅
- `instagram_manage_insights` ✅
- `pages_read_engagement` ✅

**For Ad Metrics:**
- `ads_read` ✅
- `business_management` ✅

**For Advanced Features:**
- `instagram_content_publish` (publishing)
- `instagram_manage_comments` (sentiment analysis)

### 3. Testing

**Test Health Check:**
```bash
# In browser or with curl
curl http://localhost:3000/api/meta/health
```

**Test Metrics:**
```bash
# Last 7 days (default)
curl http://localhost:3000/api/meta/metrics

# Last 24 hours
curl "http://localhost:3000/api/meta/metrics?from=2025-11-07T00:00:00Z&to=2025-11-08T00:00:00Z"
```

---

## 📈 Metric Definitions

### Organic Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| `meta.organic.posts` | Total posts in time period | count |
| `meta.organic.reach` | Total unique accounts reached | count |
| `meta.organic.engagement` | Total likes + comments + saves + shares | count |
| `meta.organic.engagement_rate` | (Engagement / Reach) × 100 | percentage |

### AI Analysis Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| `meta.ai.analyzed_posts` | Posts analyzed with AI | count |
| `meta.ai.avg_hook_score` | Average hook quality score | 0-100 |
| `meta.ai.avg_thumbnail_score` | Average thumbnail quality score | 0-100 |

### Ad Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| `meta.ads.spend` | Total ad spend | currency (USD) |
| `meta.ads.impressions` | Total ad impressions | count |
| `meta.ads.clicks` | Total ad clicks | count |
| `meta.ads.conversions` | Total conversions (purchases) | count |
| `meta.ads.roas` | Return on Ad Spend | ratio |

---

## 🎯 Use Cases

### 1. Daily Performance Review

```typescript
// Fetch yesterday's metrics
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
yesterday.setHours(0, 0, 0, 0)

const today = new Date()
today.setHours(0, 0, 0, 0)

const metrics = await fetch(
  `/api/meta/metrics?from=${yesterday.toISOString()}&to=${today.toISOString()}`
)
```

### 2. Monitor API Health in Production

```typescript
// Add to monitoring dashboard
useEffect(() => {
  const checkHealth = async () => {
    const health = await fetch('/api/meta/health')
    const data = await health.json()
    
    if (data.status === 'DOWN') {
      // Send alert
      alert('Meta API is down!')
    } else if (data.status === 'DEGRADED') {
      // Send warning
      console.warn('Meta API degraded:', data.message)
    }
  }
  
  // Check every minute
  const interval = setInterval(checkHealth, 60000)
  return () => clearInterval(interval)
}, [])
```

### 3. Track ROAS for Ad Campaigns

```typescript
const metrics = await fetch('/api/meta/metrics?from=...&to=...')
const data = await metrics.json()

if (data.summary.roas && data.summary.roas < 2.0) {
  console.warn('ROAS below target! Current:', data.summary.roas)
  // Trigger campaign optimization
}
```

---

## 🚨 Error Handling

### Common Errors

**401 Unauthorized**
```json
{ "error": "Not authenticated" }
```
**Solution:** User needs to complete OAuth flow first

**404 Not Found**
```json
{ "error": "No Instagram Business Account found" }
```
**Solution:** Connect Instagram Business account to Facebook Page

**503 Service Unavailable**
```json
{
  "service": "meta",
  "status": "DOWN",
  "message": "API error: Invalid OAuth access token"
}
```
**Solution:** Token expired, user needs to re-authenticate

---

## 🔄 Rate Limiting

Meta Graph API has rate limits:
- **App-level**: 600 calls per hour (default)
- **User-level**: Varies by app verification status

### Monitoring Rate Limits

The health endpoint automatically tracks rate limits:

```typescript
const health = await fetch('/api/meta/health')
const data = await health.json()

if (data.details?.rate_limit.calls_remaining < 100) {
  console.warn('Approaching rate limit!')
}
```

### Best Practices

1. ✅ Cache metrics data (don't refetch every page load)
2. ✅ Use longer time ranges when possible
3. ✅ Implement exponential backoff on errors
4. ✅ Monitor rate limits via health endpoint
5. ✅ Use batch requests where possible

---

## 📊 Future Enhancements

### Planned Features

- [ ] **Trend Analysis** - Compare periods (e.g., "↑ 15% from last week")
- [ ] **Alerts & Notifications** - Email/Slack when metrics drop
- [ ] **Custom Dashboards** - User-defined metric layouts
- [ ] **Export to CSV** - Download metrics data
- [ ] **Historical Charts** - Visualize metrics over time
- [ ] **A/B Test Tracking** - Compare post performance
- [ ] **Sentiment Analysis** - Track comment sentiment trends
- [ ] **Competitor Benchmarking** - Compare vs industry averages

### Integration Ideas

- **PostHog Events** - Track metric changes
- **Supabase** - Store historical metrics
- **Webhook Notifications** - Real-time alerts
- **Scheduled Reports** - Daily/weekly email summaries

---

## 🧪 Testing Guide

### Manual Testing

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Complete OAuth Flow:**
   - Navigate to `http://localhost:3000/connect`
   - Complete Business Login

3. **Test Health Endpoint:**
   ```bash
   curl http://localhost:3000/api/meta/health
   ```

4. **Test Metrics Endpoint:**
   ```bash
   curl "http://localhost:3000/api/meta/metrics?from=2025-11-01T00:00:00Z&to=2025-11-08T00:00:00Z"
   ```

5. **View Dashboard:**
   - Navigate to `http://localhost:3000/dashboard`
   - Verify status card shows "UP"
   - Verify metrics card displays data
   - Test time range selector (24h, 7d, 30d)

### Automated Testing

```typescript
// Example test
describe('Meta Health API', () => {
  it('should return health status', async () => {
    const res = await fetch('http://localhost:3000/api/meta/health')
    const data = await res.json()
    
    expect(data.service).toBe('meta')
    expect(['UP', 'DEGRADED', 'DOWN', 'UNKNOWN']).toContain(data.status)
    expect(typeof data.latency_ms).toBe('number')
  })
})
```

---

## 📚 Related Documentation

- [PERMISSIONS_2025_UPDATE.md](./PERMISSIONS_2025_UPDATE.md) - Current API permissions
- [MEDIA_ANALYSIS_SETUP.md](./MEDIA_ANALYSIS_SETUP.md) - AI analysis pipeline
- [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) - OAuth implementation

---

**Status**: ✅ Fully implemented and ready to use!  
**Last Updated**: November 8, 2025

## Quick Start

```bash
# 1. Start the dev server
npm run dev

# 2. Complete OAuth at /connect

# 3. View dashboard at /dashboard

# 4. Test APIs:
curl http://localhost:3000/api/meta/health
curl http://localhost:3000/api/meta/metrics
```

🎉 **Your Meta dashboard is ready!**
