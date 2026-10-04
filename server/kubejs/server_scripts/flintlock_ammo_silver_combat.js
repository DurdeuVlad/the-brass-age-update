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
        transitional_item: { id: 'tacz:ammo' },
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

// 4. Tactical Ammunition Combat Bridge (Silver, Canister, Incendiary)
var $TacZGunReloadEvent = null
var $TacZGunShootEvent = null
var $TacZEntityHurtByGunPre = null
var $NeoLivingIncomingDamageEvent = null

console.info('[TheBrassAge] TimelessGunEvents is available: ' + (typeof TimelessGunEvents !== 'undefined'))

try {
    $TacZGunReloadEvent = Java.loadClass('com.tacz.guns.api.event.common.GunReloadEvent')
} catch (e) {}
try {
    $TacZGunShootEvent = Java.loadClass('com.tacz.guns.api.event.common.GunShootEvent')
} catch (e) {}
try {
    $TacZEntityHurtByGunPre = Java.loadClass('com.tacz.guns.api.event.common.EntityHurtByGunEvent$Pre')
} catch (e) {}
try {
    $NeoLivingIncomingDamageEvent = Java.loadClass('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent')
} catch (e) {}

var $AmmoBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var $AmmoDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var $AmmoCustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
var $AmmoCompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')

function ammoGetStackId(stack) {
    if (!stack || stack.isEmpty()) return ''
    try {
        if (stack.getItem()) {
            var k = $AmmoBuiltInRegistries.ITEM.getKey(stack.getItem())
            if (k) return String(k).toLowerCase()
        }
    } catch (e) {}
    try {
        if (stack.id) return String(stack.id).toLowerCase()
    } catch (e) {}
    try {
        if (typeof stack.getId === 'function') return String(stack.getId()).toLowerCase()
    } catch (e) {}
    return ''
}

function ammoGetCustomTag(stack) {
    if (!stack || stack.isEmpty()) return null
    try {
        var data = stack.get($AmmoDataComponents.CUSTOM_DATA)
        if (data) {
            if (typeof data.copyTag === 'function') return data.copyTag()
            if (typeof data.getUnsafe === 'function') return data.getUnsafe()
        }
    } catch (e) {}
    try {
        var c = stack.get('minecraft:custom_data')
        if (c) {
            if (typeof c.copyTag === 'function') return c.copyTag()
            if (typeof c.getUnsafe === 'function') return c.getUnsafe()
            if (typeof c === 'object') return c
        }
    } catch (e) {}
    try {
        if (stack.nbt) return stack.nbt
    } catch (e) {}
    return null
}

function setGunChamberAmmo(gunStack, ammoKind) {
    if (!gunStack || gunStack.isEmpty()) return
    try {
        var data = gunStack.get($AmmoDataComponents.CUSTOM_DATA)
        var tag = null
        try {
            tag = (data && typeof data.copyTag === 'function') ? data.copyTag() : new $AmmoCompoundTag()
        } catch (e) {
            tag = new $AmmoCompoundTag()
        }
        tag.putString('ChamberAmmoType', ammoKind)
        gunStack.set($AmmoDataComponents.CUSTOM_DATA, $AmmoCustomData.of(tag))
    } catch (e) {}
}

function getSpecialAmmoKind(stack) {
    if (!stack || stack.isEmpty()) return null
    if (ammoGetStackId(stack) !== 'tacz:ammo') return null
    var tag = ammoGetCustomTag(stack)
    if (!tag) return null
    try {
        if (typeof tag.getBoolean === 'function') {
            if (tag.getBoolean('SilverAmmo') || tag.getByte('SilverAmmo') == 1 || tag.getInt('SilverAmmo') == 1 || String(tag.getString('SilverAmmo')) === 'true') return 'silver'
            if (tag.getBoolean('CanisterAmmo') || tag.getByte('CanisterAmmo') == 1 || tag.getInt('CanisterAmmo') == 1 || String(tag.getString('CanisterAmmo')) === 'true') return 'canister'
            if (tag.getBoolean('IncendiaryAmmo') || tag.getByte('IncendiaryAmmo') == 1 || tag.getInt('IncendiaryAmmo') == 1 || String(tag.getString('IncendiaryAmmo')) === 'true') return 'incendiary'
        } else {
            if (tag.SilverAmmo) return 'silver'
            if (tag.CanisterAmmo) return 'canister'
            if (tag.IncendiaryAmmo) return 'incendiary'
        }
    } catch (e) {}
    return null
}

