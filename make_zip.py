import zipfile, os, sys

source = os.path.join(os.path.dirname(__file__), '.next', 'standalone')
dest = os.path.join(os.path.dirname(__file__), 'frontend-deploy.zip')

if os.path.exists(dest):
    os.remove(dest)
    print(f'Removed old zip.')

count = 0
with zipfile.ZipFile(dest, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(source):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, source)
            archive_name = rel_path.replace('\\', '/')
            zf.write(full_path, archive_name)
            count += 1

size = os.path.getsize(dest)
print(f'Created zip: {count} files, {size/1024/1024:.1f} MB')

# Verify no backslashes in entries
with zipfile.ZipFile(dest) as zf:
    names = zf.namelist()
    bad = [n for n in names if '\\' in n]
    print(f'Entries with backslashes: {len(bad)} (should be 0)')
    print(f'Total entries: {len(names)}')
    if bad:
        print('BAD entries sample:', bad[:3])
        sys.exit(1)
    else:
        print('All paths use forward slashes. Zip is ready.')
