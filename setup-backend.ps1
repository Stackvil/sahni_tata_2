# Backend Setup Script for Sahni Tata Project (PowerShell)
# This script helps set up the backend Docker container on Windows

Write-Host "=== Sahni Backend Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Stop existing container if running
if (docker ps -a --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet) {
    Write-Host "Stopping existing sahni-backend container..." -ForegroundColor Yellow
    docker stop sahni-backend 2>$null
    docker rm sahni-backend 2>$null
    Write-Host "✓ Existing container removed" -ForegroundColor Green
}

# Pull Docker image
Write-Host ""
Write-Host "Pulling Docker image: luffyzolo/stackvil:dhoni" -ForegroundColor Yellow
docker pull luffyzolo/stackvil:dhoni

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to pull Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker image pulled successfully" -ForegroundColor Green

# Run Docker container
Write-Host ""
Write-Host "Starting backend container..." -ForegroundColor Yellow
docker run -d `
  -p 8000:8000 `
  --name sahni-backend `
  --restart unless-stopped `
  -e PYTHONUNBUFFERED=1 `
  luffyzolo/stackvil:dhoni

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start Docker container" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backend container started" -ForegroundColor Green

# Wait for container to be ready
Write-Host ""
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if container is running
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet
if ($running) {
    Write-Host "✓ Container is running" -ForegroundColor Green
} else {
    Write-Host "Error: Container is not running. Check logs:" -ForegroundColor Red
    docker logs sahni-backend
    exit 1
}

# Test the API
Write-Host ""
Write-Host "Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend API is accessible at http://localhost:8000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Backend might still be starting. Wait a few seconds and check:" -ForegroundColor Yellow
    Write-Host "  Open browser to: http://localhost:8000/docs"
}

# Show container info
Write-Host ""
Write-Host "=== Backend Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Container Name: sahni-backend"
Write-Host "Port: 8000"
Write-Host "API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  View logs:    docker logs -f sahni-backend"
Write-Host "  Stop:         docker stop sahni-backend"
Write-Host "  Start:        docker start sahni-backend"
Write-Host "  Restart:      docker restart sahni-backend"
Write-Host "  Remove:       docker stop sahni-backend; docker rm sahni-backend"
Write-Host ""

