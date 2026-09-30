#!/usr/bin/env python3
"""
Generate authentic 16x16 pixel art textures for all 14 new Brass Age items.
Outputs to client/kubejs/assets/kubejs/textures/item/ and server/kubejs/assets/kubejs/textures/item/
"""
import os
from PIL import Image

CLIENT_DIR = r"client\kubejs\assets\kubejs\textures\item"
SERVER_DIR = r"server\kubejs\assets\kubejs\textures\item"
os.makedirs(CLIENT_DIR, exist_ok=True)
os.makedirs(SERVER_DIR, exist_ok=True)

def create_image_from_grid(grid, palette):
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, char in enumerate(row):
            if char in palette:
                img.putpixel((x, y), palette[char])
    return img

def save_texture(name, img):
    for d in [CLIENT_DIR, SERVER_DIR]:
        path = os.path.join(d, f"{name}.png")
        img.save(path)
        print(f"Saved: {path}")

# 1. rifled_barrel: Spiral rifled steel barrel
P_RIFLED = {
    '.': (0, 0, 0, 0),
    'D': (35, 38, 44, 255),    # Dark steel outline
    'S': (85, 92, 102, 255),   # Steel midtone
    'L': (140, 150, 165, 255), # Steel highlight
    'H': (195, 205, 220, 255), # High sheen
    'R': (45, 50, 60, 255),    # Rifling groove shadow
    'B': (190, 150, 65, 255),  # Brass muzzle band
}
G_RIFLED = [
    "..............B.",
    ".............BLB",
    "............BLB.",
    "...........DSH..",
    "..........DSR...",
    ".........DSH....",
    "........DSR.....",
    ".......DSH......",
    "......DSR.......",
    ".....DSH........",
    "....DSR.........",
    "...DSH..........",
    "..DSR...........",
    ".DSH............",
    "DSD.............",
    ".D.............."
]
save_texture("rifled_barrel", create_image_from_grid(G_RIFLED, P_RIFLED))

# 2. saltpeter: White crystalline saltpeter powder / cluster
P_SALTPETER = {
    '.': (0, 0, 0, 0),
    'O': (110, 115, 125, 255), # Gray crystal outline
    'B': (180, 185, 195, 255), # Base crystal
    'L': (225, 230, 240, 255), # Light facet
    'W': (255, 255, 255, 255), # Pure white glint
    'S': (145, 150, 160, 255), # Shaded facet
}
G_SALTPETER = [
    "................",
    ".......W........",
    "......WLW.......",
    ".....WLLSO......",
    ".....WBLSO......",
    "....OWLLSOWW....",
    "...OWLLBLWLLW...",
    "...OLLLSWLLSO...",
    "..OWLLBLWLLSWO..",
    ".OWLLLSLSLLLSWO.",
    ".OLBLLLLSBLLSSO.",
    ".OLLLSLLSBLLSOO.",
    "..OLLSSSLSSSSO..",
    "...OOSSSSSSSO...",
    ".....OOOOOO.....",
    "................"
]
save_texture("saltpeter", create_image_from_grid(G_SALTPETER, P_SALTPETER))

# 3. crushed_dripstone: Earthy dripstone gravel / shards
P_DRIPSTONE = {
    '.': (0, 0, 0, 0),
    'O': (75, 50, 40, 255),   # Dark terracotta outline
    'D': (120, 80, 65, 255),  # Dripstone dark
    'M': (155, 105, 85, 255), # Dripstone mid
    'L': (190, 135, 110, 255),# Dripstone light
    'H': (215, 165, 135, 255),# Mineral highlight
}
G_DRIPSTONE = [
    "................",
    ".....H..........",
    "....LML.........",
    "...LMDO...H.....",
    "...ODO...LML....",
    "........LMDO....",
    "....H....ODO....",
    "...LML..........",
    "..LMMDO...H.....",
    ".OLMDDDO.LMML...",
    ".OMDDODOOMMDDO..",
    "OODDOO.OLMDDOO..",
    ".OO...OMDDDO....",
    "......ODDDO.....",
    ".......OO.......",
    "................"
]
save_texture("crushed_dripstone", create_image_from_grid(G_DRIPSTONE, P_DRIPSTONE))

