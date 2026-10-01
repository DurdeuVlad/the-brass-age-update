# ⚜ The Brass Age Update v1.1.0 — Industrial Arms & Sovereign Mines ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified via MC-Pilot (`mct`) Driving a Real Client on Dedicated Server

---

## 🚀 Ce este nou în v1.1.0 (What's New in v1.1.0)

### 1. ⚙️ Asamblare Industrială Exclusivă: Create Mechanical Crafters (3×3)
- **Eliminarea mesei de crafting**: Toate rețetele de bază pentru armele de foc (`qkl:fk15` Muscheta FK15 și `qkl:fk15p` Pistolul de Cavalerie FK15-P) au fost eliminate complet din masa de lucru standard.
- **Asamblare cinetică Create**: Armele necesită obligatoriu o rețea de 9 Mechanical Crafters Create (grilă 3×3) alimentate cu energie cinetică și rotativă.
- **Rețete secrete ascunse**: Rețetele de arme au fost ascunse complet din EMI, JEI și cartea de rețete vanilla pentru a preveni descoperirea neautorizată de către jucătorii fără rang.

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

## 🛠️ Ghid Rapid de Instalare (1-Click)

1. Deschideți folderul instanței voastre de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.1.0.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau `install_patch.ps1`).
4. Porniți jocul!

---

## 🧪 GHID COMPLET DE TESTARE: CE ȘI CUM SĂ TESTEZI (TESTING PROTOCOL)

Pentru testeri, moderatori și administratori de server, mai jos se află lista completă de verificare pas-cu-pas, comenzile rapide utile și comportamentul exact așteptat pentru fiecare mecanică nouă.

### 📋 Cheat Sheet: Comenzi Utile pentru Testare

```bash
# 1. Comanda Admin de Acordare a Manualului Armurierului (necesită OP / perm 2):
/gunsmith book @s
# sau:
/gunsmith_manual

# 2. Give Arme cu Cremene (Nepoansonate / Noi din Fabrică):
/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p"}] 1
/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15"}] 1

# 3. Give Scule de Poansonare & Permise:
/give @s kubejs:proof_stamp 1
/give @s kubejs:permit_blank 4
/experience add @s 30 levels

# 4. Give Muniție 16.5mm:
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm"}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",SilverAmmo:true}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",CanisterAmmo:true}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",IncendiaryAmmo:true}] 64

# 5. Give Lăzi Militare Sigilate:
/give @s kubejs:crate_muskets 1
/give @s kubejs:crate_pistols 1
/give @s kubejs:ammunition_crate 1

# 6. Comenzi Test Vampirism:
/vampire add @s
/vampire check @s
/vampire remove @s
```

---

### 🔬 Scenarii de Testare Pas-cu-Pas (Checklist)

#### ✅ Testul 1: Secretizarea Rețetelor & Rețeaua Create Mechanical Crafter (3×3)
- **Ce testezi**: Imposibilitatea fabricării armelor la masa clasică și cerința de asamblare cinetică Create.
- **Cum testezi**:
  1. Deschide o Masă de Lucru (*Crafting Table*).
  2. Pune componentele unei muschete (țeavă, mecanism, pat de armă) în grilă.
  3. Verifică lista de rețete în EMI/JEI căutând `qkl:fk15` sau `qkl:fk15p`.
  4. Construiește o rețea 3×3 de **Create Mechanical Crafters**, leag-o la un arbore de rotație (kinetic speed > 0) și așază componentele conform manualului.
- **Rezultat Așteptat**:
  - Masa de lucru clasică arată slotul de ieșire **complet gol** (rețeta a fost ștearsă).
  - În EMI/JEI, rețeta de asamblare a armei **NU apare deloc** (este ascunsă).
  - Create Mechanical Crafter preia componentele și asamblează mecanic arma la finalizarea ciclului cinetic.

---

