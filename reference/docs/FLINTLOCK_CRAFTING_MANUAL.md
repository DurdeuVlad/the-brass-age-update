# Rustic Craft 2 — Flintlock Crafting Manual

This manual describes the Minecraft recipes installed in this instance: the **FK15P flintlock pistol**, **FK15 flintlock rifle**, and their shared **16.5mm ammunition**. It follows the actual KubeJS scripts and the installed Create / TaCZ: Creatified recipes.

The 20 custom recipes are hidden from EMI/JEI for everyone, including admins. They still work when you supply the correct ingredients. Keep this manual outside the public client download if players are meant to discover the patterns themselves.

## Reading the patterns

- Every pattern is viewed from the front of the crafting grid.
- A dot (`.`) means an empty slot.
- Each letter means **one item in that slot**, even when the same letter occurs several times.
- Letter meanings are local to each recipe; check its ingredient table.
- Every custom component recipe makes **one item**, including Gun Screws. The icon may show multiple screws, but one crafting operation produces one Gun Screws item.
- Components and guns use a normal **3×3 crafting table**, except the two blast-furnace steps.
- Ammunition uses a powered **3×3 grid of Create Mechanical Crafters**.
- Recipe ingredients are consumed, including precision mechanisms, screws, and ramrods.
- Custom components must be the named KubeJS items. Similar vanilla items do not substitute.

## Workshop and supplies

Prepare a crafting table, a blast furnace with fuel, and storage for intermediate parts. For the ammunition production chain, also prepare a smoker, Mechanical Mixer with Basin, Mechanical Press, Mechanical Saw, Deployer, and nine Mechanical Crafters. Supply rotational power to the Create machines. A mechanical assembly sequence can reuse the same machines; it does not require a dedicated machine for every step.

Create's normal material recipes remain visible in EMI/JEI:

| Material | Preparation |
|---|---|
| Iron Sheet | Press iron ingots with a Mechanical Press. |
| Brass Sheet | Press brass ingots. Create's heated Basin mixing recipe combines 1 copper ingot and 1 zinc ingot into 2 brass ingots. |
| Andesite Alloy | The installed crafting recipe combines 2 andesite and 2 iron nuggets (or zinc nuggets), diagonally alternating in a 2×2 grid, into 1 alloy. |
| Precision Mechanism | Begin with a Golden Sheet. Deploy a Cogwheel, then a Large Cogwheel, then an Iron Nugget; repeat that three-step sequence five times. One attempt consumes 5 of each applied ingredient. It can produce a byproduct, so budget spare materials until you have enough successful mechanisms. |
| Stripped Dark Oak Log | Strip dark oak logs with an axe. Planks and other wood species do not match these custom stock recipes. |
| Other supplies | Collect charcoal, iron nuggets, flint, leather, and a tripwire hook. Fuel and machine construction materials are additional costs. |

### Shopping lists for the guns

These totals fully expand the custom component recipes. They stop at ordinary Minecraft items and **finished Create materials**: the ingredients needed to manufacture sheets, alloys, precision mechanisms, and the tripwire hook are **not added again**. This avoids counting both a finished ingredient and its upstream materials. Ammunition, machines, and furnace fuel are excluded.

| Ingredient | One pistol | One rifle | One of each |
|---|---:|---:|---:|
| Iron Sheet | 76 | 125 | 201 |
| Charcoal | 56 | 96 | 152 |
| Andesite Alloy | 16 | 28 | 44 |
| Iron Nugget | 26 | 40 | 66 |
| Precision Mechanism | 3 | 6 | 9 |
| Flint | 2 | 2 | 4 |
| Brass Sheet | 9 | 24 | 33 |
| Tripwire Hook | 1 | 1 | 2 |
| Stripped Dark Oak Log | 6 | 18 | 24 |
| Leather | 3 | 5 | 8 |

### Intermediate production checklist

The quantities below are the **total number to make across the entire chain**, including parts consumed inside other parts. Do not add them to the shopping list as extra costs.

