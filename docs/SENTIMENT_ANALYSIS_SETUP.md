# Sentiment Analysis System - Complete Setup Guide

## 🎯 Overview

This system automatically analyzes comment sentiment on Instagram posts, stores the data, and makes it available through multiple interfaces:

1. **User Dashboard** - View and analyze posts with sentiment
2. **Token Management** - Copy access token for external integrations
3. **Scheduled Jobs** - Automatic sentiment updates every 4 hours
4. **External API** - For Everreach and other backends to access data

---

## 📋 Quick Start (One-Time Setup)

### 1. Configure Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Required: OpenAI for sentiment analysis (already configured)
OPENAI_API_KEY=sk-proj-... # ✅ Already set

# Required: Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required: Cron job security (generate a random string)
CRON_SECRET=your-random-secret-string
```

**Generate a random CRON_SECRET:**
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 2. Set Up Supabase (if not already done)

Your database schema is already in `supabase/migrations/001_initial_schema.sql`. 

If you haven't set up Supabase yet:

1. Go to https://supabase.com
2. Create a new project
3. Get your project URL and API keys from Settings > API
4. Run the migration:
   ```bash
   # Install Supabase CLI if needed
   npm install -g supabase
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

### 3. Deploy to Vercel

The system is configured to run automatically via Vercel Cron Jobs:

1. Push to your repository
2. Vercel will deploy automatically
3. Add environment variables in Vercel dashboard
4. The cron job will run every 4 hours automatically

---

## 🚀 User Flow (One-Time Connection)

### Step 1: Connect Meta Account (Once)

Users visit your app and connect their Meta/Instagram account:

```
https://your-app.com/connect
```

This saves their `meta_access_token` in a secure cookie.

### Step 2: View Dashboard

Users can now see their posts with sentiment:

```
https://your-app.com/dashboard
```

Features:
- View all recent posts with engagement metrics
- Click "Analyze Sentiment" on individual posts
- Click "Analyze All Sentiment" to process all posts at once
- Sentiment updates automatically via background jobs

### Step 3: Get Access Token (Optional)

For external integrations (like Everreach), users can copy their token:

```
https://your-app.com/settings
```

They click "Copy" and can share this token with external systems.

---

## 📊 How It Works

### Automatic Sentiment Updates

Once connected, everything happens automatically:

1. **Every 4 hours**, Vercel Cron triggers `/api/cron/sentiment-update`
2. System fetches recent posts for all connected users
3. Gets latest comments from Instagram API
4. Analyzes sentiment using OpenAI (GPT-4o-mini)
5. Stores results in Supabase database
6. Updates visible in dashboard immediately

**Users never need to reconnect or trigger manually!**

### Manual Trigger (Optional)

Users can also analyze on-demand:
- Click "Analyze Sentiment" on individual posts
- Click "Analyze All Sentiment" for batch processing

---

## 🔌 API Endpoints

### For Users (Dashboard)

**Get sentiment for a post:**
```bash
GET /api/sentiment/analyze?media_id={instagram_media_id}
```

**Analyze multiple posts:**
```bash
POST /api/sentiment/analyze
Body: { "media_ids": ["id1", "id2", "id3"] }
```

### For External Backends (Everreach)

**Get sentiment for a single post:**
```bash
GET /api/external/sentiment?media_id={id}
Authorization: Bearer {meta_access_token}
```

**Get sentiment for all recent posts:**
```bash
GET /api/external/sentiment?ig_user_id={id}&limit=12
Authorization: Bearer {meta_access_token}
```

**Response format:**
```json
{
  "ig_user_id": "123456",
  "posts": [
    {
      "media_id": "abc123",
      "caption": "Great day!",
      "insights": {
        "reach": 5000,
        "likes": 150,
        "comments": 25
      },
      "sentiment": {
        "average_sentiment": 0.75,
        "breakdown": {
          "positive": 20,
          "neutral": 3,
          "negative": 2,
          "positive_percentage": 80.0,
          "neutral_percentage": 12.0,
          "negative_percentage": 8.0
        },
        "comments_count": 25,
        "last_updated": "2025-11-15T19:30:00.000Z"
      }
    }
  ],
  "total": 12,
  "fetched_at": "2025-11-15T19:35:00.000Z"
}
```

---

## 🔐 Everreach Integration Example

### Step 1: Get User's Token

User visits MetaCoach settings page and copies their token:
```
https://metacoach.matrixloop.app/settings
```

### Step 2: Store in Everreach

Save the token securely in your Everreach backend associated with the user.

### Step 3: Fetch Sentiment Data

From Everreach backend:

```javascript
// Node.js/Express example
const token = getUserToken(userId) // From your DB

const response = await fetch(
  'https://metacoach.matrixloop.app/api/external/sentiment?ig_user_id=123456&limit=12',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
)

const data = await response.json()
// Use data.posts to display in Everreach dashboard
```

### Step 4: Display in Everreach

Show sentiment badges, charts, or metrics in your Everreach dashboard.

---

## 📈 Scheduled Job Details

### Vercel Cron Configuration

Located in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sentiment-update",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**Schedule:** Every 4 hours
- `0 */4 * * *` = At minute 0 of every 4th hour
- Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

