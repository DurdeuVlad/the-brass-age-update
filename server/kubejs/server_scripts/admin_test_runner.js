// Interactive Step-by-Step In-Game Test Guide for The Brass Age (v1.2.0)
// OP-only command system that handhelds admins through all 16 test scenarios.
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
const $Test_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')

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
    },
    {
        num: 10,
        title: "Registrul Central & Coada de Așteptare (Pending Rollover)",
        subtitle: "Înregistrarea Armelor de Foc & Maturarea Zilnică la Straja",
        desc: [
            "§71. Dă click pe butonul de kit pentru pistol, formulare și cartea de patrulă.",
            "§72. Înregistrează seria armei în registru: §f/straja register_serial #RC-15-9999 @s§7.",
            "§73. Verifică starea armei: §f/straja lookup #RC-15-9999§7 (va arăta starea §ePENDING§7).",
            "§74. Deschide cartea de patrulă: apasă pe butonul §b[📖 Cartea de Patrulă]§7.",
            "§75. Treci ziua: apasă pe butonul §6[🌅 Treci Ziua (Rollover)]§7 și verifică din nou statusul."
        ],
        expected: [
            "§e• Arma nou înregistrată intră în coada §ePENDING§e și devine legală doar după trecerea zilei.",
            "§e• Cartea de patrulă fizică prezintă lista armelor oficiale și indicii subtile de inspecție.",
            "§e• După comanda §a/straja rollover§e, arma devine oficial §aLEGALĂ / MATURATĂ§e în registru."
        ],
        kitCommands: [
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\",Proofed:1b,Serial:\"#RC-15-9999\",GunSerial:\"#RC-15-9999\"}] 1",
            "give {player} kubejs:permit_blank 2",
            "straja book give {player}"
        ]
    },
    {
        num: 11,
        title: "Licențierea Personalului (Inspectori & Transportatori)",
        subtitle: "Autorizarea Oficială pentru Ștanțare și Logistică Militarizată",
        desc: [
            "§71. Folosește butonul §a[👮 Fă-mă Inspector]§7 pentru a primi licența oficială de inspector.",
            "§72. Verifică lista de inspectori autorizați: §f/straja inspector list§7.",
            "§73. Pune o armă nouă pe nicovală cu Sigiliul Imperial (ștanțarea va fi §aAUTENTICĂ§7).",
            "§74. Folosește butonul §6[🚚 Fă-mă Transportator]§7 pentru statutul de transportator autorizat.",
            "§75. Folosește butonul §c[👤 Fă-mă Civil / Infractor]§7 pentru a revoca licențele și a redeveni civil."
        ],
        expected: [
            "§e• Doar inspectorii licențiați pot bate pe nicovală serii oficiale autentice #RC-15-XXXX.",
            "§e• Transportatorii licențiați sunt scutiți de confiscarea armamentului la punctele de control.",
            "§e• Comutarea rolurilor funcționează instantaneu cu feedback clar și sunet specific."
        ],
        kitCommands: [
            "give {player} minecraft:anvil 1",
            "give {player} kubejs:proof_stamp 1",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\"}] 1",
            "experience add {player} 30 levels"
        ]
    },
    {
        num: 12,
        title: "Piața Neagră — Falsificare \"Papers, Please\"",
        subtitle: "Generarea Falsurilor cu Șanse Calibrate: 5% T1, 50% T2, 45% T3",
        desc: [
            "§71. Asigură-te că ești civil neautorizat (apasă §c[👤 Setează-mă Civil]§7).",
            "§72. Dă click pe butonul §c[📦 Pachet Falsuri Complete]§7 pentru a primi mostre din fiecare nivel.",
            "§73. Inspectează fiecare armă în inventar:",
            "§7   • §bNivel 1 (5%)§7: Fals aproape perfect (cifră romană inversată, ex: #RC-XV-9012).",
            "§7   • §eNivel 2 (50%)§7: Fals comun cu defecte de font (ex: #RC-15_4481).",
            "§7   • §cNivel 3 (45%)§7: Fals grosolan zgâriat la rece (ex: #RUSTY-GUN-99).",
            "§74. Încearcă să ștanțezi manual pe nicovală ca civil pentru a testa generarea aleatorie."
        ],
        expected: [
            "§e• Ștanțarea de către jucători nelicențiați generează automat falsuri marcate cu FakeTier.",
            "§e• Falsurile au defecte vizuale subtile conforme cu indiciile din cartea de patrulă Straja.",
            "§e• Pachetul de test conține mostre gata create pentru fiecare nivel de fals fără a irosi timp la nicovală."
        ],
        kitCommands: [
            "brass_test fakes"
        ]
    },
    {
        num: 13,
        title: "Punctul de Control Straja (Scanerul de Contrabandă)",
        subtitle: "Identificarea Automată a Armelor Ilegale & Purtarea Cratelor",
        desc: [
            "§71. Dă click pe butonul §e[⚡ Auto-Setup Checkpoint & Închisoare]§7 (configurează punctul instant!).",
            "§72. Ține în mână o armă poansonată legal și apasă §a[🚨 Testează Trecere Legală]§7.",
            "§73. Ține în mână o armă cu serie pilită (Defaced) sau o armă Nivel 3 și apasă §c[🚨 Testează Trecere Ilegală]§7.",
            "§74. Pune o ladă militară sigilată în mână și testează din nou trecerea."
        ],
        expected: [
            "§e• Trecerea cu armă legală sau statut de inspector/transportator: §aACCES PERMIS (Verde)§e.",
            "§e• Trecerea cu armă nepoansonată sau pilită: §cAvertisment sau respingere la punctul de control§e.",
            "§e• Trecerea cu fals grosolan Nivel 3: §4Alarmă de contrabandă gravă & trimitere automată la arest§e.",
            "§e• Lăzile militare sigilate sunt permise pentru transport fără a declanșa confiscarea."
        ],
        kitCommands: [
            "brass_test setup",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\",Proofed:1b,Serial:\"#RC-15-0105\",GunSerial:\"#RC-15-0105\"}] 1",
            "give {player} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:\"qkl:fk15p\",Defaced:1b}] 1",
            "give {player} kubejs:crate_muskets 1"
        ]
    },
    {
        num: 14,
        title: "Arest Penitenciar Automatizat & Eliberare din Celulă",
        subtitle: "Sistemul Custodiei Straja, Confiscarea Bunurilor & Salvarea de Urgență",
        desc: [
            "§71. Asigură-te că punctul și închisoarea sunt configurate (§f/brass_test setup§7).",
            "§72. Apasă pe butonul §4§l[ ⛓️ SIMULEAZĂ ARESTAREA ]§7.",
            "§73. Observă efectul de întunecare a ecranului, modul Aventură și teleportarea în celulă.",
            "§74. Pentru a ieși fără nicio problemă, apasă pe butonul §a§l[ 🔓 ELIBEREAZĂ-MĂ IMEDIAT ]§7.",
            "§75. Verifică restabilirea modului de joc și restituirea bunurilor."
        ],
        expected: [
            "§e• Jucătorul este plasat în celulă, în modul Aventură, iar tentativa de evadare îl declară FUGITIV.",
            "§e• Butonul de eliberare §a[🔓 Eliberează-mă Imediat]§e funcționează garantat pentru orice tester."
        ],
        kitCommands: [
            "brass_test setup"
        ]
    },
    {
        num: 15,
        title: "Alchimia Netherless — Nivel 1 & 2 (Netherrack, Magmă, Foc, Nisip Suflet)",
        subtitle: "Producția Minerală În Lumea Reală (Crafting Table & Bazin Cinetic)",
        desc: [
            "§71. Folosește butonul §a[📦 Dă-mi Kitul de Test]§7 pentru a primi ingredientele minerale.",
            "§72. Test Nivel 1 (Manual): Combină Cobblestone + Redstone + Găleată de Lavă în masa de lucru -> §f1 Netherrack§7.",
            "§73. Test Nivel 1 (Manual): Combină Slimeball + Sulf Karstic în masa de lucru -> §f1 Magma Cream§7.",
            "§74. Test Nivel 1 (Manual): Combină Nisip + Făină de Oase + Cărbune + Pământ -> §f1 Nisip al Sufletelor§7.",
            "§75. Test Nivel 2 (Cinetic): Pune într-un Bazin Create cu mixer (neîncălzit) 1 Cobble + 1 Redstone + 100mB Lavă -> §f2 Netherrack§7."
        ],
        expected: [
            "§e• Masa de lucru generează componentele de bază chiar și fără forță mecanică (rețete de urgență).",
            "§e• Bazinul Create neîncălzit dublează producția (2x Netherrack, 3x Magma Cream, 4x Soul Sand).",
            "§e• Nu este necesar niciun acces în Nether pentru a demara producția!"
        ],
        kitCommands: [
            "brass_test netherless"
        ]
    },
    {
        num: 16,
        title: "Alchimia Netherless — Nivel 3 (Tije de Văpaie, Cuarț, Supapă Blaze Burner & Lacrimi)",
        subtitle: "Surge Termic cu Sulf, Spălare cu Ventilator & Asamblare Secvențială",
        desc: [
            "§71. Dă click pe butonul de kit pentru utilaje avansate, șmirghel și sulf.",
            "§72. Test Cuarț Nivel 2: Plasează Nisip al Sufletelor în fața unui ventilator cu apă (Splashing) -> §fCuarț + Pepite de Aur§7.",
            "§73. Test Tije Văpaie: Lustruiește un cărbune cu șmirghel pentru a obține Tijă de Cărbune, apoi infuzează cu sulf și lavă -> §fTije de Văpaie§7.",
            "§74. Test Trezire Blaze Burner (Nivel 2): Amestecă într-un bazin neîncălzit Cușcă Burner + 4 Sulf + 2 Salpetru + Magmă + 1000mB Lavă -> §acreate:blaze_burner§7!",
            "§75. Test Nivel 3 Surge Termic: Pornește un Blaze Burner sub bazin cu 4 Nisip + 2 Salpetru + 1 Sulf + 250mB Lavă -> §616 Nisip al Sufletelor (400% surge)§7!"
        ],
        expected: [
            "§e• Ventilatorul spală Cuarț Nether din nisipul de suflete creat în Overworld.",
            "§e• Tija de cărbune și sulful karstic sintetizează tije de văpaie (Blaze Rods) fără niciun Blaze.",
            "§e• Bazinul neîncălzit aprinde un nou Blaze Burner etern, deblocând tehnologia termică Create!",
            "§e• Nivelul 3 (Heated Surge) oferă saltul industrial masiv de 400% pe toate resursele de Nether."
        ],
        kitCommands: [
            "brass_test netherless"
        ]
    }
]

