from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
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
            if ' restart' in line or 'app_offline' in line or ' main.py' in line:
                print(line)
        ftp.quit()
        break
