// Civilian Commodity Line: Antiseptic Medicated Sulfur Soap
// Manufactured by P.U.L.A SRL for medical sanitation, plague prevention, and hygiene.

ServerEvents.recipes(event => {
    // Check item registry readiness
    if (!Item.exists('kubejs:medicated_soap') || !Item.exists('kubejs:saltpeter')) {
        console.warn('[TheBrassAge] KubeJS medicated soap / saltpeter not yet in registry; skipping recipe registration until next reboot.')
        return
    }

    // Tier 1: Crude Manual Lard Soap (Crafting Table)
    event.shaped('kubejs:medicated_soap', [
        ' C ',
        ' F ',
        ' W '
    ], {
        C: 'minecraft:charcoal',
        F: 'minecraft:porkchop', // Or animal fat
        W: 'minecraft:water_bucket'
    }).id('kubejs:civilian/soap_tier1_manual')

    // Tier 2: Create Basin Mixing & Compacting (4x Soap)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:rotten_flesh' },
            { item: 'minecraft:charcoal' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 250 }
        ],
        results: [
            { id: 'kubejs:medicated_soap', count: 4 }
        ]
    }).id('kubejs:civilian/soap_tier2_mixing')

    // Tier 3: Heated Antiseptic Sulfur Saponification (16x Medicated Soap)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'butchery:sulfur' },
            { item: 'kubejs:saltpeter' },
            { item: 'minecraft:charcoal' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 500 }
        ],
        results: [
            { id: 'kubejs:medicated_soap', count: 16 }
        ]
    }).id('kubejs:civilian/soap_tier3_surge')
})

// In-world utility: Right-clicking with Medicated Soap washes away negative potion effects
ItemEvents.rightClicked('kubejs:medicated_soap', event => {
    const player = event.player
    const item = event.item
    const level = event.level

    // Remove negative effects
    const badEffects = [
        'minecraft:poison',
        'minecraft:hunger',
        'minecraft:weakness',
        'minecraft:slowness',
        'minecraft:mining_fatigue',
        'minecraft:nausea'
    ]

    let cleansed = false
    badEffects.forEach(effectId => {
        if (player.hasEffect(effectId)) {
            player.removeEffect(effectId)
            cleansed = true
        }
    })

    if (cleansed) {
        player.swing()
        if (!player.isCreative()) item.shrink(1)
        level.playSound(null, player.x, player.y, player.z, 'minecraft:item.honey_bottle.drink', 'players', 1.0, 1.2)
        player.tell('§e[Igienă] Te-ai spălat cu Săpun Medicinal cu Sulf. Miasmele și infecțiile au fost curățate!')
    } else {
        player.tell('§7[Igienă] Ești deja curat și nu ai infecții active.')
    }
})