function getPlayerActiveAmmoKind(player) {
    if (!player) return 'lead'
    var offhand = player.getOffhandItem ? player.getOffhandItem() : player.offhandItem
    if (offhand && !offhand.isEmpty()) {
        if (ammoGetStackId(offhand) === 'tacz:ammo') {
            var kind = getSpecialAmmoKind(offhand)
            return kind ? kind : 'lead'
        }
    }
    // If not in offhand, check inventory for special ammo
    var inv = player.getInventory ? player.getInventory() : player.inventory
    if (inv) {
        var size = inv.getContainerSize ? inv.getContainerSize() : 36
        for (var i = 0; i < size; i++) {
            var s = inv.getItem(i)
            var k = getSpecialAmmoKind(s)
            if (k) return k
        }
    }
    return 'lead'
}

function onGunReload(entity, gunStack) {
    if (!entity) return
    var isPlayer = false
    try {
        if (typeof entity.isPlayer === 'function') isPlayer = entity.isPlayer()
        else if (entity instanceof Java.loadClass('net.minecraft.world.entity.player.Player')) isPlayer = true
    } catch (e) {}
    if (!isPlayer) return

    var kind = getPlayerActiveAmmoKind(entity)
    entity.persistentData.putString('LoadedAmmoType', kind)
    if (gunStack) setGunChamberAmmo(gunStack, kind)

    console.info('[TheBrassAge] GunReload by ' + (entity.username || entity.name.string) + ': ' + kind)
    if (kind === 'silver') {
        entity.tell('§b[Muniție] Ai încărcat Glonțul de Argint Consfințit (4x daune nemorți).')
    } else if (kind === 'canister') {
        entity.tell('§6[Muniție] Ai încărcat Glonț tip Mitralii (Canister - knockback).')
    } else if (kind === 'incendiary') {
        entity.tell('§c[Muniție] Ai încărcat Cartuș Incendiar cu Sulf (incendiere).')
    }
}

function onGunShoot(shooter, gunStack) {
    if (!shooter) return
    var isPlayer = false
    try {
        if (typeof shooter.isPlayer === 'function') isPlayer = shooter.isPlayer()
        else if (shooter instanceof Java.loadClass('net.minecraft.world.entity.player.Player')) isPlayer = true
    } catch (e) {}
    if (!isPlayer) return

    var kind = 'lead'
    if (gunStack) {
        var tag = ammoGetCustomTag(gunStack)
        if (tag) {
            var c = ''
            try {
                if (typeof tag.getString === 'function') c = tag.getString('ChamberAmmoType')
                else c = tag.ChamberAmmoType || ''
            } catch (e) {}
            if (c && c !== '') kind = c
        }
    }
    if (kind === 'lead') {
        var loaded = shooter.persistentData.getString('LoadedAmmoType')
        if (loaded && loaded !== '') kind = loaded
        else kind = getPlayerActiveAmmoKind(shooter)
    }
    shooter.persistentData.putString('LastFiredAmmoType', kind)
    var sLvl = (typeof shooter.getLevel === 'function') ? shooter.getLevel() : shooter.level
    var now = (sLvl && typeof sLvl.getGameTime === 'function') ? sLvl.getGameTime() : 0
    shooter.persistentData.putLong('LastFiredTime', now)
    console.info('[TheBrassAge] GunShoot by ' + (shooter.username || shooter.name.string) + ': kind=' + kind + ', tick=' + now)
}

function sendPlayerMessage(player, text) {
    if (!player) return
    try {
        if (typeof player.tell === 'function') {
            player.tell(text)
            return
        }
    } catch (e) {}
    try {
        var Component = Java.loadClass('net.minecraft.network.chat.Component')
        player.sendSystemMessage(Component.literal(text))
    } catch (e) {}
}

