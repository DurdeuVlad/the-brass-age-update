// Legal Provenance, Royal Proofing & Black Market State Machine Engine
// Implements serialization (#RC-15-XXXX), anvil proofing rituals, grindstone defacing, and anti-forgery.

var $FP_BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var $FP_DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var $FP_CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
var $FP_ItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
var $FP_Component = Java.loadClass('net.minecraft.network.chat.Component')
var $FP_ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
var $FP_ArrayList = Java.loadClass('java.util.ArrayList')

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
        if (data) return data.copyTag()
    } catch (e) {}
    try {
        var c = stack.get('minecraft:custom_data')
        if (c && typeof c.copyTag === 'function') return c.copyTag()
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
    let current = server.persistentData.getInt('StrajaSerialCount')
    if (!current || current < 100) current = 100
    const next = current + 1
    server.persistentData.putInt('StrajaSerialCount', next)
    const padded = String(next).padStart(4, '0')
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

// 4. Grindstone Defacing: Proofed Firearm -> Defaced Black Market Arm
var $GrindstoneTakeEvent = null
try {
    $GrindstoneTakeEvent = Java.loadClass('net.neoforged.neoforge.event.GrindstoneEvent$OnTakeItem')
} catch (e) {}

if ($GrindstoneTakeEvent && typeof NativeEvents !== 'undefined') {
    NativeEvents.onEvent($GrindstoneTakeEvent, function(event) {
        var top = event.getTopItem()
        if (!top || top.isEmpty() || fpGetStackId(top) !== 'tacz:modern_kinetic_gun') return

        var tag = fpGetGunCustomTag(top)
        if (!tag || !tag.getBoolean('Proofed')) return

        var output = top.copy()
        var newTag = tag.copy()
        newTag.putBoolean('Proofed', false)
        newTag.putBoolean('Defaced', true)
        newTag.remove('Serial')
        output.set($FP_DataComponents.CUSTOM_DATA, $FP_CustomData.of(newTag))

        var loreList = new $FP_ArrayList()
        loreList.add($FP_Component.literal('§4⚠ [SERIE PILITĂ / DEFACED]'))
        loreList.add($FP_Component.literal('§cArmă de contrabandă!'))
        output.set($FP_DataComponents.LORE, new $FP_ItemLore(loreList))

        event.setNewTopItem(output)
    })
}

// 5. Permit Binding: Right-clicking Permit Blank with Proofed Weapon in Offhand
ItemEvents.rightClicked(event => {
    var item = event.getItem()
    if (!item || fpGetStackId(item) !== 'kubejs:permit_blank') return
    console.info('[Permit] rightClicked fired for permit_blank!')
    var player = event.getPlayer()
    var offhand = player.getOffhandItem ? player.getOffhandItem() : player.offhandItem
    console.info('[Permit] offhand: ' + offhand + ', id: ' + fpGetStackId(offhand))

    if (!offhand || offhand.isEmpty() || fpGetStackId(offhand) !== 'tacz:modern_kinetic_gun') {
        player.tell('§e[Permis] Plasează o armă poansonată în mâna stângă (offhand) pentru a-i elibera permisul.')
        return
    }

    var tag = fpGetGunCustomTag(offhand)
    console.info('[Permit] tag: ' + tag)
    if (!tag || !tag.getBoolean('Proofed') || !tag.getString('Serial')) {
        player.tell('§c[Permis] Arma din mâna stângă nu este poansonată legal! Nu se poate emite permis.')
        return
    }

    var serial = String(tag.getString('Serial'))
    var playerName = player.username ? String(player.username) : String(player.getName().getString())
    console.info('[Permit] emitting permit for serial ' + serial + ' to player ' + playerName)

    var pageText = '§6§lPERMIS DE PORT-ARMĂ§r\n\n' +
        '§0Posesor: §1' + playerName + '\n' +
        '§0Serie Armă: §2' + serial + '\n' +
        '§0Model: §0Flintlock 16.5mm\n' +
        '§0Statut: §2LEGAL / ÎNREGISTRAT\n\n' +
        '§8Eliberat de garnizoana Straja. Neprezentarea la control atrage confiscarea armei.'

    var rawJson = JSON.stringify({ text: pageText }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    var giveCmd = 'give ' + playerName +
        ' minecraft:written_book[minecraft:written_book_content={title:\'Permis Port-Arma ' + serial + '\',author:\'Gheorghe Comandantul\',pages:[\'' + rawJson + '\']}] 1'

    event.server.runCommandSilent(giveCmd)
    player.swing()
    if (!player.isCreative()) item.shrink(1)
    player.tell('§a[Permis] A fost eliberat permisul de port-armă pentru seria ' + serial + '!')
})
