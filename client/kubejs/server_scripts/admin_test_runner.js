// Interactive Step-by-Step In-Game Test Guide for The Brass Age (v1.1.0)
// OP-only command system that handhelds admins through all 9 test scenarios.
// Features clickable chat buttons: [Equip Kit], [Confirm & Next], [Previous], [Spawn Mob].
//
// Commands:
//   /brass_test              - Shows current test step
//   /brass_test next         - Confirms current test and advances to next step
//   /brass_test prev         - Goes back to previous step
//   /brass_test give         - Equips the test kit / items for current step
//   /brass_test spawn        - Spawns target mob for combat testing (Step 7)
//   /brass_test goto <1..9>  - Jumps directly to a specific step
//   /brass_test <1..9>       - Shortcut to jump to step
//   /brass_test reset        - Resets progress to Step 1 and clears negative effects
//
// Aliases: /gunsmith_test, /testguide, /ghid_test

const $Test_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')

const TEST_STEPS = [
    {
        num: 1,
        title: "Rețete Secrete Create (3×3 Mechanical Crafter)",
        subtitle: "Secretizarea Armelor & Asamblarea Cinetică",
        desc: [
            "§71. Deschide o masă clasică de lucru (§fCrafting Table§7). Pune componentele unei arme.",
            "§72. Caută în §fEMI / JEI§7 după 'FK15' sau 'Flintlock'.",
            "§73. Construiește rețeaua §f3×3 Create Mechanical Crafter§7 legată la o manivelă (§fHand Crank§7).",
            "§74. Așază componentele în craftere și rotește manivela pentru asamblare mecanică."
        ],
        expected: [
            "§e• Masa de lucru clasică arată slotul de ieșire §cCOMPLET GOL§e (rețeta a fost ștearsă).",
            "§e• În EMI / JEI rețeta de masă de lucru §cNU există deloc§e (secret de stat).",
            "§e• Rețeaua Create produce cu succes pistolul §aFK15-P§e la finalul rotației."
        ],
        kitCommands: [
            "give {player} minecraft:crafting_table 1",
            "give {player} create:mechanical_crafter 9",
            "give {player} create:hand_crank 1",
            "give {player} create:wrench 1",
            "give {player} kubejs:pistol_barrel 1",
            "give {player} kubejs:flintlock_mechanism 1",
            "give {player} kubejs:ramrod 1",
            "give {player} kubejs:gun_screws 1",
            "give {player} kubejs:pistol_stock 1",
            "give {player} kubejs:barrel_band 1",
            "give {player} kubejs:tempered_gun_steel 1",
            "give {player} minecraft:leather 1"
        ]
    },
    {
        num: 2,
        title: "Manualul Oficial al Armurierului (Patchouli)",
        subtitle: "Comanda Admin & Diagramele Secrete de Asamblare",
        desc: [
            "§71. Dă click pe butonul de kit pentru a primi manualul oficial (§f/gunsmith book§7).",
            "§72. Deschide cartea Patchouli primită: §eThe Gunsmith's Book of Work§7.",
            "§73. Deschide capitolul §fVI. The Final Assembly§7 și alege §fFK15P Cavalry Pistol§7."
        ],
        expected: [
            "§e• Cartea se deschide fără erori în interfața grafică Patchouli.",
            "§e• Pagina afișează diagrama completă 3×3 Mechanical Crafter cu schema componentelor.",
            "§e• Doar administratorii (§cOP level 2§e) pot rula comanda /gunsmith."
        ],
        kitCommands: [
            "give {player} patchouli:guide_book[patchouli:book=\"patchouli:rustic_gunsmith\"] 1"
        ]
    },
    {
        num: 3,
        title: "Limita de Purtare a Armelor (Hard Cap)",
        subtitle: "Restricția la Maxim 1 Pușcă și 2 Pistoale pe Jos",
        desc: [
            "§71. Dă click pe butonul de kit pentru a primi 2 muschete și 3 pistoale.",
            "§72. Încearcă să le ții pe toate simultan în inventarul activ sau în grid-ul 2×2."
        ],
        expected: [
            "§e• A doua muschetă (sau al 3-lea pistol) este §cARUNCATĂ AUTOMAT PE PĂMÂNT§e la picioare.",
            "§e• În chat apare avertizarea roșie a garnizoanei: §c'Nu poți purta mai mult de 1 armă lungă pe umeri!'§e.",
            "§e• Primești efectele temporare Slowness II și Mining Fatigue II dacă depășești limita."
        ],
        kitCommands: [
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15\"}] 2",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\"}] 3"
        ]
    },
    {
        num: 4,
        title: "Ritualul de Poansonare Legală pe Nicovală",
        subtitle: "Ștanțarea Serie Oficiale #RC-15-XXXX & Consum XP",
        desc: [
            "§71. Dă click pe butonul de kit pentru o nicovală, Sigiliul Imperial, XP și un pistol nepoansonat.",
            "§72. Plasează nicovala pe sol și deschide-o.",
            "§73. Pune arma în primul slot (stânga) și Sigiliul Imperial în al doilea slot (mijloc).",
            "§74. Ridică arma din al treilea slot și inspectează tooltip-ul.",
            "§75. Încearcă să pui arma deja poansonată din nou pe nicovală cu sigiliul."
        ],
        expected: [
            "§e• Nicovala consumă §a5 niveluri de XP§e. Sigiliul Imperial este salvat (nu se consumă).",
            "§e• Se aude sunetul auriu de ding de nicovală.",
            "§e• Arma primește NBT: §aProofed:true§e și o serie unică (ex. §a#RC-15-0105§e).",
            "§e• Re-poansonarea unei arme deja înregistrate este §cREFUZATĂ§e."
        ],
        kitCommands: [
            "give {player} minecraft:anvil 1",
            "give {player} kubejs:proof_stamp 1",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\"}] 1",
            "experience add {player} 30 levels"
        ]
    },
    {
        num: 5,
        title: "Emiterea Permisului Oficial de Port-Armă",
        subtitle: "Legarea Serie într-o Carte Scrisă Semnată",
        desc: [
            "§71. Dă click pe butonul de kit pentru formulare de permis albe și o armă poansonată.",
            "§72. Ține arma poansonată în mâna secundară (§fOffhand§7, slotul de scut, tasta §fF§7).",
            "§73. Pune §fFormularul de Permis Blank§7 în mâna dreaptă și dă §fClick-Dreapta§7.",
            "§74. Deschide cartea scrisă primită în inventar.",
            "§75. Pune o armă nepoansonată în stânga și dă click-dreapta cu permisul."
        ],
        expected: [
            "§e• Se consumă 1 formular alb și primești o carte scrisă semnată de §aComandamentul Straja§e.",
            "§e• Cartea conține numele tău de jucător, seria exactă a armei și statutul §aLEGAL / ÎNREGISTRAT§e.",
            "§e• Pentru arma nepoansonată comanda refuză emiterea: §c'Arma din mâna stângă nu este poansonată legal!'§e."
        ],
        kitCommands: [
            "give {player} kubejs:permit_blank 4",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\",Proofed:1b,Serial:\"#RC-15-0105\",GunSerial:\"#RC-15-0105\",OwnerUUID:\"00000000-0000-0000-0000-000000000000\"}] 1"
        ]
    },
    {
        num: 6,
        title: "Piața Neagră — Pilirea Serie pe Tocilă",
        subtitle: "Ștergerea Serie pentru Contrabandiști (Grindstone Defacing)",
        desc: [
            "§71. Dă click pe butonul de kit pentru o tocilă (§fGrindstone§7) și o armă poansonată legal.",
            "§72. Pune tocila pe sol.",
            "§73. Poți pili seria fie prin §fShift + Click-Dreapta cu arma pe tocilă§7, fie deschizând tocila și punând arma în slotul de sus.",
            "§74. Verifică tooltip-ul armei: apare §c⚠ [SERIE PILITĂ / DEFACED]§7.",
            "§75. Încearcă să re-poansonezi arma pilită pe nicovală cu Sigiliul Imperial."
        ],
        expected: [
            "§e• Tocila șterge complet seria și lore-ul oficial Straja.",
            "§e• Arma primește lore-ul roșu de contrabandă: §c⚠ [SERIE PILITĂ / DEFACED]§e.",
            "§e• Nicovala refuză ștanțarea armelor pilite (statut definitiv de piață neagră)."
        ],
        kitCommands: [
            "give {player} minecraft:grindstone 1",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\",Proofed:1b,Serial:\"#RC-15-0105\",GunSerial:\"#RC-15-0105\"}] 1"
        ]
    },
    {
        num: 7,
        title: "Muniție Specială & Luptă Tactică",
        subtitle: "Cartușe de Argint (Vampiri/Nemorți), Mitralii & Incendiare",
        desc: [
            "§71. Dă click pe butonul de kit pentru muschetă și cele 3 tipuri de cartușe 16.5mm.",
            "§72. Pune §bCartușe de Argint§7 în mâna stângă (offhand) și apasă §f[R]§7 pentru reîncărcare.",
            "§73. Folosește butonul §c[Spawn Zombie]§7 sau marchează-te cu §4[Vampir]§7 și trage.",
            "§74. Pune §6Mitralii (Canister Shot)§7 în mâna stângă, reîncarcă și trage.",
            "§75. Pune §cGlonț Incendiar§7 în mâna stângă, reîncarcă și trage."
        ],
        expected: [
            "§e• Glonțul de Argint provoacă clinchet de ametist și §a4.0× daune§e nemorților, §a2.0× daune§e vampirilor.",
            "§e• Mitraliile aruncă un con de 8 alice cu împrăștiere mare și knockback puternic.",
            "§e• Glonțul incendiar aprinde ținta în flăcări timp de 8 secunde."
        ],
        kitCommands: [
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15\"}] 1",
            "give {player} tacz:ammo[minecraft:custom_data={AmmoId:\"qkl:16mm\",SilverAmmo:1b},minecraft:item_name='{\"text\":\"Glonț de Argint Consfințit\",\"color\":\"aqua\",\"bold\":true,\"italic\":false}'] 64",
            "give {player} tacz:ammo[minecraft:custom_data={AmmoId:\"qkl:16mm\",CanisterAmmo:1b},minecraft:item_name='{\"text\":\"Glonț tip Mitralii (Canister)\",\"color\":\"gold\",\"bold\":true,\"italic\":false}'] 64",
            "give {player} tacz:ammo[minecraft:custom_data={AmmoId:\"qkl:16mm\",IncendiaryAmmo:1b},minecraft:item_name='{\"text\":\"Cartuș Incendiar cu Sulf\",\"color\":\"red\",\"bold\":true,\"italic\":false}'] 64"
        ]
    },
    {
        num: 8,
        title: "Lăzi Militare Sigilate & Logistică Create",
        subtitle: "Transportul în Vrac de Armament & Desigilarea în Teren",
        desc: [
            "§71. Dă click pe butonul de kit pentru lăzi sigilate de muschete, pistoale și muniție.",
            "§72. Verifică faptul că poți purta multiple lăzi în inventar fără să cadă pe sol.",
            "§73. Pune o ladă în mână, ține apăsat §fSHIFT (crouch)§7 și dă §fClick-Dreapta pe sol§7.",
            "§74. Testează și desigilarea unei lăzi de muniție."
        ],
        expected: [
            "§e• Se aude sunetul de scânduri rupte și zăvor de fier deschis.",
            "§e• Lada se sparge și descarcă pe loc conținutul (8 muschete / 8 pistoale / 256 muniții).",
            "§e• Jucătorul primește un cufăr de lemn înapoi în inventar."
        ],
        kitCommands: [
            "give {player} kubejs:crate_muskets 2",
            "give {player} kubejs:crate_pistols 2",
            "give {player} kubejs:ammunition_crate 2"
        ]
    },
    {
        num: 9,
        title: "Mina Straja — Deblocare Ramura 4 & Comerț de Stat",
        subtitle: "Noua Zonă Strategică: Sulf, Diamante & Redstone",
        desc: [
            "§71. Mergi la mina Straja și vorbește cu NPC-ul Mirel.",
            "§72. Verifică cerințele de deblocare pentru cele 4 ramuri:",
            "§7   • Ramura 1: Sulf 900, Fier 600, Cărbune 700, Dripstone 300.",
            "§7   • Ramura 2: Dripstone ×2000, Sulf ×500.",
            "§7   • Ramura 3: Fier ×800, Zinc ×600, Sulf ×200, Andesit ×500.",
            "§7   • Ramura 4: Sulf ×1000, Diamante ×100, Redstone ×500.",
            "§73. Apasă butonul final de confirmare pentru a încheia suita de testare!"
        ],
        expected: [
            "§e• Economia este calibrată: resursele de bază din ramurile 1-3 susțin industria primară.",
            "§e• Ramura 4 oferă monopolul strategic necesar armelor de foc și tehnologiilor avansate.",
            "§e• Toate cele 9 sisteme The Brass Age sunt validate complet în joc."
        ],
        kitCommands: [
            "give {player} minecraft:dripstone_block 64",
            "give {player} kubejs:crushed_dripstone 64",
            "give {player} minecraft:iron_ingot 64",
            "give {player} create:zinc_ingot 64",
            "give {player} minecraft:diamond 64",
            "give {player} minecraft:redstone 64"
        ]
    }
]