#### ✅ Testul 2: Manualul Oficial al Armurierului (`/gunsmith book`)
- **Ce testezi**: Comanda de admin și conținutul cărții Patchouli.
- **Cum testezi**:
  1. Ca operator/admin, tastează `/gunsmith book @s` (sau testează pe alt jucător: `/gunsmith book <nume>`).
  2. Deschide cartea primită (*The Gunsmith's Book of Work*).
  3. Navighează la capitolul **"VI. The Final Assembly"** și deschide paginile pentru `FK15 Flintlock Musket` și `FK15P Cavalry Pistol`.
- **Rezultat Așteptat**:
  - Cartea se deschide într-un GUI curat Patchouli.
  - Pagina afișează diagrama 3×3 Create Mechanical Crafter cu schema componentelor (`BBR / MWS / TIP`), materialele necesare și instrucțiunile imperiale de asamblare.
  - Jucătorii fără permisiune OP nu pot executa `/gunsmith` (acces restricționat).

---

#### ✅ Testul 3: Limita de Purtare a Armelor (Hard Cap Inventory Limiter)
- **Ce testezi**: Restricția la maxim 1 armă lungă (muschetă/pușcă) și 2 arme scurte (pistoale).
- **Cum testezi**:
  1. Pune în inventar 1 muschetă și 2 pistoale.
  2. Dă-ți încă o muschetă sau încearcă să ridici una de pe sol (`/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15"}] 1`).
  3. Încearcă același lucru încercând să ții 3 pistoale simultan.
- **Rezultat Așteptat**:
  - Arma în exces este **aruncată automat din inventar pe pământ** la picioarele jucătorului.
  - În chat apare avertizarea roșie a garnizoanei: `Nu poți purta mai mult de 1 armă lungă pe umeri!` sau `Nu poți purta mai mult de 2 pistoale la brâu!`.
  - Nu există scăpare prin inventarul personal de crafting (grid-ul 2x2 este de asemenea monitorizat).

---

#### ✅ Testul 4: Ritualul de Poansonare Legală pe Nicovală (#RC-15-XXXX)
- **Ce testezi**: Ștanțarea seriei oficiale, consumul de experiență și blocarea re-poansonării.
- **Cum testezi**:
  1. Ia o armă nouă (nepoansonată) și un Sigiliu Imperial (`kubejs:proof_stamp`).
  2. Asigură-te că ai cel puțin 5 niveluri de XP (`/experience add @s 30 levels`).
  3. Deschide o nicovală (*Anvil*): plasează arma în primul slot (stânga) și Sigiliul în al doilea slot (mijloc).
  4. Ridică arma din slotul de rezultat (dreapta).
  5. Încearcă să pui arma deja poansonată din nou pe nicovală cu sigiliul.
- **Rezultat Așteptat**:
  - Nicovala consumă **5 niveluri de XP** (cost de inspecție imperială).
  - Sigiliul Imperial este un instrument indestructibil (rămâne în inventar).
  - Arma primește NBT-ul: `Proofed: true` și o serie unică secvențială (ex. `Serial: "#RC-15-0105"`).
  - Tooltip-ul armei afișează cu verde: `✔ POANSONAT: #RC-15-0105` și `Registrul Imperial Straja`.
  - Re-poansonarea unei arme deja legale este refuzată (slotul de ieșire rămâne gol).

---

#### ✅ Testul 5: Emiterea Permisului Oficial de Port-Armă (Carte Scrisă Semnată)
- **Ce testezi**: Legarea permisului de serie și emiterea documentului oficial.
- **Cum testezi**:
  1. Ține arma poansonată (ex. `#RC-15-0105`) în mâna secundară (*Offhand* - slotul de scut, tasta `F`).
  2. Pune în mâna principală formulare albe de permis (`kubejs:permit_blank`).
  3. Dă click-dreapta în aer sau pe un bloc.
  4. Deschide cartea scrisă primită în inventar.
  5. Testează scenariul negativ: ține o armă nepoansonată în offhand și dă click-dreapta cu permisul.
- **Rezultat Așteptat**:
  - Click-dreapta consumă 1 formular alb și emite o carte scrisă `minecraft:written_book` intitulată `Permis Port-Armă #RC-15-XXXX`.
  - Cartea este semnată de `Gheorghe Comandantul` și conține numele tău de jucător, seria armei, modelul și statutul `LEGAL / ÎNREGISTRAT`.
  - Dacă arma din stânga nu este poansonată legal, permisul refuză emiterea cu mesajul: `Arma din mâna stângă nu este poansonată legal!`.

---

#### ✅ Testul 6: Piața Neagră — Pilirea Serie pe Tocilă (Grindstone Defacing)
- **Ce testezi**: Ștergerea seriei pentru contrabandiști și trecerea în statutul Defaced.
- **Cum testezi**:
  1. Pune o armă poansonată legal pe o Tocilă (*Grindstone*).
  2. Ridică arma din slotul de rezultat.
  3. Încearcă să pui arma pilită înapoi pe nicovală cu Sigiliul Imperial.
- **Rezultat Așteptat**:
  - Tocila șterge seria și lore-ul oficial Straja.
  - Arma primește lore-ul roșu de contrabandă: `⚠ [SERIE PILITĂ / DEFACED]` și `Armă de contrabandă!`.
  - Nicovala refuză ștanțarea armelor pilite (armele din lumea interlopă nu pot fi re-legalizate casual).

---

#### ✅ Testul 7: Muniție Specială — Cartușe de Argint, Mitralii & Incendiare
- **Ce testezi**: Selectarea muniției din mâna secundară și efectele speciale de luptă.
- **Cum testezi**:
  1. Pune cartușe de argint (`SilverAmmo: true`) în mâna stângă (offhand).
  2. Apasă tasta `[R]` pentru reîncărcare.
  3. Trage într-un Zombie / Schelet și într-un jucător cu `/vampire add`.
  4. Încarcă apoi `CanisterAmmo` (Mitralii) și trage într-un grup de mobi la mică distanță.
  5. Încarcă `IncendiaryAmmo` și trage într-o țintă.
- **Rezultat Așteptat**:
  - Glonțul de Argint provoacă **4.0× daune** nemorților (one-shot kill) și **2.0× daune** vampirilor, acompaniat de clinchet de ametist.
  - Mitraliile împrăștie alice cu recul masiv și resping inamicii (Knockback).
  - Glonțul incendiar aprinde ținta în flăcări timp de 8 secunde.

---

#### ✅ Testul 8: Lăzile Militare Sigilate & Transportul de Armament
- **Ce testezi**: Ambalarea armelor pentru transportul cu trenul Create sau căruțe Trotting Wagons.
- **Cum testezi**:
  1. Pune o ladă `kubejs:crate_muskets` sau `kubejs:crate_pistols` în hotbar.
  2. Ține apăsat `SHIFT` (crouch) și dă click-dreapta pe sol.
  3. Fă același lucru cu o ladă de muniție `kubejs:ammunition_crate`.
- **Rezultat Așteptat**:
  - Se aude sunetul de rupere a sigiliului de lemn și zăvor de fier.
  - Lada se desigilează: 8 muschete (sau 8 pistoale / 256 cartușe) sunt descărcate la picioare, iar jucătorul primește un cufăr de lemn înapoi.
  - Lăzile stivuibile (stack size 16) permit transportul legal a sute de arme fără a declanșa limita individuală de purtare.

---

#### ✅ Testul 9: Mina Straja — Deblocarea Ramurii 4 & Noile Filoane
- **Ce testezi**: Progresia minieră și distribuția noilor resurse.
- **Cum testezi**:
  1. Mergi la mina Straja și vorbește cu NPC-ul Mirel.
  2. Verifică deblocarea zonelor 1, 2, 3 și noua zonă 4.
  3. Minează sau inspectează conținutul zonelor.
- **Rezultat Așteptat**:
  - Zona 1: Minereu abundent de Sulf (900), Fier (600), Cărbune (700) și Dripstone introductiv (300).
  - Zona 2: Depozit masiv de Dripstone (2000), Sulf (500), Argint integrat; Cuprul a fost complet extras.
  - Zona 3: Fier (800), Zinc (600), Sulf (200), Andesit (500).
  - Zona 4 (Deblocată): Punct strategic final al Statului cu Sulf (1000), Diamante (100) și Redstone (500).

---

## 📝 Format de Raportare a Problemelor (Feedback Template)

Dacă întâmpinați orice comportament neconform, vă rugăm să trimiteți un raport complet:

```markdown
**Testul Efectuat**: [Ex: Testul 4 - Poansonare pe Nicovală]
**Modul de Joc**: [Dedicated Server / Singleplayer]
**Ce s-a întâmplat**: [Descrierea comportamentului observat]
**Ce trebuia să se întâmple**: [Conform ghidului de testare]
**Comenzi rulate**: [Ex: /give ..., /gunsmith book ...]
**Captură de ecran / Erori**: [Atașați logul sau screenshot-ul din joc]
```

*Succes la testare! Trageți drept și țineți pulberea uscată sub pavăza Garnizoanei Straja!*
