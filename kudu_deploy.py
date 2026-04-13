"""Deploy to Azure via Kudu REST API"""
import requests
import zipfile
import io
import os
import time

# Config
KUDU_URL = "https://tcairrapiccontainer.scm.azurewebsites.net"
APP_URL = "https://tcairrapiccontainer.azurewebsites.net"
USERNAME = "$tcairrapiccontainer"
PASSWORD = "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz"

DEPLOY_FILES = [
    "main.py",
    "requirements.txt",
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
]

def create_startup_sh():
    content = """#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600
"""
    with open("startup.sh", "w", newline="\n") as f:
        f.write(content)
    return "startup.sh"

def create_zip():
    """Create in-memory zip file"""
    startup = create_startup_sh()
    files = DEPLOY_FILES + [startup]
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for fname in files:
            if os.path.exists(fname):
                zf.write(fname)
                print(f"  Added: {fname}")
            else:
                print(f"  MISSING: {fname}")
    
    zip_buffer.seek(0)
    return zip_buffer

def deploy():
    print("=" * 50)
    print("  TCA-IRR Backend - Kudu API Deploy")
    print("=" * 50)
    
    # Create zip
    print("\n1. Creating deployment package...")
    zip_data = create_zip()
    
    # Deploy via Kudu
    print("\n2. Deploying to Azure...")
    deploy_url = f"{KUDU_URL}/api/zipdeploy"
    
    try:
        response = requests.post(
            deploy_url,
            auth=(USERNAME, PASSWORD),
            data=zip_data.getvalue(),
            headers={"Content-Type": "application/zip"},
            timeout=300
        )
        print(f"   Response: {response.status_code}")
        if response.status_code in [200, 202]:
            print("   Deployment accepted!")
        else:
            print(f"   Response text: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
        return False
    
    # Wait for restart
    print("\n3. Waiting for app restart (45s)...")
    time.sleep(45)
    
    # Verify
    print("\n4. Verifying deployment...")
    try:
        r = requests.get(f"{APP_URL}/health", timeout=30)
        print(f"   Health: {r.json()}")
    except Exception as e:
        print(f"   Health check error: {e}")
    
    # Check endpoints
    print("\n5. Checking endpoints...")
    try:
        r = requests.get(f"{APP_URL}/openapi.json", timeout=30)
        openapi = r.json()
        paths = sorted(openapi.get("paths", {}).keys())
        
        ssd_endpoints = [p for p in paths if "ssd" in p]
        analysis_endpoints = [p for p in paths if "analysis" in p or "modules" in p]
        
        print(f"\n   Total endpoints: {len(paths)}")
        
        if ssd_endpoints:
            print("\n   SSD Endpoints:")
            for p in ssd_endpoints:
                print(f"     {p}")
        else:
            print("\n   ⚠ No SSD endpoints found")
            
        if analysis_endpoints:
            print("\n   Analysis Endpoints:")
            for p in analysis_endpoints:
                print(f"     {p}")
                
        print("\n   All endpoints:")
        for p in paths:
            print(f"     {p}")
            
    except Exception as e:
        print(f"   Could not fetch OpenAPI: {e}")
    
    print("\n" + "=" * 50)
    print(f"  App: {APP_URL}")
    print(f"  Docs: {APP_URL}/docs")
    print("=" * 50)
    return True

if __name__ == "__main__":
    deploy()
