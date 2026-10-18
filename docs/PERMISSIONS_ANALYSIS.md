# MetaCoach Permissions Analysis

## App Scope & Purpose

**MetaCoach** is an AI-powered content analysis and coaching platform for Instagram and Facebook creators that:

- Downloads media **ephemerally** for analysis (then deletes immediately)
- Provides **goal-driven coaching** (optimize for clicks, engagement, followers, views, revenue)
- Analyzes **content quality** (frames, thumbnails, hooks, transcripts)
- Tracks **engagement metrics** and sentiment from comments
- Offers **smart suggestions** for improving content performance
- Supports **multi-tenant** architecture (personal + customer accounts)

---

## Current Permissions (What You Have)

### ✅ Currently Implemented

```typescript
// lib/meta-business-login.ts
const scopes = [
  'instagram_basic',              // ✅
  'instagram_content_publish',    // ✅
  'instagram_manage_comments',    // ✅
  'instagram_manage_insights',    // ✅
  'pages_show_list',              // ✅
  'pages_read_engagement',        // ✅
  'business_management',          // ✅
  'pages_read_user_content',      // ✅
  'ads_read',                     // ✅
  'read_insights',                // ✅
]
```

---

## Detailed Permission Breakdown

### 📸 Instagram Content & Media

#### `instagram_basic` ✅ **HAVE IT**
**What you can do:**
- Read user profile (username, account type, media count)
- Access basic account information
- View media IDs

**What you CANNOT do:**
- Access media URLs, captions, or metadata
- Download photos/videos
- See detailed media information

**For MetaCoach:**
- ✅ Can identify the account
- ❌ **CANNOT download media for analysis** (need `instagram_manage_media`)

---

#### `instagram_manage_media` ❌ **MISSING - CRITICAL**
**What you can do:**
- Read media objects (photos, videos, carousels)
- Access media URLs for downloading
- Get captions, timestamps, media type
- Access permalink URLs

**What you CANNOT do:**
- Create or publish media (need `instagram_content_publish`)
- Delete media

**For MetaCoach:**
- ✅ **REQUIRED** - Download videos/images for AI analysis
- ✅ **REQUIRED** - Extract frames for thumbnail scoring
- ✅ **REQUIRED** - Get video URLs for transcript generation
- ✅ **REQUIRED** - Access captions for content analysis

**Status:** 🔴 **CRITICAL MISSING PERMISSION**

---

#### `instagram_content_publish` ✅ **HAVE IT**
**What you can do:**
- Publish photos and videos
- Create carousel posts
- Publish stories
- Schedule posts

**What you CANNOT do:**
- Publish Reels (need `instagram_manage_media`)
- Auto-publish (requires manual review)

**For MetaCoach:**
- ⚠️ **OPTIONAL** - If you want to auto-post optimized content
- ⚠️ Currently have it, but may not need it for analytics-focused app

---

### 💬 Comments & Engagement

#### `instagram_manage_comments` ✅ **HAVE IT**
**What you can do:**
- Read comments on media
- Reply to comments
- Hide/unhide comments
- Delete comments
- Enable/disable comments

**For MetaCoach:**
- ✅ **REQUIRED** - Sentiment analysis from comments
- ✅ **REQUIRED** - Track engagement patterns
- ✅ **REQUIRED** - Identify top commenters

**Status:** ✅ **HAVE IT - GOOD**

---

### 📊 Analytics & Insights

#### `instagram_manage_insights` ✅ **HAVE IT**
**What you can do:**
- Read media insights (reach, impressions, engagement)
- Access account insights (follower demographics)
- Get story insights
- View video views, saves, shares

**For MetaCoach:**
- ✅ **REQUIRED** - Track performance metrics
- ✅ **REQUIRED** - Measure content effectiveness
- ✅ **REQUIRED** - Goal tracking (clicks, engagement, views)

**Status:** ✅ **HAVE IT - GOOD**

---

### 📄 Facebook Pages

#### `pages_show_list` ✅ **HAVE IT**
**What you can do:**
- List Pages the user manages
- Get Page IDs and names
- Check Page roles

**For MetaCoach:**
- ✅ **REQUIRED** - Connect Instagram Business account (linked to Page)
- ✅ **REQUIRED** - Multi-account support

**Status:** ✅ **HAVE IT - GOOD**

---

#### `pages_read_engagement` ✅ **HAVE IT**
**What you can do:**
- Read post engagement (likes, comments, shares)
- Access Page insights
- View post performance

**For MetaCoach:**
- ✅ **USEFUL** - Cross-platform analytics (IG + FB)
- ✅ **USEFUL** - Compare performance across platforms

**Status:** ✅ **HAVE IT - GOOD**

---

#### `pages_read_user_content` ✅ **HAVE IT**
**What you can do:**
- Read posts published by Page
- Access Page photos and videos
- Get post metadata

**For MetaCoach:**
- ✅ **USEFUL** - Analyze Facebook content alongside Instagram
- ✅ **USEFUL** - Multi-platform coaching

**Status:** ✅ **HAVE IT - GOOD**

