import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import win32com.client
import pypdf

# Color definitions
HEX_NAVY = "1A365D"
HEX_BRONZE = "8C6239"
HEX_CHARCOAL = "2D3748"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_CALLOUT_BG = "F1F5F9"
HEX_CALLOUT_BORDER = "1A365D"

COLOR_NAVY = RGBColor(0x1A, 0x36, 0x5D)
COLOR_BRONZE = RGBColor(0x8C, 0x62, 0x39)
COLOR_CHARCOAL = RGBColor(0x2D, 0x37, 0x48)
COLOR_MUTED = RGBColor(0x71, 0x80, 0x96)

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=50, bottom=50, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, hex_color=HEX_BORDER):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{hex_color}"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{hex_color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{hex_color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_centered_diagram(doc, img_path, width_in_inches, caption_text, space_before=4, space_after=4):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(img_path, width=Inches(width_in_inches))
    
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(0)
    cap.paragraph_format.space_after = Pt(space_after)
    c_run = cap.add_run(caption_text)
    c_run.font.size = Pt(8.5)
    c_run.font.italic = True
    c_run.font.color.rgb = COLOR_MUTED

def add_callout_box(doc, title, items, hex_bg=HEX_CALLOUT_BG, hex_border=HEX_NAVY, space_before=4):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, hex_bg)
    set_cell_margins(cell, top=40, bottom=40, left=80, right=80)
    tblPr = tbl._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{hex_border}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="none"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(title)
    r.font.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = COLOR_NAVY
    for item_title, item_desc in items:
        p_item = cell.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_before = Pt(0)
        p_item.paragraph_format.space_after = Pt(1)
        r_item = p_item.add_run(item_title + ": ")
        r_item.font.bold = True
        r_item.font.size = Pt(7.5)
        r_item.font.color.rgb = COLOR_CHARCOAL
        r_desc = p_item.add_run(item_desc)
        r_desc.font.size = Pt(7.5)

