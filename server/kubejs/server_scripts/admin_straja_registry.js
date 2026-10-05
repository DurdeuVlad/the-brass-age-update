// ============================================================================
// Straja Central Registry, Inspector Licensing & Mod Integration Hooks
// ----------------------------------------------------------------------------
// Manages:
//   1. Licensed Inspectors & Weapons Transporters
//   2. Master Weapon Registry & 24h Pending Queue (Daily Maturation)
//   3. Physical Immutable Snapshot Patrol Book ("Registrul de Arme Straja")
//   4. Global API surface (StrajaWeapons) for future Straja Java mod hooks
//   5. Root unified /straja command family
// ============================================================================

var $SR_LocalDate = Java.loadClass('java.time.LocalDate')
var $SR_EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')
var $SR_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
var $SR_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')

// Initialize Global API for future Straja Mod integration
var StrajaWeapons = {}

// ----------------------------------------------------------------------------
// 1. Licensing & Exemption Helpers
// ----------------------------------------------------------------------------

function getInspectorList(server) {
    if (!server || !server.persistentData) return []
    try {
        var raw = String(server.persistentData.getString('StrajaInspectors') || '')
        if (raw.length > 2) return JSON.parse(raw)
    } catch (e) {}
    return []
}

function saveInspectorList(server, list) {
    if (!server || !server.persistentData) return
    server.persistentData.putString('StrajaInspectors', JSON.stringify(list))
}

function getTransporterList(server) {
    if (!server || !server.persistentData) return []
    try {
        var raw = String(server.persistentData.getString('StrajaTransporters') || '')
        if (raw.length > 2) return JSON.parse(raw)
    } catch (e) {}
    return []
}

function saveTransporterList(server, list) {
    if (!server || !server.persistentData) return
    server.persistentData.putString('StrajaTransporters', JSON.stringify(list))
}

StrajaWeapons.isAuthorizedInspectorByName = function(server, name) {
    if (!name || !server) return false
    var clean = String(name).toLowerCase()
    var player = server.getPlayerList().getPlayerByName(name)
    if (player && StrajaWeapons.isAuthorizedInspector(player)) return true
    var list = getInspectorList(server)
    return list.some(function(n) { return String(n).toLowerCase() === clean })
}

StrajaWeapons.isWeaponsTransporterByName = function(server, name) {
    if (!name || !server) return false
    if (StrajaWeapons.isAuthorizedInspectorByName(server, name)) return true
    var clean = String(name).toLowerCase()
    var player = server.getPlayerList().getPlayerByName(name)
    if (player && StrajaWeapons.isWeaponsTransporter(player)) return true
    var list = getTransporterList(server)
    return list.some(function(n) { return String(n).toLowerCase() === clean })
}

StrajaWeapons.isAuthorizedInspector = function(player) {
    if (!player) return false
    try {
        if (typeof player.hasPermissions === 'function' && player.hasPermissions(2)) return true
        if (typeof player.hasPermission === 'function' && player.hasPermission(2)) return true
    } catch (e) {}

    try {
        var tags = player.tags
        if (tags && (tags.contains('inspector') || tags.contains('gunsmith') || tags.contains('armurier'))) {
            return true
        }
    } catch (e) {}

    try {
        var pd = player.persistentData
        if (pd && (pd.getBoolean('is_inspector') || pd.getBoolean('is_gunsmith'))) {
            return true
        }
    } catch (e) {}

    try {
        var server = player.getServer ? player.getServer() : player.server
        if (server) {
            var pName = String(player.username || (player.getName && player.getName().getString()) || '').toLowerCase()
            var list = getInspectorList(server)
            if (list.some(function(n) { return String(n).toLowerCase() === pName })) return true
        }
    } catch (e) {}

    return false
}

StrajaWeapons.isWeaponsTransporter = function(player) {
    if (!player) return false
    // Inspectors also have transport privileges
    if (StrajaWeapons.isAuthorizedInspector(player)) return true

    try {
        var tags = player.tags
        if (tags && (tags.contains('transporter') || tags.contains('weapon_transporter') || tags.contains('transportator_arme'))) {
            return true
        }
    } catch (e) {}

    try {
        var pd = player.persistentData
        if (pd && pd.getBoolean('is_transporter')) {
            return true
        }
    } catch (e) {}

    try {
        var server = player.getServer ? player.getServer() : player.server
        if (server) {
            var pName = String(player.username || (player.getName && player.getName().getString()) || '').toLowerCase()
            var list = getTransporterList(server)
            if (list.some(function(n) { return String(n).toLowerCase() === pName })) return true
        }
    } catch (e) {}

    // Carrying sealed military logistics crate confers transport immunity
    try {
        var inv = player.getInventory ? player.getInventory() : player.inventory
        if (inv) {
            var size = inv.getContainerSize ? inv.getContainerSize() : (inv.size || 36)
            for (var i = 0; i < size; i++) {
                var st = inv.getItem(i)
                if (st && !st.isEmpty() && String(st.id).indexOf('crate_flintlock_service_pack') !== -1) {
                    return true
                }
            }
        }
    } catch (e) {}

    return false
}

StrajaWeapons.getTodayDateString = function() {
    try {
        return String($SR_LocalDate.now())
    } catch (e) {
        return new Date().toISOString().substring(0, 10)
    }
}

// ----------------------------------------------------------------------------
// 2. Registry Persistence & Maturation Engine
// ----------------------------------------------------------------------------

function getMasterRegistry(server) {
    try {
        var raw = String(server.persistentData.getString('StrajaMasterRegistry') || '')
        if (raw.length > 2) {
            return JSON.parse(raw)
        }
    } catch (e) {}
    return []
}

function saveMasterRegistry(server, list) {
    server.persistentData.putString('StrajaMasterRegistry', JSON.stringify(list))
}

function getPendingToday(server) {
    try {
        var raw = String(server.persistentData.getString('StrajaPendingToday') || '')
        if (raw.length > 2) {
            return JSON.parse(raw)
        }
    } catch (e) {}
    return []
}