---

### 💼 Business & Ads

#### `business_management` ✅ **HAVE IT**
**What you can do:**
- Manage business assets
- Access Business Manager
- Link Instagram accounts to Pages

**For MetaCoach:**
- ✅ **REQUIRED** - Essential for Instagram Business API access
- ✅ **REQUIRED** - Multi-tenant account management

**Status:** ✅ **HAVE IT - GOOD**

---

#### `ads_read` ✅ **HAVE IT**
**What you can do:**
- View ad accounts
- Read campaigns, ad sets, ads
- Access ad insights and metrics
- See ad spend and performance

**What you CANNOT do:**
- Create, update, or delete ads (need `ads_management`)

**For MetaCoach:**
- ✅ **USEFUL** - Compare organic vs paid performance
- ✅ **USEFUL** - ROI tracking for paid content
- ✅ **USEFUL** - Identify top-performing ad creative

**Status:** ✅ **HAVE IT - GOOD**

---

#### `read_insights` ✅ **HAVE IT**
**What you can do:**
- Read Page insights
- Access ad insights
- View aggregated metrics

**For MetaCoach:**
- ✅ **REQUIRED** - Performance tracking
- ✅ **REQUIRED** - Goal measurement

**Status:** ✅ **HAVE IT - GOOD**

---

## Missing Permissions Analysis

### 🔴 CRITICAL MISSING

#### `instagram_manage_media` - **MUST HAVE**
**Why you need it:**
- Cannot download videos/images without it
- Cannot access media URLs
- Cannot get video files for transcript generation
- Cannot extract frames for thumbnail analysis

**Impact on MetaCoach:**
- ❌ **BLOCKS CORE FEATURE**: Cannot download media for AI analysis
- ❌ **BLOCKS CORE FEATURE**: Cannot generate transcripts (Whisper)
- ❌ **BLOCKS CORE FEATURE**: Cannot score thumbnails/frames (GPT-4 Vision)
- ❌ **BLOCKS CORE FEATURE**: Cannot analyze hook strength (first 3-5s)

**App Review Required:** ✅ Yes
**Justification:** "Download user's media ephemerally for AI-powered content analysis (frame quality, hook strength, transcript generation), then immediately delete per privacy-first architecture"

---

### 🟡 OPTIONAL BUT USEFUL

#### `instagram_shopping_tag_products` - **OPTIONAL**
**What you can do:**
- Tag products in posts
- Access shopping insights
- Manage product catalog

**For MetaCoach:**
- ⚠️ **OPTIONAL** - If tracking e-commerce goals (revenue optimization)
- ⚠️ **OPTIONAL** - Product tagging recommendations

**App Review Required:** ✅ Yes

---

#### `pages_manage_posts` - **OPTIONAL**
**What you can do:**
- Create, update, delete Page posts
- Schedule posts
- Publish on behalf of Page

**For MetaCoach:**
- ⚠️ **OPTIONAL** - If implementing auto-posting feature
- ⚠️ **OPTIONAL** - Cross-posting to Facebook

**App Review Required:** ✅ Yes

---

#### `pages_messaging` - **OPTIONAL**
**What you can do:**
- Send and receive messages
- Manage conversations
- Auto-respond to DMs

**For MetaCoach:**
- ⚠️ **OPTIONAL** - If adding DM engagement coaching
- ⚠️ **OPTIONAL** - Response time analytics

**App Review Required:** ✅ Yes

---

## Recommended Permissions for MetaCoach

### Minimum Viable Product (MVP)

```typescript
const requiredScopes = [
  // Instagram - CRITICAL
  'instagram_basic',              // ✅ Have - Account info
  'instagram_manage_media',       // ❌ NEED - Download media for analysis
  'instagram_manage_insights',    // ✅ Have - Performance metrics
  'instagram_manage_comments',    // ✅ Have - Sentiment analysis
  
  // Facebook Pages - REQUIRED
  'pages_show_list',              // ✅ Have - List connected Pages
  'pages_read_engagement',        // ✅ Have - Engagement metrics
  'pages_read_user_content',      // ✅ Have - Read posts
  
  // Business - REQUIRED
  'business_management',          // ✅ Have - Business assets
  'read_insights',                // ✅ Have - Insights data
  
  // Ads - USEFUL
  'ads_read',                     // ✅ Have - Ad performance
]
```

### Full Feature Set

```typescript
const fullScopes = [
  // MVP scopes above, plus:
  
  // Publishing (if auto-posting)
  'instagram_content_publish',    // ✅ Have - Publish content
  'pages_manage_posts',           // ❌ Optional - FB auto-posting
  
  // Shopping (if e-commerce focus)
  'instagram_shopping_tag_products', // ❌ Optional - Product insights
  
  // Messaging (if DM coaching)
  'pages_messaging',              // ❌ Optional - DM analytics
]
```

---

## What You Can Do NOW vs. What You NEED

