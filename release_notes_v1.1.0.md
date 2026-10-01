# ⚜ The Brass Age Update v1.1.0 — Industrial Arms & Sovereign Mines ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified via MC-Pilot (`mct`) Driving a Real Client on Dedicated Server

---

## 🚀 Ce este nou în v1.1.0 (What's New in v1.1.0)

### 1. ⚙️ Asamblare Industrială Exclusivă: Create Mechanical Crafters (3×3)
- **Eliminarea mesei de crafting**: Toate rețetele de bază pentru armele de foc (`qkl:fk15` Muscheta FK15 și `qkl:fk15p` Pistolul de Cavalerie FK15-P) au fost eliminate complet din masa de lucru standard.
- **Asamblare cinetică Create**: Armele necesită obligatoriu o rețea de 9 Mechanical Crafters Create (grilă 3×3) alimentate cu energie cinetică și rotativă.
- **Rețete secrete ascunse**: Rețetele de arme au fost ascunse complet din EMI, JEI și cartea de rețete vanilla pentru a preveni descoperirea neautorizată.

### 2. 📖 Comandă Oficială pentru Operatori / Admini (`/gunsmith`)
- Înregistrată comanda `/gunsmith book [jucător]` (nivel de permisiune 2 / OP).
- Permite acordarea instantanee a manualului oficial Patchouli: *"The Gunsmith's Book of Work"*, conținând diagramele complete ale grilei 3×3 Create Mechanical Crafter, tabelele balistice și regulamentele garnizoanei Straja.
- Aliasuri disponibile: `/gunsmith_manual`, `/manual_armurier`.

### 3. ⛏️ Deblocarea & Calibrarea Minei Continentale Straja (4 Ramuri)
Mina Straja a fost complet deblocată și configurată conform progresiei economice dorite:
- **Ramura 1**: Sulf 900 (vein 22), Fier 600 (vein 20), Cărbune 700 (vein 20), Dripstone 300 (vein 6).
- **Ramura 2**: Dripstone 2000, Sulf 500, Argint mutat pe această zonă, Cupru eliminat complet.
- **Ramura 3**: Fier 800, Zinc 600, Sulf 200, Andesit 500.
- **Ramura 4**: Sulf 1000, Diamante 100, Redstone 500.

### 4. 🔨 Poansonare Legală & Permis Port-Armă (Data Components 1.21.1)
- **Nicovală Regală**: Aplicarea Sigiliului Imperial (`kubejs:proof_stamp`) pe o armă consumă 5 niveluri de XP și ștanțează o serie secvențială oficială (ex. `#RC-15-0105`) înregistrată în Registrul Imperial Straja.
- **Permis de Port-Armă**: Click-dreapta cu un Permis Blank (`kubejs:permit_blank`) având arma poansonată în mâna stângă (offhand) emite o carte oficială scrisă semnată de Gheorghe Comandantul, atestând legalitatea armei.
- **Compatibilitate 1.21.1**: Codul a fost adaptat integral la arhitectura Data Components NeoForge 1.21.1.

### 5. 🎒 Restricție Port-Armă & Lăzi Militare Sigilate
- Limită strictă de inventar: maxim 1 armă lungă și 2 pistoale. Armele suplimentare cad instantaneu la picioarele jucătorului.
- Transport în masă: Lăzi militare sigilate (`kubejs:crate_muskets`, `kubejs:crate_pistols`, `kubejs:ammunition_crate`) pentru logistică cu căruțe Trotting Wagons și trenuri Create.

---

## 📦 Pachete de Descărcat (Release Downloads)

1. **`TheBrassAge-Update-All-In-One-v1.1.0.zip`** *(Recomandat)*:
   - Conține întregul pachet (mods, configs, kubejs server/client/startup, tacz gunpacks, cărți patchouli, lăzi militare și cele 34 de texturi pixel-art).
   - Ideal atât pentru Singleplayer cât și pentru actualizarea rapidă a instanței de joc.
2. **`TheBrassAge-Update-Server-v1.1.0.zip`**:
   - Pachet complet optimizat pentru administratorii de servere dedicate.
3. **`TheBrassAge-Update-Client-v1.1.0.zip`**:
   - Pachet optimizat pentru clienți / jucători conectându-se la un server dedicat.

---

## 🛠️ Instalare Rapidă (1-Click)

1. Deschideți folderul instanței voastre de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.1.0.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau `install_patch.ps1`).
4. Porniți jocul și bucurați-vă de noua eră industrială!
