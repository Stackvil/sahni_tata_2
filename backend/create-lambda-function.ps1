# PowerShell script to create AWS Lambda function package (code only, no dependencies)
# This script creates a deployment package with only your code files

Write-Host "Creating AWS Lambda Function Package (Code Only)..." -ForegroundColor Green
Write-Host ""

# Configuration
$FunctionName = "lambda-function"
$OutputZip = "lambda-function.zip"

# Clean up any existing function files
if (Test-Path $FunctionName) {
    Write-Host "Cleaning up existing function directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $FunctionName
}

if (Test-Path $OutputZip) {
    Write-Host "Removing existing zip file..." -ForegroundColor Yellow
    Remove-Item -Force $OutputZip
}

# Create function directory
Write-Host "Creating function package directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $FunctionName -Force | Out-Null

# Files and directories to include
Write-Host "Copying code files..." -ForegroundColor Cyan

# Copy JavaScript files
Get-ChildItem -Path "." -Filter "*.js" -File | ForEach-Object {
    Copy-Item $_.FullName -Destination "$FunctionName\" -Force
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Gray
}

# Copy directories
$DirectoriesToCopy = @("config", "middleware", "routes", "utils")

foreach ($Dir in $DirectoriesToCopy) {
    if (Test-Path $Dir) {
        Copy-Item -Path $Dir -Destination "$FunctionName\" -Recurse -Force
        Write-Host "  ✓ $Dir/" -ForegroundColor Gray
    }
}

# Copy package.json (needed for module resolution)
if (Test-Path "package.json") {
    Copy-Item "package.json" -Destination "$FunctionName\" -Force
    Write-Host "  ✓ package.json" -ForegroundColor Gray
}

# Verify lambda.js exists
if (-not (Test-Path "$FunctionName\lambda.js")) {
    Write-Host "Warning: lambda.js not found! Make sure it exists in the backend directory." -ForegroundColor Red
}

# Check package size
$PackageSize = (Get-ChildItem -Path "$FunctionName" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "Package size: $([math]::Round($PackageSize, 2)) MB" -ForegroundColor Cyan

# Create zip file
Write-Host ""
Write-Host "Creating zip file..." -ForegroundColor Cyan
Compress-Archive -Path "$FunctionName\*" -DestinationPath $OutputZip -Force

# Check zip size
$ZipSize = (Get-Item $OutputZip).Length / 1MB
Write-Host "Zip size: $([math]::Round($ZipSize, 2)) MB" -ForegroundColor Cyan

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $FunctionName

Write-Host ""
Write-Host "✅ Lambda function package created successfully!" -ForegroundColor Green
Write-Host "File: $OutputZip" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: This package contains only code. Dependencies should be provided via Lambda layer." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update function code:" -ForegroundColor White
Write-Host "   aws lambda update-function-code --function-name sahni-backend-api --zip-file fileb://$OutputZip" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Make sure your function has the layer attached (from create-lambda-layer.ps1)" -ForegroundColor White

