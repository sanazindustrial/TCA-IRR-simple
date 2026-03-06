#!/usr/bin/env python3
"""
Azure Web App Deployment Script with Interactive Login
Deploys the backend to Azure App Service using browser-based authentication
"""

import os
import sys
import requests
import base64
import time
from pathlib import Path


def deploy_via_kudu_direct():
    """Deploy directly via Kudu using AAD token"""
    APP_NAME = "tcairrapiccontainer"
    
    print("\n--- Direct Kudu Deployment ---")
    print("Creating deployment package...")
    
    zip_path = Path("deploy_ssd.zip")
    files_to_deploy = [
        "main.py",
        "ssd_tirr_report_config.py", 
        "ai_integration.py",
        "database_config.py",
        "requirements.txt",
        "startup.sh"
    ]
    
    import zipfile
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_deploy:
            if Path(file).exists():
                zipf.write(file)
                print(f"  + {file}")
    
    print(f"✓ Created {zip_path} ({zip_path.stat().st_size:,} bytes)")
    
    # Try to get a token for the App Service scope
    from azure.identity import InteractiveBrowserCredential
    
    print("\nGetting token for Azure App Service...")
    credential = InteractiveBrowserCredential(additionally_allowed_tenants=["*"])
    
    # Get token for App Service SCM site
    try:
        token = credential.get_token("https://management.azure.com/.default")
        auth_header = f"Bearer {token.token}"
    except Exception as e:
        print(f"Failed to get token: {e}")
        return False
    
    print("✓ Got authentication token")
    
    # Deploy via Kudu ZIP Deploy with Bearer token
    print("\nDeploying to Azure App Service...")
    deploy_url = f"https://{APP_NAME}.scm.azurewebsites.net/api/zipdeploy?isAsync=true"
    
    with open(zip_path, "rb") as f:
        deploy_response = requests.post(
            deploy_url,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/zip"
            },
            data=f.read(),
            timeout=180
        )
    
    print(f"Deployment response: {deploy_response.status_code}")
    
    if deploy_response.status_code in [200, 202]:
        print("✓ Deployment initiated successfully!")
        
        # Wait for deployment
        print("\nWaiting 45 seconds for deployment to complete...")
        time.sleep(45)
        
        # Test the endpoints
        print("\nVerifying deployment...")
        health_url = f"https://{APP_NAME}.azurewebsites.net/api/health"
        health_response = requests.get(health_url, timeout=30)
        
        if health_response.status_code == 200:
            health = health_response.json()
            print(f"✓ Health: {health.get('status')}, DB: {health.get('database')}")
        
        # Check SSD endpoints
        ssd_url = f"https://{APP_NAME}.azurewebsites.net/api/ssd/audit/stats"
        ssd_response = requests.get(ssd_url, timeout=30)
        
        if ssd_response.status_code == 200:
            print("✓ SSD endpoints deployed successfully!")
        else:
            print(f"⚠ SSD endpoint status: {ssd_response.status_code}")
            
        print("\n" + "=" * 60)
        print("Deployment Complete!")
        print(f"App URL: https://{APP_NAME}.azurewebsites.net")
        print("=" * 60)
        return True
    else:
        print(f"Deployment failed: {deploy_response.status_code}")
        print(deploy_response.text[:500] if deploy_response.text else "No response body")
        return False


