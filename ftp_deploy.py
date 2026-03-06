import ftplib
import os
import sys

# FTP credentials from publish profile
FTP_HOST = "waws-prod-yt1-063.ftp.azurewebsites.windows.net"
FTP_USER = "tcairrapiccontainer\\$tcairrapiccontainer"
FTP_PASS = "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz"
FTP_DIR = "/site/wwwroot"

# Files to deploy
DEPLOY_FILES = [
    "main.py",
    "requirements.txt",
    "ssd_tirr_report_config.py",
    "ai_integration.py",
    "database_config.py",
]

def create_startup_script():
    """Create startup.sh for Azure"""
    content = """#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600
"""
    with open("startup.sh", "w", newline="\n") as f:
        f.write(content)
    print("Created startup.sh")

def deploy_via_ftp():
    """Deploy files via FTPS"""
    print("=" * 50)
    print("  TCA-IRR Backend - FTP Deploy")
    print("=" * 50)
    
    # Create startup script
    create_startup_script()
    DEPLOY_FILES.append("startup.sh")
    
    # Check all files exist
    for f in DEPLOY_FILES:
        if not os.path.exists(f):
            print(f"ERROR: Missing file: {f}")
            return False
    
    print(f"Connecting to {FTP_HOST}...")
    
    try:
        # Connect with TLS
        ftp = ftplib.FTP_TLS(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.prot_p()  # Enable secure data connection
        
        print("Connected successfully!")
        
        # Navigate to wwwroot
        try:
            ftp.cwd(FTP_DIR)
            print(f"Changed to {FTP_DIR}")
        except Exception as e:
            print(f"Could not change to {FTP_DIR}: {e}")
            return False
        
        # Upload each file
        for filename in DEPLOY_FILES:
            print(f"Uploading {filename}...")
            with open(filename, "rb") as f:
                ftp.storbinary(f"STOR {filename}", f)
            print(f"  Uploaded {filename}")
        
        ftp.quit()
        print("\nAll files uploaded successfully!")
        return True
        
    except ftplib.all_errors as e:
        print(f"FTP Error: {e}")
        return False

if __name__ == "__main__":
    success = deploy_via_ftp()
    
    if success:
        print("\n" + "=" * 50)
        print("Deployment complete!")
        print("App URL: https://tcairrapiccontainer.azurewebsites.net")
        print("Docs:    https://tcairrapiccontainer.azurewebsites.net/docs")
        print("=" * 50)
        print("\nNote: App may take 1-2 minutes to restart.")
    else:
        print("\nDeployment failed!")
        sys.exit(1)
