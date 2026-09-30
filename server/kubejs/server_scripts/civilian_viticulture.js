// Civilian Commodity Line: Viticulture Cask Fumigation Strips (Vinery & Wine Preservation)
// Manufactured by P.U.L.A SRL for commercial vineyard and cellaring operations.

ServerEvents.recipes(event => {
    // Check item registry readiness
    if (!Item.exists('kubejs:fumigation_strip') || !Item.exists('kubejs:royal_fumigation_strip')) {
        console.warn('[TheBrassAge] KubeJS fumigation strip items not yet initialized in registry; skipping recipe registration until next reboot.')
        return
    }

    // Tier 1: Manual Sulfur Wick (Crafting Table)
    event.shaped('kubejs:fumigation_strip', [
        ' S ',
        ' P ',
        ' S '
    ], {
        S: 'butchery:sulfur',
        P: 'minecraft:paper'
    }).id('kubejs:civilian/viticulture_tier1_manual')

    // Tier 2: Create Kinetic Basin Mixing (4x Strips)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:paper' },
            { item: 'minecraft:paper' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 250 }
        ],
        results: [
            { id: 'kubejs:fumigation_strip', count: 4 }
        ]
    }).id('kubejs:civilian/viticulture_tier2_mixing')


    // Tier 3: Sequenced Assembly (Royal Vintage Cask Strips - 16x)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'kubejs:fumigation_strip' },
        transitional_item: { id: 'kubejs:fumigation_strip' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'kubejs:fumigation_strip' },
                    { item: 'minecraft:sweet_berries' }
                ],
                results: [{ id: 'kubejs:fumigation_strip' }]
            },
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'kubejs:fumigation_strip' },
                    { item: 'butchery:sulfur' }
                ],
                results: [{ id: 'kubejs:fumigation_strip' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'kubejs:fumigation_strip' }],
                results: [{ id: 'kubejs:fumigation_strip' }]
            }
        ],
        results: [
            { id: 'kubejs:royal_fumigation_strip', count: 16 }
        ],
        loops: 1
    }).id('kubejs:civilian/viticulture_tier3_royal')
})

// In-world utility: Fumigation strips can be used on wine barrels or wooden storage to sterilize
ItemEvents.rightClicked('kubejs:royal_fumigation_strip', event => {
    const player = event.player
    const level = event.level
    player.swing()
    level.playSound(null, player.x, player.y, player.z, 'minecraft:block.fire.ambient', 'players', 0.8, 1.2)
    player.tell('§5[Viticultură] Butoiul a fost sterilizat cu fitil regal de sulf. Calitatea vinului este garantată!')
})
