# Access Token Configuration Guide

## ⚠️ SECURITY WARNING

**NEVER commit or share your access tokens publicly!** 

The tokens you shared contain full access to your accounts. Keep them secure in `.env.local` (which is gitignored).

---

## Your Access Tokens (Organized)

Based on what you provided, here's how to organize your tokens:

### 1. Instagram API
```env
# Instagram App
META_APP_ID=602248125600338
META_APP_SECRET=${META_APP_SECRET}
INSTAGRAM_ACCESS_TOKEN=${INSTAGRAM_ACCESS_TOKEN}
```

### 2. Facebook Ads & Marketing
```env
# Main Ads Token (with ads_read + business_management)
FACEBOOK_ADS_ACCESS_TOKEN=${FACEBOOK_ADS_ACCESS_TOKEN}

# Alternative Ads Token (with additional permissions)
FACEBOOK_ADS_TOKEN_ALT=${FACEBOOK_ACCESS_TOKEN}

# Ad Account ID
AD_ACCOUNT_ID=act_1130334212412487
```

### 3. WhatsApp Business
```env
WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
WHATSAPP_PHONE_NUMBER_ID=851190418074116
```

---

## Setup Instructions

### 1. Create Your `.env.local` File

```bash
# Copy from example
cp .env.example .env.local
```

### 2. Add Your Tokens

Open `.env.local` and add:

```env
# Meta / Facebook Apps
META_APP_ID=602248125600338
META_APP_SECRET=${META_APP_SECRET}
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback
PUBLIC_BASE_URL=http://localhost:3000

# Instagram
INSTAGRAM_ACCESS_TOKEN=${INSTAGRAM_ACCESS_TOKEN}

# Facebook Ads
FACEBOOK_ADS_ACCESS_TOKEN=${FACEBOOK_ADS_ACCESS_TOKEN}
AD_ACCOUNT_ID=act_1130334212412487

# WhatsApp (optional - for future WhatsApp features)
WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
WHATSAPP_PHONE_NUMBER_ID=851190418074116
```

### 3. Restart the Dev Server

If it's running, restart it:

```bash
# Stop with Ctrl+C
# Then restart:
npm run dev
```

---

## Testing Your APIs

The app is now running at **http://localhost:3000**

### Available API Endpoints

#### Instagram
- `GET /api/meta/me` - Get your Facebook pages
- `GET /api/meta/media?ig_user_id=<ID>` - Get Instagram posts
- `GET /api/meta/comments?media_id=<ID>` - Get post comments

#### Facebook Pages
- `GET /api/meta/facebook/posts?page_id=<ID>` - Get Facebook page posts

#### Ads & Marketing
- `GET /api/meta/ads/accounts` - Get your ad accounts
- `GET /api/meta/ads/campaigns?ad_account_id=<ID>` - Get campaigns

#### Threads
- `GET /api/meta/threads?threads_user_id=<ID>` - Get Threads posts

---

## Testing with cURL

### Get Ad Accounts
```bash
# Using your ads token
curl -X GET "http://localhost:3000/api/meta/ads/accounts" \
  -H "Cookie: meta_access_token=YOUR_ADS_TOKEN"
```

### Get Campaigns
```bash
curl -X GET "http://localhost:3000/api/meta/ads/campaigns?ad_account_id=act_1130334212412487" \
  -H "Cookie: meta_access_token=YOUR_ADS_TOKEN"
```

---

## Understanding Your Tokens

### Instagram Token
- **Permissions**: `instagram_basic`, `instagram_manage_insights`
- **Use for**: Fetching posts, insights, comments from Instagram

### Facebook Ads Token
- **Permissions**: `ads_read`, `business_management`, `read_insights`
- **Use for**: Viewing ad campaigns, ad sets, ad performance
- **Ad Account ID**: `act_1130334212412487`

### WhatsApp Token
- **Permissions**: `whatsapp_business_messaging`
- **Use for**: Sending WhatsApp messages (future feature)
- **Phone Number ID**: `851190418074116`

---

## Next Steps

1. **Test OAuth Flow**: Visit http://localhost:3000 and connect via OAuth
2. **View Dashboard**: After connecting, see your Instagram analytics
3. **Test Ads API**: Use your ads token to view campaign performance
4. **Explore Threads**: If you have Threads, test the Threads endpoints

---

## Token Security Best Practices

✅ **DO:**
- Store tokens in `.env.local` (gitignored)
- Rotate tokens regularly
- Use different tokens for dev/prod
- Set appropriate permissions (least privilege)

❌ **DON'T:**
- Commit tokens to git
- Share tokens in chat/email
- Use production tokens in development
- Give tokens more permissions than needed

---

## Troubleshooting

### "Not authenticated" error
- Make sure you've either:
  - Completed OAuth flow (automatic token in cookie), OR
  - Manually set the cookie with your token

### "Invalid token" error
- Token may be expired - get a new long-lived token
- Check token has the required permissions

### "Unsupported request" error
- Some endpoints require specific Meta app configuration
- Check your app has the necessary products added

---

## OAuth vs Direct Token

**OAuth Flow** (Recommended for production):
- User authorizes app
- Secure token exchange
- 60-day long-lived tokens
- Stored in httpOnly cookies

**Direct Token** (Quick testing):
- Copy token from Meta developer dashboard
- Manually set in `.env.local`
- Good for API testing
- Not suitable for production

---

**Ready to test!** 🚀  
Open http://localhost:3000 to start.
