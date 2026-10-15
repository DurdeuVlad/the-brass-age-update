# The Brass Age Update — Rustic Craft II
**Renaissance Firearm & Military Industrial Expansion (Minecraft 1.21.1 NeoForge)**

> [!IMPORTANT]
> **Founding Document**: The complete architectural, economic, and military specification for this expansion is defined in [**`THE_BRASS_AGE_EXPANSION_PROPOSAL.md`**](THE_BRASS_AGE_EXPANSION_PROPOSAL.md).  
> Formal printable versions are available as [**`THE_BRASS_AGE_EXPANSION_PROPOSAL.pdf`**](THE_BRASS_AGE_EXPANSION_PROPOSAL.pdf) (6-page verified executive & technical document) and [**`THE_BRASS_AGE_EXPANSION_PROPOSAL.docx`**](THE_BRASS_AGE_EXPANSION_PROPOSAL.docx).

---

## 📖 Overview

**The Brass Age** marks Rustic Craft II's transition from the High Medieval era into the Early Modern / Renaissance period. Designed with a combined-arms philosophy inspired by **Cossacks 3**, firearms serve as devastating force multipliers (40–55 damage) countered by long, vulnerable reload windows (19.5–22.2s), realistic 18th-century smoothbore ballistics, and mechanical lock-time delays.

