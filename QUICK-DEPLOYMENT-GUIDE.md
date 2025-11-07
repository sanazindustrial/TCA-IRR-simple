# 🚀 Quick Deployment Guide - TCA-IRR Platform

## Overview
This guide provides step-by-step instructions for deploying the TCA-IRR Platform locally and on Azure.

## 📋 Prerequisites

### Required Software
- **Git**: Version control
- **Node.js**: 18+ or 20+
- **Python**: 3.12+
- **Azure CLI**: Latest version
- **PostgreSQL**: 14+ (for local development)

### Azure Requirements
- Active Azure subscription
- Resource group with contributor permissions
- App Service plan availability

## 🖥️ Local Development Deployment

### Step 1: Repository Setup
```bash
# Clone repository
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple

# Verify repository structure
ls -la
# Should see: backend/, src/, package.json, README.md
```

### Step 2: Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with local configuration
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env.local
echo "NEXTAUTH_SECRET=local-dev-secret-key" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

# Test build
npm run build

# Start development server
npm run dev
```

**Verification**: Open http://localhost:3000 - should see TCA-IRR interface

### Step 3: Backend Setup
```bash
# Navigate to backend
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# MacOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create backend environment file
cp .env.example .env

# Edit .env with local configuration
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/tcairr" >> .env
echo "JWT_SECRET_KEY=local-jwt-secret-key" >> .env
echo "FRONTEND_URL=http://localhost:3000" >> .env

# Start backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Verification**: Open http://localhost:8000/docs - should see API documentation

### Step 4: Database Setup (Optional for Local)
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from postgresql.org
# MacOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE tcairr;
CREATE USER tca_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE tcairr TO tca_user;
\q

# Initialize database
cd backend
python init_database.py
```

### Step 5: Test 9-Module System
```bash
# Run comprehensive tests
cd ..
python test_simple_module_system.py

# Expected output:
# ✅ Module Configuration: PASS
# ✅ Data Mapping: PASS
# ✅ Analysis Execution: PASS
# ✅ Module Weighting: PASS
# 🚀 SYSTEM STATUS: READY FOR PRODUCTION
```

## ☁️ Azure Production Deployment

### Step 1: Azure CLI Login
```bash
# Login to Azure
az login

# Verify subscription
az account show

# Set default subscription (if multiple)
az account set --subscription "your-subscription-id"
```

### Step 2: Create Azure Resources
```bash
# Set variables for consistent naming
export RESOURCE_GROUP="tca-irr-rg"
export LOCATION="westus2"
export APP_SERVICE_PLAN="tca-irr-plan"
export FRONTEND_APP="tca-irr-frontend-$(date +%s)"
export BACKEND_APP="tca-irr-backend-$(date +%s)"
export DB_SERVER="tca-irr-db-$(date +%s)"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create PostgreSQL server
az postgres flexible-server create \
  --name $DB_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user tcaadmin \
  --admin-password "TCA2024!Secure" \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 14

# Allow Azure services access
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Step 3: Frontend Deployment
```bash
# Create frontend web app
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $FRONTEND_APP \
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --settings \
    NEXT_PUBLIC_API_URL="https://$BACKEND_APP.azurewebsites.net" \
    NEXTAUTH_URL="https://$FRONTEND_APP.azurewebsites.net" \
    NEXTAUTH_SECRET="production-secret-$(openssl rand -base64 32)"

# Build and deploy
npm run build
zip -r frontend-deploy.zip .next static public package.json next.config.ts

az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --src-path frontend-deploy.zip \
  --type zip
```

### Step 4: Backend Deployment
```bash
# Create backend web app
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP \
  --runtime "PYTHON:3.12"

# Get database connection string
DB_CONNECTION=$(az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER \
  --database-name postgres \
  --admin-user tcaadmin \
  --admin-password "TCA2024!Secure" \
  --query connectionStrings.psql_cmd \
  --output tsv | sed 's/psql //' | sed 's/ -c "select 1"//' | sed 's/postgresql:\/\//postgresql:\/\/tcaadmin:TCA2024!Secure@/')

# Configure backend environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    DATABASE_URL="$DB_CONNECTION" \
    JWT_SECRET_KEY="production-jwt-$(openssl rand -base64 32)" \
    FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net" \
    BACKEND_HOST="0.0.0.0" \
    BACKEND_PORT="8000"

# Deploy backend
cd backend
zip -r ../backend-deploy.zip . -x "__pycache__/*" "*.pyc" ".env"
cd ..

az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src-path backend-deploy.zip \
  --type zip
```

### Step 5: Database Initialization
```bash
# Connect to Azure PostgreSQL and initialize
cd backend
python3 -c "
import os
os.environ['DATABASE_URL'] = '$DB_CONNECTION'
from init_database import initialize_database
initialize_database()
print('Database initialized successfully!')
"
```

