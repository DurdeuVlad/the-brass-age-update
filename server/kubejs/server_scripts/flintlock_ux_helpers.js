// Foolproof Player UX, Dynamic Reload Actionbar HUD & /flintlock Help Command
// Ensures casual players have total clarity on weapon handling, lock-time, stance, and reload mechanics.

// 1. Dynamic Reload Feedback & Audio-Visual HUD
TimelessGunEvents.gunReload(event => {
    const player = event.entity
    if (!player || !player.isPlayer()) return
    const gun = event.gunItemStack
    if (gun.isEmpty()) return

    const customData = gun.get('minecraft:custom_data')
    const gunId = String(customData?.GunId || '')
    if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

    const isPistol = gunId === 'qkl:fk15p'
    const duration = isPistol ? 440 : 400 // ~20-22 seconds (in ticks)

    const now = player.level().getGameTime()
    player.persistentData.putLong('FlintlockReloadStart', now)
    player.persistentData.putLong('FlintlockReloadEnd', now + duration)
    player.persistentData.putBoolean('FlintlockIsReloading', true)

    // Audio cue: pouring powder into pan / barrel
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:item.bottle.fill', 'players', 0.8, 0.8)
})

TimelessGunEvents.gunFinishReload(event => {
    const player = event.entity
    if (!player || !player.isPlayer()) return

    player.persistentData.remove('FlintlockIsReloading')
    player.persistentData.remove('FlintlockReloadStart')
    player.persistentData.remove('FlintlockReloadEnd')

    // Audio cue: loud mechanical cocking of the flint hammer
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.iron_trapdoor.close', 'players', 1.0, 1.8)
    player.tell(Text.literal('§a✔ Armă încărcată și armată! (Gata de tragere)').bold(true))
})

// 2. Actionbar HUD Ticker during reload
PlayerEvents.tick(event => {
    const player = event.player
    if (!player.isAlive() || player.isSpectator()) return

    if (!player.persistentData.getBoolean('FlintlockIsReloading')) return

    const now = player.level().getGameTime()
    const end = player.persistentData.getLong('FlintlockReloadEnd')
    if (now >= end) {
        player.persistentData.remove('FlintlockIsReloading')
        return
    }

    const remainingSec = ((end - now) / 20).toFixed(1)
    // Display high-contrast warning in actionbar so player knows not to switch weapon
    player.displayClientMessage(
        Text.literal('§e[Muschetă] Încarci pulberea și glonțul... §f' + remainingSec + 's §7(Nu schimba arma, nu sprinta!)'),
        true // Actionbar = true
    )
})

// 3. /flintlock and /arma In-Game Guide Command
ServerEvents.commandRegistry(event => {
    const Commands = event.commands

    function registerFlintlockHelp(commandName) {
        event.register(
            Commands.literal(commandName)
                .requires(src => src.hasPermission(0)) // Available to all players
                .executes(ctx => {
                    const p = ctx.source.player
                    if (!p) return 0

                    p.tell('§6§l╔════════════════════════════════════════════════════════╗')
                    p.tell('§6§l║         MANUALUL SOLDATULUI: ARME CU CREMENE           ║')
                    p.tell('§6§l╚════════════════════════════════════════════════════════╝')
                    p.tell('§e▶ Tragere: §fClick-Dreapta §7(Așteaptă 140ms aprinderea pulberii din tigaie!)')
                    p.tell('§e▶ Țintire: §fApasă SHIFT / Kneel §7(Stabilitate maximă, reduce dispersia cu 70%)')
                    p.tell('§e▶ Reîncărcare: §fTasta [R] §7(~20s. Păstrează poziția! Sprintul anulează reîncărcarea)')
                    p.tell('§e▶ Alegere Muniție: §bPlasează muniția în MÂNA SECUNDARĂ (Offhand)!')
                    p.tell('   §b• Glonț de Argint:  §f×4.0 Daune vs Nemorți, ×2.0 vs Vampiri')
                    p.tell('   §7• Glonț de Plumb:   §f40–55 Daune grele de penetrare')
                    p.tell('   §6• Mitralii (Canister): §fÎmprăștiere largă pentru luptă la distanță mică')
                    p.tell('   §c• Glonț Incendiar: §fAprinde ținta pentru 8 secunde')
                    p.tell('§e▶ Limită Transport: §fMaxim 1 pușcă și 2 pistoale (excesul cade pe sol)')
                    p.tell('§e▶ Legea Armelor: §fArmele nepoansonate (§cNEPOANSONAT§f) sunt ilegale!')
                    p.tell('   §aAplică pe nicovală cu Sigiliul Imperial pentru serie legală (#RC-15-XXXX).')
                    p.tell('§6══════════════════════════════════════════════════════════')
                    return 1
                })
        )
    }

    registerFlintlockHelp('flintlock')
    registerFlintlockHelp('arma')
})
