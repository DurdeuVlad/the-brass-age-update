// Legal Provenance, Royal Proofing & Black Market State Machine Engine
// Implements serialization (#RC-15-XXXX), anvil proofing rituals, grindstone defacing, and anti-forgery.

var $FP_BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var $FP_DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var $FP_CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
var $FP_ItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
var $FP_Component = Java.loadClass('net.minecraft.network.chat.Component')
var $FP_ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
var $FP_ArrayList = Java.loadClass('java.util.ArrayList')
var $FP_CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')

function fpGetStackId(stack) {
    if (!stack || stack.isEmpty()) return ''
    try {
        var k = $FP_BuiltInRegistries.ITEM.getKey(stack.getItem())
        if (k) return String(k).toLowerCase()
    } catch (e) {}
    try {
        if (stack.id) return String(stack.id).toLowerCase()
    } catch (e) {}
    return ''
}

function fpGetGunCustomTag(stack) {
    if (!stack || stack.isEmpty()) return null
    try {
        var data = stack.get($FP_DataComponents.CUSTOM_DATA)
        if (data) {
            if (typeof data.copyTag === 'function') return data.copyTag()
            if (typeof data.getUnsafe === 'function') return data.getUnsafe()
        }
    } catch (e) {}
    try {
        var c = stack.get('minecraft:custom_data')
        if (c) {
            if (typeof c.copyTag === 'function') return c.copyTag()
            if (typeof c.getUnsafe === 'function') return c.getUnsafe()
        }
    } catch (e) {}
    try {
        if (stack.nbt) {
            var ct = new $FP_CompoundTag()
            for (var k in stack.nbt) {
                if (typeof stack.nbt[k] === 'string') ct.putString(k, stack.nbt[k])
                else if (typeof stack.nbt[k] === 'boolean') ct.putBoolean(k, stack.nbt[k])
                else if (typeof stack.nbt[k] === 'number') ct.putInt(k, stack.nbt[k])
            }
            return ct
        }
    } catch (e) {}
    return null
}

// 1. Tooling & Permit Recipes
ServerEvents.recipes(event => {
    // Imperial Proof Stamp (Indestructible Master Tool)
    event.shaped('kubejs:proof_stamp', [
        ' G ',
        'STS',
        ' W '
    ], {
        G: 'minecraft:gold_ingot',
        S: 'create:brass_sheet',
        T: 'kubejs:tempered_gun_steel',
        W: 'minecraft:stick'
    }).id('kubejs:flintlocks/craft_proof_stamp')

    // Permit Blanks
    event.shaped('4x kubejs:permit_blank', [
        ' G ',
        ' P ',
        ' R '
    ], {
        G: 'minecraft:gold_nugget',
        P: 'minecraft:paper',
        R: 'minecraft:red_dye'
    }).id('kubejs:flintlocks/craft_permit_blank')
})

// 2. Serial Number Generator Helper
function getNextStrajaSerial(server) {
    var current = server.persistentData.getInt('StrajaSerialCount')
    if (!current || current < 100) current = 100
    var next = current + 1
    server.persistentData.putInt('StrajaSerialCount', next)
    var padded = String(next)
    while (padded.length < 4) padded = '0' + padded
    return '#RC-15-' + padded
}

function strajaIsAuthorizedInspector(player) {
    if (!player) return false
    try {
        var tags = player.tags
        if (tags && (tags.contains('inspector') || tags.contains('gunsmith') || tags.contains('armurier'))) return true
    } catch (e) {}
    try {
        var pd = player.persistentData
        if (pd && (pd.getBoolean('is_inspector') || pd.getBoolean('is_gunsmith'))) return true
    } catch (e) {}
    try {
        var server = player.getServer ? player.getServer() : player.server
        if (server && server.persistentData) {
            var raw = String(server.persistentData.getString('StrajaInspectors') || '')
            if (raw.length > 2) {
                var list = JSON.parse(raw)
                var pName = String(player.username || (player.getName && player.getName().getString()) || '').toLowerCase()
                if (list.some(function(n) { return String(n).toLowerCase() === pName })) return true
            }
        }
    } catch (e) {}
    return false
}

