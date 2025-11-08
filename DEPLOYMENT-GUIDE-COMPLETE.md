# TCA-IRR Application - Complete Deployment Guide

## Table of Contents

1. [Local Deployment (New Computer)](#local-deployment-new-computer)
2. [Azure Cloud Deployment](#azure-cloud-deployment)
3. [Troubleshooting](#troubleshooting)

---

## Local Deployment (New Computer)

### Prerequisites

Before starting, ensure you have:

- **Node.js** 18.17.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.6.7 or higher (comes with Node.js)
- **Python** 3.9 or higher (for backend) ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git

# Navigate to project directory
cd TCA-IRR-simple
```

### Step 2: Install Frontend Dependencies

```bash
# Install Node.js packages
npm install

# This will install all dependencies listed in package.json
# Wait for completion (may take 2-5 minutes)
```

### Step 3: Configure Environment Variables

```bash
# Copy environment example file
copy .env.example .env.local
```

Edit `.env.local` and configure:

```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="TCA Investment Platform"

# Google Genkit AI Configuration (Optional)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here

# Development Mode
NODE_ENV=development
```

### Step 4: Install and Configure Backend (Python)

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 5: Configure Backend Environment

```bash
# In backend directory, copy environment example
copy .env.development.example .env
```

Edit `backend/.env`:

```env
# Database Configuration
DATABASE_URL=sqlite:///./tca_platform.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Settings
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

### Step 6: Initialize Database

```bash
# Still in backend directory with venv activated
python scripts/init_database.py
```

### Step 7: Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
python main.py
```

Backend will start at: <http://localhost:8000>

**Terminal 2 - Frontend:**

```bash
# In project root directory
npm run dev
```

Frontend will start at: <http://localhost:3000> (or 3001 if 3000 is busy)

### Step 8: Verify Deployment

Open your browser and navigate to:

- **Frontend**: <http://localhost:3000>
- **Backend API Docs**: <http://localhost:8000/docs>
- **Backend Health**: <http://localhost:8000/health>

### Step 9: Create Admin User (Optional)

```bash
# In backend directory
python -c "from app.core.security import create_admin_user; create_admin_user()"
```

---

## Azure Cloud Deployment

### Prerequisites

- **Azure Account** ([Sign up](https://azure.microsoft.com/free/))
- **Azure CLI** installed ([Download](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Azure Developer CLI (azd)** installed ([Download](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd))
- **Git** and **Node.js** installed

### Step 1: Prepare Azure Environment

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify login
az account show
```

### Step 2: Install Azure Developer CLI

```powershell
# Windows (PowerShell as Administrator)
powershell -ex AllSigned -c "Invoke-RestMethod 'https://aka.ms/install-azd.ps1' | Invoke-Expression"

# Verify installation
azd version
```

### Step 3: Initialize Azure Developer Environment

```bash
# In project root directory
azd init

# Follow prompts:
# - Environment name: tca-irr-prod (or your preferred name)
# - Azure subscription: Select your subscription
# - Azure location: Select closest region (e.g., eastus, westus2)
```

### Step 4: Configure Production Environment Variables

Create `.env.production`:

```env
# Production Configuration
NEXT_PUBLIC_API_URL=https://your-app-name.azurewebsites.net
NEXT_PUBLIC_APP_NAME="TCA Investment Platform"

# Security (Generate strong values)
SECRET_KEY=generate-strong-secret-key-here
JWT_SECRET=generate-strong-jwt-secret-here

# Database (Azure SQL or PostgreSQL)
DATABASE_URL=your-azure-database-connection-string

# Google AI
GOOGLE_GENAI_API_KEY=your_production_api_key
```

### Step 5: Configure Azure Resources

Edit `azure.yaml` if needed (already configured):

```yaml
name: tca-irr-app
services:
  web:
    project: .
    language: js
    host: appservice
```

### Step 6: Deploy to Azure

```bash
# Deploy everything (infrastructure + application)
azd up

# This will:
# 1. Create Azure resource group
# 2. Provision App Service
# 3. Create storage accounts
# 4. Deploy frontend
# 5. Deploy backend
# 6. Configure networking

# Wait for deployment (typically 5-15 minutes)
```

### Step 7: Alternative - Manual Azure Deployment

If you prefer manual deployment:

#### Option A: Deploy Frontend to Azure Static Web Apps

```bash
# Build the application
npm run build

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy to Azure
swa deploy --app-location . --output-location .next

# Follow prompts to select/create Static Web App
```

#### Option B: Deploy to Azure App Service

```bash
# Create resource group
az group create --name tca-irr-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name tca-irr-plan \
  --resource-group tca-irr-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name tca-irr-app \
  --resource-group tca-irr-rg \
  --plan tca-irr-plan \
  --runtime "NODE:18-lts"

# Deploy code
az webapp deployment source config-zip \
  --resource-group tca-irr-rg \
  --name tca-irr-app \
  --src deploy.zip
```

### Step 8: Configure Backend Deployment

```bash
# Navigate to backend
cd backend

# Create requirements.txt if not exists
pip freeze > requirements.txt

# Create backend App Service
az webapp create \
  --name tca-irr-backend \
  --resource-group tca-irr-rg \
  --plan tca-irr-plan \
  --runtime "PYTHON:3.9"

# Configure environment variables
az webapp config appsettings set \
  --name tca-irr-backend \
  --resource-group tca-irr-rg \
  --settings \
    DATABASE_URL="your-connection-string" \
    SECRET_KEY="your-secret-key"

# Deploy backend
az webapp up \
  --name tca-irr-backend \
  --resource-group tca-irr-rg \
  --runtime "PYTHON:3.9"
```

### Step 9: Set up Azure Database

#### Option A: Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name tca-irr-sql-server \
  --resource-group tca-irr-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password YourStrongPassword123!

# Create database
az sql db create \
  --server tca-irr-sql-server \
  --resource-group tca-irr-rg \
  --name tca-platform-db \
  --service-objective S0

# Get connection string
az sql db show-connection-string \
  --server tca-irr-sql-server \
  --name tca-platform-db \
  --client ado.net
```

#### Option B: Azure PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create \
  --name tca-irr-postgres \
  --resource-group tca-irr-rg \
  --location eastus \
  --admin-user pgadmin \
  --admin-password YourStrongPassword123! \
  --sku-name B_Gen5_1

# Create database
az postgres db create \
  --server-name tca-irr-postgres \
  --resource-group tca-irr-rg \
  --name tca_platform_db
```

### Step 10: Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name tca-irr-app \
  --resource-group tca-irr-rg \
  --hostname yourdomain.com

# Enable HTTPS
az webapp config ssl bind \
  --name tca-irr-app \
  --resource-group tca-irr-rg \
  --certificate-thumbprint thumbprint \
  --ssl-type SNI
```

### Step 11: Verify Azure Deployment

1. **Frontend URL**: <https://tca-irr-app.azurewebsites.net>
2. **Backend API**: <https://tca-irr-backend.azurewebsites.net/docs>
3. **Health Check**: <https://tca-irr-backend.azurewebsites.net/health>

### Step 12: Monitor and Scale

```bash
# View logs
az webapp log tail --name tca-irr-app --resource-group tca-irr-rg

# Scale up
az appservice plan update \
  --name tca-irr-plan \
  --resource-group tca-irr-rg \
  --sku P1V2

# Enable autoscaling
az monitor autoscale create \
  --resource-group tca-irr-rg \
  --resource tca-irr-app \
  --resource-type Microsoft.Web/sites \
  --name autoscale-tca \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

---

## Quick Deployment Commands

### Local Development (Quick Start)

```bash
# Terminal 1 - Frontend
npm install
npm run dev

# Terminal 2 - Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Azure Deployment (Quick)

```bash
# One-command deployment
azd up

# Or manual steps
az login
npm run build
az webapp up --name tca-irr-app --runtime "NODE:18-lts"
```

---

## Troubleshooting

### Common Local Issues

**Issue: Port already in use**

```bash
# Find process using port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <process_id> /F
```

**Issue: Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Python venv activation fails**

```bash
# Windows - Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Common Azure Issues

**Issue: Deployment fails**

```bash
# Check logs
az webapp log tail --name tca-irr-app --resource-group tca-irr-rg

# Restart app
az webapp restart --name tca-irr-app --resource-group tca-irr-rg
```

**Issue: Database connection fails**

```bash
# Check firewall rules
az sql server firewall-rule create \
  --server tca-irr-sql-server \
  --resource-group tca-irr-rg \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Issue: Environment variables not set**

```bash
# List current settings
az webapp config appsettings list --name tca-irr-app --resource-group tca-irr-rg

# Update settings
az webapp config appsettings set --name tca-irr-app --resource-group tca-irr-rg --settings KEY=VALUE
```

---

## Production Checklist

Before going to production:

- [ ] Change all default passwords/secrets
- [ ] Set up SSL/HTTPS
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Configure logging and error tracking
- [ ] Perform security audit
- [ ] Set up staging environment
- [ ] Document deployment process
- [ ] Create rollback plan

---

## Support Resources

- **Documentation**: See README.md and other docs in project
- **Azure Portal**: <https://portal.azure.com>
- **Azure CLI Docs**: <https://docs.microsoft.com/cli/azure/>
- **Next.js Deployment**: <https://nextjs.org/docs/deployment>
- **FastAPI Deployment**: <https://fastapi.tiangolo.com/deployment/>

---

## Estimated Costs

### Azure Resources (Monthly Estimates)

- **App Service (B1)**: ~$13/month
- **App Service (P1V2)**: ~$73/month
- **Azure SQL (S0)**: ~$15/month
- **Azure PostgreSQL (B1)**: ~$26/month
- **Storage**: ~$1-5/month
- **Bandwidth**: Variable

**Total Small Deployment**: ~$30-50/month
**Total Production Deployment**: ~$100-200/month

---

*Last Updated: November 7, 2025*
