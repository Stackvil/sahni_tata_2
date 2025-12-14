# Complete Backend Startup and Data Upload Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sahni Backend - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating default .env..." -ForegroundColor Yellow
    @"
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Check if port is in use
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 3001 is already in use!" -ForegroundColor Yellow
    Write-Host "   Process ID: $($portInUse.OwningProcess)" -ForegroundColor Yellow
    $response = Read-Host "   Do you want to kill the process and continue? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Write-Host "✅ Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "❌ Exiting. Please free port 3001 first." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Step 4: Start the server in background
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Step 5: Wait for server to be ready
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
    Write-Host "❌ Server failed to start. Please check for errors." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📚 Swagger docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""

# Step 6: Upload all data
Write-Host "📤 Uploading all data to backend..." -ForegroundColor Yellow
Write-Host ""
npm run upload-all

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend server is running on http://localhost:3001" -ForegroundColor Green
Write-Host "✅ All data has been uploaded" -ForegroundColor Green
Write-Host ""
Write-Host "📚 View API documentation: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "🔍 Verify endpoints: npm run verify" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Keep server running
Wait-Process -Id $serverProcess.Id