function strajaRegisterPendingWeapon(server, player, serial, gunId) {
    try {
        var raw = String(server.persistentData.getString('StrajaPendingToday') || '')
        var pending = (raw.length > 2) ? JSON.parse(raw) : []
        var pName = player.username ? String(player.username) : String(player.getName().getString())
        var todayStr = new Date().toISOString().substring(0, 10)
        try {
            var $LocalDate = Java.loadClass('java.time.LocalDate')
            todayStr = String($LocalDate.now())
        } catch (e) {}

        var modelName = 'Flintlock Necunoscut'
        if (gunId === 'qkl:fk15') modelName = 'Muschetă FK15 (16.5mm)'
        else if (gunId === 'qkl:fk15p') modelName = 'Pistol Cavalerie FK15-P'

        pending.push({
            serial: serial,
            owner: pName,
            model: modelName,
            inspector: pName,
            registeredDate: todayStr,
            status: 'PENDING_MATURATION'
        })
        server.persistentData.putString('StrajaPendingToday', JSON.stringify(pending))
        console.info('[StrajaRegistry] Enqueued pending weapon ' + serial + ' for ' + pName)
    } catch (err) {
        console.error('[StrajaRegistry] Failed to enqueue pending weapon: ' + err)
    }
}

// 3. Anvil Proofing Event: Firearm + Proof Stamp -> Serialized Firearm
var $AnvilUpdateEvent = null
try {
    $AnvilUpdateEvent = Java.loadClass('net.neoforged.neoforge.event.AnvilUpdateEvent')
} catch (e) {}