function getPlayerStep(player) {
    if (!player) return 1
    const s = player.persistentData.getInt('BrassTestStep')
    return (s >= 1 && s <= 16) ? s : 1
}

function setPlayerStep(player, step) {
    if (!player) return
    player.persistentData.putInt('BrassTestStep', step)
}

function sendInteractiveStep(server, player, stepNum) {
    if (stepNum < 1) stepNum = 1
    if (stepNum > 16) stepNum = 16
    
    const step = TEST_STEPS[stepNum - 1]
    
    player.sendSystemMessage(Text.literal('§6§l╔════════════════════════════════════════════════════════╗'))
    player.sendSystemMessage(Text.literal(`§6§l║   GHID TESTARE THE BRASS AGE: PASUL ${step.num}/16            ║`))
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
    } else if (stepNum === 10) {
        let btnRollover = Text.literal('  §6§l[ 🌅 TRECI ZIUA (ROLLOVER) ]')
        try {
            btnRollover = btnRollover.clickRunCommand('/brass_test rollover')
                                     .hover(Text.literal('§eClick pentru a forța trecerea zilei și maturarea armelor din pending.'))
        } catch (e) {}
        let btnPatrol = Text.literal('  §b§l[ 📖 CARTEA DE PATRULĂ ]')
        try {
            btnPatrol = btnPatrol.clickRunCommand('/straja book give @s')
                                 .hover(Text.literal('§eClick pentru a primi registrul fizic Straja cu indicii de inspecție.'))
        } catch (e) {}
        row1 = row1.append(btnRollover).append(btnPatrol)
    } else if (stepNum === 11) {
        let btnInsp = Text.literal('  §a§l[ 👮 FĂ-MĂ INSPECTOR ]')
        try {
            btnInsp = btnInsp.clickRunCommand('/brass_test role inspector')
                             .hover(Text.literal('§eClick pentru a deveni Inspector Autorizat (ștanțare legală).'))
        } catch (e) {}
        let btnTransp = Text.literal('  §6§l[ 🚚 TRANSPORTATOR ]')
        try {
            btnTransp = btnTransp.clickRunCommand('/brass_test role transporter')
                                 .hover(Text.literal('§eClick pentru a deveni Transportator (scutit la puncte de control).'))
        } catch (e) {}
        let btnCivil = Text.literal('  §c§l[ 👤 CIVIL / INFRACTOR ]')
        try {
            btnCivil = btnCivil.clickRunCommand('/brass_test role civil')
                               .hover(Text.literal('§eClick pentru a revoca licențele și a deveni civil neautorizat.'))
        } catch (e) {}
        row1 = row1.append(btnInsp).append(btnTransp).append(btnCivil)
    } else if (stepNum === 12) {
        let btnFakes = Text.literal('  §c§l[ 📦 PACHET FALSURI (T1, T2, T3) ]')
        try {
            btnFakes = btnFakes.clickRunCommand('/brass_test fakes')
                               .hover(Text.literal('§eClick pentru a primi mostre gata create: Tier 1 (5%), Tier 2 (50%), Tier 3 (45%) și defaced.'))
        } catch (e) {}
        let btnCivil2 = Text.literal('  §e§l[ 👤 FĂ-MĂ CIVIL ]')
        try {
            btnCivil2 = btnCivil2.clickRunCommand('/brass_test role civil')
                                 .hover(Text.literal('§eClick pentru a fi civil nelicențiat când testezi ștanțarea manuală.'))
        } catch (e) {}
        row1 = row1.append(btnFakes).append(btnCivil2)
    } else if (stepNum === 13) {
        let btnSetup = Text.literal('  §e§l[ ⚡ AUTO-SETUP CHECKPOINT ]')
        try {
            btnSetup = btnSetup.clickRunCommand('/brass_test setup')
                               .hover(Text.literal('§eClick pentru a configura automat punctul de control și celula la poziția ta!'))
        } catch (e) {}
        let btnPass = Text.literal('  §a§l[ 🚨 TEST TRECERE LEGALĂ ]')
        try {
            btnPass = btnPass.clickRunCommand('/brass_test checkpoint_test clean')
                             .hover(Text.literal('§eClick pentru a simula verificarea unei arme legale.'))
        } catch (e) {}
        let btnFail = Text.literal('  §4§l[ 🚨 TEST TRECERE ILEGALĂ ]')
        try {
            btnFail = btnFail.clickRunCommand('/brass_test checkpoint_test t3')
                             .hover(Text.literal('§eClick pentru a simula verificarea unui fals grosolan T3.'))
        } catch (e) {}
        row1 = row1.append(btnSetup).append(btnPass).append(btnFail)
    } else if (stepNum === 14) {
        let btnArrest = Text.literal('  §4§l[ ⛓️ SIMULEAZĂ AREST ]')
        try {
            btnArrest = btnArrest.clickRunCommand('/brass_test arrest_sim')
                                 .hover(Text.literal('§eClick pentru a declanșa arestarea, modul Aventură și trimiterea în celulă.'))
        } catch (e) {}
        let btnUnjail = Text.literal('  §a§l[ 🔓 ELIBEREAZĂ-MĂ IMEDIAT ]')
        try {
            btnUnjail = btnUnjail.clickRunCommand('/brass_test release')
                                 .hover(Text.literal('§aClick pentru a fi eliberat instant și a-ți recupera modul de joc și libertatea!'))
        } catch (e) {}
        row1 = row1.append(btnArrest).append(btnUnjail)
    } else if (stepNum === 15) {
        let btnNether = Text.literal('  §6§l[ 🌋 KIT NETHERLESS T1 & T2 ]')
        try {
            btnNether = btnNether.clickRunCommand('/brass_test netherless')
                                 .hover(Text.literal('§eClick pentru a primi resursele de sinteză chimică (Netherrack, Magmă, Nisip Suflete).'))
        } catch (e) {}
        let btnBasin = Text.literal('  §e§l[ ⚙️ UTILAJ CREATE ]')
        try {
            btnBasin = btnBasin.clickRunCommand('/give @s create:basin 1')
                               .hover(Text.literal('§eClick pentru a primi un Bazin Create suplimentar.'))
        } catch (e) {}
        row1 = row1.append(btnNether).append(btnBasin)
    } else if (stepNum === 16) {
        let btnSurge = Text.literal('  §c§l[ 🔥 KIT SURGE & BURNER T3 ]')
        try {
            btnSurge = btnSurge.clickRunCommand('/brass_test netherless')
                               .hover(Text.literal('§eClick pentru a primi tije, cuarț, șmirghel, burner și componente industriale.'))
        } catch (e) {}
        let btnBurner = Text.literal('  §6§l[ ♨️ BLAZE BURNER ACTIV ]')
        try {
            btnBurner = btnBurner.clickRunCommand('/give @s create:blaze_burner 1')
                                 .hover(Text.literal('§eClick pentru un Blaze Burner gata aprins pentru testarea surge-ului termic.'))
        } catch (e) {}
        row1 = row1.append(btnSurge).append(btnBurner)
    }
    
    player.displayClientMessage(row1, false)
    
    // Row 2: Navigation & Confirmation buttons
    let nextLabel = (stepNum === 16) ? '§6§l[ ✔ CONFIRMĂ & FINALIZEAZĂ TESTUL! ]' : '§6§l[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]'
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
    player.sendSystemMessage(Text.literal('§e✔ Toate cele 16 scenarii de testare au fost confirmate cu succes!'))
    player.sendSystemMessage(Text.literal('§7  • 1. Create Mechanical Crafter 3×3 & Secretizare Rețete'))
    player.sendSystemMessage(Text.literal('§7  • 2. Manualul Patchouli al Armurierului (/gunsmith book)'))
    player.sendSystemMessage(Text.literal('§7  • 3. Limită Realistă de Transport & Drop pe Pământ'))
    player.sendSystemMessage(Text.literal('§7  • 4. Poansonare Legală pe Nicovală (#RC-15-XXXX)'))
    player.sendSystemMessage(Text.literal('§7  • 5. Permis Oficial de Port-Armă (Carte Semnată Straja)'))
    player.sendSystemMessage(Text.literal('§7  • 6. Piața Neagră: Pilirea Serie pe Tocilă (Defaced)'))
    player.sendSystemMessage(Text.literal('§7  • 7. Balistică Specială: Cartușe Argint, Mitralii & Incendiar'))
    player.sendSystemMessage(Text.literal('§7  • 8. Lăzi Militare Sigilate de Transport & Logistică'))
    player.sendSystemMessage(Text.literal('§7  • 9. Mina Straja: Ramura 4 & Economia Resurselor'))
    player.sendSystemMessage(Text.literal('§7  • 10. Registrul Central al Garnizoanei & Rollover 24h'))
    player.sendSystemMessage(Text.literal('§7  • 11. Licențierea Oficială: Inspectori & Transportatori'))
    player.sendSystemMessage(Text.literal('§7  • 12. Falsificare "Papers, Please" (5% T1, 50% T2, 45% T3)'))
    player.sendSystemMessage(Text.literal('§7  • 13. Punctul de Control Straja & Scaner Contrabandă'))
    player.sendSystemMessage(Text.literal('§7  • 14. Arest Penitenciar Automatizat & Eliberare Garantată'))
    player.sendSystemMessage(Text.literal('§7  • 15. Alchimia Netherless N1 & N2 (Netherrack, Magmă, Suflete)'))
    player.sendSystemMessage(Text.literal('§7  • 16. Alchimia Netherless N3 (Tije Văpaie, Surge Termic & Burner)'))
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
        if (cmd === 'brass_test fakes') {
            giveFakesPack(server, player)
        } else if (cmd === 'brass_test setup') {
            runTesterSetup(server, player)
        } else if (cmd === 'brass_test netherless') {
            giveNetherlessKit(server, player)
        } else {
            const fullCmd = cmd.replace(/{player}/g, pName)
            server.runCommandSilent(fullCmd)
        }
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

