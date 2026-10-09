import os
import shutil

BASE = r"e:\Github2\the-brass-age-update"
SERVER_DIRS = [
    r"E:\Github2\rusticcraft2-clona\new-clone-28-sept\_",
    r"E:\Github2\rusticcraft2-clona\test-silver-instance"
]
CLIENT_DIR = r"C:\Users\User\.mct\clients\rustic-nf\minecraft"

def sync_folder(src, dst_list):
    if not os.path.exists(src):
        return
    for root, dirs, files in os.walk(src):
        rel = os.path.relpath(root, src)
        for d in dirs:
            for dst_base in dst_list:
                os.makedirs(os.path.join(dst_base, rel, d), exist_ok=True)
        for f in files:
            src_file = os.path.join(root, f)
            for dst_base in dst_list:
                dst_file = os.path.join(dst_base, rel, f)
                os.makedirs(os.path.dirname(dst_file), exist_ok=True)
                shutil.copyfile(src_file, dst_file)
                print(f"Synced {os.path.join(rel, f)} -> {dst_base}")

print("=== 1. Syncing server_scripts ===")
srv_scripts_src = os.path.join(BASE, "server", "kubejs", "server_scripts")
srv_scripts_dst = [os.path.join(s, "kubejs", "server_scripts") for s in SERVER_DIRS] + [
    os.path.join(CLIENT_DIR, "kubejs", "server_scripts")
]
sync_folder(srv_scripts_src, srv_scripts_dst)

print("=== 2. Syncing client_scripts ===")
cli_scripts_src = os.path.join(BASE, "client", "kubejs", "client_scripts")
cli_scripts_dst = [os.path.join(s, "kubejs", "client_scripts") for s in SERVER_DIRS] + [
    os.path.join(CLIENT_DIR, "kubejs", "client_scripts")
]
sync_folder(cli_scripts_src, cli_scripts_dst)

print("=== 3. Syncing startup_scripts ===")
startup_src = os.path.join(BASE, "server", "kubejs", "startup_scripts")
if os.path.exists(startup_src):
    startup_dst = [os.path.join(s, "kubejs", "startup_scripts") for s in SERVER_DIRS] + [
        os.path.join(CLIENT_DIR, "kubejs", "startup_scripts")
    ]
    sync_folder(startup_src, startup_dst)

print("=== 4. Syncing patchouli_books ===")
book_srv_src = os.path.join(BASE, "server", "patchouli_books")
book_cli_src = os.path.join(BASE, "client", "patchouli_books")
book_srv_dst = [os.path.join(s, "patchouli_books") for s in SERVER_DIRS]
sync_folder(book_srv_src, book_srv_dst)
sync_folder(book_cli_src, [os.path.join(CLIENT_DIR, "patchouli_books")])

print("=== Sync Complete! All files mirrored successfully. ===")
