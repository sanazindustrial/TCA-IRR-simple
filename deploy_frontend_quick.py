#!/usr/bin/env python3
"""Quick frontend deployment script using Kudu zip deploy"""

import os
import sys
import zipfile
import requests
from requests.auth import HTTPBasicAuth
import time

# Configuration
WEBAPP_NAME = "TCA-IRR"
USER = "$TCA-IRR"
PASS = "DTeorydMXQoeBsvodiuZo1SFQAGSy04FiMgBw7aZ6imsypxYj9zpxnGgnvTQ"
KUDU_URL = f"https://{WEBAPP_NAME.lower()}.scm.azurewebsites.net"

def create_deployment_zip():
    """Create deployment zip from .next/standalone folder"""
    zip_path = "frontend-deploy.zip"
    standalone_dir = ".next/standalone"
    
    if not os.path.isdir(standalone_dir):
        print(f"ERROR: {standalone_dir} not found. Run 'npm run build' first.")
        sys.exit(1)
    
    print("Creating deployment zip from standalone build...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add everything from .next/standalone as the root
        for root, dirs, files in os.walk(standalone_dir):
            # Skip cache folder
            dirs[:] = [d for d in dirs if d != 'cache']
            for file in files:
                filepath = os.path.join(root, file)
                # Make paths relative to standalone folder
                arcname = os.path.relpath(filepath, standalone_dir)
                zf.write(filepath, arcname)
        
        # Also copy the static folder from .next to .next inside the zip
        static_dir = ".next/static"
        if os.path.isdir(static_dir):
            print(f"  Adding static assets...")
            for root, dirs, files in os.walk(static_dir):
                for file in files:
                    filepath = os.path.join(root, file)
                    # Preserve .next/static path structure
                    arcname = filepath  # Keeps .next/static/...
                    zf.write(filepath, arcname)
                        
    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Created {zip_path}: {size_mb:.2f} MB")
    return zip_path

def deploy_zip(zip_path):
    """Deploy zip using Kudu zipdeploy API"""
    print(f"Deploying {zip_path} to {WEBAPP_NAME}...")
    
    deploy_url = f"{KUDU_URL}/api/zipdeploy?isAsync=true"
    auth = HTTPBasicAuth(USER, PASS)
    
    with open(zip_path, 'rb') as f:
        headers = {"Content-Type": "application/zip"}
        response = requests.post(
            deploy_url,
            data=f,
            auth=auth,
            headers=headers,
            timeout=600
        )
    
    if response.status_code == 202:
        print("Deployment started asynchronously")
        # Poll for completion
        location = response.headers.get('Location', '')
        if location:
            for _ in range(60):  # Wait up to 10 minutes
                time.sleep(10)
                status = requests.get(location, auth=auth)
                if status.status_code == 200:
                    data = status.json()
                    print(f"Status: {data.get('status', 'unknown')}")
                    if data.get('status') in ['4', 'Succeeded']:
                        print("Deployment completed successfully!")
                        return True
                    elif data.get('status') in ['3', 'Failed']:
                        print(f"Deployment failed: {data}")
                        return False
        return True
    elif response.status_code in [200, 204]:
        print("Deployment completed successfully!")
        return True
    else:
        print(f"Deployment failed with status {response.status_code}")
        print(response.text)
        return False

def main():
    print("=" * 50)
    print("TCA-IRR Frontend Quick Deployment")
    print("=" * 50)
    
    # Change to project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if .next exists
    if not os.path.exists(".next"):
        print("ERROR: .next folder not found. Run 'npm run build' first.")
        sys.exit(1)
    
    # Create zip
    zip_path = create_deployment_zip()
    
    # Deploy
    success = deploy_zip(zip_path)
    
    if success:
        print("\n✓ Deployment successful!")
        print(f"  URL: https://{WEBAPP_NAME.lower()}.azurewebsites.net")
    else:
        print("\n✗ Deployment failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