if ($AnvilUpdateEvent && typeof NativeEvents !== 'undefined') {
    NativeEvents.onEvent($AnvilUpdateEvent, function(event) {
        var left = event.getLeft()
        var right = event.getRight()
        console.info('[AnvilUpdate] event received: left=' + left + ', right=' + right)
        if (!left || left.isEmpty() || !right || right.isEmpty()) return
        
        var leftId = fpGetStackId(left)
        var rightId = fpGetStackId(right)
        console.info('[AnvilUpdate] leftId=' + leftId + ', rightId=' + rightId)
        if (leftId !== 'tacz:modern_kinetic_gun' || rightId !== 'kubejs:proof_stamp') return

        var tag = fpGetGunCustomTag(left)
        console.info('[AnvilUpdate] tag=' + tag)
        if (!tag) return

        var gunId = String(tag.getString('GunId'))
        console.info('[AnvilUpdate] gunId=' + gunId)
        if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

        // Cannot re-proof an already legal gun
        if (tag.getBoolean('Proofed')) {
            event.setOutput($FP_ItemStack.EMPTY)
            return
        }

        // Cannot casually re-stamp a defaced black market gun
        if (tag.getBoolean('Defaced')) {
            event.setOutput($FP_ItemStack.EMPTY)
            return
        }

        var output = left.copy()
        var player = event.getPlayer()
        if (!player) return
        var server = player.getServer()
        if (!server) return
        var serial = getNextStrajaSerial(server)

        var isInspector = strajaIsAuthorizedInspector(player)

        var newTag = tag.copy()
        var loreList = new $FP_ArrayList()

        if (isInspector) {
            // Authentic Official Proofing by Licensed Inspector
            newTag.putBoolean('Proofed', true)
            newTag.putBoolean('Forged', false)
            newTag.putInt('ForgeryTier', 0)
            newTag.putString('Serial', serial)
            newTag.putString('GunSerial', serial)
            newTag.remove('Defaced')

            loreList.add($FP_Component.literal('§a✔ POANSONAT: ' + serial))
            loreList.add($FP_Component.literal('§7Registrul Imperial Straja'))

            // Enqueue into pending maturation roll for today
            strajaRegisterPendingWeapon(server, player, serial, gunId)
        } else {
            // Unlicensed Criminal Forgery (Papers, Please RNG Quality Curve)
            // 5% Near Perfect (Tier 1), 50% Common Fake (Tier 2), 45% Botched (Tier 3)
            var roll = Math.random()
            var fakeSerial = serial
            var tier = 2
            var lore1 = ''
            var lore2 = ''

            if (roll < 0.05) {
                // Tier 1: Near Perfect (Micro-tell in serial like 1S or I5, and royal lore with subtle dot)
                tier = 1
                fakeSerial = serial.replace('15-', (Math.random() < 0.5 ? '1S-' : 'I5-'))
                lore1 = '§a✔ POANSONAT: ' + fakeSerial
                lore2 = '§7Registrul Imperial Straja.' // subtle trailing period
            } else if (roll < 0.55) {
                // Tier 2: Common Fake (Copper vitriol ink §2, missing '-l' in Registru)
                tier = 2
                lore1 = '§2✔ POANSONAT: ' + serial
                lore2 = '§7Registru Imperial Straja' // missing '-l'
            } else {
                // Tier 3: Botched / Crude (Red/yellow ink, typo POASONAT without N, crude lore)
                tier = 3
                lore1 = (Math.random() < 0.5 ? '§c✔ POASONAT: ' : '§e✔ POANSONAT?: ') + serial
                lore2 = '§7Atelier Nereglementat'
            }

            newTag.putBoolean('Proofed', false)
            newTag.putBoolean('Forged', true)
            newTag.putInt('ForgeryTier', tier)
            newTag.putString('Serial', fakeSerial)
            newTag.putString('GunSerial', fakeSerial)
            newTag.remove('Defaced')

            loreList.add($FP_Component.literal(lore1))
            loreList.add($FP_Component.literal(lore2))
            // Unlicensed smithing NEVER enters any official queue
        }

        output.set($FP_DataComponents.CUSTOM_DATA, $FP_CustomData.of(newTag))
        output.set($FP_DataComponents.LORE, new $FP_ItemLore(loreList))

        event.setOutput(output)
        event.setCost(5) // Inspection / forging cost in XP levels
    })
}

// Helper to create defaced gun stack
function fpCreateDefacedGun(gunStack) {
    var tag = fpGetGunCustomTag(gunStack)
    if (!tag) return null
    var output = gunStack.copy()
    var newTag = null
    try {
        newTag = (typeof tag.copy === 'function') ? tag.copy() : new $FP_CompoundTag()
        if (typeof tag.copy !== 'function') {
            for (var k in tag) {
                if (typeof tag[k] === 'string') newTag.putString(k, tag[k])
                else if (typeof tag[k] === 'boolean') newTag.putBoolean(k, tag[k])
                else if (typeof tag[k] === 'number') newTag.putInt(k, tag[k])
            }
        }
    } catch (e) {
        newTag = new $FP_CompoundTag()
    }
    newTag.putBoolean('Proofed', false)
    newTag.putBoolean('Defaced', true)
    newTag.remove('Serial')
    newTag.remove('GunSerial')

    var nativeStack = (typeof output.getItemStack === 'function') ? output.getItemStack() : output
    var loreList = new $FP_ArrayList()
    loreList.add($FP_Component.literal('§4⚠ [SERIE PILITĂ / DEFACED]'))
    loreList.add($FP_Component.literal('§cArmă de contrabandă!'))

    try {
        if (nativeStack && typeof nativeStack.set === 'function') {
            nativeStack.set($FP_DataComponents.CUSTOM_DATA, $FP_CustomData.of(newTag))
            nativeStack.set($FP_DataComponents.LORE, new $FP_ItemLore(loreList))
        } else {
            output.set($FP_DataComponents.CUSTOM_DATA, $FP_CustomData.of(newTag))
            output.set($FP_DataComponents.LORE, new $FP_ItemLore(loreList))
        }
    } catch (e) {
        console.error('[fpCreateDefacedGun] set error: ' + e)
    }
    return output
}

