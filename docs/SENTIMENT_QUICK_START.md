# Sentiment Analysis - Quick Start

## ✅ What's Been Built

Complete sentiment analysis system with automatic updates and external API access.

## 🚀 5-Minute Setup

### 1. Add Environment Variables

Add to `.env.local` and Vercel:

```bash
# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Security
CRON_SECRET=generate-a-random-32-char-string
```

### 2. Deploy to Vercel

Push to GitHub - Vercel auto-deploys with cron job configured.

### 3. Done!

Users connect Meta once, sentiment updates automatically every 4 hours.

## 📍 New Pages

**Settings (Token Management):**
```
https://your-app.com/settings
```
Users can copy their `meta_access_token` for external integrations.

**Dashboard (Enhanced):**
```
https://your-app.com/dashboard
```
Now shows sentiment analysis with "Analyze Sentiment" buttons.

## 🔌 API Endpoints

### For Dashboard
- `GET /api/sentiment/analyze?media_id={id}` - Analyze single post
- `POST /api/sentiment/analyze` - Analyze multiple posts

### For External Backends (Everreach)
- `GET /api/external/sentiment?media_id={id}` - Get sentiment for post
- `GET /api/external/sentiment?ig_user_id={id}&limit=12` - Get all recent posts

**Authorization:** Pass token via `Authorization: Bearer {token}` header

### Scheduled Job
- `POST /api/cron/sentiment-update` - Runs every 4 hours automatically
- Requires `Authorization: Bearer {CRON_SECRET}`

## 🎯 User Experience

1. **One-Time Connection**: User connects Meta account at `/connect`
2. **Automatic Updates**: Sentiment analyzed every 4 hours automatically
3. **On-Demand**: Click "Analyze Sentiment" for immediate results
4. **External Access**: Copy token from `/settings` for Everreach integration

## 🔗 Everreach Integration

From Everreach backend:

```javascript
const token = userToken // Get from your DB

const response = await fetch(
  `https://metacoach.matrixloop.app/api/external/sentiment?ig_user_id=${igUserId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)

const data = await response.json()
// data.posts contains sentiment for all posts
```

## 📊 Response Format

```json
{
  "posts": [
    {
      "media_id": "123",
      "caption": "Great post!",
      "sentiment": {
        "average_sentiment": 0.75,
        "breakdown": {
          "positive": 20,
          "neutral": 3,
          "negative": 2,
          "positive_percentage": 80.0
        },
        "last_updated": "2025-11-15T19:30:00Z"
      }
    }
  ]
}
```

## ⏱️ Cron Schedule

**Current:** Every 4 hours (0, 4, 8, 12, 16, 20 UTC)

**Change in `vercel.json`:**
```json
"schedule": "0 */4 * * *"  // Every 4 hours
"schedule": "0 * * * *"    // Every hour
"schedule": "0 2 * * *"    // Daily at 2am
```

## 💰 Costs

- **OpenAI**: ~$0.0001 per comment (~$0.20/month for typical usage)
- **Vercel Cron**: Free on Pro plan
- **Supabase**: Free tier sufficient for most users

## 📖 Full Documentation

See `docs/SENTIMENT_ANALYSIS_SETUP.md` for complete details.

## ✅ Testing

1. Visit `/dashboard` and click "Analyze All Sentiment"
2. Check database for new entries in `comments` and `post_metrics` tables
3. Visit `/settings` to see your token
4. Test external API with curl:

```bash
curl "https://your-app.com/api/external/sentiment?ig_user_id=YOUR_IG_ID" \
  --oauth2-bearer "$SERVICE_API_TOKEN"
```
