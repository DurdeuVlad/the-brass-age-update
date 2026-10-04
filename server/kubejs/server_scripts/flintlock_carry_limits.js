// Server-side: two qkl:fk15p pistols and one qkl:fk15 rifle per player.
// Excess guns are dropped, not deleted. No creative/operator exemption.
var $FlintlockBuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
var $FlintlockDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
var $FlintlockItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')

var flintlockCarryLimits = { pistol: 2, rifle: 1 }

function flintlockGetStackId(stack) {
    if (!stack || stack.isEmpty()) return ''
    try {
        if (stack.getItem()) {
            var k = $FlintlockBuiltInRegistries.ITEM.getKey(stack.getItem())
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

function flintlockCarryKind(stack) {
    if (!stack || stack.isEmpty()) return null
    if (flintlockGetStackId(stack) !== 'tacz:modern_kinetic_gun') return null

    var gunId = ''
    try {
        var data = stack.get($FlintlockDataComponents.CUSTOM_DATA)
        if (data) {
            var tag = (typeof data.copyTag === 'function') ? data.copyTag() : (typeof data.getUnsafe === 'function' ? data.getUnsafe() : null)
            if (tag && tag.contains('GunId')) gunId = String(tag.getString('GunId'))
            else if (data.GunId) gunId = String(data.GunId)
        }
    } catch (e) {}

    if (!gunId) {
        try {
            var c = stack.get('minecraft:custom_data')
            if (c) {
                if (typeof c.copyTag === 'function') {
                    var tag = c.copyTag()
                    if (tag && tag.contains('GunId')) gunId = String(tag.getString('GunId'))
                } else if (c.GunId) {
                    gunId = String(c.GunId)
                }
            }
        } catch (e) {}
    }

    if (!gunId) {
        try {
            if (stack.nbt && stack.nbt.GunId) gunId = String(stack.nbt.GunId)
            else if (stack.tag && stack.tag.GunId) gunId = String(stack.tag.GunId)
        } catch (e) {}
    }

    if (gunId === 'qkl:fk15p' || gunId.indexOf('fk15p') !== -1) return 'pistol'
    if (gunId === 'qkl:fk15' || gunId.indexOf('fk15') !== -1) return 'rifle'
    return null
}

function flintlockCarryMessage(player) {
    var lvl = (typeof player.getLevel === 'function') ? player.getLevel() : player.level
    var now = (lvl && typeof lvl.getGameTime === 'function') ? lvl.getGameTime() : 0
    var next = player.persistentData.getLong('flintlockCarryNextMessage')
    if (now < next) return
    player.persistentData.putLong('flintlockCarryNextMessage', now + 60)
    player.tell('§e[Arsenal] Limită de transport: maxim 1 pușcă și 2 pistoale. Armele în plus rămân pe sol.')
}

function flintlockEnforce(player) {
    if (!player || !player.isAlive() || player.isSpectator()) return

    var inventory = player.getInventory()
    var counts = { pistol: 0, rifle: 0 }
    var changed = false

    // Helper to evaluate and drop excess
    function checkStack(stack, onExcess) {
        if (!stack || stack.isEmpty()) return
        var kind = flintlockCarryKind(stack)
        if (kind === null) return

        var count = stack.getCount()
        var maxAllowed = flintlockCarryLimits[kind]
        var currentCount = counts[kind]
        var keep = Math.max(0, Math.min(count, maxAllowed - currentCount))
        counts[kind] += keep
        var excess = count - keep

        if (excess > 0) {
            var droppedStack = stack.copy()
            droppedStack.setCount(excess)
            var entity = player.drop(droppedStack, false)
            if (entity !== null) {
                entity.setPickUpDelay(40)
                stack.shrink(excess)
                if (typeof onExcess === 'function') onExcess(excess)
                changed = true
            }
        }
    }

    // 1. Priority 1: Main hand selected weapon & Offhand (keep these first!)
    checkStack(inventory.getItem(inventory.selected), function(excess) {
        if (inventory.getItem(inventory.selected).isEmpty() || inventory.getItem(inventory.selected).getCount() <= 0) {
            inventory.setItem(inventory.selected, $FlintlockItemStack.EMPTY)
        }
    })
    checkStack(inventory.getItem(40), function(excess) {
        if (inventory.getItem(40).isEmpty() || inventory.getItem(40).getCount() <= 0) {
            inventory.setItem(40, $FlintlockItemStack.EMPTY)
        }
    })

    // 2. Priority 2: Rest of player inventory (slots 0..35 except selected)
    for (var slot = 0; slot < 36; slot++) {
        if (slot !== inventory.selected) {
            checkStack(inventory.getItem(slot), function(excess) {
                if (inventory.getItem(slot).isEmpty() || inventory.getItem(slot).getCount() <= 0) {
                    inventory.setItem(slot, $FlintlockItemStack.EMPTY)
                }
            })
        }
    }

    // 3. Priority 3: Mouse cursor item
    if (player.containerMenu) {
        checkStack(player.containerMenu.getCarried(), function(excess) {
            if (player.containerMenu.getCarried().isEmpty() || player.containerMenu.getCarried().getCount() <= 0) {
                player.containerMenu.setCarried($FlintlockItemStack.EMPTY)
            }
        })
    }

    // 4. Priority 4: Crafting grid slots (survival 2x2 or crafting table 3x3)
    if (player.containerMenu) {
        try {
            var slots = player.containerMenu.slots
            if (slots && typeof slots.size === 'function') {
                for (var i = 0; i < slots.size(); i++) {
                    var slotObj = slots.get(i)
                    if (!slotObj || !slotObj.container) continue
                    var isCraftingGrid = false
                    try {
                        var cls = (typeof slotObj.container.getClass === 'function') ? slotObj.container.getClass() : (slotObj.container.class || null)
                        if (cls && typeof cls.getName === 'function') {
                            var cName = String(cls.getName())
                            if (cName.indexOf('Craft') !== -1 || cName.indexOf('Transient') !== -1) {
                                isCraftingGrid = true
                            }
                        }
                    } catch (e) {}

                    if (isCraftingGrid) {
                        checkStack(slotObj.getItem(), function(excess) {
                            if (slotObj.getItem().isEmpty() || slotObj.getItem().getCount() <= 0) {
                                slotObj.set($FlintlockItemStack.EMPTY)
                            }
                            slotObj.setChanged()
                        })
                    }
                }
            }
        } catch (e) {}
    }

    if (changed) {
        inventory.setChanged()
        if (player.containerMenu) player.containerMenu.broadcastChanges()
        if (player.inventoryMenu) player.inventoryMenu.broadcastChanges()
        flintlockCarryMessage(player)
    }
}

// Container close hook: immediately enforce limits when closing crafting table or any menu
var $PlayerContainerCloseEvent = null
var $ItemEntityPickupPre = null
try {
    $PlayerContainerCloseEvent = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerContainerEvent$Close')
    $ItemEntityPickupPre = Java.loadClass('net.neoforged.neoforge.event.entity.player.ItemEntityPickupEvent$Pre')
} catch (e) {}

if (typeof NativeEvents !== 'undefined') {
    if ($PlayerContainerCloseEvent) {
        NativeEvents.onEvent($PlayerContainerCloseEvent, function(event) {
            var entity = event.getEntity()
            if (entity && entity.isPlayer()) {
                flintlockEnforce(entity)
            }
        })
    }
    if ($ItemEntityPickupPre) {
        NativeEvents.onEvent($ItemEntityPickupPre, function(event) {
            var player = event.getPlayer()
            var itemEntity = event.getItemEntity()
            if (!player || !itemEntity) return
            var stack = itemEntity.getItem()
            var kind = flintlockCarryKind(stack)
            if (kind === null) return

            var inventory = player.getInventory()
            var count = 0
            for (var i = 0; i < inventory.getContainerSize(); i++) {
                var s = inventory.getItem(i)
                if (flintlockCarryKind(s) === kind) count += s.getCount()
            }
            if (player.containerMenu) {
                var cur = player.containerMenu.getCarried()
                if (flintlockCarryKind(cur) === kind) count += cur.getCount()
            }

            if (count + stack.getCount() > flintlockCarryLimits[kind]) {
                try { event.setCanceled(true) } catch (err) {}
                flintlockCarryMessage(player)
            }
        })
    }
}

// 4 Hz tick checking (every 5 ticks) across all online players via ServerEvents.tick
ServerEvents.tick(event => {
    var server = event.server
    if (server.tickCount % 5 !== 0) return
    server.players.forEach(player => {
        if (!player || !player.isAlive() || player.isSpectator()) return
        flintlockEnforce(player)
    })
})
