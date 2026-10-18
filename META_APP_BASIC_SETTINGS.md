# Meta App Basic Settings Configuration

## 📱 App Information

**App ID**: `453049510987286`  
**App Mode**: Development (switch to Live after App Review)  
**App Type**: Business  
**Settings URL**: https://developers.facebook.com/apps/453049510987286/settings/basic/

---

## 🔐 App Credentials

### App ID
```
453049510987286
```
**Status**: Cannot be changed (automatically assigned)

### App Secret
```
576fc7ec240b308263fcd1b79ec830ec
```
**⚠️ KEEP SECURE**: Never commit to Git or expose publicly  
**Location**: Stored in `.env.local` as `META_APP_SECRET`

### Display Name
```
MetaCoach
```
**Purpose**: Shown to users during OAuth login  
**Recommendation**: Keep it simple and professional

### Namespace
```
metacoach
```
**Purpose**: Used for app URLs and identifiers  
**Format**: Lowercase, no spaces, alphanumeric only

---

## 🌐 Domain Configuration

### App Domains
```
matrixloop.app
www.matrixloop.app
localhost
```

**Purpose**: Whitelist domains where your app runs  
**Format**: One domain per line, no http:// or https://  
**Important**: Must include both apex (matrixloop.app) and www (www.matrixloop.app)

---

## 📧 Contact Information

### Contact Email
```
your-email@matrixloop.app
```
**Purpose**: Facebook uses this to contact you about your app  
**Recommendation**: Use a monitored business email

---

## 📄 Legal & Privacy URLs

### Privacy Policy URL
```
https://www.matrixloop.app/legal/privacy
```

**Purpose**: Required by Meta for all apps  
**Status**: ⚠️ **NEEDS IMPLEMENTATION**  
**Action Required**: Create privacy policy page

**What to Include**:
- What data you collect (Instagram posts, insights, comments)
- How you use it (analysis, coaching suggestions)
- Data retention policy (ephemeral - not stored permanently)
- User rights (access, deletion, opt-out)
- Contact information

### Terms of Service URL
```
https://www.matrixloop.app/legal/terms
```

**Purpose**: Legal agreement with users  
**Status**: ⚠️ **NEEDS IMPLEMENTATION**  
**Action Required**: Create terms of service page

**What to Include**:
- Service description
- User responsibilities
- Acceptable use policy
- Limitation of liability
- Termination conditions

---

## 🗑️ User Data Deletion

### Data Deletion Instructions URL
```
https://www.matrixloop.app/api/facebook/data-deletion
```

**Purpose**: Required endpoint for GDPR/privacy compliance  
**Status**: ✅ **ALREADY IMPLEMENTED**  
**Location**: `/app/api/facebook/data-deletion/route.ts`

**Response Format**:
```json
{
  "url": "https://www.matrixloop.app/data-deletion-status/[confirmation_code]",
  "confirmation_code": "unique-deletion-id"
}
```

---

## 🎨 App Icon (1024 x 1024)

### Recommended Icon
**Status**: ⏳ **OPTIONAL** (not required for development)

**Specifications**:
- Size: 1024 x 1024 pixels
- Format: PNG or JPG
- Content: MetaCoach logo or brand mark
- Background: Solid color or transparent

**Where It Appears**:
- OAuth login dialog
- App directory (when public)
- User's connected apps list

---

## 📂 Category

### Selected Category
```
Entertainment
```

**Alternative Options** (if you want to change):
- Business Tools
- Analytics & Insights
- Social Media Management
- Content Creation

**Recommendation**: Consider "Business Tools" or "Analytics & Insights" as it better describes MetaCoach's purpose.

---

## ✅ Verifications

### Business Verification
**Status**: ✅ **VERIFIED**  
**Business**: Isaiah Dupree  
**ID**: 994932274952361

**Purpose**: Required for advanced access to user data  
**Enables**: 
- Advanced permissions (instagram_manage_insights, etc.)
- Live mode operation
- Access to business features

### Access Verification
**Status**: ⏳ **NOT STARTED**

**Purpose**: Required for Tech Providers accessing other businesses' Meta assets  
**When Needed**: If you plan to access multiple business accounts (multi-tenant)

**Action Required**:
1. Click "Verify that your business is a Tech Provider"
2. Provide business documentation
3. Explain your use case (Creator Coach SaaS)
4. Wait 5 days for review

**For MVP**: You can skip this initially if only using your own accounts for testing.

---

## 🇪🇺 GDPR - Data Protection Officer (DPO)

### Status
**Status**: ⏳ **OPTIONAL** (but recommended for EU users)

### If You Serve EU Customers

**Name** (Optional):
```
Isaiah Dupree
```

**Email**:
```
privacy@matrixloop.app
```

**Address**:
```
Street Address: [Your business address]
Apt/Suite/Other: [Optional]
City/District: [Your city]
State/Province/Region: [Your state]
ZIP/Postal Code: [Your ZIP]
Country: United States
```

**Purpose**: EU users can contact this person about data processing  
**Visibility**: Shown to Facebook users viewing your app info

### If You Don't Serve EU Customers
Leave blank for now. Add later if needed.

---

## 📋 Complete Configuration Checklist

### ✅ Required for Development

