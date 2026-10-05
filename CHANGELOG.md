# Changelog — The Brass Age Update

All notable changes to **The Brass Age** modpack expansion for **Rustic Craft II** (Minecraft 1.21.1 / NeoForge 21.1.248) will be documented in this file.

---

## [v1.1.2] — 2026-10-05 (Garrison Weapons Registry, Inspector Licensing & "Papers, Please" Counterfeiting)

This release introduces the Central Garrison Legal Weapons Registry, Authorized Personnel Licensing, the "Papers, Please" criminal firearm counterfeiting system, automated checkpoint contraband enforcement, and penal custody integration.

### ✨ New Features & Systems

#### 1. Garrison Central Weapons Registry (`admin_straja_registry.js`)
- **Centralized Weapon Database**: Authoritative registry stored in persistent server data (`StrajaCentralRegistry`) mapping every serialized firearm (`#RC-15-XXXX`) to its legal owner, registration timestamp, issuing inspector, and legal status.
- **Daily Maturation & Rollover Queue (`StrajaPendingRegistry`)**: Newly stamped firearms enter a 24-hour maturation queue. Registered weapons mature and become officially recognized at midnight / morning rollover (`/straja rollover`).
- **Physical Patrol Snapshot Books (`/straja book give [player]`)**: Straja soldiers carry physical patrol snapshot books. Patrol books **do not auto-update** in the field; soldiers must visit the garrison or quartermaster to obtain new editions.
- **Subtle Roleplay Cues & Inspection Heuristics**: The patrol book contains subtle roleplay guidance for officers on what to look for (font alignments, stamp symmetry, serial format rules `#RC-15-XXXX`) without meta-game spoilers.

#### 2. Authorized Personnel Licensing (`/straja inspector` & `/straja transporter`)
- **Weapons Inspectors (`StrajaInspectors`)**: Authorized inspectors can legally proof firearms on an anvil with the Imperial Stamp and issue signed firearm permits (`minecraft:written_book`).
- **Weapons Transporters (`StrajaTransporters`)**: Logistics personnel authorized to transport weapons without contraband penalties at checkpoints, including sealed military crates (`kubejs:crate_muskets`, `kubejs:crate_pistols`, `kubejs:ammunition_crate`).
- **Persistent Data Store**: Inspector and Transporter privileges persist across server restarts, reloads, and player disconnects. Offline players can be safely licensed via username suggestions.

#### 3. "Papers, Please" Criminal Counterfeiting (`flintlock_proofing_legal.js`)
- **Unlicensed Anvil Stamping**: When an unlicensed criminal attempts to proof a firearm with the Imperial Stamp on an anvil, the system generates counterfeit proofing marks with a calibrated probability distribution:
  - **Tier 1 (5% Near-Perfect Fake)**: Subtle flaw (e.g. inverted Roman numerals `#RC-XV-` or slightly blurred ink). Can fool ordinary patrol inspections unless cross-referenced against the central registry book.
  - **Tier 2 (50% Common Flawed Fake)**: Readily noticeable flaw (e.g. off-center serial `#RC-15_` or misspelled abbreviation). Alert officers will spot irregularities upon inspection.
  - **Tier 3 (45% Botched Grotesque Fake)**: Obvious crude scratched fake (e.g. `#RUSTY-GUN-99`). Checkpoint sentries immediately sound the alarm and dispatch the offender to penal custody.
- **Forged Weapon Permits**: Unlicensed players attempting to stamp permit blanks produce counterfeit documentation with subtle forged text.

#### 4. Port Checkpoint Contraband Enforcement & Penal Custody (`port_checkpoint.js`, `straja_prison.js`)
- **Automated Contraband Scanner**: Port checkpoint sentries evaluate all held and carried firearms:
  - **Unmarked Guns (`Proofed: 0` or missing)**: Contraband — immediate confiscation and arrest unless the player is an authorized inspector/transporter or carrying sealed military crates.
  - **Defaced Guns (`Defaced: 1`)**: Contraband — immediate confiscation and arrest.
  - **Tier 3 Botched Fakes (`FakeTier: 3`)**: Contraband — automated arrest with no warning.
- **Penal Custody Integration**: Contraband weapons are secured in confiscated chests (`StrajaPrisonChests`) and offenders are committed to prison cells (`StrajaPrisonCells`).

#### 5. Unified `/straja` Command Architecture & Automated Self-Test Runner
- **Consolidated Command Hierarchy**:
  - `/straja inspector add|remove|list|check <player>`
  - `/straja transporter add|remove|list|check <player>`
  - `/straja register_serial <serial> <owner>`
  - `/straja rollover`
  - `/straja lookup <serial>`
  - `/straja book give [player]`
  - `/straja checkpoint status`
  - `/straja prison status`
  - `/straja test`
  - `/straja setup` (forwarder → `/brass_test setup`)
  - `/straja tester [args]` (forwarder → `/brass_test [args]`)
