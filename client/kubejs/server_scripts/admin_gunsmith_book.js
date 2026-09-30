// Admin-only command system for Rustic Craft II.
// Gives operators / administrators the official Imperial Gunsmith Handbook (The Rustic Gunsmith).
// Requires operator permission level 2.
// Commands:
//   /gunsmith                 - Gives the handbook to the admin executing the command
//   /gunsmith <player>        - Gives the handbook to a designated player
//   /gunsmith book [player]   - Explicit book subcommand
//   /gunsmith_manual [player] - Direct shortcut
//   /manual_armurier [player] - Romanian language shortcut

const $Admin_EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')

ServerEvents.commandRegistry(event => {
    const Commands = event.commands

    function giveGunsmithBook(source, targetPlayer) {
        if (!targetPlayer) return 0
        const server = source.server
        const playerName = targetPlayer.name.string

        // Give the Patchouli book with the exact book ID
        server.runCommandSilent(`give ${playerName} patchouli:guide_book[patchouli:book="patchouli:rustic_gunsmith"] 1`)

        // Play feedback sounds to target
        targetPlayer.playSound('minecraft:item.book.page_turn', 1.0, 1.0)
        targetPlayer.playSound('minecraft:ui.toast.challenge_complete', 0.8, 1.2)

        source.sendSystemMessage(Text.literal('§6§l[Garnizoana Straja] §aManualul Oficial al Armurierului Imperial a fost înmânat lui §e' + playerName + '§a!'))
        source.sendSystemMessage(Text.literal('§7Acest manual secret conține toate rețetele industriale Create pentru armamentul de foc.'))

        let sourcePlayer = null
        try { sourcePlayer = source.player || source.getPlayer() } catch (e) {}
        if (sourcePlayer && sourcePlayer !== targetPlayer) {
            targetPlayer.sendSystemMessage(Text.literal('§6§l[Comisariatul Straja] §aAi primit Manualul Oficial al Armurierului Imperial de la un administrator!'))
        }
        return 1
    }

    function registerBookCommand(name) {
        event.register(
            Commands.literal(name)
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    let player = null
                    try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                    if (!player) {
                        ctx.source.sendFailure(Text.literal('§cSpecifică un jucător: /' + name + ' <jucător>'))
                        return 0
                    }
                    return giveGunsmithBook(ctx.source, player)
                })
                .then(Commands.argument('player', $Admin_EntityArgument.player())
                    .executes(ctx => {
                        const target = $Admin_EntityArgument.getPlayer(ctx, 'player')
                        return giveGunsmithBook(ctx.source, target)
                    })
                )
                .then(Commands.literal('book')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) {
                            ctx.source.sendFailure(Text.literal('§cSpecifică un jucător: /' + name + ' book <jucător>'))
                            return 0
                        }
                        return giveGunsmithBook(ctx.source, player)
                    })
                    .then(Commands.argument('player', $Admin_EntityArgument.player())
                        .executes(ctx => {
                            const target = $Admin_EntityArgument.getPlayer(ctx, 'player')
                            return giveGunsmithBook(ctx.source, target)
                        })
                    )
                )
        )
    }

    registerBookCommand('gunsmith')
    registerBookCommand('gunsmith_manual')
    registerBookCommand('manual_armurier')
})