### ✅ What Works NOW (Without `instagram_manage_media`)

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication | ✅ Working | OAuth flow complete |
| List Instagram accounts | ✅ Working | Can see account info |
| View post IDs | ✅ Working | Can list media IDs |
| Read comments | ✅ Working | Full comment access |
| Sentiment analysis | ✅ Working | Can analyze comments |
| View insights/metrics | ✅ Working | Engagement, reach, impressions |
| Track performance | ✅ Working | All analytics available |
| List ad accounts | ✅ Working | Can see ad data |
| View ad performance | ✅ Working | ROI tracking possible |

### ❌ What's BLOCKED (Without `instagram_manage_media`)

| Feature | Status | Impact |
|---------|--------|--------|
| Download videos | ❌ BLOCKED | **Cannot analyze video content** |
| Download images | ❌ BLOCKED | **Cannot score thumbnails** |
| Extract video frames | ❌ BLOCKED | **Cannot analyze hook quality** |
| Generate transcripts | ❌ BLOCKED | **Cannot use Whisper API** |
| Analyze captions | ⚠️ LIMITED | Can see via insights, but not full text |
| Frame quality scoring | ❌ BLOCKED | **Cannot use GPT-4 Vision** |
| Hook strength analysis | ❌ BLOCKED | **Cannot analyze first 3-5s** |
| Content recommendations | ⚠️ LIMITED | Only based on metrics, not content |

---

## App Review Strategy

### Phase 1: Launch with Current Permissions ✅

**What you can build:**
- ✅ Engagement analytics dashboard
- ✅ Comment sentiment analysis
- ✅ Performance tracking over time
- ✅ Goal measurement (clicks, engagement, views)
- ✅ Ad performance comparison
- ✅ Multi-account management

**Limitations:**
- ❌ No AI content analysis (videos/images)
- ❌ No transcript generation
- ❌ No thumbnail scoring
- ❌ No hook strength analysis

**Value Proposition:**
"Analytics and engagement coaching based on metrics and comment sentiment"

---

### Phase 2: Submit for `instagram_manage_media` 🎯

**Preparation:**
1. Build working MVP with current permissions
2. Document privacy-first architecture (ephemeral downloads)
3. Create demo video showing:
   - User uploads content
   - App downloads media temporarily
   - AI analyzes content (frames, transcript, hooks)
   - App deletes media immediately
   - User sees recommendations
4. Write detailed use case:
   - "Enable AI-powered content analysis for creators"
   - "Download media ephemerally for quality scoring"
   - "Generate transcripts for content optimization"
   - "Analyze hook strength in first 3-5 seconds"
   - "All media deleted immediately after analysis"

**Timeline:** 3-7 days for review

**Success Criteria:**
- Clear privacy policy
- Working demo
- Legitimate business use case
- No data retention (ephemeral only)

---

### Phase 3: Optional Advanced Features

**If needed later:**
- `pages_manage_posts` - Auto-posting optimized content
- `instagram_shopping_tag_products` - E-commerce coaching
- `pages_messaging` - DM engagement coaching

---

## Immediate Action Items

### 1. Add Missing Permission ✅

Update both OAuth flows:

```typescript
// lib/meta-business-login.ts
const scopes = [
  'instagram_basic',
  'instagram_manage_media',        // ➕ ADD THIS
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
  'pages_read_user_content',
  'ads_read',
  'read_insights',
].join(',')
```

```typescript
// lib/meta.ts - getMetaAuthUrl()
scope: 'instagram_basic,instagram_manage_media,instagram_manage_insights,...'
```

### 2. Update Meta App Settings

Add to **Valid OAuth Redirect URIs**:
- Already configured ✅

Add to **App Domains**:
- Already configured ✅

### 3. Test Locally

```bash
# Test with new permission
npm run dev
# Visit http://localhost:3000/connect
# Complete OAuth flow
# Check granted permissions
```

### 4. Submit for App Review

**When ready:**
1. Go to Meta App Dashboard → App Review
2. Request `instagram_manage_media`
3. Provide use case documentation
4. Submit demo video
5. Wait 3-7 days

---

## Summary

### Current State: 🟡 Partially Functional

**What works:**
- ✅ Authentication & account management
- ✅ Metrics & analytics tracking
- ✅ Comment sentiment analysis
- ✅ Performance monitoring
- ✅ Ad performance tracking

**What's blocked:**
- ❌ AI content analysis (videos/images)
- ❌ Transcript generation
- ❌ Thumbnail/frame scoring
- ❌ Hook strength analysis

### Required Action: Add `instagram_manage_media`

**Priority:** 🔴 **CRITICAL**
**Effort:** Low (just add to scope)
**App Review:** Required (3-7 days)
**Impact:** Unlocks all core AI features

### Recommendation

1. **Immediate:** Add `instagram_manage_media` to scopes
2. **Short-term:** Build MVP with current permissions (analytics focus)
3. **Medium-term:** Submit for app review with demo
4. **Long-term:** Add optional permissions as features expand

---

**Bottom Line:** You're **90% there** on permissions! Just need `instagram_manage_media` to unlock the AI-powered content analysis features that make MetaCoach unique. Everything else you already have. 🎉
