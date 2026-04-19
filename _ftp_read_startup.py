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
        ftp.cwd('/site/wwwroot')
        for name in ['startup.sh', 'startup.txt', 'start_production.py', 'simple_backend.py']:
            try:
                buf = BytesIO()
                ftp.retrbinary(f'RETR {name}', buf.write)
                content = buf.getvalue().decode('utf-8', errors='ignore')
                print(f'---{name}---')
                print('\n'.join(content.splitlines()[:120]))
            except Exception as exc:
                print(f'---{name} MISSING OR ERROR: {exc}---')
        ftp.quit()
        break
