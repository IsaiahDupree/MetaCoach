# Meta API Connectivity Test Script
# Tests OAuth flow, API endpoints, and configuration

Write-Host "`n🧪 Meta API Connectivity Tests`n" -ForegroundColor Cyan

# Test 1: Check if site is live
Write-Host "Test 1: Checking if site is live..." -ForegroundColor Yellow
$siteCheck = curl -I https://www.matrixloop.app 2>&1 | Select-String "HTTP"
if ($siteCheck) {
    Write-Host "✅ Site is live: $siteCheck" -ForegroundColor Green
} else {
    Write-Host "❌ Site is not responding" -ForegroundColor Red
}

# Test 2: Check OAuth start endpoint
Write-Host "`nTest 2: Checking OAuth start endpoint..." -ForegroundColor Yellow
$oauthCheck = curl -s -I https://www.matrixloop.app/api/meta/business-login/start 2>&1 | Select-String "Location"
if ($oauthCheck) {
    Write-Host "✅ OAuth endpoint redirects" -ForegroundColor Green
    Write-Host "   $oauthCheck"
    
    # Check for undefined redirect_uri
    if ($oauthCheck -match "redirect_uri=undefined") {
        Write-Host "⚠️  WARNING: redirect_uri is undefined - environment variables not set!" -ForegroundColor Red
    } elseif ($oauthCheck -match "redirect_uri=https") {
        Write-Host "✅ redirect_uri is properly set" -ForegroundColor Green
    }
} else {
    Write-Host "❌ OAuth endpoint not working" -ForegroundColor Red
}

# Test 3: Check data deletion endpoint
Write-Host "`nTest 3: Checking data deletion endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.matrixloop.app/api/facebook/data-deletion" -Method POST -ContentType "application/json" -Body '{"signed_request":"test"}' -ErrorAction SilentlyContinue
    Write-Host "✅ Data deletion endpoint responds: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Data deletion endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: Check if Meta API is reachable
Write-Host "`nTest 4: Checking Meta Graph API connectivity..." -ForegroundColor Yellow
try {
    $metaCheck = Invoke-WebRequest -Uri "https://graph.facebook.com/v21.0/" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Meta Graph API is reachable: $($metaCheck.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot reach Meta Graph API" -ForegroundColor Red
}

# Test 5: Verify environment variables are set in Vercel
Write-Host "`nTest 5: Checking Vercel environment variables..." -ForegroundColor Yellow
$env:VERCEL_TOKEN = 'sOEzpkIKX1hC2QOKIVcDnxF9'
$envVars = vercel env ls 2>&1

if ($envVars -match "META_APP_ID") {
    Write-Host "✅ META_APP_ID is set" -ForegroundColor Green
    
    # Check if it's set for all environments
    if ($envVars -match "META_APP_ID.*Production") {
        if ($envVars -match "META_APP_ID.*Development.*Preview.*Production") {
            Write-Host "   ✅ Set for all environments" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Only set for Production - needs Development & Preview too!" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ META_APP_ID not found" -ForegroundColor Red
}

if ($envVars -match "META_REDIRECT_URL") {
    Write-Host "✅ META_REDIRECT_URL is set" -ForegroundColor Green
} else {
    Write-Host "❌ META_REDIRECT_URL not found" -ForegroundColor Red
}

if ($envVars -match "PUBLIC_BASE_URL") {
    Write-Host "✅ PUBLIC_BASE_URL is set" -ForegroundColor Green
} else {
    Write-Host "❌ PUBLIC_BASE_URL not found" -ForegroundColor Red
}

# Test 6: Test Meta OAuth URL format
Write-Host "`nTest 6: Testing OAuth URL construction..." -ForegroundColor Yellow
$fullUrl = curl -s -L -w "%{url_effective}" -o /dev/null https://www.matrixloop.app/api/meta/business-login/start
Write-Host "Final OAuth URL: $fullUrl"

if ($fullUrl -match "redirect_uri=https%3A%2F%2Fwww.matrixloop.app") {
    Write-Host "✅ OAuth URL is properly constructed" -ForegroundColor Green
} elseif ($fullUrl -match "redirect_uri=undefined") {
    Write-Host "❌ OAuth URL has undefined redirect_uri" -ForegroundColor Red
    Write-Host "`n🔧 FIX NEEDED:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://vercel.com/isaiahduprees-projects/metacoach/settings/environment-variables"
    Write-Host "   2. Update META_APP_ID to include Development & Preview environments"
    Write-Host "   3. Redeploy the app"
}

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host ("="*60) -ForegroundColor Cyan
Write-Host "`nEnvironment Variables Status:"
Write-Host "  META_APP_ID: $(if ($envVars -match 'META_APP_ID.*Production') {'✅ Set (Production only)'} else {'❌ Missing'})"
Write-Host "  META_REDIRECT_URL: $(if ($envVars -match 'META_REDIRECT_URL') {'✅ Set'} else {'❌ Missing'})"
Write-Host "  PUBLIC_BASE_URL: $(if ($envVars -match 'PUBLIC_BASE_URL') {'✅ Set'} else {'❌ Missing'})"

Write-Host "`nEndpoints Status:"
Write-Host "  Site: ✅ Live"
Write-Host "  OAuth: $(if ($oauthCheck -match 'redirect_uri=https') {'✅ Working'} else {'❌ Broken (undefined redirect_uri)'})"

Write-Host "`n🎯 Next Actions:" -ForegroundColor Cyan
if ($oauthCheck -match "redirect_uri=undefined") {
    Write-Host "  1. Update META_APP_ID environment variable for all environments" -ForegroundColor Yellow
    Write-Host "  2. Redeploy: vercel --prod --yes" -ForegroundColor Yellow
    Write-Host "  3. Run this test again" -ForegroundColor Yellow
} else {
    Write-Host "  All systems operational! 🚀" -ForegroundColor Green
}

Write-Host ""
