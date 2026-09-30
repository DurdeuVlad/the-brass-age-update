TaCZ/flintlock overlay - Minecraft 1.21.1 NeoForge

Merge contents of server/ into server root; client/ into client instance root.
Back up first. Fully restart both. Replace older versions of matching mod JARs.
Includes all 5 installed TaCZ-named mods, both gun-pack ZIPs and tacz_default_gun.
Other dependencies are NOT bundled. This requires the existing matching modpack:
KubeJS/Rhino/Architectury, Create/KubeJS Create, Patchouli, Supplementaries/Moonlight,
Furniture and its dependencies, Backpacked, Tool Belt, and Create Aeronautics for
TaCZ Aero Compat. This is not a standalone playable modpack.

Current source files are preserved, including these missing settings:
1. server_scripts/main.js is missing: its old general TaCZ recipe removals and
   gun/attachment viewer hiding are not included/restored.
2. Backpacked config no longer bans guns. Add "tacz:modern_kinetic_gun" to
   inventory.bannedItems if you want the backpack gun ban enabled.
3. Weapon Master's old floating-gun workaround is absent; its config is omitted.
4. Tool Belt blacklist is present. Merge it into any destination world-specific
   serverconfig/toolbelt-server.toml too; defaultconfigs only seeds new configs.
5. Furniture coffers eject guns when opened or carried, not during unattended
   insertion. Existing backpack/belt contents are not automatically migrated.

Book command (run as a player): /function kubejs:give_gunsmith_manual
reference/docs contains optional manuals, including the PDF.
MANIFEST.csv contains SHA-256 checksums for all bundled files.
Archive verified; in-game/server integration still needs testing.