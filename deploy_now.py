#!/usr/bin/env python3
"""Deploy backend to Azure using Kudu ZIP deploy"""
import requests
import sys

APP_NAME = "tcairrapiccontainer"
KUDU_URL = f"https://{APP_NAME}.scm.azurewebsites.net/api/zipdeploy"

# Credentials provided by user
USERNAME = "tcairrapiccontainer\\$tcairrapiccontainer"  # Full FTPS format
PASSWORD = "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz"

def deploy():
    print(f"Deploying to {APP_NAME}...")
    print(f"URL: {KUDU_URL}")
    
    with open("backend_deploy.zip", "rb") as f:
        data = f.read()
    
    print(f"ZIP size: {len(data)} bytes")
    
    response = requests.post(
        KUDU_URL,
        data=data,
        auth=(USERNAME, PASSWORD),
        headers={"Content-Type": "application/octet-stream"},
        timeout=300
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 202]:
        print("SUCCESS! Backend deployed.")
        print(f"Check: https://{APP_NAME}.azurewebsites.net/api/ssd/audit/stats")
    else:
        print(f"Response: {response.text[:500]}")
    
    return response.status_code in [200, 202]

if __name__ == "__main__":
    success = deploy()
    sys.exit(0 if success else 1)
