# Test Script for TCA-IRR Services
# PowerShell script to start and test both frontend and backend

Write-Host "🚀 Starting TCA-IRR Services Test" -ForegroundColor Green

# Function to test URL
function Test-Url($url, $name) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name is running successfully on $url" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ $name returned status code: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ $name is not accessible on $url" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Test backend
Write-Host "🔍 Testing Backend (FastAPI)..." -ForegroundColor Cyan
$backendRunning = Test-Url "http://localhost:8000/health" "Backend API"

# Test frontend  
Write-Host "🔍 Testing Frontend (Next.js)..." -ForegroundColor Cyan
$frontendRunning = Test-Url "http://localhost:3000" "Frontend App"

# Summary
Write-Host "`n📊 Service Status Summary:" -ForegroundColor Yellow
Write-Host "Backend (FastAPI): $(if($backendRunning){'✅ Running'}else{'❌ Not Running'})" 
Write-Host "Frontend (Next.js): $(if($frontendRunning){'✅ Running'}else{'❌ Not Running'})"

# PowerShell commands cheat sheet
Write-Host "`n💡 PowerShell Commands (instead of Linux commands):" -ForegroundColor Yellow
Write-Host "   head -15    →   | Select-Object -First 15"
Write-Host "   tail -15    →   | Select-Object -Last 15"
Write-Host "   grep text   →   | Select-String 'text'"
Write-Host "   python      →   py"
Write-Host "   curl url    →   Invoke-WebRequest -Uri 'url'"

if ($backendRunning -and $frontendRunning) {
    Write-Host "`n🎉 All services are running successfully!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n⚠️  Some services are not running. Please check the logs above." -ForegroundColor Red
    exit 1
}