#!/usr/bin/env python3
"""Fix startup.sh to run python main.py directly"""
from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
from io import BytesIO

root = ET.parse('publishprofile-backend.xml').getroot()
for prof in root.findall('.//publishProfile'):
    if prof.attrib.get('publishMethod') == 'FTP':
        host = prof.attrib['publishUrl'].replace('ftps://','').split('/')[0]
        username = prof.attrib['userName']
        password = prof.attrib['userPWD']
        
        print(f"Connecting to {host}...")
        ftp = FTP_TLS(host, timeout=30)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.cwd('/site/wwwroot')
        print("Connected.")

        # Upload new startup.sh
        new_startup_sh = b'#!/bin/bash\npython main.py\n'
        ftp.storbinary('STOR startup.sh', BytesIO(new_startup_sh))
        print("Uploaded startup.sh: 'python main.py'")

        # Verify
        buf = BytesIO()
        ftp.retrbinary('RETR startup.sh', buf.write)
        print("Verified startup.sh:", buf.getvalue())

        # Also check if there's a .deployment or web.config that matters
        items = []
        ftp.retrlines('NLST', items.append)
        print("\nwwwroot files:")
        for item in sorted(items):
            print(" ", item)

        try: ftp.quit()
        except: pass
        print("\nDone.")
        break
