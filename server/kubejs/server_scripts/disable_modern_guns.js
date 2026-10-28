// Server-side recipe removal for The Brass Age Update (Rustic Craft II)
// Disables crafting of all modern firearms, ammunition, attachments, and workbenches
// not intended for the Renaissance / Early Modern setting.
// Only authentic flintlocks (FK15 Musket, FK15P Pistol, FK15-R Jaeger Musket) and
// their 16.5mm Create mechanical crafting routes remain accessible.

if (typeof ServerEvents !== 'undefined') {
ServerEvents.recipes(event => {
    // -------------------------------------------------------------------------
    // 1. BASE TACZ MODERN FIREARMS (53 Guns)
    // -------------------------------------------------------------------------
    const TACZ_MODERN_GUNS = [
        'tacz:gun/aa12',
        'tacz:gun/ai_awp',
        'tacz:gun/ak47',
        'tacz:gun/aug',
        'tacz:gun/b93r',
        'tacz:gun/cz75',
        'tacz:gun/db_long',
        'tacz:gun/db_short',
        'tacz:gun/deagle',
        'tacz:gun/deagle_golden',
        'tacz:gun/fn_evolys',
        'tacz:gun/fn_fal',
        'tacz:gun/g36k',
        'tacz:gun/glock_17',
        'tacz:gun/hk416d',
        'tacz:gun/hk_g3',
        'tacz:gun/hk_mk23',
        'tacz:gun/hk_mp5a5',
        'tacz:gun/kar98',
        'tacz:gun/lonetrail',
        'tacz:gun/m1014',
        'tacz:gun/m107',
        'tacz:gun/m16a1',
        'tacz:gun/m16a4',
        'tacz:gun/m1911',
        'tacz:gun/m249',
        'tacz:gun/m320',
        'tacz:gun/m4a1',
        'tacz:gun/m700',
        'tacz:gun/m870',
        'tacz:gun/m95',
        'tacz:gun/m9a4',
        'tacz:gun/minigun',
        'tacz:gun/mk14',
        'tacz:gun/p320',
        'tacz:gun/p90',
        'tacz:gun/qbz_191',
        'tacz:gun/qbz_95',
        'tacz:gun/rhino357',
        'tacz:gun/rpg7',
        'tacz:gun/rpk',
        'tacz:gun/scar_h',
        'tacz:gun/scar_l',
        'tacz:gun/sks_tactical',
        'tacz:gun/spas_12',
        'tacz:gun/spr15hb',
        'tacz:gun/springfield1873',
        'tacz:gun/taurus500',
        'tacz:gun/timeless50',
        'tacz:gun/type_81',
        'tacz:gun/ump45',
        'tacz:gun/uzi',
        'tacz:gun/vector45'
    ];

    // -------------------------------------------------------------------------
    // 2. CHOCOLATEMAN WWI & UNINTENDED FIREARMS (25 Guns)
    // Legacy Gun Smith Table recipes for fk15/fk15p are also removed here
    // so they can ONLY be crafted via Create Mechanical Crafters.
    // -------------------------------------------------------------------------
    const QKL_UNINTENDED_GUNS = [
        'qkl:gun/1860',
        'qkl:gun/1871',
        'qkl:gun/1912',
        'qkl:gun/1912p16',
        'qkl:gun/at50',
        'qkl:gun/cbr11',
        'qkl:gun/cbr11c',
        'qkl:gun/cbr11r',
        'qkl:gun/cbr11sp',
        'qkl:gun/cbr9',
        'qkl:gun/clf10',
        'qkl:gun/csg19',
        'qkl:gun/fk15',
        'qkl:gun/fk15p',
        'qkl:gun/hy88',
        'qkl:gun/lmg31',
        'qkl:gun/m1897',
        'qkl:gun/m1903a3',
        'qkl:gun/m1905',
        'qkl:gun/mg15',
        'qkl:gun/mu73',
        'qkl:gun/mu73m',
        'qkl:gun/mua73',
        'qkl:gun/rmg',
        'qkl:gun/waltertl'
    ];

    // -------------------------------------------------------------------------
    // 3. GUNPOWDER REVOLUTION FIREARMS (41 Guns)
    // -------------------------------------------------------------------------
    const HAMSTER_GUNS = [
        'hamster:gun/auto5',
        'hamster:gun/berthier',
        'hamster:gun/colt1873',
        'hamster:gun/colt1873_lb',
        'hamster:gun/coltm1851',
        'hamster:gun/coltm1851_chain',
        'hamster:gun/coltm1892',
        'hamster:gun/coltm1892pair',
        'hamster:gun/flaregun',
        'hamster:gun/gew98',
        'hamster:gun/gras1874',
        'hamster:gun/krag',
        'hamster:gun/lebel1886',
        'hamster:gun/lebel1886_07c',
        'hamster:gun/luger1906',
        'hamster:gun/lugerp08',
        'hamster:gun/lugerp08_artillerie',
        'hamster:gun/m1879revolver',
        'hamster:gun/m1887',
        'hamster:gun/m1887_hc',
        'hamster:gun/m1903',
        'hamster:gun/m1garand',
        'hamster:gun/madsen',
        'hamster:gun/makarov',
        'hamster:gun/martinihenry',
        'hamster:gun/mg1417',
        'hamster:gun/mosin91',
        'hamster:gun/mosin9130',
        'hamster:gun/mp18',
        'hamster:gun/nagantcarbine',
        'hamster:gun/nagantm1895',
        'hamster:gun/one_barrel',
        'hamster:gun/sharps',
        'hamster:gun/sks',
        'hamster:gun/smle_mk3',
        'hamster:gun/sw_mk2',
        'hamster:gun/type99',
        'hamster:gun/uppercut',
        'hamster:gun/webley',
        'hamster:gun/win1873',
        'hamster:gun/win1894'
    ];

    // -------------------------------------------------------------------------
    // 4. MODERN & UNINTENDED AMMUNITION RECIPES (32 Ammunition types)
    // -------------------------------------------------------------------------
    const UNINTENDED_AMMO = [
        'tacz:ammo/12g',
        'tacz:ammo/22wmr',
        'tacz:ammo/308',
        'tacz:ammo/30_06',
        'tacz:ammo/338',
        'tacz:ammo/357mag',
        'tacz:ammo/40mm',
        'tacz:ammo/45acp',
        'tacz:ammo/45_70',
        'tacz:ammo/46x30',
        'tacz:ammo/500mag',
        'tacz:ammo/50ae',
        'tacz:ammo/50bmg',
        'tacz:ammo/545x39',
        'tacz:ammo/556x45',
        'tacz:ammo/57x28',
        'tacz:ammo/58x42',
        'tacz:ammo/68x51fury',
        'tacz:ammo/762x25',
        'tacz:ammo/762x39',
        'tacz:ammo/762x54',
        'tacz:ammo/792x57',
        'tacz:ammo/9mm',
        'tacz:ammo/rpg_rocket',
        'qkl:ammo/16mm',
        'qkl:ammo/gl30',
        'qkl:ammo/rb10',
        'hamster:ammo/12g',
        'hamster:ammo/compact_ammo',
        'hamster:ammo/flares_ammo',
        'hamster:ammo/long_ammo',
        'hamster:ammo/medium_ammo'
    ];

    // -------------------------------------------------------------------------
    // 5. UNINTENDED WEAPON & ATTACHMENT WORKBENCHES
    // -------------------------------------------------------------------------
    const UNINTENDED_WORKBENCHES = [
        'tacz:gun_smith_table',
        'tacz:ammo_workbench',
        'tacz:attachment_workbench',
        'qkl:cr_workbench',
        'hamster:oldworkbench'
    ];

    // Remove all individual firearm recipes by exact ID
    const allGuns = TACZ_MODERN_GUNS.concat(QKL_UNINTENDED_GUNS, HAMSTER_GUNS);
    allGuns.forEach(id => event.remove({ id: id }));

    // Remove unintended ammunition and workbench crafting recipes
    UNINTENDED_AMMO.forEach(id => event.remove({ id: id }));
    UNINTENDED_WORKBENCHES.forEach(id => event.remove({ id: id }));

    // Bulk regex removal for any additional/variant recipes
    event.remove({ id: /^tacz:gun\/.*/ });
    event.remove({ id: /^qkl:gun\/.*/ });
    event.remove({ id: /^hamster:gun\/.*/ });
    event.remove({ id: /^tacz:ammo\/.*/ });
    event.remove({ id: /^hamster:ammo\/.*/ });
    event.remove({ id: /^tacz:attachments?\/.*/ });
    event.remove({ id: /^qkl:attachment\/.*/ });
    event.remove({ id: /^hamster:attachments?\/.*/ });

    // Global recipe type disable: shuts down all Gun Smith Table crafting recipes
    event.remove({ type: 'tacz:gun_smith_table_crafting' });
});
}

