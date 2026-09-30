// 3-Tier Factorio Industrial Gunpowder & Nitrate Refining Chains
// Disables creeper mob-farm bypasses and rewards industrial automation scaling.

ServerEvents.recipes(event => {
    // 0. Exploit Remediation: Remove unearned gunpowder shortcuts
    event.remove({ id: 'tacz_c:gunpowder_cake_mix' })
    event.remove({ id: 'tacz_c:gunpowder_cake' })

    // 1. Raw Nitrates Extraction
    // Crushing Wheels: Dripstone blocks -> Crushed Dripstone
    event.custom({
        type: 'create:crushing',
        ingredients: [{ item: 'minecraft:dripstone_block' }],
        results: [
            { id: 'kubejs:crushed_dripstone', count: 2 },
            { id: 'kubejs:crushed_dripstone', count: 1, chance: 0.5 }
        ],
        processing_time: 250
    }).id('kubejs:flintlocks/crush_dripstone_block')

    event.custom({
        type: 'create:crushing',
        ingredients: [{ item: 'minecraft:pointed_dripstone' }],
        results: [
            { id: 'kubejs:crushed_dripstone', count: 1 },
            { id: 'kubejs:crushed_dripstone', count: 1, chance: 0.25 }
        ],
        processing_time: 150
    }).id('kubejs:flintlocks/crush_pointed_dripstone')

    // Bulk Washing (Splashing): Crushed Dripstone -> Purified Saltpeter
    event.custom({
        type: 'create:splashing',
        ingredients: [{ item: 'kubejs:crushed_dripstone' }],
        results: [
            { id: 'kubejs:saltpeter', count: 1 },
            { id: 'kubejs:saltpeter', count: 1, chance: 0.5 }
        ]
    }).id('kubejs:flintlocks/wash_saltpeter')

    // 2. Tier 1 (Desperation Crafting)
    // Handcrafting crude powder cake in crafting table
    event.shaped('kubejs:crude_gunpowder_cake', [
        'BCB',
        'CWC',
        'BCB'
    ], {
        B: 'minecraft:bone_meal',
        C: 'minecraft:charcoal',
        W: 'minecraft:water_bucket'
    }).replaceCraftingIngredients({ item: 'minecraft:water_bucket' }, 'minecraft:bucket')
      .id('kubejs:flintlocks/crude_cake_bucket')

    event.shaped('kubejs:crude_gunpowder_cake', [
        'BCB',
        'CWC',
        'BCB'
    ], {
        B: 'minecraft:bone_meal',
        C: 'minecraft:charcoal',
        W: 'minecraft:potion' // Water bottle
    }).id('kubejs:flintlocks/crude_cake_bottle')

    // Drying crude cake into single gunpowder charges
    event.smoking('tacz_c:gunpowder_charge', 'kubejs:crude_gunpowder_cake')
        .cookingTime(200).xp(0.1).id('kubejs:flintlocks/dry_crude_cake_smoker')
    event.campfireCooking('tacz_c:gunpowder_charge', 'kubejs:crude_gunpowder_cake')
        .cookingTime(600).xp(0.1).id('kubejs:flintlocks/dry_crude_cake_campfire')
    event.smelting('tacz_c:gunpowder_charge', 'kubejs:crude_gunpowder_cake')
        .cookingTime(300).xp(0.1).id('kubejs:flintlocks/dry_crude_cake_furnace')

    // 3. Tier 2 (Kinetic Mechanical Line)
    // Basin Mixing: Saltpeter + Charcoal + Water -> Wet Powder Mass
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'minecraft:charcoal' },
            { item: 'minecraft:charcoal' },
            { type: 'create:fluid_stack', fluid: 'minecraft:water', amount: 250 }
        ],
        results: [
            { id: 'kubejs:wet_powder_mass', count: 1 }
        ]
    }).id('kubejs:flintlocks/tier2_wet_powder_mixing')

    // Compacting Press: Wet Powder Mass -> 4x Gunpowder Charges
    event.custom({
        type: 'create:compacting',
        ingredients: [
            { item: 'kubejs:wet_powder_mass' }
        ],
        results: [
            { id: 'tacz_c:gunpowder_charge', count: 4 }
        ]
    }).id('kubejs:flintlocks/tier2_compact_gunpowder')

    // 4. Tier 3 (Thermodynamic Sulfur Surge)
    // Heated Basin Mixing with Straja Sulfur -> 16x Gunpowder Charges (400% surge)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'minecraft:charcoal' },
            { item: 'minecraft:charcoal' },
            { item: 'butchery:sulfur' },
            { type: 'create:fluid_stack', fluid: 'minecraft:water', amount: 500 }
        ],
        results: [
            { id: 'tacz_c:gunpowder_charge', count: 16 }
        ]
    }).id('kubejs:flintlocks/tier3_sulfur_powder_surge')
})
