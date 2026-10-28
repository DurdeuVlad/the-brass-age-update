import zipfile
import os
import shutil

HAMSTER_REMOVE = {
    'data/hamster/index/guns/colt1873_lb.json',
    'data/hamster/index/guns/coltm1851_chain.json',
    'data/hamster/index/guns/lebel1886_07c.json',
    'data/hamster/index/guns/lugerp08_artillerie.json',
    'data/hamster/index/guns/m1887_hc.json',
    'data/hamster/index/guns/uppercut.json',
    'data/hamster/recipe/gun/colt1873_lb.json',
    'data/hamster/recipe/gun/coltm1851_chain.json',
    'data/hamster/recipe/gun/lebel1886_07c.json',
    'data/hamster/recipe/gun/lugerp08_artillerie.json',
    'data/hamster/recipe/gun/m1887_hc.json',
    'data/hamster/recipe/gun/uppercut.json',
}

QKL_REMOVE = {
    'data/qkl/index/attachments/mu73_bayonet.json',
}

def clean_zip(zip_path, remove_set):
    if not os.path.exists(zip_path):
        print(f"Skipping (not found): {zip_path}")
        return False
    tmp_path = zip_path + '.tmp'
    removed_count = 0
    with zipfile.ZipFile(zip_path, 'r') as zin, zipfile.ZipFile(tmp_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename in remove_set:
                print(f"  Removing broken entry: {item.filename}")
                removed_count += 1
                continue
            zout.writestr(item, zin.read(item.filename))
    shutil.move(tmp_path, zip_path)
    print(f"Cleaned {zip_path} (removed {removed_count} broken entries)")
    return True

hamster_paths = [
    'server/tacz/GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip',
    'client/tacz/GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/new-clone-28-sept/_/tacz/GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/test-silver-instance/tacz/GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip',
    'C:/Users/User/.mct/clients/rustic-nf/minecraft/tacz/GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip',
]

qkl_paths = [
    'server/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'client/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/new-clone-28-sept/_/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/test-silver-instance/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'C:/Users/User/.mct/clients/rustic-nf/minecraft/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
]

print("=== 1. Patching GunpowderRevolution Gunpacks ===")
for p in hamster_paths:
    clean_zip(p, HAMSTER_REMOVE)

print("\n=== 2. Patching ChocolateMan Gunpacks ===")
for p in qkl_paths:
    clean_zip(p, QKL_REMOVE)

print("\nAll gunpacks patched successfully!")