- [x] App ID: Set (453049510987286)
- [x] App Secret: Set (keep secure)
- [ ] Display Name: "MetaCoach"
- [ ] Namespace: "metacoach"
- [ ] App Domains: matrixloop.app, www.matrixloop.app, localhost
- [ ] Contact Email: your-email@matrixloop.app
- [ ] Privacy Policy URL: https://www.matrixloop.app/legal/privacy
- [ ] Terms of Service URL: https://www.matrixloop.app/legal/terms
- [ ] Data Deletion URL: https://www.matrixloop.app/api/facebook/data-deletion
- [x] Business Verification: Complete

### ⏳ Required Before Going Live

- [ ] Privacy Policy page created and public
- [ ] Terms of Service page created and public
- [ ] Data Deletion endpoint tested and working
- [ ] App Icon uploaded (1024x1024)
- [ ] Category set appropriately
- [ ] Access Verification (if multi-tenant)
- [ ] DPO contact info (if serving EU)

### 🔮 Optional but Recommended

- [ ] Professional app icon
- [ ] DPO contact information
- [ ] Detailed privacy policy
- [ ] Comprehensive terms of service

---

## 🚀 Immediate Action Items

### 1. Update App Domains (NOW)

Add these three domains:
```
matrixloop.app
www.matrixloop.app
localhost
```

### 2. Set Display Name & Namespace

```
Display Name: MetaCoach
Namespace: metacoach
```

### 3. Add Contact Email

```
Contact Email: [your-email]@matrixloop.app
```

### 4. Create Legal Pages (URGENT)

You need to create these pages before testing with non-development users:

**Create**: `/app/legal/privacy/page.tsx`  
**Create**: `/app/legal/terms/page.tsx`

### 5. Set URLs

```
Privacy Policy: https://www.matrixloop.app/legal/privacy
Terms of Service: https://www.matrixloop.app/legal/terms
Data Deletion: https://www.matrixloop.app/api/facebook/data-deletion
```

---

## 📝 Sample Privacy Policy Structure

Create a simple privacy policy at `/app/legal/privacy/page.tsx`:

```markdown
# Privacy Policy for MetaCoach

**Last Updated**: [Date]

## What We Collect
- Instagram account information (username, profile data)
- Instagram posts and media metadata
- Post insights and analytics
- Comments and engagement data

## How We Use Your Data
- Analyze content performance
- Generate coaching suggestions
- Display insights dashboard
- Improve service quality

## Data Retention
- Media files: Downloaded temporarily for analysis, then deleted
- Insights data: Stored for dashboard display
- Comments: Stored for sentiment analysis

## Your Rights
- Access your data
- Request data deletion
- Opt-out of analysis
- Disconnect your account

## Data Deletion
You can request deletion at: [Data Deletion URL]

## Contact
Email: privacy@matrixloop.app
```

---

## 📝 Sample Terms of Service Structure

Create terms at `/app/legal/terms/page.tsx`:

```markdown
# Terms of Service for MetaCoach

**Last Updated**: [Date]

## Service Description
MetaCoach provides Instagram analytics and content coaching.

## Acceptable Use
- Use for your own accounts or accounts you manage
- Do not abuse API rate limits
- Do not scrape or redistribute data

## Account Termination
We may suspend access for Terms violations.

## Limitation of Liability
Service provided "as is" without warranties.

## Contact
Email: support@matrixloop.app
```

---

## 🧪 Testing Your Configuration

### 1. Verify App Domains
- Visit your app
- Check OAuth flow works
- Ensure no domain errors

### 2. Test Privacy Policy URL
```bash
curl https://www.matrixloop.app/legal/privacy
# Should return 200 OK
```

### 3. Test Terms URL
```bash
curl https://www.matrixloop.app/legal/terms
# Should return 200 OK
```

### 4. Test Data Deletion
```bash
curl https://www.matrixloop.app/api/facebook/data-deletion
# Should return JSON with confirmation_code
```

---

## 🚨 Common Issues

### "Invalid App Domains"
**Cause**: Domain format incorrect (includes http:// or trailing slash)  
**Fix**: Use bare domain only: `matrixloop.app` not `https://matrixloop.app`

### "Privacy Policy URL Returns 404"
**Cause**: Page not created or deployed  
**Fix**: Create `/app/legal/privacy/page.tsx` and deploy

### "Can't Complete Business Verification"
**Cause**: Account doesn't have Business Manager access  
**Fix**: Create Business Manager account first

---

## 🔗 Quick Links

- **Settings → Basic**: https://developers.facebook.com/apps/453049510987286/settings/basic/
- **Business Verification**: https://business.facebook.com/settings/security
- **Platform Terms**: https://developers.facebook.com/terms
- **Developer Policies**: https://developers.facebook.com/policy

---

## 💡 Pro Tips

1. **Use a dedicated email** like `support@matrixloop.app` for contact
2. **Keep privacy policy simple** but comprehensive
3. **Test all URLs** before submitting for App Review
4. **Update legal pages** as you add features
5. **Save changes frequently** - Meta dashboard can timeout

---

**Your App**: Ready for development, needs legal pages before going Live! 🚀

**Next Steps**: 
1. Fill in basic fields (Display Name, Namespace, Email)
2. Add all three domains
3. Create privacy & terms pages
4. Test everything works
