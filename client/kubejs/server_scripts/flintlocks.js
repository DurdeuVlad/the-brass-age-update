// Minecraft 1.21.1 / Create 6 / ChocolateMan gun pack.
// All firearms require powered Create Mechanical Crafters for precision assembly.
// Raw components are prepared in forge/benches; guns cannot be assembled in a simple crafting table.
ServerEvents.recipes(event => {
    const part = name => 'kubejs:' + name
    const iron = 'create:iron_sheet'
    const brass = 'create:brass_sheet'
    const screws = part('gun_screws')
    const steel = part('tempered_gun_steel')

    // Remove the gun pack's cheap recipes before adding the new crafting routes.
    event.remove({ id: 'qkl:gun/fk15' })
    event.remove({ id: 'qkl:gun/fk15p' })

    function shaped(name, pattern, key) {
        event.shaped(part(name), pattern, key).id('kubejs:flintlocks/' + name)
    }

    // Steel preparation and hardware: every recipe produces one item.
    shaped('gun_steel_blank', ['ICI', 'CAC', 'ICI'], {
        I: iron, C: 'minecraft:charcoal', A: 'create:andesite_alloy'
    })
    event.blasting(steel, part('gun_steel_blank')).cookingTime(400).xp(0.5)
        .id('kubejs:flintlocks/tempered_gun_steel')
    shaped('gun_screws', [' N ', ' S ', ' N '], { N: 'minecraft:iron_nugget', S: iron })
    shaped('barrel_band', [' B ', 'B B', ' S '], { B: brass, S: screws })
    shaped('ramrod', ['  S', ' I ', 'I  '], { S: screws, I: steel })

    // A rifle needs two separately finished pistol barrels plus extra reinforcement.
    shaped('barrel_blank', ['SIS', 'S S', 'SIS'], { S: steel, I: iron })
    shaped('pistol_barrel', [' B ', 'ASA', ' C '], {
        B: part('barrel_blank'), A: 'create:andesite_alloy',
        S: screws, C: 'create:precision_mechanism'
    })
    shaped('rifle_barrel', ['SBS', 'IPI', 'SBS'], {
        S: steel, B: part('pistol_barrel'), I: part('barrel_band'), P: 'create:precision_mechanism'
    })
    // Precision Rifling: P.U.L.A SRL lathe/drill cuts spiral grooves into a smoothbore barrel
    shaped('rifled_barrel', [' D ', ' B ', ' P '], {
        D: 'create:mechanical_drill', B: part('rifle_barrel'), P: 'create:precision_mechanism'
    })

    // The lock contains a heat-treated spring, hammer, pan and trigger.
    shaped('mainspring_blank', [' SS', 'S  ', ' SS'], { S: iron })
    event.blasting(part('tempered_mainspring'), part('mainspring_blank'))
        .cookingTime(300).xp(0.3).id('kubejs:flintlocks/tempered_mainspring')
    shaped('flintlock_hammer', ['FF ', ' SI', '  S'], {
        F: 'minecraft:flint', S: steel, I: screws
    })
    shaped('flash_pan', ['B B', 'BSB', ' I '], { B: brass, S: steel, I: screws })
    shaped('trigger_assembly', [' S ', 'IPI', ' H '], {
        S: part('tempered_mainspring'), I: screws,
        P: 'create:precision_mechanism', H: 'minecraft:tripwire_hook'
    })
    shaped('flintlock_mechanism', ['HFI', 'SPS', 'ITI'], {
        H: part('flintlock_hammer'), F: part('flash_pan'), I: screws,
        S: steel, P: 'create:precision_mechanism', T: part('trigger_assembly')
    })

    // Stock preparation and leather binding.
    shaped('stock_blank', [' LL', 'LLL', 'L  '], { L: 'minecraft:stripped_dark_oak_log' })
    shaped('pistol_stock', [' BS', 'BWL', ' SL'], {
        B: brass, S: screws, W: part('stock_blank'), L: 'minecraft:leather'
    })
    shaped('rifle_stock', ['BWW', 'SPL', 'BLL'], {
        B: part('barrel_band'), W: part('stock_blank'), S: screws,
        P: part('pistol_stock'), L: 'minecraft:leather'
    })

    // Explicit 1.21.1 item components: these are two variants of the SAME TaCZ item.
    // Guns are crafted empty, ready to reload with the gun pack's 16.5mm ammunition.
    function gunRecipe(name, gunId, pattern, ingredients, extraData, customName) {
        const key = {}
        Object.keys(ingredients).forEach(symbol => { key[symbol] = { item: ingredients[symbol] } })
        const customData = {
            GunId: gunId, GunFireMode: 'SEMI',
            GunCurrentAmmoCount: 0, HasBulletInBarrel: false
        }
        if (extraData) Object.assign(customData, extraData)
        const components = {
            'minecraft:custom_data': customData
        }
        if (customName) {
            components['minecraft:item_name'] = customName
        }
        event.custom({
            type: 'create:mechanical_crafting',
            accept_mirrored: true,
            pattern: pattern,
            key: key,
            result: {
                id: 'tacz:modern_kinetic_gun', count: 1,
                components: components
            }
        }).id('kubejs:flintlocks/' + name)
    }
    gunRecipe('pistol', 'qkl:fk15p', ['BMR', 'SWT', ' IL'], {
        B: part('pistol_barrel'), M: part('flintlock_mechanism'), R: part('ramrod'),
        S: screws, W: part('pistol_stock'), T: part('barrel_band'),
        I: steel, L: 'minecraft:leather'
    })
    gunRecipe('rifle', 'qkl:fk15', ['BBR', 'MWS', 'TIP'], {
        B: part('barrel_band'), R: part('rifle_barrel'), M: part('flintlock_mechanism'),
        W: part('rifle_stock'), S: screws, T: part('ramrod'),
        I: steel, P: 'create:precision_mechanism'
    })
    gunRecipe('rifle_jaeger', 'qkl:fk15', ['BBR', 'MWS', 'TIP'], {
        B: part('barrel_band'), R: part('rifled_barrel'), M: part('flintlock_mechanism'),
        W: part('rifle_stock'), S: screws, T: part('ramrod'),
        I: steel, P: 'create:precision_mechanism'
    }, { Rifled: true, PrecisionGrade: true }, '{"text":"FK15-R Jaeger Rifled Musket","color":"gold","italic":false}')
})
