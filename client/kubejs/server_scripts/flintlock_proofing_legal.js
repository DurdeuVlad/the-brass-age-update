// Legal Provenance, Royal Proofing & Black Market State Machine Engine
// Implements serialization (#RC-15-XXXX), anvil proofing rituals, grindstone defacing, and anti-forgery.

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
        if (left.isEmpty() || right.isEmpty()) return
        if (String(left.id) !== 'tacz:modern_kinetic_gun' || String(right.id) !== 'kubejs:proof_stamp') return

        var customData = left.get('minecraft:custom_data')
        if (!customData) return

        var gunId = String(customData.GunId || '')
        if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

        // Cannot re-proof an already legal gun
        if (customData.Proofed) {
            event.setOutput(ItemStack.EMPTY)
            return
        }

        // Cannot casually re-stamp a defaced black market gun
        if (customData.Defaced) {
            event.setOutput(ItemStack.EMPTY)
            return
        }

        var output = left.copy()
        var player = event.getPlayer()
        if (!player) return
        var server = player.getServer()
        if (!server) return
        var serial = getNextStrajaSerial(server)

        var tag = output.getOrCreateTag()
        tag.putBoolean('Proofed', true)
        tag.putString('Serial', serial)
        tag.remove('Defaced')

        // Add official Straja lore
        var lore = output.getOrCreateTagElement('display').getList('Lore', 8)
        lore.add(Text.of('§a✔ POANSONAT: ' + serial).toJson())
        lore.add(Text.of('§7Registrul Imperial Straja').toJson())
        output.getOrCreateTagElement('display').put('Lore', lore)

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
        if (top.isEmpty() || String(top.id) !== 'tacz:modern_kinetic_gun') return

        var customData = top.get('minecraft:custom_data')
        if (!customData) return

        if (!customData.Proofed) return

        var output = top.copy()
        var tag = output.getOrCreateTag()
        tag.putBoolean('Proofed', false)
        tag.putBoolean('Defaced', true)
        tag.remove('Serial')

        var lore = output.getOrCreateTagElement('display').getList('Lore', 8)
        for (var i = lore.size() - 1; i >= 0; i--) {
            var line = lore.getString(i)
            if (line.includes('POANSONAT') || line.includes('Registrul')) {
                lore.remove(i)
            }
        }
        lore.add(Text.of('§4⚠ [SERIE PILITĂ / DEFACED]').toJson())
        lore.add(Text.of('§cArmă de contrabandă!').toJson())
        output.getOrCreateTagElement('display').put('Lore', lore)

        event.setNewTopItem(output)
    })
}

// 5. Permit Binding: Right-clicking Permit Blank with Proofed Weapon in Offhand
ItemEvents.rightClicked('kubejs:permit_blank', event => {
    var player = event.player
    var item = event.item
    var offhand = player.getOffhandItem()

    if (offhand.isEmpty() || String(offhand.id) !== 'tacz:modern_kinetic_gun') {
        player.tell('§e[Permis] Plasează o armă poansonată în mâna stângă (offhand) pentru a-i elibera permisul.')
        return
    }

    var gunData = offhand.get('minecraft:custom_data')
    if (!gunData || !gunData.Proofed || !gunData.Serial) {
        player.tell('§c[Permis] Arma din mâna stângă nu este poansonată legal! Nu se poate emite permis.')
        return
    }

    var serial = String(gunData.Serial)
    var permitBook = Item.of('minecraft:written_book')
    var bookTag = permitBook.getOrCreateTag()
    bookTag.putString('title', 'Permis Port-Armă ' + serial)
    bookTag.putString('author', 'Gheorghe Comandantul')
    bookTag.putInt('generation', 0)

    var pages = bookTag.getList('pages', 8)
    pages.add(Text.of(
        '§6§lPERMIS DE PORT-ARMĂ§r\n\n' +
        '§0Posesor: §1' + player.name.string + '\n' +
        '§0Serie Armă: §2' + serial + '\n' +
        '§0Model: §0Flintlock 16.5mm\n' +
        '§0Statut: §2LEGAL / ÎNREGISTRAT\n\n' +
        '§8Eliberat de garnizoana Straja. Neprezentarea la control atrage confiscarea armei.'
    ).toJson())
    bookTag.put('pages', pages)

    player.swing()
    if (!player.isCreative()) item.shrink(1)
    player.give(permitBook)
    player.tell('§a[Permis] A fost eliberat permisul de port-armă pentru seria ' + serial + '!')
})
