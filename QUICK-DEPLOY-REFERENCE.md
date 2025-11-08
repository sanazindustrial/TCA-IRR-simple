# Quick Deployment Reference Card

## 🚀 Local Deployment - Quick Start

### One-Time Setup

```bash
# 1. Clone & Install
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple
npm install

# 2. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python scripts/init_database.py
cd ..
```

### Daily Start (Two Terminals)

**Terminal 1 - Frontend:**

```bash
npm run dev
# → http://localhost:3000
```

**Terminal 2 - Backend:**

```bash
cd backend
venv\Scripts\activate
python main.py
# → http://localhost:8000
```

---

## ☁️ Azure Deployment - Quick Start

### Option 1: Automated (Easiest)

```bash
# Install Azure Developer CLI
powershell -ex AllSigned -c "Invoke-RestMethod 'https://aka.ms/install-azd.ps1' | Invoke-Expression"

# Login & Deploy
az login
azd init
azd up
# ✅ Done! App deployed to Azure
```

### Option 2: Manual Control

```bash
# 1. Login
az login

# 2. Create Resources
az group create --name tca-irr-rg --location eastus
az appservice plan create --name tca-irr-plan --resource-group tca-irr-rg --sku B1 --is-linux

# 3. Deploy Frontend
az webapp create --name tca-irr-app --resource-group tca-irr-rg --plan tca-irr-plan --runtime "NODE:18-lts"
npm run build
# Upload build files

# 4. Deploy Backend
az webapp create --name tca-irr-backend --resource-group tca-irr-rg --plan tca-irr-plan --runtime "PYTHON:3.9"
cd backend
az webapp up --name tca-irr-backend --resource-group tca-irr-rg
```

---

## 🛠️ Common Commands

### Frontend

```bash
npm install              # Install dependencies
npm run dev             # Development server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Check code quality
```

### Backend

```bash
python main.py                          # Start server
python scripts/init_database.py         # Initialize DB
pip install -r requirements.txt         # Install packages
pytest                                  # Run tests
```

### Azure

```bash
az login                                           # Login to Azure
az webapp log tail --name APP --resource-group RG  # View logs
az webapp restart --name APP --resource-group RG   # Restart app
azd deploy                                         # Deploy updates
```

---

## 📋 Configuration Files

### `.env.local` (Frontend - Development)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="TCA Investment Platform"
NODE_ENV=development
```

### `backend/.env` (Backend - Development)

```env
DATABASE_URL=sqlite:///./tca_platform.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
SECRET_KEY=dev-secret-key
```

### `.env.production` (Production)

```env
NEXT_PUBLIC_API_URL=https://your-app.azurewebsites.net
DATABASE_URL=your-azure-db-connection-string
SECRET_KEY=strong-production-secret
DEBUG=False
```

---

## 🔍 Troubleshooting Quick Fixes

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Fix Broken Dependencies

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
pip install --upgrade -r requirements.txt
```

### Clear Cache

```bash
# Frontend
rm -rf .next
npm run dev

# Backend
rm -rf __pycache__
find . -type d -name __pycache__ -exec rm -rf {} +
```

---

## 📦 Required Installations

### Development Machine

- ✅ Node.js 18.17.0+
- ✅ Python 3.9+
- ✅ Git
- ✅ VS Code (recommended)

### Azure Deployment

- ✅ Azure CLI
- ✅ Azure Developer CLI (azd)
- ✅ Azure Account

---

## 🌐 Access Points

### Local Development

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000/docs>
- Health Check: <http://localhost:8000/health>

### Azure Production

- Frontend: <https://tca-irr-app.azurewebsites.net>
- Backend API: <https://tca-irr-backend.azurewebsites.net/docs>
- Health: <https://tca-irr-backend.azurewebsites.net/health>

---

## 💰 Azure Cost Estimate

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| App Service | B1 | ~$13 |
| Database | S0 | ~$15 |
| Storage | Standard | ~$2 |
| **Total Basic** | | **~$30/mo** |
| **Production** | P1V2 + Standard DB | **~$100-200/mo** |

---

## 📞 Support

- Full Guide: See `DEPLOYMENT-GUIDE-COMPLETE.md`
- Issues: GitHub Issues
- Docs: `/docs` folder in project

---

*Quick Reference v1.0 - Last Updated: November 7, 2025*
