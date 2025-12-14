# PowerShell script to create AWS Lambda layer package
# This script creates a layer with all Node.js dependencies

Write-Host "Creating AWS Lambda Layer Package..." -ForegroundColor Green
Write-Host ""

# Configuration
$LayerName = "lambda-layer"
$OutputZip = "lambda-layer.zip"

# Clean up any existing layer files
if (Test-Path $LayerName) {
    Write-Host "Cleaning up existing layer directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $LayerName
}

if (Test-Path $OutputZip) {
    Write-Host "Removing existing zip file..." -ForegroundColor Yellow
    Remove-Item -Force $OutputZip
}

# Create layer directory structure
Write-Host "Creating layer directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$LayerName\nodejs" -Force | Out-Null

# Get current directory
$CurrentDir = Get-Location

# Change to layer directory
Set-Location "$LayerName\nodejs"

Write-Host "Installing production dependencies..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Copy package.json to layer directory
Copy-Item "$CurrentDir\package.json" -Destination "." -Force

# Install only production dependencies
npm install --production --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    Set-Location $CurrentDir
    Remove-Item -Recurse -Force $LayerName
    exit 1
}

# Return to original directory
Set-Location $CurrentDir

# Check layer size
$LayerSize = (Get-ChildItem -Path "$LayerName" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "Layer size: $([math]::Round($LayerSize, 2)) MB" -ForegroundColor Cyan

# Check if layer exceeds limits
if ($LayerSize -gt 250) {
    Write-Host "Warning: Layer exceeds 250MB unzipped limit!" -ForegroundColor Red
    Write-Host "Consider splitting into multiple layers or removing unnecessary dependencies." -ForegroundColor Yellow
}

# Create zip file
Write-Host ""
Write-Host "Creating zip file..." -ForegroundColor Cyan
Compress-Archive -Path "$LayerName\nodejs" -DestinationPath $OutputZip -Force

# Check zip size
$ZipSize = (Get-Item $OutputZip).Length / 1MB
Write-Host "Zip size: $([math]::Round($ZipSize, 2)) MB" -ForegroundColor Cyan

if ($ZipSize -gt 50) {
    Write-Host "Warning: Zip file exceeds 50MB limit for direct upload!" -ForegroundColor Red
    Write-Host "You'll need to upload via S3 instead." -ForegroundColor Yellow
}

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $LayerName

Write-Host ""
Write-Host "✅ Lambda layer package created successfully!" -ForegroundColor Green
Write-Host "File: $OutputZip" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Publish the layer:" -ForegroundColor White
Write-Host "   aws lambda publish-layer-version --layer-name sahni-backend-dependencies --zip-file fileb://$OutputZip --compatible-runtimes nodejs20.x" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Note the Layer ARN from the output" -ForegroundColor White
Write-Host ""
Write-Host "3. Attach layer to your function:" -ForegroundColor White
Write-Host "   aws lambda update-function-configuration --function-name sahni-backend-api --layers <LAYER_ARN>" -ForegroundColor Gray

