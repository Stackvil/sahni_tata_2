# PowerShell script to start the backend server and keep it running
# This script ensures the server doesn't stop and auto-restarts on errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Sahni Backend Server" -ForegroundColor Cyan
Write-Host "  (Keep-Alive Mode)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location $PSScriptRoot

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

# Function to start server with auto-restart
function Start-ServerWithRestart {
    Write-Host "[*] Starting server on http://localhost:3001" -ForegroundColor Green
    Write-Host "[*] Swagger docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
    Write-Host "[*] Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    $restartCount = 0
    $maxRestarts = 10
    
    while ($true) {
        try {
            # Start the server
            node server.js
            
            # If we get here, the server exited normally
            Write-Host ""
            Write-Host "[!] Server stopped. Restarting in 3 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
            $restartCount++
            
            if ($restartCount -ge $maxRestarts) {
                Write-Host "[X] Maximum restart attempts reached. Exiting." -ForegroundColor Red
                break
            }
        } catch {
            Write-Host ""
            Write-Host "[X] Server crashed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "[!] Restarting in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            $restartCount++
            
            if ($restartCount -ge $maxRestarts) {
                Write-Host "[X] Maximum restart attempts reached. Exiting." -ForegroundColor Red
                break
            }
        }
    }
}

# Start the server with auto-restart
Start-ServerWithRestart

