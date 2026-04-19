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
        items=[]
        ftp.retrlines('LIST', items.append)
        for line in items:
            if ' main.py' in line or ' restart.txt' in line:
                print(line)
        buf = BytesIO()
        ftp.retrbinary('RETR main.py', buf.write)
        content = buf.getvalue().decode('utf-8', errors='ignore')
        print('HAS_DOCS_URL=' + str('docs_url="/docs"' in content))
        print('HAS_OPENAPI_URL=' + str('openapi_url="/openapi.json"' in content))
        print('REMOTE_LINE_COUNT=' + str(len(content.splitlines())))
        ftp.quit()
        break
