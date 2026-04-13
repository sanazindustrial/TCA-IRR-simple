#!/usr/bin/env python3
"""Deploy to Azure App Service via Kudu ZIP deploy"""
import os
import sys
import subprocess
import json
import requests
from urllib.parse import urljoin

# Configuration
APP_NAME = "TCA-IRR"
RESOURCE_GROUP = "DEV"
ZIP_FILE = "deploy-next.zip"

def get_credentials():
    """Get deployment credentials using Azure CLI"""
    cmd = f'az webapp deployment list-publishing-credentials --name {APP_NAME} --resource-group {RESOURCE_GROUP}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error getting credentials: {result.stderr}")
        sys.exit(1)
    return json.loads(result.stdout)

def deploy_zip(creds):
    """Deploy ZIP file to Kudu"""
    username = creds['publishingUserName']
    password = creds['publishingPassword']
    kudu_url = f"https://{APP_NAME.lower()}.scm.azurewebsites.net/api/zipdeploy"
    
    print(f"Deploying {ZIP_FILE} to {kudu_url}...")
    print(f"File size: {os.path.getsize(ZIP_FILE) / 1024 / 1024:.2f} MB")
    
    with open(ZIP_FILE, 'rb') as f:
        response = requests.post(
            kudu_url,
            auth=(username, password),
            data=f,
            headers={'Content-Type': 'application/zip'},
            timeout=600
        )
    
    print(f"Response status: {response.status_code}")
    if response.status_code in [200, 202]:
        print("Deployment successful!")
        return True
    else:
        print(f"Deployment failed: {response.text[:500]}")
        return False

if __name__ == "__main__":
    if not os.path.exists(ZIP_FILE):
        print(f"ZIP file not found: {ZIP_FILE}")
        sys.exit(1)
    
    print("Getting Azure credentials...")
    creds = get_credentials()
    
    success = deploy_zip(creds)
    sys.exit(0 if success else 1)