function getPlayerStep(player) {
    if (!player) return 1
    const s = player.persistentData.getInt('BrassTestStep')
    return (s >= 1 && s <= 9) ? s : 1
}

function setPlayerStep(player, step) {
    if (!player) return
    player.persistentData.putInt('BrassTestStep', step)
}

function sendInteractiveStep(server, player, stepNum) {
    if (stepNum < 1) stepNum = 1
    if (stepNum > 9) stepNum = 9
    
    const step = TEST_STEPS[stepNum - 1]
    
    player.sendSystemMessage(Text.literal('§6§l╔════════════════════════════════════════════════════════╗'))
    player.sendSystemMessage(Text.literal(`§6§l║   GHID TESTARE THE BRASS AGE: PASUL ${step.num}/9             ║`))
    player.sendSystemMessage(Text.literal(`§e§l   ${step.title}`))
    player.sendSystemMessage(Text.literal(`§7   ${step.subtitle}`))
    player.sendSystemMessage(Text.literal('§6§l╠════════════════════════════════════════════════════════╣'))
    
    player.sendSystemMessage(Text.literal('§b▶ CE AI DE FĂCUT (Instrucțiuni Pas-cu-Pas):'))
    step.desc.forEach(line => player.sendSystemMessage(Text.literal('  ' + line)))
    
    player.sendSystemMessage(Text.literal('§a▶ COMPORTAMENT AȘTEPTAT (Ce trebuie să vezi):'))
    step.expected.forEach(line => player.sendSystemMessage(Text.literal('  ' + line)))
    
    player.sendSystemMessage(Text.literal('§6§l╠════════════════════════════════════════════════════════╣'))
    
    // Row 1: Action / Equip Kit buttons
    let btnKit = Text.literal('§a§l[ 📦 DĂ-MI KITUL DE TEST ]')
    try {
        btnKit = btnKit.clickRunCommand('/brass_test give')
                       .hover(Text.literal('§eClick pentru a primi automat toate materialele necesare acestui pas.'))
    } catch (e) {}

    let row1 = btnKit
    
    if (stepNum === 2) {
        let btnBook = Text.literal('  §b§l[ 📖 DESCHIDE MANUALUL ]')
        try {
            btnBook = btnBook.clickRunCommand('/gunsmith book @s')
                             .hover(Text.literal('§eClick pentru a primi și deschide Manualul Oficial al Armurierului.'))
        } catch (e) {}
        row1 = row1.append(btnBook)
    } else if (stepNum === 7) {
        let btnZombie = Text.literal('  §c§l[ 👾 SPAWN ZOMBIE ]')
        try {
            btnZombie = btnZombie.clickRunCommand('/brass_test spawn')
                                 .hover(Text.literal('§eClick pentru a spawna o țintă zombie în fața ta.'))
        } catch (e) {}
        let btnVamp = Text.literal('  §4§l[ 🧛 MARCHEAZĂ CA VAMPIR ]')
        try {
            btnVamp = btnVamp.clickRunCommand('/vampire add @s')
                             .hover(Text.literal('§eClick pentru a te marca ca vampir și a testa vulnerabilitatea la argint.'))
        } catch (e) {}
        row1 = row1.append(btnZombie).append(btnVamp)
    }
    
    player.displayClientMessage(row1, false)
    
    // Row 2: Navigation & Confirmation buttons
    let nextLabel = (stepNum === 9) ? '§6§l[ ✔ CONFIRMĂ & FINALIZEAZĂ TESTUL! ]' : '§6§l[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]'
    let btnNext = Text.literal(nextLabel)
    try {
        btnNext = btnNext.clickRunCommand('/brass_test next')
                         .hover(Text.literal('§aClick după ce ai verificat comportamentul pentru a trece la pasul următor.'))
    } catch (e) {}

    let btnPrev = Text.literal('  §7[ ◀ Pasul Anterior ]')
    try {
        btnPrev = btnPrev.clickRunCommand('/brass_test prev')
                         .hover(Text.literal('§7Click pentru a te întoarce la pasul anterior.'))
    } catch (e) {}

    let btnReset = Text.literal('  §8[ 🔄 Reset ]')
    try {
        btnReset = btnReset.clickRunCommand('/brass_test reset')
                           .hover(Text.literal('§cClick pentru a reseta progresul la Pasul 1.'))
    } catch (e) {}

    let row2 = btnNext
    if (stepNum > 1) {
        row2 = row2.append(btnPrev)
    }
    row2 = row2.append(btnReset)
    
    player.displayClientMessage(row2, false)
    player.sendSystemMessage(Text.literal('§6§l╚════════════════════════════════════════════════════════╝'))
    
    player.playSound('minecraft:item.book.page_turn', 0.8, 1.0)
}

