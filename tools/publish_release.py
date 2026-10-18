import subprocess

with open('release_notes_v1.3.7.md', 'r', encoding='utf-8') as f:
    notes = f.read()

cmd = [
    'gh', 'release', 'create', 'v1.3.7',
    'exports/TheBrassAge-Update-All-In-One-v1.3.7.zip',
    'exports/TheBrassAge-Update-Client-v1.3.7.zip',
    'exports/TheBrassAge-Update-Server-v1.3.7.zip',
    '--title', 'v1.3.7 — Flintlock Ballistics Calibration Fine-Tuning',
    '--notes-file', 'release_notes_v1.3.7.md'
]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print('Return code:', res.returncode)
print('Stdout:', res.stdout)
print('Stderr:', res.stderr)
