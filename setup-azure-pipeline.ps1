# Azure DevOps Pipeline Setup and Deployment Script
# This script creates a pipeline from azure-pipelines.yml and triggers deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$PAT = $env:AZURE_DEVOPS_PAT,
    
    [Parameter(Mandatory=$false)]
    [string]$Organization = "ssddevopsazure",
    
    [Parameter(Mandatory=$false)]
    [string]$Project = "TCA",
    
    [Parameter(Mandatory=$false)]
    [string]$Repository = "TCA-IRR"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Azure DevOps Pipeline Setup & Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check for PAT
if ([string]::IsNullOrEmpty($PAT)) {
    Write-Host "Personal Access Token (PAT) Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create a PAT:" -ForegroundColor White
    Write-Host "1. Go to: https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Gray
    Write-Host "2. Click 'New Token'" -ForegroundColor Gray
    Write-Host "3. Name: 'TCA-Pipeline-Setup'" -ForegroundColor Gray
    Write-Host "4. Scopes: Full access (or Build Read&Execute, Code Read)" -ForegroundColor Gray
    Write-Host "5. Click 'Create' and copy the token" -ForegroundColor Gray
    Write-Host ""
    $PAT = Read-Host -Prompt "Enter your Azure DevOps PAT"
    
    if ([string]::IsNullOrEmpty($PAT)) {
        Write-Host "Error: PAT is required to continue." -ForegroundColor Red
        exit 1
    }
}

# Create authorization header
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$PAT"))
$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

$baseUrl = "https://dev.azure.com/$Organization/$Project"

Write-Host "[1/5] Testing connection to Azure DevOps..." -ForegroundColor Yellow