# 4. crude_gunpowder_cake: Porous compressed charcoal patty
P_CRUDE_CAKE = {
    '.': (0, 0, 0, 0),
    'O': (25, 25, 28, 255),   # Deep charcoal outline
    'B': (45, 45, 50, 255),   # Dark charcoal body
    'M': (65, 68, 75, 255),   # Midtone charcoal
    'S': (200, 190, 80, 255), # Sulfur speckle
    'N': (210, 215, 220, 255),# Nitrate speckle
}
G_CRUDE_CAKE = [
    "................",
    "................",
    ".....OOOOOO.....",
    "...OOMMMMMMOO...",
    "..OMMMMNMMMSSO..",
    ".OMMMBMMMMMSBMO.",
    ".OMMBBBMNMBBBMO.",
    "OMMBBBBBBBBBBBMO",
    "OMMBBSBBBBBBBBMO",
    "OMBBBBBBBNBBBBMO",
    ".OMBBBBBBBBBBMO.",
    ".OMBBSBBBBBBBMO.",
    "..OOBBBBBBBBOO..",
    "...OOOOOOOOOO...",
    "................",
    "................"
]
save_texture("crude_gunpowder_cake", create_image_from_grid(G_CRUDE_CAKE, P_CRUDE_CAKE))

# 5. wet_powder_mass: Moist wet black powder slurry
P_WET_MASS = {
    '.': (0, 0, 0, 0),
    'O': (20, 22, 28, 255),   # Dark wet boundary
    'B': (38, 42, 50, 255),   # Wet slurry body
    'M': (55, 62, 72, 255),   # Moist slurry
    'W': (110, 135, 160, 255),# Wet water glint
    'H': (170, 195, 220, 255),# High shine moisture
}
G_WET_MASS = [
    "................",
    ".......HH.......",
    "......HWW.......",
    ".....OWWMO......",
    "....OMMWBMO.....",
    "...OMBBBWBMH....",
    "..OMBBBBWWBW....",
    ".OMBBBBBBWWMO...",
    "OMBBBBBBBBMMO...",
    "OMBBBBBBBBBBMO..",
    "OMBBBBBBBBBBMO..",
    ".OMBBBBBBBBMO...",
    "..OMMBBBBBMO....",
    "...OOMMMMOO.....",
    ".....OOOO.......",
    "................"
]
save_texture("wet_powder_mass", create_image_from_grid(G_WET_MASS, P_WET_MASS))

# 6. proof_stamp: Heavy iron/brass master inspector guild stamp
P_STAMP = {
    '.': (0, 0, 0, 0),
    'O': (30, 25, 20, 255),   # Tool outline
    'W': (115, 75, 40, 255),  # Oak shaft
    'L': (160, 110, 65, 255), # Shaft highlight
    'S': (80, 85, 95, 255),   # Steel socket
    'G': (205, 160, 45, 255), # Brass stamp head
    'Y': (245, 210, 90, 255), # Polished brass sheen
    'E': (255, 240, 160, 255),# Crown/eagle glint
}
G_STAMP = [
    ".............YE.",
    "............YGGY",
    "...........OGGGO",
    "..........OSSO..",
    ".........OWLO...",
    "........OWLO....",
    ".......OWLO.....",
    "......OWLO......",
    ".....OWLO.......",
    "....OWLO........",
    "...OSSO.........",
    "..OGGYG.........",
    ".OGEYGYG........",
    "OGGGGGGYO.......",
    ".OGGYGGO........",
    "..OOOO.........."
]
save_texture("proof_stamp", create_image_from_grid(G_STAMP, P_STAMP))

# 7. permit_blank: Vellum firearm license scroll with wax seal
P_PERMIT = {
    '.': (0, 0, 0, 0),
    'O': (100, 85, 60, 255),  # Aged parchment outline
    'P': (215, 195, 155, 255),# Parchment paper
    'L': (240, 225, 190, 255),# Paper highlight
    'I': (130, 110, 80, 255), # Ink text lines
    'R': (175, 35, 35, 255),  # Red royal wax seal
    'S': (220, 60, 60, 255),  # Seal highlight
}
G_PERMIT = [
    "....OOOOOOOO....",
    "...OPLLLLLLPO...",
    "..OPLLLLLLLLPO..",
    ".OPLLIIIILLLLPO.",
    ".OPLIIIIIILLLPO.",
    ".OPLLLLLLLLLLPO.",
    ".OPLLIIIIIILLPO.",
    ".OPLLIIIIIILLPO.",
    ".OPLLLLLLLLLLPO.",
    ".OPLLIIIILLLLPO.",
    ".OPLLL..RRSLLPO.",
    ".OPLL..RRRRSLLP.",
    ".OPLL..RRRRSLLP.",
    "..OPL...RRSLLPO.",
    "...OPLLLLLLLPO..",
    "....OOOOOOOO...."
]
save_texture("permit_blank", create_image_from_grid(G_PERMIT, P_PERMIT))