**Change frequency:**
- Every hour: `0 * * * *`
- Every 2 hours: `0 */2 * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at 2am: `0 2 * * *`

### Manual Trigger (for testing)

```bash
curl -X POST https://your-app.com/api/cron/sentiment-update \
  -H "Authorization: Bearer $API_TOKEN"
```

### Monitoring

Check Vercel dashboard:
1. Go to your project
2. Click "Cron Jobs" tab
3. See execution history and logs

---

## 💾 Database Schema

The system uses these tables (already set up):

### `comments` table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  platform_comment_id TEXT,
  author TEXT,
  text TEXT,
  sentiment NUMERIC, -- -1.0 to 1.0
  created_at TIMESTAMPTZ
);
```

### `post_metrics` table
```sql
CREATE TABLE post_metrics (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  fetched_at TIMESTAMPTZ,
  sentiment NUMERIC, -- aggregated
  comments_count BIGINT,
  json_raw JSONB -- includes breakdown
);
```

---

## 🎨 UI Components

### SentimentBadge Component

Displays sentiment in a user-friendly way:

```tsx
<SentimentBadge
  sentiment={0.75}
  breakdown={{
    positive: 20,
    neutral: 3,
    negative: 2,
    positive_percentage: 80,
    neutral_percentage: 12,
    negative_percentage: 8
  }}
  size="md"
  showDetails={true}
/>
```

Shows:
- Color-coded badge (green/yellow/red)
- Sentiment score (-1.0 to 1.0)
- Percentage breakdown
- Trend icon (↑ positive, → neutral, ↓ negative)

---

## 🔧 Troubleshooting

### Issue: "No sentiment data" on dashboard

**Causes:**
1. No comments on the post yet
2. Sentiment analysis hasn't run
3. Database not configured

**Solutions:**
1. Click "Analyze Sentiment" button manually
2. Wait for next cron job (every 4 hours)
3. Check Supabase environment variables

### Issue: Cron job not running

**Check:**
1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel Cron Jobs tab for errors
3. Ensure cron is enabled in Vercel dashboard

**Test manually:**
```bash
curl -X POST https://your-app.com/api/cron/sentiment-update \
  -H "Authorization: Bearer $API_TOKEN"
```

### Issue: "Failed to analyze sentiment"

**Causes:**
1. OpenAI API key invalid or missing
2. Rate limit exceeded
3. No comments to analyze

**Solutions:**
1. Verify `OPENAI_API_KEY` is correct
2. Check OpenAI usage dashboard
3. Try a post with more comments

### Issue: External API returns 401

**Causes:**
1. Token not provided or invalid
2. Token format incorrect

**Solutions:**
1. Ensure token is passed: `Authorization: Bearer {token}`
2. Or use query param: `?token={token}`
3. Verify token is valid by checking `/api/settings/token`

---

## 💰 Cost Estimates

### OpenAI Usage

**Per comment analysis:**
- Model: GPT-4o-mini
- Tokens: ~100-200 per comment
- Cost: ~$0.0001 per comment

**Example monthly costs:**
- 10 posts × 50 comments × 4 times/month = 2,000 analyses
- Cost: ~$0.20/month

**With 1000 users:**
- ~$200/month for sentiment analysis

### Vercel Cron

- Free on Pro plan
- Unlimited executions

### Supabase

- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month if needed

---

## 🔒 Security Best Practices

1. **Never expose tokens in frontend code**
   - Store in httpOnly cookies only
   - Use server-side API routes

2. **Secure cron endpoint**
   - Always verify `CRON_SECRET`
   - Use unique, random secret

3. **Rate limiting**
   - OpenAI has built-in rate limits
   - Consider adding your own for external API

4. **Token rotation**
   - Meta tokens expire (60 days)
   - Implement refresh token flow (future enhancement)

---

## 🎯 Next Steps

### Enhancements You Can Add

1. **Email notifications** when sentiment drops below threshold
2. **Sentiment trends** over time charts
3. **Comment filtering** by sentiment (show only negative)
4. **Batch export** to CSV for reporting
5. **Webhook notifications** to external systems
6. **AI-powered responses** to negative comments

### Example: Email Alerts

Add to cron job:

```typescript
// In sentiment-update cron
if (aggregated.average_sentiment < -0.3) {
  await sendEmail({
    to: user.email,
    subject: 'Alert: Negative sentiment detected',
    body: `Your post has ${aggregated.negative_percentage}% negative comments`
  })
}
```

---

## 📞 Support

**Documentation:**
- This file: `docs/SENTIMENT_ANALYSIS_SETUP.md`
- Everreach integration: `docs/EVERREACH_DASHBOARD_INTEGRATION.md`

**Issues:**
- Check Vercel logs for errors
- Check Supabase logs for database issues
- Check OpenAI usage dashboard

**Need help?**
- Review API endpoint responses for error details
- Check browser console for frontend errors
- Verify all environment variables are set

---

## ✅ Setup Checklist

- [ ] Supabase project created
- [ ] Database migration run
- [ ] Environment variables set (local and Vercel)
- [ ] Meta connection working
- [ ] OpenAI API key valid
- [ ] CRON_SECRET generated and set
- [ ] Deployed to Vercel
- [ ] Cron job enabled
- [ ] Test sentiment analysis manually
- [ ] Verify external API works
- [ ] Share token instructions with users

---

**🎉 You're all set! Users can now connect once and get automatic sentiment analysis forever.**
