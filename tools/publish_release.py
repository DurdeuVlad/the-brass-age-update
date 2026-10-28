import subprocess

with open('release_notes_v1.3.8.md', 'r', encoding='utf-8') as f:
    notes = f.read()

cmd = [
    'gh', 'release', 'create', 'v1.3.8',
    'exports/TheBrassAge-Update-All-In-One-v1.3.8.zip',
    'exports/TheBrassAge-Update-Client-v1.3.8.zip',
    'exports/TheBrassAge-Update-Server-v1.3.8.zip',
    '--title', 'v1.3.8 — Modern Gun Disabling, Gunpack Index Fixes & WeaponMaster Error Texture Patch',
    '--notes-file', 'release_notes_v1.3.8.md'
]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print('Return code:', res.returncode)
print('Stdout:', res.stdout)
print('Stderr:', res.stderr)