function resolvePlayerName(playerOrName) {
    if (!playerOrName) return 'Tester'
    if (typeof playerOrName === 'string') return playerOrName
    if (playerOrName.name && playerOrName.name.string) return playerOrName.name.string
    return String(playerOrName)
}

function resolvePlayerEntity(server, playerOrName) {
    if (!playerOrName) return null
    if (playerOrName.level || playerOrName.minecraftEntity || (playerOrName.name && playerOrName.name.string)) {
        return playerOrName
    }
    var name = resolvePlayerName(playerOrName)
    return server.getPlayerList().getPlayerByName(name)
}

function runTesterSetup(server, playerOrName) {
    var pName = resolvePlayerName(playerOrName)
    var player = resolvePlayerEntity(server, playerOrName)

    var dim = 'minecraft:overworld'
    var x = 0, y = 64, z = 0, yaw = 0
    if (player) {
        try {
            dim = String(player.level.dimension)
            x = Math.floor(player.x)
            y = Math.floor(player.y)
            z = Math.floor(player.z)
            yaw = Math.round(Number(player.getYRot()))
        } catch (e) {}
    }

    // 1. Setup Checkpoint site 'test_checkpoint'
    try {
        var cpCfg = { sites: {}, contraband: {}, banned: {}, exempt: {} }
        var craw = String(server.persistentData.getString('portCheckpointCfg') || '')
        if (craw.length > 2) cpCfg = JSON.parse(craw)
        if (!cpCfg.sites) cpCfg.sites = {}
        cpCfg.sites['test_checkpoint'] = {
            name: 'test_checkpoint',
            denyTarget: { dim: dim, x: x - 3, y: y, z: z, yaw: (yaw + 180) % 360 },
            doors: [],
            evidence: [],
            cb: {},
            exempt: {}
        }
        server.persistentData.putString('portCheckpointCfg', JSON.stringify(cpCfg))
    } catch (e) {
        console.error('[TesterSetup] CP config error: ' + e)
    }

    // 2. Setup Prison jailTarget & test cell
    try {
        var spCfg = { jailTarget: null, jcells: [], pcells: [] }
        var sraw = String(server.persistentData.getString('strajaPrisonCfg') || '')
        if (sraw.length > 2) spCfg = JSON.parse(sraw)
        spCfg.jailTarget = { dim: dim, x: x + 5, y: y, z: z, yaw: yaw }
        if (!spCfg.jcells) spCfg.jcells = []
        var found = false
        for (var i = 0; i < spCfg.jcells.length; i++) {
            if (spCfg.jcells[i].testCell) {
                spCfg.jcells[i] = { dim: dim, x: x + 5, y: y, z: z, yaw: yaw, removed: false, testCell: true }
                found = true
                break
            }
        }
        if (!found) {
            spCfg.jcells.push({ dim: dim, x: x + 5, y: y, z: z, yaw: yaw, removed: false, testCell: true })
        }
        server.persistentData.putString('strajaPrisonCfg', JSON.stringify(spCfg))
    } catch (e) {
        console.error('[TesterSetup] SP config error: ' + e)
    }

    try {
        if (typeof spCfgLoad === 'function') spCfgLoad(server)
        if (typeof cpJailLoad === 'function') cpJailLoad(server)
    } catch (e) {}

    // 3. Clear any existing jail or fugitive tags if player is online
    if (player) {
        player.persistentData.remove('cpJailed')
        player.persistentData.remove('cpFugitive')
        player.persistentData.remove('strajaThief')
        player.persistentData.remove('strajaWantedUntil')

        // 4. Send Confirmation Card
        player.sendSystemMessage(Text.literal('§a§l╔════════════════════════════════════════════════════════╗'))
        player.sendSystemMessage(Text.literal('§a§l║       ⚡ AUTO-SETUP PUNCT CONTROL & ÎNCHISOARE ⚡      ║'))
        player.sendSystemMessage(Text.literal('§a§l╠════════════════════════════════════════════════════════╣'))
        player.sendSystemMessage(Text.literal(`§e✔ Checkpoint Punct Respingere (§fDeny§e): §b(${x-3}, ${y}, ${z})`))
        player.sendSystemMessage(Text.literal(`§e✔ Celulă Închisoare & Punct Comun (§fJail§e): §b(${x+5}, ${y}, ${z})`))
        player.sendSystemMessage(Text.literal('§e✔ Autoritate Eliberare (§fJailer Status§e): §aGARANTATĂ (OP Level 2)'))
        player.sendSystemMessage(Text.literal('§7  Mediul este 100% pregătit. Poți testa fără nicio altă configurare!'))
        player.sendSystemMessage(Text.literal('§a§l╚════════════════════════════════════════════════════════╝'))

        player.playSound('minecraft:block.beacon.activate', 1.0, 1.2)
    }
}

