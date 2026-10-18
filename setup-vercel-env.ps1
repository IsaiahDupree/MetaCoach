# Setup Vercel Environment Variables
# Run this script to configure all required environment variables for production

$env:VERCEL_TOKEN = $env:VERCEL_TOKEN

Write-Host "Setting up Vercel environment variables for metacoach.matrixloop.app" -ForegroundColor Green
Write-Host ""

# Required variables
$envVars = @{
    "META_APP_ID" = "453049510987286"
    "META_APP_SECRET" = $env:META_APP_SECRET
    "META_REDIRECT_URL" = "https://metacoach.matrixloop.app/api/meta/oauth/callback"
    "PUBLIC_BASE_URL" = "https://metacoach.matrixloop.app"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Adding $key..." -ForegroundColor Yellow
    echo $value | vercel env add $key production --yes
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $key added successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add $key" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Environment variables setup complete!" -ForegroundColor Green
Write-Host "Now run: vercel --prod --yes" -ForegroundColor Cyan
