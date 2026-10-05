# Changelog — The Brass Age Update

All notable changes to **The Brass Age** modpack expansion for **Rustic Craft II** (Minecraft 1.21.1 / NeoForge 21.1.248) will be documented in this file.

---

## [v1.1.1] — 2026-10-05 (Tester Patch & Critical Bug Fixes)

This release addresses all issues reported by modpack testers during QA on dedicated servers and singleplayer client sessions, and includes startup script engine stabilization.

### 🐛 Fixed Issues (Bug Fixes)

#### 1. Weapon Crate In-World Ground Unpacking (`weaapon crate nu merge pus pe jos`)
- **Issue**: Players could not unpack military weapon crates (`kubejs:crate_muskets`, `kubejs:crate_pistols`, `kubejs:ammunition_crate`) when right-clicking on top of ground blocks. Hand validation and block click events prevented in-world placement/unpacking.
- **Fix**: Re-engineered `military_logistics_crates.js` with comprehensive `BlockEvents.rightClicked` handling. Right-clicking the ground or any solid block with a sealed military crate now safely unpacks contents (8 muskets, 8 pistols, or 256 ammunition) at the target block face or player location, returns an empty wooden chest to the player or drops it in-world, plays `block.wood.break` audio, and spawns wood particle bursts.

#### 2. Crafting Table Inventory Carry Limit Bypass (`armele pot sa fie luate in inv daca le pui in crafting table`)
- **Issue**: Players were able to bypass the firearm carry limit (1 long gun, 2 pistols) by storing weapons inside crafting table grids (3×3 `CraftingMenu`) or inventory crafting slots (2×2) and taking them out.
- **Fix**: Implemented deep container scanning and hooked `$PlayerContainerCloseEvent` in `flintlock_carry_limits.js`. Whenever a player interacts with or closes any container or crafting screen, all slots (including craft matrix, result, and cursor stacks) are strictly evaluated. Any excess long gun or sidearm beyond the legal limit is immediately dropped at the player's feet with high-priority alert chimes and chat warnings.

#### 3. In-World Grindstone Serial Removal / Defacing (`nu pot scoate seria de pe arme`)
- **Issue**: Players in the underworld could not deface or file off firearm serial numbers (`Serial: "#RC-15-XXXX"`) on a grindstone block due to container event limitations in 1.21.1 NeoForge KubeJS.
- **Fix**: Added an intuitive, in-world interaction hook in `flintlock_proofing_legal.js`. Right-clicking a Grindstone block (`minecraft:grindstone`) while holding an uninspected or legally proofed firearm in the main hand files away the serial number, strips `Serial` and `Proofed` tags, sets `Defaced: 1b`, plays grinding audio (`block.grindstone.use`) and stone particle effects, and attaches black-market lore (`SERIE PILITĂ / DEFACED`).

#### 4. Tactical Ammunition Combat Mechanics (`nu merg variatunile de ammo`)
- **Issue**: Special ammunition variants (Silver rounds, Canister scattershot, Incendiary rounds) loaded into modern kinetic firearms did not apply their supernatural or tactical combat effects when striking entities.
- **Fix**: Re-architected `flintlock_ammo_silver_combat.js` to utilize native TaCZ KubeJS event integration (`TimelessGunEvents.gunReload`, `TimelessGunEvents.gunShoot`, and `TimelessGunEvents.entityHurtByGunPre`):
  - **Consecrated Silver Rounds (`kubejs:round_silver`)**: Reloading with silver in offhand chambers silver ammunition into the gun. Firing upon undead mobs (`minecraft:generic.undead` tag or inverted healing) triggers a **4.0× holy damage multiplier**; firing upon vampires triggers a **2.0× multiplier**. Features holy amethyst resonance audio and chime effects.
  - **Canister Scattershot (`kubejs:round_canister`)**: Reloading with canister ammunition triggers a wide-dispersion blast delivering heavy knockback (`target.knockback(2.0, ...)` with `hurtMarked = true` and `hasImpulse = true`) to knock back advancing mobs or player targets.
  - **Incendiary Sulfur Rounds (`kubejs:round_incendiary`)**: Chambering incendiary ammunition ignites struck targets for **8 continuous seconds** (`igniteForSeconds(8)` / 160 fire ticks) accompanied by flame and smoke particles.
  - **Dynamic Swapping**: Fixed sticky ammo states in player `persistentData`, allowing fluid ammunition switching simply by placing the desired ammo in the offhand or inventory when reloading.

#### 5. Firearm Permit Issuance & Defaced Rejection (`[Permis] Arma din mâna stângă nu este poansonată legal!`)
- **Issue**: The permit issuance system was confused by hand swapping and allowed edge-case interactions with defaced firearms.
- **Fix**: Enhanced `flintlock_proofing_legal.js` to strictly enforce that legal permits (`Permis Port-Armă`) are only issued if the offhand holds an authentically proofed firearm with an active serial number. If the weapon is defaced (`Defaced: 1b`), permit blank stamping is refused and the blank is preserved.

#### 6. Rhino JS Startup Scoping & Engine Stability
- **Issue**: On NeoForge 21.1.248, Rhino's interpreted execution of `steel_durability.js` threw a `Redeclaration of const mults` error during item modification loop passes, causing the dedicated server to crash on startup.
- **Fix**: Refactored lexical bindings to standard function-scoped variables, preventing loop re-initialization crashes and ensuring 100% clean server bootstrap (52/52 scripts loaded with 0 errors).

---

## [v1.1.0] — 2026-10-04 (The Brass Age Expansion)

Initial feature-complete release of The Brass Age expansion.

### Added
- **Create Mechanical Crafter Integration**: Flintlock firearms (FK15 Musket and FK15-P Cavalry Pistol) require a 3×3 kinetic crafter grid. Standard crafting table recipes removed and hidden from EMI/JEI.
- **Garrison Arms Registry**: Proofing stamp on anvil applies sequential serial number (`#RC-15-XXXX`) and legal status at cost of 5 XP levels.
- **Gunsmith Admin Manual Command**: `/gunsmith book [player]` (OP level 2) grants Patchouli manual *"The Gunsmith's Book of Work"*.
- **Interactive In-Game Testing Protocol**: `/brass_test` and `/gunsmith test` commands with interactive chat action buttons (`[📦 Dă-mi Kitul]`, `[👾 Spawn Zombie]`, `[✔ Confirmă & Pasul Următor]`).
- **Mina Straja 4-Branch Overhaul**: Calibrated ore generation across 4 depth zones (Sulfur, Iron, Coal, Zinc, Silver, Dripstone, Diamond, Redstone).
- **Logistics & Carry Limits**: Realistic firearm carry limits (1 long gun, 2 pistols) with sealed wooden crates (`kubejs:crate_muskets`, `kubejs:crate_pistols`, `kubejs:ammunition_crate`).
- **34 Custom Pixel-Art Textures**: Textures for gun parts, refined powders, military crates, and tactical ammunition.
