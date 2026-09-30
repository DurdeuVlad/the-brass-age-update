#!/usr/bin/env python3
"""
Publishes all 13 milestone issues to GitHub repository DurdeuVlad/the-brass-age-update
Strictly formatted according to Flux Production Handoff & Issue Standards.
"""
import subprocess
import json
import time

ISSUES = [
    # --- MILESTONE 1 ---
    {
        "milestone": "Milestone 1: Foundation, Registration & Ballistics Tuning",
        "title": "M1.1: Register All Expansion Items, Tools & Intermediates with Foolproof Tooltips",
        "labels": ["enhancement", "kubejs", "milestone-1"],
        "body": """## 1. Strategic Intent & Milestone Placement
This task establishes all 31 item identifiers, models, textures, and client tooltips required by The Brass Age expansion. Without clean startup registration, subsequent Create recipes, TaCZ weapons, and trading interactions will error or render missing-texture cubes.

## 2. Expected Agent Responsibilities
1. Register all 31 items in `startup_scripts/flintlock_parts.js`:
   - 18 firearm parts (including `rifled_barrel`).
   - 4 chemical/nitrate intermediates (`saltpeter`, `crushed_dripstone`, `crude_gunpowder_cake`, `wet_powder_mass`).
   - 2 legal tools (`proof_stamp` registered with `.unstackable()` only, and `permit_blank`).
   - 7 civilian commodities (`fumigation_strip`, `royal_fumigation_strip`, `miracle_fertilizer`, `medicated_soap`, `sulfur_matches`, `safety_matches`, `vitriol_leather`).
2. Provide authentic 16x16 pixel art PNG textures for all registered items in `assets/kubejs/textures/item/`.
3. Add color-coded, informative client tooltips in `client_scripts/flintlock_tooltips.js`.
4. Maintain 100% directory mirroring between `client/` and `server/`.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT use `maxDamage(0)` on `proof_stamp` (crashes NeoForge 1.21.1 on item use). Use `.unstackable()` only.
- DO NOT leave placeholder textures or rely on automatic missing textures.
- DO NOT register recipes in startup scripts; recipes belong exclusively to `server_scripts/`.

## 4. Exact File Boundaries
- `[MODIFY]` `server/kubejs/startup_scripts/flintlock_parts.js`
- `[MODIFY]` `client/kubejs/startup_scripts/flintlock_parts.js`
- `[NEW]` `client/kubejs/client_scripts/flintlock_tooltips.js`
- `[NEW]` `server/kubejs/client_scripts/flintlock_tooltips.js`
- `[NEW]` `client/kubejs/assets/kubejs/textures/item/*.png` (14 new textures)
- `[NEW]` `server/kubejs/assets/kubejs/textures/item/*.png` (14 new textures)

## 5. Measurable Acceptance Criteria & Test Surfaces
- All scripts pass `node -c` syntax validation without warnings.
- All 31 item textures exist and load without missing texture checkers.
- Tooltips render chamber status, processing instructions, and mechanical advice cleanly.
"""
    },
    {
        "milestone": "Milestone 1: Foundation, Registration & Ballistics Tuning",
        "title": "M1.2: Calibrate Smoothbore Ballistics, Stance Modifiers & 140ms Lock-Time",
        "labels": ["combat", "balance", "milestone-1"],
        "body": """## 1. Strategic Intent & Milestone Placement
Eliminate arcade laser-sniping and establish historical 18th-century black powder ballistics conforming to Cossacks 3 combat dynamics. Firearms deal devastating single-shot trauma (40–55 damage) balanced by 140ms mechanical lock time and conical dispersion.

## 2. Expected Agent Responsibilities
1. Configure `qkl:fk15` (Smoothbore Volley Musket):
   - Inaccuracy: `aim: 1.85°`, `sneak: 1.0°` (kneeling stabilizes), `stand: 4.5°`, `move: 7.5°`.
   - Lock time: `shoot_delay: 0.14s` (140 ms mechanical cock strike -> pan ignition).
   - Ballistics: `speed: 135`, `gravity: 0.031`, lethal at 0–30m, disciplined volleys at 30–60m.
2. Configure `qkl:fk15p` (Dragoon Pistol):
   - Inaccuracy: `aim: 2.40°`, `sneak: 2.0°`, `stand: 4.5°`, `move: 5.5°`.
   - Lock time: `shoot_delay: 0.16s`.
   - Ballistics: `speed: 95`, `gravity: 0.038`.
3. Intercept `TaCZServerEvents.gunDataLoad` in `flintlock_ballistics.js` to enforce server authority.
4. Ensure `server/tacz/` and `client/tacz/` gunpacks contain matching definitions to prevent client-prediction desync.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT grant modern pinpoint hitscan accuracy or zero-recoil spreads.
- DO NOT decrease lock-time delay below 140ms.
- DO NOT rely on client-only configs for bullet damage.

## 4. Exact File Boundaries
- `[MODIFY]` `server/kubejs/server_scripts/flintlock_ballistics.js`
- `[VERIFY]` `client/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip`
- `[VERIFY]` `server/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Firing standing musket produces wide conical dispersion (4.5°).
- Kneeling (Sneak) reduces dispersion by ~70% down to 1.0°.
- Firing trigger exhibits an audible 140ms delay between hammer release and main propellant detonation.
"""
    },
    {
        "milestone": "Milestone 1: Foundation, Registration & Ballistics Tuning",
        "title": "M1.3: Throttled Carry Limits & Clear Storage Restriction UX",
        "labels": ["performance", "ux", "milestone-1"],
        "body": """## 1. Strategic Intent & Milestone Placement
Prevent players from roaming the realm as walking arsenals carrying dozens of loaded muskets. Enforce a strict limit of 1 rifle and 2 pistols, while eliminating 20 Hz inventory scan performance lag.

## 2. Expected Agent Responsibilities
1. Throttle `flintlock_carry_limits.js` scans to 1 Hz staggered ticks using player age and UUID hash: `(player.age + Math.abs(player.uuid.hashCode())) % 20 !== 0`.
2. Intercept `ItemEvents.canPickUp` to cancel excess weapon pickups before entering player inventories.
3. Drop excess firearms safely to the ground with 40-tick pickup delay (never delete or strip custom data).
4. Provide a clear, polite warning message with a 3-second cooldown:
   `§e[Arsenal] Limită de transport: maxim 1 pușcă și 2 pistoale. Armele în plus rămân pe sol.`
5. Throttle furniture coffer scans in `furniture_coffer_gun_restrictions.js` to 2 Hz.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT run unthrottled 20 Hz tick scans across all player inventories.
- DO NOT delete excess guns or erase player modifications/serials upon dropping.
- DO NOT bypass restrictions for creative/operator players during normal gameplay testing.

## 4. Exact File Boundaries
- `[MODIFY]` `server/kubejs/server_scripts/flintlock_carry_limits.js`
- `[MODIFY]` `server/kubejs/server_scripts/furniture_coffer_gun_restrictions.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Carrying 2 pistols and picking up a third causes the pickup to cancel and the item to remain on the ground.
- Server CPU overhead remains negligible (< 0.05ms per tick) with 50 connected players.
- Dropped weapons preserve all NBT components, serials, and proofing tags intact.
"""
    },

    # --- MILESTONE 2 ---
    {
        "milestone": "Milestone 2: Factorio-Style 3-Tier Munitions & Consecrated Silver Arsenal",
        "title": "M2.1: 3-Tier Gunpowder & Nitrate Refining Chains",
        "labels": ["recipes", "create", "economy", "milestone-2"],
        "body": """## 1. Strategic Intent & Milestone Placement
Create an industrial multi-tier munitions economy where handcrafting provides minimal emergency powder, kinetic Create lines supply standard volume, and thermodynamic sulfur surge lines produce massive strategic stockpiles.

## 2. Expected Agent Responsibilities
1. Implement Raw Nitrates refining:
   - Create Crushing Wheels: Dripstone block $\rightarrow$ 2x `kubejs:crushed_dripstone` (100%) + 1 bonus (50%).
   - Create Splashing (Bulk washing): Crushed Dripstone $\rightarrow$ 1x `kubejs:saltpeter` (100%) + 1 bonus (50%).
2. Implement Tier 1 (Desperation Crafting):
   - 4x Bone meal + 4x Charcoal + 1x Water Bottle $\rightarrow$ 1x `kubejs:crude_gunpowder_cake`.
   - Smoker / Campfire / Furnace drying $\rightarrow$ 1x `tacz_c:gunpowder_charge`.
3. Implement Tier 2 (Kinetic Mechanical Line):
   - Create Basin mixing: 2x Saltpeter + 2x Charcoal + 250 mB Water $\rightarrow$ 1x `kubejs:wet_powder_mass`.
   - Compacting press $\rightarrow$ 4x `tacz_c:gunpowder_charge`.
4. Implement Tier 3 (Thermodynamic Sulfur Surge):
   - Heated Basin mixing: 4x Saltpeter + 2x Charcoal + 1x `butchery:sulfur` + 500 mB Water $\rightarrow$ 16x `tacz_c:gunpowder_charge` (400% surge).
5. Exploit Remediation:
   - Explicitly remove `tacz_c:gunpowder_cake_mix` recipe to prevent bypassing Straja's mine via creeper mob-farms.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT permit vanilla gunpowder recipes that bypass nitrate refining.
- DO NOT use legacy Create recipe syntax (`item:` instead of `results: [{ id: ... }]`).
- DO NOT allow Tier 3 sulfur surge recipes to execute without an active heated Blaze Burner.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/flintlock_ammo_tiered.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Crushing dripstone yields crushed dripstone; washing with fan yields saltpeter.
- Tier 1 handcrafting produces crude cake which dries into single powder charges.
- Tier 3 heated mixing produces exactly 16 powder charges per craft.
- Creeper gunpowder cake mix recipe is absent from EMI/JEI.
"""
    },
    {
        "milestone": "Milestone 2: Factorio-Style 3-Tier Munitions & Consecrated Silver Arsenal",
        "title": "M2.2: Consecrated Silver Cartridge & Supernatural Damage Multiplier Event",
        "labels": ["combat", "balance", "vampire", "milestone-2"],
        "body": """## 1. Strategic Intent & Milestone Placement
Provide the realm with an essential weapon to defeat the Island Corruption and balance vampire players in the absence of Origins. Consecrated Silver rounds deal devastating damage against undead and vampiric entities.

## 2. Expected Agent Responsibilities
1. Register crafting routes across Tiers 1–3 for Consecrated Silver Cartridges (`SilverAmmo: true`).
2. Establish the Offhand Ammunition Priority selector:
   - On reload (`TimelessGunEvents.gunReload`), check player's offhand (`slot 40`).
   - If offhand holds Silver Cartridges, tag gun with `ChamberAmmoType: 'silver'`.
   - Transmit state to bullet entity via `persistentData.putString('AmmoType', 'silver')`.
3. Hook `TimelessGunEvents.entityHurtByGunPre` for clean, non-recursive damage scaling:
   - Undead mobs / CustomNPCs (`isUndead()`, `minecraft:undead`, `hd_unnatural`): **4.0× damage**.
   - Vampire players (`vampire`, `vampir`, `is_vampire`, `persistentData.is_vampire`): **2.0× damage**.
4. Deliver visual and audio holy strike feedback:
   - Play `minecraft:block.amethyst_block.hit` sound.
   - Send attacker confirmation: `§b⚡ [Argint Consfințit] Lovitură sfântă! ×4.0 Daune!`

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT hook vanilla `LivingDamageEvent` (fires twice per TaCZ shot due to AP/Non-AP splits and causes recursion crashes).
- DO NOT assume TaCZ automatically preserves custom ammo item components into projectile entities without the state bridge.
- DO NOT apply multipliers to ordinary lead rounds.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/flintlock_ammo_silver_combat.js`
- `[VERIFY]` `server/kubejs/server_scripts/vampire_admin.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Placing silver ammo in offhand and reloading primes silver round.
- Musket impact deals 200+ damage (4.0×) to zombies / undead mobs, killing them in a single shot.
- Musket impact deals 100+ damage (2.0×) to players tagged as vampires.
- Non-supernatural targets take normal 40–55 damage without silver bonus.
"""
    },
    {
        "milestone": "Milestone 2: Factorio-Style 3-Tier Munitions & Consecrated Silver Arsenal",
        "title": "M2.3: Specialized Tactical Ordnance (Canister Scattershot & Incendiary Sulfur Ball)",
        "labels": ["combat", "ordnance", "milestone-2"],
        "body": """## 1. Strategic Intent & Milestone Placement
Equip line infantry and cavern explorers with specialized close-range defense and illumination tools. Canister shot disperses charging mobs, while incendiary balls burn targets and light dark shafts.

## 2. Expected Agent Responsibilities
1. Implement Canister Scattershot (8 Iron Nuggets + Wad + Powder Charge):
   - Assembled in 3x3 Mechanical Crafter $\rightarrow$ 4x Canister rounds.
   - On impact: inflicts high close-range defensive knockback.
2. Implement Incendiary Sulfur Ball (Sulfur + Bullet Core + Powder Charge):
   - Assembled in 3x3 Mechanical Crafter $\rightarrow$ 4x Incendiary rounds.
   - On impact: ignites target for 8 seconds (160 ticks) with fire charge audio cue.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT allow incendiary rounds to destroy block terrain or grief player structures.
- DO NOT craft canister rounds in a standard 3x3 vanilla crafting bench (requires Create crafter).

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/flintlock_ordnance_special.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Canister shot pushes charging entities back sharply upon hit.
- Incendiary shot sets target ablaze for 8 continuous seconds.
- Recipes load cleanly in Create Mechanical Crafter grid.
"""
    },

    # --- MILESTONE 3 ---
    {
        "milestone": "Milestone 3: 5 Civilian Commodity Production Lines (15 Full Routes)",
        "title": "M3.1: Viticulture Fumigation Strips & Super-Phosphate Fertilizer",
        "labels": ["civilian", "vinery", "agriculture", "milestone-3"],
        "body": """## 1. Strategic Intent & Milestone Placement
Expand P.U.L.A SRL's commercial revenue beyond military contracts into viticulture and high-yield agriculture, creating deep economic dependencies with civilian player factions.

## 2. Expected Agent Responsibilities
1. Implement Viticulture Cask Fumigation Strips (3 tiers):
   - Tier 1: Paper + Sulfur $\rightarrow$ 1x Crude Sulfur Wick.
   - Tier 2: Create Basin mixing with water $\rightarrow$ 4x Fumigation Strips.
   - Tier 3: Sequenced Assembly with sweet berries & sulfur $\rightarrow$ 16x Royal Vintage Cask Strips.
2. Implement Miracle Super-Phosphate Fertilizer (3 tiers):
   - Tier 1: Bone meal + Dirt $\rightarrow$ Farmyard Compost.
   - Tier 2: Basin mixing with Crushed Dripstone + Bone meal $\rightarrow$ 4x Fertilizer.
   - Tier 3: Heated Basin with Saltpeter + Sulfur + Bone meal $\rightarrow$ 16x Miracle Fertilizer.
3. In-world utility: Right-clicking crops with Miracle Fertilizer advances crop maturity in a 3x3 area.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT require complex unreleased mod APIs for crop growth acceleration (use block property iteration).
- DO NOT consume fertilizer in creative mode.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/civilian_viticulture.js`
- `[NEW]` `server/kubejs/server_scripts/civilian_fertilizer.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Right-clicking crops with Miracle Fertilizer advances growth stages in a 3x3 zone.
- Royal Vintage Fumigation strips craftable via sequenced assembly.
- All recipe IDs registered under `kubejs:civilian/`.
"""
    },
    {
        "milestone": "Milestone 3: 5 Civilian Commodity Production Lines (15 Full Routes)",
        "title": "M3.2: Medicated Sulfur Soap, Friction Safety Matches, and Vitriol Leather Tanning",
        "labels": ["civilian", "hygiene", "crafting", "milestone-3"],
        "body": """## 1. Strategic Intent & Milestone Placement
Deliver the remaining three civilian chemical commodity lines for P.U.L.A SRL: medical sanitation/plague cleansing, cavern lighting, and heavy armor reinforcement.

## 2. Expected Agent Responsibilities
1. Implement Medicated Sulfur Soap (3 tiers):
   - Tier 1: Charcoal + Porkchop/Fat + Water $\rightarrow$ 1x Crude Lard Bar.
   - Tier 2: Create Basin mixing $\rightarrow$ 4x Saponified Soap.
   - Tier 3: Heated Basin with Sulfur + Saltpeter $\rightarrow$ 16x Medicated Antiseptic Sulfur Soap.
   - In-world utility: Right-clicking with soap cleanses Poison, Hunger, Weakness, Slowness, Mining Fatigue, and Nausea.
2. Implement Friction Safety Matches (3 tiers):
   - Tier 1: Sulfur + Stick $\rightarrow$ 4x Crude Sulfur Matches.
   - Tier 2: Create dipping line $\rightarrow$ 16x Sulfur Matches.
   - Tier 3: Sequenced Assembly with Paper + Redstone $\rightarrow$ 64x Swedish Safety Matchboxes.
   - In-world utility: Right-clicking unlit campfires or candles lights them cleanly.
3. Implement Vitriol Heavy Leather Tanning (3 tiers):
   - Tier 1: Flint + Rotten Flesh $\rightarrow$ Leather.
   - Tier 2: Create bulk washing with water fan $\rightarrow$ 4x Cured Leather.
   - Tier 3: Heated Vitriol Bath with Sulfur + Saltpeter $\rightarrow$ 8x Vitriol Heavy Leather.
   - Equipment crafting: Vitriol Leather crafts reinforced horse armor and saddles.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT remove positive status effects (Speed, Regeneration) when washing with soap.
- DO NOT allow matches to bypass protected spawn claim protections.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/civilian_soap.js`
- `[NEW]` `server/kubejs/server_scripts/civilian_matches.js`
- `[NEW]` `server/kubejs/server_scripts/civilian_leather.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Right-clicking Medicated Soap with Poison effect active cleanses the effect and plays drink/wash sound.
- Safety match lights unlit campfires on right-click.
- Vitriol leather crafts horse armor and saddles cleanly.
"""
    },
    {
        "milestone": "Milestone 3: 5 Civilian Commodity Production Lines (15 Full Routes)",
        "title": "M3.3: Foolproof In-Game Recipe Tooltips & JEI/EMI Information Tabs",
        "labels": ["ux", "tooltips", "milestone-3"],
        "body": """## 1. Strategic Intent & Milestone Placement
Guarantee that casual players never have to leave the game to consult out-of-game wikis to understand intermediate items, processing steps, or firearm status.

## 2. Expected Agent Responsibilities
1. Add tooltips for all expansion commodities:
   - `kubejs:saltpeter`: processing origin, kinetic washing instructions.
   - `kubejs:crushed_dripstone`: fan washing hint.
   - `kubejs:crude_gunpowder_cake`: Tier 1 emergency drying advice.
   - `kubejs:wet_powder_mass`: explosion prevention lore.
   - `kubejs:rifled_barrel`: 65% dispersion reduction benefit.
   - `kubejs:proof_stamp` & `permit_blank`: legal status explanation.
   - Civilian commodities: usage, benefits, and lore.
2. Add dynamic weapon inspection tooltips:
   - Displays Serial status (`✔ POANSONAT: #RC-15-XXXX` vs `⚠ SERIE PILITĂ` vs `✖ NEPOANSONAT`).
   - Displays chambered round status (`Glonț de Argint` vs `Glonț de Plumb`).
   - Displays tactical guidance: `[Ghid] Reîncărcare: [R] cu muniția dorită în offhand. Țintire: SHIFT (Kneel).`

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT use English-only unformatted text; use clear, color-coded Romanian tooltips matching server culture.
- DO NOT attach tooltips to non-expansion weapons.

## 4. Exact File Boundaries
- `[MODIFY]` `client/kubejs/client_scripts/flintlock_tooltips.js`
- `[MODIFY]` `server/kubejs/client_scripts/flintlock_tooltips.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Hovering over `saltpeter` shows yellow processing steps and green application benefits.
- Hovering over a musket displays exact chambered ammo and legal serial status.
"""
    },

    # --- MILESTONE 4 ---
    {
        "milestone": "Milestone 4: Continental Mine, Proofing & Foolproof Player UX",
        "title": "M4.1: Straja's Continental Mine Configuration (custom_mines)",
        "labels": ["worldgen", "custom_mines", "geology", "milestone-4"],
        "body": """## 1. Strategic Intent & Milestone Placement
Ground the realm's military economy in concrete geography by registering Straja's karst geological cavern in the server's `custom_mines` engine (`v6.22.4`), establishing the realm's sole continental sulfur and dripstone deposit.

## 2. Expected Agent Responsibilities
1. Author `mina_straja_continent.json` adhering to `custom_mines` schema:
   - Dimension: `minecraft:overworld`, Entrance: `x: 1250, y: 72, z: -850`.
   - NPC manager: `Gheorghe Minerul` (`mine_npc_mina_straja_continent`).
   - 4 balanced branches with 8-hour reset cycles:
     - North (Sulfur Caverns): 600 `butchery:sulfur_ore`, 800 `minecraft:coal_ore`.
     - East (Dripstone Stalactites): 1,200 `minecraft:dripstone_block`, 800 `minecraft:pointed_dripstone`.
     - South (Iron Seams): 800 `minecraft:iron_ore`, 600 `create:zinc_ore`.
     - West (Limestone Vaults): 600 `minecraft:dripstone_block`, 300 `butchery:sulfur_ore`, 600 `minecraft:coal_ore`.
2. Register file in `custom_mines/mines/index.json`.
3. Mirror configuration across `server/` and `client/` directories.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT invent custom schema keys outside `custom_mines` specification.
- DO NOT omit `index.json` registration.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/config/custom_mines/mines/index.json`
- `[NEW]` `server/kubejs/config/custom_mines/mines/mina_straja_continent.json`
- `[NEW]` `client/kubejs/config/custom_mines/mines/index.json`
- `[NEW]` `client/kubejs/config/custom_mines/mines/mina_straja_continent.json`

## 5. Measurable Acceptance Criteria & Test Surfaces
- JSON schema passes strict `json.load()` validation.
- Registered in `index.json` array.
- All branch block IDs correspond to valid items (`butchery:sulfur_ore`, `minecraft:dripstone_block`, etc.).
"""
    },
    {
        "milestone": "Milestone 4: Continental Mine, Proofing & Foolproof Player UX",
        "title": "M4.2: Legal Provenance, Proofing & Black Market State Machine",
        "labels": ["roleplay", "law", "proofing", "milestone-4"],
        "body": """## 1. Strategic Intent & Milestone Placement
Provide gendarmerie law enforcement roleplay mechanics and firearm serialization. Freshly forged guns are unproofed contraband; stamping them assigns a permanent serial number; grindstone scraping defaces them for the underworld.

## 2. Expected Agent Responsibilities
1. Implement Imperial Proof Stamp crafting recipe (Gold Ingot + Brass Sheet + Tempered Gun Steel + Stick).
2. Implement Anvil Proofing Event:
   - Combining unproofed gun with `proof_stamp` on Anvil consumes 5 XP levels.
   - Generates incremental unique serial: `#RC-15-XXXX` via `server.persistentData.getInt('StrajaSerialCount')`.
   - Sets `custom_data: { Proofed: true, Serial: '#RC-15-XXXX' }` and lore `§a✔ POANSONAT: #RC-15-XXXX`.
   - Preserves all existing gun attachments and custom attributes.
   - Blocks re-proofing of already proofed or defaced guns.
3. Implement Grindstone Defacing Event:
   - Placing proofed gun in grindstone strips `Serial` and `Proofed`.
   - Sets `Defaced: true` and lore `§4⚠ [SERIE PILITĂ / DEFACED]`.
   - Unproofed guns cannot be scraped on grindstone.
4. Implement Permit Binding:
   - Right-clicking `permit_blank` with proofed gun in offhand generates an official signed permit book inscribed with serial, player name, and timestamp.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT allow vanilla anvil renaming to spoof proofed status (enforce cryptographic check on `custom_data.Proofed`).
- DO NOT use static Deployer recipes that produce duplicate serial numbers.

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/flintlock_proofing_legal.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Anvil stamping unproofed gun assigns incrementing serial `#RC-15-0101`, `#RC-15-0102`, etc.
- Stamping an already proofed gun yields empty result.
- Grindstone defacing strips serial and assigns `Defaced: true` warning.
- Right-clicking permit blank generates valid written book with player name and serial.
"""
    },
    {
        "milestone": "Milestone 4: Continental Mine, Proofing & Foolproof Player UX",
        "title": "M4.3: In-Game Gunsmith Handbook (rustic_gunsmith) Expansion",
        "labels": ["documentation", "patchouli", "milestone-4"],
        "body": """## 1. Strategic Intent & Milestone Placement
Maintain the authoritative in-game Patchouli manual (`rustic_gunsmith`) with rich, beautifully formatted chapters covering consecrated silver rounds, civilian lines, legal proofing, and precision rifling.

## 2. Expected Agent Responsibilities
1. Author `ammo_silver.json`: Documents Consecrated Silver Cartridges, holy strike damage against the Island Corruption, and offhand loading rules.
2. Author `civilian_lines.json`: Documents P.U.L.A SRL's 5 civilian commodity chains (viticulture, fertilizer, soap, matches, vitriol leather).
3. Author `legal_proofing.json`: Documents Straja's firearm registry, permits, anvil proofing, and defaced black market arms.
4. Author `jaeger_rifled.json`: Documents Create lathe spiral rifling and the FK15-R Jaeger Musket.
5. Mirror all 4 entries across `server/patchouli_books/` and `client/patchouli_books/`.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT make the Gunsmith Handbook craftable in survival (it remains an official RP artifact granted via `/function kubejs:give_gunsmith_manual`).
- DO NOT introduce invalid JSON formatting or unescaped characters into Patchouli files.

## 4. Exact File Boundaries
- `[NEW]` `server/patchouli_books/rustic_gunsmith/en_us/entries/ammo_silver.json`
- `[NEW]` `server/patchouli_books/rustic_gunsmith/en_us/entries/civilian_lines.json`
- `[NEW]` `server/patchouli_books/rustic_gunsmith/en_us/entries/legal_proofing.json`
- `[NEW]` `server/patchouli_books/rustic_gunsmith/en_us/entries/jaeger_rifled.json`
- `[NEW]` `client/patchouli_books/rustic_gunsmith/en_us/entries/*.json` (mirrored)

## 5. Measurable Acceptance Criteria & Test Surfaces
- All Patchouli book JSON files parse cleanly via `json.load()`.
- Entries display in-game with correct icons, categories, and typography formatting (`$(bold)`, `$(6)`).
"""
    },
    {
        "milestone": "Milestone 4: Continental Mine, Proofing & Foolproof Player UX",
        "title": "M4.4: Foolproof Player UX & Help Guide (/flintlock)",
        "labels": ["ux", "commands", "accessibility", "milestone-4"],
        "body": """## 1. Strategic Intent & Milestone Placement
Guarantee that casual or inexperienced players have immediate, foolproof understanding of weapon handling, lock-time delay, kneeling stance, and reload mechanics without confusion or frustration.

## 2. Expected Agent Responsibilities
1. Register `/flintlock` and `/arma` commands available to all players (`permission level 0`).
   - Renders a clean ASCII guide card explaining right-click firing, 140ms flint delay, SHIFT/Kneel dispersion reduction, 20s reload safety, and offhand ammunition selection.
2. Dynamic Reload Actionbar HUD:
   - On reload start (`TimelessGunEvents.gunReload`), plays powder pouring sound and initializes countdown.
   - On player tick, displays real-time high-contrast actionbar warning:
     `§e[Muschetă] Încarci pulberea și glonțul... §f14.2s §7(Nu schimba arma, nu sprinta!)`
   - On reload finish (`TimelessGunEvents.gunFinishReload`), plays mechanical hammer snap and confirms weapon is ready to fire.

## 3. Explicit Anti-Assumptions (What the Agent MUST NOT Infer)
- DO NOT restrict `/flintlock` or `/arma` to server operators.
- DO NOT spam player chat with reload tick logs (use actionbar HUD).

## 4. Exact File Boundaries
- `[NEW]` `server/kubejs/server_scripts/flintlock_ux_helpers.js`

## 5. Measurable Acceptance Criteria & Test Surfaces
- Typing `/flintlock` or `/arma` as a normal player prints the complete formatted manual card.
- Starting reload displays dynamic actionbar countdown and plays audio cues.
- Switching weapons or sprinting during reload terminates actionbar HUD cleanly.
"""
    }
]