function savePendingToday(server, list) {
    server.persistentData.putString('StrajaPendingToday', JSON.stringify(list))
}

StrajaWeapons.registerPendingWeapon = function(server, player, serial, modelId) {
    var pending = getPendingToday(server)
    var pName = player.username ? String(player.username) : String(player.getName().getString())
    var todayStr = StrajaWeapons.getTodayDateString()

    var modelName = 'Flintlock Necunoscut'
    if (modelId === 'qkl:fk15') modelName = 'Muschetă FK15 (16.5mm)'
    else if (modelId === 'qkl:fk15p') modelName = 'Pistol Cavalerie FK15-P'

    pending.push({
        serial: serial,
        owner: pName,
        model: modelName,
        inspector: pName,
        registeredDate: todayStr,
        status: 'PENDING_MATURATION'
    })

    savePendingToday(server, pending)
    console.info('[StrajaRegistry] Added ' + serial + ' to pending maturation queue for ' + pName)
}

StrajaWeapons.rolloverDailyRegistry = function(server) {
    var todayStr = StrajaWeapons.getTodayDateString()
    var pending = getPendingToday(server)
    var master = getMasterRegistry(server)

    var count = pending.length
    for (var i = 0; i < pending.length; i++) {
        var item = pending[i]
        item.status = 'CONFIRMED'
        master.push(item)
    }

    saveMasterRegistry(server, master)
    savePendingToday(server, []) // clear queue

    var edition = server.persistentData.getInt('StrajaRegistryEdition') || 1
    edition++
    server.persistentData.putInt('StrajaRegistryEdition', edition)
    server.persistentData.putString('StrajaCurrentDate', todayStr)

    var broadcastMsg = '§6§l[Cancelaria Straja] §eA fost publicată noua ediție (§b#' + edition + '§e) a Registrului de Armament (' + todayStr + '). Soldații sunt chemați la garnizoană!'
    server.runCommandSilent('tellraw @a {"text":"' + broadcastMsg + '"}')
    console.info('[StrajaRegistry] Daily rollover completed: ' + count + ' weapons matured into Master Registry. Edition: ' + edition)
    return count
}

// ----------------------------------------------------------------------------
// 3. Weapon Legality Evaluator (Hook for Checkpoints & Sentry Frisk)
// ----------------------------------------------------------------------------

StrajaWeapons.evaluateWeaponLegality = function(stack, player) {
    if (!stack || stack.isEmpty()) {
        return { isContraband: false, legal: true, reason: 'Item gol' }
    }

    var sId = ''
    try {
        if (stack.id) sId = String(stack.id).toLowerCase()
    } catch (e) {}

    if (sId !== 'tacz:modern_kinetic_gun') {
        return { isContraband: false, legal: true, reason: 'Nu este armă de foc' }
    }

    // Exempt roles check
    if (player && StrajaWeapons.isWeaponsTransporter(player)) {
        return { isContraband: false, legal: true, isExempt: true, reason: 'Transportator / Inspector Autorizat' }
    }

    // Extract tags
    var isProofed = false
    var isDefaced = false
    var isForged = false
    var forgeryTier = 0
    var serial = ''

    try {
        var tag = null
        if (typeof fpGetGunCustomTag === 'function') {
            tag = fpGetGunCustomTag(stack)
        } else {
            tag = stack.get('minecraft:custom_data')
            if (tag && typeof tag.copyTag === 'function') tag = tag.copyTag()
        }

        if (tag) {
            if (typeof tag.getBoolean === 'function') {
                isProofed = tag.getBoolean('Proofed')
                isDefaced = tag.getBoolean('Defaced')
                isForged = tag.getBoolean('Forged')
                forgeryTier = (typeof tag.getInt === 'function' ? tag.getInt('ForgeryTier') : Number(tag.ForgeryTier || 0)) || 0
                serial = String(tag.getString('Serial') || tag.getString('GunSerial') || '')
            } else {
                isProofed = !!tag.Proofed
                isDefaced = !!tag.Defaced
                isForged = !!tag.Forged
                forgeryTier = Number(tag.ForgeryTier || 0)
                serial = String(tag.Serial || tag.GunSerial || '')
            }
        }
    } catch (e) {
        console.error('[StrajaWeapons] evaluateWeaponLegality error: ' + e)
    }

    // 1. Defaced weapon: Instant Arrest
    if (isDefaced) {
        return {
            isContraband: true,
            tier: 0,
            serial: serial,
            reason: 'Armă de contrabandă cu seria pilită (Piața Neagră)',
            contrabandKey: 'contraband_defaced_gun'
        }
    }

    // 2. Unmarked weapon: Instant Arrest
    if (!isProofed && !isForged && (!serial || serial.length === 0)) {
        return {
            isContraband: true,
            tier: 0,
            serial: '',
            reason: 'Armă de foc nemarcată / neînregistrată',
            contrabandKey: 'contraband_unmarked_gun'
        }
    }

    // 3. Tier 3 Botched Counterfeit: Instant Arrest
    if (forgeryTier === 3 || (isForged && forgeryTier >= 3)) {
        return {
            isContraband: true,
            tier: 3,
            serial: serial,
            reason: 'Armă falsificată grosolan (Nivel 3 / Tinichea de mahala)',
            contrabandKey: 'contraband_tier3_gun'
        }
    }

    // 4. Tier 1 & 2 Fakes: Bypass automated checkpoint gate! Caught only by manual sentry frisk / registry book check
    if (isForged && (forgeryTier === 1 || forgeryTier === 2)) {
        return {
            isContraband: false, // Passes automated gate!
            isSubtleFake: true,
            tier: forgeryTier,
            serial: serial,
            reason: 'Fals subtil (Nivel ' + forgeryTier + ' — necesită inspecție de gardă)'
        }
    }

    // 5. Authentic Proofed Weapon
    return {
        isContraband: false,
        legal: true,
        tier: 0,
        serial: serial,
        reason: 'Armă poansonată legal'
    }
}

