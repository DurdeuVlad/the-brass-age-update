// Military Logistics & Bulk Transport Architecture (Replacing Coffers)
// Allows large quantities of firearms and munitions to be boxed into dense military transport crates
// for overland logistics via Trotting Wagons, Pack Mules, Create Trains, and Cartage.

ServerEvents.recipes(event => {
    // 1. Pack 8 Smoothbore Muskets into a Heavy Military Musket Crate
    // Uses 8 Muskets surrounding a sturdy chest/barrel banded with brass
    event.shaped('kubejs:crate_muskets', [
        'MMM',
        'MBM',
        'MMM'
    ], {
        M: Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15"}').weakNBT(),
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_musket_crate')

    // 2. Unpack Musket Crate back into 8 individual muskets
    event.shapeless([
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}'),
        'minecraft:chest'
    ], 'kubejs:crate_muskets').id('the_brass_age:unpack_musket_crate')

    // 3. Pack 8 Dragoon Pistols into an Officer Pistol Crate
    event.shaped('kubejs:crate_pistols', [
        'PPP',
        'PBP',
        'PPP'
    ], {
        P: Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p"}').weakNBT(),
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_pistol_crate')

    // 4. Unpack Pistol Crate back into 8 individual pistols
    event.shapeless([
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}'),
        'minecraft:chest'
    ], 'kubejs:crate_pistols').id('the_brass_age:unpack_pistol_crate')

    // 5. Heavy Ammunition Crate Packing & Unpacking (512 standard round balls)
    event.shaped('kubejs:ammunition_crate', [
        'AAA',
        'ABA',
        'AAA'
    ], {
        A: Item.of('tacz:ammo', '{AmmoId:"qkl:round_ball"}').weakNBT(),
        B: '#c:chests/wooden'
    }).id('the_brass_age:pack_ammunition_crate')

    event.shapeless([
        Item.of('tacz:ammo', 64, '{AmmoId:"qkl:round_ball"}'),
        Item.of('tacz:ammo', 64, '{AmmoId:"qkl:round_ball"}'),
        Item.of('tacz:ammo', 64, '{AmmoId:"qkl:round_ball"}'),
        Item.of('tacz:ammo', 64, '{AmmoId:"qkl:round_ball"}'),
        'minecraft:chest'
    ], 'kubejs:ammunition_crate').id('the_brass_age:unpack_ammunition_crate')
})

// World Unpacking: Shift-Right-Clicking a crate on the ground breaks the seal and dispenses weapons
ItemEvents.rightClicked('kubejs:crate_muskets', event => {
    const player = event.player
    if (!player || !player.isCrouching()) return

    event.item.shrink(1)
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.wood.break', 'players', 1.0, 0.9)
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.iron_trapdoor.open', 'players', 0.8, 1.2)

    for (let i = 0; i < 8; i++) {
        const musket = Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15",HasBulletInBarrel:1b,AmmoCount:0}')
        player.drop(musket, false)
    }
    player.give('minecraft:chest')
    player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Muschete! (8 muschete au fost descărcate)').bold(true))
})

ItemEvents.rightClicked('kubejs:crate_pistols', event => {
    const player = event.player
    if (!player || !player.isCrouching()) return

    event.item.shrink(1)
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.wood.break', 'players', 1.0, 0.9)
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.iron_trapdoor.open', 'players', 0.8, 1.2)

    for (let i = 0; i < 8; i++) {
        const pistol = Item.of('tacz:modern_kinetic_gun', '{GunId:"qkl:fk15p",HasBulletInBarrel:1b,AmmoCount:0}')
        player.drop(pistol, false)
    }
    player.give('minecraft:chest')
    player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Pistoale! (8 pistoale au fost descărcate)').bold(true))
})

ItemEvents.rightClicked('kubejs:ammunition_crate', event => {
    const player = event.player
    if (!player || !player.isCrouching()) return

    event.item.shrink(1)
    player.level().playSound(null, player.x, player.y, player.z, 'minecraft:block.wood.break', 'players', 1.0, 0.9)

    for (let i = 0; i < 4; i++) {
        player.drop(Item.of('tacz:ammo', 64, '{AmmoId:"qkl:round_ball"}'), false)
    }
    player.give('minecraft:chest')
    player.tell(Text.literal('§6[Logistică Militară] Ai desigilat o Ladă de Muniție! (256 cartușe descărcate)').bold(true))
})
