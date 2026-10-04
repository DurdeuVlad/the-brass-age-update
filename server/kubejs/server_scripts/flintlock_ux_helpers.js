// Foolproof Player UX, Dynamic Reload Actionbar HUD & /flintlock Help Command
// Ensures casual players have total clarity on weapon handling, lock-time, stance, and reload mechanics.

function handleReloadStart(player, gunId) {
    if (!player || !player.isPlayer()) return
    if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

    var isPistol = gunId === 'qkl:fk15p'
    var duration = isPistol ? 440 : 400 // ~20-22 seconds (in ticks)

    var lvl = (typeof player.getLevel === 'function') ? player.getLevel() : player.level
    var now = (lvl && typeof lvl.getGameTime === 'function') ? lvl.getGameTime() : 0
    player.persistentData.putLong('FlintlockReloadStart', now)
    player.persistentData.putLong('FlintlockReloadEnd', now + duration)
    player.persistentData.putBoolean('FlintlockIsReloading', true)

    // Audio cue: pouring powder into pan / barrel
    var server = player.getServer ? player.getServer() : player.server
    if (server) {
        var x = player.x.toFixed(1)
        var y = player.y.toFixed(1)
        var z = player.z.toFixed(1)
        server.runCommandSilent('playsound minecraft:item.bottle.fill player @a ' + x + ' ' + y + ' ' + z + ' 0.8 0.8')
    }
}

function handleReloadFinish(player) {
    if (!player || !player.isPlayer()) return

    player.persistentData.remove('FlintlockIsReloading')
    player.persistentData.remove('FlintlockReloadStart')
    player.persistentData.remove('FlintlockReloadEnd')

    // Audio cue: loud mechanical cocking of the flint hammer
    var server = player.getServer ? player.getServer() : player.server
    if (server) {
        var x = player.x.toFixed(1)
        var y = player.y.toFixed(1)
        var z = player.z.toFixed(1)
        server.runCommandSilent('playsound minecraft:block.iron_trapdoor.close player @a ' + x + ' ' + y + ' ' + z + ' 1.0 1.8')
    }
    player.tell(Text.literal('§a✔ Armă încărcată și armată! (Gata de tragere)').bold(true))
}

// 1. Dynamic Reload Feedback & Audio-Visual HUD
if (typeof TimelessGunEvents !== 'undefined') {
    TimelessGunEvents.gunReload(event => {
        var player = event.entity
        var gun = event.gunItemStack
        if (!player || !gun || gun.isEmpty()) return
        var customData = gun.get('minecraft:custom_data')
        var gunId = String(customData?.GunId || '')
        handleReloadStart(player, gunId)
    })

    TimelessGunEvents.gunFinishReload(event => {
        var player = event.entity
        handleReloadFinish(player)
    })
} else {
    try {
        var $GunReloadEvent = Java.loadClass('com.tacz.guns.api.event.server.ServerGunReloadEvent')
        NativeEvents.onEvent($GunReloadEvent, function(event) {
            var player = event.getEntity()
            var gun = event.getGunItemStack()
            if (!player || !gun || gun.isEmpty()) return
            var customData = gun.get('minecraft:custom_data')
            var gunId = String(customData?.GunId || '')
            handleReloadStart(player, gunId)
        })
    } catch (e) {
        // Native TaCZ reload event classes not loaded or present in this environment
    }
}

// 2. Actionbar HUD Ticker during reload
ServerEvents.tick(event => {
    var server = event.server
    server.players.forEach(player => {
        if (!player || !player.isAlive() || player.isSpectator()) return
        if (!player.persistentData.getBoolean('FlintlockIsReloading')) return

        // If player starts sprinting or switches away from gun, cancel reload HUD cleanly
        var mainHand = player.mainHandItem
        var customData = mainHand ? mainHand.get('minecraft:custom_data') : null
        var gunId = String(customData?.GunId || '')
        var isGun = gunId === 'qkl:fk15' || gunId === 'qkl:fk15p'

        if (!isGun || player.isSprinting()) {
            player.persistentData.remove('FlintlockIsReloading')
            player.persistentData.remove('FlintlockReloadStart')
            player.persistentData.remove('FlintlockReloadEnd')
            player.displayClientMessage(Text.literal('§c✖ Reîncărcare anulată (sprint sau armă schimbată)!'), true)
            return
        }

        var lvl = (typeof player.getLevel === 'function') ? player.getLevel() : player.level
        var now = (lvl && typeof lvl.getGameTime === 'function') ? lvl.getGameTime() : 0
        var end = player.persistentData.getLong('FlintlockReloadEnd')
        if (now >= end) {
            handleReloadFinish(player)
            return
        }

        var remainingSec = ((end - now) / 20).toFixed(1)
        // Display high-contrast warning in actionbar so player knows not to switch weapon
        player.displayClientMessage(
            Text.literal('§e[Muschetă] Încarci pulberea și glonțul... §f' + remainingSec + 's §7(Nu schimba arma, nu sprinta!)'),
            true // Actionbar = true
        )
    })
})

// 3. /flintlock and /arma In-Game Guide Command
ServerEvents.commandRegistry(event => {
    var Commands = event.commands

    function registerFlintlockHelp(commandName) {
        event.register(
            Commands.literal(commandName)
                .requires(src => src.hasPermission(0)) // Available to all players
                .executes(ctx => {
                    var src = ctx.source
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