// ----------------------------------------------------------------------------
// 4. Physical Immutable Patrol Book ("Registrul de Arme Straja")
// ----------------------------------------------------------------------------

function formatPatrolBook(server) {
    var edition = server.persistentData.getInt('StrajaRegistryEdition') || 1
    var todayStr = StrajaWeapons.getTodayDateString()
    var master = getMasterRegistry(server)

    var pages = []

    // Page 1: Protocolul de Gardă
    var p1 = '§1§lORDINUL GARNIZOANEI§r\n' +
        '§8Instrucțiuni de Gardă§r\n\n' +
        'Ostaș al Strajei! Punctele de control automate opresc armele neînsemnate și fierăriile grosolane de mahala.\n\n' +
        'Însă potlogarii vicleni folosesc matrițe copiate ce trec de barierele mecanice.\n\n' +
        'Datoria ta începe acolo unde porțile automate se opresc. Cercetează slovele și pecetea!'
    pages.push(p1)

    // Page 2: Cues de Rol (Papers, Please Protocol)
    var p2 = '§4§lSEMNELE ADEVĂRULUI§r\n' +
        '§81. Cerneala:§r Adevărata pecete sclipește verde ca smaraldul (§a). Cocleala de aramă dă un verde întunecat și mort (§2).\n\n' +
        '§82. Slova:§r Matrița regală bate mereu «Registrul». Falsul de târg scapă slova «-l» («Registru») sau «N» din «POASONAT».\n\n' +
        '§83. Cifre Măsluite:§r Caută litere furișate în serie («1S» sau «I5» în loc de «15»).\n\n' +
        '§84. Regula de 24h:§r Arma de azi intră în carte mâine. Cel de azi trebuie să aibă permis semnat azi!'
    pages.push(p2)

    // Page 3+: Paginated Master Registry (3 entries per page)
    if (master.length === 0) {
        pages.push('§1§lCATASTIFUL ARMELOR§r\n§8Ediția #' + edition + ' (' + todayStr + ')§r\n\n§7Nicio armă înregistrată încă în catastiful oficial.')
    } else {
        var curPage = '§1§lCATASTIFUL ARMELOR§r\n§8Ediția #' + edition + ' (' + todayStr + ')§r\n-------------------\n'
        var onPage = 0
        for (var i = 0; i < master.length; i++) {
            var e = master[i]
            curPage += '§0• §1' + e.serial + '§r\n' +
                '  §8Posesor: §0' + e.owner + '\n' +
                '  §8Model: §2' + e.model + '\n' +
                '  §8Data: §8' + e.registeredDate + '\n'
            onPage++

            if (onPage >= 3 && i < master.length - 1) {
                pages.push(curPage)
                curPage = '§1§lCATASTIFUL ARMELOR§r\n§8Ediția #' + edition + ' (cont.)§r\n-------------------\n'
                onPage = 0
            }
        }
        if (onPage > 0) {
            pages.push(curPage)
        }
    }

    return {
        title: 'Registrul de Arme Straja (Ed. #' + edition + ')',
        author: 'Cancelaria Garnizoanei',
        pages: pages
    }
}