function applyTacticalHitEffects(target, attacker, baseAmountSetter, currentAmount) {
    if (!target || !attacker) return
    var isPlayer = false
    try {
        if (typeof attacker.isPlayer === 'function') isPlayer = attacker.isPlayer()
        else if (attacker instanceof Java.loadClass('net.minecraft.world.entity.player.Player')) isPlayer = true
    } catch (e) {}
    if (!isPlayer) return

    var ammo = attacker.persistentData.getString('LastFiredAmmoType') || 'lead'
    var server = attacker.getServer ? attacker.getServer() : (attacker.server || (attacker.level && attacker.level.getServer ? attacker.level.getServer() : null))

    var tx = (typeof target.getX === 'function') ? Number(target.getX()).toFixed(1) : Number(target.x || 0).toFixed(1)
    var ty = (typeof target.getY === 'function') ? Number(target.getY()).toFixed(1) : Number(target.y || 0).toFixed(1)
    var tz = (typeof target.getZ === 'function') ? Number(target.getZ()).toFixed(1) : Number(target.z || 0).toFixed(1)

    var ax = (typeof attacker.getX === 'function') ? Number(attacker.getX()) : Number(attacker.x || 0)
    var az = (typeof attacker.getZ === 'function') ? Number(attacker.getZ()) : Number(attacker.z || 0)
    var targetX = (typeof target.getX === 'function') ? Number(target.getX()) : Number(target.x || 0)
    var targetZ = (typeof target.getZ === 'function') ? Number(target.getZ()) : Number(target.z || 0)

    console.info('[TheBrassAge] TacticalHit: ammo=' + ammo + ', target=' + (target.type ? target.type : target) + ', baseDmg=' + currentAmount)

    if (ammo === 'incendiary') {
        try {
            if (typeof target.igniteForSeconds === 'function') target.igniteForSeconds(8)
            else if (typeof target.setRemainingFireTicks === 'function') target.setRemainingFireTicks(160)
            target.hurtMarked = true
        } catch (e) {
            console.error('[TheBrassAge] Incendiary ignite error: ' + e)
        }
        if (server) server.runCommandSilent('playsound minecraft:item.firecharge.use player @a ' + tx + ' ' + ty + ' ' + tz + ' 1.0 1.0')
        sendPlayerMessage(attacker, '§c🔥 [Incendiar] Țintă incendiată pentru 8 secunde!')
    } else if (ammo === 'canister') {
        var dx = targetX - ax
        var dz = targetZ - az
        var dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.001) {
            dx /= dist
            dz /= dist
        } else {
            dx = 0
            dz = 1
        }
        try {
            if (typeof target.knockback === 'function') {
                target.knockback(2.0, dx, dz)
                target.hurtMarked = true
                target.hasImpulse = true
            } else if (typeof target.push === 'function') {
                target.push(dx * 1.5, 0.4, dz * 1.5)
                target.hurtMarked = true
            }
        } catch (e) {
            console.error('[TheBrassAge] Canister knockback error: ' + e)
        }
        if (server) server.runCommandSilent('playsound minecraft:entity.iron_golem.attack player @a ' + tx + ' ' + ty + ' ' + tz + ' 1.0 1.2')
        sendPlayerMessage(attacker, '§6💥 [Canister] Dispersie defensivă reușită!')
    } else if (ammo === 'silver') {
        var isUndead = false
        try {
            if (typeof target.isInvertedHealAndHarm === 'function' && target.isInvertedHealAndHarm()) isUndead = true
        } catch (e) {}
        if (!isUndead) {
            try {
                var EntityTypeTags = Java.loadClass('net.minecraft.tags.EntityTypeTags')
                if (target.getType().is(EntityTypeTags.UNDEAD)) isUndead = true
            } catch (e) {}
        }
        if (!isUndead && target.tags) {
            try {
                if (target.tags.contains('undead') || target.tags.contains('zombie') || target.tags.contains('skeleton') || target.tags.contains('minecraft:undead')) isUndead = true
            } catch (e) {}
        }

        var isVamp = false
        if (target.tags) {
            isVamp = target.tags.contains('vampire') || target.tags.contains('vampir') || target.tags.contains('is_vampire')
        }
        if (!isVamp && target.persistentData) {
            try { isVamp = target.persistentData.getBoolean('is_vampire') } catch (e) {}
        }

        if (isUndead || isVamp) {
            var mult = isUndead ? 4.0 : 2.0
            if (typeof baseAmountSetter === 'function') {
                baseAmountSetter(currentAmount * mult)
            }
            if (server) {
                server.runCommandSilent('playsound minecraft:block.amethyst_block.hit player @a ' + tx + ' ' + ty + ' ' + tz + ' 1.5 1.8')
                server.runCommandSilent('playsound minecraft:entity.experience_orb.pickup player @a ' + tx + ' ' + ty + ' ' + tz + ' 1.2 0.6')
            }
            sendPlayerMessage(attacker, '§b⚡ [Argint Consfințit] Lovitură sfântă! ×' + mult.toFixed(1) + ' Daune! (' + (currentAmount * mult).toFixed(1) + ' dmg)')
        }
    }
}

