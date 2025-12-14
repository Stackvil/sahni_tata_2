# PowerShell script to start the backend server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Sahni Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env file not found. Creating default .env..." -ForegroundColor Yellow
    $envContent = @"
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
"@
    $envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
    Write-Host "[OK] Created .env file" -ForegroundColor Green
    Write-Host ""
}

# Check if port is already in use
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[!] Port 3001 is already in use!" -ForegroundColor Yellow
    Write-Host "    Process ID: $($portInUse.OwningProcess)" -ForegroundColor Yellow
    $response = Read-Host "    Do you want to kill the process and continue? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Write-Host "[OK] Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[X] Exiting. Please free port 3001 first." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "[*] Starting server on http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Swagger docs will be available at: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "[*] Health check: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start

