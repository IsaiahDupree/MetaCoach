# MetaCoach Quick Start Guide

## 🚀 How to Get Your Access Token & Test AI Features

### Prerequisites
✅ ffmpeg installed (already done!)
✅ OpenAI API key (already added!)
✅ Meta App configured (already done!)

---

## Step 1: Deploy to Production

The app is already configured for your domain: **www.matrixloop.app**

### Deploy with Git
```bash
# Commit latest changes
git add -A
git commit -m "chore: add OpenAI API key for testing"
git push origin master
```

Vercel will automatically deploy! 🎉

---

## Step 2: Add OpenAI Key to Vercel

1. Go to: https://vercel.com/isaiah-duprees-projects/metacoach
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (starts with `sk-proj-...`)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Click **Save**
5. **Redeploy** the app (Deployments → ⋯ → Redeploy)

---

## Step 3: Get Your Meta Access Token

### 3.1 Open Your App
Navigate to: **https://www.matrixloop.app/connect**

### 3.2 Click "Quick Setup (Recommended)"
This starts the Instagram Business Login flow.

### 3.3 Log In to Facebook/Instagram
- Log in with your Instagram Business account
- Grant the requested permissions:
  - ✅ instagram_basic
  - ✅ instagram_manage_insights
  - ✅ pages_read_engagement
  - ✅ business_management
  - ✅ ads_read (optional)

### 3.4 Extract Your Access Token

**Method 1: Browser DevTools (Easiest) 👈 RECOMMENDED**

1. After successful login, you'll be on the dashboard
2. Press **F12** (or right-click → Inspect)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. In the left sidebar, expand **Cookies**
5. Click on **https://www.matrixloop.app**
6. Find the cookie named: **`meta_access_token`**
7. Click on it and copy the **Value** column
8. The token should start with `EAAG...` or `IGQ...`

**Method 2: Browser Console (Alternative)**

