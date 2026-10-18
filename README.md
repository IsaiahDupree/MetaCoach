# Creator Coach

AI-powered content analysis and coaching platform for Instagram and Facebook creators.

## What It Does

- **Privacy-First**: Downloads media ephemerally for analysis, then deletes it immediately
- **Multi-Tenant**: Supports personal account (full features) + customer accounts (configurable)
- **Goal-Driven Coaching**: Optimizes for link clicks, engagement, followers, views, or revenue
- **Automated Analysis**: 
  - Frame/thumbnail quality scoring
  - Hook strength (first 3-5s retention)
  - Transcript generation and analysis
  - Sentiment analysis from comments
  - Engagement metrics tracking
- **Smart Suggestions**: Actionable recommendations for hooks, thumbnails, and captions
- **Check-Backs**: Scheduled metric updates to track performance over time

## Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript, TailwindCSS
- **Database**: Supabase (Postgres)
- **AI**: OpenAI (GPT-4o, Vision, Whisper)
- **Meta**: Instagram Graph API, Facebook Graph API
- **Hosting**: Vercel

## Quick Start (Frontend Prototype)

**Test Meta API connectivity first, build backend later!**

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Meta App & Configure OAuth

1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App (Business type)
2. Add **Instagram Graph API** product
3. Set OAuth redirect: `http://localhost:3000/api/meta/oauth/callback`
4. Copy your App ID and Secret

### 3. Environment Variables

Create `.env.local`:

```env
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback
PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run & Test

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Connect Instagram → See your posts!

**📖 Full guide:** See [QUICKSTART.md](./QUICKSTART.md) for detailed setup and troubleshooting.

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)**: 5-minute setup to test Meta API (no database needed)
- **[SETUP.md](./SETUP.md)**: Full production setup (Supabase, OpenAI, etc.)
- **[PLAN.md](./PLAN.md)**: Complete build roadmap and architecture

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── meta/
│   │   │   └── oauth/         # Meta OAuth flow
│   │   └── facebook/
│   │       └── data-deletion/ # Meta compliance endpoint
│   └── ...                    # Pages (to be built)
├── lib/
│   ├── meta.ts               # Meta Graph API client
│   ├── openai.ts             # OpenAI helpers
│   ├── supabase.ts           # Database client
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utilities
├── supabase/
│   └── migrations/           # Database schema
├── PLAN.md                   # Build plan
└── SETUP.md                  # Setup guide
```

## Current Status

✅ **Frontend Prototype Complete**
- [x] Meta OAuth flow (cookie-based auth)
- [x] Fetch Instagram pages and media
- [x] Display posts with engagement metrics
- [x] Real-time data from Instagram Graph API
- [x] Clean, responsive dashboard UI

✅ **Production Infrastructure Ready**
- [x] Database schema designed (Supabase migration ready)
- [x] Data deletion callback (Meta compliance)
- [x] Full documentation and build plan

🚧 **Next Steps** (Backend Integration):
- [ ] Set up Supabase and run migrations
- [ ] Move token storage from cookies to database
- [ ] Implement ephemeral media analysis worker
- [ ] Add coach suggestion engine with OpenAI
- [ ] Build check-back scheduler for metrics tracking

## Meta Permissions Required

- `instagram_basic` - Profile and media access
- `instagram_manage_insights` - Metrics and insights
- `pages_read_engagement` - Comments and engagement

## Privacy & Compliance

- **No Media Storage**: Media files are downloaded temporarily for analysis only, then immediately deleted
- **Data Deletion**: Full compliance with Meta's data deletion requirements
- **Transparent**: Clear privacy policy and data usage terms
- **User Control**: Per-tenant policy flags for feature toggles

## Cost Estimates (Monthly)

- **Supabase**: Free tier or $25/month (Pro)
- **OpenAI**: $10-50/month (usage-based)
- **Vercel**: Free (Hobby) or $20/month (Pro)

**Total**: ~$35-95/month for MVP

## License

Private - All Rights Reserved

---

_Built with ❤️ for creators who want data-driven insights_
