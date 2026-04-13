import requests
import base64
import subprocess
import json
import os
import zipfile
import time

def get_azure_credentials():
    result = subprocess.run('az webapp deployment list-publishing-credentials --name TCA-IRR --resource-group DEV --query "{user: publishingUserName, pw: publishingPassword}" -o json',
        capture_output=True, text=True, shell=True)
    creds = json.loads(result.stdout)
    return base64.b64encode(f"{creds['user']}:{creds['pw']}".encode()).decode()

def check_files(auth):
    url = 'https://tca-irr.scm.azurewebsites.net/api/vfs/site/wwwroot/'
    headers = {'Authorization': f'Basic {auth}'}
    response = requests.get(url, headers=headers, timeout=30)
    print(f'wwwroot status: {response.status_code}')
    if response.status_code == 200:
        files = response.json()
        print(f'Files: {[f["name"] for f in files]}')
        return len(files) > 0
    return False

def deploy(auth, zip_path):
    print(f'Deploying {zip_path}...')
    url = 'https://tca-irr.scm.azurewebsites.net/api/zipdeploy?isAsync=false'
    headers = {'Authorization': f'Basic {auth}', 'Content-Type': 'application/octet-stream'}
    with open(zip_path, 'rb') as f:
        response = requests.post(url, headers=headers, data=f.read(), timeout=300)
    print(f'Deploy status: {response.status_code}')
    return response.status_code in [200, 201, 202]

def create_zip():
    source = 'verify-zip'
    zip_path = 'deploy_fresh.zip'
    if os.path.exists(zip_path):
        os.remove(zip_path)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source)
                zf.write(file_path, arcname)
    
    print(f'Zip size: {os.path.getsize(zip_path)} bytes')
    return zip_path

def test_app():
    try:
        response = requests.get('https://tca-irr.azurewebsites.net', timeout=30)
        print(f'App status: {response.status_code}')
        return response.status_code == 200
    except Exception as e:
        print(f'App error: {e}')
        return False

if __name__ == '__main__':
    print('Getting credentials...')
    auth = get_azure_credentials()
    
    print('\n=== Checking current files ===')
    has_files = check_files(auth)
    
    if not has_files:
        print('\n=== Creating deploy package ===')
        zip_path = create_zip()
        
        print('\n=== Deploying ===')
        if deploy(auth, zip_path):
            print('Deployment initiated, waiting 30s...')
            time.sleep(30)
            check_files(auth)
    
    print('\n=== Testing app ===')
    test_app()