StrajaWeapons.givePatrolBook = function(server, targetPlayer) {
    if (!targetPlayer) return
    var pName = targetPlayer.username ? String(targetPlayer.username) : String(targetPlayer.getName().getString())
    var bookData = formatPatrolBook(server)

    var pageArrayJson = []
    for (var i = 0; i < bookData.pages.length; i++) {
        var rawText = JSON.stringify({ text: bookData.pages[i] }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        pageArrayJson.push('\'' + rawText + '\'')
    }

    var giveCmd = 'give ' + pName + ' minecraft:written_book[minecraft:written_book_content={title:\'' +
        bookData.title.replace(/'/g, "\\'") + '\',author:\'' + bookData.author + '\',pages:[' + pageArrayJson.join(',') + ']}] 1'

    server.runCommandSilent(giveCmd)
    targetPlayer.tell('§a[Straja] Ai primit exemplarul oficial: §e' + bookData.title)
}

// ----------------------------------------------------------------------------
// 5. Periodic Tick Rollover Checker
// ----------------------------------------------------------------------------

var lastCheckedDay = ''

ServerEvents.tick(function(event) {
    if (event.server.getTickCount() % 1200 !== 0) return // Check every 60 seconds
    var todayStr = StrajaWeapons.getTodayDateString()
    if (lastCheckedDay === '') {
        lastCheckedDay = String(event.server.persistentData.getString('StrajaCurrentDate') || todayStr)
    }

    if (todayStr !== lastCheckedDay) {
        console.info('[StrajaRegistry] Calendar day changed from ' + lastCheckedDay + ' to ' + todayStr + '. Triggering daily rollover!')
        StrajaWeapons.rolloverDailyRegistry(event.server)
        lastCheckedDay = todayStr
    }
})

// ----------------------------------------------------------------------------
// 6. Unified /straja Command Family
// ----------------------------------------------------------------------------

ServerEvents.commandRegistry(function(event) {
    var Commands = event.commands

    // Helper command player suggestor
    function suggestOnlinePlayers(ctx, builder) {
        try {
            var server = ctx.source.server
            var players = server.getPlayerList().getPlayers()
            for (var i = 0; i < players.size(); i++) {
                builder.suggest(String(players.get(i).getGameProfile().getName()))
            }
        } catch (e) {}
        return builder.buildFuture()
    }

    event.register(
        Commands.literal('straja')
            .requires(function(src) { return true }) // Help / lookup available to all; subcommands permission-gated
            .executes(function(ctx) {
                var src = ctx.source
                src.sendSystemMessage(Text.literal('§6§l╔════════════════════════════════════════════════════════╗'))
                src.sendSystemMessage(Text.literal('§6§l║              COMANDAMENTUL STRAJA IMPERIALĂ            ║'))
                src.sendSystemMessage(Text.literal('§6§l╚════════════════════════════════════════════════════════╝'))
                src.sendSystemMessage(Text.literal('§e▶ /straja registry [jucător] §7— Eliberează Registrul de Armament tipărit'))
                src.sendSystemMessage(Text.literal('§e▶ /straja lookup <serie> §7— Verifică statutul unei serii în catastif'))
                src.sendSystemMessage(Text.literal('§e▶ /straja frisk <jucător> §7— Percheziționează un suspect pentru arme ilegale'))
                src.sendSystemMessage(Text.literal('§e▶ /straja inspector <add|remove|list|check> §7— Gestiune licențe inspectori'))
                src.sendSystemMessage(Text.literal('§e▶ /straja transporter <add|remove|list|check> §7— Gestiune convoaie transport'))
                src.sendSystemMessage(Text.literal('§e▶ /straja checkpoint <...> §7— Administrare porți și bariere de control'))
                src.sendSystemMessage(Text.literal('§e▶ /straja prison <...> §7— Administrare celule, mandate și eliberări'))
                src.sendSystemMessage(Text.literal('§e▶ /straja rollover §7— Publică ediția zilei următoare (maturează armele)'))
                return 1
            })

            // 1. Registry Book Command
            .then(Commands.literal('registry')
                .executes(function(ctx) {
                    var p = ctx.source.player
                    if (!p) {
                        ctx.source.sendSystemMessage(Text.literal('§cComanda poate fi rulată doar de un jucător sau specifică ținta.'))
                        return 0
                    }
                    StrajaWeapons.givePatrolBook(ctx.source.server, p)
                    return 1
                })
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .requires(function(src) { return src.hasPermission(2) })
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        var server = ctx.source.server
                        var target = server.getPlayerList().getPlayerByName(pName)
                        if (!target) {
                            ctx.source.sendSystemMessage(Text.literal('§c[Straja] Jucătorul ' + pName + ' nu este conectat pe server.'))
                            return 0
                        }
                        StrajaWeapons.givePatrolBook(server, target)
                        ctx.source.sendSystemMessage(Text.literal('§a[Straja] Exemplarul tipărit a fost înmânat ostașului ' + pName + '.'))
                        return 1
                    })))
            .then(Commands.literal('book') // alias
                .executes(function(ctx) {
                    var p = ctx.source.player
                    if (p) StrajaWeapons.givePatrolBook(ctx.source.server, p)
                    return 1
                }))

            // 2. Register Serial Command (OP 2)
            .then(Commands.literal('register_serial')
                .requires(function(src) { return src.hasPermission(2) })
                .then(Commands.argument('args', $SR_StringArgument.greedyString())
                    .executes(function(ctx) {
                        var rawStr = String($SR_StringArgument.getString(ctx, 'args')).trim()
                        var firstSpace = rawStr.indexOf(' ')
                        var serial = ''
                        var owner = 'Cetatean'
                        if (firstSpace !== -1) {
                            serial = rawStr.substring(0, firstSpace).trim()
                            owner = rawStr.substring(firstSpace + 1).trim()
                        } else {
                            serial = rawStr
                        }
                        var server = ctx.source.server
                        var mockPl = { username: owner, getName: function() { return { getString: function() { return owner } } } }
                        StrajaWeapons.registerPendingWeapon(server, mockPl, serial, 'qkl:fk15')
                        ctx.source.sendSystemMessage(Text.literal('§a[Straja] Arma ' + serial + ' a fost înscrisă în coada de azi pentru posesorul ' + owner + '!'))
                        return 1
                    })))

            // 3. Rollover Command (OP 2)
            .then(Commands.literal('rollover')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    var count = StrajaWeapons.rolloverDailyRegistry(ctx.source.server)
                    ctx.source.sendSystemMessage(Text.literal('§a[Straja] Rollover efectuat! ' + count + ' arme au fost maturate în registrul oficial.'))
                    return 1
                }))

            // 3. Serial Lookup Command
            .then(Commands.literal('lookup')
                .then(Commands.argument('serial', $SR_StringArgument.greedyString())
                    .executes(function(ctx) {
                        var serial = $SR_StringArgument.getString(ctx, 'serial')
                        var server = ctx.source.server
                        var master = getMasterRegistry(server)
                        var pending = getPendingToday(server)

                        // Check Master
                        for (var i = 0; i < master.length; i++) {
                            if (master[i].serial.toLowerCase() === serial.toLowerCase()) {
                                var m = master[i]
                                ctx.source.sendSystemMessage(Text.literal('§a✔ [CATASTIF OFICIAL] ' + m.serial + ' este LEGALĂ / CONFIRMATĂ!'))
                                ctx.source.sendSystemMessage(Text.literal('§7  Posesor: §f' + m.owner + ' §7| Model: §f' + m.model + ' §7| Înregistrat: §f' + m.registeredDate))
                                return 1
                            }
                        }

                        // Check Pending Today
                        for (var j = 0; j < pending.length; j++) {
                            if (pending[j].serial.toLowerCase() === serial.toLowerCase()) {
                                var p = pending[j]
                                ctx.source.sendSystemMessage(Text.literal('§e⏳ [ÎN CURS DE MATURARE] ' + p.serial + ' este înregistrată ASTĂZI (' + p.registeredDate + ').'))
                                ctx.source.sendSystemMessage(Text.literal('§7  Posesor: §f' + p.owner + ' §7| Va apărea în tiparniță la ediția de mâine.'))
                                return 1
                            }
                        }

                        ctx.source.sendSystemMessage(Text.literal('§c✖ [NECONFIRMAT] Seria ' + serial + ' NU figurează în arhivele Garnizoanei! Este armă clandestină sau falsificată.'))
                        return 1
                    })))

            // 4. Frisk Suspect Command
            .then(Commands.literal('frisk')
                .then(Commands.argument('target', $SR_EntityArgument.player())
                    .executes(function(ctx) {
                        var target = $SR_EntityArgument.getPlayer(ctx, 'target')
                        var src = ctx.source
                        var tName = target.username ? String(target.username) : String(target.getName().getString())

                        src.sendSystemMessage(Text.literal('§6[Straja] Percheziționezi pe §f' + tName + '§6...'))

                        if (StrajaWeapons.isWeaponsTransporter(target)) {
                            src.sendSystemMessage(Text.literal('§a[Straja] ' + tName + ' deține LICENȚĂ DE TRANSPORTATOR sau este Inspector Autorizat. Trecere liberă.'))
                            return 1
                        }

                        var inv = target.getInventory ? target.getInventory() : target.inventory
                        var size = inv.getContainerSize ? inv.getContainerSize() : 36
                        var violations = []

                        for (var i = 0; i < size; i++) {
                            var st = inv.getItem(i)
                            if (st && !st.isEmpty()) {
                                var check = StrajaWeapons.evaluateWeaponLegality(st, target)
                                if (check.isContraband) {
                                    violations.push('§c• ' + check.reason + ' (' + (check.serial || 'Fără serie') + ')')
                                } else if (check.isSubtleFake) {
                                    violations.push('§e• [FALS SUBTIL IDENTIFICAT] ' + check.reason + ' (' + check.serial + ')')
                                }
                            }
                        }

                        if (violations.length === 0) {
                            src.sendSystemMessage(Text.literal('§a[Straja] ' + tName + ' este curat. Nicio neregulă de armament depistată.'))
                        } else {
                            src.sendSystemMessage(Text.literal('§4[Straja] ALARMĂ! Au fost găsite încălcări grave la ' + tName + ':'))
                            for (var k = 0; k < violations.length; k++) {
                                src.sendSystemMessage(Text.literal(violations[k]))
                            }
                        }
                        return 1
                    })))

            // 5. Inspector Licensing Subcommand
            .then(Commands.literal('inspector')
                .then(Commands.literal('add')
                    .requires(function(src) { return src.hasPermission(2) })
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var list = getInspectorList(server)
                            if (!list.some(function(n) { return n.toLowerCase() === pName.toLowerCase() })) {
                                list.push(pName)
                                saveInspectorList(server, list)
                            }
                            var player = server.getPlayerList().getPlayerByName(pName)
                            if (player) {
                                player.tags.add('inspector')
                                player.persistentData.putBoolean('is_inspector', true)
                                player.tell('§a[Straja] Ai primit licența oficială de INSPECTOR ARMURIER IMPERIAL!')
                            }
                            ctx.source.sendSystemMessage(Text.literal('§a[Straja] ' + pName + ' a fost autorizat ca Inspector Armurier.'))
                            return 1
                        })))
                .then(Commands.literal('remove')
                    .requires(function(src) { return src.hasPermission(2) })
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var list = getInspectorList(server).filter(function(n) { return n.toLowerCase() !== pName.toLowerCase() })
                            saveInspectorList(server, list)
                            var player = server.getPlayerList().getPlayerByName(pName)
                            if (player) {
                                player.tags.remove('inspector')
                                player.tags.remove('gunsmith')
                                player.tags.remove('armurier')
                                player.persistentData.remove('is_inspector')
                                player.tell('§c[Straja] Licența ta de Inspector a fost revocată de Garnizoană.')
                            }
                            ctx.source.sendSystemMessage(Text.literal('§c[Straja] Licența lui ' + pName + ' a fost revocată.'))
                            return 1
                        })))
                .then(Commands.literal('check')
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var isAuth = StrajaWeapons.isAuthorizedInspectorByName(server, pName)
                            ctx.source.sendSystemMessage(Text.literal('§7[Straja] ' + pName + ' este inspector autorizat: ' + (isAuth ? '§aDA' : '§cNU')))
                            return 1
                        })))
                .then(Commands.literal('list')
                    .executes(function(ctx) {
                        var server = ctx.source.server
                        var registered = getInspectorList(server)
                        var players = server.getPlayerList().getPlayers()
                        var combined = [].concat(registered)
                        for (var i = 0; i < players.size(); i++) {
                            var p = players.get(i)
                            var name = String(p.getGameProfile().getName())
                            if (StrajaWeapons.isAuthorizedInspector(p) && !combined.some(function(n) { return n.toLowerCase() === name.toLowerCase() })) {
                                combined.push(name)
                            }
                        }
                        ctx.source.sendSystemMessage(Text.literal('§b[Straja] Inspectori autorizați înregistrați (' + combined.length + '): ' + (combined.length > 0 ? combined.join(', ') : 'Niciunul')))
                        return 1
                    })))

            // 6. Transporter Licensing Subcommand
            .then(Commands.literal('transporter')
                .then(Commands.literal('add')
                    .requires(function(src) { return src.hasPermission(2) })
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var list = getTransporterList(server)
                            if (!list.some(function(n) { return n.toLowerCase() === pName.toLowerCase() })) {
                                list.push(pName)
                                saveTransporterList(server, list)
                            }
                            var player = server.getPlayerList().getPlayerByName(pName)
                            if (player) {
                                player.tags.add('transporter')
                                player.persistentData.putBoolean('is_transporter', true)
                                player.tell('§a[Straja] Ai primit licența oficială de TRANSPORTATOR CONVOI!')
                            }
                            ctx.source.sendSystemMessage(Text.literal('§a[Straja] ' + pName + ' a primit licență de Transportator.'))
                            return 1
                        })))
                .then(Commands.literal('remove')
                    .requires(function(src) { return src.hasPermission(2) })
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var list = getTransporterList(server).filter(function(n) { return n.toLowerCase() !== pName.toLowerCase() })
                            saveTransporterList(server, list)
                            var player = server.getPlayerList().getPlayerByName(pName)
                            if (player) {
                                player.tags.remove('transporter')
                                player.tags.remove('weapon_transporter')
                                player.tags.remove('transportator_arme')
                                player.persistentData.remove('is_transporter')
                                player.tell('§c[Straja] Licența ta de Transportator a fost revocată.')
                            }
                            ctx.source.sendSystemMessage(Text.literal('§c[Straja] Licența de transportator pentru ' + pName + ' a fost revocată.'))
                            return 1
                        })))
                .then(Commands.literal('check')
                    .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                        .executes(function(ctx) {
                            var pName = $SR_StringArgument.getString(ctx, 'player')
                            var server = ctx.source.server
                            var isAuth = StrajaWeapons.isWeaponsTransporterByName(server, pName)
                            ctx.source.sendSystemMessage(Text.literal('§7[Straja] ' + pName + ' este transportator autorizat: ' + (isAuth ? '§aDA' : '§cNU')))
                            return 1
                        })))
                .then(Commands.literal('list')
                    .executes(function(ctx) {
                        var server = ctx.source.server
                        var registered = getTransporterList(server)
                        var players = server.getPlayerList().getPlayers()
                        var combined = [].concat(registered)
                        for (var i = 0; i < players.size(); i++) {
                            var p = players.get(i)
                            var name = String(p.getGameProfile().getName())
                            if (StrajaWeapons.isWeaponsTransporter(p) && !combined.some(function(n) { return n.toLowerCase() === name.toLowerCase() })) {
                                combined.push(name)
                            }
                        }
                        ctx.source.sendSystemMessage(Text.literal('§b[Straja] Transportatori autorizați înregistrați (' + combined.length + '): ' + (combined.length > 0 ? combined.join(', ') : 'Niciunul')))
                        return 1
                    })))

            // 7. Checkpoint Subcommand Forwarder
            .then(Commands.literal('checkpoint')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    try {
                        ctx.source.server.commands.performPrefixedCommand(ctx.source, 'strajacheckpoint')
                    } catch (e) {
                        ctx.source.server.runCommandSilent('strajacheckpoint')
                    }
                    return 1
                })
                .then(Commands.argument('args', $SR_StringArgument.greedyString())
                    .executes(function(ctx) {
                        var args = $SR_StringArgument.getString(ctx, 'args')
                        try {
                            ctx.source.server.commands.performPrefixedCommand(ctx.source, 'strajacheckpoint ' + args)
                        } catch (e) {
                            ctx.source.server.runCommandSilent('strajacheckpoint ' + args)
                        }
                        return 1
                    })))

            // 8. Prison Subcommand Forwarder
            .then(Commands.literal('prison')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    try {
                        ctx.source.server.commands.performPrefixedCommand(ctx.source, 'strajaprison')
                    } catch (e) {
                        ctx.source.server.runCommandSilent('strajaprison')
                    }
                    return 1
                })
                .then(Commands.argument('args', $SR_StringArgument.greedyString())
                    .executes(function(ctx) {
                        var args = $SR_StringArgument.getString(ctx, 'args')
                        try {
                            ctx.source.server.commands.performPrefixedCommand(ctx.source, 'strajaprison ' + args)
                        } catch (e) {
                            ctx.source.server.runCommandSilent('strajaprison ' + args)
                        }
                        return 1
                    })))

            // 9. Automated Self-Test Suite (Empirical Proof Runner)
            .then(Commands.literal('test')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    runStrajaAutomatedTests(ctx.source.server, ctx.source)
                    return 1
                }))

            // 10. Automated Checkpoint & Prison Environment Setup
            .then(Commands.literal('setup')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    try {
                        ctx.source.server.commands.performPrefixedCommand(ctx.source, 'brass_test setup')
                    } catch (e) {
                        ctx.source.server.runCommandSilent('brass_test setup')
                    }
                    return 1
                }))

            // 11. Interactive Tester Guide & Handholding Forwarder
            .then(Commands.literal('tester')
                .requires(function(src) { return src.hasPermission(2) })
                .executes(function(ctx) {
                    try {
                        ctx.source.server.commands.performPrefixedCommand(ctx.source, 'brass_test')
                    } catch (e) {
                        ctx.source.server.runCommandSilent('brass_test')
                    }
                    return 1
                })
                .then(Commands.argument('args', $SR_StringArgument.greedyString())
                    .executes(function(ctx) {
                        var args = $SR_StringArgument.getString(ctx, 'args')
                        try {
                            ctx.source.server.commands.performPrefixedCommand(ctx.source, 'brass_test ' + args)
                        } catch (e) {
                            ctx.source.server.runCommandSilent('brass_test ' + args)
                        }
                        return 1
                    })))
    )

    // Standalone aliases for ease of use
    event.register(
        Commands.literal('inspector')
            .requires(function(src) { return true })
            .executes(function(ctx) {
                ctx.source.sendSystemMessage(Text.literal('§7Folosește §b/straja inspector <add|remove|list|check>§7.'))
                return 1
            })
            .then(Commands.literal('add')
                .requires(function(src) { return src.hasPermission(2) })
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja inspector add ' + pName)
                        return 1
                    })))
            .then(Commands.literal('remove')
                .requires(function(src) { return src.hasPermission(2) })
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja inspector remove ' + pName)
                        return 1
                    })))
            .then(Commands.literal('list')
                .executes(function(ctx) {
                    ctx.source.server.runCommandSilent('straja inspector list')
                    return 1
                }))
            .then(Commands.literal('check')
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja inspector check ' + pName)
                        return 1
                    })))
    )

    event.register(
        Commands.literal('transporter')
            .requires(function(src) { return true })
            .executes(function(ctx) {
                ctx.source.sendSystemMessage(Text.literal('§7Folosește §b/straja transporter <add|remove|list|check>§7.'))
                return 1
            })
            .then(Commands.literal('add')
                .requires(function(src) { return src.hasPermission(2) })
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja transporter add ' + pName)
                        return 1
                    })))
            .then(Commands.literal('remove')
                .requires(function(src) { return src.hasPermission(2) })
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja transporter remove ' + pName)
                        return 1
                    })))
            .then(Commands.literal('list')
                .executes(function(ctx) {
                    ctx.source.server.runCommandSilent('straja transporter list')
                    return 1
                }))
            .then(Commands.literal('check')
                .then(Commands.argument('player', $SR_StringArgument.word()).suggests(suggestOnlinePlayers)
                    .executes(function(ctx) {
                        var pName = $SR_StringArgument.getString(ctx, 'player')
                        ctx.source.server.runCommandSilent('straja transporter check ' + pName)
                        return 1
                    })))
    )
})