# 8. fumigation_strip: Yellow sulfur wick strip for wine casks
P_FUM_STRIP = {
    '.': (0, 0, 0, 0),
    'O': (120, 100, 20, 255), # Sulfur brown outline
    'Y': (220, 190, 40, 255), # Bright sulfur yellow
    'L': (245, 225, 90, 255), # Sulfur highlight
    'D': (175, 145, 25, 255), # Shaded sulfur
    'C': (60, 45, 30, 255),   # Charred tip
}
G_FUM_STRIP = [
    "..............C.",
    ".............CLO",
    "............DLY.",
    "...........DLY..",
    "..........DLY...",
    ".........DLY....",
    "........DLY.....",
    ".......DLY......",
    "......DLY.......",
    ".....DLY........",
    "....DLY.........",
    "...DLY..........",
    "..DLY...........",
    ".DLY............",
    "DLY.............",
    ".O.............."
]
save_texture("fumigation_strip", create_image_from_grid(G_FUM_STRIP, P_FUM_STRIP))

# 9. royal_fumigation_strip: Gilded purple & gold royal cask strip
P_ROYAL_STRIP = {
    '.': (0, 0, 0, 0),
    'O': (80, 25, 95, 255),   # Royal violet outline
    'V': (140, 50, 160, 255), # Royal purple silk
    'L': (180, 85, 205, 255), # Purple sheen
    'G': (225, 180, 45, 255), # Gold trim
    'Y': (255, 220, 95, 255), # Gold glint
    'S': (220, 190, 40, 255), # Sulfur core
}
G_ROYAL_STRIP = [
    ".............YG.",
    "............YLVY",
    "...........GSVG.",
    "..........GLVG..",
    ".........GSVG...",
    "........GLVG....",
    ".......GSVG.....",
    "......GLVG......",
    ".....GSVG.......",
    "....GLVG........",
    "...GSVG.........",
    "..GLVG..........",
    ".GSVG...........",
    "YLVY............",
    ".YG.............",
    "................"
]
save_texture("royal_fumigation_strip", create_image_from_grid(G_ROYAL_STRIP, P_ROYAL_STRIP))

# 10. miracle_fertilizer: Miracle super-phosphate mineral sack/fertilizer
P_FERT = {
    '.': (0, 0, 0, 0),
    'O': (50, 60, 30, 255),   # Forest earth outline
    'E': (90, 75, 55, 255),   # Rich compost
    'G': (65, 140, 50, 255),  # Vibrant plant green
    'L': (110, 195, 75, 255), # Sprout green glint
    'S': (225, 200, 55, 255), # Sulfur nutrient crystals
    'W': (235, 240, 245, 255),# Bone phosphate crystals
}
G_FERT = [
    "................",
    ".......LL.......",
    "......LGLG......",
    ".....OGGLGO.....",
    "....OGLGLGLO....",
    "...OESESWSWEO...",
    "..OEWSEGSWEWEO..",
    ".OESSEEEWSSSEEO.",
    "OEWSWGEEEGEWSEO.",
    "OEEGEGSWSGEEEEE.",
    "OESEEWEEEEWSSEEO",
    ".OEEEEEEEEEEEEO.",
    "..OEEEEEEEEEEO..",
    "...OEEEEEEEEO...",
    "....OOOOOOOO....",
    "................"
]
save_texture("miracle_fertilizer", create_image_from_grid(G_FERT, P_FERT))

