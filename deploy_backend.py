#!/usr/bin/env python3
"""
TCA-IRR Backend Deployment Script
Handles deployment of FastAPI backend to Azure Functions or App Service
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, description, shell=True):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=shell, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None

def check_prerequisites():
    """Check if required tools are installed"""
    print("🔍 Checking prerequisites...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major != 3 or python_version.minor < 8:
        print("❌ Python 3.8+ required")
        return False
    
    # Check Azure CLI
    if not run_command("az --version", "Checking Azure CLI"):
        return False
    
    # Check if logged in to Azure
    if not run_command("az account show", "Checking Azure authentication"):
        print("🔐 Please log in to Azure: az login")
        return False
    
    print("✅ All prerequisites met")
    return True

def install_dependencies():
    """Install Python dependencies"""
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        return False
    return True

def test_backend():
    """Test backend functionality"""
    print("🧪 Testing backend...")
    
    # Import and test main components
    try:
        from main import app
        from database_config import db_config, db_manager
        print("✅ Backend imports successful")
        return True
    except ImportError as e:
        print(f"❌ Backend import failed: {e}")
        return False

def deploy_to_azure():
    """Deploy to Azure using various methods"""
    print("☁️ Starting Azure deployment...")
    
    # Method 1: Azure Developer CLI (if available)
    if run_command("azd --version", "Checking Azure Developer CLI", shell=True):
        print("📦 Deploying with Azure Developer CLI...")
        if run_command("azd up --no-prompt", "Azure Developer CLI deployment"):
            return True
    
    # Method 2: Azure Functions Core Tools
    if run_command("func --version", "Checking Azure Functions Core Tools"):
        print("⚡ Deploying to Azure Functions...")
        # Create function app structure if needed
        create_function_structure()
        if run_command("func azure functionapp publish tca-irr-functions", "Functions deployment"):
            return True
    
    # Method 3: Azure App Service
    print("🌐 Deploying to Azure App Service...")
    if deploy_to_app_service():
        return True
    
    print("❌ All deployment methods failed")
    return False

def create_function_structure():
    """Create Azure Functions project structure"""
    print("📁 Creating Azure Functions structure...")
    
    # Create function.json for HTTP trigger
    function_json = {
        "bindings": [
            {
                "authLevel": "anonymous",
                "type": "httpTrigger",
                "direction": "in",
                "name": "req",
                "methods": ["get", "post", "put", "delete", "patch"]
            },
            {
                "type": "http",
                "direction": "out",
                "name": "$return"
            }
        ]
    }
    
    # Create directories
    os.makedirs("HttpTrigger", exist_ok=True)
    
    # Write function.json
    with open("HttpTrigger/function.json", "w") as f:
        json.dump(function_json, f, indent=2)
    
    # Create __init__.py for Azure Functions
    function_init = """
import azure.functions as func
from main import app
import nest_asyncio

nest_asyncio.apply()

async def main(req: func.HttpRequest) -> func.HttpResponse:
    \"\"\"Azure Functions entry point\"\"\"
    return func.AsgiMiddleware(app).handle(req)
"""
    
    with open("HttpTrigger/__init__.py", "w") as f:
        f.write(function_init.strip())
    
    # Create host.json
    host_json = {
        "version": "2.0",
        "functionTimeout": "00:05:00",
        "extensions": {
            "http": {
                "routePrefix": ""
            }
        }
    }
    
    with open("host.json", "w") as f:
        json.dump(host_json, f, indent=2)
    
    print("✅ Azure Functions structure created")

def deploy_to_app_service():
    """Deploy to Azure App Service"""
    app_name = "tca-irr-backend"
    resource_group = "tca-irr-rg"
    
    # Create App Service plan
    run_command(
        f"az appservice plan create --name {app_name}-plan --resource-group {resource_group} --sku B1 --is-linux",
        "Creating App Service plan"
    )
    
    # Create Web App
    run_command(
        f"az webapp create --name {app_name} --resource-group {resource_group} --plan {app_name}-plan --runtime 'PYTHON|3.12'",
        "Creating Web App"
    )
    
    # Configure startup command
    startup_command = "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
    run_command(
        f"az webapp config set --name {app_name} --resource-group {resource_group} --startup-file '{startup_command}'",
        "Setting startup command"
    )
    
    # Deploy code
    if run_command(f"az webapp up --name {app_name} --resource-group {resource_group} --runtime 'PYTHON|3.12'", "Deploying to App Service"):
        print(f"✅ Backend deployed to: https://{app_name}.azurewebsites.net")
        return True
    
    return False

def main():
    """Main deployment function"""
    print("🚀 TCA-IRR Backend Deployment Starting...")
    print("=" * 50)
    
    # Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites check failed")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Dependency installation failed")
        sys.exit(1)
    
    # Test backend
    if not test_backend():
        print("❌ Backend testing failed")
        sys.exit(1)
    
    # Deploy to Azure
    if not deploy_to_azure():
        print("❌ Deployment failed")
        sys.exit(1)
    
    print("🎉 Backend deployment completed successfully!")
    print("=" * 50)
    print("📋 Next steps:")
    print("1. Test your deployed backend endpoints")
    print("2. Update frontend configuration with backend URL")
    print("3. Configure database connection strings")
    print("4. Set up monitoring and alerts")

if __name__ == "__main__":
    main()