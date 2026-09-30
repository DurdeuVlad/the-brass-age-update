// Server-managed tags, reapplied on /reload and synchronized to clients.
// Supplementaries coffers and sacks delegate insertion to its shulker checks.
ServerEvents.tags('item', event => {
    event.add('supplementaries:shulker_blacklist', 'tacz:modern_kinetic_gun')
    console.info('[Gun storage] Added all TaCZ guns to Supplementaries shulker/coffer blacklist.')
})

ServerEvents.loaded(event => {
    const gun = Item.of('tacz:modern_kinetic_gun')
    if (!Ingredient.of('#supplementaries:shulker_blacklist').test(gun)) {
        console.error('[Gun storage] TaCZ gun blacklist tag is missing! Check server tag loading.')
    } else {
        console.info('[Gun storage] Verified TaCZ gun blacklist tag is active.')
    }
})