function runTesterRelease(server, player, targetName) {
    var tName = targetName ? resolvePlayerName(targetName) : (player ? resolvePlayerName(player) : 'Tester')
    var tPlayer = server.getPlayerList().getPlayerByName(tName)

    server.runCommandSilent(`strajaprison release ${tName} 0`)

    if (tPlayer) {
        tPlayer.persistentData.remove('cpJailed')
        tPlayer.persistentData.remove('cpFugitive')
        tPlayer.persistentData.remove('strajaThief')
        tPlayer.persistentData.remove('strajaWantedUntil')

        try {
            if (tPlayer.gameMode && tPlayer.gameMode.getGameModeForPlayer().name() === 'ADVENTURE') {
                tPlayer.setGameMode('survival')
            }
        } catch (e) {}

        tPlayer.sendSystemMessage(Text.literal('§a✔ [Eliberare Garantată] Ai fost eliberat din arest! Modul de joc și libertatea au fost restabilite.'))
        tPlayer.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0)
    }
    if (player && player.sendSystemMessage) {
        player.sendSystemMessage(Text.literal(`§a✔ Comanda de eliberare executată pentru: §e${tName}`))
    }
}

function runTesterRole(server, playerOrName, role) {
    var pName = resolvePlayerName(playerOrName)
    var player = resolvePlayerEntity(server, playerOrName)
    var r = String(role || '').toLowerCase()
    if (r === 'inspector') {
        server.runCommandSilent(`straja inspector add ${pName}`)
        if (player) {
            player.sendSystemMessage(Text.literal('§a✔ [Rol Actualizat] Ești acum §e§lINSPECTOR AUTORIZAT§a de armament!'))
            player.sendSystemMessage(Text.literal('§7  Poți bate legal pe nicovală serii oficiale #RC-15 și emite permise de port-armă.'))
            player.playSound('minecraft:item.armor.equip_gold', 1.0, 1.2)
        }
    } else if (r === 'transporter') {
        server.runCommandSilent(`straja transporter add ${pName}`)
        if (player) {
            player.sendSystemMessage(Text.literal('§a✔ [Rol Actualizat] Ești acum §e§lTRANSPORTATOR AUTORIZAT§a de logistică!'))
            player.sendSystemMessage(Text.literal('§7  Ești scutit la punctele de control când transporți armament și lăzi militare sigilate.'))
            player.playSound('minecraft:item.armor.equip_iron', 1.0, 1.2)
        }
    } else if (r === 'civil' || r === 'criminal' || r === 'civilian') {
        server.runCommandSilent(`straja inspector remove ${pName}`)
        server.runCommandSilent(`straja transporter remove ${pName}`)
        if (player) {
            player.sendSystemMessage(Text.literal('§c✔ [Rol Actualizat] Ești acum §fCIVIL / INFRACTOR NEAUTORIZAT§c!'))
            player.sendSystemMessage(Text.literal('§7  Ștanțarea pe nicovală produce falsuri (5% T1, 50% T2, 45% T3). Punctul de control te va verifica.'))
            player.playSound('minecraft:entity.villager.no', 1.0, 1.0)
        }
    } else {
        if (player) {
            player.sendSystemMessage(Text.literal(`§cRol necunoscut: ${role}. Folosește: inspector, transporter, civil`))
        }
    }
}

