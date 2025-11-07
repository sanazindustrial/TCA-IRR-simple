# PowerShell script to add Python to PATH
# Run this script to enable 'python' command in PowerShell

Write-Host "🐍 Setting up Python PATH for TCA IRR App..." -ForegroundColor Cyan

# Python installation path
$pythonPath = "C:\Users\Allot\AppData\Local\Programs\Python\Python312"
$pythonScriptsPath = "C:\Users\Allot\AppData\Local\Programs\Python\Python312\Scripts"

# Add to current session PATH
$env:PATH += ";$pythonPath;$pythonScriptsPath"

Write-Host "✅ Python PATH added for current PowerShell session" -ForegroundColor Green

# Test Python installation
Write-Host "🧪 Testing Python installation..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version
    $pipVersion = python -m pip --version
    
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    Write-Host "✅ Pip: $pipVersion" -ForegroundColor Green
    
    Write-Host "`n🎉 Python commands are now available!" -ForegroundColor Cyan
    Write-Host "   - Use 'python' instead of 'py'" -ForegroundColor White
    Write-Host "   - Use 'python -m pip' for package management" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error testing Python installation: $_" -ForegroundColor Red
    Write-Host "💡 You can still use 'py' command as an alternative" -ForegroundColor Yellow
}

Write-Host "`n📝 To make this permanent, add the following paths to your system PATH:" -ForegroundColor Yellow
Write-Host "   $pythonPath" -ForegroundColor White
Write-Host "   $pythonScriptsPath" -ForegroundColor White