| Component | One pistol | One rifle |
|---|---:|---:|
| Gun Steel Blank | 14 | 24 |
| Tempered Gun Steel | 14 | 24 |
| Gun Screws | 13 | 20 |
| Brass Barrel Band | 1 | 6 |
| Steel Ramrod | 1 | 1 |
| Barrel Blank | 1 | 2 |
| Finished Pistol Barrel | 1 | 2 |
| Reinforced Long Barrel | 0 | 1 |
| Mainspring Blank | 1 | 1 |
| Tempered Mainspring | 1 | 1 |
| Flintlock Hammer | 1 | 1 |
| Brass Flash Pan | 1 | 1 |
| Trigger Assembly | 1 | 1 |
| Complete Flintlock Mechanism | 1 | 1 |
| Hardwood Stock Blank | 1 | 3 |
| Bound Pistol Stock | 1 | 1 |
| Reinforced Rifle Stock | 0 | 1 |

## Build a flintlock pistol

1. Make **14 Gun Steel Blanks** and blast them into **14 Tempered Gun Steel**.
2. Make **13 Gun Screws**, **1 Mainspring Blank**, and blast the spring into **1 Tempered Mainspring**.
3. Make **1 Flintlock Hammer**, **1 Brass Flash Pan**, and **1 Trigger Assembly**. Combine them into **1 Complete Flintlock Mechanism**.
4. Make **1 Barrel Blank** and finish it into **1 Finished Pistol Barrel**.
5. Make **1 Hardwood Stock Blank** and turn it into **1 Bound Pistol Stock**.
6. Make **1 Brass Barrel Band** and **1 Steel Ramrod**.
7. Use the final pistol pattern below. Reserve the additional screw, steel, and leather shown in that pattern instead of consuming all supplies early.

The pistol uses **3 Precision Mechanisms** total: one in its barrel, one in its trigger, and one in its lock.

## Build a flintlock rifle

1. Make **24 Gun Steel Blanks** and blast them into **24 Tempered Gun Steel**.
2. Make **20 Gun Screws** and **1 Tempered Mainspring**.
3. Make **1 Complete Flintlock Mechanism** through the hammer, flash-pan, and trigger recipes.
4. Make **2 Barrel Blanks**, then **2 Finished Pistol Barrels**. Combine these into **1 Reinforced Long Barrel**.
5. Make **3 Hardwood Stock Blanks**. Use one for a **Bound Pistol Stock**, then combine that stock with the other two blanks to make a **Reinforced Rifle Stock**.
6. Make **6 Brass Barrel Bands** total: two go into the long barrel, two into the rifle stock, and two into final assembly.
7. Make **1 Steel Ramrod**, then follow the final rifle pattern.

The rifle uses **6 Precision Mechanisms** total: two for the barrel sections, one for the long-barrel assembly, one for the trigger, one for the lock, and one in final assembly. A completed pistol is **not** an ingredient; only its barrel and stock components are reused by the rifle's production chain.

## Component recipe reference

Use these exact patterns. The custom texture beside each component helps identify it in your inventory.

### Gun Steel Blank

![Gun Steel Blank](../kubejs/assets/kubejs/textures/item/gun_steel_blank.png)

Item ID: `kubejs:gun_steel_blank`. Output: **1**.

**Crafting table:**

```text
I C I
C A C
I C I
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| I | Iron Sheet | 4 |
| C | Charcoal | 4 |
| A | Andesite Alloy | 1 |

### Tempered Gun Steel

![Tempered Gun Steel](../kubejs/assets/kubejs/textures/item/tempered_gun_steel.png)

Item ID: `kubejs:tempered_gun_steel`. Output: **1**.

**Blast furnace:** 1 Gun Steel Blank → 1 Tempered Gun Steel.

Supply fuel. Recipe duration: 400 game ticks (20 seconds at 20 TPS). This is a blasting recipe, not ordinary furnace smelting.

### Gun Screws

![Gun Screws](../kubejs/assets/kubejs/textures/item/gun_screws.png)

Item ID: `kubejs:gun_screws`. Output: **1**.

**Crafting table:**

```text
. N .
. S .
. N .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| N | Iron Nugget | 2 |
| S | Iron Sheet | 1 |

### Brass Barrel Band

![Brass Barrel Band](../kubejs/assets/kubejs/textures/item/barrel_band.png)

Item ID: `kubejs:barrel_band`. Output: **1**.

**Crafting table:**

```text
. B .
B . B
. S .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Brass Sheet | 3 |
| S | Gun Screws | 1 |

### Steel Ramrod

![Steel Ramrod](../kubejs/assets/kubejs/textures/item/ramrod.png)

Item ID: `kubejs:ramrod`. Output: **1**.

**Crafting table:**

```text
. . S
. I .
I . .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| S | Gun Screws | 1 |
| I | Tempered Gun Steel | 2 |

