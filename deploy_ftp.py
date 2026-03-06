#!/usr/bin/env python3
"""Deploy backend to Azure using FTP"""
import ftplib
import os
import zipfile
import tempfile

# FTP Configuration from publish profile
FTP_HOST = "waws-prod-yt1-063.ftp.azurewebsites.windows.net"
FTP_USER = r"tcairrapiccontainer\$tcairrapiccontainer"
FTP_PASS = "4dyqdt2neKnPiMWys4Bwjm78fvEpeiEwq9fNjwPXPue2Z5sW4yDvzAzb9szz"
FTP_PATH = "/site/wwwroot"

# Files to deploy
BACKEND_FILES = [
    "main.py",
    "requirements.txt", 
    "database_config.py",
    "ai_integration.py",
    "ssd_tirr_report_config.py",
]

def deploy_via_ftp():
    print("=" * 50)
    print("  Deploying Backend via FTP")
    print("=" * 50)
    
    # Connect to FTP
    print(f"\nConnecting to {FTP_HOST}...")
    ftp = ftplib.FTP_TLS()
    ftp.set_debuglevel(0)
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.prot_p()  # Enable data encryption
    ftp.set_pasv(True)  # Passive mode
    
    print(f"Connected! Current dir: {ftp.pwd()}")
    
    # Navigate to wwwroot
    try:
        ftp.cwd(FTP_PATH)
        print(f"Changed to: {FTP_PATH}")
    except:
        print(f"Creating and navigating to: {FTP_PATH}")
        ftp.mkd(FTP_PATH)
        ftp.cwd(FTP_PATH)
    
    # Upload files with retry
    import time
    for filename in BACKEND_FILES:
        if os.path.exists(filename):
            print(f"Uploading: {filename}...")
            for attempt in range(3):
                try:
                    with open(filename, 'rb') as f:
                        ftp.storbinary(f'STOR {filename}', f)
                    print(f"  ✓ {filename} uploaded")
                    break
                except Exception as e:
                    print(f"  ⚠ Attempt {attempt+1} failed: {e}")
                    if attempt < 2:
                        time.sleep(2)
                        # Reconnect
                        try:
                            ftp.quit()
                        except:
                            pass
                        ftp = ftplib.FTP_TLS()
                        ftp.connect(FTP_HOST, 21, timeout=30)
                        ftp.login(FTP_USER, FTP_PASS)
                        ftp.prot_p()
                        ftp.set_pasv(True)
                        ftp.cwd(FTP_PATH)
        else:
            print(f"  ⚠ {filename} not found, skipping")
    
    # Create startup script
    startup_content = b"gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"
    from io import BytesIO
    ftp.storbinary('STOR startup.txt', BytesIO(startup_content))
    print("  ✓ startup.txt created")
    
    print(f"\nListing {FTP_PATH}:")
    ftp.dir()
    
    ftp.quit()
    print("\n" + "=" * 50)
    print("  FTP Deployment Complete!")
    print("=" * 50)
    print("\nAPI URL: https://tcairrapiccontainer.azurewebsites.net")
    print("Health:  https://tcairrapiccontainer.azurewebsites.net/api/health")
    print("SSD:     https://tcairrapiccontainer.azurewebsites.net/api/ssd/audit/stats")
    print("\nNote: App may need a restart to pick up changes")
    
    return True

if __name__ == "__main__":
    import sys
    try:
        success = deploy_via_ftp()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
