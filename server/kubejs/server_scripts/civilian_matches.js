// Civilian Commodity Line: Friction Safety Matches & Matchboxes
// Manufactured by P.U.L.A SRL for all-weather ignition in karst caverns and domestic hearths.

ServerEvents.recipes(event => {
    // Tier 1: Manual Crude Matches (Crafting Table)
    event.shaped('kubejs:sulfur_matches', [
        ' S ',
        ' I ',
        ' I '
    ], {
        S: 'butchery:sulfur',
        I: 'minecraft:stick'
    }).id('kubejs:civilian/matches_tier1_manual')

    // Tier 2: Create Cutting & Dipping Line (16x Sulfur Matches)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:stick' },
            { item: 'minecraft:stick' },
            { item: 'butchery:sulfur' }
        ],
        results: [
            { id: 'kubejs:sulfur_matches', count: 16 }
        ]
    }).id('kubejs:civilian/matches_tier2_dipping')

    // Tier 3: Sequenced Assembly: Swedish Safety Matchbox (64x Safety Matches)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'minecraft:paper' },
        transitional_item: { item: 'minecraft:paper' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'minecraft:paper' },
                    { item: 'kubejs:sulfur_matches' }
                ],
                results: [{ id: 'minecraft:paper' }]
            },
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'minecraft:paper' },
                    { item: 'minecraft:redstone' }
                ],
                results: [{ id: 'minecraft:paper' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'minecraft:paper' }],
                results: [{ id: 'minecraft:paper' }]
            }
        ],
        results: [
            { id: 'kubejs:safety_matches', count: 64 }
        ],
        loops: 1
    }).id('kubejs:civilian/matches_tier3_safety_box')
})

// In-world utility: Right-clicking with Safety Matches lights campfires, candles, and creates fire
BlockEvents.rightClicked(event => {
    const item = event.item
    if (!item) return
    const isCrude = item.id === 'kubejs:sulfur_matches'
    const isSafety = item.id === 'kubejs:safety_matches'
    if (!isCrude && !isSafety) return

    const block = event.block
    const level = event.level
    const player = event.player
    const pos = block.pos

    // Check if clicked block is an unlit campfire or candle
    if (block.id.includes('campfire') || block.id.includes('candle')) {
        const props = block.properties
        if (props && props.lit === 'false') {
            block.set(block.id, Object.assign({}, props, { lit: 'true' }))
            player.swing()
            if (!player.isCreative()) item.shrink(1)
            level.playSound(null, pos.x, pos.y, pos.z, 'minecraft:item.flintandsteel.use', 'blocks', 1.0, 1.0)
            player.tell('§6[Foc] Ai aprins vatra cu chibritul de siguranță!')
            event.cancel()
        }
    }
})
