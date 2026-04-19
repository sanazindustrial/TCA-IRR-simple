import os, zipfile
zip_path = 'live-wizard-fix-linux.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.next/standalone'):
        dirs[:] = [d for d in dirs if d != 'cache']
        for name in files:
            full = os.path.join(root, name)
            arc = os.path.relpath(full, '.next/standalone').replace('\\', '/')
            zf.write(full, arc)
    for root, dirs, files in os.walk('.next/static'):
        for name in files:
            full = os.path.join(root, name)
            arc = full.replace('\\', '/')
            zf.write(full, arc)
    if os.path.isdir('public'):
        for root, dirs, files in os.walk('public'):
            for name in files:
                full = os.path.join(root, name)
                arc = full.replace('\\', '/')
                zf.write(full, arc)
print(zip_path)
print(os.path.getsize(zip_path))
