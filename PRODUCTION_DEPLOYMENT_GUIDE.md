# 🚀 TCA-IRR Production Deployment Guide

## Overview

This guide will help you deploy the TCA Investment Risk Review application to production on Azure.

## Prerequisites

### Required Software

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (latest version)
- [Node.js 18+](https://nodejs.org/) and npm
- [Python 3.11+](https://python.org/)
- PowerShell (Windows) or Bash (Linux/macOS)
- [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)

### Azure Requirements

- Active Azure subscription
- Resource group creation permissions
- App Service deployment permissions

## 🎯 Quick Deployment (Automated)

### Option 1: PowerShell Script Deployment

```powershell
# Run the automated deployment script
./deploy-production.ps1

# Or with force flag to skip confirmations
./deploy-production.ps1 -Force

# Or specify custom parameters
./deploy-production.ps1 -Environment "production" -ResourceGroup "my-tca-rg" -AppName "my-tca-app"
```

### Option 2: NPM Script Deployment

```bash
# Quick deployment via npm
npm run deploy

# Force deployment (skips confirmations)
npm run deploy:force
```

## 📋 Manual Deployment Steps

### 1. Prepare the Environment

```bash
# Clone and navigate to project
git clone <repository-url>
cd TCA-IRR-APP-main-simplify

# Install dependencies
npm ci
pip install -r requirements.txt
```

### 2. Build the Application

```bash
# Build for production
npm run build

# Verify build (optional)
npm run typecheck
```

### 3. Azure Authentication

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "your-subscription-id"

# Verify authentication
az account show
```

### 4. Create Azure Resources

```bash
# Create resource group
az group create --name "tca-irr-rg" --location "East US 2"

# Create App Service Plan
az appservice plan create \
  --name "tca-irr-plan" \
  --resource-group "tca-irr-rg" \
  --location "East US 2" \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --plan "tca-irr-plan" \
  --runtime "NODE:18-lts"
```

### 5. Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --settings \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    WEBSITE_NODE_DEFAULT_VERSION=18.17.0

# Configure startup command
az webapp config set \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --startup-file "npm start"
```

### 6. Deploy Application

```bash
# Create deployment package
npm run build
zip -r deployment.zip .next public package.json

# Deploy to Azure
az webapp deploy \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --src-path deployment.zip \
  --type zip
```

## 🔧 Configuration

### Environment Variables

Add these to your Azure Web App settings:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
GOOGLE_GENAI_API_KEY=your-api-key-here
```

### Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --hostname "your-domain.com"

# Enable SSL
az webapp config ssl bind \
  --name "tca-irr-app" \
  --resource-group "tca-irr-rg" \
  --certificate-thumbprint "thumbprint" \
  --ssl-type SNI
```

## 🔍 Verification

### Health Check

```bash
# Check application status
curl https://your-app-name.azurewebsites.net

# Check specific endpoints
curl https://your-app-name.azurewebsites.net/api/health
```

### Monitoring

```bash
# View application logs
az webapp log tail --name "tca-irr-app" --resource-group "tca-irr-rg"

# View metrics
az monitor metrics list \
  --resource "/subscriptions/{subscription}/resourceGroups/tca-irr-rg/providers/Microsoft.Web/sites/tca-irr-app" \
  --metric "Requests"
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### TypeScript Errors

```bash
# Type check only (without build)
npm run typecheck

# Force build despite type errors
npm run build # (configured to ignore TS errors in production)
```

#### Deployment Failures

```bash
# Check Azure Web App logs
az webapp log tail --name "tca-irr-app" --resource-group "tca-irr-rg"

# Restart the application
az webapp restart --name "tca-irr-app" --resource-group "tca-irr-rg"
```

#### Application Not Starting

1. Check environment variables are set correctly
2. Verify Node.js version in App Service
3. Check startup command configuration
4. Review application logs

### Debug Commands

```bash
# Get application information
az webapp show --name "tca-irr-app" --resource-group "tca-irr-rg"

# Check configuration
az webapp config show --name "tca-irr-app" --resource-group "tca-irr-rg"

# View deployment history
az webapp deployment list --name "tca-irr-app" --resource-group "tca-irr-rg"
```

## 📊 Post-Deployment

### Performance Optimization

1. **Enable Application Insights** for monitoring
2. **Configure CDN** for static assets
3. **Set up auto-scaling** rules
4. **Enable caching** for better performance

### Security

1. **Configure SSL/TLS** certificates
2. **Set up custom domain** with proper DNS
3. **Review security headers** in next.config.ts
4. **Enable authentication** if required

### Monitoring

1. **Set up alerts** for errors and performance
2. **Configure log analytics**
3. **Monitor resource usage**
4. **Set up health checks**

## 🎉 Success

Your TCA-IRR application should now be running at:

- **Production URL**: <https://your-app-name.azurewebsites.net>
- **Azure Portal**: <https://portal.azure.com>

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review Azure Web App logs
3. Verify all prerequisites are installed
4. Contact the development team with specific error messages

---

**Note**: Replace placeholder values (your-app-name, your-subscription-id, etc.) with your actual Azure resource names.
