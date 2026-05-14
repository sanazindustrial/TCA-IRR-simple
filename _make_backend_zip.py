import os, zipfile
zip_path = 'backend-live-fix-linux.zip'
root = 'backend'
exclude_dirs = {'__pycache__', '.pytest_cache', '.mypy_cache', '.git'}
exclude_ext = {'.pyc', '.pyo'}
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for name in files:
            if os.path.splitext(name)[1] in exclude_ext:
                continue
            full_path = os.path.join(current_root, name)
            arcname = os.path.relpath(full_path, root).replace('\\', '/')
            zf.write(full_path, arcname)
print(zip_path)
print(os.path.getsize(zip_path))
