#!/bin/bash
# Azure Deployment Script for TCA-IRR App
# This script will deploy your Next.js application to Azure using Azure Developer CLI

set -e  # Exit on any error

echo "🚀 Starting Azure deployment for TCA-IRR App..."

# Check if azd is installed
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI (azd) is not installed."
    echo "Please install it from: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd"
    exit 1
fi

# Check if az CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI (az) is not installed."
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Login to Azure if not already logged in
echo "🔐 Checking Azure authentication..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure:"
    az login
    azd auth login
else
    echo "✅ Already logged in to Azure"
fi

# Set environment variables
export AZURE_ENV_NAME="${AZURE_ENV_NAME:-prod}"
export AZURE_LOCATION="${AZURE_LOCATION:-eastus2}"

echo "📝 Environment: $AZURE_ENV_NAME"
echo "📍 Location: $AZURE_LOCATION"

# Build the application
echo "🏗️  Building Next.js application..."
npm run build

# Initialize azd if not already done
if [ ! -f ".azure/$AZURE_ENV_NAME/.env" ]; then
    echo "🔧 Initializing Azure Developer environment..."
    azd env new $AZURE_ENV_NAME
fi

# Provision and deploy
echo "☁️  Provisioning Azure infrastructure..."
azd provision --preview

read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Azure..."
    azd up --no-prompt
    
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your application should be available at the URL shown above."
    
    # Get the deployment information
    echo "📋 Deployment Summary:"
    azd show
else
    echo "❌ Deployment cancelled by user"
    exit 0
fi

echo "🎉 Deployment process completed!"