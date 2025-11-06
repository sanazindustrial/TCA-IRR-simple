# Dynamic Parameters Configuration for Bicep Deployment
# This file contains environment-specific parameter values

# Bicep template parameters that vary by environment
param (
    [string]$EnvironmentName = $env:AZURE_ENV_NAME ?? "dev",
    [string]$Location = $env:AZURE_LOCATION ?? "eastus2",
    [string]$AppName = $env:AZURE_APP_NAME ?? "tca-irr",
    [string]$ResourcePrefix = $env:AZURE_RESOURCE_PREFIX ?? "tc",
    [bool]$EnableMonitoring = [System.Convert]::ToBoolean($env:AZURE_ENABLE_MONITORING ?? "true"),
    [string]$StorageAccountSku = $env:AZURE_STORAGE_SKU ?? "Standard_LRS",
    [string]$KeyVaultSku = $env:AZURE_KEYVAULT_SKU ?? "standard"
)

# Environment-specific configurations
$envConfig = @{
    "dev"     = @{
        ResourcePrefix    = "tcdev"
        EnableMonitoring  = $false
        StorageAccountSku = "Standard_LRS"
        KeyVaultSku       = "standard"
    }
    "staging" = @{
        ResourcePrefix    = "tcstg"
        EnableMonitoring  = $true
        StorageAccountSku = "Standard_GRS"
        KeyVaultSku       = "standard"
    }
    "prod"    = @{
        ResourcePrefix    = "tcprd"
        EnableMonitoring  = $true
        StorageAccountSku = "Standard_GRS"
        KeyVaultSku       = "premium"
    }
}

# Apply environment-specific overrides
if ($envConfig.ContainsKey($EnvironmentName)) {
    $config = $envConfig[$EnvironmentName]
    
    if (-not $env:AZURE_RESOURCE_PREFIX) {
        $ResourcePrefix = $config.ResourcePrefix
    }
    if (-not $env:AZURE_ENABLE_MONITORING) {
        $EnableMonitoring = $config.EnableMonitoring
    }
    if (-not $env:AZURE_STORAGE_SKU) {
        $StorageAccountSku = $config.StorageAccountSku
    }
    if (-not $env:AZURE_KEYVAULT_SKU) {
        $KeyVaultSku = $config.KeyVaultSku
    }
}

# Generate the parameters JSON for Bicep deployment
$parameters = @{
    environmentName   = @{ value = $EnvironmentName }
    location          = @{ value = $Location }
    appName           = @{ value = $AppName }
    resourcePrefix    = @{ value = $ResourcePrefix }
    enableMonitoring  = @{ value = $EnableMonitoring }
    storageAccountSku = @{ value = $StorageAccountSku }
    keyVaultSku       = @{ value = $KeyVaultSku }
}

$parametersJson = @{
    '$schema'      = "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#"
    contentVersion = "1.0.0.0"
    parameters     = $parameters
}

# Output the configuration for verification
Write-Host "🔧 Dynamic Configuration Generated:" -ForegroundColor Green
Write-Host "   Environment: $EnvironmentName" -ForegroundColor Cyan
Write-Host "   Location: $Location" -ForegroundColor Cyan
Write-Host "   App Name: $AppName" -ForegroundColor Cyan
Write-Host "   Resource Prefix: $ResourcePrefix" -ForegroundColor Cyan
Write-Host "   Enable Monitoring: $EnableMonitoring" -ForegroundColor Cyan
Write-Host "   Storage SKU: $StorageAccountSku" -ForegroundColor Cyan
Write-Host "   Key Vault SKU: $KeyVaultSku" -ForegroundColor Cyan

# Write parameters to file
$parametersJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "infra/main.parameters.generated.json" -Encoding utf8

Write-Host "✅ Parameters file generated: infra/main.parameters.generated.json" -ForegroundColor Green

return $parametersJson