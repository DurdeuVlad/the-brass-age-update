// Server-side: two qkl:fk15p pistols and one qkl:fk15 rifle per player.
// Excess guns are dropped, not deleted. No creative/operator exemption.
const FlintlockCarryComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const flintlockCarryLimits = { pistol: 2, rifle: 1 }

function flintlockCarryKind(stack) {
    if (stack.isEmpty() || String(stack.id) !== 'tacz:modern_kinetic_gun') return null
    const data = stack.get(FlintlockCarryComponents.CUSTOM_DATA)
    if (data === null) return null
    const gunId = String(data.copyTag().getString('GunId'))
    if (gunId === 'qkl:fk15p') return 'pistol'
    if (gunId === 'qkl:fk15') return 'rifle'
    return null
}

function flintlockCarriedStacks(player) {
    const inventory = player.getInventory()
    const stacks = []
    // Keep the selected weapon and offhand first, then the remaining slots.
    stacks.push(inventory.getItem(inventory.selected))
    stacks.push(inventory.getItem(40))
    for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
        if (slot !== inventory.selected && slot !== 40) stacks.push(inventory.getItem(slot))
    }
    stacks.push(player.containerMenu.getCarried())
    // The personal crafting grid must not act as four additional gun slots.
    for (let slot = 1; slot <= 4; slot++) stacks.push(player.inventoryMenu.getSlot(slot).getItem())
    return stacks
}

function flintlockCarryMessage(player) {
    const now = player.level().getGameTime()
    const next = player.persistentData.getLong('flintlockCarryNextMessage')
    if (now < next) return
    player.persistentData.putLong('flintlockCarryNextMessage', now + 60)
    player.tell('§e[Arsenal] Limită de transport: maxim 1 pușcă și 2 pistoale. Armele în plus rămân pe sol.')
}

ItemEvents.canPickUp('tacz:modern_kinetic_gun', event => {
    const kind = flintlockCarryKind(event.item)
    if (kind === null) return
    let count = 0
    flintlockCarriedStacks(event.player).forEach(stack => {
        if (flintlockCarryKind(stack) === kind) count += stack.getCount()
    })
    if (count + event.item.getCount() > flintlockCarryLimits[kind]) {
        event.cancel()
        flintlockCarryMessage(event.player)
    }
})

PlayerEvents.tick(event => {
    const player = event.player
    if (!player.isAlive() || player.isSpectator()) return
    // 1 Hz staggered throttling: prevents 20 Hz tick spikes across player base
    if ((player.age + Math.abs(player.uuid.hashCode())) % 20 !== 0) return

    const counts = { pistol: 0, rifle: 0 }
    let changed = false
    flintlockCarriedStacks(player).forEach(stack => {
        const kind = flintlockCarryKind(stack)
        if (kind === null) return
        const keep = Math.max(0, Math.min(stack.getCount(), flintlockCarryLimits[kind] - counts[kind]))
        counts[kind] += keep
        const excess = stack.getCount() - keep
        if (excess <= 0) return
        const droppedStack = stack.copy()
        droppedStack.setCount(excess)
        const entity = player.drop(droppedStack, false)
        // Only remove the original after the drop succeeds; preserve all gun data.
        if (entity !== null) {
            stack.shrink(excess)
            entity.setPickUpDelay(40)
            changed = true
        }
    })
    if (changed) {
        player.getInventory().setChanged()
        player.inventoryMenu.broadcastChanges()
        player.containerMenu.broadcastChanges()
        flintlockCarryMessage(player)
    }
})
