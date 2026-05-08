#!/usr/bin/env python3
"""
Deploy backend to Azure App Service using Kudu ZIP Deploy API
This script uses Basic authentication with deployment credentials
"""

import os
import sys
import zipfile
import requests
from pathlib import Path

# Configuration
APP_NAME = "tcairrapiccontainer"
KUDU_URL = f"https://{APP_NAME}.scm.azurewebsites.net/api/zipdeploy"

# Files to include in deployment
BACKEND_FILES = [
    "main.py",
    "requirements.txt",
    "database_config.py",
    "ai_integration.py",
    "ssd_tirr_report_config.py",
    "startup.sh",
]

def create_deployment_zip(workspace_dir: Path, zip_path: Path):
    """Create a ZIP file with backend files"""
    print(f"Creating deployment ZIP: {zip_path}")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for filename in BACKEND_FILES:
            filepath = workspace_dir / filename
            if filepath.exists():
                print(f"  Adding: {filename}")
                zf.write(filepath, filename)
            else:
                print(f"  Skipping (not found): {filename}")
        
        # Add startup script if missing
        if not (workspace_dir / "startup.sh").exists():
            startup_content = "gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"
            zf.writestr("startup.sh", startup_content)
            print("  Adding: startup.sh (generated)")
    
    print(f"ZIP created: {zip_path.stat().st_size / 1024:.1f} KB")

def deploy_to_azure(zip_path: Path, username: str, password: str):
    """Deploy ZIP to Azure App Service via Kudu"""
    print(f"\nDeploying to {APP_NAME}...")
    
    with open(zip_path, 'rb') as f:
        response = requests.post(
            KUDU_URL,
            data=f,
            auth=(username, password),
            headers={'Content-Type': 'application/octet-stream'},
            params={'isAsync': 'true'},
            timeout=300
        )
    
    if response.status_code in [200, 202]:
        print(f"✅ Deployment initiated successfully! Status: {response.status_code}")
        print("\nDeployment is processing...")
        print(f"Check app status at: https://{APP_NAME}.azurewebsites.net/api/health")
        return True
    else:
        print(f"❌ Deployment failed: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

def check_health():
    """Check if the API is responding"""
    health_url = f"https://{APP_NAME}.azurewebsites.net/api/health"
    try:
        response = requests.get(health_url, timeout=10)
        print(f"\nHealth Check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def main():
    workspace_dir = Path(__file__).parent
    zip_path = workspace_dir / "backend_deploy.zip"
    
    print("=" * 50)
    print("  TCA-IRR Backend Deployment to Azure")
    print("=" * 50)
    
    # Check for credentials
    username = os.environ.get("AZURE_DEPLOY_USER", "")
    password = os.environ.get("AZURE_DEPLOY_PASS", "")
    
    if not username or not password:
        print("\nDeployment credentials needed!")
        print("\nTo get credentials:")
        print(f"  1. Go to: https://portal.azure.com")
        print(f"  2. Navigate to: App Services > {APP_NAME} > Deployment Center")
        print(f"  3. Click 'FTPS credentials' tab")
        print(f"  4. Copy 'Username' and 'Password' under 'Application scope'")
        print()
        
        username = input("Enter username (starts with $): ").strip()
        password = input("Enter password: ").strip()
        
        if not username or not password:
            print("No credentials provided. Exiting.")
            sys.exit(1)
    
    # Create deployment package
    create_deployment_zip(workspace_dir, zip_path)
    
    # Deploy
    success = deploy_to_azure(zip_path, username, password)
    
    if success:
        print("\n" + "=" * 50)
        print("  Deployment initiated!")
        print("=" * 50)
        print(f"\nAPI URL: https://{APP_NAME}.azurewebsites.net")
        print(f"Health:  https://{APP_NAME}.azurewebsites.net/api/health")
        print(f"SSD:     https://{APP_NAME}.azurewebsites.net/api/ssd/audit/stats")
        print(f"\nNote: App may take 1-2 minutes to restart")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