try {
    $projectInfo = Invoke-RestMethod -Uri "$baseUrl/_apis/project?api-version=7.0" -Headers $headers -Method Get
    Write-Host "  Connected to project: $($projectInfo.name)" -ForegroundColor Green
} catch {
    Write-Host "  Error: Failed to connect to Azure DevOps" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Getting repository information..." -ForegroundColor Yellow

try {
    $repos = Invoke-RestMethod -Uri "$baseUrl/_apis/git/repositories?api-version=7.0" -Headers $headers -Method Get
    $repo = $repos.value | Where-Object { $_.name -eq $Repository }
    
    if ($null -eq $repo) {
        Write-Host "  Error: Repository '$Repository' not found" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Found repository: $($repo.name) (ID: $($repo.id))" -ForegroundColor Green
    $repoId = $repo.id
} catch {
    Write-Host "  Error: Failed to get repository info" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/5] Checking for existing pipelines..." -ForegroundColor Yellow

try {
    $pipelines = Invoke-RestMethod -Uri "$baseUrl/_apis/pipelines?api-version=7.0" -Headers $headers -Method Get
    $existingPipeline = $pipelines.value | Where-Object { $_.name -eq "TCA-IRR-Deploy" }
    
    if ($null -ne $existingPipeline) {
        Write-Host "  Found existing pipeline: $($existingPipeline.name) (ID: $($existingPipeline.id))" -ForegroundColor Green
        $pipelineId = $existingPipeline.id
    } else {
        Write-Host "  No existing pipeline found, will create new one" -ForegroundColor Yellow
        $pipelineId = $null
    }
} catch {
    Write-Host "  Warning: Could not check existing pipelines" -ForegroundColor Yellow
    $pipelineId = $null
}

Write-Host "[4/5] Creating/Updating pipeline definition..." -ForegroundColor Yellow

if ($null -eq $pipelineId) {
    # Create new pipeline
    $pipelineBody = @{
        name = "TCA-IRR-Deploy"
        folder = "\"
        configuration = @{
            type = "yaml"
            path = "/azure-pipelines.yml"
            repository = @{
                id = $repoId
                type = "azureReposGit"
            }
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $newPipeline = Invoke-RestMethod -Uri "$baseUrl/_apis/pipelines?api-version=7.0" -Headers $headers -Method Post -Body $pipelineBody
        Write-Host "  Created pipeline: $($newPipeline.name) (ID: $($newPipeline.id))" -ForegroundColor Green
        $pipelineId = $newPipeline.id
    } catch {
        Write-Host "  Error creating pipeline: $_" -ForegroundColor Red
        
        # Try using Build Definition API instead
        Write-Host "  Trying alternative method..." -ForegroundColor Yellow
        
        $buildDefBody = @{
            name = "TCA-IRR-Deploy"
            type = "build"
            quality = "definition"
            queue = @{
                name = "Azure Pipelines"
            }
            process = @{
                type = 2
                yamlFilename = "azure-pipelines.yml"
            }
            repository = @{
                id = $repoId
                type = "TfsGit"
                defaultBranch = "refs/heads/main"
            }
            triggers = @(
                @{
                    triggerType = "continuousIntegration"
                    branchFilters = @("+refs/heads/main")
                }
            )
        } | ConvertTo-Json -Depth 10
        
        try {
            $buildDef = Invoke-RestMethod -Uri "$baseUrl/_apis/build/definitions?api-version=7.0" -Headers $headers -Method Post -Body $buildDefBody
            Write-Host "  Created build definition: $($buildDef.name) (ID: $($buildDef.id))" -ForegroundColor Green
            $pipelineId = $buildDef.id
        } catch {
            Write-Host "  Error: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Manual Setup Required:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://dev.azure.com/$Organization/$Project/_build" -ForegroundColor White
            Write-Host "2. Click 'New pipeline'" -ForegroundColor White
            Write-Host "3. Select 'Azure Repos Git'" -ForegroundColor White
            Write-Host "4. Select '$Repository'" -ForegroundColor White
            Write-Host "5. Select 'Existing Azure Pipelines YAML file'" -ForegroundColor White
            Write-Host "6. Select '/azure-pipelines.yml'" -ForegroundColor White
            Write-Host "7. Click 'Run'" -ForegroundColor White
            exit 1
        }
    }
} else {
    Write-Host "  Using existing pipeline ID: $pipelineId" -ForegroundColor Green
}

Write-Host "[5/5] Triggering pipeline run..." -ForegroundColor Yellow

$runBody = @{
    resources = @{
        repositories = @{
            self = @{
                refName = "refs/heads/main"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $run = Invoke-RestMethod -Uri "$baseUrl/_apis/pipelines/$pipelineId/runs?api-version=7.0" -Headers $headers -Method Post -Body $runBody
    Write-Host "  Pipeline run started!" -ForegroundColor Green
    Write-Host "  Run ID: $($run.id)" -ForegroundColor Cyan
    Write-Host "  State: $($run.state)" -ForegroundColor Cyan
    
    $runUrl = "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($run.id)"
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Pipeline Triggered Successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "View pipeline progress:" -ForegroundColor White
    Write-Host $runUrl -ForegroundColor Cyan
    Write-Host ""
    
    # Open in browser
    Start-Process $runUrl
    
    Write-Host "Waiting for pipeline to complete..." -ForegroundColor Yellow
    Write-Host "(Press Ctrl+C to stop waiting, deployment will continue in background)" -ForegroundColor Gray
    Write-Host ""
    
    $timeout = 600 # 10 minutes
    $elapsed = 0
    $checkInterval = 15
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
        
        try {
            $runStatus = Invoke-RestMethod -Uri "$baseUrl/_apis/pipelines/$pipelineId/runs/$($run.id)?api-version=7.0" -Headers $headers -Method Get
            
            $stateIcon = switch ($runStatus.state) {
                "inProgress" { "[Running]" }
                "completed" { "[Done]" }
                "canceling" { "[Canceling]" }
                default { "[$($runStatus.state)]" }
            }
            
            $resultIcon = switch ($runStatus.result) {
                "succeeded" { "SUCCESS" }
                "failed" { "FAILED" }
                "canceled" { "CANCELED" }
                default { "..." }
            }
            
            Write-Host "  $stateIcon $resultIcon - Elapsed: $elapsed seconds" -ForegroundColor $(if ($runStatus.result -eq "succeeded") { "Green" } elseif ($runStatus.result -eq "failed") { "Red" } else { "Yellow" })
            
            if ($runStatus.state -eq "completed") {
                Write-Host ""
                if ($runStatus.result -eq "succeeded") {
                    Write-Host "============================================" -ForegroundColor Green
                    Write-Host "  Deployment Completed Successfully!" -ForegroundColor Green
                    Write-Host "============================================" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Verify the deployment:" -ForegroundColor White
                    Write-Host "  Backend API: https://tcairrapiccontainer.azurewebsites.net/api/health" -ForegroundColor Cyan
                    Write-Host "  SSD Stats:   https://tcairrapiccontainer.azurewebsites.net/api/ssd/audit/stats" -ForegroundColor Cyan
                    Write-Host "  Frontend:    https://tca-irr.azurewebsites.net" -ForegroundColor Cyan
                    Write-Host "  SSD Audit:   https://tca-irr.azurewebsites.net/dashboard/ssd-audit" -ForegroundColor Cyan
                } else {
                    Write-Host "============================================" -ForegroundColor Red
                    Write-Host "  Deployment $($runStatus.result.ToUpper())" -ForegroundColor Red
                    Write-Host "============================================" -ForegroundColor Red
                    Write-Host ""
                    Write-Host "Check the pipeline logs for details:" -ForegroundColor Yellow
                    Write-Host $runUrl -ForegroundColor Cyan
                }
                break
            }
        } catch {
            Write-Host "  Warning: Could not check status - $_" -ForegroundColor Yellow
        }
    }
    
    if ($elapsed -ge $timeout) {
        Write-Host ""
        Write-Host "Timeout reached. Pipeline may still be running." -ForegroundColor Yellow
        Write-Host "Check status at: $runUrl" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "  Error triggering pipeline run: $_" -ForegroundColor Red
    
    # Try using Builds API
    Write-Host "  Trying alternative trigger method..." -ForegroundColor Yellow
    
    $buildBody = @{
        definition = @{
            id = $pipelineId
        }
        sourceBranch = "refs/heads/main"
    } | ConvertTo-Json -Depth 10
    
    try {
        $build = Invoke-RestMethod -Uri "$baseUrl/_apis/build/builds?api-version=7.0" -Headers $headers -Method Post -Body $buildBody
        Write-Host "  Build queued: $($build.id)" -ForegroundColor Green
        
        $buildUrl = "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($build.id)"
        Write-Host ""
        Write-Host "View build progress:" -ForegroundColor White
        Write-Host $buildUrl -ForegroundColor Cyan
        Start-Process $buildUrl
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please trigger the pipeline manually:" -ForegroundColor Yellow
        Write-Host "https://dev.azure.com/$Organization/$Project/_build" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Script completed." -ForegroundColor Green
