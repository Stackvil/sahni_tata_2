# PowerShell script to create Lambda deployment package
# Based on AWS Lambda Node.js deployment documentation

Write-Host "Creating Lambda Deployment Package..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Step 1: Install production dependencies
Write-Host "Step 1: Installing production dependencies..." -ForegroundColor Yellow
npm install --production

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Remove old deployment package if exists
if (Test-Path "lambda-deployment.zip") {
    Write-Host "Removing old deployment package..." -ForegroundColor Yellow
    Remove-Item "lambda-deployment.zip" -Force
}

# Step 3: Create deployment package
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow

# Files and directories to exclude
$excludePatterns = @(
    "*.git*",
    "*.md",
    "*.log",
    "scripts",
    "test",
    "__tests__",
    ".env*",
    "*.zip",
    "node_modules/.cache",
    ".vscode",
    ".idea",
    "*.swp",
    "*.swo"
)

# Create temporary directory for packaging
$tempDir = "lambda-package-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files, excluding patterns
Write-Host "Copying files..." -ForegroundColor Gray
Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($item.FullName -like "*\$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    # Don't copy if it's a directory that should be excluded
    if ($item.PSIsContainer) {
        foreach ($pattern in $excludePatterns) {
            if ($item.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
    }
    
    -not $shouldExclude
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destPath = Join-Path $tempDir $relativePath
    
    if ($_.PSIsContainer) {
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath | Out-Null
        }
    } else {
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir | Out-Null
        }
        Copy-Item $_.FullName -Destination $destPath -Force
    }
}

# Step 4: Create zip file
Write-Host "Step 3: Creating zip archive..." -ForegroundColor Yellow
Set-Location $tempDir
Compress-Archive -Path * -DestinationPath "../lambda-deployment.zip" -Force
Set-Location ..

# Step 5: Cleanup
Write-Host "Step 4: Cleaning up..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

# Step 6: Check package size
$zipFile = Get-Item "lambda-deployment.zip"
$sizeMB = [math]::Round($zipFile.Length / 1MB, 2)

Write-Host ""
Write-Host "✅ Deployment package created successfully!" -ForegroundColor Green
Write-Host "   File: lambda-deployment.zip" -ForegroundColor White
Write-Host "   Size: $sizeMB MB" -ForegroundColor White

if ($sizeMB -gt 50) {
    Write-Host ""
    Write-Host "⚠️  Warning: Package is larger than 50MB" -ForegroundColor Yellow
    Write-Host "   You must upload via S3 for packages > 50MB" -ForegroundColor Yellow
    Write-Host "   See DEPLOY_LAMBDA.md for instructions" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✅ Package size is acceptable for direct upload" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload lambda-deployment.zip to AWS Lambda" -ForegroundColor White
Write-Host "2. Set handler to: lambda.handler" -ForegroundColor White
Write-Host "3. Configure environment variables" -ForegroundColor White
Write-Host "4. Set timeout and memory as needed" -ForegroundColor White

