// Foolproof Player UX, Dynamic Reload Actionbar HUD & /flintlock Help Command
// Ensures casual players have total clarity on weapon handling, lock-time, stance, and reload mechanics.

function handleReloadStart(player, gunId) {
    if (!player || !player.isPlayer()) return
    if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

    const isPistol = gunId === 'qkl:fk15p'
    const duration = isPistol ? 440 : 400 // ~20-22 seconds (in ticks)

    const now = player.level().getGameTime()
    player.persistentData.putLong('FlintlockReloadStart', now)
    player.persistentData.putLong('FlintlockReloadEnd', now + duration)
    player.persistentData.putBoolean('FlintlockIsReloading', true)

    // Audio cue: pouring powder into pan / barrel
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:item.bottle.fill', 'players', 0.8, 0.8)
}

function handleReloadFinish(player) {
    if (!player || !player.isPlayer()) return

    player.persistentData.remove('FlintlockIsReloading')
    player.persistentData.remove('FlintlockReloadStart')
    player.persistentData.remove('FlintlockReloadEnd')

    // Audio cue: loud mechanical cocking of the flint hammer
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.iron_trapdoor.close', 'players', 1.0, 1.8)
    player.tell(Text.literal('§a✔ Armă încărcată și armată! (Gata de tragere)').bold(true))
}

// 1. Dynamic Reload Feedback & Audio-Visual HUD
if (typeof TimelessGunEvents !== 'undefined') {
    TimelessGunEvents.gunReload(event => {
        const player = event.entity
        const gun = event.gunItemStack
        if (!player || !gun || gun.isEmpty()) return
        const customData = gun.get('minecraft:custom_data')
        const gunId = String(customData?.GunId || '')
        handleReloadStart(player, gunId)
    })

    TimelessGunEvents.gunFinishReload(event => {
        const player = event.entity
        handleReloadFinish(player)
    })
} else {
    try {
        const $GunReloadEvent = Java.loadClass('com.tacz.guns.api.event.server.ServerGunReloadEvent')
        NativeEvents.onEvent($GunReloadEvent, function(event) {
            const player = event.getEntity()
            const gun = event.getGunItemStack()
            if (!player || !gun || gun.isEmpty()) return
            const customData = gun.get('minecraft:custom_data')
            const gunId = String(customData?.GunId || '')
            handleReloadStart(player, gunId)
        })
    } catch (e) {
        // Native TaCZ reload event classes not loaded or present in this environment
    }
}

// 2. Actionbar HUD Ticker during reload
PlayerEvents.tick(event => {
    const player = event.player
    if (!player.isAlive() || player.isSpectator()) return

    if (!player.persistentData.getBoolean('FlintlockIsReloading')) return

    // If player starts sprinting or switches away from gun, cancel reload HUD cleanly
    const mainHand = player.mainHandItem
    const customData = mainHand ? mainHand.get('minecraft:custom_data') : null
    const gunId = String(customData?.GunId || '')
    const isGun = gunId === 'qkl:fk15' || gunId === 'qkl:fk15p'

    if (!isGun || player.isSprinting()) {
        player.persistentData.remove('FlintlockIsReloading')
        player.persistentData.remove('FlintlockReloadStart')
        player.persistentData.remove('FlintlockReloadEnd')
        player.displayClientMessage(Text.literal('§c✖ Reîncărcare anulată (sprint sau armă schimbată)!'), true)
        return
    }

    const now = player.level().getGameTime()
    const end = player.persistentData.getLong('FlintlockReloadEnd')
    if (now >= end) {
        handleReloadFinish(player)
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
                    const src = ctx.source
                    src.sendSystemMessage(Text.literal('§6§l╔════════════════════════════════════════════════════════╗'))
                    src.sendSystemMessage(Text.literal('§6§l║         MANUALUL SOLDATULUI: ARME CU CREMENE           ║'))
                    src.sendSystemMessage(Text.literal('§6§l╚════════════════════════════════════════════════════════╝'))
                    src.sendSystemMessage(Text.literal('§e▶ Tragere: §fClick-Dreapta §7(Așteaptă 140ms aprinderea pulberii din tigaie!)'))
                    src.sendSystemMessage(Text.literal('§e▶ Țintire: §fApasă SHIFT / Kneel §7(Stabilitate maximă, reduce dispersia cu 70%)'))
                    src.sendSystemMessage(Text.literal('§e▶ Reîncărcare: §fTasta [R] §7(~20s. Păstrează poziția! Sprintul anulează reîncărcarea)'))
                    src.sendSystemMessage(Text.literal('§e▶ Alegere Muniție: §bPlasează muniția în MÂNA SECUNDARĂ (Offhand)!'))
                    src.sendSystemMessage(Text.literal('   §b• Glonț de Argint:     §f×4.0 Daune vs Nemorți, ×2.0 vs Vampiri'))
                    src.sendSystemMessage(Text.literal('   §7• Glonț de Plumb:      §f40–55 Daune grele de penetrare'))
                    src.sendSystemMessage(Text.literal('   §6• Mitralii (Canister): §fÎmprăștiere largă pentru luptă la distanță mică'))
                    src.sendSystemMessage(Text.literal('   §c• Glonț Incendiar:     §fAprinde ținta pentru 8 secunde'))
                    src.sendSystemMessage(Text.literal('§e▶ Limită Transport: §fMaxim 1 pușcă și 2 pistoale (excesul cade pe sol)'))
                    src.sendSystemMessage(Text.literal('§e▶ Legea Armelor: §fArmele nepoansonate (§cNEPOANSONAT§f) sunt ilegale!'))
                    src.sendSystemMessage(Text.literal('   §aAplică pe nicovală cu Sigiliul Imperial pentru serie legală (#RC-15-XXXX).'))
                    src.sendSystemMessage(Text.literal('§6══════════════════════════════════════════════════════════'))
                    return 1
                })
        )
    }

    registerFlintlockHelp('flintlock')
    registerFlintlockHelp('arma')
})