function giveFakesPack(server, player) {
    var pName = player.name.string

    // 1. Tier 1 Near-Perfect Fake (5%)
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p",Proofed:1b,Serial:"#RC-XV-9012",GunSerial:"#RC-XV-9012",FakeTier:1b,Counterfeit:1b},minecraft:item_name='{"text":"Pistol FK15-P [T1 Aproape Perfect]","color":"aqua","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RC-XV-9012","color":"gray","italic":false}','{"text":"(Fals subtil: cifră romană inversată)","color":"dark_gray","italic":true}']] 1`)

    // 2. Tier 2 Common Flawed Fake (50%)
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p",Proofed:1b,Serial:"#RC-15_4481",GunSerial:"#RC-15_4481",FakeTier:2b,Counterfeit:1b},minecraft:item_name='{"text":"Pistol FK15-P [T2 Fals Comun]","color":"gold","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RC-15_4481","color":"gray","italic":false}','{"text":"(Fals comun: font asimetric / separator)","color":"dark_gray","italic":true}']] 1`)

    // 3. Tier 3 Botched Fake (45%)
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p",Proofed:1b,Serial:"#RUSTY-GUN-99",GunSerial:"#RUSTY-GUN-99",FakeTier:3b,Counterfeit:1b},minecraft:item_name='{"text":"Pistol FK15-P [T3 Fals Grosolan]","color":"red","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RUSTY-GUN-99","color":"gray","italic":false}','{"text":"⚠ [Fals grosolan: zgâriat la rece]","color":"dark_red","bold":true,"italic":false}']] 1`)

    // 4. Defaced Gun
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p",Defaced:1b},minecraft:item_name='{"text":"Pistol FK15-P [Serie Pilită]","color":"dark_red","bold":true,"italic":false}',minecraft:lore=['{"text":"⚠ [SERIE PILITĂ / DEFACED]","color":"red","bold":true,"italic":false}']] 1`)

    // 5. Unmarked Gun
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p"},minecraft:item_name='{"text":"Pistol FK15-P [Nepoansonat]","color":"white","italic":false}'] 1`)

    // 6. Authentic Gun
    server.runCommandSilent(`give ${pName} tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p",Proofed:1b,Serial:"#RC-15-0105",GunSerial:"#RC-15-0105"},minecraft:item_name='{"text":"Pistol FK15-P [Legal #RC-15-0105]","color":"green","bold":true,"italic":false}'] 1`)

    // 7. Counterfeit Permit Documents (T1, T2, T3) + Authentic Permit
    server.runCommandSilent(`give ${pName} minecraft:written_book[minecraft:written_book_content={title:'Permis Port-Arma #RC-1S-9012',author:'Gheorghe Comandatul',pages:['{"text":"§6§lPERMIS PORT-ARMĂ§r\\n\\n§0Posesor: §1${pName}\\n§0Serie: §2#RC-1S-9012\\n§0Model: §0Flintlock 16.5mm\\n§0Statut: §2LEGAL / ÎNREGISTRAT\\n§0Emis: §82026-10-08\\n\\n§8Cancelaria Garnizoanei Straja."}','{"text":"§6§lDISPOZIȚII LEGALE§r\\n\\n§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja."}']},minecraft:custom_data={ForgedPermit:1b,FakeTier:1b,Serial:"#RC-1S-9012"},minecraft:item_name='{"text":"Permis Port-Armă [T1 Fals Subtil]","color":"aqua","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RC-1S-9012","color":"gray","italic":false}','{"text":"(Caligrafie imperială aproape identică)","color":"dark_gray","italic":true}']] 1`)

    server.runCommandSilent(`give ${pName} minecraft:written_book[minecraft:written_book_content={title:'Permis Armă #RC-15_4481',author:'Gheorge Comandantul',pages:['{"text":"§6§lPERMIS PORT-ARMĂ§r\\n\\n§0Posesor: §1${pName}\\n§0Serie: §2#RC-15_4481\\n§0Model: §0Flintlock 16.5mm\\n§0Statut: §aLEGAL / STRAJA\\n§0Emis: §82026-10-08\\n\\n§8Cancelaria Garnizoana Straja\\n§8[Cerneală întinsă de calopur]"}','{"text":"§6§lDISPOZIȚII LEGALE§r\\n\\n§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja."}']},minecraft:custom_data={ForgedPermit:1b,FakeTier:2b,Serial:"#RC-15_4481"},minecraft:item_name='{"text":"Permis Port-Armă [T2 Fals Comun]","color":"gold","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RC-15_4481","color":"gray","italic":false}','{"text":"⚠ [Document cu nereguli grafice]","color":"yellow","italic":false}','{"text":"Piața Neagră","color":"dark_gray","italic":true}']] 1`)

    server.runCommandSilent(`give ${pName} minecraft:written_book[minecraft:written_book_content={title:'Hârtie de Armă #RUSTY-GUN-99',author:'Comandant Gheorghe',pages:['{"text":"§6§lPERMIS PORT-ARMĂ§r\\n\\n§0Posesor: §1${pName}\\n§0Serie: §2#RUSTY-GUN-99\\n§0Model: §0Flintlock 16.5mm\\n§0Statut: §cAPROBAT PE CINSTE\\n§0Emis: §82026-10-08\\n\\n§8Atelier Mahala Obor\\n§4FALS GROSOLAN"}','{"text":"§6§lDISPOZIȚII LEGALE§r\\n\\n§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja."}']},minecraft:custom_data={ForgedPermit:1b,FakeTier:3b,Serial:"#RUSTY-GUN-99"},minecraft:item_name='{"text":"Permis Port-Armă [T3 Fals Grosolan]","color":"red","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RUSTY-GUN-99","color":"gray","italic":false}','{"text":"✖ [FALS GROSOLAN / IMITAȚIE RIDICOLĂ]","color":"dark_red","bold":true,"italic":false}','{"text":"Contrabandă Grad 3","color":"red","italic":false}']] 1`)

    server.runCommandSilent(`give ${pName} minecraft:written_book[minecraft:written_book_content={title:'Permis Port-Arma #RC-15-0105',author:'Gheorghe Comandantul',pages:['{"text":"§6§lPERMIS PORT-ARMĂ§r\\n\\n§0Posesor: §1${pName}\\n§0Serie: §2#RC-15-0105\\n§0Model: §0Flintlock 16.5mm\\n§0Statut: §2LEGAL / ÎNREGISTRAT\\n§0Emis: §82026-10-08\\n\\n§8Cancelaria Garnizoanei Straja"}','{"text":"§6§lDISPOZIȚII LEGALE§r\\n\\n§0Prezentul act certifică înregistrarea armei în evidențele oficiale Straja."}']},minecraft:custom_data={PermitOfficial:1b,Serial:"#RC-15-0105"},minecraft:item_name='{"text":"Permis Port-Armă Oficial","color":"gold","bold":true,"italic":false}',minecraft:lore=['{"text":"Serie: #RC-15-0105","color":"gray","italic":false}','{"text":"✔ Autentificat de Garnizoana Straja","color":"green","italic":false}']] 1`)

    player.playSound('minecraft:entity.item.pickup', 1.0, 1.2)
    player.sendSystemMessage(Text.literal('§a✔ [Pachet Falsuri Livrat] Ai primit mostre gata create: Arme (T1, T2, T3, Pilit, Nepoansonat, Legal) + Permise (T1, T2, T3 și Oficial)!'))
}