function fpIsProofedGun(stack) {
    if (!stack || stack.isEmpty() || fpGetStackId(stack) !== 'tacz:modern_kinetic_gun') return false
    var tag = fpGetGunCustomTag(stack)
    if (!tag) return false
    var isProofed = false
    try {
        if (typeof tag.getBoolean === 'function') {
            isProofed = tag.getBoolean('Proofed') || (tag.getInt && tag.getInt('Proofed') == 1) || String(tag.getString('Proofed')) === 'true'
        } else if (tag.Proofed) {
            isProofed = true
        }
    } catch (e) {}

    var serial = ''
    try {
        if (typeof tag.getString === 'function') {
            serial = tag.getString('Serial') || tag.getString('GunSerial')
        } else {
            serial = tag.Serial || tag.GunSerial || ''
        }
    } catch (e) {}
    var hasSerial = serial && String(serial).length > 0 && String(serial).indexOf('#RC-') === 0

    var isDefaced = false
    try {
        if (typeof tag.getBoolean === 'function') isDefaced = tag.getBoolean('Defaced')
        else isDefaced = !!tag.Defaced
    } catch (e) {}
    return (isProofed || hasSerial) && !isDefaced
}

// 4. Grindstone Defacing: Proofed Firearm -> Defaced Black Market Arm
var $GrindstonePlaceEvent = null
var $GrindstoneTakeEvent = null
try {
    $GrindstonePlaceEvent = Java.loadClass('net.neoforged.neoforge.event.GrindstoneEvent$OnPlaceItem')
    $GrindstoneTakeEvent = Java.loadClass('net.neoforged.neoforge.event.GrindstoneEvent$OnTakeItem')
} catch (e) {}

if ($GrindstonePlaceEvent && typeof NativeEvents !== 'undefined') {
    NativeEvents.onEvent($GrindstonePlaceEvent, function(event) {
        var top = event.getTopItem()
        var bottom = event.getBottomItem()
        
        var targetGun = null
        if (fpIsProofedGun(top)) targetGun = top
        else if (fpIsProofedGun(bottom)) targetGun = bottom
        
        if (!targetGun) return
        var defaced = fpCreateDefacedGun(targetGun)
        if (defaced) {
            event.setOutput(defaced)
            event.setXp(0)
        }
    })
}

if ($GrindstoneTakeEvent && typeof NativeEvents !== 'undefined') {
    NativeEvents.onEvent($GrindstoneTakeEvent, function(event) {
        var top = event.getTopItem()
        var bottom = event.getBottomItem()
        var isGun = fpIsProofedGun(top) || fpIsProofedGun(bottom)
        if (!isGun) return

        if (fpIsProofedGun(top)) {
            event.setNewTopItem($FP_ItemStack.EMPTY)
        }
        if (fpIsProofedGun(bottom)) {
            event.setNewBottomItem($FP_ItemStack.EMPTY)
        }
        var player = event.getPlayer()
        if (player) {
            var server = player.getServer ? player.getServer() : player.server
            if (server) {
                var x = player.x.toFixed(1)
                var y = player.y.toFixed(1)
                var z = player.z.toFixed(1)
                server.runCommandSilent('playsound minecraft:block.grindstone.use player @a ' + x + ' ' + y + ' ' + z + ' 1.0 1.0')
            }
            player.tell('§c[Piața Neagră] Ai pilit seria armei la tocilă! Arma a devenit ilegală.')
        }
    })
}