1. After successful login, press **F12**
2. Go to **Console** tab
3. Paste this JavaScript and press Enter:
```javascript
document.cookie.split('; ').find(row => row.startsWith('meta_access_token=')).split('=')[1]
```
4. The token will be printed
5. Copy the entire value (it's long!)

---

## Step 4: Add Token to .env.local

Open `.env.local` and add your token:

```bash
# Meta Access Token (get from OAuth flow - see instructions below)
META_ACCESS_TOKEN=PASTE_YOUR_TOKEN_HERE
```

**Example:**
```bash
META_ACCESS_TOKEN=EAAGcC88rBhYBP5TfY9ZC9ktbXuXTRvjJoYlxNBts14EhZBOqD6Ld66uUZCRwmZCT1MYydCC...
```

---

## Step 5: Test Media Analysis

Now you're ready to test! Run:

```bash
npm run test-media
```

### What This Does:

1. ✅ Connects to Instagram Graph API
2. ✅ Fetches your recent Instagram posts
3. ✅ Downloads a sample video or image
4. ✅ Runs AI analysis:
   - **For Videos:**
     - Generates transcript (Whisper)
     - Analyzes hook quality (first 3-5 seconds)
     - Scores visual quality
     - Provides recommendations
   - **For Images:**
     - Analyzes thumbnail quality
     - Scores clarity, composition, attention
     - Provides recommendations
5. ✅ Saves results to `test-output/` folder

### Expected Output:

```
=== MetaCoach Media Access Test ===

📋 Checking configuration...
✅ Environment variables configured

📱 Fetching Instagram account...
✅ Found Page: Your Page Name (123456789)
✅ Instagram Business Account ID: 17841401234567890

🎬 Fetching recent media...
✅ Found 10 media items

📊 Media Summary:
  1. VIDEO ✅ Check out this awesome...
  2. IMAGE ✅ Beautiful sunset...
  3. VIDEO ✅ Tutorial on...

🔍 Looking for a downloadable video...
✅ Found video: 17895695668004550

⬇️ Downloading video...
✅ Downloaded 12.34 MB
💾 Saved to: test-output\test-video-17895695668004550.mp4

🤖 Running AI analysis...
This may take 1-2 minutes...

✅ AI Analysis Complete!

=== RESULTS ===

📝 Transcript (1234 chars):
   "Hey everyone, in this video..."

🎣 Hook Analysis:
   Score: 85/100
   Strengths: 
     - Strong visual impact
     - Clear opening message
     - Engaging first frame
   
   Weaknesses:
     - Could be more concise
   
   Recommendations:
     - Start with a question to hook viewers
     - Show the payoff in first 3 seconds

⭐ Content Quality:
   Overall: 78/100
   Visual Appeal: 82/100
   Engagement: 75/100

💾 Full analysis saved to: test-output\analysis-17895695668004550.json

✅ Test completed successfully! 🎉
```

---

## Step 6: View Results

Check the `test-output/` folder:

```
test-output/
├── test-video-17895695668004550.mp4    # Downloaded video
├── analysis-17895695668004550.json     # Full AI analysis
└── README.txt                           # Analysis summary
```

**Open the JSON file** to see:
- Full transcript text
- Hook analysis with scores
- Frame-by-frame quality scores
- Detailed recommendations
- Processing metadata

---

## 🎯 Next Steps After Testing

Once you've verified everything works:

### 1. Test Dashboard Metrics
- Go to: https://www.matrixloop.app/dashboard
- Add the new components:
  - `<MetaStatusCard />` - API health
  - `<MetaMetricsCard />` - Performance metrics

### 2. Analyze More Content
```bash
# Analyze all recent videos
npm run test-media

# Check specific media by ID (modify script)
# or build UI for bulk analysis
```

### 3. Build Production Features
- Schedule automatic analysis of new posts
- Store results in Supabase
- Build UI to display insights
- Create recommendation engine
- Add export to CSV

---

## 🐛 Troubleshooting

### "No access token found"
**Solution:** Complete Step 3 above to get your token from the OAuth flow

### "Invalid OAuth access token"
**Solution:** Token expired - repeat Step 3 to get a fresh token

### "No Instagram Business Account found"
**Solution:** 
1. Go to Instagram settings
2. Switch to Business or Creator account
3. Link to a Facebook Page

### "No Facebook Pages found"
**Solution:** Create a Facebook Page and link your Instagram Business account to it

### "ffmpeg is not installed"
**Solution:** Already installed! ✅ (If you get this error, run: `choco install ffmpeg`)

### "Failed to download media (copyrighted content)"
**Solution:** Instagram blocks download of media with copyrighted music. Try testing with a different post.

### "429 Too Many Requests"
**Solution:** Hit OpenAI rate limits. Wait a few minutes or upgrade your OpenAI tier.

---

## 📝 Token Expiry

Meta access tokens expire after **60 days** (if using long-lived token).

**To refresh:**
1. Go to https://www.matrixloop.app/connect
2. Complete OAuth flow again
3. Copy new token
4. Update `.env.local`

**Tip:** Set a calendar reminder for 55 days from now! 📅

---

## 🎊 You're All Set!

**What you can do now:**
- ✅ Download Instagram media
- ✅ Analyze videos with AI (transcripts, hooks, quality)
- ✅ Analyze images (thumbnails, composition)
- ✅ Get actionable recommendations
- ✅ Monitor API health
- ✅ Track performance metrics
- ✅ View organic + ad data

**Cost per analysis:**
- Video: ~$0.08-0.15 (varies by length)
- Image: ~$0.01-0.03

Ready to build amazing content insights! 🚀

---

## 📞 Need Help?

Check the detailed docs:
- [MEDIA_ANALYSIS_SETUP.md](./MEDIA_ANALYSIS_SETUP.md) - Complete AI analysis guide
- [DASHBOARD_INTEGRATION.md](./DASHBOARD_INTEGRATION.md) - Dashboard setup
- [PERMISSIONS_2025_UPDATE.md](./PERMISSIONS_2025_UPDATE.md) - API permissions
- [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) - OAuth flow details
