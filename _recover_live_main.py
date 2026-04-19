from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
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
        with open(r'recovery-backups\live-backend-main-8512.py', 'wb') as f:
            ftp.retrbinary('RETR main.py', f.write)
        ftp.quit()
        print('RECOVERED_MAIN=OK')
        break
