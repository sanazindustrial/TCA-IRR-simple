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
        ftp.storbinary('STOR restartTrigger.txt', BytesIO(b'restart now'))
        ftp.storbinary('STOR app_offline.htm', BytesIO(b'<html><body>Restarting...</body></html>'))
        ftp.delete('app_offline.htm')
        ftp.quit()
        print('RECYCLE_TRIGGERED=OK')
        break
