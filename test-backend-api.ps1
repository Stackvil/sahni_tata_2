# Test Backend API Script
# This script tests if the backend API is working correctly

Write-Host "=== Testing Backend API ===" -ForegroundColor Cyan
Write-Host ""

# Check if container exists
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet

if (-not $containerExists) {
    Write-Host "Container 'sahni-backend' does not exist. Starting it..." -ForegroundColor Yellow
    docker run -d -p 8000:8000 --name sahni-backend --restart unless-stopped -e PYTHONUNBUFFERED=1 luffyzolo/stackvil:dhoni
    Start-Sleep -Seconds 10
}

# Check if container is running
$running = docker ps --format "{{.Names}}" | Select-String -Pattern "sahni-backend" -Quiet

if (-not $running) {
    Write-Host "Container is not running. Starting it..." -ForegroundColor Yellow
    docker start sahni-backend
    Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Show container status
Write-Host "Container Status:" -ForegroundColor Cyan
docker ps | findstr sahni-backend
Write-Host ""

# Show recent logs
Write-Host "Recent Logs:" -ForegroundColor Cyan
docker logs sahni-backend --tail 10
Write-Host ""

# Test endpoints
$endpoints = @(
    @{Name="API Docs"; Url="http://localhost:8000/docs"},
    @{Name="API Root"; Url="http://localhost:8000/"},
    @{Name="Products API"; Url="http://localhost:8000/api/products/?page=1&limit=1"},
    @{Name="Auth Endpoint"; Url="http://localhost:8000/api/auth/login"}
)

Write-Host "Testing Endpoints:" -ForegroundColor Cyan
Write-Host ""

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $($endpoint.Name) ($($endpoint.Url))" -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host " ✓ [Status: $($response.StatusCode)]" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host " ✗ [Status: $statusCode] $($_.Exception.Message)" -ForegroundColor Red
        } else {
            Write-Host " ✗ [Error: Connection Failed] $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Diagnosis ===" -ForegroundColor Cyan

# Check if port 8000 is listening
$portInUse = netstat -ano | findstr ":8000" | findstr "LISTENING"
if ($portInUse) {
    Write-Host "✓ Port 8000 is listening" -ForegroundColor Green
} else {
    Write-Host "✗ Port 8000 is NOT listening - Backend may not have started properly" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  docker logs -f sahni-backend" -ForegroundColor White
}

# Check container health
$containerStatus = docker ps --filter "name=sahni-backend" --format "{{.Status}}"
if ($containerStatus) {
    Write-Host "✓ Container Status: $containerStatus" -ForegroundColor Green
} else {
    Write-Host "✗ Container is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start container:" -ForegroundColor Yellow
    Write-Host "  docker start sahni-backend" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Useful Commands ===" -ForegroundColor Cyan
Write-Host "  View logs:        docker logs -f sahni-backend" -ForegroundColor White
Write-Host "  Restart:          docker restart sahni-backend" -ForegroundColor White
Write-Host "  Stop:             docker stop sahni-backend" -ForegroundColor White
Write-Host "  Remove:           docker stop sahni-backend; docker rm sahni-backend" -ForegroundColor White
Write-Host "  View API docs:    Start-Process http://localhost:8000/docs" -ForegroundColor White
Write-Host ""


