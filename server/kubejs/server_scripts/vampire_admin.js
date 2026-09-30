// Temporary Vampire administration command system for Rustic Craft II.
// Replaces Origins with persistent scoreboard tags and NBT flags.
// Commands:
//   /vampire add <player>    - Marks a player as a Vampire (receives 2x silver damage)
//   /vampire remove <player> - Removes Vampire status from a player
//   /vampire check <player>  - Checks if a player is a Vampire
//   /vampire list            - Lists all online Vampires
// Alias: /vampir

const $Vamp_EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')

function isVampire(player) {
    if (!player) return false
    return player.tags.contains('vampire') ||
           player.tags.contains('vampir') ||
           player.tags.contains('is_vampire') ||
           player.tags.contains('hd_unnatural') ||
           Boolean(player.persistentData.getBoolean('is_vampire'))
}

function setVampire(player, enable) {
    if (!player) return
    if (enable) {
        player.tags.add('vampire')
        player.tags.add('vampir')
        player.tags.add('is_vampire')
        player.tags.add('hd_unnatural')
        player.persistentData.putBoolean('is_vampire', true)
    } else {
        player.tags.remove('vampire')
        player.tags.remove('vampir')
        player.tags.remove('is_vampire')
        player.tags.remove('hd_unnatural')
        player.persistentData.putBoolean('is_vampire', false)
    }
}

// Preserve tags on respawn
PlayerEvents.respawned(event => {
    const player = event.player
    if (player && player.persistentData.getBoolean('is_vampire')) {
        setVampire(player, true)
    }
})

ServerEvents.commandRegistry(event => {
    const Commands = event.commands

    function registerVampireCommand(alias) {
        event.register(
            Commands.literal(alias)
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    ctx.source.sendSystemMessage(Text.literal('§6§l=== Sistem Marcare Vampiri (Rustic Craft II) ==='))
                    ctx.source.sendSystemMessage(Text.literal('§e/' + alias + ' add <player>    §7- Marchează jucătorul ca Vampir (2× silver dmg)'))
                    ctx.source.sendSystemMessage(Text.literal('§e/' + alias + ' remove <player> §7- Scoate statutul de Vampir'))
                    ctx.source.sendSystemMessage(Text.literal('§e/' + alias + ' check <player>  §7- Verifică starea unui jucător'))
                    ctx.source.sendSystemMessage(Text.literal('§e/' + alias + ' list            §7- Arată toți vampirii conectați'))
                    return 1
                })
                .then(Commands.literal('add')
                    .then(Commands.argument('player', $Vamp_EntityArgument.player())
                        .executes(ctx => {
                            const target = $Vamp_EntityArgument.getPlayer(ctx, 'player')
                            if (!target) return 0
                            setVampire(target, true)
                            ctx.source.sendSystemMessage(Text.literal('§a✔ [Vampir] §f' + target.name.string + ' §aa fost marcat ca §4Vampir§a! (Vulnerabil la argint: ×2 damage).'))
                            target.sendSystemMessage(Text.literal('§4⚡ [Blestem] Sângele rece îți curge prin vene. Ai fost marcat ca Vampir.'))
                            return 1
                        })
                    )
                )
                .then(Commands.literal('remove')
                    .then(Commands.argument('player', $Vamp_EntityArgument.player())
                        .executes(ctx => {
                            const target = $Vamp_EntityArgument.getPlayer(ctx, 'player')
                            if (!target) return 0
                            setVampire(target, false)
                            ctx.source.sendSystemMessage(Text.literal('§e[Vampir] §f' + target.name.string + ' §enu mai este marcat ca Vampir.'))
                            target.sendSystemMessage(Text.literal('§a✨ [Purificare] Blestemul vampirismului a fost ridicat de pe tine.'))
                            return 1
                        })
                    )
                )
                .then(Commands.literal('check')
                    .then(Commands.argument('player', $Vamp_EntityArgument.player())
                        .executes(ctx => {
                            const target = $Vamp_EntityArgument.getPlayer(ctx, 'player')
                            if (!target) return 0
                            if (isVampire(target)) {
                                ctx.source.sendSystemMessage(Text.literal('§4[Vampir] §f' + target.name.string + ' §ceste VAMPIR! §8(Slab la argint: ×2 damage, tag hd_unnatural activ)'))
                            } else {
                                ctx.source.sendSystemMessage(Text.literal('§a[Vampir] §f' + target.name.string + ' §7este muritor / firesc (Damage normal).'))
                            }
                            return 1
                        })
                    )
                )
                .then(Commands.literal('list')
                    .executes(ctx => {
                        const server = ctx.source.server
                        const vamps = []
                        server.players.forEach(p => {
                            if (isVampire(p)) vamps.push(p.name.string)
                        })
                        if (vamps.length === 0) {
                            ctx.source.sendSystemMessage(Text.literal('§7[Vampir] Nu există niciun vampir online în acest moment.'))
                        } else {
                            ctx.source.sendSystemMessage(Text.literal('§4[Vampiri Online (' + vamps.length + ')]: §c' + vamps.join('§7, §c')))
                        }
                        return 1
                    })
                )
        )
    }

    registerVampireCommand('vampire')
    registerVampireCommand('vampir')
})
