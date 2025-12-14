# Fix Backend Platform Issue Script
# The Docker image is built for ARM64 but host is AMD64, causing performance issues

Write-Host "=== Fixing Backend Platform Issue ===" -ForegroundColor Cyan
Write-Host ""

# Stop and remove existing container
Write-Host "Stopping existing container..." -ForegroundColor Yellow
docker stop sahni-backend 2>$null
docker rm sahni-backend 2>$null
Write-Host "✓ Container removed" -ForegroundColor Green

# Option 1: Try to run with platform specification (emulation)
Write-Host ""
Write-Host "Attempting to run with platform emulation (slower but should work)..." -ForegroundColor Yellow
Write-Host "This may cause slower performance and contribute to timeout errors." -ForegroundColor Yellow
Write-Host ""

docker run -d `
  -p 8000:8000 `
  --name sahni-backend `
  --platform linux/amd64 `
  --restart unless-stopped `
  -e PYTHONUNBUFFERED=1 `
  -e TIMEOUT=300 `
  luffyzolo/stackvil:dhoni

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Failed to run with platform specification. Trying without..." -ForegroundColor Yellow
    
    docker run -d `
      -p 8000:8000 `
      --name sahni-backend `
      --restart unless-stopped `
      -e PYTHONUNBUFFERED=1 `
      -e TIMEOUT=300 `
      luffyzolo/stackvil:dhoni
}

Start-Sleep -Seconds 5

# Check if container is running
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet
if ($running) {
    Write-Host "✓ Container is running" -ForegroundColor Green
} else {
    Write-Host "✗ Container failed to start. Check logs:" -ForegroundColor Red
    docker logs sahni-backend
    exit 1
}

# Test API
Write-Host ""
Write-Host "Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ API is accessible at http://localhost:8000" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠ API might still be starting or has issues:" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check logs: docker logs -f sahni-backend" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Important Notes ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Platform Mismatch: The image is ARM64 but your system is AMD64" -ForegroundColor Yellow
Write-Host "   This causes slower performance and may contribute to 504 timeout errors." -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Solutions:" -ForegroundColor Yellow
Write-Host "   a) Contact backend developer to build an AMD64 version" -ForegroundColor White
Write-Host "   b) Use a Linux ARM64 system (like Apple Silicon Mac)" -ForegroundColor White
Write-Host "   c) Build the image yourself for AMD64" -ForegroundColor White
Write-Host ""
Write-Host "3. For now, the container is running but may be slow." -ForegroundColor Yellow
Write-Host "   Compress images to under 2MB before uploading to reduce timeout risk." -ForegroundColor Yellow
Write-Host ""