Pikes, cavalry, halberds, and plate armor (`epic-knights`, `spartan_weaponry`) retain supremacy on the battlefield, while an intricate industrial economy powered by **Create 6** drives factional roleplay between:
1. **P.U.L.A SRL (The Factory Faction)**: Controls mechanical fabrication, rotational power, barrel-boring benches, chemical refineries, and civilian commodity production lines.
2. **Straja (The Realm's Gendarmerie)**: Controls continental law enforcement, the expeditionary vanguard garrison, and the Great Continental Mine (`custom_mines`) holding the realm's sole industrial sulfur, coal, iron, and dripstone (nitrate) deposits.

---

## 🏛️ Core System Pillars

### 1. Authentic Smoothbore Ballistics & Lock Time
- **Dispersion Profile**: Muzzleloading flintlocks feature calibrated conical dispersion (`aim: 1.85°`, `sneak: 1.0°`, `move: 7.5°`). Lethal point-blank at 0–30m, but requiring disciplined rank-and-file volleys past 50m.
- **140ms Lock-Time Delay**: Trigger pulls trigger the Lua delay hook (`qkl:delayshoot_gun_logic`), simulating flint striking frizzen, pan flash, and touchhole ignition. Shooters must hold aim through the strike.
- **Technological Progression (Create Rifling)**: P.U.L.A SRL can bore spiral rifling grooves (`rifled_barrel`) using Create Mechanical Drills and precision mechanisms to produce the **FK15-R Jaeger Rifled Musket** (`aim: 0.35°`), trading reload speed for 100m sharpshooter precision.

### 2. Specialized Ammunition Arsenal & Consecrated Silver
- **16.5mm Standard Lead Ball**: High blunt-force trauma against armor and living targets.
- **16.5mm Consecrated Silver Ball**: The realm's only weapon capable of piercing Island Corruption vitality. Deals **4× damage against undead CustomNPCs & mobs** and **2× damage against vampire/undead players** (`origins-rustic`).
- **Canister Scattershot & Incendiary Rounds**: Specialized defensive and cavern-clearing munitions.

### 3. Factorio-Style 3-Tier Industrial Economy
Production efficiency scales non-linearly with kinetic and thermal automation:
- **Tier 1 (Desperation)**: 3x3 crafting grid manual labor (low yield, crude quality).
- **Tier 2 (Kinetic Lines)**: Basin mixers, mechanical presses, and crafters (4× yield).
- **Tier 3 (Thermodynamic Sulfur Complexes)**: Blaze-heated basins, sulfuric acid piping, and sequenced assembly (16× yield surges + exclusive premium grades: Vintage Wine cask strips, Miracle Fertilizer, Medicated Sulfur Soap, Safety Matchboxes, Vitriol Heavy Leather).

### 4. Legal Provenance, Proofing & Black Market State Machine
- **Unproofed Arms (`NEÎNREGISTRAT`)**: Contraband subject to immediate seizure.
- **Royal Proofing Ritual**: Stamped in an Anvil or Deployer using Straja's `proof_stamp` to assign cryptographic serial numbers (`#RC-15-XXXX`).
- **Legal Permits & Defaced Arms**: Signed permit books authorize carriage; defacing serials on grindstones creates illegal black-market weaponry.

---

## 📂 Repository Structure

```
├── THE_BRASS_AGE_EXPANSION_PROPOSAL.md    # Founding architectural & technical specification
├── THE_BRASS_AGE_EXPANSION_PROPOSAL.pdf   # 6-page compiled executive proposal & appendix
├── THE_BRASS_AGE_EXPANSION_PROPOSAL.docx  # Formatted Word document with embedded high-DPI figures
├── figures/                               # High-DPI centered architecture & workflow diagrams
│   ├── diagram1_combat.png                # Figure 1: Combat Flow & Reload Vulnerability Window
│   ├── diagram2_chapters.png              # Figure 2: The Two-Chapter Geopolitical & Tech Arc
│   ├── diagram3_tiers.png                 # Figure 3: Factorio-Style Create Tiering Architecture
│   ├── diagram4_mine.png                  # Figure 4: Straja Continental Mine Refining Flow
│   └── diagram5_serialization.png         # Figure 5: Firearm Provenance & Serialization Flow
├── create_proposal_doc.py                 # Automated Word document & PDF compiler (win32com)
├── render_diagrams.py                     # High-DPI Mermaid renderer (Playwright)
├── server/                                # Dedicated server overlay
│   ├── config/                            # Backpack & toolbelt server configurations
│   ├── defaultconfigs/                    # Default world configuration templates
│   ├── kubejs/server_scripts/             # KubeJS server scripts (ballistics, ammo, carry limits)
│   │   ├── flintlocks.js                  # Weapon & rifled barrel crafting recipes
│   │   ├── flintlock_ammo.js              # Create mechanical crafter ammunition recipes
│   │   ├── flintlock_ballistics.js        # TaCZServerEvents dynamic ballistics enforcement
│   │   ├── flintlock_carry_limits.js      # Staggered 1 Hz player inventory carry limits
│   │   └── military_logistics_crates.js   # Bulk transport crates & Trotting Wagon logistics
│   ├── mods/                              # Server-side TaCZ & KubeJS integration JARs
│   └── tacz/                              # ChocolateMan & Gunpowder Revolution gun packs
├── client/                                # Client instance overlay (exact parity with server)
└── reference/docs/                        # Gunsmith manuals and reference materials
```

---

## 🚀 Installation & Deployment (v1.3.5)

> [!IMPORTANT]
> **Patch / Expansion Notice**: The Brass Age is an expansion overlay designed to be installed **OVER an existing Rustic Craft II instance** (Minecraft 1.21.1 / NeoForge 21.1.248).  
> **Do NOT import this release ZIP as a new profile in CurseForge or Prism Launcher!** An empty profile lacks the 150+ base modpack dependencies (`kubejs`, `create`, etc.) and will fail to boot with dependency errors (`tacz_js requires kubejs`, `tacz_c requires create`).

Download the latest packages from [**GitHub Releases (v1.3.5)**](https://github.com/DurdeuVlad/the-brass-age-update/releases/tag/v1.3.5):
- 📦 **All-In-One Package**: `TheBrassAge-Update-All-In-One-v1.3.5.zip` *(Recommended for Singleplayer & Drop-in modpack updates)*
- 🖥️ **Client Package**: `TheBrassAge-Update-Client-v1.3.5.zip` *(For players connecting to remote dedicated servers)*
- 🖧 **Server Package**: `TheBrassAge-Update-Server-v1.3.5.zip` *(For dedicated Linux / Windows server administrators)*

---

### 1. Windows Installation (CMD & PowerShell)

1. Open your existing **Rustic Craft II** instance folder:
   - **Prism Launcher**: Right-click instance $\rightarrow$ **Folder Instanță** $\rightarrow$ `.minecraft`
   - **CurseForge**: Right-click profile $\rightarrow$ **Open Folder**
   - **Modrinth**: Right-click instance $\rightarrow$ **Open Folder**
2. Extract the contents of the downloaded ZIP directly into this folder.
3. Run the installer:
   ```cmd
   :: Method A: Double-click install_patch.bat in Windows Explorer
   install_patch.bat
   ```
   *or via PowerShell:*
   ```powershell
   # Method B: PowerShell (handles permission bypass automatically)
   powershell -ExecutionPolicy Bypass -File .\install_patch.ps1
   ```
4. Launch the game from your existing launcher profile.

---

### 2. Linux & Headless Server Installation

For standalone Linux systems (Ubuntu, Debian, Fedora, Arch, Alpine), Pterodactyl panels, or systemd services:

#### Option A: Automated Script (`install_patch.sh`)
```bash
# 1. Navigate to your server or client instance folder
cd /path/to/rusticcraft2/

# 2. Extract the update archive into the instance root
unzip -o /path/to/TheBrassAge-Update-Server-v1.3.5.zip

# 3. Grant execute permissions and run the patcher
chmod +x install_patch.sh
./install_patch.sh
```

#### Option B: Headless Server One-Liner (curl / wget)
```bash
# Direct download and silent merge on a remote Linux server
wget -qO /tmp/brass_age.zip https://github.com/DurdeuVlad/the-brass-age-update/releases/download/v1.3.5/TheBrassAge-Update-Server-v1.3.5.zip \
  && unzip -qo /tmp/brass_age.zip -d /var/games/minecraft/rusticcraft2/ \
  && chmod +x /var/games/minecraft/rusticcraft2/install_patch.sh \
  && /var/games/minecraft/rusticcraft2/install_patch.sh \
  && rm -f /tmp/brass_age.zip
```

---

### 3. WSL (Windows Subsystem for Linux) & Sublinux Environment Support

When managing a Windows-hosted modpack instance (e.g. Prism or CurseForge on Windows) from within a WSL terminal (Ubuntu, Debian on WSL):

#### Step 1: Locate the Windows instance from WSL
WSL mounts Windows drives under `/mnt/c/`. Replace `<WindowsUser>` with your actual Windows username:

* **Prism Launcher (WSL path)**:
  ```bash
  PRISM_DIR="/mnt/c/Users/<WindowsUser>/AppData/Roaming/PrismLauncher/instances/RusticCraft2/.minecraft"
  ```
* **CurseForge (WSL path)**:
  ```bash
  CURSE_DIR="/mnt/c/Users/<WindowsUser>/curseforge/minecraft/Instances/Rustic Craft II"
  ```

#### Step 2: Execute `install_patch.sh` targeting the Windows instance
```bash
# Grant execution permissions
chmod +x ./install_patch.sh

# Run installer passing the target Windows instance path:
./install_patch.sh "/mnt/c/Users/<WindowsUser>/AppData/Roaming/PrismLauncher/instances/RusticCraft2/.minecraft"
```

#### Step 3: Direct `rsync` / `cp` Command for WSL
If you prefer direct terminal merging without interactive prompts:
```bash
TARGET="/mnt/c/Users/<WindowsUser>/AppData/Roaming/PrismLauncher/instances/RusticCraft2/.minecraft"

for folder in mods kubejs tacz patchouli_books config defaultconfigs; do
  if [ -d "./$folder" ]; then
    mkdir -p "$TARGET/$folder"
    cp -rf "./$folder"/* "$TARGET/$folder"/
    echo "[WSL] Merged $folder into $TARGET"
  fi
done
```

---

### 4. Verification & Post-Install Validation

1. **Verify In-Game Lore & Manuals**:
   - `/flintlock` or `/arma` — Opens the in-game Flintlock Lore & Quick Guide.
   - `/function kubejs:give_gunsmith_manual` — Grants the Patchouli *Gunsmith's Handbook*.
2. **Dedicated Server Verification**:
   - Execute `/straja test` in the server console or via RCON to run the automated empirical test suite (55/55 tests should pass, including Test Suite 8 anti-dupe validation).


---

## 🛠️ Building Documentation

To re-render diagrams or compile the official PDF proposal:
```bash
# 1. Render high-DPI figures from Mermaid sources
python render_diagrams.py

# 2. Compile Word (.docx) and PDF (.pdf) documents
python create_proposal_doc.py
```