// In-World Grindstone Defacing: Right-Click a Grindstone block directly with a proofed firearm
BlockEvents.rightClicked(event => {
    var block = event.block
    var bId = ''
    try {
        bId = String(block.id || (block.kjs$getId ? block.kjs$getId() : '')).toLowerCase()
    } catch (e) {}
    if (bId.indexOf('grindstone') === -1) return

    var handStr = event.hand ? String(event.hand).toUpperCase() : ''
    console.info('[GrindstoneClick] block=' + bId + ', hand=' + handStr + ', item=' + event.item)

    if (handStr && handStr.indexOf('OFF') !== -1) return

    var player = event.player || (typeof event.getEntity === 'function' ? event.getEntity() : null)
    if (!player) return
    var item = event.item || (typeof event.getItem === 'function' ? event.getItem() : null)
    if (!item || item.isEmpty()) return

    var sId = fpGetStackId(item)
    console.info('[GrindstoneClick] stackId=' + sId)
    if (sId !== 'tacz:modern_kinetic_gun') return

    var isProofed = fpIsProofedGun(item)
    console.info('[GrindstoneClick] isProofed=' + isProofed)
    if (!isProofed) return

    var defaced = fpCreateDefacedGun(item)
    console.info('[GrindstoneClick] defaced=' + defaced)
    if (defaced) {
        try {
            item.shrink(1)
            player.give(defaced)
            if (typeof player.swing === 'function') player.swing()

            var px = (typeof player.getX === 'function') ? player.getX() : (player.x || 0)
            var py = (typeof player.getY === 'function') ? player.getY() : (player.y || 0)
            var pz = (typeof player.getZ === 'function') ? player.getZ() : (player.z || 0)

            var server = player.getServer ? player.getServer() : (player.server || (player.level && player.level.getServer ? player.level.getServer() : null))
            if (server) {
                server.runCommandSilent('playsound minecraft:block.grindstone.use player @a ' + Number(px).toFixed(1) + ' ' + Number(py).toFixed(1) + ' ' + Number(pz).toFixed(1) + ' 1.0 1.0')
            }
            player.tell('§c[Piața Neagră] Ai pilit seria armei la tocilă! Arma a devenit ilegală (Defaced).')
        } catch (err) {
            console.error('[GrindstoneClick] Error applying defaced gun: ' + err)
        }
        try { event.cancel() } catch (e) {}
    }
})

