# PowerShell script to start the backend server
Write-Host "Starting Sahni Backend Server..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "Starting server on http://localhost:3001" -ForegroundColor Cyan
npm start

