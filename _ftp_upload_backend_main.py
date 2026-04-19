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
        with open(r'recovery-backups\live-backend-main-8512.py', 'rb') as f:
            ftp.storbinary('STOR main.py', f)
        ftp.storbinary('STOR restart.txt', BytesIO(b'restart backend docs fix'))
        ftp.cwd('/site')
        ftp.storbinary('STOR restart.txt', BytesIO(b'restart backend docs fix'))
        print('FTP_UPLOAD=OK')
        ftp.quit()
        break
