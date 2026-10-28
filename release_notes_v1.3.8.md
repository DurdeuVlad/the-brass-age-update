## The Brass Age — Version 1.3.8 Release

### ⚜️ Modern Gun Disabling, Gunpack Index Fixes & WeaponMaster Error Texture Patch

This bugfix release eliminates unintended modern firearms and workbenches to enforce the authentic Renaissance / Early Modern setting, fixes server startup gunpack index parsing errors, and resolves the multiplayer missing texture bug on holstered weapons:

#### 🚫 1. Modern Firearms & Workbenches Crafting Disabling
- **119 Modern & Unintended Guns Removed**: All crafting recipes for base TaCZ modern firearms (AK-47, M4A1, AWP, Glock 17, Deagle, RPG-7, etc.), ChocolateMan WWI/unintended guns (1860, CBR-11, AT-50, MG15, etc.), and Gunpowder Revolution guns (Auto-5, M1 Garand, Mosin 91, MP18, Win 1873, etc.) are permanently removed.
- **32 Modern Ammunition Types Removed**: Crafting recipes for modern cartridges (9mm, 5.56x45, .50 BMG, 12g, RPG rockets, etc.) are removed.
- **5 Unintended Workbenches Removed & Disabled**: Gun Smith Table (`tacz:gun_smith_table`), Ammo Workbench (`tacz:ammo_workbench`), Attachment Workbench (`tacz:attachment_workbench`), ChocolateMan Workbench (`qkl:cr_workbench`), and Old Workbench (`hamster:oldworkbench`) are disabled, and all Gun Smith Table crafting recipes (`tacz:gun_smith_table_crafting`) are shut down.
- **Recipe Viewer Cleanliness**: All prohibited guns, ammunition, and workbenches are hidden from JEI and EMI recipe viewers.
- **Authentic Flintlocks Preserved**: The Create Mechanical Crafter sequences for the FK15 Volley Musket, FK15-P Dragoon Pistol, FK15-R Jaeger Musket, 16.5mm Paper Cartridges, and gunsmithing components remain 100% accessible and verified.

#### 🛠️ 2. TaCZ Gunpack Missing Data & Index Parsing Errors Fixed
- **Gunpowder Revolution Cleaned**: Removed 6 dangling gun/recipe index entries (`colt1873_lb`, `coltm1851_chain`, `lebel1886_07c`, `lugerp08_artillerie`, `m1887_hc`, `uppercut`) from `GunpowderRevolution_gunpack v1.2.7 (1)+1.21.1.zip` that lacked definition files and caused severe server startup errors in `server.log`.
- **ChocolateMan Cleaned**: Removed dangling `mu73_bayonet` attachment index entry from `ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip`.
- Server boot logs are now completely clean of TaCZ missing index warnings.

#### 👥 3. WeaponMaster Multiplayer Missing / Error Texture Patch
- **Root Cause Resolved**: WeaponMaster's multiplayer sync packet (`ItemStackCPacket`) drops all Minecraft 1.21.1 Data Components, transmitting only raw numeric item IDs. Remote players received bare `tacz:modern_kinetic_gun` stacks without `GunId`, which caused TaCZ to fall back to `MissingTextureAtlasSprite` (purple-and-black checkerboard error cube) rendered on the player's back/hips.
- **Surgical Blacklist**: Added `modern_kinetic_gun` and `tacz:modern_kinetic_gun` to `blacklist` in `weaponmaster_ydm-common.toml`. WeaponMaster now ignores firearms entirely, preventing error textures on multiplayer characters while preserving visible swords, shields, polearms, and bows on player backs.

#### 🧪 4. Automated Testing & Verification
- **Straja Test Suite 9**: Added 4 automated assertion tests in `admin_straja_registry.js` verifying 0 prohibited gun recipes, 0 modern ammo recipes, 0 gunsmith tables, and 100% presence of authentic Brass Age recipes in the active `RecipeManager`.
- **CI Validation**: Passed 100% clean across all 93 KubeJS scripts, Patchouli guidebooks, and texture assets.