def build_docx(docx_path):
    doc = Document()
    
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.55)
        section.bottom_margin = Inches(0.55)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Rustic Craft II — The Brass Age Expansion Proposal")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = COLOR_MUTED
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun_left = fp.add_run("Confidential — For Admin & Storyteller Review Only | Minecraft 1.21.1 NeoForge")
        frun_left.font.name = "Segoe UI"
        frun_left.font.size = Pt(8)
        frun_left.font.color.rgb = COLOR_MUTED

    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(9.5)
    normal_style.font.color.rgb = COLOR_CHARCOAL
    normal_style.paragraph_format.line_spacing = 1.12
    normal_style.paragraph_format.space_after = Pt(2.5)

    # =========================================================================
    # PAGE 1: TITLE & CORE COMBAT PHILOSOPHY (COSSACKS 3 BALANCE)
    # =========================================================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(1)
    t_run = title_p.add_run("The Brass Age: Renaissance Firearm & Military Economy")
    t_run.font.name = "Segoe UI Semibold"
    t_run.font.size = Pt(18)
    t_run.font.bold = True
    t_run.font.color.rgb = COLOR_NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(6)
    sub_run = sub_p.add_run("A Proposal for the Rustic Craft II Administration & Storytelling Team | ")
    sub_run.font.size = Pt(9)
    sub_run.font.bold = True
    sub_run.font.color.rgb = COLOR_BRONZE
    sub_run2 = sub_p.add_run("Authored by the Technical Administration & Commissariat of Straja")
    sub_run2.font.size = Pt(8.5)
    sub_run2.font.italic = True
    sub_run2.font.color.rgb = COLOR_MUTED

    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(3)
    h1.paragraph_format.space_after = Pt(2)
    r = h1.add_run("1. Executive Summary & Core Philosophy")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p = doc.add_paragraph()
    p.add_run("The introduction of firearms into ").font.color.rgb = COLOR_CHARCOAL
    r_em = p.add_run("Rustic Craft II")
    r_em.font.bold = True
    p.add_run(" marks the realm's transition from the High Medieval period into the Early Modern / Renaissance era. Our design is anchored in the battlefield balance of ")
    r_coss = p.add_run("Cossacks 3")
    r_coss.font.bold = True
    p.add_run(": firearms are devastating force multipliers, but strict operational limits preserve the supremacy of melee combat, cavalry, and armor.")

    bullets = [
        ("Devastating Volley Fire", "A direct hit from a 16.5mm flintlock ball against unarmored or light targets causes severe trauma or death (40–55 base damage)."),
        ("The 20-Second Vulnerability Window", "Muzzleloading is slow and deliberate. The flintlock rifle requires 19.5 seconds and the pistol requires 22.2 seconds to reload."),
        ("Combined Arms (Pike & Saber Retain Supremacy)", "If a volley fails to break an enemy charge, or if the shooter misses, the reload animation locks them out of combat. Cavalry, pikemen, halberdiers, and sword-and-buckler fighters (Epic Knights, Spartan Weaponry) close the distance and cut down reloading musketeers."),
        ("Authentic Ballistics & Lock Time", "Smoothbores feature authentic conical dispersion (deadly at 0–30m, inaccurate past 60m) and a 140ms flint-strike ignition delay (qkl:delayshoot_gun_logic), preventing unrealistic laser-sniping and rewarding disciplined kneeling volleys."),
        ("Authentic Industrial Scarcity", "Firearms and ammunition are expensive luxury assets requiring either grueling manual labor or advanced industrial automation. Creeper mob farming is entirely detached from military ammunition.")
    ]
    for b_title, b_desc in bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(1)
        run_b = bp.add_run(b_title + ": ")
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_NAVY
        bp.add_run(b_desc)

    # Large Centered Diagram 1 (6.8 inches wide!)
    add_centered_diagram(
        doc,
        "figures/diagram1_combat.png",
        width_in_inches=6.8,
        caption_text="Figure 1: Renaissance Combat Flow & Reload Vulnerability Window",
        space_before=3,
        space_after=1
    )

    sub_ammo = doc.add_paragraph()
    sub_ammo.paragraph_format.space_before = Pt(2)
    sub_ammo.paragraph_format.space_after = Pt(1)
    r_ammo = sub_ammo.add_run("Ammunition Arsenal: Calibers & Specialized Anti-Corruption Silver")
    r_ammo.font.name = "Segoe UI Semibold"
    r_ammo.font.size = Pt(9.5)
    r_ammo.font.bold = True
    r_ammo.font.color.rgb = COLOR_NAVY

    table_ammo = doc.add_table(rows=5, cols=4)
    table_ammo.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_ammo)
    ammo_headers = ["Cartridge Type", "Ballistics", "Special Combat & Roleplay Effect", "Tactical Role"]
    for i, title in enumerate(ammo_headers):
        cell = table_ammo.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=20, bottom=20, left=50, right=50)
        p_h = cell.paragraphs[0]
        r_h = p_h.add_run(title)
        r_h.font.bold = True
        r_h.font.size = Pt(7.5)
        r_h.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    ammo_data = [
        ("16.5mm Standard Lead Ball", "40–55 Kinetic Dmg (30% Armor Ignore)", "Heavy blunt trauma; effective against living men, armor & beasts", "Mainline infantry volley fire"),
        ("16.5mm Consecrated Silver Ball", "Alchemically cast pure silver core", "DEVASTATING 4× DMG vs Undead CustomNPCs & Mobs; 2× DMG vs Undead/Vampire Players", "Essential weapon to cleanse Island Corruption"),
        ("16.5mm Canister Scattershot", "8 Spread Pellets (8–10 Dmg each, Cone)", "Massive close-range cone spread & staggering knockback", "Anti-horde & anti-cavalry crowd defense"),
        ("16.5mm Incendiary Sulfur Ball", "35 Kinetic Dmg + Fiery Flash", "Ignites corrupt nests for 8s; leaves burning phosphorescent residue", "Cavern clearing & underground warfare")
    ]
    for row_idx, data in enumerate(ammo_data, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_ammo.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=16, bottom=16, left=50, right=50)
            p_c = cell.paragraphs[0]
            r_c = p_c.add_run(val)
            r_c.font.size = Pt(6.8)
            if col_idx == 0:
                r_c.font.bold = True
            if "DEVASTATING" in val:
                r_c.font.bold = True

    p_ammo_note = doc.add_paragraph()
    p_ammo_note.paragraph_format.space_before = Pt(2)
    p_ammo_note.paragraph_format.space_after = Pt(0)
    p_ammo_note.add_run("Anti-Corruption Consecration Rule: ").font.bold = True
    p_ammo_note.add_run(
        "Silver ammunition is the realm's only weapon capable of piercing supernatural corruption vitality. The 4× multiplier instantly neutralizes corrupt CustomNPCs and undead abominations, while the 2× multiplier cuts through vampire/undead player regeneration (origins-rustic)."
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 2: GEOPOLITICAL SYMBIOSIS & CONTINENTAL MINING
    # =========================================================================
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(0)
    h2.paragraph_format.space_after = Pt(2)
    r = h2.add_run("2. The Geopolitical Symbiosis: Two Factions, One War")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p = doc.add_paragraph()
    p.add_run("The introduction of firearms is anchored in a two-chapter narrative driving roleplay conflict and cooperation between ")
    p.add_run("P.U.L.A SRL (The Factory Faction)").font.bold = True
    p.add_run(" and ")
    p.add_run("Straja (The Realm's Gendarmerie)").font.bold = True
    p.add_run(":")

    # Large Centered Diagram 2 (6.8 inches wide!)
    add_centered_diagram(
        doc,
        "figures/diagram2_chapters.png",
        width_in_inches=6.8,
        caption_text="Figure 2: The Two-Chapter Geopolitical & Technological Arc",
        space_before=3,
        space_after=3
    )

    balance_pts = [
        ("P.U.L.A SRL (Industrial Mastery)", "Controls rotational power, precision mechanisms, barrel-boring benches, chemical refineries, and mechanical crafters. They can manufacture arms and civilian goods, but lack raw sulfur."),
        ("Straja (Resource & Legal Authority)", "Controls the continental expeditionary garrison and the sole industrial deposits of Iron, Coal, Sulfur, and Dripstone. Straja lacks gun machinery, but holds the monopoly on the chemical oxidizers and accelerants."),
        ("The Equilibrium", "Neither faction can dominate alone. P.U.L.A SRL cannot produce high-grade military ammunition or chemical goods without Straja's sulfur; Straja cannot field an armed vanguard without P.U.L.A SRL's finished arms.")
    ]
    for b_title, b_desc in balance_pts:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(1.5)
        run_b = bp.add_run(b_title + ": ")
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_BRONZE
        bp.add_run(b_desc)

    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(5)
    h4.paragraph_format.space_after = Pt(2)
    r = h4.add_run("3. Straja's Continental Mine (custom_mines)")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p = doc.add_paragraph()
    p.add_run("Under our server's custom mine engine (")
    p.add_run("custom_mines").font.italic = True
    p.add_run("), Straja's continental outpost will feature a dedicated, scheduled-reset geological cavern. Karst limestone stalactites naturally accumulate nitrate salts; crushing and bulk washing dripstone yields pure ")
    p.add_run("Saltpeter Crystals (kubejs:saltpeter)").font.bold = True
    p.add_run(".")

    # Large Centered Diagram 4 (6.8 inches wide!)
    add_centered_diagram(
        doc,
        "figures/diagram4_mine.png",
        width_in_inches=6.8,
        caption_text="Figure 3: Straja Mine Resource Matrix & Refining Flow",
        space_before=3,
        space_after=0
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 3: FACTORIO-STYLE INDUSTRIAL ECONOMY (MILITARY & CIVILIAN COMMODITIES)
    # =========================================================================
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(0)
    h3.paragraph_format.space_after = Pt(2)
    r = h3.add_run("4. Factorio-Style Industrial Economy: Military & Civilian Production")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(11.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.add_run("Inspired by ")
    p.add_run("Factorio").font.bold = True
    p.add_run(" production scaling, P.U.L.A SRL's manufacturing model rewards engineering complexity: handcrafting serves as a punishing last resort; kinetic lines deliver standard yields; and thermodynamic complexes (sequenced assembly, heated mixing, acid fluid piping) unlock massive output surges and superior quality tiers.")

    # Large Centered Diagram 3 (6.8 inches wide!)
    add_centered_diagram(
        doc,
        "figures/diagram3_tiers.png",
        width_in_inches=6.8,
        caption_text="Figure 4: Factorio-Style Create Tiering: Effort vs. Yield & Quality Scaling",
        space_before=2,
        space_after=2
    )

    # Subheading A: Military Powder Matrix
    sub_a = doc.add_paragraph()
    sub_a.paragraph_format.space_before = Pt(2)
    sub_a.paragraph_format.space_after = Pt(1)
    r_a = sub_a.add_run("A. Military Gunpowder Production Matrix")
    r_a.font.name = "Segoe UI Semibold"
    r_a.font.size = Pt(9)
    r_a.font.bold = True
    r_a.font.color.rgb = COLOR_BRONZE

    table_tiers = doc.add_table(rows=4, cols=4)
    table_tiers.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_tiers)
    headers = ["Tier & Method", "Create Machinery", "Input Ingredients", "Batch Output & Grade"]
    for i, title in enumerate(headers):
        cell = table_tiers.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
        p_h = cell.paragraphs[0]
        r_h = p_h.add_run(title)
        r_h.font.bold = True
        r_h.font.size = Pt(7.5)
        r_h.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    tier_data = [
        ("Tier 1: Desperation (Bench)", "Hand Pestle / 3x3 Grid", "4 Ash/Bone Meal + 4 Charcoal + 1 Water", "1x Crude Powder (Smoky, High Misfire)"),
        ("Tier 2: Mechanical Mill (Island)", "Basin Mixer + Smoker + Press", "Dripstone Dust + Charcoal + Water", "4x Standard Gunpowder (Clean Burn)"),
        ("Tier 3: Chemical Complex (Cont.)", "Heated Basin + Blaze Burner + Spout", "Saltpeter + Charcoal + butchery:sulfur", "16x Royal Military Powder (+10% Velocity)")
    ]
    for row_idx, data in enumerate(tier_data, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_tiers.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=20, bottom=20, left=60, right=60)
            p_c = cell.paragraphs[0]
            r_c = p_c.add_run(val)
            r_c.font.size = Pt(7)
            if col_idx == 0:
                r_c.font.bold = True

    p_silver = doc.add_paragraph()
    p_silver.paragraph_format.space_before = Pt(2)
    p_silver.paragraph_format.space_after = Pt(1)
    p_silver.add_run("Silver Cartridge Munitions: ").font.bold = True
    p_silver.add_run(
        "Silver rounds substitute lead cores with pure silver (#c:silver_ingots / #c:silver_nuggets): Tier 1 casts 1 round manually; Tier 2 assembles 4 rounds via Mechanical Crafters; Tier 3 leverages molten silver fluid casting + Royal Powder to yield 16 Consecrated Silver Cartridges per cycle."
    )

    # Subheading B: Civilian Commodities (3-Tier Matrix)
    sub_b = doc.add_paragraph()
    sub_b.paragraph_format.space_before = Pt(3)
    sub_b.paragraph_format.space_after = Pt(1)
    r_b = sub_b.add_run("B. P.U.L.A SRL Civilian Commodity Lines (3-Tier Production Matrix)")
    r_b.font.name = "Segoe UI Semibold"
    r_b.font.size = Pt(9)
    r_b.font.bold = True
    r_b.font.color.rgb = COLOR_BRONZE

    table_civ = doc.add_table(rows=6, cols=4)
    table_civ.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_civ)
    civ_headers = ["Civilian Commodity Line", "Tier 1: Hand / Existing Craft", "Tier 2: Kinetic Create Line", "Tier 3: Thermodynamic Complex (Sulfur)"]
    for i, title in enumerate(civ_headers):
        cell = table_civ.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=25, bottom=25, left=50, right=50)
        p_h = cell.paragraphs[0]
        r_h = p_h.add_run(title)
        r_h.font.bold = True
        r_h.font.size = Pt(7.5)
        r_h.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    civ_data = [
        ("Viticulture Cask Strips (Vinery)", "Paper + Sulfur Dust in 3x3 Grid -> 1x Crude Wick (burns sooty)", "Spout (Molten Sulfur) on Paper Belt -> 4x Fumigation Strips", "Sequenced Assembly (Heated Dip + Herb Press) -> 16x Royal Strips (+1 Vintage Wine Grade)"),
        ("Super-Fertilizer (Farmer's Delight)", "Vanilla Bone Meal / organic_compost (slow natural rot) -> 1x Yield", "Crushing Wheels + Basin Mixer (Bone Meal + Compost) -> 4x Rich Compost", "Heated Basin (Bone + bottle_of_sulfuric_acid + Sulfur) -> 16x Miracle Fertilizer (3x Tick Surge)"),
        ("Medicated Sulfur Soap (Apothecary)", "butchery:animal_fat + Wood Ash in 3x3 Grid -> 1x Crude Lard Bar", "Basin Mixer + Mechanical Press (Animal Fat + Lye Water) -> 4x Saponified Soap", "Heated Basin + Blaze Burner (Fat + Lye + butchery:sulfur) -> 16x Antiseptic Soap (Purges Corruption)"),
        ("Friction Matches (Tobacconist)", "Vanilla Flint & Steel / Torches (unstackable tool, slow in RP) -> 1x Tool", "Mechanical Saw (Wood Splints) + Dip Basin -> 16x Sulfur Matchsticks", "Sequenced Assembly (Splints + Heated Niter-Sulfur Dip + Box) -> 64x Safety Matchboxes (Weatherproof)"),
        ("Vitriol Leather Tanning (Epic Knights)", "butchery:skin_rack manual scraping with knife over hours -> 1x Leather", "Basin Washer (Water + Bark) + Roller Press -> 4x Cured Leather", "Heated Basin with bottle_of_sulfuric_acid + Press -> 8x Vitriol Heavy Leather (+50% Armor Dura)")
    ]
    for row_idx, data in enumerate(civ_data, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_civ.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=18, bottom=18, left=50, right=50)
            p_c = cell.paragraphs[0]
            r_c = p_c.add_run(val)
            r_c.font.size = Pt(6.8)
            if col_idx == 0:
                r_c.font.bold = True

    p_eq = doc.add_paragraph()
    p_eq.paragraph_format.space_before = Pt(3)
    p_eq.paragraph_format.space_after = Pt(0)
    p_eq.add_run("Strategic Economic Equilibrium: ").font.bold = True
    p_eq.add_run(
        "By grounding Tier 1 in existing manual recipes, solo players and small homesteads retain access to baseline goods. However, P.U.L.A SRL's Tier 2 and Tier 3 Create lines dominate server commerce through 400%–1600% yield surges and exclusive premium quality grades (Vintage wine, miracle fertilizer, antiseptic soap, safety matches, vitriol armor)."
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 4: SERIALIZATION, PERFORMANCE & ROADMAP
    # =========================================================================
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(0)
    h5.paragraph_format.space_after = Pt(2)
    r = h5.add_run("5. Provenance, Serialization & The Law")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(11.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p = doc.add_paragraph()
    p.add_run("Firearms in Rustic Craft II are heavily regulated military goods. Built ")
    p.add_run("100% self-contained in KubeJS").font.bold = True
    p.add_run(", this system gives players tangible roleplay documents and authentic law enforcement mechanics without waiting on external mod updates.")

    # Large Centered Diagram 5 (6.8 inches wide!)
    add_centered_diagram(
        doc,
        "figures/diagram5_serialization.png",
        width_in_inches=6.8,
        caption_text="Figure 5: Firearm Provenance, Proofing & Black Market State Machine",
        space_before=2,
        space_after=2
    )

    serial_pts = [
        ("Fresh from Forge (UNPROOFED)", "Guns lack acceptance marks. Carrying is a severe crime under Straja law (Lore: §c⚠ NEÎNREGISTRAT)."),
        ("Proofing Ritual (PROOFED)", "Factory & Straja hold Royal Proof Stamp (kubejs:proof_stamp). Stamping in Anvil/Deployer assigns serial (RC-15-0142) and lore (§a✔ POANSONAT)."),
        ("Gun Permit (Permis de Port-Armă)", "A signed in-game book or sealed Envelope recording owner identity, firearm serial, issuing officer, and seal."),
        ("Black Market & Inspections", "Guns with defaced serials (§4[SERIE PILITĂ / DEFACED]) or unproofed arms are subject to immediate seizure and carrier arrest.")
    ]
    for b_title, b_desc in serial_pts:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(1)
        run_b = bp.add_run(b_title + ": ")
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_NAVY
        bp.add_run(b_desc)

    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(3)
    h6.paragraph_format.space_after = Pt(1)
    r = h6.add_run("6. Server Performance Guarantees & Refactors")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    perf_pts = [
        ("flintlock_carry_limits.js Optimization", "Eliminated 20 Hz tick loop over 45+ slots. Native pickup blocking remains instantaneous on ItemEvents.canPickUp. Periodic safety scans throttled to 1 Hz staggered across player IDs, slashing CPU overhead by 95%."),
        ("furniture_coffer_gun_restrictions.js Refactor", "Re-anchored coffer gun purges to trigger only on inventory open/close events rather than continuous background polling.")
    ]
    for b_title, b_desc in perf_pts:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(1)
        run_b = bp.add_run(b_title + ": ")
        run_b.font.bold = True
        run_b.font.color.rgb = COLOR_BRONZE
        bp.add_run(b_desc)

    h7 = doc.add_paragraph()
    h7.paragraph_format.space_before = Pt(3)
    h7.paragraph_format.space_after = Pt(1)
    r = h7.add_run("7. Phased Implementation Roadmap")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    table_plan = doc.add_table(rows=5, cols=3)
    table_plan.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_plan)
    p_headers = ["Phase", "Milestone Deliverables", "Responsible Faction"]
    for i, title in enumerate(p_headers):
        cell = table_plan.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=40, bottom=40, left=70, right=70)
        p_h = cell.paragraphs[0]
        r_h = p_h.add_run(title)
        r_h.font.bold = True
        r_h.font.size = Pt(8)
        r_h.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    plan_data = [
        ("Phase 1: Performance & Items", "Script optimization (tick reduction) & kubejs:saltpeter item registration", "Technical Admin"),
        ("Phase 2: Tiered Recipes & Ammo", "Tier 1-3 Powder, Civilian Lines & Silver Anti-Corruption Script (4x/2x dmg)", "Technical Admin + Factory Leads"),
        ("Phase 3: Legal & Proofing", "Proof Stamp mechanic & Gun Permit book templates", "Technical Admin + Straja Leads"),
        ("Phase 4: Mine Integration", "Straja Continental Mine configuration (straja_continental_mine.json)", "Storytellers + Technical Admin")
    ]
    for row_idx, data in enumerate(plan_data, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_plan.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=30, bottom=30, left=70, right=70)
            p_c = cell.paragraphs[0]
            r_c = p_c.add_run(val)
            r_c.font.size = Pt(7.5)
            if col_idx == 0:
                r_c.font.bold = True

    callout_items = [
        ("Storytellers", "Approve Chapter 1 -> Chapter 2 narrative transition and continental mine lore."),
        ("P.U.L.A SRL Leads", "Review Create recipe requirements and civilian production line setup."),
        ("Straja Leadership", "Confirm proofing law enforcement protocol and permit issuing authority.")
    ]
    add_callout_box(doc, "Admin Team Action Items & Consensus Call", callout_items, space_before=4)

    # Append Technical Appendix (Starting on Page 5)
    add_recipes_appendix(doc)

    doc.save(docx_path)
    print(f"Successfully generated Word document: {docx_path}")

