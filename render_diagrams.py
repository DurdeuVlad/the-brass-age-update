import os
from playwright.sync_api import sync_playwright

DIAGRAMS = {
    "diagram1_combat": """
flowchart LR
    A["Line Volley Fired<br/><i>(Devastating Impact: 40-55 Dmg)</i>"] --> B{"Target Eliminated?"}
    B -- "Yes" --> C["Tactical Victory"]
    B -- "No / Missed" --> D["20-Second Reload Animation Lock"]
    D --> E["Cavalry & Pikemen Close the Distance"]
    E --> F["Brutal Melee Engagement"]
    
    style A fill:#e2e8f0,stroke:#334155,stroke-width:2px,color:#0f172a
    style B fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style C fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d
    style D fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    style E fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#7c2d12
    style F fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a
""",
    "diagram2_chapters": """
flowchart LR
    subgraph Chapter1 ["Chapter 1: The Island Corruption War"]
        direction TB
        C1_A["Corruption ravages the Island"] --> C1_B["P.U.L.A SRL develops initial Flintlocks"]
        C1_B --> C1_C["Ammunition is scarce, primitive & hand-rationed"]
        C1_C --> C1_D["Muskets turn the tide; Corruption beaten back"]
    end

    subgraph Chapter2 ["Chapter 2: The Continental Vanguard"]
        direction TB
        C2_A["Mastermind flees to the Continent"] --> C2_B["Straja establishes Forward Continental Garrison"]
        C2_B --> C2_C["Straja secures the Great Continental Mine<br/><i>(Iron, Coal, Sulfur, Dripstone)</i>"]
        C2_D["P.U.L.A SRL has Tooling, but NO Sulfur"] <--> C2_E["Straja has Sulfur & Nitrates, but NO Tooling"]
        C2_D & C2_E --> C2_F["Bilateral Trade Treaty & Industrial Licensing"]
    end

    Chapter1 ==>|"Victory on the Island"| Chapter2

    style Chapter1 fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style Chapter2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
""",
    "diagram3_tiers": """
flowchart LR
    subgraph T1 ["TIER 1: Manual Handcrafting (Existing & Bench)"]
        direction TB
        T1_A["Zero Kinetics / Hand Labor"]
        T1_B["Yield: Minimal (1x)<br/>Quality: Crude / Baseline"]
        T1_A --> T1_B
    end

    subgraph T2 ["TIER 2: Kinetic Automation (Create Line)"]
        direction TB
        T2_A["Basin Mixer + Saws + Press"]
        T2_B["Yield: Standard (4x)<br/>Quality: Industrial Grade"]
        T2_A --> T2_B
    end

    subgraph T3 ["TIER 3: Thermodynamic Complex (P.U.L.A SRL)"]
        direction TB
        T3_A["Heated Basins + Straja Sulfur + Fluids"]
        T3_B["Yield: 400% - 1600% Surge<br/>Quality: Royal & Miracle Grade"]
        T3_A --> T3_B
    end

    T1 ==>|"Add Mechanical Power"| T2
    T2 ==>|"Add Heat, Fluids & Sulfur"| T3

    style T1 fill:#fff7ed,stroke:#c2410c,stroke-width:2px
    style T2 fill:#f0f9ff,stroke:#0284c7,stroke-width:2px
    style T3 fill:#fefce8,stroke:#ca8a04,stroke-width:2px
""",
    "diagram4_mine": """
flowchart LR
    subgraph MineVeins ["Straja Continental Mining Zone (custom_mines)"]
        V1["minecraft:iron_ore<br/><i>(Barrels, Screws, Hardware)</i>"]
        V2["minecraft:coal_ore<br/><i>(Fuel & Charcoal)</i>"]
        V3["butchery:sulfur_ore<br/><i>(The Accelerant)</i>"]
        V4["minecraft:dripstone_block<br/><i>(Mineral Saltpeter)</i>"]
        V5["minecraft:pointed_dripstone<br/><i>(Stalactite Niter)</i>"]
    end

    MineVeins --> WashChain["Create Crushing & Washing Chain"]
    WashChain --> Refined["Refined Military Stockpiles<br/><i>(Saltpeter, Sulfur, Steel)</i>"]

    style MineVeins fill:#f8fafc,stroke:#475569,stroke-width:2px
    style WashChain fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style Refined fill:#ecfdf5,stroke:#059669,stroke-width:2px
""",
    "diagram5_serialization": """
flowchart LR
    Raw["Raw Firearm Crafted<br/><i>(Bench / Crafter)</i>"] --> Unproofed["UNPROOFED FIREARM<br/><i>Tooltip: ⚠ NEÎNREGISTRAT</i><br/><b>Illegal Contraband</b>"]
    
    Unproofed -->|"Royal Proof Stamp in Anvil / Deployer"| Proofed["PROOFED FIREARM<br/><i>Tooltip: ✔ POANSONAT: #RC-15-084</i><br/><b>Signed Permit Required</b>"]
    
    Proofed -->|"Scraped on Grindstone"| Defaced["DEFACED SERIAL<br/><i>Tooltip: [SERIE PILITĂ]</i><br/><b>Immediate Arrest</b>"]
    
    Unproofed -->|"Smuggled"| BlackMarket["Black Market Trade"]
    Defaced -->|"Underworld"| BlackMarket

    style Raw fill:#f1f5f9,stroke:#64748b,stroke-width:2px
    style Unproofed fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    style Proofed fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d
    style Defaced fill:#fef2f2,stroke:#991b1b,stroke-width:2px,color:#7f1d1d
    style BlackMarket fill:#f3f4f6,stroke:#374151,stroke-width:2px,color:#111827
"""
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {{
            margin: 0;
            padding: 30px;
            background: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: inline-block;
        }}
        .mermaid {{
            background: #ffffff;
        }}
        .mermaid text {{
            font-size: 20px !important;
            font-weight: 600 !important;
        }}
        .mermaid .nodeLabel {{
            font-size: 20px !important;
            font-weight: 600 !important;
            line-height: 1.3 !important;
        }}
        .mermaid .edgeLabel {{
            font-size: 18px !important;
            font-weight: bold !important;
            background-color: #ffffff !important;
            padding: 3px 6px !important;
        }}
        .mermaid .cluster-label span {{
            font-size: 22px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
        }}
    </style>
</head>
<body>
    <div class="mermaid">
        {diagram_code}
    </div>
    <script>
        mermaid.initialize({{
            startOnLoad: true,
            theme: 'neutral',
            themeVariables: {{
                fontSize: '20px',
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                primaryTextColor: '#0f172a',
                lineColor: '#334155'
            }},
            flowchart: {{ useMaxWidth: false, htmlLabels: true }}
        }});
    </script>
</body>
</html>
"""

def render_all():
    os.makedirs("figures", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(device_scale_factor=2) # 2x scale for crisp high-DPI rendering
        
        for name, code in DIAGRAMS.items():
            print(f"Rendering {name}...")
            html = HTML_TEMPLATE.format(diagram_code=code.strip())
            page.set_content(html)
            page.wait_for_selector(".mermaid svg", timeout=10000)
            # Find the bounding box of the rendered SVG
            svg = page.locator(".mermaid svg")
            out_path = os.path.join("figures", f"{name}.png")
            svg.screenshot(path=out_path)
            print(f"Saved {out_path}")
            
        browser.close()
    print("All diagrams successfully rendered!")

if __name__ == "__main__":
    render_all()
