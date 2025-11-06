# Dynamic Environment Configuration
# This file will be sourced by deployment scripts to set environment-specific values

# Development Environment
if ($env:AZURE_ENV_NAME -eq "dev") {
    $env:AZURE_APP_NAME = "tca-irr-dev"
    $env:AZURE_RESOURCE_PREFIX = "tcdev"
    $env:AZURE_STORAGE_SKU = "Standard_LRS"
    $env:AZURE_KEYVAULT_SKU = "standard"
    $env:AZURE_ENABLE_MONITORING = "false"
}
# Staging Environment
elseif ($env:AZURE_ENV_NAME -eq "staging") {
    $env:AZURE_APP_NAME = "tca-irr-staging"
    $env:AZURE_RESOURCE_PREFIX = "tcstg"
    $env:AZURE_STORAGE_SKU = "Standard_GRS"
    $env:AZURE_KEYVAULT_SKU = "standard"
    $env:AZURE_ENABLE_MONITORING = "true"
}
# Production Environment
elseif ($env:AZURE_ENV_NAME -eq "prod") {
    $env:AZURE_APP_NAME = "tca-irr"
    $env:AZURE_RESOURCE_PREFIX = "tcprd"
    $env:AZURE_STORAGE_SKU = "Standard_GRS"
    $env:AZURE_KEYVAULT_SKU = "premium"
    $env:AZURE_ENABLE_MONITORING = "true"
}
# Default (fallback)
else {
    $env:AZURE_APP_NAME = "tca-irr-$($env:AZURE_ENV_NAME)"
    $env:AZURE_RESOURCE_PREFIX = "tc"
    $env:AZURE_STORAGE_SKU = "Standard_LRS"
    $env:AZURE_KEYVAULT_SKU = "standard"
    $env:AZURE_ENABLE_MONITORING = "true"
}

Write-Host "🔧 Environment Configuration Loaded:" -ForegroundColor Green
Write-Host "   App Name: $($env:AZURE_APP_NAME)" -ForegroundColor Gray
Write-Host "   Resource Prefix: $($env:AZURE_RESOURCE_PREFIX)" -ForegroundColor Gray
Write-Host "   Storage SKU: $($env:AZURE_STORAGE_SKU)" -ForegroundColor Gray
Write-Host "   Key Vault SKU: $($env:AZURE_KEYVAULT_SKU)" -ForegroundColor Gray
Write-Host "   Monitoring: $($env:AZURE_ENABLE_MONITORING)" -ForegroundColor Gray