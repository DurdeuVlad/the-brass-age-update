// Specialized Tactical Ordnance: Canister Scattershot & Incendiary Sulfur Ball
// Provides defensive close-quarters crowd dispersal and cavern illumination.

ServerEvents.recipes(event => {
    // 1. Canister Scattershot (8 Iron Pellets + Sabot + Powder Charge)
    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            'NNN',
            'NWN',
            'NGN'
        ],
        key: {
            N: { item: 'minecraft:iron_nugget' },
            W: { item: 'tacz_c:wad' },
            G: { item: 'tacz_c:gunpowder_charge' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm', CanisterAmmo: true },
                'minecraft:item_name': '{"text":"Glonț tip Mitralii (Canister)","color":"gold","bold":true,"italic":false}',
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/ammo_canister_scattershot')

    // 2. Incendiary Sulfur Ball (Sulfur + Core + Powder Charge)
    event.custom({
        type: 'create:mechanical_crafting',
        accept_mirrored: true,
        pattern: [
            ' S ',
            'CGC',
            ' W '
        ],
        key: {
            S: { item: 'butchery:sulfur' },
            C: { item: 'tacz_c:large_bullet_core' },
            G: { item: 'tacz_c:gunpowder_charge' },
            W: { item: 'tacz_c:wad' }
        },
        result: {
            id: 'tacz:ammo',
            count: 4,
            components: {
                'minecraft:custom_data': { AmmoId: 'qkl:16mm', IncendiaryAmmo: true },
                'minecraft:item_name': '{"text":"Cartuș Incendiar cu Sulf","color":"red","bold":true,"italic":false}',
                'minecraft:max_stack_size': 16
            }
        }
    }).id('kubejs:flintlocks/ammo_incendiary_sulfur')
})

// 3. Ammunition State Bridge & Offhand Priority for Specialized Ordnance
if (typeof TimelessGunEvents !== 'undefined') {
    TimelessGunEvents.gunReload(event => {
        const player = event.entity
        if (!player || !player.isPlayer()) return
        const gun = event.gunItemStack

        const offhand = player.getOffhandItem()
        if (!offhand.isEmpty() && String(offhand.id) === 'tacz:ammo') {
            const ammoData = offhand.get('minecraft:custom_data')
            if (ammoData) {
                if (ammoData.getBoolean('CanisterAmmo')) {
                    gun.getOrCreateTag().putString('ChamberAmmoType', 'canister')
                    player.tell('§6[Muniție] Ai încărcat Glonț tip Mitralii (Canister) din mâna secundară.')
                    return
                }
                if (ammoData.getBoolean('IncendiaryAmmo')) {
                    gun.getOrCreateTag().putString('ChamberAmmoType', 'incendiary')
                    player.tell('§c[Muniție] Ai încărcat Cartuș Incendiar cu Sulf din mâna secundară.')
                    return
                }
            }
        }
    })

    // 4. Ordnance Hit Effects: Incendiary Ignition & Canister Cone Burst
    TimelessGunEvents.entityHurtByGunPre(event => {
        const bullet = event.bullet
        const target = event.hurtEntity
        const attacker = event.attacker
        if (!target) return

        let ammoType = ''
        if (bullet) {
            ammoType = bullet.persistentData.getString('AmmoType')
        } else if (attacker && attacker.isPlayer()) {
            ammoType = attacker.persistentData.getString('LastFiredAmmoType')
        }

        if (ammoType === 'incendiary') {
            target.setRemainingFireTicks(160) // 8 seconds burn
            const level = target.level()
            level.playSound(null, target.x, target.y, target.z, 'minecraft:item.firecharge.use', 'players', 1.0, 1.0)
            if (attacker && attacker.isPlayer()) {
                attacker.tell('§c🔥 [Incendiar] Țintă incendiată pentru 8 secunde!')
            }
        } else if (ammoType === 'canister') {
            // High defensive close-range knockback
            target.knockback(0.8, -target.lookAngle.x, -target.lookAngle.z)
            const level = target.level()
            level.playSound(null, target.x, target.y, target.z, 'minecraft:entity.iron_golem.attack', 'players', 1.0, 1.2)
            if (attacker && attacker.isPlayer()) {
                attacker.tell('§6💥 [Canister] Dispersie defensivă reușită!')
            }
        }
    })
} else {
    console.info('[TheBrassAge] TimelessGunEvents is not loaded in this environment; ordnance hooks deferred.')
}
