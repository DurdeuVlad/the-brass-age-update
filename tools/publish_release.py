import subprocess

notes = """## The Brass Age — Version 1.3.5 Bugfix Release

### 🛡️ Critical Exploit Fix: Workstation Anvil GUI Weapon Duplication Patch

This release patches and eliminates an item duplication exploit occurring in workstation GUIs (Anvil, Grindstone) when interacting with firearms:

#### 1. Anvil GUI Preview Duplication Elimination (`flintlock_carry_limits.js`)
- **Exploit Mechanics**: Placing an untagged firearm (`qkl:fk15` rifle or `qkl:fk15p` pistol) with a proof stamp into an anvil generates an uncommitted output preview item in Slot 2 (`ResultSlot`). When closing the anvil GUI (pressing `ESC`), vanilla's container teardown safely returns the input firearm to the player's inventory. However, `flintlockEnforce()` was naively iterating `player.containerMenu.slots` (slots 1..10) on tick and container close. Since the player's inventory already held their firearm, `flintlockEnforce()` treated Slot 2 (the anvil preview) as an "excess" weapon and called `player.drop()`. This spawned a physical weapon entity on the ground while the original remained in inventory. The exploit only worked on untagged guns because tagged guns (`Proofed`/`Forged`/`Defaced`) deliberately set output to empty in `AnvilUpdateEvent`.
- **Resolution**:
  - `flintlockEnforce()` now strictly checks `player.inventoryMenu.slots` (slots 1..4 only, representing the 2x2 crafting grid in the player's personal inventory screen). It **never** scans `player.containerMenu.slots`, preventing any workstation output slots (Anvil, Grindstone, Smithing Table, Merchant) or external container storage (Chests, Barrels) from being evaluated or dropped.
  - `PlayerContainerEvent$Close` now defers carry limit enforcement by 1 game tick (`server.scheduleInTicks(1)`). This guarantees vanilla's `containerMenu.removed(player)` has completely executed, returning valid input items to inventory and clearing temporary result containers before carry limits are evaluated.

#### 2. Automated Regression Suite 8 Added (`admin_straja_registry.js`)
- Added `TEST SUITE 8: Carry Limits & Anvil Container Close Anti-Dupe Verification` to the automated self-test runner (`/straja test`).
- All 55 empirical self-tests passed with 100% success on the live NeoForge 21.1.248 server.
"""

with open('release_notes_v1.3.5.md', 'w', encoding='utf-8') as f:
    f.write(notes)

cmd = [
    'gh', 'release', 'create', 'v1.3.5',
    'exports/TheBrassAge-Update-All-In-One-v1.3.5.zip',
    'exports/TheBrassAge-Update-Client-v1.3.5.zip',
    'exports/TheBrassAge-Update-Server-v1.3.5.zip',
    '--title', 'v1.3.5 — Critical Exploit Fix: Anvil GUI Preview Duplication Patch',
    '--notes-file', 'release_notes_v1.3.5.md'
]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print('Return code:', res.returncode)
print('Stdout:', res.stdout)
print('Stderr:', res.stderr)
