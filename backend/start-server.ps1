# Simple script to start the backend server
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "Starting server on http://localhost:3001" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

node server.js

