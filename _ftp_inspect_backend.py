from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
from io import BytesIO
root = ET.parse('publishprofile-backend.xml').getroot()
for prof in root.findall('.//publishProfile'):
    if prof.attrib.get('publishMethod') == 'FTP':
        host = prof.attrib['publishUrl'].replace('ftps://','').split('/')[0]
        username = prof.attrib['userName']
        password = prof.attrib['userPWD']
        ftp = FTP_TLS(host, timeout=30)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.cwd('/site/wwwroot')
        print('WWWROOT_LISTING:')
        items=[]
        ftp.retrlines('LIST', items.append)
        print('\n'.join(items[:60]))
        buf = BytesIO()
        ftp.retrbinary('RETR main.py', buf.write)
        content = buf.getvalue().decode('utf-8', errors='ignore')
        print('---MAIN_HEAD---')
        print('\n'.join(content.splitlines()[:80]))
        print('---HAS_DOCS_URL=' + str('docs_url=' in content))
        print('---HAS_ENABLE_SWAGGER_DOCS=' + str('ENABLE_SWAGGER_DOCS' in content))
        print('---LINE_COUNT=' + str(len(content.splitlines())))
        ftp.quit()
        break
