import os
import shutil
import zipfile
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
STAGING_DIR = os.path.join(BASE_DIR, "staging")
VERSION = "v1.2.0"

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

def copy_installer_files(target_stage):
    for doc in ["TESTER_GUIDE.md", "HOW_TO_INSTALL.txt", "install_patch.bat", "install_patch.ps1"]:
        src = os.path.join(BASE_DIR, doc)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(target_stage, doc))
    # Also create README_TESTERS.txt copy of HOW_TO_INSTALL
    src_how = os.path.join(BASE_DIR, "HOW_TO_INSTALL.txt")
    if os.path.exists(src_how):
        shutil.copy(src_how, os.path.join(target_stage, "README_TESTERS.txt"))

# 1. Build All-In-One Package (Recommended for Singleplayer & Drop-in modpack update)
aio_stage = os.path.join(STAGING_DIR, "all_in_one")
os.makedirs(aio_stage, exist_ok=True)
copy_installer_files(aio_stage)

# Copy base server folders (configs, kubejs server/startup scripts, mods, patchouli, tacz)
for folder in ["config", "defaultconfigs", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "server", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(aio_stage, folder))

# Ensure client_scripts and assets are also present in kubejs
client_assets = os.path.join(BASE_DIR, "client", "kubejs", "assets")
aio_assets = os.path.join(aio_stage, "kubejs", "assets")
if os.path.exists(client_assets) and not os.path.exists(aio_assets):
    shutil.copytree(client_assets, aio_assets)

client_scripts = os.path.join(BASE_DIR, "client", "kubejs", "client_scripts")
aio_client_scripts = os.path.join(aio_stage, "kubejs", "client_scripts")
if os.path.exists(client_scripts) and not os.path.exists(aio_client_scripts):
    shutil.copytree(client_scripts, aio_client_scripts)

zip_dir(aio_stage, os.path.join(EXPORTS_DIR, f"TheBrassAge-Update-All-In-One-{VERSION}.zip"))

# 2. Build Server Package (For dedicated server administrators)
server_stage = os.path.join(STAGING_DIR, "server")
os.makedirs(server_stage, exist_ok=True)
copy_installer_files(server_stage)

for folder in ["config", "defaultconfigs", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "server", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(server_stage, folder))

zip_dir(server_stage, os.path.join(EXPORTS_DIR, f"TheBrassAge-Update-Server-{VERSION}.zip"))

# 3. Build Client Package (For players connecting to a remote dedicated server OR singleplayer)
client_stage = os.path.join(STAGING_DIR, "client")
os.makedirs(client_stage, exist_ok=True)
copy_installer_files(client_stage)

for folder in ["config", "kubejs", "mods", "patchouli_books", "tacz"]:
    src = os.path.join(BASE_DIR, "client", folder)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(client_stage, folder))

# Ensure server_scripts are present and fully synced in Client package for Singleplayer integrated server support
server_scripts = os.path.join(BASE_DIR, "server", "kubejs", "server_scripts")
client_server_scripts = os.path.join(client_stage, "kubejs", "server_scripts")
if os.path.exists(server_scripts):
    shutil.copytree(server_scripts, client_server_scripts, dirs_exist_ok=True)

zip_dir(client_stage, os.path.join(EXPORTS_DIR, f"TheBrassAge-Update-Client-{VERSION}.zip"))

# Clean up staging
shutil.rmtree(STAGING_DIR)
print(f"Staging cleaned up. All {VERSION} exports built successfully!")
