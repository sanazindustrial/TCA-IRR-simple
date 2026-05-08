# TCA-IRR Dynamic Web App - Azure Deployment & GitHub Setup

This repository contains a Next.js-based TCA-IRR application configured for dynamic deployment to Azure App Service.

## 🏗 Architecture Overview

**Dynamic Web Application Stack:**

- **Frontend**: Next.js 15.3.3 with React 18.3.1 (Azure App Service)
- **Backend**: Azure Functions (Node.js 18)
- **Database**: Azure PostgreSQL (existing)
- **Storage**: Azure Storage Account
- **Security**: Azure Key Vault + Managed Identity
- **Monitoring**: Application Insights + Log Analytics

## 🚀 Quick Start

### 1. Prerequisites

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Azure Developer CLI
winget install Microsoft.Azd

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configurations:
# - Google GenAI API Key
# - Firebase configuration
# - Azure subscription details
```

### 3. Deploy to Azure

```powershell
# Login to Azure
az login
azd auth login

# Deploy
.\deploy.ps1
```

## 📋 Azure Resources Created

| Service | Type | Purpose | SKU |
|---------|------|---------|-----|
| Web App | Azure App Service | Next.js Frontend | Basic B1 |
| Function App | Azure Functions | API Backend | Basic B1 |
| Storage Account | Azure Storage | File Storage | Standard LRS |
| Key Vault | Azure Key Vault | Secrets Management | Standard |
| Application Insights | Azure Monitor | Monitoring | Pay-as-you-go |
| PostgreSQL | Azure Database | Data Storage | Existing |

## 🔧 Configuration Files

### Core Configuration

- `azure.yaml` - Azure Developer CLI configuration
- `infra/main.bicep` - Infrastructure as Code (Bicep)
- `next.config.ts` - Next.js configuration for dynamic deployment
- `package.json` - Dependencies and scripts

### Deployment

- `deploy.ps1` - PowerShell deployment script
- `deploy.sh` - Bash deployment script
- `.github/workflows/azure-deploy.yml` - GitHub Actions CI/CD

## 🔗 GitHub Repository Setup

### Clone from GitHub

```bash
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple
npm install
```

### Push to GitHub (First Time)

```bash
# Initialize git repository
git init

# Add remote repository
git remote add origin https://github.com/sanazindustrial/TCA-IRR-simple.git

# Add all files
git add .

# Commit changes
git commit -m "Initial dynamic web app deployment setup"

# Push to GitHub
git push -u origin main
```

### Update Existing Repository

```bash
# Add and commit changes
git add .
git commit -m "Updated for dynamic Azure deployment"

# Push changes
git push origin main
```

## ⚙️ GitHub Actions Setup

### Configure Repository Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

```
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

### Create Service Principal

```bash
az ad sp create-for-rbac \
  --name "TCA-IRR-GitHub-Actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --json-auth
```

## 🔄 Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Deploy Changes

```bash
# Manual deployment
.\deploy.ps1

# Or push to main branch for automatic deployment
git push origin main
```

## 🌐 Environment Variables

### Required for Deployment

```bash
AZURE_ENV_NAME=prod
AZURE_LOCATION=eastus2
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

### Application Configuration

```bash
GOOGLE_GENAI_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_CONFIG=your-firebase-config
DATABASE_URL=postgresql://...
```

## 📊 Cost Estimation

**Monthly costs (USD):**

- Azure App Service (Basic B1): ~$13
- Azure Functions (Basic B1): ~$13
- Storage Account: ~$2-5
- Key Vault: ~$1
- Application Insights: ~$0-10

**Total: ~$30-45/month**

## 🔍 Monitoring & Troubleshooting

### Check Deployment Status

```bash
azd show
azd logs
```

### View Application Logs

```bash
# Azure CLI
az webapp log tail --name <app-name> --resource-group <rg-name>

# Azure Portal
# Navigate to App Service → Monitoring → Log stream
```

### Common Issues

**Build Failures:**

```bash
# Check build locally
npm run build

# View detailed logs
azd logs --service web
```

**Authentication Issues:**

```bash
# Re-authenticate
az logout && az login
azd auth login
```

## 🔒 Security Considerations

- ✅ HTTPS enforced on all services
- ✅ Managed Identity for secure access
- ✅ Secrets stored in Azure Key Vault
- ✅ Network security groups configured
- ✅ Application Insights for monitoring

## 📞 Support & Documentation

- **Azure App Service**: [Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- **Azure Developer CLI**: [Documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- **Next.js Deployment**: [Guide](https://nextjs.org/docs/deployment)
- **GitHub Actions**: [Documentation](https://docs.github.com/en/actions)

## 🎯 Next Steps

1. **Configure API Keys**: Update `.env.local` with your API keys
2. **Deploy to Azure**: Run `.\deploy.ps1`
3. **Setup CI/CD**: Configure GitHub Actions secrets
4. **Monitor Application**: Set up alerts in Azure Portal

---

**Happy Coding! 🚀**
