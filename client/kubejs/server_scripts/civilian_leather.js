// Civilian Commodity Line: Vitriol Heavy Leather Tanning
// Manufactured by P.U.L.A SRL for heavy military armor, boots, and cavalry saddles.

ServerEvents.recipes(event => {
    // Check item registry readiness
    if (!Item.exists('kubejs:vitriol_leather') || !Item.exists('kubejs:saltpeter')) {
        console.warn('[TheBrassAge] KubeJS vitriol leather / saltpeter not yet in registry; skipping recipe registration until next reboot.')
        return
    }

    // Tier 1: Manual Hide Scraping (Crafting Table)
    event.shaped('minecraft:leather', [
        ' F ',
        ' R ',
        '   '
    ], {
        F: 'minecraft:flint',
        R: 'minecraft:rotten_flesh'
    }).id('kubejs:civilian/leather_tier1_manual')

    // Tier 2: Create Bulk Washing & Roller Pressing (4x Cured Leather)
    event.custom({
        type: 'create:splashing',
        ingredients: [{ item: 'minecraft:rotten_flesh' }],
        results: [
            { id: 'minecraft:leather', count: 1 },
            { id: 'minecraft:leather', count: 1, chance: 0.5 }
        ]
    }).id('kubejs:civilian/leather_tier2_washing')

    // Tier 3: Heated Vitriol Acid Bath (8x Vitriol Heavy Leather)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:leather' },
            { item: 'minecraft:leather' },
            { item: 'butchery:sulfur' },
            { item: 'kubejs:saltpeter' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 500 }
        ],
        results: [
            { id: 'kubejs:vitriol_leather', count: 8 }
        ]
    }).id('kubejs:civilian/leather_tier3_vitriol')

    // Reinforced Cavalry & Military Equipment Crafting using Vitriol Leather
    event.shaped('minecraft:leather_horse_armor', [
        'L L',
        'LLL',
        'L L'
    ], {
        L: 'kubejs:vitriol_leather'
    }).id('kubejs:civilian/vitriol_horse_armor')

    event.shaped('minecraft:saddle', [
        'LLL',
        'I I',
        '   '
    ], {
        L: 'kubejs:vitriol_leather',
        I: 'minecraft:iron_nugget'
    }).id('kubejs:civilian/vitriol_saddle')
})