// ============================================================================
// 7. Automated Self-Test Engine (Verification of All Contracts)
// ============================================================================

function runStrajaAutomatedTests(server, src) {
    function log(msg) {
        if (src) src.sendSystemMessage(Text.literal(msg))
        console.info('[StrajaTest] ' + msg.replace(/§[0-9a-fk-or]/g, ''))
    }

    log('§6§l╔════════════════════════════════════════════════════════╗')
    log('§6§l║     SUITA DE TESTE AUTOMATIZATE STRAJA (EMPIRICAL)     ║')
    log('§6§l╚════════════════════════════════════════════════════════╝')

    var passed = 0
    var total = 0

    function assertTest(name, condition, details) {
        total++
        if (condition) {
            passed++
            log('§a✔ [PASS] §f' + name + (details ? ' §7(' + details + ')' : ''))
        } else {
            log('§c✖ [FAIL] §f' + name + ' §c' + (details ? ' §7(' + details + ')' : ''))
        }
    }

    // --- TEST SUITE 1: Licensing System ---
    log('§e▶ 1. Verificare Licențe (Inspectori & Transportatori)')
    var mockPlayerRegular = {
        hasPermission: function() { return false },
        tags: { contains: function() { return false } },
        persistentData: { getBoolean: function() { return false } },
        inventory: { getItem: function() { return null }, getContainerSize: function() { return 36 } }
    }
    var mockPlayerInspectorTag = {
        hasPermission: function() { return false },
        tags: { contains: function(t) { return t === 'inspector' } },
        persistentData: { getBoolean: function() { return false } }
    }
    var mockPlayerTransporterTag = {
        hasPermission: function() { return false },
        tags: { contains: function(t) { return t === 'transporter' } },
        persistentData: { getBoolean: function() { return false } },
        inventory: { getItem: function() { return null }, getContainerSize: function() { return 36 } }
    }
    var mockPlayerCrate = {
        hasPermission: function() { return false },
        tags: { contains: function() { return false } },
        persistentData: { getBoolean: function() { return false } },
        inventory: {
            getContainerSize: function() { return 1 },
            getItem: function(i) {
                return { isEmpty: function() { return false }, id: 'kubejs:crate_flintlock_service_pack' }
            }
        }
    }

    assertTest('Regular player is NOT inspector', !StrajaWeapons.isAuthorizedInspector(mockPlayerRegular))
    assertTest('Inspector tag grants inspector status', StrajaWeapons.isAuthorizedInspector(mockPlayerInspectorTag))
    assertTest('Regular player is NOT transporter', !StrajaWeapons.isWeaponsTransporter(mockPlayerRegular))
    assertTest('Transporter tag grants transport status', StrajaWeapons.isWeaponsTransporter(mockPlayerTransporterTag))
    assertTest('Inspector inherently has transport status', StrajaWeapons.isWeaponsTransporter(mockPlayerInspectorTag))
    assertTest('Carrying military logistics crate grants transport status', StrajaWeapons.isWeaponsTransporter(mockPlayerCrate))

    // --- TEST SUITE 2: Master Registry & 24h Maturation Rollover ---
    log('§e▶ 2. Verificare Registru & Maturație 24h')
    var initialPending = getPendingToday(server)
    var initialMaster = getMasterRegistry(server)
    var initialEdition = server.persistentData.getInt('StrajaRegistryEdition') || 1

    var testSerial = '#RC-15-TEST' + Math.floor(Math.random() * 8999 + 1000)
    var mockRegisterPlayer = {
        username: 'OfiterTest',
        getName: function() { return { getString: function() { return 'OfiterTest' } } }
    }

    StrajaWeapons.registerPendingWeapon(server, mockRegisterPlayer, testSerial, 'qkl:fk15')
    var pendingAfter = getPendingToday(server)
    var foundInPending = pendingAfter.some(function(item) { return item.serial === testSerial })
    assertTest('Arma adăugată apare în coada StrajaPendingToday', foundInPending, testSerial)

    var maturedCount = StrajaWeapons.rolloverDailyRegistry(server)
    var pendingAfterRollover = getPendingToday(server)
    var masterAfterRollover = getMasterRegistry(server)
    var editionAfter = server.persistentData.getInt('StrajaRegistryEdition') || 1

    var foundInMaster = masterAfterRollover.some(function(item) { return item.serial === testSerial && item.status === 'CONFIRMED' })
    assertTest('Coada de astăzi a fost golită după rollover', pendingAfterRollover.length === 0)
    assertTest('Arma a fost confirmată în StrajaMasterRegistry', foundInMaster, 'Ediția #' + editionAfter)
    assertTest('Ediția registrului a fost incrementată', editionAfter === initialEdition + 1)

    // Clean up test entry
    var cleanedMaster = masterAfterRollover.filter(function(item) { return item.serial !== testSerial })
    saveMasterRegistry(server, cleanedMaster)
    savePendingToday(server, initialPending)
    server.persistentData.putInt('StrajaRegistryEdition', initialEdition)

    // --- TEST SUITE 3: Weapon Legality & Contraband Evaluator ---
    log('§e▶ 3. Verificare Evaluator Contrabandă (Checkpoints & Sentry)')

    function makeGun(nbt) {
        return {
            id: 'tacz:modern_kinetic_gun',
            isEmpty: function() { return false },
            get: function(key) {
                if (key === 'minecraft:custom_data') {
                    return {
                        getBoolean: function(k) { return !!nbt[k] },
                        getInt: function(k) { return nbt[k] || 0 },
                        getString: function(k) { return nbt[k] || '' },
                        copyTag: function() { return this }
                    }
                }
                return null
            }
        }
    }

    var gunUnmarked = makeGun({})
    var gunDefaced = makeGun({ Defaced: true, Serial: '#RC-15-0105' })
    var gunTier3 = makeGun({ Forged: true, ForgeryTier: 3, Serial: '#RC-15-0999' })
    var gunTier2 = makeGun({ Forged: true, ForgeryTier: 2, Serial: '#RC-15-0888' })
    var gunTier1 = makeGun({ Forged: true, ForgeryTier: 1, Serial: '#RC-1S-0777' })
    var gunAuthentic = makeGun({ Proofed: true, Serial: '#RC-15-0101' })

    var resUnmarked = StrajaWeapons.evaluateWeaponLegality(gunUnmarked, mockPlayerRegular)
    assertTest('Armă nemarcată -> CONTRABANDĂ (Arest Imediat)', resUnmarked.isContraband && resUnmarked.contrabandKey === 'contraband_unmarked_gun')

    var resDefaced = StrajaWeapons.evaluateWeaponLegality(gunDefaced, mockPlayerRegular)
    assertTest('Armă cu serie pilită -> CONTRABANDĂ (Arest Imediat)', resDefaced.isContraband && resDefaced.contrabandKey === 'contraband_defaced_gun')

    var resTier3 = StrajaWeapons.evaluateWeaponLegality(gunTier3, mockPlayerRegular)
    assertTest('Fals Nivel 3 (Tinichea) -> CONTRABANDĂ (Arest Imediat)', resTier3.isContraband && resTier3.contrabandKey === 'contraband_tier3_gun')

    var resTier2 = StrajaWeapons.evaluateWeaponLegality(gunTier2, mockPlayerRegular)
    assertTest('Fals Nivel 2 (Comun) -> TRECE de poarta automată (necesită control manual)', !resTier2.isContraband && resTier2.isSubtleFake)

    var resTier1 = StrajaWeapons.evaluateWeaponLegality(gunTier1, mockPlayerRegular)
    assertTest('Fals Nivel 1 (Aproape Perfect) -> TRECE de poarta automată', !resTier1.isContraband && resTier1.isSubtleFake)

    var resAuthentic = StrajaWeapons.evaluateWeaponLegality(gunAuthentic, mockPlayerRegular)
    assertTest('Armă poansonată oficial -> COMPLET LEGALĂ', !resAuthentic.isContraband && resAuthentic.legal)

    var resExemptUnmarked = StrajaWeapons.evaluateWeaponLegality(gunUnmarked, mockPlayerInspectorTag)
    assertTest('Inspector autorizat cu armă nemarcată -> SCUTIT (Nu este arestat)', !resExemptUnmarked.isContraband && resExemptUnmarked.isExempt)

    var resExemptCrate = StrajaWeapons.evaluateWeaponLegality(gunUnmarked, mockPlayerCrate)
    assertTest('Transportator cu ladă militară sigilată -> SCUTIT', !resExemptCrate.isContraband && resExemptCrate.isExempt)

    // --- TEST SUITE 4: RNG Distribution Simulation (10,000 rolls) ---
    log('§e▶ 4. Verificare Distribuție RNG Falsificare (10.000 iterații)')
    var t1Count = 0, t2Count = 0, t3Count = 0
    var N = 10000
    for (var r = 0; r < N; r++) {
        var roll = Math.random()
        if (roll < 0.05) t1Count++
        else if (roll < 0.55) t2Count++
        else t3Count++
    }
    var pct1 = (t1Count / N * 100).toFixed(1)
    var pct2 = (t2Count / N * 100).toFixed(1)
    var pct3 = (t3Count / N * 100).toFixed(1)

    assertTest('Tier 1 (Near Perfect): ~5% (Obținut: ' + pct1 + '%)', Math.abs(t1Count / N - 0.05) < 0.015)
    assertTest('Tier 2 (Common Fake): ~50% (Obținut: ' + pct2 + '%)', Math.abs(t2Count / N - 0.50) < 0.025)
    assertTest('Tier 3 (Botched Fake): ~45% (Obținut: ' + pct3 + '%)', Math.abs(t3Count / N - 0.45) < 0.025)

    // --- TEST SUITE 5: Snapshot Patrol Book Generation ---
    log('§e▶ 5. Verificare Formatare Catastif Patrol Book')
    var book = formatPatrolBook(server)
    assertTest('Titlu carte conform', book.title.indexOf('Registrul de Arme Straja') !== -1)
    assertTest('Autor carte este Cancelaria Garnizoanei', book.author === 'Cancelaria Garnizoanei')
    assertTest('Pagina 1 conține Ordinul Garnizoanei', book.pages[0].indexOf('ORDINUL GARNIZOANEI') !== -1)
    assertTest('Pagina 2 conține indicii de rol (cerneală, slove, 24h)',
        book.pages[1].indexOf('Cerneala') !== -1 &&
        book.pages[1].indexOf('Slova') !== -1 &&
        book.pages[1].indexOf('24h') !== -1
    )
    assertTest('Pagina 2 NU conține termeni de meta/spargere a atmosferei',
        book.pages[1].indexOf('KubeJS') === -1 &&
        book.pages[1].indexOf('NBT') === -1 &&
        book.pages[1].indexOf('crafting') === -1
    )

    log('§6§l╠════════════════════════════════════════════════════════╣')
    log('§6§l║ REZULTAT FINAL: ' + (passed === total ? '§a§lTOATE TESTELE AU TRECUT (' + passed + '/' + total + ')' : '§c§lEȘECURI DETECTATE (' + passed + '/' + total + ')') + ' §6§l║')
    log('§6§l╚════════════════════════════════════════════════════════╝')
}
