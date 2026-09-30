// ChocolateMan FK15 / FK15P ammunition: displayed as 16.5mm, ID qkl:16mm.
// Assemble four rounds in a powered 3x3 Create Mechanical Crafter grid.
// C = large bullet core, W = wad, G = gunpowder charge.
// Creatified provides the existing production recipes for all three ingredients.
ServerEvents.recipes(event => {
    event.remove({ id: 'qkl:ammo/16mm' })

    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            'CWC',
            'WGW',
            'CWC'
        ],
        key: {
            C: { item: 'tacz_c:large_bullet_core' },
            W: { item: 'tacz_c:wad' },
            G: { item: 'tacz_c:gunpowder_charge' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm' },
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/ammo_16mm')
})