### Barrel Blank

![Barrel Blank](../kubejs/assets/kubejs/textures/item/barrel_blank.png)

Item ID: `kubejs:barrel_blank`. Output: **1**.

**Crafting table:**

```text
S I S
S . S
S I S
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| S | Tempered Gun Steel | 6 |
| I | Iron Sheet | 2 |

### Finished Pistol Barrel

![Finished Pistol Barrel](../kubejs/assets/kubejs/textures/item/pistol_barrel.png)

Item ID: `kubejs:pistol_barrel`. Output: **1**.

**Crafting table:**

```text
. B .
A S A
. C .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Barrel Blank | 1 |
| A | Andesite Alloy | 2 |
| S | Gun Screws | 1 |
| C | Precision Mechanism | 1 |

### Reinforced Long Barrel

![Reinforced Long Barrel](../kubejs/assets/kubejs/textures/item/rifle_barrel.png)

Item ID: `kubejs:rifle_barrel`. Output: **1**.

**Crafting table:**

```text
S B S
I P I
S B S
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| S | Tempered Gun Steel | 4 |
| B | Finished Pistol Barrel | 2 |
| I | Brass Barrel Band | 2 |
| P | Precision Mechanism | 1 |

### Mainspring Blank

![Mainspring Blank](../kubejs/assets/kubejs/textures/item/mainspring_blank.png)

Item ID: `kubejs:mainspring_blank`. Output: **1**.

**Crafting table:**

```text
. S S
S . .
. S S
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| S | Iron Sheet | 5 |

### Tempered Mainspring

![Tempered Mainspring](../kubejs/assets/kubejs/textures/item/tempered_mainspring.png)

Item ID: `kubejs:tempered_mainspring`. Output: **1**.

**Blast furnace:** 1 Mainspring Blank → 1 Tempered Mainspring.

Supply fuel. Recipe duration: 300 game ticks (15 seconds at 20 TPS). This is a blasting recipe, not ordinary furnace smelting.

### Flintlock Hammer

![Flintlock Hammer](../kubejs/assets/kubejs/textures/item/flintlock_hammer.png)

Item ID: `kubejs:flintlock_hammer`. Output: **1**.

**Crafting table:**

```text
F F .
. S I
. . S
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| F | Flint | 2 |
| S | Tempered Gun Steel | 2 |
| I | Gun Screws | 1 |

### Brass Flash Pan

![Brass Flash Pan](../kubejs/assets/kubejs/textures/item/flash_pan.png)

Item ID: `kubejs:flash_pan`. Output: **1**.

**Crafting table:**

```text
B . B
B S B
. I .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Brass Sheet | 4 |
| S | Tempered Gun Steel | 1 |
| I | Gun Screws | 1 |

### Trigger Assembly

![Trigger Assembly](../kubejs/assets/kubejs/textures/item/trigger_assembly.png)

Item ID: `kubejs:trigger_assembly`. Output: **1**.

**Crafting table:**

```text
. S .
I P I
. H .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| S | Tempered Mainspring | 1 |
| I | Gun Screws | 2 |
| P | Precision Mechanism | 1 |
| H | Tripwire Hook | 1 |

### Complete Flintlock Mechanism

![Complete Flintlock Mechanism](../kubejs/assets/kubejs/textures/item/flintlock_mechanism.png)

Item ID: `kubejs:flintlock_mechanism`. Output: **1**.

**Crafting table:**

```text
H F I
S P S
I T I
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| H | Flintlock Hammer | 1 |
| F | Brass Flash Pan | 1 |
| I | Gun Screws | 3 |
| S | Tempered Gun Steel | 2 |
| P | Precision Mechanism | 1 |
| T | Trigger Assembly | 1 |

### Hardwood Stock Blank

![Hardwood Stock Blank](../kubejs/assets/kubejs/textures/item/stock_blank.png)

Item ID: `kubejs:stock_blank`. Output: **1**.

**Crafting table:**

