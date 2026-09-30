#!/usr/bin/env python3
"""
Pixel Art Generator for The Brass Age Update.
Generates authentic Minecraft-style 16x16 pixel art sprites for ALL 34 custom items.
Features:
- Authentic Minecraft palettes (iron, blued steel, brass, walnut, sulfur, saltpeter, etc.)
- Strict 1-pixel dark silhouettes / outlines
- Directional lighting (top-left highlights, bottom-right shadows)
- Clean transparency (RGBA)
- Synchronizes output across server/kubejs/assets and client/kubejs/assets
"""

import os
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_ASSETS = os.path.join(BASE_DIR, "server", "kubejs", "assets", "kubejs", "textures", "item")
CLIENT_ASSETS = os.path.join(BASE_DIR, "client", "kubejs", "assets", "kubejs", "textures", "item")

os.makedirs(SERVER_ASSETS, exist_ok=True)
os.makedirs(CLIENT_ASSETS, exist_ok=True)

def hex_to_rgba(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def parse_ascii_sprite(ascii_art, palette):
    lines = [line.strip() for line in ascii_art.strip().split('\n') if line.strip()]
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, line in enumerate(lines):
        if y >= 16: break
        chars = line.split() if ' ' in line else list(line)
        if len(chars) < 16:
            chars = chars + ['.'] * (16 - len(chars))
        elif len(chars) > 16:
            chars = chars[:16]
        for x, char in enumerate(chars):
            if char != '.' and char in palette:
                im.putpixel((x, y), palette[char])
    return im

def save_sprite(name, image):
    s_path = os.path.join(SERVER_ASSETS, f"{name}.png")
    c_path = os.path.join(CLIENT_ASSETS, f"{name}.png")
    image.save(s_path, 'PNG')
    image.save(c_path, 'PNG')
    print(f"Generated: {name}.png (16x16)")

# =========================================================================
# 1. LOGISTICS CRATES (Replacing Coffers)
# =========================================================================

CRATE_MUSKETS_PALETTE = {
    '#': hex_to_rgba('#1c1108'),
    'B': hex_to_rgba('#5c3818'),
    'b': hex_to_rgba('#7d4e24'),
    'L': hex_to_rgba('#a66e38'),
    'G': hex_to_rgba('#e5b83b'),
    'g': hex_to_rgba('#9c7317'),
    'I': hex_to_rgba('#d0d0d8'),
    'i': hex_to_rgba('#505058'),
}
CRATE_MUSKETS_ASCII = """
. . # # # # # # # # # # # # . .
. # G G b b b b b b b b G G # .
# G L L L L L L L L L L L L G #
# G L b b b b b b b b b b L G #
# b L b I b b b b b b I b L b #
# b L b b I b b b b I b b L b #
# b L b b b I b b I b b b L b #
# # # # # # # I I # # # # # # #
# b L b b b I b b I b b b L b #
# b L b b I b b b b I b b L b #
# b L b I b b b b b b I b L b #
# G L b b b b b b b b b b B G #
# G B B B B B B B B B B B B G #
. # g g B B B B B B B B g g # .
. . # # # # # # # # # # # # . .
. . . . . . . . . . . . . . . .
"""

CRATE_PISTOLS_PALETTE = {
    '#': hex_to_rgba('#180f08'),
    'W': hex_to_rgba('#4a2e1b'),
    'w': hex_to_rgba('#6e4528'),
    'L': hex_to_rgba('#94623d'),
    'G': hex_to_rgba('#f5c942'),
    'g': hex_to_rgba('#a87e1b'),
    'S': hex_to_rgba('#c8c8d0'),
    's': hex_to_rgba('#585860'),
}
CRATE_PISTOLS_ASCII = """
. . . # # # # # # # # # # . . .
. . # G G w w w w w w G G # . .
. # G L L L L L L L L L L G # .
. # G L w w w w w w w w L G # .
. # w L w S w w w w S w L w # .
. # w L w w S w w S w w L w # .
. # w L w w w G G w w w L w # .
. # # # # # # G G # # # # # # .
. # w L w w S w w S w w L w # .
. # w L w S w w w w S w L w # .
. # w L w w w w w w w w W w # .
. # G W W W W W W W W W W G # .
. # G G g g g g g g g g G G # .
. . # # # # # # # # # # # # . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
"""

AMMUNITION_CRATE_PALETTE = {
    '#': hex_to_rgba('#141416'),
    'O': hex_to_rgba('#3d4432'),
    'o': hex_to_rgba('#5a634a'),
    'L': hex_to_rgba('#7d8a66'),
    'M': hex_to_rgba('#b0b4bc'),
    'm': hex_to_rgba('#545860'),
    'Y': hex_to_rgba('#ffd030'),
    'R': hex_to_rgba('#c02020'),
}
AMMUNITION_CRATE_ASCII = """
. . # # # # # # # # # # # # . .
. # M M o o M M o o M M M M # .
# M L L L L M M L L L L L L M #
# M L o o o m m o o o o o L M #
# m L o o o m m o o o o o L m #
# m L o o o Y Y o o o o o L m #
# m L o o Y R R Y o o o o L m #
# # # # # # R R # # # # # # # #
# m L o o Y R R Y o o o o L m #
# m L o o o Y Y o o o o o L m #
# m L o o o m m o o o o o L m #
# m L o o o m m o o o o o O m #
# M O O O O M M O O O O O O M #
. # m m O O m m O O m m m m # .
. . # # # # # # # # # # # # . .
. . . . . . . . . . . . . . . .
"""

# =========================================================================
# 2. LEGAL & PROVENANCE TOOLING
# =========================================================================

PROOF_STAMP_PALETTE = {
    '#': hex_to_rgba('#1c1404'),
    'Y': hex_to_rgba('#fff280'),
    'G': hex_to_rgba('#f0bc2c'),
    'g': hex_to_rgba('#9c7010'),
    'S': hex_to_rgba('#d0d4dc'),
    's': hex_to_rgba('#808894'),
    'D': hex_to_rgba('#3c4048'),
}
PROOF_STAMP_ASCII = """
. . . . . . # Y # . . . . . . .
. . . . . # Y G Y # . . . . . .
. . . . . # G g G # . . . . . .
. . . . . . # G # . . . . . . .
. . . . . . # G # . . . . . . .
. . . . . # Y G g # . . . . . .
. . . . . # G g g # . . . . . .
. . . . # Y G G G Y # . . . . .
. . . # Y G g g g G Y # . . . .
. . # G G G G G G G G G # . . .
. # S S S S S S S S S S S # . .
. # S s s s s s s s s s S # . .
. # S s D s D D s D s s S # . .
. # S s s D D D D s s s S # . .
. # S s s s D D s s s s S # . .
. . # # # # # # # # # # # . . .
"""

PERMIT_BLANK_PALETTE = {
    '#': hex_to_rgba('#2c2010'),
    'P': hex_to_rgba('#fff8e0'),
    'p': hex_to_rgba('#ebd5a0'),
    'd': hex_to_rgba('#ba9f6c'),
    'R': hex_to_rgba('#ff4444'),
    'r': hex_to_rgba('#ba1c1c'),
    'X': hex_to_rgba('#660a0a'),
    'I': hex_to_rgba('#483c2c'),
}
PERMIT_BLANK_ASCII = """
. . . . . # # # # # # # . . . .
. . . . # P P P P P P p # . . .
. . . # P p I I I I p d # . . .
. . # P p I I I I I p d # . . .
. # P p I I I I I I p d # . . .
# P p I I I I I I I p d # . . .
# P p p p p p p p p p d # . . .
# P p p # # R R # # p d # . . .
# P p # R R R R R R # d # . . .
# P p # R R r r R R # d # . . .
# P p # R r X X r R # d # . . .
# P p p # R r r R # p d # . . .
# P p p p # # # # p p d # . . .
# P d d d d d d d d d d # . . .
. # # # # # # # # # # # . . . .
. . . . . . . . . . . . . . . .
"""

# =========================================================================
# 3. CHEMICALS & POWDER REFINING
# =========================================================================

CRUDE_POWDER_CAKE_PALETTE = {
    '#': hex_to_rgba('#08080a'),
    'K': hex_to_rgba('#1e1e24'),
    'k': hex_to_rgba('#34343e'),
    'H': hex_to_rgba('#525260'),
    'Y': hex_to_rgba('#ebd034'),
    'y': hex_to_rgba('#9e8810'),
}
CRUDE_POWDER_CAKE_ASCII = """
. . . . . . . . . . . . . . . .
. . . # # # # # # # # . . . . .
. . # H H H H H H H H # . . . .
. # H k k k Y k k k k H # . . .
. # H k Y k y k k Y k k # . . .
# H k k y k k k k y k k H # . .
# H k k k k K K k k k k H # . .
# k k Y k K K K K k Y k k # . .
# k k y k K K K K k y k k # . .
# k K K K K K K K K K K K # . .
# k K K Y K K K K Y K K K # . .
. # K K y K K K K y K K # . . .
. # K K K K K K K K K K # . . .
. . # K K K K K K K K # . . . .
. . . # # # # # # # # . . . . .
. . . . . . . . . . . . . . . .
"""

WET_POWDER_MASS_PALETTE = {
    '#': hex_to_rgba('#0c1014'),
    'B': hex_to_rgba('#182028'),
    'b': hex_to_rgba('#283440'),
    'W': hex_to_rgba('#507088'),
    'w': hex_to_rgba('#80a4bc'),
}
WET_POWDER_MASS_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . # # # # # . . . . . .
. . . . # w W W b b # . . . . .
. . . # w W b b b b b # . . . .
. . # W b b b w W b b b # . . .
. # W b b b b W b b b B B # . .
. # b b w W b b b b B B B # . .
# b b b W b b b B B B B B B # .
# b b b b b B B B B B B B B # .
# b b B B B B B B B B B B B # .
# B B B B B B B B B B B B B # .
. # B B B B B B B B B B B # . .
. . # B B B B B B B B B # . . .
. . . # # # # # # # # # . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
"""

SALTPETER_PALETTE = {
    '#': hex_to_rgba('#38342c'),
    'C': hex_to_rgba('#fffff4'),
    'c': hex_to_rgba('#f4efe0'),
    'm': hex_to_rgba('#dcd4be'),
    's': hex_to_rgba('#b0a48a'),
}
SALTPETER_ASCII = """
. . . . . . . . . # C # . . . .
. . . . . . . . # C c s # . . .
. . . . . # C # # C c s # . . .
. . . . # C c s # c c m s # . .
. . . # C c c s # c m m s # . .
. . # C c c m s # m m s s # . .
. # C c c m m s # m s s # . . .
# C c c m m s s # s s # . . . .
# c c m m s s # C # # . . . . .
# c m m s s # C c s # . . . . .
# m m s s # C c m s # . . . . .
. # s s # C c m m s # . . . . .
. . # # # c m m s s # . . . . .
. . . . # m m s s # . . . . . .
. . . . . # s s # . . . . . . .
. . . . . . # # . . . . . . . .
"""

CRUSHED_DRIPSTONE_PALETTE = {
    '#': hex_to_rgba('#24160e'),
    'D': hex_to_rgba('#ba9278'),
    'd': hex_to_rgba('#8f6850'),
    'B': hex_to_rgba('#664430'),
    'b': hex_to_rgba('#422a1c'),
}
CRUSHED_DRIPSTONE_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . # . . . . . . . .
. . . . . . # D # . . . . . . .
. . . . . # D d D # . . . . . .
. . . . # D D d d D # . . . . .
. . . # D d D d d B D # . . . .
. . # D D d d d B B d D # . . .
. # D d D d B B b B d d D # . .
# D d d d B b b b B B d d D # .
# d d B B B b b b B B B d d # .
# B B B b b b b b b B B B B # .
# B b b b b b b b b b b b B # .
. # # # # # # # # # # # # # . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
"""

# =========================================================================
# 4. CIVILIAN COMMODITIES
# =========================================================================

FUMIGATION_STRIP_PALETTE = {
    '#': hex_to_rgba('#282004'),
    'Y': hex_to_rgba('#fff064'),
    'y': hex_to_rgba('#e0c420'),
    'G': hex_to_rgba('#9c840c'),
    'C': hex_to_rgba('#4a3c10'),
}
FUMIGATION_STRIP_ASCII = """
. . . . . . . . . . . . # # . .
. . . . . . . . . . . # Y Y # .
. . . . . . . . . . # Y Y y # .
. . . . . . . . . # Y Y y # . .
. . . . . . . . # Y Y y # . . .
. . . . . . . # Y Y y # . . . .
. . . . . . # Y Y y # . . . . .
. . . . . # Y Y y # . . . . . .
. . . . # Y Y y # . . . . . . .
. . . # Y Y y # . . . . . . . .
. . # Y Y y # . . . . . . . . .
. # Y Y y # . . . . . . . . . .
# Y Y y # . . . . . . . . . . .
# y y G # . . . . . . . . . . .
# G C # . . . . . . . . . . . .
. # # . . . . . . . . . . . . .
"""

ROYAL_FUMIGATION_STRIP_PALETTE = {
    '#': hex_to_rgba('#241028'),
    'G': hex_to_rgba('#ffe860'),
    'g': hex_to_rgba('#cfa018'),
    'Y': hex_to_rgba('#f5e048'),
    'V': hex_to_rgba('#d060e8'),
    'v': hex_to_rgba('#84209c'),
}
ROYAL_FUMIGATION_STRIP_ASCII = """
. . . . . . . . . . . . # # . .
. . . . . . . . . . . # G G # .
. . . . . . . . . . # G Y g # .
. . . . . . . . . # G Y g # . .
. . . . . . . . # G Y g # . . .
. . . . . . . # G Y g # . . . .
. . . . . . # # V v # # . . . .
. . . . . # V V v v v # . . . .
. . . . # v V V v v # . . . . .
. . . # G Y g # # # . . . . . .
. . # G Y g # . . . . . . . . .
. # G Y g # . . . . . . . . . .
# G Y g # . . . . . . . . . . .
# Y g g # . . . . . . . . . . .
# g g # . . . . . . . . . . . .
. # # . . . . . . . . . . . . .
"""

MIRACLE_FERTILIZER_PALETTE = {
    '#': hex_to_rgba('#14180e'),
    'B': hex_to_rgba('#8c6840'),
    'b': hex_to_rgba('#5c4024'),
    'E': hex_to_rgba('#80ff98'),
    'e': hex_to_rgba('#28d050'),
    'D': hex_to_rgba('#0e7c2c'),
    'W': hex_to_rgba('#e8f8e0'),
}
MIRACLE_FERTILIZER_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . # # # # # . . . . . .
. . . . # E W E W E # . . . . .
. . . # E e W e e e E # . . . .
. . # E e e D e W e e E # . . .
. # # B B B B B B B B B # # . .
# B B B B B B B B B B B B B # .
# B B B B B B B B B B B B B # .
# B B B B B B B B B B B B B # .
# B B B B B B B B B B B B B # .
# B B B B B B B B B B B B B # .
# B b b b b b b b b b b b B # .
# b b b b b b b b b b b b b # .
. # b b b b b b b b b b b # . .
. . # # # # # # # # # # # . . .
. . . . . . . . . . . . . . . .
"""

MEDICATED_SOAP_PALETTE = {
    '#': hex_to_rgba('#0e2418'),
    'S': hex_to_rgba('#b4f8d0'),
    's': hex_to_rgba('#6ad898'),
    'D': hex_to_rgba('#329860'),
    'd': hex_to_rgba('#186038'),
    'W': hex_to_rgba('#ffffff'),
    'w': hex_to_rgba('#d0f0ff'),
}
MEDICATED_SOAP_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . W w . . . . . .
. . . . . . . W W w . . . . . .
. . . # # # # # # # # # # . . .
. . # S S S S S S S S S S # . .
. # S S S S S S S S S S S S # .
# S S s s s s s s s s s s S S #
# S s s # # # # # # # # s s S #
# S s s # s s s s s s # s s D #
# S s s # # # # # # # # s s D #
# S s s s s s s s s s s s D D #
# S D D D D D D D D D D D D d #
# D D d d d d d d d d d d d d #
. # # # # # # # # # # # # # # .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
"""

SULFUR_MATCHES_PALETTE = {
    '#': hex_to_rgba('#1c1404'),
    'Y': hex_to_rgba('#fff860'),
    'y': hex_to_rgba('#d8a410'),
    'W': hex_to_rgba('#dfbe88'),
    'w': hex_to_rgba('#a88048'),
    'B': hex_to_rgba('#6a4820'),
}
SULFUR_MATCHES_ASCII = """
. . . . . . . . . . . # Y # . .
. . . . . . . . . . # Y Y y # .
. . . . . . . . . . # y y # . .
. . . . . . . . . # W w # . . .
. . . . . . . . # W w # # Y # .
. . . . . . . # W w # # Y Y y #
. . . . . . # W w # . # y y # .
. . . . . # W w # . # W w # . .
. . . . # W w # . # W w # . . .
. . . # W w # . # W w # . . . .
. . # W w # . # W w # . . . . .
. # W w # . # W w # . . . . . .
# W w # . # W w # . . . . . . .
# w B # # W w # . . . . . . . .
# B # . # B # . . . . . . . . .
. # . . . # . . . . . . . . . .
"""

SAFETY_MATCHES_PALETTE = {
    '#': hex_to_rgba('#1c1008'),
    'R': hex_to_rgba('#e03428'),
    'r': hex_to_rgba('#8c1810'),
    'Y': hex_to_rgba('#f8d048'),
    'P': hex_to_rgba('#683820'),
    'W': hex_to_rgba('#d8be90'),
    'w': hex_to_rgba('#9c7c48'),
}
SAFETY_MATCHES_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . # # # # # # # # . . .
. . . . # W W W W W W W W # . .
. . . # W W W W W W W W W W # .
. . # # # # # # # # # # # # # #
. # R R R R R R R R R R R R P #
# R R R R R R R R R R R R R P #
# R R R R Y Y Y Y R R R R R P #
# R R R Y Y Y Y Y Y R R R R P #
# R R R Y Y Y Y Y Y R R R R P #
# R R R R Y Y Y Y R R R R R P #
# R R R R R R R R R R R R R P #
# r r r r r r r r r r r r r P #
# w w w w w w w w w w w w w # #
. # # # # # # # # # # # # # # .
. . . . . . . . . . . . . . . .
"""

VITRIOL_LEATHER_PALETTE = {
    '#': hex_to_rgba('#180804'),
    'L': hex_to_rgba('#a84c20'),
    'l': hex_to_rgba('#782c0c'),
    'D': hex_to_rgba('#4c1606'),
    'S': hex_to_rgba('#ffd470'),
}
VITRIOL_LEATHER_ASCII = """
. . . . . . . . . . . . . . . .
. . . # # # . . . # # # . . . .
. . # L L L # # # L L L # . . .
. # L L S L L L L L S L L # . .
# L L l l l l l l l l l L L # .
# L l l l l l l l l l l l L # .
# L l l l l l l l l l l l L # .
. # l l l S l l l S l l l # . .
. # l l l l l l l l l l l # . .
# L l l l l l l l l l l l L # .
# L l l l l l l l l l l l L # .
# L D D D D D D D D D D D L # .
# D D D D D S D D D D S D D # .
. # D D D # # # # # D D D # . .
. . # # # . . . . . # # # . . .
. . . . . . . . . . . . . . . .
"""

# =========================================================================
# 5. WEAPON & MECHANICAL FORGE COMPONENTS (16 items)
# =========================================================================

GUN_STEEL_BLANK_PALETTE = {
    '#': hex_to_rgba('#101418'),
    'H': hex_to_rgba('#d0d4dc'),
    'h': hex_to_rgba('#9aa0ac'),
    'b': hex_to_rgba('#606874'),
    'd': hex_to_rgba('#383e48'),
}
GUN_STEEL_BLANK_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . # # # # # # . . . .
. . . . . # H H H H H H # . . .
. . . . # H H h h h h H d # . .
. . . # H H h b b b h H d d # .
. . # H H h b b b b h H d d # .
. # H H h b b b b b h H d d # .
# H H h b b b b b b h H d d # .
# H h b b b b b b b h H d d # .
# h b b b b b b b b h H d d # .
# h b b b b b b b b h H d d # .
# d h b b b b b b h H d d # . .
. # d h b b b b h H d d # . . .
. . # d h b b h H d d # . . . .
. . . # d d d d d d # . . . . .
. . . . # # # # # # . . . . . .
"""

GUN_SCREWS_PALETTE = {
    '#': hex_to_rgba('#0c0c10'),
    'S': hex_to_rgba('#d4d8e0'),
    's': hex_to_rgba('#848894'),
    'D': hex_to_rgba('#444850'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a88018'),
}
GUN_SCREWS_ASCII = """
. . . . . . . . . . . . . . . .
. . # S S # . . . . # G G # . .
. # S D D S # . . # G g g G # .
. # S D D S # . . # G g g G # .
. . # s s # . . . . # g g # . .
. . # s s # . . . . # g g # . .
. . # D D # . . . . # g g # . .
. . . # # . . . . . . # # . . .
. . . . . . # S S # . . . . . .
. . . . . # S D D S # . . . . .
. . . . . # S D D S # . . . . .
. . . . . . # s s # . . . . . .
. . . . . . # s s # . . . . . .
. . . . . . # D D # . . . . . .
. . . . . . . # # . . . . . . .
. . . . . . . . . . . . . . . .
"""

BARREL_BLANK_PALETTE = {
    '#': hex_to_rgba('#101418'),
    'I': hex_to_rgba('#c0c8d4'),
    'i': hex_to_rgba('#808894'),
    'D': hex_to_rgba('#48505c'),
    'k': hex_to_rgba('#181c20'),
}
BARREL_BLANK_ASCII = """
. . . . . . . . . . . . # # . .
. . . . . . . . . . . # I I # .
. . . . . . . . . . # I k i # .
. . . . . . . . . # I I i # . .
. . . . . . . . # I I i # . . .
. . . . . . . # I I i # . . . .
. . . . . . # I I i # . . . . .
. . . . . # I I i # . . . . . .
. . . . # I I i # . . . . . . .
. . . # I I i # . . . . . . . .
. . # I I i # . . . . . . . . .
. # I I i # . . . . . . . . . .
# I I i # . . . . . . . . . . .
# I k i # . . . . . . . . . . .
# i i D # . . . . . . . . . . .
. # # # . . . . . . . . . . . .
"""

PISTOL_BARREL_PALETTE = {
    '#': hex_to_rgba('#0e1216'),
    'S': hex_to_rgba('#dce4ec'),
    's': hex_to_rgba('#8a98a8'),
    'D': hex_to_rgba('#44505c'),
    'G': hex_to_rgba('#f8d048'),
}
PISTOL_BARREL_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . # G # .
. . . . . . . . . . . # S S # .
. . . . . . . . . . # S S s # .
. . . . . . . . . # S S s # . .
. . . . . . . . # S S s # . . .
. . . . . . . # S S s # . . . .
. . . . . . # S S s # . . . . .
. . . . . # S S s # . . . . . .
. . . . # S S s # . . . . . . .
. . . # S S s # . . . . . . . .
. . # S S s # . . . . . . . . .
. # S S s # . . . . . . . . . .
# S S s # . . . . . . . . . . .
# s D # . . . . . . . . . . . .
. # # . . . . . . . . . . . . .
"""

RIFLE_BARREL_PALETTE = {
    '#': hex_to_rgba('#0e1216'),
    'S': hex_to_rgba('#dce4ec'),
    's': hex_to_rgba('#8a98a8'),
    'D': hex_to_rgba('#44505c'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a88018'),
}
RIFLE_BARREL_ASCII = """
. . . . . . . . . . . . . # # .
. . . . . . . . . . . . # S S #
. . . . . . . . . . . # S s # .
. . . . . . . . . . # S s # . .
. . . . . . . . . # G g # . . .
. . . . . . . . # S s # . . . .
. . . . . . . # S s # . . . . .
. . . . . . # G g # . . . . . .
. . . . . # S s # . . . . . . .
. . . . # S s # . . . . . . . .
. . . # G g # . . . . . . . . .
. . # S s # . . . . . . . . . .
. # S s # . . . . . . . . . . .
# S s # . . . . . . . . . . . .
# s D # . . . . . . . . . . . .
. # # . . . . . . . . . . . . .
"""

MAINSPRING_BLANK_PALETTE = {
    '#': hex_to_rgba('#101418'),
    'S': hex_to_rgba('#c0c8d4'),
    's': hex_to_rgba('#78808c'),
    'D': hex_to_rgba('#3c4450'),
}
MAINSPRING_BLANK_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . # # # # . . . . . . .
. . . . # S S S S # . . . . . .
. . . # S S # # S S # . . . . .
. . . # S # . . # S # . . . . .
. . # S S # . . # S S # . . . .
. . # S s # . . . # S s # . . .
. # S s # . . . . . # S s # . .
. # S s # . . . . . # S s # . .
. # S s # . . . . . # S s # . .
. # S s # . . . . . # S s # . .
. # S s # . . . . . # S s # . .
. # s D # . . . . . # s D # . .
. . # D # . . . . . # D # . . .
. . . # . . . . . . . # . . . .
. . . . . . . . . . . . . . . .
"""

TEMPERED_MAINSPRING_PALETTE = {
    '#': hex_to_rgba('#081018'),
    'C': hex_to_rgba('#88dcf0'),
    'c': hex_to_rgba('#3888b8'),
    'D': hex_to_rgba('#183850'),
}
TEMPERED_MAINSPRING_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . # # # # . . . . . . .
. . . . # C C C C # . . . . . .
. . . # C C # # C C # . . . . .
. . . # C # . . # C # . . . . .
. . # C C # . . # C C # . . . .
. . # C c # . . . # C c # . . .
. # C c # . . . . . # C c # . .
. # C c # . . . . . # C c # . .
. # C c # . . . . . # C c # . .
. # C c # . . . . . # C c # . .
. # C c # . . . . . # C c # . .
. # c D # . . . . . # c D # . .
. . # D # . . . . . # D # . . .
. . . # . . . . . . . # . . . .
. . . . . . . . . . . . . . . .
"""

FLINTLOCK_HAMMER_PALETTE = {
    '#': hex_to_rgba('#101014'),
    'F': hex_to_rgba('#404048'),
    'f': hex_to_rgba('#707080'),
    'L': hex_to_rgba('#8c5c30'),
    'S': hex_to_rgba('#d0d4dc'),
    's': hex_to_rgba('#7c8490'),
    'D': hex_to_rgba('#38404c'),
}
FLINTLOCK_HAMMER_ASCII = """
. . . . . . # f f # . . . . . .
. . . . . # f F F f # . . . . .
. . . . . # F F F F # . . . . .
. . . . # L L L L L L # . . . .
. . . . # S S S S S S # . . . .
. . . . . . # S s # . . . . . .
. . . . . . # S s # . . . . . .
. . . . . # S S s # . . . . . .
. . . . # S S s # . . . . . . .
. . . # S S s # . . . . . . . .
. . # S S s # . . . . . . . . .
. # S S s # . . . . . . . . . .
# S S s # . . . . . . . . . . .
# S s D # . . . . . . . . . . .
. # D D # . . . . . . . . . . .
. . # # . . . . . . . . . . . .
"""

FLASH_PAN_PALETTE = {
    '#': hex_to_rgba('#201404'),
    'G': hex_to_rgba('#fff280'),
    'g': hex_to_rgba('#f0bc2c'),
    'B': hex_to_rgba('#a87c14'),
    'b': hex_to_rgba('#5c3e06'),
    'k': hex_to_rgba('#181002'),
}
FLASH_PAN_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . # # # # . . . . . .
. . . . . # G G G G # . . . . .
. . . . # G g g g g G # . . . .
. . . # G g k k k g g G # . . .
. . # G g k k k k k g g G # . .
. # G g k k k k k k k g g G # .
# G g g g g g g g g g g g g G #
# g g B B B B B B B B B B g g #
# B B B b b b b b b b B B B B #
. # b b b b b b b b b b b b # .
. . # # b b b b b b b b # # . .
. . . . # # # # # # # # . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
"""

TRIGGER_ASSEMBLY_PALETTE = {
    '#': hex_to_rgba('#101014'),
    'S': hex_to_rgba('#d0d4dc'),
    's': hex_to_rgba('#78808c'),
    'D': hex_to_rgba('#3c4450'),
    'G': hex_to_rgba('#f8d048'),
}
TRIGGER_ASSEMBLY_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . # # # # . . . . .
. . . . . . # S S S S # . . . .
. . . . . # S S G G S S # . . .
. . . . . # S S G G S S # . . .
. . . . . . # S s s s # . . . .
. . . . . . # S s # # . . . . .
. . . . . . # S s # . . . . . .
. . . . . # S S s # . . . . . .
. . . . . # S s # . . . . . . .
. . . . # S S s # . . . . . . .
. . . . # S s # . . . . . . . .
. . . # S S s # . . . . . . . .
. . # S S s # . . . . . . . . .
. . # s D # . . . . . . . . . .
. . . # # . . . . . . . . . . .
"""

FLINTLOCK_MECHANISM_PALETTE = {
    '#': hex_to_rgba('#101014'),
    'S': hex_to_rgba('#d0d4dc'),
    's': hex_to_rgba('#78808c'),
    'D': hex_to_rgba('#38404c'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a87c14'),
    'F': hex_to_rgba('#505058'),
}
FLINTLOCK_MECHANISM_ASCII = """
. . . . . . # F F # . . . . . .
. . . . . # F F F F # . . . . .
. . . . . # S S S S # . . . . .
. . . . . . # S s # . . # # . .
. . . . . . # S s # . # G G # .
. . . . . # S S s # # G g g G #
. # # # # S S s # # G g g g G #
# S S S S S s # # G g g g g G #
# S s s s s s S S S S S S S S #
# S s s D D D D D D D D D s S #
# S s D D D D D D D D D D s D #
# D D D D D D D D D D D D D D #
. # # # # # # # # # # # # # # .
. . . . . . # S s # . . . . . .
. . . . . . # s D # . . . . . .
. . . . . . . # # . . . . . . .
"""

STOCK_BLANK_PALETTE = {
    '#': hex_to_rgba('#1c1008'),
    'W': hex_to_rgba('#98683c'),
    'w': hex_to_rgba('#6a4424'),
    'D': hex_to_rgba('#3c2210'),
}
STOCK_BLANK_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . # # # .
. . . . . . . . . . . # W W W #
. . . . . . . . . . # W W w # .
. . . . . . . . . # W W w # . .
. . . . . . . . # W W w # . . .
. . . . . . . # W W w # . . . .
. . . . . . # W W w # . . . . .
. . . . . # W W w # . . . . . .
. . . . # W W w # . . . . . . .
. . . # W W w # . . . . . . . .
. . # W W w # . . . . . . . . .
. # W W w # . . . . . . . . . .
# W W w D # . . . . . . . . . .
# w D D # . . . . . . . . . . .
. # # # . . . . . . . . . . . .
"""

PISTOL_STOCK_PALETTE = {
    '#': hex_to_rgba('#1c1008'),
    'W': hex_to_rgba('#98683c'),
    'w': hex_to_rgba('#6a4424'),
    'D': hex_to_rgba('#3c2210'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a87c14'),
}
PISTOL_STOCK_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . # # # .
. . . . . . . . . . . # W W W #
. . . . . . . . . . # W W w # .
. . . . . . . . . # W W w # . .
. . . . . . . . # W W w # . . .
. . . . . . . # W W w # . . . .
. . . . . . # W W w # . . . . .
. . . . . # W W w # . . . . . .
. . . . # W W w # . . . . . . .
. . . # W W w # . . . . . . . .
. . # W W w # . . . . . . . . .
. # W W w # . . . . . . . . . .
# G G g # . . . . . . . . . . .
# G g g # . . . . . . . . . . .
. # # # . . . . . . . . . . . .
"""

RIFLE_STOCK_PALETTE = {
    '#': hex_to_rgba('#1c1008'),
    'W': hex_to_rgba('#98683c'),
    'w': hex_to_rgba('#6a4424'),
    'D': hex_to_rgba('#3c2210'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a87c14'),
}
RIFLE_STOCK_ASCII = """
. . . . . . . . . . . . . . # #
. . . . . . . . . . . . . # W #
. . . . . . . . . . . . # W w #
. . . . . . . . . . . # W w # .
. . . . . . . . . . # W w # . .
. . . . . . . . . # W w # . . .
. . . . . . . . # W w # . . . .
. . . . . . . # W w # . . . . .
. . . . . . # W w # . . . . . .
. . . . . # W w # . . . . . . .
. . . . # W w # . . . . . . . .
. . . # W w # . . . . . . . . .
. . # W w D # . . . . . . . . .
. # G W w D # . . . . . . . . .
# G G g D # . . . . . . . . . .
. # # # # . . . . . . . . . . .
"""

BARREL_BAND_PALETTE = {
    '#': hex_to_rgba('#201404'),
    'G': hex_to_rgba('#fff280'),
    'g': hex_to_rgba('#f0bc2c'),
    'B': hex_to_rgba('#a87c14'),
    'b': hex_to_rgba('#5c3e06'),
}
BARREL_BAND_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . # # # # . . . . . .
. . . . . # G G G G # . . . . .
. . . . # G G g g G G # . . . .
. . . # G G # # # # G G # . . .
. . . # G g # . . # g G # . . .
. . . # G g # . . # g G # . . .
. . . # G g # . . # g G # . . .
. . . # g B # . . # B g # . . .
. . . # g B # . . # B g # . . .
. . . # B b # # # # b B # . . .
. . . . # B B b b B B # . . . .
. . . . . # b b b b # . . . . .
. . . . . . # # # # . . . . . .
. . . . . . . . . . . . . . . .
"""

RAMROD_PALETTE = {
    '#': hex_to_rgba('#101418'),
    'S': hex_to_rgba('#d0d8e0'),
    's': hex_to_rgba('#788898'),
    'G': hex_to_rgba('#f8d048'),
    'g': hex_to_rgba('#a87c14'),
}
RAMROD_ASCII = """
. . . . . . . . . . . . . # G #
. . . . . . . . . . . . # G g #
. . . . . . . . . . . # S s # .
. . . . . . . . . . # S s # . .
. . . . . . . . . # S s # . . .
. . . . . . . . # S s # . . . .
. . . . . . . # S s # . . . . .
. . . . . . # S s # . . . . . .
. . . . . # S s # . . . . . . .
. . . . # S s # . . . . . . . .
. . . # S s # . . . . . . . . .
. . # S s # . . . . . . . . . .
. # S s # . . . . . . . . . . .
# S s # . . . . . . . . . . . .
# s # . . . . . . . . . . . . .
# # . . . . . . . . . . . . . .
"""

RIFLED_BARREL_PALETTE = {
    '#': hex_to_rgba('#101418'),
    'S': hex_to_rgba('#d0d8e0'),
    's': hex_to_rgba('#788898'),
    'D': hex_to_rgba('#384450'),
    'B': hex_to_rgba('#50b4d8'),
    'b': hex_to_rgba('#184060'),
}
RIFLED_BARREL_ASCII = """
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . # # . .
. . . . . . . . . . . # S S # .
. . . . . . . . . . # S B s # .
. . . . . . . . . # S B s # . .
. . . . . . . . # S B s # . . .
. . . . . . . # S B s # . . . .
. . . . . . # S B s # . . . . .
. . . . . # S B s # . . . . . .
. . . . # S B s # . . . . . . .
. . . # S B s # . . . . . . . .
. . # S B s # . . . . . . . . .
. # # b b # . . . . . . . . . .
# b b B B b # . . . . . . . . .
# b B b b B # . . . . . . . . .
. # # # # # . . . . . . . . . .
"""

TEMPERED_GUN_STEEL_PALETTE = {
    '#': hex_to_rgba('#081018'),
    'C': hex_to_rgba('#90e8f8'),
    'B': hex_to_rgba('#3888b8'),
    'P': hex_to_rgba('#5c4088'),
    'D': hex_to_rgba('#1c2838'),
}
TEMPERED_GUN_STEEL_ASCII = """
. . . . . . . . . . . . . . . .
. . . . # # # # # # # # # . . .
. . . # C C C C C C C C C # . .
. . # C C C C C C C C C C C # .
. # C C B B B B B B B B C C D #
# C C B B B B B B B B B B C D #
# C B B B P P P P P P B B B D #
# C B B P P P P P P P P B B D #
# B B P P P P P P P P P P B D #
# B P P P P P P P P P P P P D #
# B P P P P P P P P P P P D D #
# P P P P P P P P P P P D D D #
# D D D D D D D D D D D D D D #
. # D D D D D D D D D D D D # .
. . # # # # # # # # # # # # . .
. . . . . . . . . . . . . . . .
"""

def generate_all():
    sprites = [
        # Logistics Crates (3)
        ("crate_muskets", CRATE_MUSKETS_ASCII, CRATE_MUSKETS_PALETTE),
        ("crate_pistols", CRATE_PISTOLS_ASCII, CRATE_PISTOLS_PALETTE),
        ("ammunition_crate", AMMUNITION_CRATE_ASCII, AMMUNITION_CRATE_PALETTE),

        # Legal Tooling (2)
        ("proof_stamp", PROOF_STAMP_ASCII, PROOF_STAMP_PALETTE),
        ("permit_blank", PERMIT_BLANK_ASCII, PERMIT_BLANK_PALETTE),

        # Chemicals & Powder (4)
        ("crude_gunpowder_cake", CRUDE_POWDER_CAKE_ASCII, CRUDE_POWDER_CAKE_PALETTE),
        ("wet_powder_mass", WET_POWDER_MASS_ASCII, WET_POWDER_MASS_PALETTE),
        ("saltpeter", SALTPETER_ASCII, SALTPETER_PALETTE),
        ("crushed_dripstone", CRUSHED_DRIPSTONE_ASCII, CRUSHED_DRIPSTONE_PALETTE),

        # Civilian Lines (7)
        ("fumigation_strip", FUMIGATION_STRIP_ASCII, FUMIGATION_STRIP_PALETTE),
        ("royal_fumigation_strip", ROYAL_FUMIGATION_STRIP_ASCII, ROYAL_FUMIGATION_STRIP_PALETTE),
        ("miracle_fertilizer", MIRACLE_FERTILIZER_ASCII, MIRACLE_FERTILIZER_PALETTE),
        ("medicated_soap", MEDICATED_SOAP_ASCII, MEDICATED_SOAP_PALETTE),
        ("sulfur_matches", SULFUR_MATCHES_ASCII, SULFUR_MATCHES_PALETTE),
        ("safety_matches", SAFETY_MATCHES_ASCII, SAFETY_MATCHES_PALETTE),
        ("vitriol_leather", VITRIOL_LEATHER_ASCII, VITRIOL_LEATHER_PALETTE),

        # Mechanical Forge Components (18)
        ("gun_steel_blank", GUN_STEEL_BLANK_ASCII, GUN_STEEL_BLANK_PALETTE),
        ("tempered_gun_steel", TEMPERED_GUN_STEEL_ASCII, TEMPERED_GUN_STEEL_PALETTE),
        ("gun_screws", GUN_SCREWS_ASCII, GUN_SCREWS_PALETTE),
        ("barrel_blank", BARREL_BLANK_ASCII, BARREL_BLANK_PALETTE),
        ("pistol_barrel", PISTOL_BARREL_ASCII, PISTOL_BARREL_PALETTE),
        ("rifle_barrel", RIFLE_BARREL_ASCII, RIFLE_BARREL_PALETTE),
        ("rifled_barrel", RIFLED_BARREL_ASCII, RIFLED_BARREL_PALETTE),
        ("mainspring_blank", MAINSPRING_BLANK_ASCII, MAINSPRING_BLANK_PALETTE),
        ("tempered_mainspring", TEMPERED_MAINSPRING_ASCII, TEMPERED_MAINSPRING_PALETTE),
        ("flintlock_hammer", FLINTLOCK_HAMMER_ASCII, FLINTLOCK_HAMMER_PALETTE),
        ("flash_pan", FLASH_PAN_ASCII, FLASH_PAN_PALETTE),
        ("trigger_assembly", TRIGGER_ASSEMBLY_ASCII, TRIGGER_ASSEMBLY_PALETTE),
        ("flintlock_mechanism", FLINTLOCK_MECHANISM_ASCII, FLINTLOCK_MECHANISM_PALETTE),
        ("stock_blank", STOCK_BLANK_ASCII, STOCK_BLANK_PALETTE),
        ("pistol_stock", PISTOL_STOCK_ASCII, PISTOL_STOCK_PALETTE),
        ("rifle_stock", RIFLE_STOCK_ASCII, RIFLE_STOCK_PALETTE),
        ("barrel_band", BARREL_BAND_ASCII, BARREL_BAND_PALETTE),
        ("ramrod", RAMROD_ASCII, RAMROD_PALETTE),
    ]

    print(f"Generating ALL {len(sprites)} custom 16x16 pixel art sprites...")
    for name, ascii_grid, pal in sprites:
        img = parse_ascii_sprite(ascii_grid, pal)
        save_sprite(name, img)
    print(f"All {len(sprites)} custom item pixel art sprites generated successfully!")

if __name__ == "__main__":
    generate_all()
