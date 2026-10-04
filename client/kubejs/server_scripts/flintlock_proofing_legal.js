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

        var newTag = tag.copy()
        newTag.putBoolean('Proofed', true)
        newTag.putString('Serial', serial)
        newTag.remove('Defaced')
        output.set($FP_DataComponents.CUSTOM_DATA, $FP_CustomData.of(newTag))

        // Add official Straja lore
        var loreList = new $FP_ArrayList()
        loreList.add($FP_Component.literal('§a✔ POANSONAT: ' + serial))
        loreList.add($FP_Component.literal('§7Registrul Imperial Straja'))
        output.set($FP_DataComponents.LORE, new $FP_ItemLore(loreList))

        event.setOutput(output)
        event.setCost(5) // Guild inspection cost in XP levels
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
            isProofed = tag.getBoolean('Proofed') || tag.getByte('Proofed') == 1 || tag.getInt('Proofed') == 1 || String(tag.getString('Proofed')) === 'true'
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

    if (!gunStack || gunStack.isEmpty() || fpGetStackId(gunStack) !== 'tacz:modern_kinetic_gun') {
        player.tell('§e[Permis] Ține o armă poansonată în cealaltă mână pentru a-i elibera permisul.')
        return
    }

    var tag = fpGetGunCustomTag(gunStack)
    var isProofed = false
    try {
        if (typeof tag.getBoolean === 'function') {
            isProofed = tag.getBoolean('Proofed') || tag.getByte('Proofed') == 1 || tag.getInt('Proofed') == 1 || String(tag.getString('Proofed')) === 'true'
        } else if (tag && tag.Proofed) {
            isProofed = true
        }
    } catch (e) {}

    var serial = ''
    try {
        if (typeof tag.getString === 'function') {
            serial = tag.getString('Serial') || tag.getString('GunSerial')
        } else if (tag) {
            serial = tag.Serial || tag.GunSerial || ''
        }
    } catch (e) {}
    var hasSerial = serial && String(serial).length > 0 && String(serial).indexOf('#RC-') === 0

    var isDefaced = false
    try {
        if (typeof tag.getBoolean === 'function') isDefaced = tag.getBoolean('Defaced')
        else if (tag) isDefaced = !!tag.Defaced
    } catch (e) {}

    if (!tag || (!isProofed && !hasSerial) || !serial || isDefaced) {
        player.tell('§c[Permis] Arma din mână nu este poansonată legal! Nu se poate emite permis.')
        return
    }

    var playerName = player.username ? String(player.username) : String(player.getName().getString())
    var server = player.getServer ? player.getServer() : (player.server || (player.level && player.level.getServer ? player.level.getServer() : null))

    var pageText = '§6§lPERMIS DE PORT-ARMĂ§r\n\n' +
        '§0Posesor: §1' + playerName + '\n' +
        '§0Serie Armă: §2' + serial + '\n' +
        '§0Model: §0Flintlock 16.5mm\n' +
        '§0Statut: §2LEGAL / ÎNREGISTRAT\n\n' +
        '§8Eliberat de garnizoana Straja. Neprezentarea la control atrage confiscarea armei.'

    var rawJson = JSON.stringify({ text: pageText }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    var giveCmd = 'give ' + playerName +
        ' minecraft:written_book[minecraft:written_book_content={title:\'Permis Port-Arma ' + serial + '\',author:\'Gheorghe Comandantul\',pages:[\'' + rawJson + '\']}] 1'

    if (server) server.runCommandSilent(giveCmd)
    if (typeof player.swing === 'function') player.swing()
    if (!player.isCreative()) item.shrink(1)
    player.tell('§a[Permis] A fost eliberat permisul de port-armă pentru seria ' + serial + '!')
})
