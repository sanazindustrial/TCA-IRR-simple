import shutil, os, sys

base = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(base, 'deploy_output')
zip_out = os.path.join(base, 'deploy')

print(f"Base: {base}")
print(f"Standalone exists: {os.path.exists(os.path.join(base, '.next', 'standalone'))}")

shutil.rmtree(out, ignore_errors=True)
print("Copying standalone...")
shutil.copytree(
    os.path.join(base, '.next', 'standalone'),
    out
)
print("Copying static...")
shutil.copytree(
    os.path.join(base, '.next', 'static'),
    os.path.join(out, '.next', 'static'),
    dirs_exist_ok=True
)
pub_src = os.path.join(base, 'public')
if os.path.exists(pub_src):
    print("Copying public...")
    shutil.copytree(pub_src, os.path.join(out, 'public'), dirs_exist_ok=True)
else:
    print("No public dir, skipping")
print("Creating zip...")
shutil.make_archive(zip_out, 'zip', out)
size = os.path.getsize(zip_out + '.zip')
print(f"deploy.zip created: {size:,} bytes")
