// Consecrated Silver Cartridge: Crafting, Offhand Priority & Supernatural Damage Hook
// Deals devastating 4x damage against undead mobs & CustomNPCs, and 2x damage against vampire players.

ServerEvents.recipes(event => {
    // 1. Tier 1 (Shaped Altar Crafting)
    event.shaped({
        id: 'tacz:ammo',
        count: 2,
        components: {
            'minecraft:custom_data': { AmmoId: 'qkl:16mm', SilverAmmo: true },
            'minecraft:item_name': '{"text":"Glonț de Argint Consfințit","color":"aqua","bold":true,"italic":false}',
            'minecraft:max_stack_size': 16
        }
    }, [
        ' S ',
        'PGP',
        ' W '
    ], {
        S: 'minecraft:iron_nugget',
        P: 'minecraft:paper',
        G: 'tacz_c:gunpowder_charge',
        W: 'tacz_c:wad'
    }).id('kubejs:flintlocks/silver_ammo_tier1')

    // 2. Tier 2 (3x3 Mechanical Crafter)
    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            'SWS',
            'WGW',
            'SWS'
        ],
        key: {
            S: { item: 'tacz_c:large_bullet_core' },
            W: { item: 'tacz_c:wad' },
            G: { item: 'tacz_c:gunpowder_charge' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm', SilverAmmo: true },
                'minecraft:item_name': '{"text":"Glonț de Argint Consfințit","color":"aqua","bold":true,"italic":false}',
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/silver_ammo_tier2')

    // 3. Tier 3 (Sequenced Assembly Line: Anointing Standard Rounds)
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'tacz:ammo' },
        transitional_item: { item: 'tacz:ammo' },
        sequence: [
            {
                type: 'create:deploying',
                ingredients: [
                    { item: 'tacz:ammo' },
                    { item: 'minecraft:iron_nugget' }
                ],
                results: [{ id: 'tacz:ammo' }]
            },
            {
                type: 'create:filling',
                ingredients: [
                    { item: 'tacz:ammo' },
                    { type: 'neoforge:single', fluid: 'minecraft:water', amount: 100 }
                ],
                results: [{ id: 'tacz:ammo' }]
            },
            {
                type: 'create:pressing',
                ingredients: [{ item: 'tacz:ammo' }],
                results: [{ id: 'tacz:ammo' }]
            }
        ],
        results: [
            {
                id: 'tacz:ammo',
                count: 8,
                components: {
                    'minecraft:custom_data': { AmmoId: 'qkl:16mm', SilverAmmo: true },
                    'minecraft:item_name': '{"text":"Glonț de Argint Consfințit","color":"aqua","bold":true,"italic":false}',
                    'minecraft:max_stack_size': 16
                }
            }
        ],
        loops: 1
    }).id('kubejs:flintlocks/silver_ammo_tier3')
})

// 4. Ammunition State Bridge & Offhand Priority
if (typeof TimelessGunEvents !== 'undefined') {
    TimelessGunEvents.gunReload(event => {
        const player = event.entity
        if (!player || !player.isPlayer()) return
        const gun = event.gunItemStack

        // Check if offhand slot (slot 40) holds Consecrated Silver Cartridges
        const offhand = player.getOffhandItem()
        if (!offhand.isEmpty() && String(offhand.id) === 'tacz:ammo') {
            const ammoData = offhand.get('minecraft:custom_data')
            if (ammoData && ammoData.getBoolean('SilverAmmo')) {
                gun.getOrCreateTag().putString('ChamberAmmoType', 'silver')
                player.tell('§b[Muniție] Ai încărcat Glonțul de Argint Consfințit din mâna secundară.')
                return
            }
        }
        gun.getOrCreateTag().putString('ChamberAmmoType', 'lead')
    })

    TimelessGunEvents.gunFire(event => {
        const shooter = event.shooter
        const gun = event.gunItemStack
        if (!shooter || !shooter.isPlayer()) return

        const ammoType = gun.getOrCreateTag().getString('ChamberAmmoType') || 'lead'
        shooter.persistentData.putString('LastFiredAmmoType', ammoType)
        shooter.persistentData.putLong('LastFiredTime', shooter.level().getGameTime())
    })

    // 5. Clean, Non-Recursive Damage Multiplier Hook
    TimelessGunEvents.entityHurtByGunPre(event => {
        const bullet = event.bullet
        const target = event.hurtEntity
        const attacker = event.attacker
        if (!target) return

        let isSilver = false
        if (bullet && bullet.persistentData.getString('AmmoType') === 'silver') {
            isSilver = true
        } else if (attacker && attacker.isPlayer()) {
            const lastType = attacker.persistentData.getString('LastFiredAmmoType')
            const lastTime = attacker.persistentData.getLong('LastFiredTime')
            if (lastType === 'silver' && (target.level().getGameTime() - lastTime) < 35) {
                isSilver = true
            }
        }

        if (!isSilver) return

        let multiplier = 1.0
        let isSupernatural = false

        // Check for Undead Mobs / Corrupt CustomNPCs
        if (target.isUndead() || target.tags.contains('minecraft:undead') || target.tags.contains('hd_unnatural')) {
            multiplier = 4.0
            isSupernatural = true
        }
        // Check for Vampire Players
        else if (target.isPlayer()) {
            const isVamp = target.tags.contains('vampire') ||
                           target.tags.contains('vampir') ||
                           target.tags.contains('is_vampire') ||
                           target.tags.contains('hd_unnatural') ||
                           target.persistentData.getBoolean('is_vampire')
            if (isVamp) {
                multiplier = 2.0
                isSupernatural = true
            }
        }

        if (isSupernatural && multiplier > 1.0) {
            event.baseAmount = event.baseAmount * multiplier

            const level = target.level()
            level.playSound(null, target.x, target.y, target.z, 'minecraft:block.amethyst_block.hit', 'players', 1.5, 1.8)
            level.playSound(null, target.x, target.y, target.z, 'minecraft:entity.experience_orb.pickup', 'players', 1.2, 0.6)

            if (attacker && attacker.isPlayer()) {
                attacker.tell('§b⚡ [Argint Consfințit] Lovitură sfântă! ×' + multiplier.toFixed(1) + ' Daune!')
            }
        }
    })
} else {
    console.info('[TheBrassAge] TimelessGunEvents is not loaded in this environment; silver damage multiplier hook deferred.')
}

EntityEvents.spawned(event => {
    const entity = event.entity
    if (entity.type === 'tacz:bullet') {
        const shooter = entity.owner
        if (shooter && shooter.isPlayer()) {
            const ammoType = shooter.persistentData.getString('LastFiredAmmoType') || 'lead'
            entity.persistentData.putString('AmmoType', ammoType)
        }
    }
})

