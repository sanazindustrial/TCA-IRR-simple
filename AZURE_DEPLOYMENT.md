# Azure Deployment Guide for TCA-IRR App

This guide will help you deploy your TCA-IRR Next.js application to Azure using Azure Static Web Apps and Azure Functions.

## 📋 Prerequisites

### Required Tools

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Developer CLI (azd)** - [Install azd](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)
3. **Node.js 18+** (already installed)
4. **Azure Subscription** with appropriate permissions

### Quick Installation (Windows)

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Azure Developer CLI
winget install Microsoft.Azd
```

## 🔧 Setup Steps

### 1. Azure Account Setup

```bash
# Login to Azure
az login
azd auth login

# Set your subscription (if you have multiple)
az account set --subscription "your-subscription-id"
```

### 2. Environment Configuration

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your configuration values in `.env.local`:
   - Google GenAI API Key
   - Firebase configuration
   - Azure subscription details

### 3. Project Configuration

The project is already configured for Azure deployment with:

- ✅ `azure.yaml` - Azure Developer CLI configuration
- ✅ `infra/main.bicep` - Infrastructure as Code
- ✅ `next.config.ts` - Static export configuration
- ✅ GitHub Actions workflow

## 🚀 Deployment Options

### Option 1: Automated Script (Recommended)

#### For Windows (PowerShell)

```powershell
.\deploy.ps1
```

#### For macOS/Linux (Bash)

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Initialize Azure environment:**

   ```bash
   azd env new prod
   ```

3. **Preview deployment:**

   ```bash
   azd provision --preview
   ```

4. **Deploy to Azure:**

   ```bash
   azd up
   ```

### Option 3: GitHub Actions (CI/CD)

1. **Configure GitHub Secrets:**
   Go to your repository settings and add these secrets:
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`

2. **Setup Azure Service Principal:**

   ```bash
   az ad sp create-for-rbac --name "tca-irr-github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id} \
     --json-auth
   ```

3. **Push to main branch** - Deployment will trigger automatically

## 📦 Azure Resources Created

Your deployment will create these Azure resources:

| Resource | Type | Purpose |
|----------|------|---------|
| Static Web App | Azure Static Web Apps | Hosts the Next.js frontend |
| Function App | Azure Functions | Handles API routes |
| Storage Account | Azure Storage | Stores documents and files |
| Key Vault | Azure Key Vault | Secures API keys and secrets |
| Application Insights | Azure Monitor | Application monitoring |
| Log Analytics | Azure Monitor | Centralized logging |

## 🔒 Security Configuration

### Secrets Management

Store these secrets in Azure Key Vault:

- Google GenAI API Key
- Firebase Admin SDK configuration
- Database connection strings (if applicable)

### Access the Key Vault

```bash
# List your Key Vault
az keyvault list --output table

# Add a secret
az keyvault secret set --vault-name "your-keyvault-name" \
  --name "GoogleGenAIApiKey" \
  --value "your-api-key"
```

## 🎯 Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Check deployment status
azd show

# View application logs
azd logs
```

### 2. Configure Custom Domain (Optional)

1. Go to Azure Portal → Static Web Apps
2. Navigate to "Custom domains"
3. Add your domain and configure DNS

### 3. Set up Monitoring

1. Access Application Insights in Azure Portal
2. Create custom dashboards
3. Set up alerts for errors or performance issues

## 🛠 Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Check build locally
npm run build

# Clear cache and rebuild
npm run clean
npm install
npm run build
```

**Authentication Issues:**

```bash
# Re-authenticate
az logout
az login
azd auth login
```

**Deployment Errors:**

```bash
# Check deployment logs
azd logs

# View detailed errors
azd up --debug
```

### Support Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Developer CLI Documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## 📊 Cost Estimation

**Monthly costs for typical usage:**

- Azure Static Web Apps (Standard): ~$9
- Azure Functions (Consumption): ~$5-15
- Storage Account: ~$1-5
- Key Vault: ~$1
- Application Insights: ~$0-10

**Total estimated monthly cost: $16-40**

## 🔄 Updates and Maintenance

### Update Application

```bash
# Deploy updates
npm run build
azd deploy
```

### Update Infrastructure

```bash
# Modify infra/main.bicep then run:
azd provision
```

### Monitor Resources

```bash
# Check resource usage
az monitor metrics list --resource "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/staticSites/{name}"
```

## 📞 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Azure Portal logs
3. Check GitHub Actions workflow logs (if using CI/CD)
4. Consult Azure documentation links provided

---

**Happy Deploying! 🎉**
