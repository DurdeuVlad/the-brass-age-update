// ============================================================================
// Overworld Netherless Pyrotechnics & 3-Tier Industrial Nether Alchemy
// ----------------------------------------------------------------------------
// Implements complete closed-loop progression for all Nether materials
// following the standardized 3-Tier Industrial architecture:
//   Tier 1: Desperation / Manual Crafting (1x base yield, table/furnace/sandpaper)
//   Tier 2: Kinetic Mechanical Automation (2x-4x yield, unheated Create basins/fans)
//   Tier 3: Thermodynamic Sulfur Surge (8x-16x yield, 400%+ surge, heated basins & sequenced lines)
// ============================================================================

ServerEvents.recipes(event => {

    // ========================================================================
    // LINE 1: NETHERRACK & CINDER FLOUR PRECURSORS
    // ========================================================================

    // Tier 1: Desperation Workbench Alchemy (1x Netherrack)
    event.shapeless('minecraft:netherrack', [
        'minecraft:cobblestone',
        'minecraft:redstone',
        'minecraft:lava_bucket'
    ]).replaceIngredient('minecraft:lava_bucket', 'minecraft:bucket')
    .id('kubejs:alchemy/netherrack_tier1_manual')

    // Tier 2: Kinetic Unheated Basin Mixing (2x Netherrack)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:cobblestone' },
            { item: 'minecraft:redstone' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:netherrack', count: 2 }
        ]
    }).id('kubejs:alchemy/netherrack_tier2_kinetic')

    // Tier 3: Thermodynamic Sulfur Surge (8x Netherrack - 400% surge!)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:cobblestone' },
            { item: 'minecraft:cobblestone' },
            { item: 'minecraft:cobblestone' },
            { item: 'minecraft:cobblestone' },
            { item: 'minecraft:redstone' },
            { item: 'minecraft:redstone' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:netherrack', count: 8 }
        ]
    }).id('kubejs:alchemy/netherrack_tier3_sulfur_surge')

    // Cinder Flour Milling / Crushing
    event.custom({
        type: 'create:crushing',
        ingredients: [{ item: 'minecraft:netherrack' }],
        results: [
            { id: 'create:cinder_flour', count: 1 },
            { id: 'create:cinder_flour', count: 1, chance: 0.5 }
        ],
        processing_time: 150
    }).id('kubejs:alchemy/cinder_flour_crushing')


    // ========================================================================
    // LINE 2: MAGMA CREAM & THERMAL MATRIX
    // ========================================================================

    // Tier 1: Manual Mortar Synthesis (1x Magma Cream)
    event.shapeless('minecraft:magma_cream', [
        'minecraft:slime_ball',
        'butchery:sulfur'
    ]).id('kubejs:alchemy/magma_cream_tier1_manual')

    // Tier 2: Kinetic Basin Emulsion (3x Magma Cream)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:magma_cream', count: 3 }
        ]
    }).id('kubejs:alchemy/magma_cream_tier2_kinetic')

    // Tier 3: Heated Thermodynamic Emulsion Surge (12x Magma Cream - 400% surge!)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'kubejs:saltpeter' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:magma_cream', count: 12 }
        ]
    }).id('kubejs:alchemy/magma_cream_tier3_sulfur_surge')


    // ========================================================================
    // LINE 3: RENEWABLE FIRE CHARGES
    // ========================================================================

    const powderItem = Item.exists('tacz_c:gunpowder_charge') ? 'tacz_c:gunpowder_charge' : 'minecraft:gunpowder'

    // Tier 1: Field Powder Blending (3x Fire Charges)
    event.shapeless('3x minecraft:fire_charge', [
        powderItem,
        'minecraft:charcoal',
        'kubejs:saltpeter'
    ]).id('kubejs:alchemy/fire_charge_tier1_manual_powder')

    event.shapeless('3x minecraft:fire_charge', [
        'butchery:sulfur',
        'minecraft:coal',
        'kubejs:saltpeter'
    ]).id('kubejs:alchemy/fire_charge_tier1_manual_sulfur')

    // Tier 2: Kinetic Basin Compounding (8x Fire Charges)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: powderItem },
            { item: powderItem },
            { item: 'minecraft:charcoal' },
            { item: 'minecraft:charcoal' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:fire_charge', count: 8 }
        ]
    }).id('kubejs:alchemy/fire_charge_tier2_kinetic')

    // Tier 3: Sequenced Pyrotechnic Assembly (16x Fire Charges)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'minecraft:charcoal' },
        transitional_item: { id: 'minecraft:charcoal' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'minecraft:charcoal' },
                    { item: 'butchery:sulfur' }
                ],
                results: [{ id: 'minecraft:charcoal' }]
            },
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'minecraft:charcoal' },
                    { item: 'kubejs:saltpeter' }
                ],
                results: [{ id: 'minecraft:charcoal' }]
            },
            {
                type: 'create:filling',
                ingredients: [
                    { item: 'minecraft:charcoal' },
                    { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 50 }
                ],
                results: [{ id: 'minecraft:charcoal' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'minecraft:charcoal' }],
                results: [{ id: 'minecraft:charcoal' }]
            }
        ],
        results: [
            { id: 'minecraft:fire_charge', count: 16 }
        ],
        loops: 1
    }).id('kubejs:alchemy/fire_charge_tier3_sequenced')


    // ========================================================================
    // LINE 4: SOUL SAND & SOUL SOIL GEOLOGY
    // ========================================================================

    // Tier 1: Desperation Mortar Soil (1x Soul Sand / Soul Soil)
    event.shapeless('minecraft:soul_sand', [
        'minecraft:sand',
        'minecraft:bone_meal',
        'minecraft:charcoal',
        'minecraft:dirt'
    ]).id('kubejs:alchemy/soul_sand_tier1_manual')

    event.shapeless('minecraft:soul_soil', [
        'minecraft:dirt',
        'minecraft:bone_meal',
        'minecraft:charcoal',
        'minecraft:sand'
    ]).id('kubejs:alchemy/soul_soil_tier1_manual')

    // Tier 2: Kinetic Mineral Infusion (4x Soul Sand / Soul Soil)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:sand' },
            { item: 'minecraft:sand' },
            { item: 'minecraft:bone_meal' },
            { item: 'minecraft:bone_meal' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:soul_sand', count: 4 }
        ]
    }).id('kubejs:alchemy/soul_sand_tier2_kinetic')

    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:dirt' },
            { item: 'minecraft:dirt' },
            { item: 'minecraft:bone_meal' },
            { item: 'minecraft:bone_meal' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:soul_soil', count: 4 }
        ]
    }).id('kubejs:alchemy/soul_soil_tier2_kinetic')

    // Tier 3: Heated Thermodynamic Sulfur Surge (16x Soul Sand / Soul Soil - 400% surge!)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:sand' },
            { item: 'minecraft:sand' },
            { item: 'minecraft:sand' },
            { item: 'minecraft:sand' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:soul_sand', count: 16 }
        ]
    }).id('kubejs:alchemy/soul_sand_tier3_sulfur_surge')

    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:dirt' },
            { item: 'minecraft:dirt' },
            { item: 'minecraft:dirt' },
            { item: 'minecraft:dirt' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:soul_soil', count: 16 }
        ]
    }).id('kubejs:alchemy/soul_soil_tier3_sulfur_surge')


    // ========================================================================
    // LINE 5: NETHER QUARTZ EXTRACTION
    // ========================================================================

    // Tier 1: Manual Flint Pounding (1x Quartz)
    event.shapeless('minecraft:quartz', [
        'minecraft:soul_sand',
        'minecraft:flint',
        'minecraft:iron_nugget'
    ]).id('kubejs:alchemy/quartz_tier1_manual')

    // Tier 2: Kinetic Bulk Washing (1x Quartz + 25% Gold Nugget)
    event.custom({
        type: 'create:splashing',
        ingredients: [{ item: 'minecraft:soul_sand' }],
        results: [
            { id: 'minecraft:quartz', count: 1 },
            { id: 'minecraft:gold_nugget', count: 1, chance: 0.25 }
        ]
    }).id('kubejs:alchemy/quartz_tier2_washing')

    // Tier 3: Industrial Crushing Wheels (2-3x Quartz + 2x Gold Nuggets + Cinder)
    event.custom({
        type: 'create:crushing',
        ingredients: [{ item: 'minecraft:soul_sand' }],
        results: [
            { id: 'minecraft:quartz', count: 2 },
            { id: 'minecraft:quartz', count: 1, chance: 0.5 },
            { id: 'minecraft:gold_nugget', count: 2, chance: 0.5 },
            { id: 'create:cinder_flour', count: 1, chance: 0.25 }
        ],
        processing_time: 150
    }).id('kubejs:alchemy/quartz_tier3_crushing')


    // ========================================================================
    // LINE 6: COAL RODS & BLAZE RODS
    // ========================================================================

    // Coal Rod Sandpaper Polishing (Create Standard)
    event.custom({
        type: 'create:sandpaper_polishing',
        ingredients: [{ item: 'minecraft:coal' }],
        results: [{ id: 'kubejs:coal_rod' }]
    }).id('kubejs:alchemy/coal_rod_polishing_coal')

    event.custom({
        type: 'create:sandpaper_polishing',
        ingredients: [{ item: 'minecraft:charcoal' }],
        results: [{ id: 'kubejs:coal_rod' }]
    }).id('kubejs:alchemy/coal_rod_polishing_charcoal')

    // Manual Crafting Table Sandpaper Polishing
    const sandPaperItem = Item.exists('create:sand_paper') ? 'create:sand_paper' : (Item.exists('create:sandpaper') ? 'create:sandpaper' : 'minecraft:paper')
    event.shapeless('kubejs:coal_rod', ['minecraft:coal', sandPaperItem]).id('kubejs:alchemy/coal_rod_manual_coal')
    event.shapeless('kubejs:coal_rod', ['minecraft:charcoal', sandPaperItem]).id('kubejs:alchemy/coal_rod_manual_charcoal')

    // Tier 1: Manual Pyrotechnic Rod Lashing (1x Blaze Rod)
    event.shapeless('minecraft:blaze_rod', [
        'kubejs:coal_rod',
        'minecraft:fire_charge',
        'minecraft:fire_charge',
        'minecraft:magma_cream'
    ]).id('kubejs:alchemy/blaze_rod_tier1_manual')

    // Stick-based fallback for immediate testing prior to full restart
    event.shapeless('minecraft:blaze_rod', [
        'minecraft:stick',
        'minecraft:coal',
        'minecraft:fire_charge',
        'minecraft:magma_cream'
    ]).id('kubejs:alchemy/blaze_rod_tier1_stick_fallback')

    // Tier 2: Kinetic Basin Infusion (2x Blaze Rods)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'kubejs:coal_rod' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:blaze_rod', count: 2 }
        ]
    }).id('kubejs:alchemy/blaze_rod_tier2_kinetic')

    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:stick' },
            { item: 'minecraft:coal' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 250 }
        ],
        results: [
            { id: 'minecraft:blaze_rod', count: 2 }
        ]
    }).id('kubejs:alchemy/blaze_rod_tier2_stick_fallback')

    // Tier 3: Sequenced Thermodynamic Infusion (6x Blaze Rods)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'kubejs:coal_rod' },
        transitional_item: { id: 'kubejs:coal_rod' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'kubejs:coal_rod' },
                    { item: 'butchery:sulfur' }
                ],
                results: [{ id: 'kubejs:coal_rod' }]
            },
            {
                type: 'create:filling',
                ingredients: [
                    { item: 'kubejs:coal_rod' },
                    { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
                ],
                results: [{ id: 'kubejs:coal_rod' }]
            },
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'kubejs:coal_rod' },
                    { item: 'kubejs:saltpeter' }
                ],
                results: [{ id: 'kubejs:coal_rod' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'kubejs:coal_rod' }],
                results: [{ id: 'kubejs:coal_rod' }]
            }
        ],
        results: [
            { id: 'minecraft:blaze_rod', count: 6 }
        ],
        loops: 1
    }).id('kubejs:alchemy/blaze_rod_tier3_sequenced')

    // Blaze Rod Milling & Crushing
    event.custom({
        type: 'create:crushing',
        ingredients: [{ item: 'minecraft:blaze_rod' }],
        results: [
            { id: 'minecraft:blaze_powder', count: 4 },
            { id: 'minecraft:blaze_powder', count: 1, chance: 0.5 }
        ],
        processing_time: 150
    }).id('kubejs:alchemy/blaze_powder_crushing')


    // ========================================================================
    // LINE 7: BLAZE BURNER CAGE & CATALYTIC AWAKENING
    // ========================================================================

    // Burner Cage Construction
    event.shaped('create:empty_blaze_burner', [
        ' I ',
        'INI',
        ' I '
    ], {
        I: 'create:iron_sheet',
        N: 'minecraft:netherrack'
    }).id('kubejs:alchemy/empty_blaze_burner_netherrack')

    event.shaped('create:empty_blaze_burner', [
        ' I ',
        'ISI',
        ' I '
    ], {
        I: 'create:iron_sheet',
        S: 'butchery:sulfur'
    }).id('kubejs:alchemy/empty_blaze_burner_sulfur')

    // Tier 1: Desperation Field Crafting (1x Blaze Burner)
    event.shaped('create:blaze_burner', [
        ' F ',
        'MBM',
        ' L '
    ], {
        B: 'create:empty_blaze_burner',
        F: 'minecraft:fire_charge',
        M: 'minecraft:magma_cream',
        L: 'minecraft:lava_bucket'
    }).replaceIngredient('minecraft:lava_bucket', 'minecraft:bucket')
    .id('kubejs:alchemy/blaze_burner_tier1_manual')

    // Tier 2: Kinetic Basin Awakening (Unheated Create Mixer)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'create:empty_blaze_burner' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'minecraft:magma_cream' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 1000 }
        ],
        results: [
            { id: 'create:blaze_burner', count: 1 }
        ]
    }).id('kubejs:alchemy/blaze_burner_tier2_magma')

    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'create:empty_blaze_burner' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'butchery:sulfur' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'minecraft:fire_charge' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 1000 }
        ],
        results: [
            { id: 'create:blaze_burner', count: 1 }
        ]
    }).id('kubejs:alchemy/blaze_burner_tier2_firecharge')

    // Tier 3: Sequenced Conveyor Awakening (Pre-excited Hot Burner)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'create:empty_blaze_burner' },
        transitional_item: { id: 'create:empty_blaze_burner' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'create:empty_blaze_burner' },
                    { item: 'butchery:sulfur' }
                ],
                results: [{ id: 'create:empty_blaze_burner' }]
            },
            {
                type: 'create:filling',
                ingredients: [
                    { item: 'create:empty_blaze_burner' },
                    { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 500 }
                ],
                results: [{ id: 'create:empty_blaze_burner' }]
            },
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'create:empty_blaze_burner' },
                    { item: 'minecraft:blaze_rod' }
                ],
                results: [{ id: 'create:empty_blaze_burner' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'create:empty_blaze_burner' }],
                results: [{ id: 'create:empty_blaze_burner' }]
            }
        ],
        results: [
            { id: 'create:blaze_burner', count: 1 }
        ],
        loops: 1
    }).id('kubejs:alchemy/blaze_burner_tier3_sequenced')


    // ========================================================================
    // LINE 8: GHAST TEARS & HIGH-TIER ALCHEMY
    // ========================================================================

    // Tier 1: Mortar Extraction (1x Ghast Tear)
    event.shapeless('minecraft:ghast_tear', [
        'minecraft:slime_ball',
        'minecraft:phantom_membrane',
        'kubejs:saltpeter',
        'minecraft:glass_bottle'
    ]).id('kubejs:alchemy/ghast_tear_tier1_manual')

    // Tier 2: Kinetic Basin Dissolution (2x Ghast Tears)
    event.custom({
        type: 'create:mixing',
        ingredients: [
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:phantom_membrane' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 250 }
        ],
        results: [
            { id: 'minecraft:ghast_tear', count: 2 }
        ]
    }).id('kubejs:alchemy/ghast_tear_tier2_kinetic')

    // Tier 3: Heated Thermal Distillation (8x Ghast Tears - 400% surge!)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'minecraft:slime_ball' },
            { item: 'kubejs:saltpeter' },
            { item: 'kubejs:saltpeter' },
            { item: 'butchery:sulfur' },
            { type: 'neoforge:single', fluid: 'minecraft:water', amount: 500 }
        ],
        results: [
            { id: 'minecraft:ghast_tear', count: 8 }
        ]
    }).id('kubejs:alchemy/ghast_tear_tier3_sulfur_surge')

    // Crying Obsidian Synthesis (Obsidian + Ghast Tear + Lava)
    event.custom({
        type: 'create:mixing',
        heat_requirement: 'heated',
        ingredients: [
            { item: 'minecraft:obsidian' },
            { item: 'minecraft:ghast_tear' },
            { type: 'neoforge:single', fluid: 'minecraft:lava', amount: 100 }
        ],
        results: [
            { id: 'minecraft:crying_obsidian', count: 1 }
        ]
    }).id('kubejs:alchemy/crying_obsidian_thermal')

})