function sendTestCompleteScreen(server, player) {
    player.sendSystemMessage(Text.literal('§a§l╔════════════════════════════════════════════════════════╗'))
    player.sendSystemMessage(Text.literal('§a§l║       🎉 SUITA DE TESTARE A FOST FINALIZATĂ! 🎉        ║'))
    player.sendSystemMessage(Text.literal('§a§l╠════════════════════════════════════════════════════════╣'))
    player.sendSystemMessage(Text.literal('§e✔ Toate cele 9 scenarii de testare au fost confirmate cu succes!'))
    player.sendSystemMessage(Text.literal('§7  • 1. Create Mechanical Crafter 3×3 & Secretizare Rețete'))
    player.sendSystemMessage(Text.literal('§7  • 2. Manualul Patchouli al Armurierului (/gunsmith book)'))
    player.sendSystemMessage(Text.literal('§7  • 3. Limită Realistă de Transport & Drop pe Pământ'))
    player.sendSystemMessage(Text.literal('§7  • 4. Poansonare Legală pe Nicovală (#RC-15-XXXX)'))
    player.sendSystemMessage(Text.literal('§7  • 5. Permis Oficial de Port-Armă (Carte Semnată Straja)'))
    player.sendSystemMessage(Text.literal('§7  • 6. Piața Neagră: Pilirea Serie pe Tocilă (Defaced)'))
    player.sendSystemMessage(Text.literal('§7  • 7. Balistică Specială: Cartușe Argint, Mitralii & Incendiar'))
    player.sendSystemMessage(Text.literal('§7  • 8. Lăzi Militare Sigilate de Transport & Logistică'))
    player.sendSystemMessage(Text.literal('§7  • 9. Mina Straja: Ramura 4 & Economia Resurselor'))
    player.sendSystemMessage(Text.literal('§a§l╠════════════════════════════════════════════════════════╣'))
    player.sendSystemMessage(Text.literal('§fDacă dorești să reiei testele: §b/brass_test reset'))
    player.sendSystemMessage(Text.literal('§a§l╚════════════════════════════════════════════════════════╝'))

    player.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0)
    server.runCommandSilent(`effect clear ${player.name.string}`)
}