def deploy_to_azure():
    """Deploy using Azure SDK with interactive browser login"""
    try:
        from azure.identity import InteractiveBrowserCredential
        from azure.mgmt.web import WebSiteManagementClient
    except ImportError:
        print("Installing required packages...")
        os.system("pip install azure-identity azure-mgmt-web")
        from azure.identity import InteractiveBrowserCredential
        from azure.mgmt.web import WebSiteManagementClient

    # Configuration
    SUBSCRIPTION_ID = None  # Will be fetched
    RESOURCE_GROUP = "TCA-IRR-rg"  # Try common names
    APP_NAME = "tcairrapiccontainer"
    
    print("=" * 60)
    print("Azure Web App Deployment - Interactive Login")
    print("=" * 60)
    
    # Use InteractiveBrowserCredential directly with options
    print("\nOpening browser for Azure login...")
    print("(If browser doesn't open automatically, check the console for a URL)")
    
    try:
        credential = InteractiveBrowserCredential(
            additionally_allowed_tenants=["*"],  # Allow any tenant
            login_hint=None  # Don't suggest an account
        )
        # Force authentication by getting a token
        token = credential.get_token("https://management.azure.com/.default")
        print("✓ Successfully authenticated via browser!")
    except Exception as e:
        print(f"Authentication failed: {e}")
        return False
    
    # Get subscription list
    print("\nFetching subscriptions...")
    import requests
    token = credential.get_token("https://management.azure.com/.default")
    headers = {"Authorization": f"Bearer {token.token}"}
    
    subs_response = requests.get(
        "https://management.azure.com/subscriptions?api-version=2020-01-01",
        headers=headers
    )
    
    print(f"Subscriptions API response: {subs_response.status_code}")
    
    if subs_response.status_code == 401:
        print(f"Authentication failed with Management API")
        print(f"Response: {subs_response.text[:500]}")
        return False
    
    if subs_response.status_code != 200:
        print(f"Failed to get subscriptions: {subs_response.text}")
        # Try direct approach - get fresh publish credentials from Kudu
        print("\nTrying direct Kudu approach...")
        return deploy_via_kudu_direct()
    
    subscriptions = subs_response.json().get("value", [])
    if not subscriptions:
        print("No subscriptions found in this tenant!")
        print("The web app might be in a different tenant.")
        print("\nTrying direct Kudu approach with token...")
        return deploy_via_kudu_direct()
    
    print(f"Found {len(subscriptions)} subscription(s):")
    for i, sub in enumerate(subscriptions):
        print(f"  {i+1}. {sub['displayName']} ({sub['subscriptionId']})")
    
    # Find the subscription with our app
    for sub in subscriptions:
        sub_id = sub['subscriptionId']
        print(f"\nSearching in subscription: {sub['displayName']}...")
        
        # Search for the web app
        apps_url = f"https://management.azure.com/subscriptions/{sub_id}/providers/Microsoft.Web/sites?api-version=2022-03-01"
        apps_response = requests.get(apps_url, headers=headers)
        
        if apps_response.status_code == 200:
            apps = apps_response.json().get("value", [])
            for app in apps:
                if app["name"] == APP_NAME:
                    SUBSCRIPTION_ID = sub_id
                    RESOURCE_GROUP = app["id"].split("/resourceGroups/")[1].split("/")[0]
                    print(f"✓ Found app '{APP_NAME}' in resource group '{RESOURCE_GROUP}'")
                    break
        
        if SUBSCRIPTION_ID:
            break
    
    if not SUBSCRIPTION_ID:
        print(f"Could not find web app '{APP_NAME}' in any subscription")
        return False
    
    # Get publish credentials
    print("\nGetting fresh deployment credentials...")
    creds_url = f"https://management.azure.com/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.Web/sites/{APP_NAME}/config/publishingcredentials/list?api-version=2022-03-01"
    
    creds_response = requests.post(creds_url, headers=headers)
    
    if creds_response.status_code != 200:
        print(f"Failed to get credentials: {creds_response.text}")
        return False
    
    creds = creds_response.json()
    publish_user = creds.get("properties", {}).get("publishingUserName", "")
    publish_pass = creds.get("properties", {}).get("publishingPassword", "")
    
    if not publish_user or not publish_pass:
        print("Could not extract publishing credentials")
        return False
    
    print(f"✓ Got credentials for user: {publish_user}")
    
    # Create deployment package
    print("\nCreating deployment package...")
    zip_path = Path("deploy_ssd.zip")
    
    files_to_deploy = [
        "main.py",
        "ssd_tirr_report_config.py", 
        "ai_integration.py",
        "database_config.py",
        "requirements.txt",
        "startup.sh"
    ]
    
    import zipfile
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_deploy:
            if Path(file).exists():
                zipf.write(file)
                print(f"  + {file}")
    
    print(f"✓ Created {zip_path} ({zip_path.stat().st_size:,} bytes)")
    
    # Deploy via Kudu ZIP Deploy
    print("\nDeploying to Azure...")
    auth_string = f"{publish_user}:{publish_pass}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()
    
    deploy_url = f"https://{APP_NAME}.scm.azurewebsites.net/api/zipdeploy?isAsync=true"
    
    with open(zip_path, "rb") as f:
        deploy_response = requests.post(
            deploy_url,
            headers={
                "Authorization": f"Basic {auth_bytes}",
                "Content-Type": "application/zip"
            },
            data=f.read(),
            timeout=180
        )
    
    if deploy_response.status_code in [200, 202]:
        print("✓ Deployment initiated successfully!")
        
        # Wait for deployment
        print("\nWaiting for deployment to complete...")
        time.sleep(30)
        
        # Test the endpoints
        print("\nVerifying deployment...")
        health_url = f"https://{APP_NAME}.azurewebsites.net/api/health"
        health_response = requests.get(health_url, timeout=30)
        
        if health_response.status_code == 200:
            health = health_response.json()
            print(f"✓ Health: {health.get('status')}, DB: {health.get('database')}")
        
        # Check SSD endpoints
        ssd_url = f"https://{APP_NAME}.azurewebsites.net/api/ssd/audit/stats"
        ssd_response = requests.get(ssd_url, timeout=30)
        
        if ssd_response.status_code == 200:
            print("✓ SSD endpoints deployed successfully!")
        else:
            print(f"⚠ SSD endpoint status: {ssd_response.status_code}")
            
        print("\n" + "=" * 60)
        print("Deployment Complete!")
        print(f"App URL: https://{APP_NAME}.azurewebsites.net")
        print("=" * 60)
        return True
    else:
        print(f"Deployment failed: {deploy_response.status_code}")
        print(deploy_response.text)
        return False


if __name__ == "__main__":
    success = deploy_to_azure()
    sys.exit(0 if success else 1)
