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
AnvilEvents.changeResult(event => {
    const left = event.left
    const right = event.right
    if (left.isEmpty() || right.isEmpty()) return
    if (String(left.id) !== 'tacz:modern_kinetic_gun' || String(right.id) !== 'kubejs:proof_stamp') return

    const customData = left.get('minecraft:custom_data')
    if (!customData) return

    const gunId = String(customData.GunId || '')
    if (gunId !== 'qkl:fk15' && gunId !== 'qkl:fk15p') return

    // Cannot re-proof an already legal gun
    if (customData.Proofed) {
        event.result = ItemStack.EMPTY
        return
    }

    // Cannot casually re-stamp a defaced black market gun
    if (customData.Defaced) {
        event.result = ItemStack.EMPTY
        return
    }

    const output = left.copy()
    const server = event.player.server
    const serial = getNextStrajaSerial(server)

    const tag = output.getOrCreateTag()
    tag.putBoolean('Proofed', true)
    tag.putString('Serial', serial)
    tag.remove('Defaced')

    // Add official Straja lore
    const lore = output.getOrCreateTagElement('display').getList('Lore', 8)
    lore.add(Text.of('§a✔ POANSONAT: ' + serial).toJson())
    lore.add(Text.of('§7Registrul Imperial Straja').toJson())
    output.getOrCreateTagElement('display').put('Lore', lore)

    event.result = output
    event.cost = 5 // Guild inspection cost in XP levels
})

// 4. Grindstone Defacing: Proofed Firearm -> Defaced Black Market Arm
GrindstoneEvents.changeResult(event => {
    const top = event.top
    if (top.isEmpty() || String(top.id) !== 'tacz:modern_kinetic_gun') return

    const customData = top.get('minecraft:custom_data')
    if (!customData) return

    // Only weapons with legal proofing have serial numbers to file off!
    if (!customData.Proofed) {
        event.result = ItemStack.EMPTY
        return
    }

    const output = top.copy()
    const tag = output.getOrCreateTag()
    tag.putBoolean('Proofed', false)
    tag.putBoolean('Defaced', true)
    tag.remove('Serial')

    // Remove old proofing lore and apply defaced warning
    const lore = output.getOrCreateTagElement('display').getList('Lore', 8)
    for (let i = lore.size() - 1; i >= 0; i--) {
        const line = lore.getString(i)
        if (line.includes('POANSONAT') || line.includes('Registrul')) {
            lore.remove(i)
        }
    }
    lore.add(Text.of('§4⚠ [SERIE PILITĂ / DEFACED]').toJson())
    lore.add(Text.of('§cArmă de contrabandă!').toJson())
    output.getOrCreateTagElement('display').put('Lore', lore)

    event.result = output
})

// 5. Permit Binding: Right-clicking Permit Blank with Proofed Weapon in Offhand
ItemEvents.rightClicked('kubejs:permit_blank', event => {
    const player = event.player
    const item = event.item
    const offhand = player.getOffhandItem()

    if (offhand.isEmpty() || String(offhand.id) !== 'tacz:modern_kinetic_gun') {
        player.tell('§e[Permis] Plasează o armă poansonată în mâna stângă (offhand) pentru a-i elibera permisul.')
        return
    }

    const gunData = offhand.get('minecraft:custom_data')
    if (!gunData || !gunData.Proofed || !gunData.Serial) {
        player.tell('§c[Permis] Arma din mâna stângă nu este poansonată legal! Nu se poate emite permis.')
        return
    }

    const serial = String(gunData.Serial)
    const permitBook = Item.of('minecraft:written_book')
    const bookTag = permitBook.getOrCreateTag()
    bookTag.putString('title', 'Permis Port-Armă ' + serial)
    bookTag.putString('author', 'Gheorghe Comandantul')
    bookTag.putInt('generation', 0)

    const pages = bookTag.getList('pages', 8)
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
