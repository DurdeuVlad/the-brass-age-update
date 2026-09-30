// New item registrations require a full Minecraft restart.
StartupEvents.registry('item', event => {
    const parts = [
        ['gun_steel_blank', 'Gun Steel Blank'],
        ['tempered_gun_steel', 'Tempered Gun Steel'],
        ['gun_screws', 'Gun Screws'],
        ['barrel_blank', 'Barrel Blank'],
        ['pistol_barrel', 'Finished Pistol Barrel'],
        ['rifle_barrel', 'Reinforced Long Barrel'],
        ['rifled_barrel', 'Spiral Rifled Barrel'],
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
        ['ramrod', 'Steel Ramrod'],

        // Chemical, Nitrate & Powder Intermediates
        ['saltpeter', 'Purified Saltpeter'],
        ['crushed_dripstone', 'Crushed Dripstone'],
        ['crude_gunpowder_cake', 'Crude Gunpowder Cake'],
        ['wet_powder_mass', 'Wet Powder Mass'],

        // Legal Tooling
        ['permit_blank', 'Firearm Permit Blank'],

        // Civilian Commodities
        ['fumigation_strip', 'Sulfur Cask Fumigation Strip'],
        ['royal_fumigation_strip', 'Royal Vintage Fumigation Strip'],
        ['miracle_fertilizer', 'Miracle Super-Phosphate Fertilizer'],
        ['medicated_soap', 'Antiseptic Medicated Sulfur Soap'],
        ['sulfur_matches', 'Crude Sulfur Matches'],
        ['safety_matches', 'Safety Matchbox'],
        ['vitriol_leather', 'Vitriol Heavy Leather'],

        // Military Logistics Crates (Bulk Transport replacing coffers)
        ['crate_muskets', 'Military Musket Crate'],
        ['crate_pistols', 'Officer Pistol Crate'],
        ['ammunition_crate', 'Heavy Ammunition Crate']
    ]

    parts.forEach(part => {
        event.create(part[0])
            .displayName(part[1])
            .texture('kubejs:item/' + part[0])
    })

    // Imperial Proof Stamp: indestructible master guild inspection tool.
    // Stamped on firearms to establish legal provenance (#RC-15-XXXX).
    // Note: unstackable() without maxDamage(0) to avoid 1.21.1 NeoForge zero-durability exception.
    event.create('proof_stamp')
        .displayName('Imperial Proof Stamp')
        .unstackable()
        .texture('kubejs:item/proof_stamp')
})
