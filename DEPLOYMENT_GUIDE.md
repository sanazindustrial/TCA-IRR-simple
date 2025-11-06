# TCA-IRR Application Deployment Guide

## 🚀 Current Status - VERIFIED WORKING ✅

### Local Development Status

- ✅ **Frontend (Next.js)**: Running on <http://localhost:3000>
- ✅ **Backend (FastAPI)**: Running on <http://localhost:8000> (port 8000)
- ✅ **Python Dependencies**: All installed via requirements.txt
- ✅ **Node Dependencies**: All installed via package.json
- ✅ **Production Build**: Successfully compiled 65 pages
- ✅ **GitHub Repository**: <https://github.com/sanazindustrial/TCA-IRR-simple>

## 🏗️ Architecture Overview

```
TCA-IRR Application Stack:
├── Frontend (Next.js 15 + React 18 + TypeScript)
│   ├── Port: 3000
│   ├── UI Framework: Shadcn/UI + Tailwind CSS
│   └── AI Integration: Google Genkit flows
├── Backend (FastAPI + Python 3.12)
│   ├── Port: 8000
│   ├── Database: Azure PostgreSQL
│   ├── Authentication: JWT + bcrypt
│   └── API: RESTful endpoints
└── Azure Cloud Infrastructure
    ├── App Service (Frontend hosting)
    ├── Functions App (Serverless backend)
    ├── PostgreSQL Database
    ├── Key Vault (Secrets)
    └── Storage Account (Documents)
```

## 🚀 Deployment Options

### Option 1: Azure App Service (Recommended)

#### Prerequisites

- Azure CLI installed: `az --version`
- Azure Developer CLI installed: `azd --version`
- Node.js 18+ installed: `node --version`
- Python 3.12+ installed: `py --version`

#### Quick Deploy

```bash
# 1. Clone and setup
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple

# 2. Install dependencies
npm install
py -m pip install -r requirements.txt

# 3. Deploy to Azure
.\deploy.ps1 -EnvironmentName "prod" -Location "eastus2"
```

#### Manual Azure Deployment

1. **Login to Azure**

   ```bash
   az login
   azd auth login
   ```

2. **Set Environment Variables**

   ```bash
   $env:AZURE_ENV_NAME = "tca-irr-prod"
   $env:AZURE_LOCATION = "eastus2"
   ```

3. **Build Application**

   ```bash
   npm run build
   ```

4. **Deploy Infrastructure**

   ```bash
   azd provision
   azd up
   ```

### Option 2: Docker Deployment (Alternative)

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Backend Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=tca_platform
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🛠️ Local Development Setup

### 1. Quick Start (Both Frontend & Backend)

```bash
# Terminal 1 - Backend
py main.py
# Backend will run on http://localhost:8000

# Terminal 2 - Frontend  
npm run dev
# Frontend will run on http://localhost:3000
```

### 2. Environment Configuration

Create `.env.local`:

```env
# Database Configuration
DATABASE_URL=postgresql://tcairrserver:Tc@1rr53rv5r@tca-irr-server.postgres.database.azure.com:5432/tca_platform?sslmode=require

# Google GenAI Configuration
GOOGLE_GENAI_API_KEY=your-google-genai-api-key-here

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-minimum-32-chars

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Database Setup

```bash
# Initialize database schema
py init_db.py

# Test database connection
py test_connection.py
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts without errors (`py main.py`)
- [ ] All tests pass (`npm test`)
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Security settings reviewed

### Azure Deployment

- [ ] Azure CLI authenticated (`az login`)
- [ ] Resource group exists
- [ ] Bicep templates validated
- [ ] Key Vault secrets configured
- [ ] Database connection strings set
- [ ] Domain/DNS configured (if custom domain)

### Post-Deployment

- [ ] Application accessible via URL
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] Authentication working
- [ ] Monitoring/logging configured

## 🔧 Configuration Management

### Frontend Configuration

- **Build Output**: `.next/` directory
- **Environment**: Production optimized
- **Routing**: App Router (Next.js 15)
- **Styling**: Tailwind CSS + Shadcn/UI

### Backend Configuration  

- **Framework**: FastAPI with Uvicorn
- **Database**: Azure PostgreSQL with asyncpg
- **Authentication**: JWT tokens with bcrypt
- **Monitoring**: Azure Application Insights

### Azure Resources Created

```
Resource Group: tca-irr-rg-{unique-id}
├── App Service Plan (B1): tc-asp-{unique-id}
├── Web App (Frontend): tc-web-{unique-id}
├── Function App (Backend): tc-func-{unique-id}  
├── Storage Account: tcst{unique-id}
├── Key Vault: tc-kv-{unique-id}
├── Application Insights: tc-ai-{unique-id}
└── Log Analytics: tc-log-{unique-id}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Backend Connection Issues**

   ```bash
   # Check Python dependencies
   py -m pip list | grep fastapi
   
   # Test database connection
   py test_connection.py
   ```

3. **Azure Deployment Errors**

   ```bash
   # Check Azure CLI version
   az --version
   
   # Re-authenticate
   az login --use-device-code
   ```

### Health Checks

Frontend Health: `GET http://localhost:3000/`
Backend Health: `GET http://localhost:8000/health`
Database Health: Check via backend `/health` endpoint

## 📊 Monitoring & Maintenance

### Application Insights

- Performance monitoring enabled
- Custom telemetry for business metrics
- Error tracking and alerts

### Logging

- Structured logging via Azure Monitor
- Application logs in Log Analytics
- Performance counters tracked

### Backup Strategy

- Database: Automated daily backups
- Code: Git repository on GitHub
- Configuration: Azure Key Vault backup

---

## 🎉 Deployment Success

After successful deployment:

1. **Frontend URL**: `https://tc-web-{unique-id}.azurewebsites.net`
2. **Backend URL**: `https://tc-func-{unique-id}.azurewebsites.net`
3. **Monitor**: Azure Application Insights dashboard
4. **Logs**: Azure Log Analytics workspace

**Repository**: <https://github.com/sanazindustrial/TCA-IRR-simple>  
**Status**: ✅ Ready for production deployment
