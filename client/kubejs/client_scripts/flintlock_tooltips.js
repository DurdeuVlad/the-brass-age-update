// In-game dynamic and informative tooltips for all Brass Age items and firearms.
// Ensures completely foolproof understanding for players without needing out-of-game wikis.

ItemEvents.modifyTooltips(event => {
    // 1. Nitrates, Powder Intermediates & Barrels
    event.add('kubejs:saltpeter', [
        Text.of('§7Sare de azot extrasă din depozitele carstice.'),
        Text.of('§eUtilizare: §fIngredient esențial pentru pulbere neagră (Tier 2 & 3).'),
        Text.of('§6Origine: §fMăcinare Dripstone -> Spălare cu jet de apă Create.')
    ])

    event.add('kubejs:crushed_dripstone', [
        Text.of('§7Pietriș mineral bogat în nitrați.'),
        Text.of('§6Procesare: §fSpală cu apă folosind un Encased Fan pentru a obține Salpetru Purificat.')
    ])

    event.add('kubejs:crude_gunpowder_cake', [
        Text.of('§7Pastă densă de cărbune vegetal și nitrați.'),
        Text.of('§cTier 1 (Improvizat): §fUsucă la afumătoare/foc de tabără sau presează compact.'),
        Text.of('§8Randament scăzut, dar salvator în asedii când lipsește mecanizarea.')
    ])

    event.add('kubejs:wet_powder_mass', [
        Text.of('§7Pastă umedă de pulbere neagră măcinată.'),
        Text.of('§6Siguranță: §fUmiditatea previne aprinderea accidentală în timpul malaxării.')
    ])

    event.add('kubejs:rifled_barrel', [
        Text.of('§6Țeavă Ghintuită de Înaltă Precizie'),
        Text.of('§eFabricare: §fTăiată cu burghiu mecanic Create în strung de precizie.'),
        Text.of('§aEfect: §fReduce dispersia conică cu 65% pe muscheta FK15-R Jaeger.')
    ])

    // 2. Legal Tooling & Proofing
    event.add('kubejs:proof_stamp', [
        Text.of('§6Sigiliu Imperial de Poansonare'),
        Text.of('§aUnealtă Oficială de Stat §7(Indestructibilă)'),
        Text.of('§fCombină pe nicovală cu o armă pentru a-i atribui serie legală (#RC-15-XXXX).'),
        Text.of('§cArmele nepoansonate sunt confiscate de jandarmeria din Straja!')
    ])

    event.add('kubejs:permit_blank', [
        Text.of('§eFormular de Permis de Port-Armă'),
        Text.of('§7Document vellum oficial eliberat de autoritățile administrative din Straja.')
    ])

    // 3. Civilian Commodities (P.U.L.A SRL)
    event.add('kubejs:fumigation_strip', [
        Text.of('§eFitil de Fumigare cu Sulf (Vinery)'),
        Text.of('§7P.U.L.A SRL Divizia Viticolă'),
        Text.of('§fUtilizat pentru sterilizarea și dezinfectarea butoaielor de stejar.')
    ])

    event.add('kubejs:royal_fumigation_strip', [
        Text.of('§5Fitil Regal de Fumigare Vintage'),
        Text.of('§7Sulf sublimat de calitate superioară infuzat cu lavandă.'),
        Text.of('§aEfect: §fGarantează conservarea vinului de colecție (+1 Treaptă Calitate).')
    ])

    event.add('kubejs:miracle_fertilizer', [
        Text.of('§aSuper-Fosfat Miraculos de Straja'),
        Text.of('§7Îngrășământ mineral compus (Azot + Fosfor + Sulf).'),
        Text.of('§aEfect: §fAccelerează de 3 ori viteza de rodire a plantațiilor agricole.')
    ])

    event.add('kubejs:medicated_soap', [
        Text.of('§eSăpun Medicinal Antiseptic cu Sulf'),
        Text.of('§7Igienă chimică avansată P.U.L.A SRL.'),
        Text.of('§bProprietate: §fCurăță miasmele, otrăvurile și alungă purtătorii de ciumă.')
    ])

    event.add('kubejs:sulfur_matches', [
        Text.of('§6Chibrituri Brute cu Sulf'),
        Text.of('§7Așchii de brad cu capete turnate din sulf.'),
        Text.of('§fAprindere manuală prin frecare pe piatră aspră.')
    ])

    event.add('kubejs:safety_matches', [
        Text.of('§cChibrituri Suedeze de Siguranță'),
        Text.of('§7Cutie etanșă cu suprafață de frecare cu fosfor roșu.'),
        Text.of('§aEfect: §fAprindere sigură chiar și în adâncurile umede ale minelor carstice.')
    ])

    event.add('kubejs:vitriol_leather', [
        Text.of('§2Piele Grea Tăbăcită cu Vitriol'),
        Text.of('§7Tratată în baie caldă de acid sulfuric și sulf rezidual.'),
        Text.of('§aEfect: §fOferă +50% rezistență armurilor de piele călite și hamurilor de luptă.')
    ])

    // Military Logistics Crates Tooltips
    event.add('kubejs:crate_muskets', [
        Text.of('§6📦 Ladă Militară de Muschete (8 Arme)'),
        Text.of('§7Ladă blindată din stejar și alamă pentru transport logistic.'),
        Text.of('§a✔ Conține: §f8 Muschete FK15 cu țeavă lisă.'),
        Text.of('§eLogistică: §fPoate fi încărcată în căruțe (Trotting Wagons) și trenuri Create.'),
        Text.of('§bUtilizare: §7Pune în masa de lucru sau Shift+Click-Dreapta pe sol pentru a desigila.')
    ])

    event.add('kubejs:crate_pistols', [
        Text.of('§6📦 Ladă Militară de Pistoale (8 Arme)'),
        Text.of('§7Cufăr întărit pentru armamentul ofițerilor de cavalerie.'),
        Text.of('§a✔ Conține: §f8 Pistoale FK15-P de dragon.'),
        Text.of('§eLogistică: §fPermite transportul armamentului în vrac fără penalizare de transport.'),
        Text.of('§bUtilizare: §7Pune în masa de lucru sau Shift+Click-Dreapta pe sol pentru a desigila.')
    ])

    event.add('kubejs:ammunition_crate', [
        Text.of('§6📦 Ladă Grea de Muniție (256 Cartușe)'),
        Text.of('§7Cutie etanșă militară pentru protecția pulberii și gloanțelor la umezeală.'),
        Text.of('§a✔ Conține: §f4 pachete de 64 cartușe standard (256 gloanțe).'),
        Text.of('§bUtilizare: §7Pune în masa de lucru sau Shift+Click-Dreapta pe sol pentru a desigila.')
    ])
})

