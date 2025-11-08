# Quick Start (Frontend-Only Prototype)

This is a **frontend-first** build to test Meta API connectivity without setting up the database.

## What We Built

✅ Meta OAuth flow (cookie-based token storage)  
✅ API routes to fetch Instagram pages, media, and insights  
✅ Dashboard UI displaying posts with engagement metrics  
✅ Real-time data from Instagram Graph API  

## Setup (5 minutes)

### 1. Create Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **Create App** → Choose **Business** type
3. Add **Instagram Graph API** product
4. Copy your **App ID** and **App Secret**

### 2. Configure OAuth

In your Meta App Dashboard:

**Instagram Graph API → Settings:**
- Valid OAuth Redirect URIs: `http://localhost:3000/api/meta/oauth/callback`

**Settings → Basic:**
- App Domains: `localhost`

### 3. Environment Variables

Create `.env.local` in the project root:

```env
META_APP_ID=your-app-id-here
META_APP_SECRET=your-app-secret-here
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback
PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Flow

1. **Start** → You'll be redirected to `/connect`
2. **Click "Connect Instagram Account"**
3. **Log in to Facebook** and authorize the app
4. **Redirect to `/dashboard`** → See your Instagram posts!

## What You'll See

- Your 12 most recent Instagram posts
- Thumbnails and captions
- Engagement metrics (reach, likes, comments, saves)
- Links to view posts on Instagram

## Troubleshooting

### "Error fetching pages"
- Make sure your Instagram account is a **Business or Creator** account
- It must be connected to a **Facebook Page**
- You must be an **admin** of that page

### "Failed to fetch media"
- Some metrics require specific permissions
- Make sure you granted `instagram_basic`, `instagram_manage_insights`, and `pages_read_engagement`

### OAuth redirect error
- Double-check the redirect URI in your Meta App matches exactly: `http://localhost:3000/api/meta/oauth/callback`
- Include the protocol (`http://`) and no trailing slash

## API Routes (for testing)

- `GET /api/meta/me` - Fetch your Facebook pages with Instagram accounts
- `GET /api/meta/media?ig_user_id=xxx` - Fetch media for an IG account
- `GET /api/meta/comments?media_id=xxx` - Fetch comments for a post

## Next Steps

Once you verify the Meta connection works:

1. **Set up Supabase** (follow `SETUP.md`)
2. **Run migration** (`supabase/migrations/001_initial_schema.sql`)
3. **Update OAuth callback** to store tokens in database
4. **Build ephemeral analyzer** for image/video/transcript analysis
5. **Add coach suggestions** engine

See `PLAN.md` for the full roadmap.

---

**Note:** This prototype stores tokens in cookies (httpOnly, secure). For production, tokens must be encrypted and stored in a database.
