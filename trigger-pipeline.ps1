# Trigger Azure DevOps Pipeline via REST API
# This script triggers the existing pipeline without needing Azure CLI

param(
    [Parameter(Mandatory = $false)]
    [string]$PAT = "",
    
    [Parameter(Mandatory = $false)]
    [string]$Organization = "ssddevopsazure",
    
    [Parameter(Mandatory = $false)]
    [string]$Project = "TCA",
    
    [Parameter(Mandatory = $false)]
    [string]$PipelineId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Trigger Azure DevOps Pipeline" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get PAT if not provided
if ([string]::IsNullOrEmpty($PAT)) {
    Write-Host "To trigger the pipeline, you need an Azure DevOps Personal Access Token" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create a PAT with 'Build (Read & Execute)' permission at:" -ForegroundColor White
    Write-Host "https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Gray
    Write-Host ""
    
    Start-Process "https://dev.azure.com/$Organization/_usersSettings/tokens"
    
    $PAT = Read-Host "Enter your PAT (or press Enter to skip and use manual method)"
    
    if ([string]::IsNullOrEmpty($PAT)) {
        Write-Host ""
        Write-Host "Manual Deployment Options:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Run Pipeline Manually" -ForegroundColor Cyan
        Write-Host "  1. Go to: https://dev.azure.com/$Organization/$Project/_build" -ForegroundColor Gray
        Write-Host "  2. Select your pipeline" -ForegroundColor Gray
        Write-Host "  3. Click 'Run pipeline'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 2: Set up Deployment Center" -ForegroundColor Cyan
        Write-Host "  1. Go to: https://portal.azure.com" -ForegroundColor Gray
        Write-Host "  2. App Services > tcairrapiccontainer > Deployment Center" -ForegroundColor Gray
        Write-Host "  3. Source: External Git or Azure Repos" -ForegroundColor Gray
        Write-Host "  4. Repository: https://dev.azure.com/$Organization/$Project/_git/TCA-IRR" -ForegroundColor Gray
        Write-Host "  5. Branch: main" -ForegroundColor Gray
        Write-Host ""
        
        Start-Process "https://portal.azure.com/#@/resource/subscriptions/f8e74a42-3d3d-4a45-974f-77b7e48c77b4/resourceGroups/Default-Web-EastUS/providers/Microsoft.Web/sites/tcairrapiccontainer/vstscd"
        
        exit 0
    }
}

# Create base64 auth header
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))
$headers = @{
    Authorization  = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

# First, list available pipelines if no ID provided
if ([string]::IsNullOrEmpty($PipelineId)) {
    Write-Host "Listing available pipelines..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "https://dev.azure.com/$Organization/$Project/_apis/pipelines?api-version=7.0" `
            -Method GET -Headers $headers
        
        if ($response.count -eq 0) {
            Write-Host "No pipelines found. Creating one from azure-pipelines.yml..." -ForegroundColor Yellow
            
            # Create pipeline
            $createBody = @{
                name          = "TCA-IRR-Deploy"
                folder        = ""
                configuration = @{
                    type       = "yaml"
                    path       = "/azure-pipelines.yml"
                    repository = @{
                        id   = "TCA-IRR"
                        type = "azureReposGit"
                    }
                }
            } | ConvertTo-Json -Depth 5
            
            $pipeline = Invoke-RestMethod -Uri "https://dev.azure.com/$Organization/$Project/_apis/pipelines?api-version=7.0" `
                -Method POST -Headers $headers -Body $createBody
            
            $PipelineId = $pipeline.id
            Write-Host "Created pipeline ID: $PipelineId" -ForegroundColor Green
        }
        else {
            Write-Host "Found $($response.count) pipeline(s):" -ForegroundColor Green
            $response.value | ForEach-Object {
                Write-Host "  ID: $($_.id) - Name: $($_.name)" -ForegroundColor White
            }
            
            $PipelineId = $response.value[0].id
            Write-Host ""
            Write-Host "Using pipeline ID: $PipelineId" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error listing pipelines: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Falling back to manual trigger..." -ForegroundColor Yellow
        Start-Process "https://dev.azure.com/$Organization/$Project/_build"
        exit 1
    }
}

# Trigger the pipeline
Write-Host ""
Write-Host "Triggering pipeline $PipelineId..." -ForegroundColor Yellow

try {
    $runBody = @{
        resources = @{
            repositories = @{
                self = @{
                    refName = "refs/heads/main"
                }
            }
        }
    } | ConvertTo-Json -Depth 5
    
    $run = Invoke-RestMethod -Uri "https://dev.azure.com/$Organization/$Project/_apis/pipelines/$PipelineId/runs?api-version=7.0" `
        -Method POST -Headers $headers -Body $runBody
    
    Write-Host ""
    Write-Host "Pipeline triggered successfully!" -ForegroundColor Green
    Write-Host "  Run ID: $($run.id)" -ForegroundColor White
    Write-Host "  State: $($run.state)" -ForegroundColor White
    Write-Host ""
    Write-Host "View run at:" -ForegroundColor Yellow
    Write-Host "  $($run._links.web.href)" -ForegroundColor Cyan
    
    Start-Process $run._links.web.href
}
catch {
    Write-Host "Error triggering pipeline: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorObj.message) {
            Write-Host "Details: $($errorObj.message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Opening Azure DevOps for manual trigger..." -ForegroundColor Yellow
    Start-Process "https://dev.azure.com/$Organization/$Project/_build?definitionId=$PipelineId"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  After deployment completes, verify:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "curl https://tcairrapiccontainer.azurewebsites.net/api/health" -ForegroundColor Gray
Write-Host "curl https://tcairrapiccontainer.azurewebsites.net/api/ssd/audit/stats" -ForegroundColor Gray