### Step 6: Verification & Health Checks
```bash
# Test frontend
curl -I https://$FRONTEND_APP.azurewebsites.net
# Expected: HTTP/1.1 200 OK

# Test backend API
curl -I https://$BACKEND_APP.azurewebsites.net/health
# Expected: HTTP/1.1 200 OK

# Test database connection
curl https://$BACKEND_APP.azurewebsites.net/health/database
# Expected: {"status": "healthy", "database": "connected"}

# Test 9-module system
curl -X POST https://$BACKEND_APP.azurewebsites.net/api/v1/analysis/comprehensive \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Test Company", "industry": "technology"}'
# Expected: Analysis result JSON
```

## 📊 Production Configuration

### Environment Variables Checklist

#### Frontend (.env.local for development, App Settings for Azure)
- ✅ `NEXT_PUBLIC_API_URL`: Backend URL
- ✅ `NEXTAUTH_SECRET`: Authentication secret
- ✅ `NEXTAUTH_URL`: Frontend URL
- ✅ `NEXT_PUBLIC_ENABLE_AI_FEATURES`: true
- ✅ `NEXT_PUBLIC_ENABLE_MODULE_CONFIG`: true

#### Backend (.env for development, App Settings for Azure)
- ✅ `DATABASE_URL`: PostgreSQL connection string
- ✅ `JWT_SECRET_KEY`: JWT signing secret
- ✅ `FRONTEND_URL`: Frontend URL for CORS
- ✅ `BACKEND_HOST`: 0.0.0.0
- ✅ `BACKEND_PORT`: 8000

### Security Considerations
- Use strong, unique passwords for database
- Enable HTTPS for all endpoints
- Configure proper CORS origins
- Use environment variables for secrets
- Enable Azure security features

## 🔧 Monitoring & Maintenance

### Health Check Endpoints
```bash
# Local development
curl http://localhost:3000/api/health
curl http://localhost:8000/health
curl http://localhost:8000/health/database

# Production
curl https://your-frontend-app.azurewebsites.net/api/health
curl https://your-backend-app.azurewebsites.net/health
curl https://your-backend-app.azurewebsites.net/health/database
```

### Application Logs
```bash
# View Azure logs
az webapp log tail --name $FRONTEND_APP --resource-group $RESOURCE_GROUP
az webapp log tail --name $BACKEND_APP --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download --name $BACKEND_APP --resource-group $RESOURCE_GROUP
```

### Performance Monitoring
```bash
# Enable Application Insights (optional)
az extension add --name application-insights

az monitor app-insights component create \
  --app tca-irr-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app tca-irr-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Add to app settings
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$INSIGHTS_KEY"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Backend Import Errors
```bash
# Reinstall Python dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

#### 3. Database Connection Issues
```bash
# Test database connection
cd backend
python -c "
from app.db.database import test_connection
test_connection()
"
```

#### 4. Azure Deployment Issues
```bash
# Check deployment logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart app service
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Environment-Specific Debugging

#### Local Development
- Check Node.js and Python versions
- Verify environment variable files
- Test database connectivity
- Check port availability (3000, 8000)

#### Azure Production
- Verify App Service configuration
- Check environment variables in Azure portal
- Review application logs
- Test network connectivity

## 📞 Support & Resources

### Documentation
- [Main README](README.md)
- [9-Module System Documentation](9-MODULE-ANALYSIS-IMPLEMENTATION.md)
- [Deployment Guide](DEPLOYMENT_READY.md)

### Useful Commands
```bash
# Quick local setup
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple
npm install
cd backend && pip install -r requirements.txt
cd .. && npm run dev

# Quick test
python test_simple_module_system.py

# Quick Azure deployment
az group create --name tca-irr-rg --location westus2
# ... follow Azure deployment steps above
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Repository cloned and dependencies installed
- [ ] Local environment tested successfully
- [ ] 9-module system tests passing
- [ ] Azure CLI authenticated and configured

### Local Deployment
- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:8000
- [ ] Database connected (if applicable)
- [ ] All health checks passing

### Azure Deployment
- [ ] Resource group created
- [ ] App Service plan configured
- [ ] PostgreSQL database deployed
- [ ] Frontend app deployed and accessible
- [ ] Backend app deployed with API documentation
- [ ] Environment variables configured
- [ ] Database initialized with schema
- [ ] Health endpoints responding
- [ ] 9-module system functional in production

### Post-Deployment
- [ ] Application Insights configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Security review completed
- [ ] Team access configured

---

**🎉 Congratulations! Your TCA-IRR Platform is now deployed and ready for production use.**

*For support, please refer to the documentation or create an issue in the GitHub repository.*