// Dynamic Tooltip Provider for Firearms & Custom Ammunition via Native NeoForge Event
var $ItemTooltipEvent = null
var $Component = null
var $DataComponents = null
try {
    $ItemTooltipEvent = Java.loadClass('net.neoforged.neoforge.event.entity.player.ItemTooltipEvent')
    $Component = Java.loadClass('net.minecraft.network.chat.Component')
    $DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
} catch (e) {}

function getTooltipCustomTag(stack) {
    if (!stack || stack.isEmpty()) return null
    try {
        if ($DataComponents) {
            var data = stack.get($DataComponents.CUSTOM_DATA)
            if (data) {
                if (typeof data.copyTag === 'function') return data.copyTag()
                if (typeof data.getUnsafe === 'function') return data.getUnsafe()
            }
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

if ($ItemTooltipEvent && typeof NativeEvents !== 'undefined') {
    NativeEvents.onEvent($ItemTooltipEvent, function(event) {
        var stack = event.getItemStack()
        if (!stack || stack.isEmpty()) return
        var text = event.getToolTip()
        var tag = getTooltipCustomTag(stack)
        if (!tag) return

        var gunId = ''
        try {
            if (typeof tag.getString === 'function') gunId = String(tag.getString('GunId') || '')
            else gunId = String(tag.GunId || '')
        } catch (e) {}

        if (gunId === 'qkl:fk15' || gunId === 'qkl:fk15p') {
            var isProofed = false
            try {
                if (typeof tag.getBoolean === 'function') {
                    isProofed = tag.getBoolean('Proofed') || (tag.getInt && tag.getInt('Proofed') == 1) || String(tag.getString('Proofed')) === 'true'
                } else if (tag.Proofed) {
                    isProofed = true
                }
            } catch (e) {}

            var serial = ''
            try {
                if (typeof tag.getString === 'function') {
                    serial = tag.getString('Serial') || tag.getString('GunSerial')
                } else {
                    serial = tag.Serial || tag.GunSerial || ''
                }
            } catch (e) {}

            var isDefaced = false
            try {
                if (typeof tag.getBoolean === 'function') isDefaced = tag.getBoolean('Defaced')
                else isDefaced = !!tag.Defaced
            } catch (e) {}

            var isForged = false
            try {
                if (typeof tag.getBoolean === 'function') {
                    isForged = tag.getBoolean('Forged') || (tag.getInt && tag.getInt('Forged') == 1) || String(tag.getString('Forged')) === 'true'
                } else {
                    isForged = !!tag.Forged
                }
            } catch (e) {}

            // Provenance & Serial Status (Roleplay-Grounded Physical Tells)
            var forgeryTier = 0
            try {
                if (typeof tag.getInt === 'function') forgeryTier = tag.getInt('ForgeryTier') || tag.getInt('FakeTier')
                else forgeryTier = Number(tag.ForgeryTier || tag.FakeTier || 0)
            } catch (e) {}

            if (isDefaced) {
                text.add($Component.literal('§4⚠ SERIE PILITĂ DE PE CULATĂ'))
                text.add($Component.literal('§7Metal polizat mecanic cu tocila, marcajul imperial este complet distrus.'))
                text.add($Component.literal('§8(Urme adânci de pilire mecanică pe oțel)'))
            } else if (isProofed && serial && serial.indexOf('#RC-') === 0) {
                text.add($Component.literal('§a✔ Marcaj Oficial: §f' + serial))
                text.add($Component.literal('§7Pecete: §aAmprentă curată a Cancelariei Garnizoanei'))
                text.add($Component.literal('§8(Înscris în evidențele oficiale Straja)'))
            } else if (isForged) {
                // Civilian / unlicensed anvil stamp: physical roleplay cues without meta spoilers
                if (forgeryTier === 1) {
                    text.add($Component.literal('§a✔ Marcaj Poanson: §f' + (serial || 'Nedeterminat')))
                    text.add($Component.literal('§7Pecete: §fAmprentă mecanică uniformă, contur îngrijit'))
                    text.add($Component.literal('§8(Prezintă timbru aplicat pe culată)'))
                } else if (forgeryTier === 2) {
                    text.add($Component.literal('§2✔ Marcaj Poanson: §f' + (serial || 'Nedeterminat')))
                    text.add($Component.literal('§7Pecete: §2Oxid verde-închis vizibil la marginile literelor'))
                    text.add($Component.literal('§8(Urme de reacție la soluția de calopur)'))
                } else {
                    // Tier 3 or unclassified forged
                    text.add($Component.literal('§6✔ Marcaj Poanson: §f' + (serial || 'Nedeterminat')))
                    text.add($Component.literal('§7Pecete: §6Bavuri aspre pe metal, ștanță bătută descentrat'))
                    text.add($Component.literal('§8(Amprentă superficială cu adâncime inegală)'))
                }
            } else {
                text.add($Component.literal('§e⚠ FĂRĂ POANSON'))
                text.add($Component.literal('§7Arma nu poartă nicio ștanță sau număr de înregistrare pe culată.'))
                text.add($Component.literal('§8(Poate fi prezentată la Garnizoană cu Sigiliul Imperial pentru legalizare)'))
            }

            // Chambered Ammunition / Offhand Reload Tip
            var chamber = ''
            try {
                if (typeof tag.getString === 'function') chamber = String(tag.getString('ChamberAmmoType') || '')
                else chamber = String(tag.ChamberAmmoType || '')
            } catch (e) {}

            if (chamber === 'silver') {
                text.add($Component.literal('§b◆ Cameră Armată: §fGlonț de Argint Consfințit (×4 vs Nemorți, ×2 vs Vampiri)'))
            } else if (chamber === 'canister') {
                text.add($Component.literal('§6◆ Cameră Armată: §fGlonț tip Mitralii (Canister Knockback)'))
            } else if (chamber === 'incendiary') {
                text.add($Component.literal('§c◆ Cameră Armată: §fCartuș Incendiar cu Sulf (Aprindere 8s)'))
            } else {
                text.add($Component.literal('§f◆ Cameră Armată: §7Glonț Standard de Plumb (40–55 Dmg)'))
            }

            // Tactical guidance for players
            text.add($Component.literal('§8[Ghid] Reîncărcare: Apasă [R] având muniția dorită în offhand (mâna stângă).'))
            text.add($Component.literal('§8[Ghid] Țintire: Apasă SHIFT (Kneel) pentru a elimina reculul și dispersia.'))
        }

        // Specialized Ammunition Tooltips
        var isSilver = false
        var isCanister = false
        var isIncendiary = false
        try {
            if (typeof tag.getBoolean === 'function') {
                isSilver = tag.getBoolean('SilverAmmo') || (tag.getInt && tag.getInt('SilverAmmo') == 1) || String(tag.getString('SilverAmmo')) === 'true'
                isCanister = tag.getBoolean('CanisterAmmo') || (tag.getInt && tag.getInt('CanisterAmmo') == 1) || String(tag.getString('CanisterAmmo')) === 'true'
                isIncendiary = tag.getBoolean('IncendiaryAmmo') || (tag.getInt && tag.getInt('IncendiaryAmmo') == 1) || String(tag.getString('IncendiaryAmmo')) === 'true'
            } else {
                isSilver = !!tag.SilverAmmo
                isCanister = !!tag.CanisterAmmo
                isIncendiary = !!tag.IncendiaryAmmo
            }
        } catch (e) {}

        if (isSilver) {
            text.add($Component.literal('§b⚡ Glonț de Argint Consfințit'))
            text.add($Component.literal('§fBătut cu argint pur și binecuvântat la altar.'))
            text.add($Component.literal('§c⚔ Daune: §b×4.0 §fîmpotriva Nemorților și Creaturilor Corupte.'))
            text.add($Component.literal('§c⚔ Daune: §b×2.0 §fîmpotriva Jucătorilor Vampiri.'))
            text.add($Component.literal('§eSugestie: §7Plasează-l în mâna secundară (offhand) pentru a-l încărca primul.'))
        } else if (isCanister) {
            text.add($Component.literal('§6💥 Glonț tip Mitralii (Canister)'))
            text.add($Component.literal('§fÎncărcătură densă de alice de fier pentru luptă la mică distanță.'))
            text.add($Component.literal('§eEfect: §fDispersie largă și respingere masivă a inamicilor (Knockback).'))
            text.add($Component.literal('§eSugestie: §7Plasează-l în mâna secundară (offhand) pentru a-l încărca primul.'))
        } else if (isIncendiary) {
            text.add($Component.literal('§c🔥 Cartuș Incendiar cu Sulf'))
            text.add($Component.literal('§fMiez de plumb acoperit cu sulf sublimat și amestec piroforic.'))
            text.add($Component.literal('§eEfect: §fAprinde ținta pentru 8 secunde la impact.'))
            text.add($Component.literal('§eSugestie: §7Plasează-l în mâna secundară (offhand) pentru a-l încărca primul.'))
        }
    })
}