function giveStepKit(server, player, stepNum) {
    const step = TEST_STEPS[stepNum - 1]
    const pName = player.name.string
    
    server.runCommandSilent(`effect clear ${pName}`)
    
    step.kitCommands.forEach(cmd => {
        const fullCmd = cmd.replace(/{player}/g, pName)
        server.runCommandSilent(fullCmd)
    })
    
    player.playSound('minecraft:entity.item.pickup', 1.0, 1.2)
    player.displayClientMessage(Text.literal(`§a✔ [Kit Pasul ${stepNum}] Ți-au fost adăugate în inventar toate materialele necesare!`), true)
}

function spawnStepMob(server, player) {
    const pName = player.name.string
    server.runCommandSilent(`execute at ${pName} run summon minecraft:zombie ^ ^ ^5 {CustomName:'{"text":"Țintă de Antrenament (Zombie)","color":"red"}',NoAI:1b,Glowing:1b}`)
    player.playSound('minecraft:entity.zombie.ambient', 1.0, 1.0)
    player.displayClientMessage(Text.literal('§c✔ [Țintă Spawnată] Un zombie imobilizat a fost plasat în fața ta pentru tir!'), true)
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands

    function registerTestRunner(alias) {
        event.register(
            Commands.literal(alias)
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    let player = null
                    try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                    if (!player) {
                        ctx.source.sendFailure(Text.literal('§cAceastă comandă poate fi rulată doar de un jucător.'))
                        return 0
                    }
                    const step = getPlayerStep(player)
                    sendInteractiveStep(ctx.source.server, player, step)
                    return 1
                })
                .then(Commands.literal('next')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        const current = getPlayerStep(player)
                        if (current >= 9) {
                            sendTestCompleteScreen(ctx.source.server, player)
                            return 1
                        }
                        const nextStep = current + 1
                        setPlayerStep(player, nextStep)
                        player.playSound('minecraft:entity.player.levelup', 0.8, 1.2)
                        sendInteractiveStep(ctx.source.server, player, nextStep)
                        return 1
                    })
                )
                .then(Commands.literal('prev')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        const current = getPlayerStep(player)
                        const prevStep = Math.max(1, current - 1)
                        setPlayerStep(player, prevStep)
                        sendInteractiveStep(ctx.source.server, player, prevStep)
                        return 1
                    })
                )
                .then(Commands.literal('give')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        const step = getPlayerStep(player)
                        giveStepKit(ctx.source.server, player, step)
                        return 1
                    })
                )
                .then(Commands.literal('spawn')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        spawnStepMob(ctx.source.server, player)
                        return 1
                    })
                )
                .then(Commands.literal('reset')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        setPlayerStep(player, 1)
                        ctx.source.server.runCommandSilent(`effect clear ${player.name.string}`)
                        player.sendSystemMessage(Text.literal('§e[Ghid Testare] Progresul a fost resetat la Pasul 1.'))
                        sendInteractiveStep(ctx.source.server, player, 1)
                        return 1
                    })
                )
                .then(Commands.literal('goto')
                    .then(Commands.argument('step', $Test_IntegerArgument.integer(1, 9))
                        .executes(ctx => {
                            let player = null
                            try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                            if (!player) return 0
                            const targetStep = $Test_IntegerArgument.getInteger(ctx, 'step')
                            setPlayerStep(player, targetStep)
                            sendInteractiveStep(ctx.source.server, player, targetStep)
                            return 1
                        })
                    )
                )
                .then(Commands.argument('step', $Test_IntegerArgument.integer(1, 9))
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        const targetStep = $Test_IntegerArgument.getInteger(ctx, 'step')
                        setPlayerStep(player, targetStep)
                        sendInteractiveStep(ctx.source.server, player, targetStep)
                        return 1
                    })
                )
        )
    }

    registerTestRunner('brass_test')
    registerTestRunner('gunsmith_test')
    registerTestRunner('testguide')
    registerTestRunner('ghid_test')
})