# 11. medicated_soap: Carved yellow sulfur soap bar with lather bubbles
P_SOAP = {
    '.': (0, 0, 0, 0),
    'O': (150, 130, 40, 255), # Shaded soap outline
    'B': (215, 190, 65, 255), # Sulfur soap body
    'L': (245, 225, 105, 255),# Beveled soap highlight
    'W': (255, 250, 200, 255),# Lather bubble foam
    'C': (180, 155, 45, 255), # Carved heraldic cross
}
G_SOAP = [
    "................",
    ".....WW.........",
    "....WWLW........",
    "...OOOOOOOOO....",
    "..OLLLLLLLLLO...",
    ".OLBBBBBBBBBLO..",
    ".OLBBCBCBBBBBLO.",
    ".OLBBCCCCCBBBLO.",
    ".OLBBCBCBBBBBLO.",
    ".OLBBBBBBBBBLO..",
    ".OLBBBBBBBBBLO..",
    ".OBBBBBBBBBBO...",
    "..OOOOOOOOOO....",
    "................",
    "................",
    "................"
]
save_texture("medicated_soap", create_image_from_grid(G_SOAP, P_SOAP))

# 12. sulfur_matches: Wooden splints bundled with bright sulfur dipping heads
P_MATCHES = {
    '.': (0, 0, 0, 0),
    'O': (65, 50, 30, 255),   # Splint outline
    'W': (165, 130, 85, 255), # Pine wood splint
    'L': (205, 175, 125, 255),# Light pine
    'Y': (230, 200, 45, 255), # Sulfur head
    'S': (255, 235, 90, 255), # Sulfur tip highlight
}
G_MATCHES = [
    "............SS..",
    "...........SYYS.",
    "..........SYYY..",
    ".........OWLY...",
    "........OWL.....",
    ".......OWL..SS..",
    "......OWL..SYYS.",
    ".....OWL..OWLY..",
    "....OWL..OWL....",
    "...OWL..OWL.....",
    "..OWL..OWL......",
    ".OWL..OWL.......",
    "OWL..OWL........",
    "OW..OW..........",
    "O..O............",
    "................"
]
save_texture("sulfur_matches", create_image_from_grid(G_MATCHES, P_MATCHES))

# 13. safety_matches: Red & tan sliding matchbox with Swedish label
P_BOX = {
    '.': (0, 0, 0, 0),
    'O': (45, 35, 30, 255),   # Box outline
    'R': (175, 40, 35, 255),  # Friction strike red
    'B': (195, 160, 110, 255),# Cardboard tan body
    'L': (225, 195, 150, 255),# Cardboard highlight
    'D': (140, 105, 70, 255), # Sliding tray drawer
    'W': (245, 240, 225, 255),# White label star
}
G_BOX = [
    "................",
    "..OOOOOOOOOOOO..",
    ".OLLLLLLLLLLLDO.",
    ".OLBBBBBBBBBBOO.",
    ".OLBRRRRRRRBBO..",
    ".OLBRWWRWRRBBO..",
    ".OLBRRRRRRRBBO..",
    ".OLBBBBBBBBBBO..",
    ".OLBBBBBBBBBBO..",
    ".ODDDDDDDDDDDO..",
    ".ODBBBBBBBBBDO..",
    ".ODBBBBBBBBBDO..",
    "..ODDDDDDDDDOO..",
    "...OOOOOOOOOO...",
    "................",
    "................"
]
save_texture("safety_matches", create_image_from_grid(G_BOX, P_BOX))

# 14. vitriol_leather: Heavy green-vitriol tanned cordovan leather hide
P_LEATHER = {
    '.': (0, 0, 0, 0),
    'O': (40, 30, 25, 255),   # Dark hide rim
    'C': (85, 48, 32, 255),   # Deep cordovan leather
    'V': (45, 80, 55, 255),   # Green iron vitriol hue
    'M': (115, 68, 48, 255),  # Oiled leather midtone
    'L': (155, 98, 70, 255),  # Waxed sheen
    'S': (200, 180, 140, 255),# Heavy linen saddle stitching
}
G_LEATHER = [
    ".....OOOOOO.....",
    "...OOMMMMMMOO...",
    "..OMMLSLSLSMMO..",
    ".OMSSCVVVVCSSMO.",
    ".OMSCVVVVVVCSMO.",
    "OMMCVVVVVVVVCMMO",
    "OMSLCVVVVVVCMSMO",
    "OMSLCVVVVVVCSLMO",
    "OMMLCVVVVVVCMLMO",
    ".OMSCVVVVVVCSMO.",
    ".OMSSCVVVVCSSMO.",
    "..OMMLSLSLSMMO..",
    "...OOMMMMMMOO...",
    ".....OOOOOO.....",
    "................",
    "................"
]
save_texture("vitriol_leather", create_image_from_grid(G_LEATHER, P_LEATHER))

print("All 14 textures successfully generated.")
