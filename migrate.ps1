# PowerShell script to migrate data via Vercel API
$API_URL = "https://sahni-tata-2.vercel.app"
$ADMIN_EMAIL = "admin@sahni.com"
$ADMIN_PASSWORD = "admin123"

Write-Host "🔐 Step 1: Logging in to get JWT token..." -ForegroundColor Cyan

# Login to get token
$emailEncoded = [System.Web.HttpUtility]::UrlEncode($ADMIN_EMAIL)
$passwordEncoded = [System.Web.HttpUtility]::UrlEncode($ADMIN_PASSWORD)
$loginUrl = "$API_URL/api/auth/login?email=$emailEncoded" + '&' + "password=$passwordEncoded"

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.access_token
    
    if (-not $token) {
        Write-Host "❌ No token received from login" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "📝 Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Step 2: Starting migration..." -ForegroundColor Cyan
    Write-Host ""
    
    # Call migrate endpoint
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $migrateResponse = Invoke-RestMethod -Uri "$API_URL/api/migrate" -Method Post -Headers $headers -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✨ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    $migrateResponse | ConvertTo-Json -Depth 10
    
    if ($migrateResponse.results) {
        Write-Host ""
        Write-Host "📈 Summary:" -ForegroundColor Cyan
        $migrateResponse.results.PSObject.Properties | ForEach-Object {
            $key = $_.Name
            $value = $_.Value
            if ($value -and $value.migrated) {
                $skipped = if ($value.skipped) { ", $($value.skipped) skipped" } else { "" }
                Write-Host "  $key : $($value.migrated) migrated$skipped" -ForegroundColor White
            }
        }
    }
    
    Write-Host ""
    Write-Host "✅ All done!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}
