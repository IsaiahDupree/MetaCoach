# 🔑 How to Get Your Meta Access Token

## Quick Steps (5 minutes)

### Step 1: Add OpenAI Key to Vercel

1. Go to: https://vercel.com/isaiah-duprees-projects/metacoach/settings/environment-variables
2. Click **Add New** (top right)
3. Fill in:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key from https://platform.openai.com/api-keys (starts with `sk-proj-...`)
   - Check: ✅ Production ✅ Preview ✅ Development
4. Click **Save**
5. Go to **Deployments** tab → Click ⋯ on latest deployment → **Redeploy**

Wait ~2 minutes for deployment to complete.

---

### Step 2: Complete OAuth Flow

1. **Open your app:** https://www.matrixloop.app/connect

2. **Click:** "Quick Setup (Recommended)" button

3. **Log in** to Facebook/Instagram with your account

4. **Grant permissions** when prompted

5. You'll be redirected back to: https://www.matrixloop.app/dashboard

---

### Step 3: Extract Access Token

**EASIEST METHOD: DevTools Cookie Viewer**

1. While on the dashboard page, press **F12** (or right-click → Inspect)

2. Click **Application** tab (Chrome) or **Storage** tab (Firefox)

3. In left sidebar under **Storage**, expand **Cookies**

4. Click on: `https://www.matrixloop.app`

5. Find cookie named: **`meta_access_token`**

6. Click on it → Copy the **Value** column (the long text)
   - Should start with `EAAG...` or `IGQ...`
   - Will be ~200-300 characters long

7. Paste into `.env.local`:
   ```
   META_ACCESS_TOKEN=paste_your_token_here
   ```

**ALTERNATIVE METHOD: Console Command**

1. Press **F12** → Go to **Console** tab

2. Paste this and press Enter:
   ```javascript
   document.cookie.split('; ').find(row => row.startsWith('meta_access_token=')).split('=')[1]
   ```

3. The token will be printed → Copy it

4. Paste into `.env.local`:
   ```
   META_ACCESS_TOKEN=paste_your_token_here
   ```

---

### Step 4: Test It!

Run the test script:
```bash
npm run test-media
```

You should see:
```
=== MetaCoach Media Access Test ===

📋 Checking configuration...
✅ Environment variables configured

📱 Fetching Instagram account...
✅ Found Page: Your Page Name
✅ Instagram Business Account ID: 123456789

🎬 Fetching recent media...
✅ Found X media items

⬇️ Downloading video...
✅ Downloaded

🤖 Running AI analysis...
✅ AI Analysis Complete!
```

Results will be saved in `test-output/` folder!

---

## 🐛 Troubleshooting

**"META_ACCESS_TOKEN not found"**
→ Make sure you pasted the token in `.env.local` line 15

**"Invalid OAuth access token"**
→ Token expired - redo Step 2 & 3 to get a fresh token

**"No Instagram Business Account found"**
→ Make sure you're using an Instagram Business account (not Personal)
→ Link it to a Facebook Page in Instagram settings

**"No Facebook Pages found"**
→ Create a Facebook Page
→ Link your Instagram Business account to it

---

## ✅ Done!

Once you have your `META_ACCESS_TOKEN` in `.env.local`, you can:
- Run `npm run test-media` to analyze content
- Test dashboard components
- Build production features

Token expires in **60 days** - mark your calendar! 📅
