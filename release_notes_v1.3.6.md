## The Brass Age — Version 1.3.6 Release

### ⚜️ Ballistics Recalibration, Visible Holstered Weapons & Straja Penitentiary Reconciliation

This release resolves the reticle-to-bullet trajectory mismatch, buffs close/medium-range flintlock accuracy to guarantee reliable chest hits at 10–25 blocks without sniper powercreep, enables visible back-holstered firearms, and fully reconciles the new Straja Penitentiary system:

#### 🎯 1. Ballistics Realignment & Reticle Synchronization
- **Elimination of Recoil-Elevation Camera Desync (`delayshoot_gun_logic.lua`)**: Trigger pull now executes bullet firing instantaneously at `t=0` along the exact aimed sights vector before recoil kicks camera pitch upward, eliminating bullet drop/rise displacement.
- **FK15 Smoothbore Volley Musket**: Aimed inaccuracy calibrated from `1.85°` to `0.45°` (guaranteed reliable chest hit at 10–25m). Bullet speed increased to 150 m/s with reduced gravity drop for a flatter trajectory within 30 blocks.
- **FK15P Dragoon Pistol**: Aimed inaccuracy calibrated from `2.40°` to `0.70°` for reliable close-range defense.

#### ⚔️ 2. Visible Weapons on Player Back & Hip
- Integrated `weaponmaster_ydm-common.toml` with `modern_kinetic_gun,tacz:modern_kinetic_gun` whitelisted.
- Hotbar weapons (slots 1, 2, 7, 8) automatically render strapped across the player's back and hips when holstered.

#### ⚖️ 3. Straja Penitentiary Subsystem Reconciliation
- **`straja_prison.js`**: Core custody engine upgraded with scoreboard team swap (`Prizonieri`), non-fugitive grounds checking, mine box exemption, deep container & backpack/bundle seizure (`$SP_BackpackHelper`), and debt/sentence commands (`/strajaprison sentence`, `/strajaprison paydebt`).
- **`straja_prison_gates.js`**: Dual-door airlock gate control with automatic door timers, player denial bounds, and prison grounds perimeter tracking (`/prisongate`).
- **`straja_prison_market.js`**: Prisoner economy & `/sellall` market integration, allowing inmates to exchange mined ore for state credit and pay down penal debts (`/prisonmarket`).
- **`straja_prison_mine.js`**: Auto-adoption of `mina_straja_continent`, labor shift tracking, stage management (shafts 1-2, zones 1-4, warehouse), and automated ore regeneration cycles (`/prisonmine`).
- **`straja_prison_setup.js`**: 15-step interactive admin deployment wizard verifying full penitentiary readiness (`/prisonsetup`).

#### 🧪 4. Full Empirical Verification
- Verified live on NeoForge 21.1.248 server with 352 mods and 70/70 KubeJS server scripts loaded with 0 errors.
- All 55 empirical regression tests passed with 100% success (`/straja test`).
