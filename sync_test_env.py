import os
import shutil

BASE = r"e:\Github2\the-brass-age-update"
SERVER_DIR = r"E:\Github2\rusticcraft2-clona\new-clone-28-sept\_"
CLIENT_DIR = r"C:\Users\User\.mct\clients\rustic-nf\minecraft"

server_scripts = [
    "flintlock_carry_limits.js",
    "flintlock_ux_helpers.js",
    "military_logistics_crates.js",
    "flintlock_ammo_silver_combat.js",
    "flintlock_proofing_legal.js",
    "flintlock_ordnance_special.js",
    "admin_straja_registry.js",
    "straja_prison.js",
    "port_checkpoint.js",
    "admin_test_runner.js"
]

client_scripts = [
    "flintlock_tooltips.js"
]

print("Syncing server_scripts...")
for s in server_scripts:
    src = os.path.join(BASE, "server", "kubejs", "server_scripts", s)
    dst_srv = os.path.join(SERVER_DIR, "kubejs", "server_scripts", s)
    dst_cli = os.path.join(CLIENT_DIR, "kubejs", "server_scripts", s)
    if os.path.exists(src):
        shutil.copyfile(src, dst_srv)
        shutil.copyfile(src, dst_cli)
        print(f"Synced {s} -> server & client")
    else:
        print(f"Warning: {src} not found!")

print("Syncing client_scripts...")
for c in client_scripts:
    src = os.path.join(BASE, "client", "kubejs", "client_scripts", c)
    dst_srv = os.path.join(SERVER_DIR, "kubejs", "client_scripts", c)
    dst_cli = os.path.join(CLIENT_DIR, "kubejs", "client_scripts", c)
    if os.path.exists(src):
        shutil.copyfile(src, dst_srv)
        shutil.copyfile(src, dst_cli)
        print(f"Synced {c} -> server & client")
    else:
        print(f"Warning: {src} not found!")

print("Sync complete!")
