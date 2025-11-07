# TCA-IRR Application Service Status

## ✅ Current Status (Fixed)

### Backend (FastAPI)

- **Status**: ✅ Running
- **URL**: <http://localhost:8000>
- **Health Check**: <http://localhost:8000/health>
- **Database**: ✅ Connected to Azure PostgreSQL
- **Tables**: 21 tables found

### Frontend (Next.js)  

- **Status**: ✅ Running
- **URL**: <http://localhost:3001> (auto-switched from 3000)
- **Build**: ✅ Compiles successfully
- **Pages**: 67 pages generated

## 🔧 Issues Fixed

### 1. PowerShell Command Issues

❌ **Problem**: `head` command not recognized in PowerShell
✅ **Solution**: Use `| Select-Object -First 15` instead

❌ **Problem**: `python` command not found
✅ **Solution**: Use `py` command in Windows

### 2. Service Management

✅ **Backend**: FastAPI server runs properly with `py main.py`
✅ **Frontend**: Next.js dev server runs with `npm run dev`
✅ **Port Management**: Auto-switches to available ports

## 💡 PowerShell Command Reference

| Linux/Bash Command | PowerShell Equivalent |
|-------------------|---------------------|
| `head -15` | `| Select-Object -First 15` |
| `tail -15` | `| Select-Object -Last 15` |
| `grep "text"` | `| Select-String "text"` |
| `python` | `py` |
| `curl url` | `Invoke-WebRequest -Uri "url"` |
| `ls -la` | `Get-ChildItem -Force` |
| `cat file.txt` | `Get-Content file.txt` |

## 🚀 Quick Start Commands

```powershell
# Start Backend
py main.py

# Start Frontend (in new terminal)
npm run dev

# Build Frontend
npm run build | Select-Object -First 20

# Test Services
.\test-status.ps1
```

## 📊 Service URLs

- **Frontend**: <http://localhost:3001>
- **Backend API**: <http://localhost:8000>
- **Health Check**: <http://localhost:8000/health>
- **Database**: Azure PostgreSQL (connected)

## ✅ All Systems Operational

Both frontend and backend are now running without errors and properly connected.
