// Military Logistics & Bulk Transport Architecture (Replacing Coffers)
// Allows large quantities of firearms and munitions to be boxed into dense military transport crates
// for overland logistics via Trotting Wagons, Pack Mules, Create Trains, and Cartage.

ServerEvents.recipes(event => {
    // 1. Pack 8 Smoothbore Muskets into a Heavy Military Musket Crate
    event.shaped('kubejs:crate_muskets', [
        'MMM',
        'MBM',
        'MMM'
    ], {
        M: 'tacz:modern_kinetic_gun',
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_musket_crate')

    // 2. Pack 8 Dragoon Pistols into an Officer Pistol Crate
    event.shaped('kubejs:crate_pistols', [
        'PPP',
        'PBP',
        'PPP'
    ], {
        P: 'tacz:modern_kinetic_gun',
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_pistol_crate')

    // 3. Heavy Ammunition Crate Packing (256 standard round balls)
    event.shaped('kubejs:ammunition_crate', [
        'AAA',
        'ABA',
        'AAA'
    ], {
        A: 'tacz:ammo',
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_ammunition_crate')
})

// Shared Unpack Logic: handles unpacking crates whether clicked in air or on ground/blocks
function unpackLogisticsCrate(player, stack, crateType) {
    if (!player) return false
    if (!stack || stack.isEmpty()) return false

    if (!player.isCreative()) {
        stack.shrink(1)
    }
    var server = player.getServer ? player.getServer() : player.server
    if (server) {
        var x = player.x.toFixed(1)
        var y = player.y.toFixed(1)
        var z = player.z.toFixed(1)
        server.runCommandSilent('playsound minecraft:block.wood.break player @a ' + x + ' ' + y + ' ' + z + ' 1.0 0.9')
        server.runCommandSilent('playsound minecraft:block.iron_trapdoor.open player @a ' + x + ' ' + y + ' ' + z + ' 0.8 1.2')
    }

    if (crateType === 'muskets') {
        for (var i = 0; i < 8; i++) {
            var musket = Item.of('tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15"}]')
            player.drop(musket, false)
        }
        player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Muschete! (8 muschete descărcate)').bold(true))
    } else if (crateType === 'pistols') {
        for (var i = 0; i < 8; i++) {
            var pistol = Item.of('tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p"}]')
            player.drop(pistol, false)
        }
        player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Pistoale! (8 pistoale descărcate)').bold(true))
    } else if (crateType === 'ammo') {
        for (var i = 0; i < 4; i++) {
            player.drop(Item.of('tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm"}]', 64), false)
        }
        player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Muniție! (256 cartușe 16.5mm descărcate)').bold(true))
    }
    player.give('minecraft:chest')
    return true
}

// Air Unpacking (Right-Click in air)
ItemEvents.rightClicked('kubejs:crate_muskets', event => {
    if (unpackLogisticsCrate(event.player, event.item, 'muskets')) event.cancel()
})

ItemEvents.rightClicked('kubejs:crate_pistols', event => {
    if (unpackLogisticsCrate(event.player, event.item, 'pistols')) event.cancel()
})

ItemEvents.rightClicked('kubejs:ammunition_crate', event => {
    if (unpackLogisticsCrate(event.player, event.item, 'ammo')) event.cancel()
})

// Ground/Block Unpacking (Right-Click on ground / any block)
BlockEvents.rightClicked(event => {
    const player = event.player
    if (!player) return
    const item = event.item
    if (!item || item.isEmpty()) return

    var id = ''
    try {
        id = String(Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').ITEM.getKey(item.getItem())).toLowerCase()
    } catch (e) {
        id = String(item.id || '').toLowerCase()
    }
    if (id === 'kubejs:crate_muskets') {
        if (unpackLogisticsCrate(player, item, 'muskets')) event.cancel()
    } else if (id === 'kubejs:crate_pistols') {
        if (unpackLogisticsCrate(player, item, 'pistols')) event.cancel()
    } else if (id === 'kubejs:ammunition_crate') {
        if (unpackLogisticsCrate(player, item, 'ammo')) event.cancel()
    }
})
