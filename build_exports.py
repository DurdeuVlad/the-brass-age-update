import os
import shutil
import zipfile
import hashlib

BASE_DIR = r"E:\Github2\the-brass-age-update"
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
STAGING_DIR = os.path.join(BASE_DIR, "staging")

os.makedirs(EXPORTS_DIR, exist_ok=True)
if os.path.exists(STAGING_DIR):
    shutil.rmtree(STAGING_DIR)
os.makedirs(STAGING_DIR, exist_ok=True)

def zip_dir(source_dir, output_zip_path):
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                z.write(full_path, rel_path)
    size_mb = os.path.getsize(output_zip_path) / (1024 * 1024)
    with open(output_zip_path, 'rb') as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    print(f"Created: {os.path.basename(output_zip_path)} ({size_mb:.2f} MB) - SHA256: {sha256[:12]}...")
    return output_zip_path

# 1. Build All-In-One Package (Recommended for Singleplayer & Drop-in modpack update)
aio_stage = os.path.join(STAGING_DIR, "all_in_one")
os.makedirs(aio_stage, exist_ok=True)

shutil.copy(os.path.join(BASE_DIR, "TESTER_GUIDE.md"), os.path.join(aio_stage, "TESTER_GUIDE.md"))
shutil.copy(os.path.join(BASE_DIR, "TESTER_GUIDE.md"), os.path.join(aio_stage, "README_TESTERS.txt"))

# Copy folders
for folder in ["config", "defaultconfigs", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "server", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(aio_stage, folder))

# Ensure client_scripts and assets are also present in kubejs
client_assets = os.path.join(BASE_DIR, "client", "kubejs", "assets")
aio_assets = os.path.join(aio_stage, "kubejs", "assets")
if os.path.exists(client_assets) and not os.path.exists(aio_assets):
    shutil.copytree(client_assets, aio_assets)

zip_dir(aio_stage, os.path.join(EXPORTS_DIR, "TheBrassAge-Update-All-In-One-v1.0.0.zip"))

# 2. Build Server Package (For dedicated server administrators)
server_stage = os.path.join(STAGING_DIR, "server")
os.makedirs(server_stage, exist_ok=True)
shutil.copy(os.path.join(BASE_DIR, "TESTER_GUIDE.md"), os.path.join(server_stage, "TESTER_GUIDE.md"))

for folder in ["config", "defaultconfigs", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "server", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(server_stage, folder))

zip_dir(server_stage, os.path.join(EXPORTS_DIR, "TheBrassAge-Update-Server-v1.0.0.zip"))

# 3. Build Client Package (For players connecting to a remote dedicated server)
client_stage = os.path.join(STAGING_DIR, "client")
os.makedirs(client_stage, exist_ok=True)
shutil.copy(os.path.join(BASE_DIR, "TESTER_GUIDE.md"), os.path.join(client_stage, "TESTER_GUIDE.md"))

for folder in ["config", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "client", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(client_stage, folder))

zip_dir(client_stage, os.path.join(EXPORTS_DIR, "TheBrassAge-Update-Client-v1.0.0.zip"))

# Clean up staging
shutil.rmtree(STAGING_DIR)
print("Staging cleaned up. All exports built successfully!")
