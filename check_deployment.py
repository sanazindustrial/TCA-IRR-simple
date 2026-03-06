"""
Deploy to Azure App Service using Python WinSCP COM wrapper
This uses secure FTP to deploy files directly
"""
import subprocess
import os
import sys

# Config
DEPLOY_FILES = [
    "main.py",
    "requirements.txt", 
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
]

APP_URL = "https://tcairrapiccontainer.azurewebsites.net"

def create_startup_sh():
    content = '''#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600
'''
    with open("startup.sh", "w", newline="\n") as f:
        f.write(content)
    print("Created startup.sh")

def check_ssd_endpoints():
    """Verify main.py has SSD endpoints"""
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    ssd_endpoints = [
        '/api/ssd/tirr',
        '/api/ssd/audit/logs',
        '/api/ssd/audit/stats',
    ]
    
    print("\nVerifying SSD endpoints in main.py:")
    for ep in ssd_endpoints:
        if ep in content:
            print(f"  ✓ {ep}")
        else:
            print(f"  ✗ {ep} - MISSING!")
            return False
    return True

def check_new_endpoints():
    """Verify new endpoints exist"""
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    endpoints = [
        '/api/analysis/list',
        '/api/modules/weights',
    ]
    
    print("\nVerifying new endpoints in main.py:")
    for ep in endpoints:
        if ep in content:
            print(f"  ✓ {ep}")
        else:
            print(f"  ✗ {ep} - MISSING!")
    return True

def verify_live_deployment():
    """Check what's deployed on the live app"""
    import requests
    
    print("\n" + "=" * 50)
    print("  Live Deployment Status")
    print("=" * 50)
    
    try:
        r = requests.get(f"{APP_URL}/openapi.json", timeout=30)
        openapi = r.json()
        paths = sorted(openapi.get("paths", {}).keys())
        
        print(f"\nTotal live endpoints: {len(paths)}")
        
        ssd = [p for p in paths if "ssd" in p.lower()]
        print(f"SSD endpoints: {len(ssd)}")
        for p in ssd:
            print(f"  ✓ {p}")
        
        analysis = [p for p in paths if "analysis" in p.lower() or "modules" in p.lower()]
        print(f"\nAnalysis endpoints: {len(analysis)}")
        for p in analysis:
            print(f"  ✓ {p}")
            
        print("\nAll endpoints:")
        for p in paths:
            print(f"  {p}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("  TCA-IRR Deployment Pre-Check")
    print("=" * 50)
    
    # Check local files
    print("\n1. Checking local files...")
    check_ssd_endpoints()
    check_new_endpoints()
    
    # Check live
    print("\n2. Checking live deployment...")
    verify_live_deployment()
    
    print("\n" + "=" * 50)
    print("DEPLOYMENT INSTRUCTIONS:")
    print("=" * 50)
    print("""
To deploy the updated code, you need to:

1. OPTION A: Refresh Azure Publish Profile
   - Go to Azure Portal > tcairrapiccontainer > Deployment Center
   - Download new publish profile
   - Replace publishprofile-backend.xml

2. OPTION B: Install Azure CLI
   - Download from: https://aka.ms/installazurecliwindows
   - Run: az login
   - Run: az webapp deployment source config-zip ...

3. OPTION C: Use VS Code Azure Extension
   - Install Azure App Service extension
   - Right-click main.py folder > Deploy to Web App

4. OPTION D: Push to GitHub
   - If connected to GitHub Actions/Azure Pipelines
   - git push origin main
""")