def main():
    print(f"Publishing {len(ISSUES)} issues to DurdeuVlad/the-brass-age-update...")
    for i, issue in enumerate(ISSUES, 1):
        cmd = [
            "gh", "issue", "create",
            "--repo", "DurdeuVlad/the-brass-age-update",
            "--title", issue["title"],
            "--body", issue["body"],
            "--milestone", issue["milestone"]
        ]
        for label in issue.get("labels", []):
            cmd.extend(["--label", label])
        
        print(f"[{i}/{len(ISSUES)}] Creating: {issue['title']}...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            # If label doesn't exist, retry without labels
            print(f"Retrying without labels: {res.stderr.strip()}")
            fallback_cmd = [
                "gh", "issue", "create",
                "--repo", "DurdeuVlad/the-brass-age-update",
                "--title", issue["title"],
                "--body", issue["body"],
                "--milestone", issue["milestone"]
            ]
            res2 = subprocess.run(fallback_cmd, capture_output=True, text=True)
            if res2.returncode != 0:
                print(f"ERROR creating issue: {res2.stderr}")
            else:
                print(f"Created: {res2.stdout.strip()}")
        else:
            print(f"Created: {res2.stdout.strip() if 'res2' in locals() else res.stdout.strip()}")
        time.sleep(1)

    print("\nAll 13 issues published successfully!")

if __name__ == "__main__":
    main()