// 5. Permit Binding: Right-clicking Permit Blank with Proofed Weapon in either hand
ItemEvents.rightClicked(event => {
    var item = event.item || (typeof event.getItem === 'function' ? event.getItem() : null)
    if (!item || item.isEmpty() || fpGetStackId(item) !== 'kubejs:permit_blank') return
    var player = event.player || (typeof event.getEntity === 'function' ? event.getEntity() : null)
    if (!player) return

    var mainhand = player.getMainHandItem ? player.getMainHandItem() : player.mainHandItem
    var offhand = player.getOffhandItem ? player.getOffhandItem() : player.offhandItem

    var gunStack = null
    if (fpGetStackId(mainhand) === 'kubejs:permit_blank') {
        gunStack = offhand
    } else if (fpGetStackId(offhand) === 'kubejs:permit_blank') {
        gunStack = mainhand
    } else {
        gunStack = offhand
    }

    var isInspector = strajaIsAuthorizedInspector(player)
    var playerName = player.username ? String(player.username) : String(player.getName().getString())
    var server = player.getServer ? player.getServer() : (player.server || (player.level && player.level.getServer ? player.level.getServer() : null))
    var todayStr = new Date().toISOString().substring(0, 10)
    try {
        var $LocalDate = Java.loadClass('java.time.LocalDate')
        todayStr = String($LocalDate.now())
    } catch (e) {}

    var tag = gunStack && !gunStack.isEmpty() ? fpGetGunCustomTag(gunStack) : null
    var isProofed = false
    var serial = ''
    var isDefaced = false

    if (tag) {
        try {
            if (typeof tag.getBoolean === 'function') {
                isProofed = tag.getBoolean('Proofed') || (tag.getInt && tag.getInt('Proofed') == 1) || String(tag.getString('Proofed')) === 'true'
                isDefaced = tag.getBoolean('Defaced')
                serial = tag.getString('Serial') || tag.getString('GunSerial') || ''
            } else {
                isProofed = !!tag.Proofed
                isDefaced = !!tag.Defaced
                serial = tag.Serial || tag.GunSerial || ''
            }
        } catch (e) {}
    }
    var hasSerial = serial && String(serial).length > 0 && String(serial).indexOf('#RC-') === 0

    if (isInspector) {
        // Official Inspector: Requires proofed, non-defaced weapon in hand
        if (!gunStack || gunStack.isEmpty() || fpGetStackId(gunStack) !== 'tacz:modern_kinetic_gun') {
            player.tell('§e[Permis Oficial] Ține o armă poansonată în cealaltă mână pentru a-i elibera permisul.')
            return
        }
        if (!tag || (!isProofed && !hasSerial) || !serial || isDefaced) {
            player.tell('§c[Permis Oficial] Arma din mână nu poartă o serie de poansonare validă! Nu se poate emite permis.')
            return
        }

        var permitAuthor = 'Gheorghe Comandantul'
        var permitTitle = 'Permis Port-Arma ' + serial
        var statusText = '§2LEGAL / ÎNREGISTRAT'
        var watermarkText = '§8Cancelaria Garnizoanei Straja'

        var page1Text = '§6§lPERMIS PORT-ARMĂ§r\n\n' +
            '§0Posesor: §1' + playerName + '\n' +
            '§0Serie: §2' + serial + '\n' +
            '§0Model: §0Flintlock 16.5mm\n' +
            '§0Statut: ' + statusText + '\n' +
            '§0Emis: §8' + todayStr + '\n\n' +
            watermarkText

        var page2Text = '§6§lDISPOZIȚII LEGALE§r\n\n' +
            '§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja.\n\n' +
            '§8Neprezentarea la control atrage confiscarea armei și arestarea posesorului.'

        var rawJson1 = JSON.stringify({ text: page1Text }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        var rawJson2 = JSON.stringify({ text: page2Text }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

        var giveCmd = 'give ' + playerName +
            ' minecraft:written_book[minecraft:written_book_content={title:\'' + permitTitle.replace(/'/g, "\\'") + '\',author:\'' + permitAuthor + '\',pages:[\'' + rawJson1 + '\',\'' + rawJson2 + '\']},' +
            'minecraft:custom_data={PermitOfficial:1b,Serial:\'' + serial + '\'},' +
            'minecraft:item_name=\'{"text":"Permis Port-Armă Oficial","color":"gold","bold":true,"italic":false}\',' +
            'minecraft:lore=[\'{"text":"Serie: ' + serial + '","color":"gray","italic":false}\',\'{"text":"✔ Autentificat de Garnizoana Straja","color":"green","italic":false}\']] 1'

        if (server) server.runCommandSilent(giveCmd)
        if (typeof player.swing === 'function') player.swing()
        if (!player.isCreative()) item.shrink(1)
        player.tell('§a[Permis] A fost emis permisul oficial de port-armă pentru seria ' + serial + '!')
        return
    }

    // Civilian / Counterfeiter: Papers, Please RNG (5% Tier 1, 50% Tier 2, 45% Tier 3)
    // If not holding a valid serial, generate a plausible black market serial
    var forgedSerial = serial && hasSerial ? String(serial) : ('#RC-15-' + Math.floor(1000 + Math.random() * 9000))
    var pRoll = Math.random()
    var fakeTier = 2
    var permitAuthor = 'Gheorge Comandantul'
    var permitTitle = 'Permis Armă ' + forgedSerial.replace('-', '_')
    var statusText = '§aLEGAL / STRAJA'
    var watermarkText = '§8Cancelaria Garnizoana Straja\n§8[Cerneală întinsă de calopur]'
    var itemName = '{"text":"Permis Port-Armă [T2 Fals Comun]","color":"gold","bold":true,"italic":false}'
    var loreArray = [
        '\'{"text":"Serie: ' + forgedSerial + '","color":"gray","italic":false}\'',
        '\'{"text":"⚠ [Document cu nereguli grafice]","color":"yellow","italic":false}\'',
        '\'{"text":"Piața Neagră","color":"dark_gray","italic":true}\''
    ]

    if (pRoll < 0.05) {
        // Tier 1: Near Perfect (5%) — subtle letter swap in author and trailing period
        fakeTier = 1
        permitAuthor = 'Gheorghe Comandatul'
        permitTitle = 'Permis Port-Arma ' + forgedSerial
        statusText = '§2LEGAL / ÎNREGISTRAT'
        watermarkText = '§8Cancelaria Garnizoanei Straja.'
        itemName = '{"text":"Permis Port-Armă [T1 Fals Subtil]","color":"aqua","bold":true,"italic":false}'
        loreArray = [
            '\'{"text":"Serie: ' + forgedSerial + '","color":"gray","italic":false}\'',
            '\'{"text":"(Caligrafie imperială aproape identică)","color":"dark_gray","italic":true}\''
        ]
    } else if (pRoll >= 0.55) {
        // Tier 3: Botched / Tinichea (45%) — comical author, misspelled title, red stamp
        fakeTier = 3
        permitAuthor = 'Comandant Gheorghe'
        permitTitle = 'Hârtie de Armă ' + forgedSerial
        statusText = '§cAPROBAT PE CINSTE'
        watermarkText = '§8Atelier Mahala Obor\n§4FALS GROSOLAN'
        itemName = '{"text":"Permis Port-Armă [T3 Fals Grosolan]","color":"red","bold":true,"italic":false}'
        loreArray = [
            '\'{"text":"Serie: ' + forgedSerial + '","color":"gray","italic":false}\'',
            '\'{"text":"✖ [FALS GROSOLAN / IMITAȚIE RIDICOLĂ]","color":"dark_red","bold":true,"italic":false}\'',
            '\'{"text":"Contrabandă Grad 3","color":"red","italic":false}\''
        ]
    }

    var page1Text = '§6§lPERMIS PORT-ARMĂ§r\n\n' +
        '§0Posesor: §1' + playerName + '\n' +
        '§0Serie: §2' + forgedSerial + '\n' +
        '§0Model: §0Flintlock 16.5mm\n' +
        '§0Statut: ' + statusText + '\n' +
        '§0Emis: §8' + todayStr + '\n\n' +
        watermarkText

    var page2Text = '§6§lDISPOZIȚII LEGALE§r\n\n' +
        '§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja.\n\n' +
        '§8Neprezentarea la control atrage confiscarea armei și arestarea posesorului.'

    var rawJson1 = JSON.stringify({ text: page1Text }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    var rawJson2 = JSON.stringify({ text: page2Text }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

    var giveCmd = 'give ' + playerName +
        ' minecraft:written_book[minecraft:written_book_content={title:\'' + permitTitle.replace(/'/g, "\\'") + '\',author:\'' + permitAuthor + '\',pages:[\'' + rawJson1 + '\',\'' + rawJson2 + '\']},' +
        'minecraft:custom_data={ForgedPermit:1b,FakeTier:' + fakeTier + 'b,Serial:\'' + forgedSerial + '\'},' +
        'minecraft:item_name=\'' + itemName.replace(/'/g, "\\'") + '\',' +
        'minecraft:lore=[' + loreArray.join(',') + ']] 1'

    if (server) server.runCommandSilent(giveCmd)
    if (typeof player.swing === 'function') player.swing()
    if (!player.isCreative()) item.shrink(1)
    player.tell('§e[Piața Neagră] Ai plastografiat un permis de port-armă falsificat (Nivel ' + fakeTier + ') pentru seria ' + forgedSerial + '!')
})