```text
. L L
L L L
L . .
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| L | Stripped Dark Oak Log | 6 |

### Bound Pistol Stock

![Bound Pistol Stock](../kubejs/assets/kubejs/textures/item/pistol_stock.png)

Item ID: `kubejs:pistol_stock`. Output: **1**.

**Crafting table:**

```text
. B S
B W L
. S L
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Brass Sheet | 2 |
| S | Gun Screws | 2 |
| W | Hardwood Stock Blank | 1 |
| L | Leather | 2 |

### Reinforced Rifle Stock

![Reinforced Rifle Stock](../kubejs/assets/kubejs/textures/item/rifle_stock.png)

Item ID: `kubejs:rifle_stock`. Output: **1**.

**Crafting table:**

```text
B W W
S P L
B L L
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Brass Barrel Band | 2 |
| W | Hardwood Stock Blank | 2 |
| S | Gun Screws | 1 |
| P | Bound Pistol Stock | 1 |
| L | Leather | 3 |

## Final gun assembly

Both guns are crafted **unloaded**. Neither recipe provides ammunition.

### FK15P Flintlock Pistol

Gun ID: `qkl:fk15p`. Output: **1 gun**. Station: **crafting table**.

```text
B M R
S W T
. I L
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Finished Pistol Barrel | 1 |
| M | Complete Flintlock Mechanism | 1 |
| R | Steel Ramrod | 1 |
| S | Gun Screws | 1 |
| W | Bound Pistol Stock | 1 |
| T | Brass Barrel Band | 1 |
| I | Tempered Gun Steel | 1 |
| L | Leather | 1 |

### FK15 Flintlock Rifle

Gun ID: `qkl:fk15`. Output: **1 gun**. Station: **crafting table**.

```text
B B R
M W S
T I P
```

| Symbol | Ingredient | Amount |
|---|---|---:|
| B | Brass Barrel Band | 2 |
| R | Reinforced Long Barrel | 1 |
| M | Complete Flintlock Mechanism | 1 |
| W | Reinforced Rifle Stock | 1 |
| S | Gun Screws | 1 |
| T | Steel Ramrod | 1 |
| I | Tempered Gun Steel | 1 |
| P | Precision Mechanism | 1 |

## Manufacture 16.5mm Flintlock Ammunition

Both guns consume the same ammunition. Its displayed name is **16.5mm**, but the gun-pack ID is `qkl:16mm`. Use the finished TaCZ ammunition item; loose cores or powder cannot be loaded directly.

### 1. Large Bullet Cores

Use the Mechanical Saw's cutting recipe:

**1 Iron Nugget or Zinc Nugget → 10 Large Bullet Cores** (`tacz_c:large_bullet_core`).

Use Large Bullet Cores, not ordinary Bullet Cores, finished Bullets, or Pellets.

### 2. Wads

Start a sequenced assembly with **1 Paper**:

1. Deploy 1 additional Paper onto it.
2. Deploy 1 additional Paper onto the in-progress item.
3. Deploy 1 additional Paper onto it.
4. Process the in-progress item with a Mechanical Press.
5. Process it with a Mechanical Saw.

The sequence runs **once**, uses **4 Paper total**, and produces **30 Wads** (`tacz_c:wad`). Keep processing the transitional item between steps; do not substitute fresh paper at each machine.

### 3. Gunpowder Charges

The direct production route in installed Creatified is:

1. In a Basin under a Mechanical Mixer, combine **2 Minecraft Gunpowder + 1 Charcoal + 250 mB Water**. This produces **10 Gunpowder Cakes**. This particular mixing recipe does not require heat.
2. Dry cakes in a **Smoker**, using fuel. Each cake becomes **1 Dry Gunpowder Cake**; recipe time is 50 ticks (2.5 seconds at 20 TPS).
3. Process a Dry Gunpowder Cake with a **Mechanical Press** to obtain **4 Gunpowder Charges** (`tacz_c:gunpowder_charge`).

There is also a shapeless conversion of **5 Creatified Gunpowder Pellets → 1 Gunpowder Charge**. Pellets, grains, vanilla gunpowder, and charges are different items; the final ammunition recipe specifically requires a **charge**.

### 4. Assemble the ammunition

Build a **3×3 face of nine Mechanical Crafters**, all facing the same direction. Connect their output routes using a wrench so ingredients converge toward one final output. Power the crafter network and provide room or an inventory to collect the result. Place one ingredient in each slot as viewed from the front:

```text
C W C
W G W
C W C
```

