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
        ftp.cwd('/LogFiles/Application')
        items=[]
        ftp.retrlines('NLST', items.append)
        target = sorted(items)[-1]
        print('LATEST_LOG=' + target)
        buf = BytesIO()
        ftp.retrbinary(f'RETR {target}', buf.write)
        content = buf.getvalue().decode('utf-8', errors='ignore')
        matches = [line for line in content.splitlines() if '/docs' in line or 'openapi' in line or '404' in line][-40:]
        print('\n'.join(matches))
        ftp.quit()
        break
