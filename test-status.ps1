# Simple TCA-IRR Service Test Script
Write-Host "🚀 TCA-IRR Service Status Check" -ForegroundColor Green

# Test Backend
Write-Host "Testing Backend..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running on http://localhost:8000" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend is not running on http://localhost:8000" -ForegroundColor Red
}

# Test Frontend  
Write-Host "Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend is not running on http://localhost:3000" -ForegroundColor Red
}

Write-Host "`n💡 PowerShell Command Cheat Sheet:" -ForegroundColor Cyan
Write-Host "head -15       → | Select-Object -First 15"
Write-Host "tail -15       → | Select-Object -Last 15"  
Write-Host "grep 'text'    → | Select-String 'text'"
Write-Host "python         → py"
Write-Host "curl url       → Invoke-WebRequest -Uri url"