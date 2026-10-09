import os
import json
import shutil
import sys

BASE_DIR = r"e:\Github2\the-brass-age-update"
SERVER_ENTRIES = os.path.join(BASE_DIR, "server", "patchouli_books", "rustic_gunsmith", "en_us", "entries")
CLIENT_ENTRIES = os.path.join(BASE_DIR, "client", "patchouli_books", "rustic_gunsmith", "en_us", "entries")

NEW_ENTRIES = {
    "ammo_silver.json": {
        "name": "Consecrated Silver Rounds",
        "category": "patchouli:ammo",
        "icon": "minecraft:iron_nugget",
        "sortnum": 25,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Cast with blessed silver to purge the undead plague.$(br2)Deals $(6)4.0x damage$() to undead fiends, and $(b)2.0x damage$() to vampire players with an ethereal chime."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Offhand Chambering$()$(br2)To prioritize Silver over lead ball, place rounds in your $(italic)offhand (slot 40)$() before reloading [R].$(br2)The weapon primes the blessed round first."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Tier 1: Altar Table$()$(br2)Shaped crafting table:$(br)• Top: Iron Nugget (Silver)$(br)• Mid: Paper + Powder + Paper$(br)• Bot: Wad$(br2)Yields 2 Consecrated Silver Cartridges."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Tier 2: Mechanical Crafter$()$(br2)Powered 3x3 crafter array:$(br)• Corners: Large Bullet Core (4)$(br)• Edges: Wad (4)$(br)• Centre: Gunpowder Charge (1)$(br2)Yields 4 Consecrated Silver Cartridges."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Tier 3: Holy Assembly$()$(br2)Sequenced line:$(br)1. 16.5mm Ammo$(br)2. Deploy Silver$(br)3. Fill Holy Water$(br)4. Mechanical Press$(br2)Yields $(6)8 Blessed Rounds$()!"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Tactical Doctrine$()$(br2)Carry a pouch of silver cartridges when entering catacombs, crypts, or night patrol.$(br2)A single well-aimed shot will banish most high-tier undead instantly."
            }
        ]
    },
    "ammo_batch.json": {
        "name": "A Lot of Sixteen",
        "category": "patchouli:ammo",
        "icon": "minecraft:paper",
        "sortnum": 1,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "$(bold)Skirmish Lot (16)$()$(br)• Cores: 2 Nuggets (20 Cores)$(br)• Wads: 4 Paper (30 Wads)$(br)• Powder: 1 Basin mix (4 Charges)$(br2)Run crafter 4 times for 16 rounds."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Company Lot (64)$()$(br)• Cores: 7 Nuggets (70 Cores)$(br)• Wads: 12 Paper (90 Wads)$(br)• Powder: 1 Surge (16 Charges)$(br2)Crafter runs 16 times for a full load of 64 rounds."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Regiment Crate (256)$()$(br2)For long overland marches, assemble 256 rounds (4 Tier 3 surges, 26 nuggets, 9 wad passes).$(br2)Surround a Wooden Chest with 8x32 rounds to seal an $(bold)Ammunition Crate$()."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Firing & Reloading$()$(br2)Carry ammo in inventory. Press [R] while holding a firearm.$(br2)Weapons hold 1 round. Put special ammunition (Silver, Canister, Incendiary) in your $(italic)offhand$() to chamber it first."
            }
        ]
    },
    "ammo_tactical.json": {
        "name": "Tactical Ordnance",
        "category": "patchouli:ammo",
        "icon": "minecraft:fire_charge",
        "sortnum": 26,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "For crowd dispersal and fiend hunting, the arsenal produces Canister and Incendiary rounds.$(br2)Both require powered Create Mechanical Crafters."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Canister Scattershot$()$(br2)3x3 Crafter:$(br)• 8 Iron Nuggets$(br)• 1 Wad (center)$(br)• 1 Powder Charge (bot)$(br2)Yields 4 Cartridges.$(br)Discharges 14 pellets with heavy knockback."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Incendiary Round$()$(br2)3x3 Crafter:$(br)• Top: 1 Karst Sulfur$(br)• Mid: Core + Powder + Core$(br)• Bot: 1 Wad$(br2)Yields 4 Cartridges.$(br)Deals 35 damage and $(c)8s of searing fire$()."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Offhand Selection$()$(br2)Place Canister or Incendiary rounds into your $(italic)offhand (slot 40)$() prior to pressing [R].$(br2)The weapon will prioritize your tactical ammunition for the next shot."
            }
        ]
    },
    "ammo_stores.json": {
        "name": "The Ammunition Stores",
        "category": "patchouli:ammo",
        "icon": "tacz_c:gunpowder_charge",
        "sortnum": 0,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Both guns use 16.5mm ammunition (qkl:16mm).$(br2)Prepare cores, wads, and powder before crafter assembly.$(br2)Powder has 3 refining tiers."
            },
            {
                "type": "patchouli:spotlight",
                "item": "tacz_c:large_bullet_core",
                "text": "A Mechanical Saw cuts 1 Iron or Zinc Nugget into 10 Large Cores.$(br2)Use large cores, not ordinary cores or finished bullets."
            },
            {
                "type": "patchouli:spotlight",
                "item": "tacz_c:wad",
                "text": "Sequenced assembly: Start Paper, deploy Paper 3x, press, and saw.$(br2)Consumes 4 Paper and yields 30 Wads per cycle."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:saltpeter",
                "text": "Crush Dripstone with wheels, then splash with a fan.$(br2)Yields purified Saltpeter for powder."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:crude_gunpowder_cake",
                "text": "$(bold)Tier 1: Desperation$()$(br2)Craft 4 Bone Meal, 4 Charcoal, 1 Water in table.$(br)Smoke in Smoker or Campfire to yield 1 Powder Charge."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:wet_powder_mass",
                "text": "Mix 2 Saltpeter, 2 Coal, 250mB Water in Basin.$(br2)Press wet mass with Press to yield 4 Charges."
            },
            {
                "type": "patchouli:spotlight",
                "item": "tacz_c:gunpowder_charge",
                "text": "Mix 4 Saltpeter, 2 Coal, 1 Sulfur, 500mB Water in $(6)Heated Basin$().$(br2)Yields $(6)16 Charges$() (400% surge!)."
            },
            {
                "type": "patchouli:spotlight",
                "item": "butchery:sulfur",
                "text": "Mined from Straja's mineral karst strata.$(br2)Catalyzes Tier 3 surges, ignites incendiary rounds, and feeds civilian chemical industries."
            }
        ]
    },
    "crates_logistics.json": {
        "name": "Military Logistics Crates",
        "category": "patchouli:assembly",
        "icon": "kubejs:crate_muskets",
        "sortnum": 50,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Carry limits restrict foot soldiers to 1 rifle and 2 pistols.$(br2)Heavy crates move bulk arms via Trotting Wagons, Pack Mules, and Create Trains."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Sealing Crates$()$(br2)Craft in Crafting Table:$(br)• $(bold)Musket Crate:$() 8 Muskets + 1 Wooden Chest$(br)• $(bold)Pistol Crate:$() 8 Pistols + 1 Wooden Chest$(br)• $(bold)Ammo Crate:$() 8x 32 Ammo (256 rounds) + 1 Wooden Chest"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Unpacking in Field$()$(br2)To unseal a logistics crate:$(br)• Place in crafting table to extract contents, OR$(br)• $(bold)Shift + Right-Click$() the ground to deploy weapons at your feet.$(br2)Crates bypass carry limits."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Field Guidelines$()$(br2)Keep crates sealed in wagon cargo chests until reaching the front.$(br2)Unsealing excess firearms into personal inventory triggers encumbrance drops immediately."
            }
        ]
    },
    "jaeger_rifled.json": {
        "name": "FK15-R Jaeger Rifled Musket",
        "category": "patchouli:barrel",
        "icon": "kubejs:rifled_barrel",
        "sortnum": 40,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "The elite marksman variant of the FK15. Spiral-rifled barrel reduces dispersion by $(a)65%$().$(br2)$(c)Requires Create Crafters.$()"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Rifling Lathe$()$(br2)Bored on Create mechanical drill bench:$(br)• Drill + Rifle Barrel + Precision Mechanism.$(br2)Produces the spiral-cut Rifled Barrel required for master craftsmanship."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Crafter Grid (3x3)$()$(br2)• Top: Band, Band, Barrel$(br)• Mid: Lock, Stock, Screws$(br)• Bot: Ramrod, Steel, Precision Mechanism$(br2)Assembles the prestigious FK15-R Jaeger."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Ballistics Doctrine$()$(br2)The FK15-R excels at long-range sniper engagements.$(br2)Pairs excellently with Consecrated Silver Cartridges for hunting fiends at extreme distances."
            }
        ]
    },
    "legal_proofing.json": {
        "name": "Firearm Proofing & Legality",
        "category": "patchouli:assembly",
        "icon": "kubejs:proof_stamp",
        "sortnum": 35,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Privately crafted weapons are considered $(c)unproofed contraband$().$(br2)Unregistered guns risk confiscation and arrest at border checkpoints."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Imperial Proof Stamp$()$(br2)Crafting table pattern:$(br)• Top: 1 Gold Ingot$(br)• Mid: Brass, Gun Steel, Brass$(br)• Bot: 1 Stick$(br2)Indestructible master tool used for serial stamping."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Permit Blanks (x4)$()$(br2)Crafting table pattern:$(br)• Top: 1 Gold Nugget$(br)• Mid: 1 Paper$(br)• Bot: 1 Red Dye$(br2)Produces 4 Permit Blanks ready for armorer stamping."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)The Proofing Ritual$()$(br2)Place firearm + $(6)Imperial Proof Stamp$() in an $(bold)Anvil$().$(br2)Costs 5 experience levels.$(br)Strikes a permanent serial ($(2)#RC-15-XXXX$()) onto the breech block."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Permit Issuance$()$(br2)Hold proofed gun and right-click a $(e)Permit Blank$().$(br2)Inspectors issue an authentic Permit ($(2)LEGAL / ÎNREGISTRAT$()).$(br2)Carry permits at checkpoints!"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Underworld Trade$()$(br2)• $(4)Grindstone:$() Grinds off serial into $(c)Defaced Gun$().$(br)• $(e)Forgeries:$() Civilians create fake permits (Tier 1-3).$(br2)Tier 3 botched fakes trigger immediate checkpoint arrest!"
            }
        ]
    },
    "civilian_lines.json": {
        "name": "P.U.L.A SRL Civilian Lines",
        "category": "patchouli:workshop",
        "icon": "kubejs:miracle_fertilizer",
        "sortnum": 30,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "P.U.L.A SRL does not live by powder alone.$(br2)Utilizing Straja's sulfur and nitrates, the company powers five vital civilian industries."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)1. Fumigation Strips$()$(br2)• T1: Sulfur + Paper (table)$(br)• T2: Paper + Sulfur + Water (Basin x4)$(br)• T3: Strip + Berries + Sulfur + Press (x16)$(br2)Purifies casks for Vinery cellarmasters."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)2. Miracle Fertilizer$()$(br2)• $(bold)T1:$() 4 Bone Meal + Dirt$(br)• $(bold)T2:$() Dripstone + 2 Bone Meal + Water (Basin x4)$(br)• $(bold)T3:$() Saltpeter + Sulfur + Bone Meal + Water ($(6)Heated x16$())$(br2)Right-click crops for instant 3x3 growth."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)3. Medicated Soap$()$(br2)• T1: Charcoal + Pork + Water$(br)• T2: Flesh + Coal + Water (x4)$(br)• T3: Sulfur + Saltpeter + Coal + Water (Heated x16)$(br2)Right-click cleanses poison and sickness."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)4. Safety Matches$()$(br2)• $(bold)T1:$() Sulfur + 2 Sticks$(br)• $(bold)T2:$() 2 Sticks + Sulfur (Basin x16)$(br)• $(bold)T3:$() Paper + Matches + Redstone + Press ($(6)x64$())$(br2)Right-click ignites campfires and torches."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)5. Vitriol Leather$()$(br2)• $(bold)T1:$() Flint + Rotten Flesh$(br)• $(bold)T2:$() Splashing Flesh with Fan$(br)• $(bold)T3:$() 2 Leather + Sulfur + Saltpeter + Water ($(6)Heated x8$())$(br2)Crafts durable Saddles and Horse Armor."
            }
        ]
    },
    "blaze_burner_netherless.json": {
        "name": "Overworld Blaze Burners",
        "category": "patchouli:workshop",
        "icon": "create:blaze_burner",
        "sortnum": 32,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "On Straja's frontier, the Nether is sealed.$(br2)Through karst mineral alchemy, engineers awaken eternal Blaze Burners in the Overworld without captured Blazes."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)1. Mineral Precursors$()$(br2)• $(bold)Netherrack Alchemy:$() 1 Cobble + 1 Redstone + 100mB Lava in unheated Basin.$(br)• $(bold)Magma Cream:$() 1 Slimeball + 1 Karst Sulfur (or mix with Lava for double yield)."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)2. Charges & Burner Cage$()$(br2)• $(bold)Fire Charge (x3):$() 1 Powder Charge + 1 Charcoal + 1 Saltpeter.$(br)• $(bold)Empty Burner:$() 4 Iron Sheets + 1 Netherrack (or Sulfur) in workbench cross."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)3. Catalytic Awakening$()$(br2)Unheated Mixer Basin:$(br)• 1 Empty Burner + 1000mB Lava$(br)• 4 Karst Sulfur + 2 Saltpeter$(br)• 1 Magma Cream or Charge$(br2)Mixer ignites a $(6)Blaze Burner$()!"
            }
        ]
    },
    "workshop.json": {
        "name": "To the Apprentice",
        "category": "patchouli:workshop",
        "icon": "minecraft:crafting_table",
        "sortnum": 0,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Lay out parts before beginning. Keep barrel pieces apart from stocks.$(br2)An old-fashioned trade handbook for Rustic Craft II."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Reading the Plates$()$(br2)Each grid square takes one named item. Leave empty squares empty.$(br2)Component forge recipes yield one item, including Gun Screws."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Kinetic Assembly$()$(br2)$(c)Firearms require Create Mechanical Crafters.$()$(br2)Standard crafting tables serve only for individual parts. Finished weapons and ammunition require kinetic power."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)State Secrecy$()$(br2)All firearm assembly recipes are state secrets hidden from EMI/JEI.$(br2)Only authorized holders of this handbook know the patterns. Issued by Imperial Administrators."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Create Materials$()$(br2)Press iron or brass ingots into sheets.$(br2)Heated Basin mixing joins 1 copper and 1 zinc ingot into 2 brass ingots.$(br2)Alloy pattern uses 2 andesite and 2 iron/zinc nuggets."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Precision Mechanisms$()$(br2)Start with a Golden Sheet. Deploy Cogwheel, Large Cogwheel, and Iron Nugget in sequence.$(br2)Repeat 5 times. Count successful mechanisms before assembly."
            }
        ]
    },
    "pistol.json": {
        "name": "FK15-P Flintlock Pistol",
        "category": "patchouli:assembly",
        "icon": "kubejs:pistol_stock",
        "sortnum": 22,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "A compact 16.5mm sidearm for rapid engagement. Soldiers can carry up to two pistols at the hip.$(br2)$(c)Requires Create Crafters.$()"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Mechanical Crafter (3x3)$()$(br2)• Top: Barrel, Lock, Ramrod$(br)• Mid: Screws, Stock, Band$(br)• Bot: [Empty], Steel, Leather$(br2)Place 8 Crafters matching the grid (bottom-left empty)."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Kinetic Power$()$(br2)Connect rotational power (min 16 RPM) to crafters.$(br2)Wrench crafter arrows converging on the output slot.$(br2)Insert parts to complete the weapon."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Firing & Maintenance$()$(br2)Chambers 16.5mm standard or tactical rounds.$(br2)Requires proofing at an anvil with an Imperial Proof Stamp before legal field carry."
            }
        ]
    },
    "rifle.json": {
        "name": "FK15 Flintlock Musket",
        "category": "patchouli:assembly",
        "icon": "kubejs:rifle_stock",
        "sortnum": 23,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "The standard military long arm of the realm. Full shoulder stock deals 40–55 kinetic damage.$(br2)$(c)Requires Create Crafters.$()"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Mechanical Crafter (3x3)$()$(br2)• Top: Band, Band, Barrel$(br)• Mid: Lock, Stock, Screws$(br)• Bot: Ramrod, Steel, Precision Mechanism$(br2)Mount a full 3x3 array (9 Crafters)."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Kinetic Power$()$(br2)Connect rotational kinetic power (min 16 RPM).$(br2)Wrench crafter arrows converging on the output.$(br2)Insert all 9 precision components to craft."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Firing & Maintenance$()$(br2)Chambers standard 16.5mm lead or consecrated silver rounds.$(br2)Carry ammunition in inventory and reload with [R]. Proof with Imperial Stamp for legal carry."
            }
        ]
    },
    "ammo_16mm.json": {
        "name": "16.5mm Flintlock Ammunition",
        "category": "patchouli:ammo",
        "icon": "tacz_c:large_bullet_core",
        "sortnum": 24,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Set ammunition work before nine powered Mechanical Crafters.$(br2)Place large bullet cores in the four corners, wads at the four edges, and one gunpowder charge at the centre."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Crafter Grid (3x3)$()$(br2)• Corners: Large Bullet Core (4)$(br)• Edges: Wad (4)$(br)• Centre: Gunpowder Charge (1)$(br2)Fill all nine slots. Each cycle produces four rounds."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Kinetic Configuration$()$(br2)Power a 3x3 face of Mechanical Crafters.$(br2)Set their output routes with a wrench so they converge on one final output slot."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Production Advice$()$(br2)Use four cores, four wads and one charge per cycle.$(br2)A crafting table will not work. Automated crafters ensure balanced powder loads."
            }
        ]
    },
    "tempered_gun_steel.json": {
        "name": "Tempered Gun Steel",
        "category": "patchouli:forge",
        "icon": "kubejs:tempered_gun_steel",
        "sortnum": 3,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Bring the billet to the blast furnace and allow the work its full appointed time.$(br2)Yields the tempered piece required for barrels, locks and fittings."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:gun_steel_blank",
                "link_recipe": True,
                "text": "The rough billet before the heat."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:tempered_gun_steel",
                "link_recipe": False,
                "text": "Smelt blank in a blast furnace with fuel.$(br2)Time: 20s. An ordinary furnace will not perform this recipe."
            }
        ]
    },
    "tempered_mainspring.json": {
        "name": "Tempered Mainspring",
        "category": "patchouli:forge",
        "icon": "kubejs:tempered_mainspring",
        "sortnum": 5,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Heat alone frees the wound spring to store its force without snapping. The blast furnace tempers the steel to an elastic temper. The pistol and rifle each take one."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:mainspring_blank",
                "link_recipe": True,
                "text": "The soft coil before the heat."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:tempered_mainspring",
                "link_recipe": False,
                "text": "Smelt blank in a blast furnace with fuel.$(br2)Time: 15s. An ordinary furnace will not perform this recipe."
            }
        ]
    },
    "pistol_ledger.json": {
        "name": "The Pistol Ledger",
        "category": "patchouli:ledgers",
        "icon": "minecraft:paper",
        "sortnum": 0,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Reckon these finished supplies before beginning the pistol.$(br2)Totals include every custom intermediate, sheet, alloy and mechanism."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Raw Materials$()$(br2)Iron Nuggets: 84$(br)Brass Sheets: 7$(br)Iron Ingots: 6$(br)Iron Sheets: 5$(br)Zinc Ingots: 2$(br)Copper Ingots: 2$(br)Leather: 2$(br)Sticks: 1"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Stock & Mechanism$()$(br2)Stripped Oak Wood: 1$(br)Gold Sheet: 1$(br)Cogwheel: 5$(br)Large Cogwheel: 5$(br)Tripwire Hook: 1"
            }
        ]
    },
    "rifle_ledger.json": {
        "name": "The Rifle Ledger",
        "category": "patchouli:ledgers",
        "icon": "minecraft:paper",
        "sortnum": 1,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Reckon these finished supplies before beginning the rifle.$(br2)Totals include every custom intermediate, sheet, alloy and mechanism."
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Raw Materials$()$(br2)Iron Nuggets: 124$(br)Brass Sheets: 22$(br)Iron Ingots: 8$(br)Iron Sheets: 5$(br)Zinc Ingots: 2$(br)Copper Ingots: 2$(br)Leather: 2$(br)Sticks: 1"
            },
            {
                "type": "patchouli:text",
                "text": "$(bold)Stock & Mechanism$()$(br2)Stripped Oak Wood: 2$(br)Gold Sheet: 2$(br)Cogwheel: 10$(br)Large Cogwheel: 10$(br)Tripwire Hook: 1"
            }
        ]
    },
    "rifle_barrel.json": {
        "name": "Reinforced Long Barrel",
        "category": "patchouli:barrel",
        "icon": "kubejs:rifle_barrel",
        "sortnum": 1,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Lay two short barrels at opposite ends of the grid. Tempered steel braces corners, brass bands flank centre, and a precision mechanism joins them into the long barrel."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:rifle_barrel",
                "link_recipe": False,
                "text": "One finished Reinforced Long Barrel. Keep this piece ready for final assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/rifle_barrel",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "rifle_order.json": {
        "name": "The Order of Work",
        "category": "patchouli:assembly",
        "icon": "minecraft:book",
        "sortnum": 2,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Prepare 24 tempered steel, 20 Gun Screws and 1 tempered spring.$(br2)Finish two short barrels, then join them into the reinforced long barrel."
            },
            {
                "type": "patchouli:text",
                "text": "Shape three stock blanks. Turn one into the bound pistol stock, then attach two further blanks with leather, a screw and two brass bands to produce the reinforced stock."
            },
            {
                "type": "patchouli:text",
                "text": "Forge the ramrod from three tempered steel. Set the Mechanical Crafters to the pattern on the following page and connect power. Lay the nine parts in place and collect the long gun."
            }
        ]
    },
    "rifle_stock.json": {
        "name": "Reinforced Stock",
        "category": "patchouli:stock",
        "icon": "kubejs:rifle_stock",
        "sortnum": 2,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Gather two hardwood blanks and the pistol stock. Add leather, a screw and two brass bands to produce the reinforced shoulder stock."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:rifle_stock",
                "link_recipe": False,
                "text": "One finished Reinforced Stock. Keep this piece ready for the final assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/rifle_stock",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "pistol_stock.json": {
        "name": "Pistol Stock",
        "category": "patchouli:stock",
        "icon": "kubejs:pistol_stock",
        "sortnum": 1,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Bind two hardwood blanks with leather and a gun screw.$(br2)Serves directly for the pistol and forms the base of the shoulder stock."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:pistol_stock",
                "link_recipe": False,
                "text": "One finished Pistol Stock. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/pistol_stock",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "trigger_assembly.json": {
        "name": "Trigger Assembly",
        "category": "patchouli:lock",
        "icon": "kubejs:trigger_assembly",
        "sortnum": 3,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Set tempered spring above precision mechanism, flank with screws, and place tripwire hook below."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:trigger_assembly",
                "link_recipe": False,
                "text": "One finished Trigger Assembly. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/trigger_assembly",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "gun_steel_blank.json": {
        "name": "Gun Steel Blank",
        "category": "patchouli:forge",
        "icon": "kubejs:gun_steel_blank",
        "sortnum": 2,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Forge iron nuggets about an iron ingot to shape the rough billet.$(br2)Prepare a generous supply for barrels, locks, and fittings."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:gun_steel_blank",
                "link_recipe": False,
                "text": "One rough billet. It must be tempered in a blast furnace before it can be used."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/gun_steel_blank",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "gun_screws.json": {
        "name": "Gun Screws",
        "category": "patchouli:forge",
        "icon": "kubejs:gun_screws",
        "sortnum": 1,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Turn iron nuggets with iron sheets to cut threaded fixings.$(br2)Consumes 20 for the rifle, 16 for the pistol. Yields one screw per craft."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:gun_screws",
                "link_recipe": False,
                "text": "One finished Gun Screw. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/gun_screws",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "mainspring_blank.json": {
        "name": "Mainspring Blank",
        "category": "patchouli:forge",
        "icon": "kubejs:mainspring_blank",
        "sortnum": 4,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Wind iron nuggets in a ring to form the coiled spring blank.$(br2)One serves for the lock, another for the trigger group."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:mainspring_blank",
                "link_recipe": False,
                "text": "One untempered spring. It must be tempered in a blast furnace before it can be used."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/mainspring_blank",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "flash_pan.json": {
        "name": "Brass Flash Pan",
        "category": "patchouli:lock",
        "icon": "kubejs:flash_pan",
        "sortnum": 2,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Beat brass sheets into the shallow priming pan.$(br2)One pan is required for each lock. Brass resists fouling of powder."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:flash_pan",
                "link_recipe": False,
                "text": "One finished Brass Flash Pan. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/flash_pan",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "flintlock_mechanism.json": {
        "name": "Flintlock Mechanism",
        "category": "patchouli:lock",
        "icon": "kubejs:flintlock_mechanism",
        "sortnum": 4,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Gather hammer, flash pan, and trigger group. Secure with four screws and tempered plate.$(br2)One lock is fitted to each weapon."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:flintlock_mechanism",
                "link_recipe": False,
                "text": "One finished Flintlock Mechanism. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/flintlock_mechanism",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "barrel_band.json": {
        "name": "Brass Barrel Band",
        "category": "patchouli:forge",
        "icon": "kubejs:barrel_band",
        "sortnum": 8,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Arrange three brass sheets about the centre and place a screw below.$(br2)The rifle consumes six bands; the pistol requires one."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:barrel_band",
                "link_recipe": False,
                "text": "One finished Brass Barrel Band. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/barrel_band",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    },
    "barrel_blank.json": {
        "name": "Barrel Blank",
        "category": "patchouli:barrel",
        "icon": "kubejs:barrel_blank",
        "sortnum": 0,
        "pages": [
            {
                "type": "patchouli:text",
                "text": "Draw tempered gun steel with brass into the heavy tube.$(br2)Two blanks make the pistol barrel; four make the rifle barrel."
            },
            {
                "type": "patchouli:spotlight",
                "item": "kubejs:barrel_blank",
                "link_recipe": False,
                "text": "One finished Barrel Blank. Keep this piece ready for the next assembly."
            },
            {
                "type": "patchouli:crafting",
                "recipe": "kubejs:flintlocks/barrel_blank",
                "text": "Follow this grid exactly. One craft yields one finished component."
            }
        ]
    }
}

def apply_fixes():
    print(f"Applying fixes to {len(NEW_ENTRIES)} entries...")
    for filename, data in NEW_ENTRIES.items():
        srv_file = os.path.join(SERVER_ENTRIES, filename)
        cli_file = os.path.join(CLIENT_ENTRIES, filename)
        
        with open(srv_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
            
        with open(cli_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
            
        print(f"Updated {filename} in server and client.")

if __name__ == '__main__':
    apply_fixes()
