from ftplib import FTP_TLS
import xml.etree.ElementTree as ET
root = ET.parse('publishprofile-backend.xml').getroot()
ftp = None
for prof in root.findall('.//publishProfile'):
    if prof.attrib.get('publishMethod') == 'FTP':
        publish_url = prof.attrib['publishUrl'].replace('ftps://','').split('/')[0]
        username = prof.attrib['userName']
        password = prof.attrib['userPWD']
        ftp = FTP_TLS(publish_url, timeout=30)
        ftp.login(username, password)
        ftp.prot_p()
        print('FTP_LOGIN=OK')
        print('PWD=' + ftp.pwd())
        items = []
        ftp.retrlines('LIST', items.append)
        print('\n'.join(items[:20]))
        ftp.quit()
        break
if ftp is None:
    print('FTP_PROFILE_NOT_FOUND')
