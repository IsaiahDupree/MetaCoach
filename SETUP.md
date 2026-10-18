# MetaCoach Setup Guide

## Prerequisites Checklist

### 1. Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] Copy the Project URL and anon key to `.env.local`
- [ ] Copy the service role key to `.env.local` (keep this secret!)
- [ ] Run the migration: Go to SQL Editor in Supabase dashboard
- [ ] Paste contents of `supabase/migrations/001_initial_schema.sql`
- [ ] Click "Run" to create all tables

### 2. Create Meta/Facebook App
- [ ] Go to [developers.facebook.com](https://developers.facebook.com)
- [ ] Click "Create App" → Choose "Business" type
- [ ] Give it a name (e.g., "Creator Coach Dev")
- [ ] Add Instagram Graph API product
- [ ] In App Settings → Basic:
  - Copy App ID to `.env.local` as `META_APP_ID`
  - Copy App Secret to `.env.local` as `META_APP_SECRET`
  - Add App Domains: `localhost`
  - Add Privacy Policy URL (create simple page or use placeholder)

### 3. Configure OAuth
- [ ] In Meta App Dashboard → Instagram Graph API → Settings
- [ ] Add Valid OAuth Redirect URIs:
  - Development: `http://localhost:3000/api/meta/oauth/callback`
  - Production: `https://your-domain.com/api/meta/oauth/callback`
- [ ] In Meta App Dashboard → Settings → Basic
- [ ] Add Data Deletion Callback URL:
  - Development: `http://localhost:3000/api/facebook/data-deletion`
  - Production: `https://your-domain.com/api/facebook/data-deletion`

### 4. Request Permissions
In Meta App Dashboard, go to App Review → Permissions and Features:
- [ ] `instagram_basic` - Basic profile info and media
- [ ] `instagram_manage_insights` - Access to insights/metrics
- [ ] `pages_read_engagement` - Read comments and engagement

**Note**: For development/testing, you can use these permissions without review. For production, you'll need to submit for App Review.

### 5. Connect Instagram Business Account
Your Instagram account must be:
- [ ] Converted to a Business or Creator account
- [ ] Connected to a Facebook Page
- [ ] You must be an admin of that Facebook Page

How to convert:
1. Open Instagram app
2. Go to Settings → Account
3. Switch to Professional Account
4. Choose Business or Creator
5. Link to an existing Facebook Page or create one

### 6. Get OpenAI API Key
- [ ] Go to [platform.openai.com](https://platform.openai.com)
- [ ] Create an API key
- [ ] Add to `.env.local` as `OPENAI_API_KEY`
- [ ] Set up billing (usage-based)

### 7. Environment Variables
Create `.env.local` in the project root:

```env
# Copy from .env.example and fill in your values
PUBLIC_BASE_URL=http://localhost:3000
ADMIN_KEY=your-random-admin-key-here

META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPENAI_API_KEY=sk-xxxxx
```

---

## Testing the Connection

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Test OAuth Flow
1. Open `http://localhost:3000/api/meta/oauth/start` in your browser
2. You'll be redirected to Facebook login
3. Log in and authorize the app
4. You'll be redirected back to `/dashboard`
5. Check Supabase `tenants` and `meta_connections` tables to verify data

### 3. Verify Data Access
After connecting, you can test the Meta Graph API:
- Check that `access_token` was stored in `meta_connections`
- Check that `token_expires_at` is ~60 days in the future
- Test the token by calling: 
  ```
  GET https://graph.facebook.com/v21.0/me?access_token=YOUR_TOKEN
  ```

---

## Next Steps (After Connection Works)

### Phase 1: Data Sync
- [ ] Build `/api/meta/sync` route to fetch media and insights
- [ ] Implement `/api/meta/sync/comments` for comment fetching
- [ ] Test with your Instagram account

### Phase 2: Analysis
- [ ] Implement ephemeral media download worker
- [ ] Add OpenAI Vision for image/video analysis
- [ ] Add Whisper for transcript generation
- [ ] Implement sentiment scoring for comments

### Phase 3: Coach
- [ ] Build coach suggestion engine
- [ ] Create prompt templates for different goals
- [ ] Implement "needs iteration" rules

### Phase 4: UI
- [ ] Build dashboard pages (Coach Home, Post Explorer, Feedback Queue)
- [ ] Add components (PostCard, MetricsDelta, CoachSuggestionCard)
- [ ] Implement responsive layout

---

## Troubleshooting

### OAuth Errors
- **"Invalid OAuth redirect URI"**: Make sure the redirect URL in your Meta App matches exactly (including http/https and trailing slashes)
- **"Invalid state"**: Clear cookies and try again; the state cookie may have expired
- **"App not set up"**: Make sure Instagram Graph API product is added to your app

### Database Errors
- **"relation does not exist"**: Run the migration SQL in Supabase dashboard
- **"permission denied"**: Check that you're using the service role key in API routes

### Token Errors
- **"Invalid OAuth access token"**: Token may have expired; re-authorize
- **"Permissions error"**: Make sure you've requested the necessary permissions in App Review

### Instagram Business Account Not Found
- Make sure your Instagram account is:
  1. A Business or Creator account
  2. Connected to a Facebook Page
  3. You're an admin of that page

---

## Meta App Review (For Production)

When ready to launch, submit for App Review:

1. **Prepare**:
   - Clear Privacy Policy URL
   - Data Deletion Instructions URL
   - App Icon and description
   - Screen recordings showing the app usage

2. **Submit**:
   - Go to App Review → Permissions and Features
   - Click "Request" for each permission
   - Fill out use case questionnaire
   - Provide test credentials (create a test account)
   - Upload demo video

3. **Wait**:
   - Review typically takes 3-7 days
   - Respond quickly to any questions

---

## Security Notes

- ✅ Never commit `.env.local` to git (it's in `.gitignore`)
- ✅ Use service role key only in API routes (never client-side)
- ✅ Encrypt access tokens at rest in production (use Supabase vault or KMS)
- ✅ Rotate admin keys regularly
- ✅ Implement rate limiting on public endpoints
- ✅ Add CORS restrictions in production

---

## Cost Estimates (Monthly)

**Supabase** (Free tier is generous):
- Free: 500MB database, 1GB file storage
- Pro: $25/month for more resources

**OpenAI** (Usage-based):
- Vision (GPT-4o): ~$0.01 per image
- Whisper: ~$0.006 per minute of audio
- GPT-4o-mini for coaching: ~$0.0002 per suggestion
- **Estimated**: $10-50/month depending on volume

**Vercel** (Hosting):
- Free: Hobby tier (good for MVP)
- Pro: $20/month (for production)

**Total MVP cost**: $35-95/month

---

_Last updated: Nov 7, 2025_
