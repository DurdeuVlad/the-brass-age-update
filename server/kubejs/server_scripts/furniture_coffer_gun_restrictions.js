// Furniture 1.1.4 has no coffer insertion blacklist. Remove guns from open
// coffers and carried coffer block-entity data on the next player tick.
// Server-only; ordinary chests are unaffected. Drops preserve gun components.
const FurnitureGunCoffer = Java.loadClass('com.berksire.furniture.core.block.entity.CofferBlockEntity')
const FurnitureGunChestMenu = Java.loadClass('net.minecraft.world.inventory.ChestMenu')
const FurnitureGunComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const FurnitureGunCustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
const FurnitureGunItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')

function furnitureCofferDropGun(player, stack) {
    const entity = player.drop(stack.copy(), false)
    if (entity === null) return false
    entity.setPickUpDelay(40)
    return true
}

function furnitureCofferCleanItem(player, stack) {
    if (stack.isEmpty() || String(stack.id) !== 'furniture:coffer') return false
    const data = stack.get(FurnitureGunComponents.BLOCK_ENTITY_DATA)
    if (data === null) return false
    const tag = data.copyTag()
    const items = tag.getList('Items', 10)
    let changed = false
    for (let i = items.size() - 1; i >= 0; i--) {
        const saved = items.getCompound(i)
        if (String(saved.getString('id')) !== 'tacz:modern_kinetic_gun') continue
        const gun = FurnitureGunItemStack.parseOptional(player.registryAccess(), saved)
        if (!gun.isEmpty() && furnitureCofferDropGun(player, gun)) {
            items.remove(i)
            changed = true
        }
    }
    if (changed) {
        tag.put('Items', items)
        stack.set(FurnitureGunComponents.BLOCK_ENTITY_DATA, FurnitureGunCustomData.of(tag))
    }
    return changed
}

PlayerEvents.tick(event => {
    const player = event.player
    if (!player.isAlive() || player.isSpectator()) return
    let changed = false
    const menu = player.containerMenu
    if (menu instanceof FurnitureGunChestMenu) {
        const container = menu.getContainer()
        if (container instanceof FurnitureGunCoffer) {
            for (let slot = 0; slot < container.getContainerSize(); slot++) {
                const gun = container.getItem(slot)
                if (!gun.isEmpty() && String(gun.id) === 'tacz:modern_kinetic_gun'
                    && furnitureCofferDropGun(player, gun)) {
                    container.removeItemNoUpdate(slot)
                    changed = true
                }
            }
            if (changed) container.setChanged()
        }
    }
    const inventory = player.getInventory()
    for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
        if (furnitureCofferCleanItem(player, inventory.getItem(slot))) changed = true
    }
    if (furnitureCofferCleanItem(player, menu.getCarried())) changed = true
    for (let slot = 1; slot <= 4; slot++) {
        if (furnitureCofferCleanItem(player, player.inventoryMenu.getSlot(slot).getItem())) changed = true
    }
    if (changed) {
        inventory.setChanged()
        menu.broadcastChanges()
        player.inventoryMenu.broadcastChanges()
        player.tell('Guns cannot be stored in coffers. Removed guns were dropped beside you.')
    }
})