- **Automated 26-Assertion Self-Test**: Validates licensing, maturation queues, contraband classification, 10,000-iteration Monte Carlo counterfeit probability distributions (5% T1, 50% T2, 45% T3), and patrol book formatting directly on the live dedicated server.

#### 6. Automated Tester Handholding Engine (`admin_test_runner.js`)
- **14-Step Guided Test Suite** expanded from 9 steps. Steps 10–14 cover Registry Rollover, Inspector/Transporter Licensing, Papers-Please Counterfeits, Port Checkpoint, and Penal Custody & Release.
- **Zero-Chore Auto-Setup (`/brass_test setup` / `/straja setup`)**: Automatically binds a virtual checkpoint deny-target and prison cell anchor at the tester's current coordinates. No redstone, command blocks, or manual configuration required.
- **Role Switching (`/brass_test role <inspector|transporter|civil>`)**: 1-click role toggling with direct persistent-data manipulation. Works from RCON and console as well as in-game.
- **Fake Weapons Pack (`/brass_test fakes`)**: Delivers pre-generated sample firearms covering all six states: Tier 1 (Near Perfect), Tier 2 (Common Flawed), Tier 3 (Botched), Defaced, Unmarked, and Authentic Legal.
- **Guaranteed Unjail (`/brass_test release [player]` / `/brass_test unjail [player]`)**: Emergency release that bypasses `SP_JAILERS` whitelist for OP Level 2 operators, restores game mode from Adventure to Survival, and clears all arrest persistent data tags.
- **Bug Fix — `runTesterRole` TypeError**: Resolved `Cannot read property "string" from undefined` crash when calling `/brass_test role inspector <offlinePlayer>` from RCON or console. Introduced `resolvePlayerName()` and `resolvePlayerEntity()` helpers that safely handle both player objects and raw name strings without accessing `.name.string` on null. Replaced all `ctx.source.sendSuccess()` calls with `ctx.source.sendSystemMessage()` for RCON context compatibility.
- **Prison Release Permission Level**: Lowered Straja Prison release guard from `hasPermission(3)` to `hasPermission(2)`, ensuring OP Level 2 operators (testers) can always release prisoners without being blocked.

#### 7. Post-Verification QA Bug Fixes & Tactical Combat Tuning
- **Canister Shot True Pellets (`delayshoot_gun_logic.lua`)**: Resolved issue where Canister ammunition fired as a single slug (`bullet_amount: 1`). Implemented `M.modify_property` in `delayshoot_gun_logic.lua` returning `bullet_amount = 8` and `inaccuracy = 7.0` when `ChamberAmmoType == "canister"`. Canister ammo now correctly fires 8 individual iron pellets with realistic shotgun blast spread.
- **Flintlock Ammunition Effect Leak Isolation (`flintlock_ammo_silver_combat.js`)**: Fixed critical bug where possessing flintlock special ammo in inventory caused ammo effects (silver 4x, canister knockback, incendiary fire) to leak onto other modern TaCZ firearms (e.g. AK-47, shotguns). Added strict `isFlintlockGun(gunId)` and `AmmoId == 'qkl:16mm'` guards across `onGunReload`, `onGunShoot`, and `applyTacticalHitEffects`. Modern firearms are strictly excluded from flintlock effects.
- **Imperial Proof Stamp Concealed Crafting (`flintlock_recipe_visibility.js`)**: Hidden `kubejs:flintlocks/craft_proof_stamp` from EMI and JEI recipe viewers. The official state stamp recipe is now completely invisible in recipe browsers and can only be crafted by key authorized members who know the secret pattern.
- **Gun License Book Multi-Page Layout (`flintlock_proofing_legal.js`)**: Redesigned official and forged weapon permit books into an elegant 2-page document (Page 1: Identification & Registration Details, Page 2: Legal Provisions & Checkpoint Warning). Completely eliminates text cutoff at the bottom of Page 1 caused by Minecraft's 14-line page height limit.
- **Tactical Incendiary Thermal Shock & Target Dummy Support (`flintlock_ammo_silver_combat.js`)**: Incendiary sulfur rounds now inflict +25% (+3.0) bonus thermal impact shock on direct hit in addition to 8 seconds of fire. Enhanced Target Dummy (`dummmmmy:target_dummy`) detection to support undead skulls/helmets and name tags during shooting range testing. Debounced Canister knockback audio and chat notifications to prevent spam when all 8 pellets strike simultaneously.

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
