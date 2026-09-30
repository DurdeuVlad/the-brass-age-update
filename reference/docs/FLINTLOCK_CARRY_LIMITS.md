# Flintlock carry limits

Each player may carry two `qkl:fk15p` pistols and one `qkl:fk15` rifle.
The server checks inventory, hotbar, offhand, the menu cursor and the personal
crafting grid every player tick. Selected-hand and offhand weapons have priority.
Operators and creative players have the same limits. Spectators are skipped.

Pickups above the limit are blocked. Extras received through crafting, commands
or container transfers are dropped beside the player on the next check, keeping
their custom data, ammo and attachments. These are ordinary dropped items and
can be lost to despawning or environmental damage. Other gun models do not count
towards these two flintlock quotas.

## Storage restrictions

The pack's Coffer is actually `furniture:coffer` (Let's Do Furniture), not
Supplementaries. Deploy `kubejs/server_scripts/furniture_coffer_gun_restrictions.js`
for this item. Furniture has no native blacklist: this script ejects direct gun
contents from an open coffer or a carried coffer on the next player tick, including
guns already stored there. Gun components are preserved. It checks the inventory,
offhand, cursor and personal crafting grid. A placed, unattended coffer can still
receive guns through automation; they are ejected when opened or carried. Nested
containers and coffers inside other mods' inventories are not recursively scanned.

All `tacz:modern_kinetic_gun` variants are banned from Backpacked inventories.
Tool Belt also rejects all these variants through its server config blacklist.
Supplementaries' `shulker_blacklist` bans them from coffers, sacks and shulker
boxes. This uses the mods' insertion checks, including coffer menu slots and
Supplementaries' shulker insertion helper. Ammo and attachments remain allowed.
Ordinary placed chests remain available for gun storage.

These rules prevent new direct insertions. They do not erase or migrate existing
stored guns, inspect arbitrary nested containers, or restrict other mods' portable
storage. Before rollout, remove existing guns from backpacks/coffers/sacks/shulker
boxes, including guns packed inside another container. Commands that explicitly
write container contents can bypass insertion rules.

## Deploy

Copy these files to the server, preserving paths:

- `kubejs/server_scripts/flintlock_carry_limits.js`
- `kubejs/server_scripts/gun_storage_restrictions.js`
- `kubejs/server_scripts/furniture_coffer_gun_restrictions.js`
- `kubejs/data/supplementaries/tags/item/shulker_blacklist.json`
- `config/backpacked.backpack.toml`
- `config/toolbelt-server.toml`
- `defaultconfigs/toolbelt-server.toml` (defaults for new worlds)

If your server has a world-specific `serverconfig/toolbelt-server.toml`, add
`"tacz:modern_kinetic_gun"` to its `blacklist` too; a default config does not
overwrite an existing world's settings. Do not add guns to its whitelist,
which takes precedence. This local instance had no world-specific Tool Belt config.

The storage script explicitly adds the Supplementaries tag during tag events.
After server startup/reload, check `logs/kubejs/server.log` for
`[Gun storage] Verified TaCZ gun blacklist tag is active.` If coffers still
accept guns, report whether the coffer is placed or carried and its exact item ID.

Restart the server to load the backpack config and scripts together. The carry
script and item tag are server-managed. Include the matching backpack config in
the client modpack as well so client-side slot checks agree with the server.
No new mod or startup script is required.

## In-game acceptance checks

1. Carry two pistols and one rifle, including one pistol in the offhand: all stay.
2. Try picking up a third pistol or second rifle: pickup is blocked.
3. Shift-click extras from a chest and craft an extra gun: extras drop with a
   limit message. Check loaded ammo and attachments survive.
4. Try holding an extra gun on the cursor or in the personal crafting grid.
5. Try inserting guns into a backpack and both placed and carried coffers.
   Test ordinary clicks, shift-clicks and backpack collection augments if enabled.
6. Check sacks/shulker boxes reject guns and that ammo is still accepted.
   Check Tool Belt insertion and belt swaps also reject every gun variant.
7. Reconnect and confirm the same limits apply to existing inventory guns.

JavaScript simulations covered quotas, offhand priority, cursor/crafting slots,
stack counts, repeated checks, rejected pickups, metadata preservation and failed
drop safety. Actual Minecraft integration still needs the checks above.
