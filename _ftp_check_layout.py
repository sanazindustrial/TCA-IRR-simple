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
        for path in ['/site/wwwroot/app', '/site/wwwroot/backend', '/site/wwwroot/routers', '/site/wwwroot/services']:
            try:
                ftp.cwd(path)
                items=[]
                ftp.retrlines('NLST', items.append)
                print(f'EXISTS {path}=YES COUNT={len(items)}')
                print('\n'.join(items[:20]))
            except Exception as e:
                print(f'EXISTS {path}=NO')
        ftp.quit()
        break