// Register Listeners via TimelessGunEvents
if (typeof TimelessGunEvents !== 'undefined') {
    try {
        TimelessGunEvents.gunReload(event => {
            try {
                var entity = event.entity || (typeof event.getEntity === 'function' ? event.getEntity() : null)
                var stack = event.gunItemStack || (typeof event.getGunItemStack === 'function' ? event.getGunItemStack() : null)
                onGunReload(entity, stack)
            } catch (e) {
                console.error('[TimelessGunEvents.gunReload] ' + e)
            }
        })
        console.info('[TheBrassAge] Registered TimelessGunEvents.gunReload')
    } catch (e) {
        console.error('[TheBrassAge] Failed to register TimelessGunEvents.gunReload: ' + e)
    }

    try {
        TimelessGunEvents.gunShoot(event => {
            try {
                var shooter = event.shooter || (typeof event.getShooter === 'function' ? event.getShooter() : null)
                var stack = event.gunItemStack || (typeof event.getGunItemStack === 'function' ? event.getGunItemStack() : null)
                onGunShoot(shooter, stack)
            } catch (e) {
                console.error('[TimelessGunEvents.gunShoot] ' + e)
            }
        })
        console.info('[TheBrassAge] Registered TimelessGunEvents.gunShoot')
    } catch (e) {
        console.error('[TheBrassAge] Failed to register TimelessGunEvents.gunShoot: ' + e)
    }

    try {
        TimelessGunEvents.entityHurtByGunPre(event => {
            try {
                var target = event.hurtEntity || (typeof event.getHurtEntity === 'function' ? event.getHurtEntity() : null)
                var attacker = event.attacker || (typeof event.getAttacker === 'function' ? event.getAttacker() : null)
                var current = event.baseAmount || (typeof event.getBaseAmount === 'function' ? event.getBaseAmount() : 10)
                applyTacticalHitEffects(target, attacker, function(newVal) {
                    if (typeof event.setBaseAmount === 'function') event.setBaseAmount(newVal)
                }, current)
            } catch (e) {
                console.error('[TimelessGunEvents.entityHurtByGunPre] ' + e)
            }
        })
        console.info('[TheBrassAge] Registered TimelessGunEvents.entityHurtByGunPre')
    } catch (e) {
        console.error('[TheBrassAge] Failed to register TimelessGunEvents.entityHurtByGunPre: ' + e)
    }
}

// Fallback: NativeEvents if TimelessGunEvents missing
if (typeof NativeEvents !== 'undefined') {
    if ($TacZGunReloadEvent && typeof TimelessGunEvents === 'undefined') {
        NativeEvents.onEvent($TacZGunReloadEvent, function(event) {
            try {
                if (event.getLogicalSide && event.getLogicalSide().isClient()) return
                onGunReload(event.getEntity(), event.getGunItemStack())
            } catch (e) {}
        })
    }
    if ($TacZGunShootEvent && typeof TimelessGunEvents === 'undefined') {
        NativeEvents.onEvent($TacZGunShootEvent, function(event) {
            try {
                if (event.getLogicalSide && event.getLogicalSide().isClient()) return
                onGunShoot(event.getShooter(), event.getGunItemStack())
            } catch (e) {}
        })
    }
    if ($TacZEntityHurtByGunPre && typeof TimelessGunEvents === 'undefined') {
        NativeEvents.onEvent($TacZEntityHurtByGunPre, function(event) {
            try {
                if (event.getLogicalSide && event.getLogicalSide().isClient()) return
                applyTacticalHitEffects(event.getHurtEntity(), event.getAttacker(), function(newVal) {
                    event.setBaseAmount(newVal)
                }, event.getBaseAmount())
            } catch (e) {}
        })
    }
}

// Universal Fallback: EntityEvents.beforeHurt
EntityEvents.beforeHurt(function(event) {
    try {
        var src = event.getSource()
        if (!src) return

        var attacker = null
        try { attacker = src.player || src.actual || (typeof src.getEntity === 'function' ? src.getEntity() : null) } catch (e) {}
        if (!attacker) return
        var isPlayer = false
        try {
            if (typeof attacker.isPlayer === 'function') isPlayer = attacker.isPlayer()
            else if (attacker instanceof Java.loadClass('net.minecraft.world.entity.player.Player')) isPlayer = true
        } catch (e) {}
        if (!isPlayer) return

        var target = event.getEntity()
        if (!target) return

        var ammo = attacker.persistentData.getString('LastFiredAmmoType')
        if (!ammo || ammo === 'lead') return

        var lastTime = attacker.persistentData.getLong('LastFiredTime')
        var now = target.level.getGameTime()
        if (now - lastTime > 40) return

        if (ammo === 'incendiary') {
            try {
                if (typeof target.igniteForSeconds === 'function') target.igniteForSeconds(8)
                else if (typeof target.setRemainingFireTicks === 'function') target.setRemainingFireTicks(160)
            } catch (e) {}
        } else if (ammo === 'canister') {
            try {
                var dx = (target.x || 0) - (attacker.x || 0)
                var dz = (target.z || 0) - (attacker.z || 0)
                target.knockback(1.5, -dx, -dz)
            } catch (e) {}
        }
    } catch (e) {}
})

