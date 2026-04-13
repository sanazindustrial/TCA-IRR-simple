# Deploy to Azure Container Registry
# Prompts for ACR admin credentials (get from Azure Portal -> Container Registry -> Access keys)

$ErrorActionPreference = "Stop"

$ACR_LOGIN_SERVER = "tcairrresgistry.azurecr.io"
$IMAGE_NAME = "tcaapi"
$TAG = "latest"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Deploying to Azure Container Registry" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Get credentials from Azure Portal:" -ForegroundColor Yellow
Write-Host "  Container Registries -> tcairrresgistry -> Access keys" -ForegroundColor Yellow
Write-Host ""

# Prompt for credentials
$ACR_USERNAME = Read-Host "Enter ACR Username (e.g., tcairrresgistry)"
$ACR_PASSWORD = Read-Host "Enter ACR Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ACR_PASSWORD)
$ACR_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Login to ACR
Write-Host ""
Write-Host "Logging into ACR..." -ForegroundColor Yellow
$ACR_PASSWORD_PLAIN | docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME --password-stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to login to ACR" -ForegroundColor Red
    exit 1
}
Write-Host "ACR login successful!" -ForegroundColor Green

# Build Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${TAG}" -f dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Docker build successful!" -ForegroundColor Green

# Push to ACR
Write-Host ""
Write-Host "Pushing image to ACR..." -ForegroundColor Yellow
docker push "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${TAG}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image: ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${TAG}" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container App will auto-pull the new image." -ForegroundColor Cyan
Write-Host "Wait 1-2 minutes, then test the endpoints." -ForegroundColor Cyan
Write-Host ""
