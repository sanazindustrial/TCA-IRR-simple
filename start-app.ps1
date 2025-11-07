# TCA-IRR Application Startup Script
# PowerShell script to start both frontend and backend services

param(
    [switch]$TestOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
TCA-IRR Application Startup Script

Usage:
  .\start-app.ps1           Start both frontend and backend
  .\start-app.ps1 -TestOnly Test if services are already running
  .\start-app.ps1 -Help     Show this help message

Services:
  Backend:  FastAPI server on http://localhost:8000
  Frontend: Next.js dev server on http://localhost:3000

PowerShell Command Equivalents:
  Linux/Bash Command    PowerShell Equivalent
  ------------------    --------------------
  head -15              | Select-Object -First 15
  tail -15              | Select-Object -Last 15  
  grep "text"           | Select-String "text"
  python                py
  curl http://url       Invoke-WebRequest -Uri "http://url"
  ls -la                Get-ChildItem -Force
  cat file.txt          Get-Content file.txt
  
"@ -ForegroundColor Cyan
    exit 0
}

Write-Host "🚀 TCA-IRR Application Manager" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Function to test if a service is running
function Test-Service($url, $name) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $name is running on $url" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $name is not running on $url" -ForegroundColor Red
        return $false
    }
}

# Test current status
Write-Host "`n🔍 Checking current service status..." -ForegroundColor Cyan
$backendRunning = Test-Service "http://localhost:8000/health" "Backend (FastAPI)"
$frontendRunning = Test-Service "http://localhost:3000" "Frontend (Next.js)"

if ($TestOnly) {
    Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
    Write-Host "Backend:  $(if($backendRunning){'✅ Running'}else{'❌ Stopped'})"
    Write-Host "Frontend: $(if($frontendRunning){'✅ Running'}else{'❌ Stopped'})"
    exit 0
}

# Start services if not running
if (-not $backendRunning) {
    Write-Host "`n🔄 Starting Backend (FastAPI)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; py main.py; Read-Host 'Press Enter to close'" -WindowStyle Normal
    Start-Sleep -Seconds 8
}

if (-not $frontendRunning) {
    Write-Host "`n🔄 Starting Frontend (Next.js)..." -ForegroundColor Yellow  
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev; Read-Host 'Press Enter to close'" -WindowStyle Normal
    Start-Sleep -Seconds 5
}

# Wait and test again
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "`n🔍 Final status check..." -ForegroundColor Cyan
$backendFinal = Test-Service "http://localhost:8000/health" "Backend"
$frontendFinal = Test-Service "http://localhost:3000" "Frontend"

Write-Host "`n📊 Final Service Status:" -ForegroundColor Yellow
Write-Host "Backend:  $(if($backendFinal){'✅ Running'}else{'❌ Failed to start'})"
Write-Host "Frontend: $(if($frontendFinal){'✅ Running'}else{'❌ Failed to start'})"

if ($backendFinal -and $frontendFinal) {
    Write-Host "`n🎉 All services started successfully!" -ForegroundColor Green
    Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Health:   http://localhost:8000/health" -ForegroundColor Cyan
}
else {
    Write-Host "`n⚠️  Some services failed to start. Check the opened windows for error logs." -ForegroundColor Red
}