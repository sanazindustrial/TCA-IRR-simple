from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
from io import BytesIO
root = ET.parse('publishprofile-backend.xml').getroot()
for prof in root.findall('.//publishProfile'):
    if prof.attrib.get('publishMethod') == 'FTP':
        host = prof.attrib['publishUrl'].replace('ftps://','').split('/')[0]
        username = prof.attrib['userName']
        password = prof.attrib['userPWD']
        ftp = FTP_TLS(host, timeout=60)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.cwd('/LogFiles')
        target = '2026_04_16_lw0sdlwk0007A5_default_docker.log'
        buf = BytesIO()
        ftp.retrbinary(f'RETR {target}', buf.write)
        content = buf.getvalue().decode('utf-8', errors='ignore')
        for line in content.splitlines():
            low = line.lower()
            if 'gunicorn' in low or 'startup' in low or 'oryx' in low or 'main.py' in low or 'uvicorn' in low:
                print(line)
        ftp.quit()
        break
