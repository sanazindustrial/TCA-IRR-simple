import zipfile
import os

src = 'deploy-pkg'
out = 'deploy.zip'

print("Creating deployment zip with static files...")

# Remove old zip if exists
if os.path.exists(out):
    os.remove(out)

count = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        for file in files:
            full_path = os.path.join(root, file)
            # Use forward slashes for Linux compatibility
            arcname = os.path.relpath(full_path, src).replace('\\', '/')
            zf.write(full_path, arcname)
            count += 1
            if count % 500 == 0:
                print(f"  Added {count} files...")

print(f"\nTotal files: {count}")
print(f"Zip size: {os.path.getsize(out) / 1024 / 1024:.2f} MB")

# Verify static files included
z = zipfile.ZipFile(out, 'r')
static_files = [n for n in z.namelist() if '.next/static' in n]
css_files = [n for n in z.namelist() if n.endswith('.css')]
js_files = [n for n in z.namelist() if n.endswith('.js') and 'static' in n]
print(f"Static files: {len(static_files)}")
print(f"CSS files: {len(css_files)}")
print(f"JS chunks: {len(js_files)}")
z.close()

print("\nDone!")
