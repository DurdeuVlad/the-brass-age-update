// Specialized Tactical Ordnance: Canister Scattershot & Incendiary Sulfur Ball
// Provides defensive close-quarters crowd dispersal and cavern illumination.

ServerEvents.recipes(event => {
    // 1. Canister Scattershot (8 Iron Pellets + Sabot + Powder Charge)
    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            'NNN',
            'NWN',
            'NGN'
        ],
        key: {
            N: { item: 'minecraft:iron_nugget' },
            W: { item: 'tacz_c:wad' },
            G: { item: 'tacz_c:gunpowder_charge' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm', CanisterAmmo: true },
                'minecraft:item_name': '{"text":"Glonț tip Mitralii (Canister)","color":"gold","bold":true,"italic":false}',
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/ammo_canister_scattershot')

    // 2. Incendiary Sulfur Ball (Sulfur + Core + Powder Charge)
    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            ' S ',
            'CGC',
            ' W '
        ],
        key: {
            S: { item: 'butchery:sulfur' },
            C: { item: 'tacz_c:large_bullet_core' },
            G: { item: 'tacz_c:gunpowder_charge' },
            W: { item: 'tacz_c:wad' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm', IncendiaryAmmo: true },
                'minecraft:item_name': '{"text":"Cartuș Incendiar cu Sulf","color":"red","bold":true,"italic":false}',
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/ammo_incendiary_sulfur')
})

// Note: Canister scattershot knockback & Incendiary burning hooks are managed by the unified
// tactical ammunition combat bridge in flintlock_ammo_silver_combat.js.

