# Complete Backend Restart and Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Backend & Uploading Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing Node processes on port 3001
Write-Host "🛑 Stopping existing backend servers..." -ForegroundColor Yellow
$portProcesses = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcesses) {
    foreach ($pid in $portProcesses) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not stop process $pid" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  No processes found on port 3001" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Start the server
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server.js
}

Start-Sleep -Seconds 5

# Step 3: Wait for server to be ready
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Backend server is running!" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $serverReady) {
    Write-Host ""
    Write-Host "❌ Server failed to start. Check server logs:" -ForegroundColor Red
    Receive-Job $serverJob
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Write-Host ""
Write-Host "📚 Swagger docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""

# Step 4: Verify endpoints
Write-Host "🔍 Verifying endpoints..." -ForegroundColor Yellow
node scripts/verify-backend.js
Write-Host ""

# Step 5: Upload all data
Write-Host "📤 Uploading all data..." -ForegroundColor Yellow
Write-Host ""
npm run upload-all

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend server is running in background job." -ForegroundColor Green
Write-Host "To stop: Stop-Job -Name 'Backend Server' | Remove-Job" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 API Docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "🔍 Verify: npm run verify" -ForegroundColor Cyan
Write-Host ""