| Symbol | Ingredient | Total consumed |
|---|---|---:|
| C | Large Bullet Core (`tacz_c:large_bullet_core`) | 4 |
| W | Wad (`tacz_c:wad`) | 4 |
| G | Gunpowder Charge (`tacz_c:gunpowder_charge`) | 1 |

Output: **4 rounds** of 16.5mm ammunition. All nine slots are occupied. A normal crafting table cannot perform this recipe.

| Desired ammunition | Crafting cycles | Large Bullet Cores | Wads | Gunpowder Charges |
|---|---:|---:|---:|---:|
| 4 rounds | 1 | 4 | 4 | 1 |
| 16 rounds (one stack) | 4 | 16 | 16 | 4 |
| 64 rounds (four stacks) | 16 | 64 | 64 | 16 |

### Worked example: one stack of 16 rounds

Starting with no Creatified components:

- Cut **2 Iron or Zinc Nuggets** into 20 Large Bullet Cores.
- Run the wad assembly once using **4 Paper**, producing 30 Wads.
- Mix **2 Gunpowder + 1 Charcoal + 250 mB Water**, producing 10 Gunpowder Cakes.
- Smoke **only one** cake, then press it into 4 Gunpowder Charges.
- Run the ammunition pattern **four times**, consuming 16 cores, 16 wads, and 4 charges.

You receive **16 rounds**, with **4 cores, 14 wads, and 9 undried cakes** left over. Machine construction and smoker fuel are additional.

## Loading and use

Carry the 16.5mm TaCZ ammunition in your inventory, hold the pistol or rifle, and use your configured **TaCZ Reload** key. Check Controls for its binding. Both installed gun definitions have a **one-round capacity**, so reload after firing. Wait for the reload animation to finish before trying to shoot.

The rifle and pistol share the ammo type but have different handling and reload animations. Gun crafting produces zero loaded rounds.

## Troubleshooting

| Symptom | What to check |
|---|---|
| The recipe is absent from EMI/JEI, even as OP | Expected. All 20 custom recipes are deliberately hidden for everyone. Use this manual. |
| A component will not craft | Check every occupied slot and empty slot. Use actual custom parts and the exact Create sheets. Verify stripped **dark oak logs**, not planks. |
| A spring or steel blank will not cook | Use a **blast furnace** with fuel. The custom recipes are not ordinary smelting recipes. |
| Ammo does nothing in a crafting table | It requires **Mechanical Crafters**. |
| Mechanical Crafters do not finish | Check rotational power, stress capacity, routing, all nine ingredients, and a clear output. Use Large Bullet Cores, Wads, and a Gunpowder Charge. |
| The gun will not reload | Verify the ammo ID is `qkl:16mm`, keep it in your inventory, and check your reload key. The finished ammo, not intermediate ingredients, is required. |
| Item names or textures are missing | Ensure the client has the startup item registrations and textures, then fully restart Minecraft. |
| Hidden recipes still show after deployment | Restart the server or run `/reload`, then reconnect the client. Ensure the old client admin-visibility script is gone. Check KubeJS logs. |

## Administrator deployment notes

The visibility rule is in `kubejs/server_scripts/flintlock_recipe_visibility.js`. Install it on the server alongside the existing recipes. KubeJS synchronizes the viewer hiding data to compatible clients. The previous `client_scripts/flintlock_recipe_visibility.js` has been removed; remove that old file from already-distributed client packs as well, because its standalone-JEI admin logic can unhide recipes.

Keep the existing startup registrations and textures in the client modpack. Players do not need a separate client **hiding** script.

This is viewer hiding, not secrecy from modified clients. Recipe data still reaches clients, and the vanilla recipe book is not filtered. If distributing the pack publicly, exclude this manual and consider keeping the server recipe scripts out of the client distribution; keep them on the server.

Recipe patterns and totals in this manual were generated from the current KubeJS recipe definitions. Upstream material instructions were checked against the installed mod JARs. In-game crafting and viewer synchronization still need verification.

Sources in this instance:
- `kubejs/server_scripts/flintlocks.js`
- `kubejs/server_scripts/flintlock_ammo.js`
- `mods/tacz_c-1.0.2+neoforge.1.21.1.jar`
- `mods/create-1.21.1-6.0.10.jar`

[KubeJS documentation: server-side recipe viewer hiding](https://kubejs.com/wiki/events/RecipeViewerEvents/removeRecipes)
