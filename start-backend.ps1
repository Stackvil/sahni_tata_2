# Start Backend Script
# This script helps start the Docker backend

Write-Host "=== Starting Sahni Backend ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker Desktop is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop first:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop application" -ForegroundColor White
    Write-Host "  2. Wait for it to fully start (whale icon in system tray should be steady)" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Attempting to start Docker Desktop..." -ForegroundColor Yellow
    try {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction Stop
        Write-Host "✓ Docker Desktop starting... Please wait 30-60 seconds for it to fully start." -ForegroundColor Yellow
        Write-Host "  Then run this script again." -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Could not start Docker Desktop automatically." -ForegroundColor Red
        Write-Host "  Please start it manually from the Start menu." -ForegroundColor Yellow
    }
    exit 1
}

# Check if container exists
Write-Host ""
Write-Host "Checking for existing container..." -ForegroundColor Cyan
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet

if ($containerExists) {
    Write-Host "✓ Container exists" -ForegroundColor Green
    
    # Check if it's running
    $running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet
    
    if ($running) {
        Write-Host "✓ Container is already running!" -ForegroundColor Green
    } else {
        Write-Host "Starting container..." -ForegroundColor Yellow
        docker start sahni-backend
        Write-Host "✓ Container started" -ForegroundColor Green
    }
} else {
    Write-Host "Container does not exist. Creating new container..." -ForegroundColor Yellow

# Check if container exists
Write-Host ""
Write-Host "Checking for existing container..." -ForegroundColor Cyan
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet

if ($containerExists) {
    Write-Host "✓ Container exists" -ForegroundColor Green
    
    # Check if it's running
    $running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet
    
    if ($running) {
        Write-Host "✓ Container is already running!" -ForegroundColor Green
    } else {
        Write-Host "Starting container..." -ForegroundColor Yellow
        docker start sahni-backend
        Write-Host "✓ Container started" -ForegroundColor Green
    }
} else {
    Write-Host "Container doesn't exist. Creating new container..." -ForegroundColor Yellow
    docker run -d `
      -p 8000:8000 `
      --name sahni-backend `
      --restart unless-stopped `
      -e PYTHONUNBUFFERED=1 `
      luffyzolo/stackvil:dhoni
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to create container" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Container created and started" -ForegroundColor Green
}

# Wait for backend to be ready
Write-Host ""
Write-Host "Waiting for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check container status
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet
if ($running) {
    Write-Host "✓ Container is running" -ForegroundColor Green
} else {
    Write-Host "✗ Container is not running. Check logs:" -ForegroundColor Red
    docker logs sahni-backend --tail 20
    exit 1
}

# Test the API
Write-Host ""
Write-Host "Testing backend API..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✓ Backend is accessible at http://localhost:8000" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "API Base URL: http://localhost:8000/api" -ForegroundColor Cyan
} catch {
    Write-Host "⚠ Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check logs: docker logs -f sahni-backend" -ForegroundColor Cyan
    Write-Host "Or wait a few more seconds and try: http://localhost:8000/docs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Backend Status ===" -ForegroundColor Cyan
docker ps --filter "name=sahni-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:    docker logs -f sahni-backend" -ForegroundColor White
Write-Host "  Stop:         docker stop sahni-backend" -ForegroundColor White
Write-Host "  Restart:      docker restart sahni-backend" -ForegroundColor White
Write-Host "  Open docs:    Start-Process http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