def add_recipes_appendix(doc):
    doc.add_page_break()
    
    # Title
    h_app = doc.add_paragraph()
    h_app.paragraph_format.space_before = Pt(0)
    h_app.paragraph_format.space_after = Pt(2)
    r = h_app.add_run("8. Technical Appendix: Complete Tiered Crafting Recipes")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(4)
    p_intro.add_run("This engineering appendix specifies the complete, production-ready recipe routes for ").font.color.rgb = COLOR_CHARCOAL
    p_intro.add_run("KubeJS").font.bold = True
    p_intro.add_run(" and ")
    p_intro.add_run("Create 6").font.bold = True
    p_intro.add_run(" on Minecraft 1.21.1 NeoForge. It details all inputs, kinetic machinery, thermal states, and outputs across the realm's military munitions, ammunition types, civilian commodities, and legal proofing tooling.")

    # 8.1 Gunpowder & Nitrate Chemistry
    h_81 = doc.add_paragraph()
    h_81.paragraph_format.space_before = Pt(4)
    h_81.paragraph_format.space_after = Pt(2)
    r = h_81.add_run("8.1 Gunpowder & Nitrate Refining Chains")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    table_81 = doc.add_table(rows=6, cols=4)
    table_81.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_81)
    headers_81 = ["Process / Tier", "Recipe Type & Machine", "Input Ingredients & Fluids", "Batch Output & Parameters"]
    for i, title in enumerate(headers_81):
        cell = table_81.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=25, bottom=25, left=50, right=50)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(7.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_81 = [
        ("Dripstone Crushing", "create:crushing (Crushing Wheels)", "1x minecraft:dripstone_block or pointed_dripstone", "1-2x kubejs:crushed_dripstone (128 RPM, 100 ticks)"),
        ("Saltpeter Washing", "create:splashing (Bulk Washing / Fan)", "1x kubejs:crushed_dripstone + Water stream", "1x kubejs:saltpeter (100%), +1 bonus crystal (50%)"),
        ("Tier 1: Desperation Powder", "minecraft:crafting_shapeless (3x3 Grid)", "4x bone_meal (or ash) + 4x charcoal + 1x water_bottle", "1x kubejs:crude_gunpowder_cake (Hand-ground)"),
        ("Tier 2: Kinetic Powder Line", "create:mixing + compacting (Basin + Press)", "2x kubejs:saltpeter + 2x charcoal + 250 mB Water", "4x tacz_c:gunpowder_charge (Unheated Basin, 64 RPM)"),
        ("Tier 3: Sulfur Complex", "create:mixing + compacting (Heated Basin)", "4x kubejs:saltpeter + 2x charcoal + 1x butchery:sulfur + 500 mB Water", "16x tacz_c:gunpowder_charge (Blaze Burner Heated, 128 RPM)")
    ]
    for row_idx, data in enumerate(data_81, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_81.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=18, bottom=18, left=50, right=50)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(6.8)
            if col_idx == 0:
                r.font.bold = True

    # 8.2 Ammunition Arsenal Production
    h_82 = doc.add_paragraph()
    h_82.paragraph_format.space_before = Pt(6)
    h_82.paragraph_format.space_after = Pt(2)
    r = h_82.add_run("8.2 Ammunition Arsenal & Silver Munitions")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    table_82 = doc.add_table(rows=9, cols=4)
    table_82.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_82)
    headers_82 = ["Munition & Tier", "Assembly Method", "Input Ingredients & Catalysts", "Output & Ballistics"]
    for i, title in enumerate(headers_82):
        cell = table_82.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=25, bottom=25, left=50, right=50)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(7.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_82 = [
        ("16.5mm Lead Ball (Tier 1)", "minecraft:crafting_shapeless", "1x iron_ingot + 1x paper + 1x crude_gunpowder_cake", "1x tacz:ammo (qkl:16mm, 40-55 dmg)"),
        ("16.5mm Lead Ball (Tier 2)", "create:mechanical_crafting (3x3 Crafter)", "4x large_bullet_core + 4x wad + 1x gunpowder_charge", "4x tacz:ammo (qkl:16mm) (Pattern: CWC/WGW/CWC)"),
        ("16.5mm Lead Ball (Tier 3)", "create:sequenced_assembly", "Iron/Lead Sheet -> Wad -> Spout (100mB Sulfur) -> Royal Charge -> Press", "16x tacz:ammo (qkl:16mm, +10% Velocity Surge)"),
        ("Consecrated Silver (Tier 1)", "minecraft:crafting_shaped (3x3 Grid)", "1x Silver Ingot (or 4x Nuggets) + 1x wad + 1x crude_powder", "1x Consecrated Silver Ball (SilverAmmo: true)"),
        ("Consecrated Silver (Tier 2)", "create:mechanical_crafting (3x3 Crafter)", "4x Silver Cores (#c:silver_ingots) + 4x wads + 1x gunpowder_charge", "4x Consecrated Silver Cartridges (4x vs Undead, 2x vs Vampires)"),
        ("Consecrated Silver (Tier 3)", "create:sequenced_assembly", "Casing -> Spout (100mB Molten Silver) -> Saltpeter Wad -> Royal Charge -> Press", "16x Consecrated Silver Cartridges (400% Output Boost)"),
        ("16.5mm Canister Scattershot", "create:mechanical_crafting (3x3 Crafter)", "8x iron_nugget + 1x paper sabot + 1x gunpowder_charge", "4x Canister Scattershot (8 pellets, 8-10 dmg each, Wide Cone)"),
        ("16.5mm Incendiary Sulfur Ball", "create:mechanical_crafting (3x3 Crafter)", "4x iron cores + 4x butchery:sulfur + 1x royal_charge", "4x Incendiary Cartridges (35 dmg + 8s burn + light)")
    ]
    for row_idx, data in enumerate(data_82, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_82.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=18, bottom=18, left=50, right=50)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(6.8)
            if col_idx == 0:
                r.font.bold = True
            if "Consecrated Silver" in val:
                r.font.bold = True

    # 8.3 Civilian Commodities Tiered Specification
    h_83 = doc.add_paragraph()
    h_83.paragraph_format.space_before = Pt(6)
    h_83.paragraph_format.space_after = Pt(2)
    r = h_83.add_run("8.3 Civilian Commodity Lines (Full 3-Tier Chains)")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    table_83 = doc.add_table(rows=16, cols=4)
    table_83.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_83)
    headers_83 = ["Commodity & Tier", "Processing Method", "Input Ingredients & Catalysts", "Output & Economic Property"]
    for i, title in enumerate(headers_83):
        cell = table_83.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=25, bottom=25, left=50, right=50)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(7.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_83 = [
        # Viticulture
        ("Cask Strips (Tier 1: Hand)", "minecraft:crafting_shapeless", "1x minecraft:paper + 1x butchery:sulfur", "1x Crude Fumigation Strip (burns sooty, baseline)"),
        ("Cask Strips (Tier 2: Kinetic)", "create:filling (Spout)", "1x minecraft:paper + 100 mB Molten Sulfur", "4x Clean Fumigation Strips (prevents barrel souring)"),
        ("Cask Strips (Tier 3: Complex)", "create:sequenced_assembly", "Paper -> Spout (Molten Sulfur) -> Deployer (Lavender/Herbs) -> Press", "16x Royal Cask Strips (+1 Vintage Wine Grade in Vinery)"),
        # Super-Fertilizer
        ("Fertilizer (Tier 1: Hand)", "farmersdelight:organic_compost", "2x Dirt + 1x Bone Meal + 2x Straw + 4x Organic Scraps", "1x Organic Compost (slow natural sun decomposition)"),
        ("Fertilizer (Tier 2: Kinetic)", "create:crushing + create:mixing", "Crushed Bones (6x Bone Meal) + Compost + 250 mB Water", "4x Rich Organic Compost (instant Rich Soil conversion)"),
        ("Fertilizer (Tier 3: Complex)", "create:mixing (Heated Basin)", "4x Bone Meal + 1x bottle_of_sulfuric_acid + 1x Sulfur + 500 mB Water", "16x Super-Phosphate Miracle Fertilizer (3x Tick Speed Surge)"),
        # Soap
        ("Soap (Tier 1: Hand)", "minecraft:crafting_shapeless", "1x butchery:animal_fat + 1x Wood Ash + 1x water_bottle", "1x Crude Lard Bar (removes vanilla poison only)"),
        ("Soap (Tier 2: Kinetic)", "create:mixing + create:compacting", "2x butchery:animal_fat + 250 mB Water + 1x Wood Ash", "4x Saponified Tallow Soap (cleanses debuffs, restores stamina)"),
        ("Soap (Tier 3: Complex)", "create:mixing (Heated Basin) + Press", "4x butchery:animal_fat + 1x butchery:sulfur + 1x Ash + 500 mB Water", "16x Medicated Sulfur Soap (Purges Corruption & Disease)"),
        # Matches
        ("Matches (Tier 1: Hand)", "minecraft:crafting_shaped", "1x iron_ingot + 1x flint", "1x Flint and Steel Tool (unstackable, slow in roleplay)"),
        ("Matches (Tier 2: Kinetic)", "create:cutting + create:filling", "Mechanical Saw (Planks -> 16x Splints) + Spout (Sulfur Dip)", "16x Sulfur Matchsticks (stackable to 64, instant fire)"),
        ("Matches (Tier 3: Complex)", "create:sequenced_assembly", "Splints -> Heated Dip (Niter + Sulfur) -> Press -> Cardboard Box", "64x Safety Matchboxes (4x Boxes of 16, Weatherproof)"),
        # Leather
        ("Leather (Tier 1: Hand)", "butchery:skin_rack manual", "Raw animal skin on rack + skinning knife scraping over hours", "1x Rough Vanilla Leather (brittle, standard gear)"),
        ("Leather (Tier 2: Kinetic)", "create:splashing + create:compacting", "Bulk Washing raw skins with Water + Roller Press", "4x Cured Leather (durable, standard gambesons & tack)"),
        ("Leather (Tier 3: Complex)", "create:mixing (Heated Basin) + Press", "Raw Animal Skins + 250 mB Sulfuric Acid (vitriol) -> Roller Press", "8x Vitriol Heavy Leather (+50% Armor Dura, heavy cuirasses)")
    ]
    for row_idx, data in enumerate(data_83, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_83.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=16, bottom=16, left=45, right=45)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(6.5)
            if col_idx == 0:
                r.font.bold = True

    # 8.4 Legal & Provenance Tooling
    h_84 = doc.add_paragraph()
    h_84.paragraph_format.space_before = Pt(6)
    h_84.paragraph_format.space_after = Pt(2)
    r = h_84.add_run("8.4 Firearm Mechanism, Legal Proofing & Black Market Tooling")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    table_84 = doc.add_table(rows=5, cols=4)
    table_84.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_84)
    headers_84 = ["Artifact / Mechanic", "Execution Tool", "Input Requirements", "Resulting Item / State Change"]
    for i, title in enumerate(headers_84):
        cell = table_84.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=25, bottom=25, left=50, right=50)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(7.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_84 = [
        ("Royal Proof Stamp", "Storyteller / Master Anvil", "4x create:brass_sheet + 2x kubejs:tempered_gun_steel + 1x Royal Seal", "1x kubejs:proof_stamp (Unbreakable guild tool)"),
        ("Proofing Ritual", "Anvil or create:deployer", "Unproofed Gun (Lore: NEÎNREGISTRAT) + Royal Proof Stamp", "PROOFED Gun (Lore: ✔ POANSONAT: #RC-15-XXXX + NBT Serial)"),
        ("Gun Permit Issuance", "Scribe Lectern / Signed Book", "Blank Permit Template + Sealed Envelope + Officer Signature", "Official Permit Book recording Player UUID & Serial"),
        ("Black Market Defacing", "minecraft:grindstone", "Proofed Firearm scraped on Grindstone", "DEFACED Gun (Lore: [SERIE PILITĂ / DEFACED], Illegal Contraband)")
    ]
    for row_idx, data in enumerate(data_84, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_84.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=18, bottom=18, left=50, right=50)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(6.8)
            if col_idx == 0:
                r.font.bold = True

    # 8.5 Ballistics, Inaccuracy & Create Precision Rifling
    h_85 = doc.add_paragraph()
    h_85.paragraph_format.space_before = Pt(5)
    h_85.paragraph_format.space_after = Pt(2)
    r = h_85.add_run("8.5 Historical Musket Ballistics, Lock Time & Create Precision Rifling")
    r.font.name = "Segoe UI Semibold"
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY

    p_85 = doc.add_paragraph()
    p_85.paragraph_format.space_after = Pt(2)
    p_85.add_run("To ensure firearms obey 18th-century physics rather than modern hitscan lasers, ballistics are calibrated across two mechanical pillars: (1) ")
    p_85.add_run("140ms Lock-Time Delay (qkl:delayshoot_gun_logic)").font.bold = True
    p_85.add_run(", modeling flint-strike, pan flash, and touchhole ignition during which shooters must steady their aim; and (2) ")
    p_85.add_run("Conical Smoothbore Dispersion (aim: 1.85°, sneak: 1.0°)").font.bold = True
    p_85.add_run(", providing guaranteed torso hits at 0–30m while dispersing past 60m to mandate line volleys. For long-range sharpshooting, P.U.L.A SRL can precision-bore spiral rifling grooves using Create machinery.")

    table_85 = doc.add_table(rows=8, cols=4)
    table_85.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_85)
    headers_85 = ["Ballistic Parameter", "FK15 Smoothbore Volley Musket", "FK15-R Create Rifled Musket", "FK15P Smoothbore Pistol"]
    for i, title in enumerate(headers_85):
        cell = table_85.cell(0, i)
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=18, bottom=18, left=45, right=45)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(7.2)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_85 = [
        ("Tactical Role & Doctrine", "Mainline Volley Fire (cheap, fast)", "Precision Skirmisher / Sharpshooter", "Sidearm / Close-Quarters Defense"),
        ("Effective Combat Range", "0–30m Lethal | 30–60m Volley | 60m+ Inaccurate", "0–80m Pinpoint | 100m+ Extended Snipe", "5–15m Deadly Point-Blank | 20m+ High Spread"),
        ("ADS Spread (aim inaccuracy)", "1.85° (tight at 20m, 2.6m cone at 80m)", "0.35° (sub-block grouping at 80m)", "2.40° (wide defensive spread)"),
        ("Kneeling Spread (sneak)", "1.00° (rests heavy 5kg iron barrel)", "0.20° (benchrest match precision)", "2.00° (crouch stabilization)"),
        ("Movement Penalty (move)", "7.50° (running/walking ruin aim)", "6.50° (severe movement penalty)", "5.50° (mobile one-handed hip fire)"),
        ("Mechanical Lock Time", "140 ms (delayshoot_gun_logic)", "140 ms (delayshoot_gun_logic)", "160 ms (flintlock pocket lock)"),
        ("Velocity & Ballistic Drop", "Speed: 135 | Gravity: 0.031 (drop at 40m+)", "Speed: 175 | Gravity: 0.016 (flat trajectory)", "Speed: 95 | Gravity: 0.038 (steep drop)")
    ]
    for row_idx, data in enumerate(data_85, start=1):
        bg = HEX_LIGHT_BG if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data):
            cell = table_85.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=14, bottom=14, left=45, right=45)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(6.5)
            if col_idx == 0:
                r.font.bold = True

def convert_to_pdf(docx_path, pdf_path):
    print(f"Converting {docx_path} to PDF via Word COM...")
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)
    
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(abs_docx)
        doc.SaveAs(abs_pdf, FileFormat=17) # wdFormatPDF
        doc.Close()
        print(f"Successfully generated PDF: {abs_pdf}")
    finally:
        word.Quit()

if __name__ == "__main__":
    docx_file = "THE_BRASS_AGE_EXPANSION_PROPOSAL.docx"
    pdf_file = "THE_BRASS_AGE_EXPANSION_PROPOSAL.pdf"
    build_docx(docx_file)
    convert_to_pdf(docx_file, pdf_file)
    reader = pypdf.PdfReader(pdf_file)
    print(f"=== RESULT: Total PDF Pages = {len(reader.pages)} ===")