function runTesterCheckpointTest(server, player, mode) {
    var pName = player.name.string
    var m = String(mode || 'clean').toLowerCase()
    if (m === 'clean' || m === 'legal') {
        server.runCommandSilent(`strajacheckpoint inspect ${pName}`)
        player.sendSystemMessage(Text.literal('§a✔ [Simulare Trecere Legală] Verificarea la punctul de control a fost declanșată!'))
    } else if (m === 't3' || m === 'contraband' || m === 'illegal') {
        server.runCommandSilent(`strajacheckpoint arrest ${pName}`)
        player.sendSystemMessage(Text.literal('§c✔ [Simulare Arestare Contrabandă] Scanerul a trimis suspectul direct la închisoare!'))
    }
}

function runTesterArrestSim(server, player) {
    var pName = player.name.string
    server.runCommandSilent(`gamemode survival ${pName}`)
    server.runCommandSilent(`strajaprison arrest ${pName} Testare Sistem Custodie Straja v1.2.0`)
    player.sendSystemMessage(Text.literal('§4⛓️ [Simulare Arest Lansată] Vei fi teleportat în celulă și trecut în modul Aventură!'))
}

function giveNetherlessKit(server, player) {
    var pName = player.name.string

    // Tier 1 & Precursors
    server.runCommandSilent(`give ${pName} minecraft:cobblestone 16`)
    server.runCommandSilent(`give ${pName} minecraft:redstone 16`)
    server.runCommandSilent(`give ${pName} butchery:sulfur 32`)
    server.runCommandSilent(`give ${pName} kubejs:saltpeter 16`)
    server.runCommandSilent(`give ${pName} minecraft:slime_ball 16`)
    server.runCommandSilent(`give ${pName} minecraft:sand 16`)
    server.runCommandSilent(`give ${pName} minecraft:dirt 16`)
    server.runCommandSilent(`give ${pName} minecraft:bone_meal 16`)
    server.runCommandSilent(`give ${pName} minecraft:coal 16`)
    server.runCommandSilent(`give ${pName} minecraft:charcoal 16`)
    var powderId = Item.exists('tacz_c:gunpowder_charge') ? 'tacz_c:gunpowder_charge' : 'minecraft:gunpowder'
    server.runCommandSilent(`give ${pName} ${powderId} 16`)
    server.runCommandSilent(`give ${pName} minecraft:flint 16`)
    server.runCommandSilent(`give ${pName} minecraft:iron_nugget 16`)
    server.runCommandSilent(`give ${pName} minecraft:phantom_membrane 4`)
    server.runCommandSilent(`give ${pName} minecraft:glass_bottle 8`)
    server.runCommandSilent(`give ${pName} minecraft:obsidian 8`)
    server.runCommandSilent(`give ${pName} create:iron_sheet 8`)
    server.runCommandSilent(`give ${pName} minecraft:lava_bucket 2`)
    server.runCommandSilent(`give ${pName} minecraft:water_bucket 2`)

    // Create Machines & Tooling for T2/T3
    server.runCommandSilent(`give ${pName} create:sand_paper 1`)
    server.runCommandSilent(`give ${pName} create:basin 2`)
    server.runCommandSilent(`give ${pName} create:mechanical_mixer 1`)
    server.runCommandSilent(`give ${pName} create:mechanical_press 1`)
    server.runCommandSilent(`give ${pName} create:encased_fan 1`)
    server.runCommandSilent(`give ${pName} create:crushing_wheel 2`)
    server.runCommandSilent(`give ${pName} create:empty_blaze_burner 2`)
    server.runCommandSilent(`give ${pName} create:blaze_burner 1`)
    server.runCommandSilent(`give ${pName} kubejs:coal_rod 8`)

    player.playSound('minecraft:entity.item.pickup', 1.0, 1.2)
    player.sendSystemMessage(Text.literal('§6✔ [Kit Alchimie Netherless Livrat]§f Ai primit toate ingredientele de sinteză (Cobble, Redstone, Sulf, Salpetru, Slime, Cărbune, Lavă, Apă, Bazine Create, Burner și Șmirghel)!'))
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
                        if (current >= 16) {
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
                .then(Commands.literal('setup')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            runTesterSetup(ctx.source.server, player)
                            return 1
                        }
                        var list = ctx.source.server.getPlayerList().getPlayers()
                        if (list.size() > 0) {
                            runTesterSetup(ctx.source.server, list.get(0))
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Setup executat pentru ' + list.get(0).name.string))
                            return 1
                        }
                        runTesterSetup(ctx.source.server, 'ConsoleAdmin')
                        ctx.source.sendSystemMessage(Text.literal('§a✔ Setup executat la coordonate de bază (0, 64, 0).'))
                        return 1
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            var targetPlayer = ctx.source.server.getPlayerList().getPlayerByName(target)
                            if (targetPlayer) {
                                runTesterSetup(ctx.source.server, targetPlayer)
                            } else {
                                runTesterSetup(ctx.source.server, target)
                            }
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Setup executat pentru: ' + target))
                            return 1
                        })
                    )
                )
                .then(Commands.literal('release')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            runTesterRelease(ctx.source.server, player, player.name.string)
                            return 1
                        }
                        var list = ctx.source.server.getPlayerList().getPlayers()
                        if (list.size() > 0) {
                            runTesterRelease(ctx.source.server, list.get(0), list.get(0).name.string)
                            return 1
                        }
                        return 0
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            let player = null
                            try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            runTesterRelease(ctx.source.server, player, target)
                            return 1
                        })
                    )
                )
                .then(Commands.literal('unjail')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            runTesterRelease(ctx.source.server, player, player.name.string)
                            return 1
                        }
                        return 0
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            let player = null
                            try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            runTesterRelease(ctx.source.server, player, target)
                            return 1
                        })
                    )
                )
                .then(Commands.literal('role')
                    .then(Commands.argument('roleName', $Test_StringArgument.word())
                        .executes(ctx => {
                            let player = null
                            try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                            var r = $Test_StringArgument.getString(ctx, 'roleName')
                            if (player) {
                                runTesterRole(ctx.source.server, player, r)
                                return 1
                            }
                            var list = ctx.source.server.getPlayerList().getPlayers()
                            if (list.size() > 0) {
                                runTesterRole(ctx.source.server, list.get(0), r)
                                ctx.source.sendSystemMessage(Text.literal('§a✔ Rol ' + r + ' setat pentru ' + list.get(0).name.string))
                                return 1
                            }
                            runTesterRole(ctx.source.server, 'TestPlayer', r)
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Rol ' + r + ' setat pentru TestPlayer'))
                            return 1
                        })
                        .then(Commands.argument('target', $Test_StringArgument.word())
                            .executes(ctx => {
                                var r = $Test_StringArgument.getString(ctx, 'roleName')
                                var target = $Test_StringArgument.getString(ctx, 'target')
                                runTesterRole(ctx.source.server, target, r)
                                ctx.source.sendSystemMessage(Text.literal('§a✔ Rol ' + r + ' setat pentru ' + target))
                                return 1
                            })
                        )
                    )
                )
                .then(Commands.literal('help')
                    .executes(ctx => {
                        ctx.source.sendSystemMessage(Text.literal('§6§l╔════════════════════════════════════════════════════════╗'))
                        ctx.source.sendSystemMessage(Text.literal('§6§l║      GHID COMENZI TESTARE IN-GAME (BRASS TEST)         ║'))
                        ctx.source.sendSystemMessage(Text.literal('§6§l╠════════════════════════════════════════════════════════╣'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test [1..16]       §7- Deschide pasul de testare specificat'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test next | prev    §7- Navighează înainte/înapoi între pași'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test give           §7- Echipează kitul pentru pasul curent'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test reset          §7- Resetează progresul la Pasul 1'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test netherless     §7- Kit complet alchimie Netherless (T1-T3)'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test fakes          §7- Pachet arme & permise contrafăcute'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test setup          §7- Construiește celula de testare'))
                        ctx.source.sendSystemMessage(Text.literal('§b/brass_test release        §7- Eliberează imediat din închisoare'))
                        ctx.source.sendSystemMessage(Text.literal('§b/straja test               §7- Rulează suita completă de 30 teste automate'))
                        ctx.source.sendSystemMessage(Text.literal('§6§l╚════════════════════════════════════════════════════════╝'))
                        return 1
                    })
                )
                .then(Commands.literal('fakes')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            giveFakesPack(ctx.source.server, player)
                            return 1
                        }
                        var list = ctx.source.server.getPlayerList().getPlayers()
                        if (list.size() > 0) {
                            giveFakesPack(ctx.source.server, list.get(0))
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Pachet falsuri oferit jucătorului ' + list.get(0).name.string))
                            return 1
                        }
                        ctx.source.sendSystemMessage(Text.literal('§cNu există niciun jucător online.'))
                        return 0
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            var targetPlayer = ctx.source.server.getPlayerList().getPlayerByName(target)
                            if (targetPlayer) {
                                giveFakesPack(ctx.source.server, targetPlayer)
                                ctx.source.sendSystemMessage(Text.literal('§a✔ Pachet falsuri oferit jucătorului ' + target))
                                return 1
                            }
                            ctx.source.sendSystemMessage(Text.literal('§cJucătorul ' + target + ' nu este online.'))
                            return 0
                        })
                    )
                )
                .then(Commands.literal('netherless')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            giveNetherlessKit(ctx.source.server, player)
                            return 1
                        }
                        var list = ctx.source.server.getPlayerList().getPlayers()
                        if (list.size() > 0) {
                            giveNetherlessKit(ctx.source.server, list.get(0))
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Kit Netherless oferit jucătorului ' + list.get(0).name.string))
                            return 1
                        }
                        ctx.source.sendSystemMessage(Text.literal('§cNu există niciun jucător online.'))
                        return 0
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            var targetPlayer = ctx.source.server.getPlayerList().getPlayerByName(target)
                            if (targetPlayer) {
                                giveNetherlessKit(ctx.source.server, targetPlayer)
                                ctx.source.sendSystemMessage(Text.literal('§a✔ Kit Netherless oferit jucătorului ' + target))
                                return 1
                            }
                            ctx.source.sendSystemMessage(Text.literal('§cJucătorul ' + target + ' nu este online.'))
                            return 0
                        })
                    )
                )
                .then(Commands.literal('pyro')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (player) {
                            giveNetherlessKit(ctx.source.server, player)
                            return 1
                        }
                        var list = ctx.source.server.getPlayerList().getPlayers()
                        if (list.size() > 0) {
                            giveNetherlessKit(ctx.source.server, list.get(0))
                            ctx.source.sendSystemMessage(Text.literal('§a✔ Kit Netherless oferit jucătorului ' + list.get(0).name.string))
                            return 1
                        }
                        ctx.source.sendSystemMessage(Text.literal('§cNu există niciun jucător online.'))
                        return 0
                    })
                    .then(Commands.argument('target', $Test_StringArgument.word())
                        .executes(ctx => {
                            var target = $Test_StringArgument.getString(ctx, 'target')
                            var targetPlayer = ctx.source.server.getPlayerList().getPlayerByName(target)
                            if (targetPlayer) {
                                giveNetherlessKit(ctx.source.server, targetPlayer)
                                ctx.source.sendSystemMessage(Text.literal('§a✔ Kit Netherless oferit jucătorului ' + target))
                                return 1
                            }
                            ctx.source.sendSystemMessage(Text.literal('§cJucătorul ' + target + ' nu este online.'))
                            return 0
                        })
                    )
                )
                .then(Commands.literal('checkpoint_test')
                    .then(Commands.argument('mode', $Test_StringArgument.word())
                        .executes(ctx => {
                            let player = null
                            try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                            if (!player) return 0
                            var mode = $Test_StringArgument.getString(ctx, 'mode')
                            runTesterCheckpointTest(ctx.source.server, player, mode)
                            return 1
                        })
                    )
                )
                .then(Commands.literal('arrest_sim')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        runTesterArrestSim(ctx.source.server, player)
                        return 1
                    })
                )
                .then(Commands.literal('rollover')
                    .executes(ctx => {
                        let player = null
                        try { player = ctx.source.player || ctx.source.getPlayer() } catch (e) {}
                        if (!player) return 0
                        ctx.source.server.runCommandSilent('straja rollover')
                        player.sendSystemMessage(Text.literal('§6✔ [Rollover Executat] Toate armele din coada de ieri au fost maturate în catalogul legal!'))
                        return 1
                    })
                )
                .then(Commands.literal('goto')
                    .then(Commands.argument('step', $Test_IntegerArgument.integer(1, 16))
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
                .then(Commands.argument('step', $Test_IntegerArgument.integer(1, 16))
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
