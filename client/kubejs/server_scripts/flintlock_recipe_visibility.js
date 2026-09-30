// Viewer-only hiding, synchronized by KubeJS from the server to all clients.
// Includes operators. The actual crafting recipes and item entries remain available.
// No player-installed client hiding script is required.
RecipeViewerEvents.removeRecipes(event => {
    const recipes = [
        'gun_steel_blank', 'tempered_gun_steel', 'gun_screws', 'barrel_band',
        'ramrod', 'barrel_blank', 'pistol_barrel', 'rifle_barrel', 'rifled_barrel',
        'mainspring_blank', 'tempered_mainspring', 'flintlock_hammer',
        'flash_pan', 'trigger_assembly', 'flintlock_mechanism',
        'stock_blank', 'pistol_stock', 'rifle_stock',
        'pistol', 'rifle', 'rifle_jaeger',
        'ammo_16mm', 'ammo_canister_scattershot', 'ammo_incendiary_sulfur',
        'silver_ammo_tier1', 'silver_ammo_tier2', 'silver_ammo_tier3'
    ]

    recipes.forEach(name => {
        event.remove('kubejs:flintlocks/' + name)
        // EMI wraps recipes imported from JEI with a synthetic ID.
        event.remove('jei:/kubejs/flintlocks/' + name)
    })

    // Also hide legacy gun pack recipes
    event.remove('qkl:gun/fk15')
    event.remove('qkl:gun/fk15p')
    event.remove('qkl:ammo/16mm')
    event.remove('jei:/qkl/gun/fk15')
    event.remove('jei:/qkl/gun/fk15p')
    event.remove('jei:/qkl/ammo/16mm')
})