// -----------------------------------------------------------------------------
// 6. RECIPE VIEWER VISIBILITY (JEI / EMI)
// Hides all unintended guns, ammunition, and workbenches from in-game search.
// -----------------------------------------------------------------------------
if (typeof RecipeViewerEvents !== 'undefined') {
RecipeViewerEvents.removeRecipes(event => {
    const hiddenRecipes = [
        // Base TaCZ Guns
        'tacz:gun/aa12', 'tacz:gun/ai_awp', 'tacz:gun/ak47', 'tacz:gun/aug', 'tacz:gun/b93r',
        'tacz:gun/cz75', 'tacz:gun/db_long', 'tacz:gun/db_short', 'tacz:gun/deagle', 'tacz:gun/deagle_golden',
        'tacz:gun/fn_evolys', 'tacz:gun/fn_fal', 'tacz:gun/g36k', 'tacz:gun/glock_17', 'tacz:gun/hk416d',
        'tacz:gun/hk_g3', 'tacz:gun/hk_mk23', 'tacz:gun/hk_mp5a5', 'tacz:gun/kar98', 'tacz:gun/lonetrail',
        'tacz:gun/m1014', 'tacz:gun/m107', 'tacz:gun/m16a1', 'tacz:gun/m16a4', 'tacz:gun/m1911',
        'tacz:gun/m249', 'tacz:gun/m320', 'tacz:gun/m4a1', 'tacz:gun/m700', 'tacz:gun/m870',
        'tacz:gun/m95', 'tacz:gun/m9a4', 'tacz:gun/minigun', 'tacz:gun/mk14', 'tacz:gun/p320',
        'tacz:gun/p90', 'tacz:gun/qbz_191', 'tacz:gun/qbz_95', 'tacz:gun/rhino357', 'tacz:gun/rpg7',
        'tacz:gun/rpk', 'tacz:gun/scar_h', 'tacz:gun/scar_l', 'tacz:gun/sks_tactical', 'tacz:gun/spas_12',
        'tacz:gun/spr15hb', 'tacz:gun/springfield1873', 'tacz:gun/taurus500', 'tacz:gun/timeless50',
        'tacz:gun/type_81', 'tacz:gun/ump45', 'tacz:gun/uzi', 'tacz:gun/vector45',

        // ChocolateMan Guns
        'qkl:gun/1860', 'qkl:gun/1871', 'qkl:gun/1912', 'qkl:gun/1912p16', 'qkl:gun/at50',
        'qkl:gun/cbr11', 'qkl:gun/cbr11c', 'qkl:gun/cbr11r', 'qkl:gun/cbr11sp', 'qkl:gun/cbr9',
        'qkl:gun/clf10', 'qkl:gun/csg19', 'qkl:gun/fk15', 'qkl:gun/fk15p', 'qkl:gun/hy88',
        'qkl:gun/lmg31', 'qkl:gun/m1897', 'qkl:gun/m1903a3', 'qkl:gun/m1905', 'qkl:gun/mg15',
        'qkl:gun/mu73', 'qkl:gun/mu73m', 'qkl:gun/mua73', 'qkl:gun/rmg', 'qkl:gun/waltertl',

        // Gunpowder Revolution Guns
        'hamster:gun/auto5', 'hamster:gun/berthier', 'hamster:gun/colt1873', 'hamster:gun/colt1873_lb',
        'hamster:gun/coltm1851', 'hamster:gun/coltm1851_chain', 'hamster:gun/coltm1892', 'hamster:gun/coltm1892pair',
        'hamster:gun/flaregun', 'hamster:gun/gew98', 'hamster:gun/gras1874', 'hamster:gun/krag',
        'hamster:gun/lebel1886', 'hamster:gun/lebel1886_07c', 'hamster:gun/luger1906', 'hamster:gun/lugerp08',
        'hamster:gun/lugerp08_artillerie', 'hamster:gun/m1879revolver', 'hamster:gun/m1887', 'hamster:gun/m1887_hc',
        'hamster:gun/m1903', 'hamster:gun/m1garand', 'hamster:gun/madsen', 'hamster:gun/makarov',
        'hamster:gun/martinihenry', 'hamster:gun/mg1417', 'hamster:gun/mosin91', 'hamster:gun/mosin9130',
        'hamster:gun/mp18', 'hamster:gun/nagantcarbine', 'hamster:gun/nagantm1895', 'hamster:gun/one_barrel',
        'hamster:gun/sharps', 'hamster:gun/sks', 'hamster:gun/smle_mk3', 'hamster:gun/sw_mk2',
        'hamster:gun/type99', 'hamster:gun/uppercut', 'hamster:gun/webley', 'hamster:gun/win1873',
        'hamster:gun/win1894',

        // Ammunition
        'tacz:ammo/12g', 'tacz:ammo/22wmr', 'tacz:ammo/308', 'tacz:ammo/30_06', 'tacz:ammo/338',
        'tacz:ammo/357mag', 'tacz:ammo/40mm', 'tacz:ammo/45acp', 'tacz:ammo/45_70', 'tacz:ammo/46x30',
        'tacz:ammo/500mag', 'tacz:ammo/50ae', 'tacz:ammo/50bmg', 'tacz:ammo/545x39', 'tacz:ammo/556x45',
        'tacz:ammo/57x28', 'tacz:ammo/58x42', 'tacz:ammo/68x51fury', 'tacz:ammo/762x25', 'tacz:ammo/762x39',
        'tacz:ammo/762x54', 'tacz:ammo/792x57', 'tacz:ammo/9mm', 'tacz:ammo/rpg_rocket',
        'qkl:ammo/16mm', 'qkl:ammo/gl30', 'qkl:ammo/rb10',
        'hamster:ammo/12g', 'hamster:ammo/compact_ammo', 'hamster:ammo/flares_ammo',
        'hamster:ammo/long_ammo', 'hamster:ammo/medium_ammo',

        // Workbenches
        'tacz:gun_smith_table', 'tacz:ammo_workbench', 'tacz:attachment_workbench',
        'qkl:cr_workbench', 'hamster:oldworkbench'
    ];

    hiddenRecipes.forEach(name => {
        event.remove(name);
        // EMI wraps recipes imported from JEI with a synthetic ID (single colon: jei:/namespace/path)
        event.remove('jei:/' + name.replace(':', '/'));
    });
});
}
