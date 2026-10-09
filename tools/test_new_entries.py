import sys
sys.path.insert(0, 'tools')
from validate_patchouli import estimate_page_lines

burner_pages = [
    (True, "On Straja's frontier, the Nether is sealed.$(br2)Through karst mineral alchemy, gunsmiths awaken eternal Blaze Burners in the Overworld without captured Blazes."),
    (False, "$(bold)1. Netherrack Alchemy$()$(br2)• T1: Cobble + Redstone + Lava (1x)$(br)• T2: Basin: 100mB Lava (2x)$(br)• T3: Heated Basin + Karst Sulfur (8x!)$(br2)Milling yields Cinder Flour."),
    (False, "$(bold)2. Magma Cream$()$(br2)• T1: Slime + Karst Sulfur (1x)$(br)• T2: Basin: Slime + Sulfur + Lava (3x)$(br)• T3: Heated: 4 Slime + 2 Sulfur + Saltpeter (12x!)"),
    (False, "$(bold)3. Fire Charges$()$(br2)• T1: Powder + Coal + Saltpeter (3x)$(br)• T2: Basin: Powder + Coal + Lava (8x)$(br)• T3: Sequenced on Coal (16x!)"),
    (False, "$(bold)Empty Burner Cage$()$(br2)Craft in workbench:$(br)• Top, Left, Right, Bot: Iron Sheet$(br)• Center: Netherrack or Sulfur$(br2)Provides housing for eternal flame."),
    (False, "$(bold)Burner Awakening$()$(br2)• T1: Cage + 8 Charges + 4 Magma + Lava Bucket$(br)• T2: Unheated Basin: Cage + 4 Sulfur + 2 Saltpeter + Magma + Lava$(br)• T3: Sequenced Assembly with Rod")
]

print("=== BLAZE BURNER PAGES ===")
burner_overflow = False
for idx, (is_first, txt) in enumerate(burner_pages):
    cnt, lns = estimate_page_lines(txt, 'patchouli:text', is_first)
    max_l = 10 if is_first else 13
    status = "OK" if cnt <= max_l else "OVERFLOW"
    if cnt > max_l: burner_overflow = True
    print(f"Page {idx+1}: {cnt}/{max_l} -> {status}")

alchemy_pages = [
    (True, "The sealed Nether forces engineers to synthesize exotic materials on the surface.$(br2)Straja's mineral deposits power the entire 3-tier industrial chain."),
    (False, "$(bold)1. Soul Geology$()$(br2)• T1: Sand + Bone Meal + Coal (1x)$(br)• T2: Basin: 2 Sand + Bone + Lava (4x)$(br)• T3: Heated: 4 Sand + Saltpeter + Sulfur + Lava (16x!)"),
    (False, "$(bold)2. Nether Quartz$()$(br2)• T1: Soul Sand + Flint + Nugget (1x)$(br)• T2: Splashing Fan on Soul Sand (1x)$(br)• T3: Crushing Wheels on Soul Sand (2-3x + Gold Nuggets)"),
    (False, "$(bold)Coal Rod Precursor$()$(br2)Polish Coal or Charcoal with Sandpaper in hand or via Deployer.$(br2)Produces dense carbon Coal Rods ready for thermal infusion."),
    (False, "$(bold)3. Blaze Rod Synthesis$()$(br2)• T1: Coal Rod + 2 Charges + Magma (1x)$(br)• T2: Basin: Coal Rod + 2 Sulfur + Lava (2x)$(br)• T3: Sequenced: Rod + Sulfur + Lava + Saltpeter (6x!)"),
    (False, "$(bold)4. Ghast Tears$()$(br2)• T1: Slime + Membrane + Saltpeter (1x)$(br)• T2: Basin: Slime + Membrane + Water (2x)$(br)• T3: Heated Basin Distillation (8x!)$(br2)Obsidian + Tear + Lava makes Crying Stone.")
]

print("\n=== ALCHEMY PAGES ===")
alchemy_overflow = False
for idx, (is_first, txt) in enumerate(alchemy_pages):
    cnt, lns = estimate_page_lines(txt, 'patchouli:text', is_first)
    max_l = 10 if is_first else 13
    status = "OK" if cnt <= max_l else "OVERFLOW"
    if cnt > max_l: alchemy_overflow = True
    print(f"Page {idx+1}: {cnt}/{max_l} -> {status}")

if burner_overflow or alchemy_overflow:
    sys.exit(1)
print("\nALL PAGES PASS!")
