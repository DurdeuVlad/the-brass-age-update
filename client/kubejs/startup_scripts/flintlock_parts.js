// New item registrations require a full Minecraft restart.
StartupEvents.registry('item', event => {
    const parts = [
        ['gun_steel_blank', 'Gun Steel Blank'],
        ['tempered_gun_steel', 'Tempered Gun Steel'],
        ['gun_screws', 'Gun Screws'],
        ['barrel_blank', 'Barrel Blank'],
        ['pistol_barrel', 'Finished Pistol Barrel'],
        ['rifle_barrel', 'Reinforced Long Barrel'],
        ['mainspring_blank', 'Mainspring Blank'],
        ['tempered_mainspring', 'Tempered Mainspring'],
        ['flintlock_hammer', 'Flintlock Hammer'],
        ['flash_pan', 'Brass Flash Pan'],
        ['trigger_assembly', 'Trigger Assembly'],
        ['flintlock_mechanism', 'Complete Flintlock Mechanism'],
        ['stock_blank', 'Hardwood Stock Blank'],
        ['pistol_stock', 'Bound Pistol Stock'],
        ['rifle_stock', 'Reinforced Rifle Stock'],
        ['barrel_band', 'Brass Barrel Band'],
        ['ramrod', 'Steel Ramrod']
    ]
    parts.forEach(part => event.create(part[0]).displayName(part[1]).texture('kubejs:item/' + part[0]))
})
