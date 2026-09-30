// Civilian Commodity Line: Miracle Super-Phosphate Agricultural Fertilizer
// Manufactured by P.U.L.A SRL for grain, vineyard, and vegetable plantations.

ServerEvents.recipes(event => {
    // Tier 1: Manual Farmyard Compost
    event.shaped('kubejs:miracle_fertilizer', [
        ' B ',
        'BDB',
        ' B '
    ], {
        B: 'minecraft:bone_meal',
        D: 'minecraft:dirt'
    }).id('kubejs:civilian/fertilizer_tier1_manual')

    // Tier 2: Create Basin Mixing (4x Fertilizer)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'kubejs:crushed_dripstone' },
            { item: 'minecraft:bone_meal' },
            { item: 'minecraft:bone_meal' },
            { type: 'create:fluid_stack', fluid: 'minecraft:water', amount: 250 }
        ],
        results: [
            { id: 'kubejs:miracle_fertilizer', count: 4 }
        ]
    }).id('kubejs:civilian/fertilizer_tier2_mixing')

    // Tier 3: Heated Thermodynamic Super-Phosphate Surge (16x Miracle Fertilizer)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'butchery:sulfur' },
            { item: 'minecraft:bone_meal' },
            { type: 'create:fluid_stack', fluid: 'minecraft:water', amount: 500 }
        ],
        results: [
            { id: 'kubejs:miracle_fertilizer', count: 16 }
        ]
    }).id('kubejs:civilian/fertilizer_tier3_surge')
})

// In-world utility: Right-clicking crops with Miracle Fertilizer accelerates 3x3 plant growth
BlockEvents.rightClicked(event => {
    const player = event.player
    const item = event.item
    if (!item || item.id !== 'kubejs:miracle_fertilizer') return

    const block = event.block
    const level = event.level
    const pos = block.pos

    // Apply bone meal effect in a 3x3 area around the clicked block
    let applied = false
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const targetPos = pos.offset(dx, 0, dz)
            const targetBlock = level.getBlock(targetPos)
            if (targetBlock.hasTag('minecraft:crops') || targetBlock.id.includes('crop') || targetBlock.id.includes('bush') || targetBlock.id.includes('sapling')) {
                // Advance age property if available
                const properties = targetBlock.properties
                if (properties && properties.age !== undefined) {
                    const currentAge = parseInt(properties.age)
                    targetBlock.set(targetBlock.id, { age: String(Math.min(7, currentAge + 2)) })
                    applied = true
                }
            }
        }
    }

    if (applied) {
        player.swing()
        if (!player.isCreative()) item.shrink(1)
        level.playSound(null, pos.x, pos.y, pos.z, 'minecraft:item.bone_meal.use', 'blocks', 1.0, 1.0)
        player.tell('§a[Agricultură] Super-Fosfatul a stimulat rodirea culturilor în jur!')
    }
})
