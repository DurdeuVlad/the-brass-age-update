# ⚜ THE BRASS AGE UPDATE — TESTER & REVIEW GUIDE ⚜
### Ghid de Testare & Instalare pentru Testeri (Rustic Craft II)

Versiune: `v1.2.0-Release`  
Platformă: `Minecraft 1.21.1` / `NeoForge 21.1.248`  
Modpack: **Rustic Craft II**  
Repository: `DurdeuVlad/the-brass-age-update`

---

> [!IMPORTANT]
> **NOUTĂȚI MAJORE ÎN v1.2.0**:
> 1. **Alchimia Netherless Create pe 3 Niveluri Industriale**: Sinteză completă a tuturor resurselor de Nether în Overworld urmând arhitectura industrială consacrată: Nivel 1 Desperare (Manual 1×) $\rightarrow$ Nivel 2 Cinetic Create (2×–4×) $\rightarrow$ Nivel 3 Surge Termic cu Sulf & Asamblare Secvențială (8×–16×, 400% surge).
> 2. **Sistem de Tipografie Zero-Overflow pentru Cărțile Patchouli**: 270 pagini auditate și verificate împotriva depășirilor de chenar (zero text clipping, font wrap calibrated).
> 3. **Ghid Interactiv Extins la 16 Pași (`/brass_test`)**: Pașii 15 și 16 introduc testarea completă a alchimiei Netherless, cu comenzi dedicate (`/brass_test help`, `/brass_test netherless`) și butoane interactive.
> 4. **Suită Automatizată Extinsă la 30/30 Aserțiuni (`/straja test`)**: 100% rată de succes pe serverul dedicat live, inclusiv validarea celor 38 de rețete alchimice pe toate cele 3 niveluri.

---

## 📦 1. Ce conține acest pachet de export?

Acest export conține sistemul complet al expansiunii **The Brass Age**:
1. **Arme cu Cremene Autentice**: Muscheta cu țeavă lisă FK15 (140ms timp de dare a focului, dispersie conică), Pistolul de cavalerie FK15-P, Muscheta ghintuită FK15-R Jaeger. Asamblare exclusiv pe Create Mechanical Crafters (3x3).
2. **Limită Realistă de Transport & Lăzi Militare**: Pe jos, ostașul poartă maxim 1 armă lungă (muschetă) pe spate și 2 arme scurte (pistoale) la brâu. Pentru transportul de mari cantități, armamentul se ambalează în **Lăzi Militare Sigilate** (`kubejs:crate_muskets` - 8 muschete, `kubejs:crate_pistols` - 8 pistoale, `kubejs:ammunition_crate` - 256 muniții), ideale pentru transportul în căruțe de povară (*Trotting Wagons*), vagoane de tren Create sau animale de povară.
3. **Muniție & Război Supranatural**: Cartușe sfințite de argint (daune 4× împotriva strigoilor/nemorților și 2× împotriva vampirilor), Mitralii (Canister Shot - 8 alice) și Gloanțe Incendiare de sulf.
4. **Economie Industrială pe 3 Niveluri (Factorio-Style)**: Rafinarea pulberii negre (Mojar manual -> Moară cu ciocane Create & Corning -> Linie chimică automatizată de asamblare secvențială).
5. **Alchimia Netherless Create (3 Niveluri)**: Sinteză completă pentru Netherrack, Magmă, Foc, Nisip Suflet, Cuarț, Tije de Văpaie, Blaze Burners și Lacrimi de Ghast.
6. **5 Linii Civile P.U.L.A SRL**: Benzi de sulf pentru vinificație (Vinery), Îngrășământ mineral Super-Fosfat (creștere triplă a recoltelor), Săpun medicinal antiseptic de sulf, Chibrituri de siguranță, Piele grea tratată cu vitriol.
7. **Mina Continentală Straja**: Integrare completă în motorul de mine `custom_mines` cu 4 zone de adâncime calibrate.
8. **Sistem Legal de Poansonare & Piață Neagră**: Armele noi sunt contrabandă (`NEPOANSONAT`); baterea pe nicovală cu Sigiliul Imperial aplică serie unică `#RC-15-XXXX`; polizarea pe tocilă (grindstone) pilește seria pentru lumea interlopă.
9. **UX Prietenos**: Comenzi universale `/flintlock` și `/arma`, comenzi de operator `/gunsmith book [player]`, HUD dinamic pe actionbar la reîncărcare (numărătoare inversă 20s, avertizare la sprint).
10. **34 Texturi Pixel-Art Autentice 16x16**: Toate piesele, pulberile, lăzile și armele au artă completă stil Minecraft.

---

## 🚀 2. Instalare Rapidă (Quick Start)

### Opțiunea A: Instalare Automată 1-Click (Recomandată)
1. Deschide launcher-ul tău (Prism Launcher, CurseForge, Modrinth sau ATLauncher).
2. Dă click-dreapta pe instanța **Rustic Craft II** și alege **Open Folder** / **Folder Instanță** (unde vezi folderele `mods`, `config`, `kubejs`).
3. Descarcă și extrage **`TheBrassAge-Update-All-In-One-v1.2.0.zip`** direct în acel folder.
4. Dă dublu-click pe **`install_patch.bat`** (sau click-dreapta `Run with PowerShell` pe `install_patch.ps1`).
5. Gata! Pornește jocul.

### Opțiunea B: Instalare Manuală (Fără installer)
Dacă preferi să copiezi manual, extrage arhiva și suprascrie (Overwrite All) următoarele foldere în instanța ta:
- `mods/` -> adaugă TaCZ și compatibilitățile necesare
- `kubejs/` -> se îmbină cu scripturile, texturile și lăzile militare
- `tacz/` -> conține gunpack-urile cu muschete și pistoale
- `patchouli_books/` -> adaugă Manualul Armurierului
- `config/` -> actualizează setările de rucsac și depozitare

### Opțiunea C: Pentru Administratori de Server Dedicat
1. Oprește serverul dedicat (`stop`).
2. Descarcă **`TheBrassAge-Update-Server-v1.2.0.zip`** (sau `All-In-One`).
3. Extrage în rădăcina serverului dedicat (sau rulează `install_patch.bat`).
4. Repornește serverul.

---

## 🛠 3. Cheat Sheet & Comenzi de Pornire Rapidă

Pentru a testa rapid fără a mina resursele manual, deschide chat-ul și folosește următoarele comenzi:

### 🎮 Ghid Interactiv de Testare Pas-cu-Pas (Recomandat — 1-Click Dumbproof)
- `/brass_test help`  
  *Afișează ghidul complet al comenzilor de testare in-game.*
- `/brass_test` (sau `/gunsmith_test` / `/testguide`)  
  *§c[ADMIN ONLY, OP Level 2] §aDeschide ghidul interactiv pas-cu-pas în chat! Te ghidează prin fiecare din cele 16 teste, oferă butoane clickabile pentru echiparea automată a kitului de testare (`[📦 Dă-mi Kitul]`), spawnare de ținte (`[👾 Spawn Zombie]`) și confirmare pas cu pas (`[✔ Confirmă & Pasul Următor]`). Nu mai trebuie să tastezi manual nicio comandă `/give`!*
- `/brass_test next` - Confirmă testul curent și trece la pasul următor.
- `/brass_test prev` - Se întoarce la pasul anterior.
- `/brass_test give` - Echipează kitul de materiale pentru pasul curent.
- `/brass_test netherless` (sau `/brass_test pyro`) - Echipează kitul complet de alchimie Netherless (ingrediente + utilaje Create).
- `/brass_test fakes` - Echipează pachetul de arme și permise contrafăcute.
- `/brass_test goto <1..16>` - Sare direct la un pas specific (ex: `/brass_test 15`).
- `/brass_test reset` - Resetează ghidul la Pasul 1 și curăță efectele negative.
- `/straja test` - Rulează suita completă de 30 teste automate empirice.

### Manual & Ghiduri Clasice
- `/flintlock` sau `/arma`  
  *Afișează cartonașul ghid complet de tragere, ochire și reîncărcare (disponibil tuturor jucătorilor).*
- `/gunsmith` sau `/gunsmith book [jucător]` (sau `/manual_armurier`)  
  *§c[ADMIN ONLY, OP Level 2] §aÎnmânează "Manualul Oficial al Armurierului" (The Rustic Gunsmith). Rețetele de asamblare a armelor sunt secrete de stat ascunse din EMI/JEI și necesită Create Mechanical Crafters.*
- `/function kubejs:give_gunsmith_manual`  
  *Comandă alternativă prin funcție datapack pentru obținerea manualului.*

### Comenzi Vampirism (pentru testul de argint)
- `/vampire add <jucător>`  
  *Marchează un jucător ca Vampir (vulnerabil la argint: 2× damage).*
- `/vampire check <jucător>`  
  *Verifică dacă jucătorul este marcat ca Vampir.*
- `/vampire remove <jucător>`  
  *Elimină statutul de Vampir.*

### Give Arme & Muniție (Minecraft 1.21.1 Data Components)
```
/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15"}] 1
/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15p"}] 1
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm"}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",SilverAmmo:true}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",CanisterAmmo:true}] 64
/give @s tacz:ammo[minecraft:custom_data={AmmoId:"qkl:16mm",IncendiaryAmmo:true}] 64
```

### Give Obiecte Legale & Civile
```
/give @s kubejs:proof_stamp 1
/give @s kubejs:permit_blank 4
/experience add @s 30 levels
/give @s kubejs:miracle_fertilizer 64
/give @s kubejs:sulfur_soap 16
/give @s kubejs:safety_matches 16
/give @s kubejs:fumigation_strip 16
/give @s kubejs:vitriol_leather 16
```

### Give Lăzi Militare (Sigilate)
```
/give @s kubejs:crate_muskets 1
/give @s kubejs:crate_pistols 1
/give @s kubejs:ammunition_crate 1
```

---

## 🧪 4. Scenarii de Testare Pas-cu-Pas (Test Checklist v1.1.2)

> 💡 **MOD RECOMANDAT — GHID ASISTAT**:  
> În loc să tastezi manual comenzi `/give`, tastează în chat:  
> **`/brass_test`** (sau **`/straja tester`**)  
> Vei primi pe rând fiecare scenariu în chat, cu butoane clickabile `[ 📦 DĂ-MI KITUL DE TEST ]` pentru echipare automată și `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` pentru validare!

---

### ✅ Testul 1: Secretizarea Rețetelor & Rețeaua Create Mechanical Crafter (3×3)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 1` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` în chat pentru a primi direct toate componentele și uneltele necesare!
- **Ce testezi**: Imposibilitatea fabricării armelor la masa clasică și cerința de asamblare cinetică Create.
- **Cum testezi**:
  1. Deschide o Masă de Lucru (*Crafting Table*). Pune componentele unei arme în grilă.
  2. Verifică lista de rețete în EMI/JEI căutând `qkl:fk15` sau `qkl:fk15p`.
  3. Construiește o rețea 3×3 de **Create Mechanical Crafters**, leag-o la un arbore de rotație (sau folosește un `Hand Crank`) și așază componentele conform manualului.
  4. Rotește manivela pentru asamblare cinetică.
- **Rezultat Așteptat**:
  - Masa de lucru clasică arată slotul de ieșire **complet gol** (rețeta a fost ștearsă).
  - În EMI/JEI, rețeta de asamblare a armei **NU apare deloc** (este ascunsă).
  - Create Mechanical Crafter preia componentele și asamblează mecanic pistolul `FK15-P` la finalizarea rotației.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 2: Manualul Oficial al Armurierului (`/gunsmith book`)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 2` și apasă `[ 📖 DESCHIDE MANUALUL ]` în chat!
- **Ce testezi**: Comanda de admin și conținutul cărții Patchouli.
- **Cum testezi**:
  1. Ca operator/admin, tastează `/gunsmith book @s` (sau testează pe alt jucător: `/gunsmith book <nume>`).
  2. Deschide cartea primită (*The Gunsmith's Book of Work*).
  3. Navighează la capitolul **"VI. The Final Assembly"** și deschide paginile pentru `FK15 Flintlock Musket` și `FK15P Cavalry Pistol`.
- **Rezultat Așteptat**:
  - Cartea se deschide într-un GUI curat Patchouli.
  - Pagina afișează diagrama 3×3 Create Mechanical Crafter cu schema componentelor (`BBR / MWS / TIP`), materialele necesare și instrucțiunile imperiale de asamblare.
  - Jucătorii fără permisiune OP nu pot executa `/gunsmith` (acces restricționat).
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 3: Limita de Purtare a Armelor (Hard Cap Inventory Limiter)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 3` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` în chat pentru a primi 2 muschete și 3 pistoale!
- **Ce testezi**: Restricția la maxim 1 armă lungă (muschetă/pușcă) și 2 arme scurte (pistoale).
- **Cum testezi**:
  1. Pune în inventar 1 muschetă și 2 pistoale.
  2. Dă-ți încă o muschetă sau încearcă să ridici una de pe sol (`/give @s tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"qkl:fk15"}] 1`).
  3. Încearcă același lucru încercând să ții 3 pistoale simultan.
- **Rezultat Așteptat**:
  - Arma în exces este **aruncată automat din inventar pe pământ** la picioarele jucătorului.
  - În chat apare avertizarea roșie a garnizoanei: `Nu poți purta mai mult de 1 armă lungă pe umeri!` sau `Nu poți purta mai mult de 2 pistoale la brâu!`.
  - Nu există scăpare prin inventarul personal de crafting (grid-ul 2x2 este de asemenea monitorizat).
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 4: Ritualul de Poansonare Legală pe Nicovală (#RC-15-XXXX)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 4` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru nicovală, Sigiliul Imperial, XP și pistol nepoansonat!
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
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 5: Emiterea Permisului Oficial de Port-Armă (Carte Scrisă Semnată)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 5` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru formulare albe și armă cu serie înregistrată!
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
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 6: Piața Neagră — Pilirea Serie pe Tocilă (Grindstone Defacing)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 6` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru tocilă și armă legală!
- **Ce testezi**: Ștergerea seriei pentru contrabandiști și trecerea în statutul Defaced.
- **Cum testezi**:
  1. Ține arma poansonată legal în mâna principală.
  2. Dă **click-dreapta direct pe un bloc de Tocilă (*Grindstone*)** așezat în lume (sau plaseaz-o în GUI-ul tocilei).
  3. Verifică tooltip-ul armei și sunetul de șlefuire/scântei.
  4. Încearcă să pui arma pilită înapoi pe nicovală cu Sigiliul Imperial.
- **Rezultat Așteptat**:
  - Se aude sunetul de polizare (`block.grindstone.use`) și apar particule de piatră.
  - Seria oficială și statutul legal sunt șterse complet.
  - Arma primește lore-ul roșu de contrabandă: `⚠ [SERIE PILITĂ / DEFACED]` și `Armă de contrabandă!`.
  - Nicovala și permisul refuză armele pilite (armele din lumea interlopă nu pot fi re-legalizate casual).
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 7: Muniție Specială & Luptă Tactică (Argint, Mitralii & Incendiare)
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 7` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]`, apoi `[ 👾 SPAWN ZOMBIE ]` sau `[ 🧛 MARCHEAZĂ CA VAMPIR ]` direct din chat!
- **Ce testezi**: Selectarea muniției din mâna secundară, feedback-ul HUD la reîncărcare (20s) și efectele speciale de luptă.
- **Cum testezi**:
  1. Pune cartușe de argint (`SilverAmmo: true`) în mâna stângă (offhand).
  2. Apasă tasta `[R]` pentru reîncărcare:
     - Pe Actionbar apare numărătoarea inversă cu contrast ridicat: `[Muschetă] Încarci pulberea și glonțul... (Nu schimba arma, nu sprinta!)`.
     - Dacă sprintezi, reîncărcarea se anulează instantaneu cu mesaj roșu.
  3. Trage într-un Zombie / Schelet și într-un jucător cu `/vampire add`.
  4. Încarcă apoi `CanisterAmmo` (Mitralii) și trage într-un grup de mobi la mică distanță.
  5. Încarcă `IncendiaryAmmo` și trage într-o țintă.
- **Rezultat Așteptat**:
  - Glonțul de Argint provoacă **4.0× daune** nemorților (one-shot kill) și **2.0× daune** vampirilor, acompaniat de clinchet de ametist.
  - Mitraliile împrăștie alice cu recul masiv și resping puternic inamicii (Knockback).
  - Glonțul incendiar aprinde ținta în flăcări timp de 8 secunde.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 8: Lăzile Militare Sigilate & Transportul de Armament
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 8` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru lăzi sigilate!
- **Ce testezi**: Ambalarea armelor pentru transportul cu trenul Create sau căruțe Trotting Wagons.
- **Cum testezi**:
  1. Pune o ladă `kubejs:crate_muskets` sau `kubejs:crate_pistols` în mână.
  2. Dă click-dreapta pe sol (sau ține apăsat `SHIFT` și dă click-dreapta în aer/sol).
  3. Fă același lucru cu o ladă de muniție `kubejs:ammunition_crate`.
- **Rezultat Așteptat**:
  - Se aude sunetul de rupere a sigiliului de lemn și zăvor de fier.
  - Lada se desigilează: 8 muschete (sau 8 pistoale / 256 cartușe) sunt descărcate pe blocul țintit sau la picioare, iar jucătorul primește un cufăr de lemn înapoi.
  - Lăzile stivuibile (stack size 16) permit transportul legal a sute de arme fără a declanșa limita individuală de purtare.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 9: Mina Straja — Deblocarea Ramurii 4 & Noile Filoane
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 9` și apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru materialele de deblocare!
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
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 10: Registrul Central al Garnizoanei & Rollover 24h *(NOU în v1.1.2)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 10` și apasă `[ 🔄 TESTEAZĂ ROLLOVER ]` sau `[ 📖 CARTEA DE PATRULĂ ]` în chat!
- **Ce testezi**: Maturarea armei în registru (pending → legal) și cartea fizică de patrulă.
- **Cum testezi**:
  1. Poansonează o armă ca Inspector (apasă `[ 👮 FĂ-MĂ INSPECTOR ]` la pasul 11 dacă ești Civil).
  2. Verifică că arma tocmai poansonată apare în **coada de pending** cu `/straja registry status`.
  3. Rulează `/straja book give @s` și deschide cartea fizică de patrulă primită.
  4. Apasă `[ 🔄 TESTEAZĂ ROLLOVER ]` pentru a simula trecerea zilei (rollover accelerat de test).
  5. Verifică că arma a trecut din pending în **registrul master** după rollover.
- **Rezultat Așteptat**:
  - Arma nou înregistrată NU este imediat legală — stă în coada de pending până la rollover-ul zilei (real-time midnight).
  - Cartea de patrulă fizică conține registrul curent cu indicii subtile (cerneală galbenă, slove romane, ediție numerotată).
  - O armă adăugată **ieri** apare ca legală. O armă adăugată **azi** NU apare ca legală pentru un inspector care verifică cartea veche.
  - Cartea veche de patrulă NU se actualizează automat — trebuie emisă una nouă cu `/straja book give`.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 11: Licențierea Personalului (Inspectori & Transportatori) *(NOU în v1.1.2)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 11` și folosește butoanele `[ 👮 FĂ-MĂ INSPECTOR ]`, `[ 🚚 TRANSPORTATOR ]` sau `[ 👤 CIVIL / INFRACTOR ]` direct din chat!
- **Ce testezi**: Conferirea și revocarea licențelor oficiale Straja, efectele lor la poansonare și la punctele de control.
- **Cum testezi**:
  1. Apasă `[ 👮 FĂ-MĂ INSPECTOR ]` — poansonează o armă → trebuie să iasă **serie autentică `#RC-15-XXXX`**.
  2. Apasă `[ 👤 CIVIL / INFRACTOR ]` — poansonează o altă armă → trebuie să iasă un **fals** (Tier 1/2/3, aleatoriu).
  3. Apasă `[ 🚚 TRANSPORTATOR ]` — treci printr-un checkpoint cu o ladă militară sigilată → **trecere liberă**.
  4. Verifică lista cu `/straja inspector list` și `/straja transporter list`.
- **Rezultat Așteptat**:
  - Inspector autorizat → Poansonare pe nicovală produce serii legale `#RC-15-XXXX`, adăugate automat în pending.
  - Civil neautorizat → Poansonare produce falsuri cu distribuție RNG: **5% T1, 50% T2, 45% T3**.
  - Transportator autorizat sau cu ladă militară sigilată → Scutit la controale, nu este arestat.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 12: Falsificare „Papers, Please" — Identificarea Falsurilor *(NOU în v1.1.2)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 12`, apasă `[ 📦 PACHET FALSURI (T1, T2, T3) ]` pentru a primi mostre gata create, și `[ 👤 FĂ-MĂ CIVIL ]` pentru a testa poansonarea neautorizată!
- **Ce testezi**: Gradele de dificultate ale falsurilor și capacitatea de detectare vizuală.
- **Cum testezi**:
  1. Primești 6 arme din pachetul de falsuri: T1 (Aproape Perfect), T2 (Comun Defectuos), T3 (Grosolan Eșuat), Pilit, Nepoansonat și Legal.
  2. Compară vizual seriile și lore-ul fiecăreia cu un ochi neasistat de comandă — încearcă să le identifici singur.
  3. Ca Civil (apasă `[ 👤 FĂ-MĂ CIVIL ]`), poansonează câteva arme și observă distribuția aleatorie a calității.
  4. Trece un fals T1 printr-un checkpoint → trebuie să **treacă** poarta automată (necesită inspecție manuală de inspector uman).
  5. Trece un fals T3 → trebuie să fie **confiscat imediat** și tu arestat fără avertisment.
- **Rezultat Așteptat**:
  - **T1 (5% șansă)**: Micro-diferență subtilă în serie (`1S` vs `15`, `I5` vs `15`, sau cifră romană inversată). Trece poarta automată.
  - **T2 (50% șansă)**: Font asimetric sau separator greșit (`_` în loc de `-`, verde închis `§2` în loc de `§a`). Trece automatul dar necesită control manual.
  - **T3 (45% șansă)**: Serie complet diferită sau aberantă (`#RUSTY-GUN-99`, lore `Atelier Nereglementat`). Respins și arestat imediat.
  - Arme Pilite (Defaced) și Nepoansonatele → Arestare imediată fără avertisment.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 13: Punctul de Control Straja & Scanerul de Contrabandă *(NOU în v1.1.2)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 13`, apasă `[ ⚡ AUTO-SETUP CHECKPOINT ]` pentru a configura automat mediul, apoi testează cu `[ 🚨 TEST TRECERE LEGALĂ ]` sau `[ 🚨 TEST TRECERE ILEGALĂ ]`!
- **Ce testezi**: Funcționarea punctului de control automat, confiscarea contrabandei și arestarea imediată.
- **Cum testezi**:
  1. Apasă `[ ⚡ AUTO-SETUP CHECKPOINT ]` — checkpoint-ul și celula de arest se configurează **automat la poziția ta curentă**, fără configurare manuală, redstone sau command blocks.
  2. Apasă `[ 🚨 TEST TRECERE LEGALĂ ]` cu o armă legal poansonată sau cu licență de inspector/transportator.
  3. Apasă `[ 🚨 TEST TRECERE ILEGALĂ ]` cu un fals T3, armă pilită sau nepoansonată.
- **Rezultat Așteptat**:
  - Trecere legală → Mesaj verde `Trecere liberă.`, niciun efect negativ.
  - Trecere ilegală cu T3/Defaced/Unmarked → **Confiscare imediată + Arest direct fără avertisment**, modul Adventure activat.
  - Trecere ilegală cu T1/T2 → Detectat ca suspect, blocat la checkpoint, NU arestat automat (necesită inspector uman).
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 14: Arest Penitenciar Automatizat & Eliberare Garantată *(NOU în v1.1.2)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 14`, apasă `[ ⛓️ SIMULEAZĂ AREST ]` pentru a fi arestat, și `[ 🔓 ELIBEREAZĂ-MĂ IMEDIAT ]` pentru eliberare garantată!
- **Ce testezi**: Fluxul complet de arest și eliberare din sistemul penitenciar Straja.
- **Cum testezi**:
  1. Apasă `[ ⛓️ SIMULEAZĂ AREST ]` — ești trimis în modul Adventure și teleportat în celulă.
  2. Încearcă să ieși sau să ataci — nu poți (modul Adventure restricționat).
  3. Apasă `[ 🔓 ELIBEREAZĂ-MĂ IMEDIAT ]` — ești eliberat, modul de joc revine la Survival.
  4. Testează și eliberarea cu operator: `/brass_test release <numeJucător>` sau `/brass_test unjail <numeJucător>`.
- **Rezultat Așteptat**:
  - Arestul activează modul Adventure + teleportare în celula configurată la Step 13.
  - Eliberarea prin `/brass_test release` sau `/brass_test unjail` funcționează **întotdeauna** pentru OP Level 2, indiferent de lista `SP_JAILERS`.
  - Modul de joc revine la Survival, persistentData de arest (`cpJailed`, `cpFugitive`, `strajaThief`) este curățat complet.
  - Nu există niciun scenariu în care testerul rămâne blocat în Adventure permanent.
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 15: Alchimia Netherless — Nivel 1 & 2 (Netherrack, Magmă, Foc, Nisip Suflet) *(NOU în v1.2.0)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 15`, apasă `[ 📦 DĂ-MI KITUL DE TEST ]` (sau `/brass_test netherless`) pentru a primi toate ingredientele minerale și bazinele Create!
- **Ce testezi**: Sinteza mineralelor de bază din Nether în Overworld prin rețete de banc de lucru (Nivel 1) și mixare cinetică neîncălzită în bazin Create (Nivel 2).
- **Cum testezi**:
  1. **Nivel 1 (Manual)**: Deschide masa de lucru și combină Cobblestone + Redstone + Găleată de Lavă $\rightarrow$ obții **1x Netherrack** (găleata goală este returnată).
  2. **Nivel 1 (Manual)**: Combină Slimeball + Sulf Karstic $\rightarrow$ obții **1x Magma Cream**.
  3. **Nivel 1 (Manual)**: Combină Nisip + Oase măcinate + Cărbune + Pământ $\rightarrow$ obții **1x Nisip al Sufletelor** (sau Nisip al Pământului).
  4. **Nivel 2 (Cinetic)**: Plasează un Bazin Create cu mixer mecanic (neîncălzit) alimentat prin rotație. Pune 1 Cobble + 1 Redstone + 100 mB Lavă $\rightarrow$ mixerul produce **2x Netherrack** (randament dublu).
  5. **Nivel 2 (Cinetic)**: Pune 2x Slimeball + 100 mB Lavă în bazin neîncălzit $\rightarrow$ produce **3x Magma Cream**.
- **Rezultat Așteptat**:
  - Rețetele manuale funcționează direct în masa de lucru fără nicio sursă de energie externă.
  - Mixarea cinetică Create dublează sau triplează randamentul resurselor.
  - Nu este necesar niciun acces sau portal în Nether!
> ⏩ **Validare Pas**: Apasă `[ ✔ CONFIRMĂ & PASUL URMĂTOR ▶ ]` în chat pentru a avansa.

---

### ✅ Testul 16: Alchimia Netherless — Nivel 3 (Tije de Văpaie, Cuarț, Supapă Blaze Burner & Lacrimi) *(NOU în v1.2.0)*
> 💡 **Comandă Rapidă 1-Click**: Rulează `/brass_test 16`, apasă `[ 📦 DĂ-MI KITUL DE TEST ]` pentru șmirghel, ventilatoare, prese, cuști de burner și roți de măcinare!
- **Ce testezi**: Spălarea cu ventilator, șlefuirea tijelor de cărbune, asamblarea secvențială, trezirea catalitică a arzătorului Blaze Burner și saltul termic de 400% (Nivel 3 Surge).
- **Cum testezi**:
  1. **Test Cuarț Nivel 2**: Plasează un Nisip al Sufletelor în fața unui ventilator Create suflând prin apă (Splashing) $\rightarrow$ obții **1x Cuarț Nether + 25% Pepite de Aur**.
  2. **Test Tije de Văpaie**: Lustruiește un cărbune cu șmirghel (`create:sand_paper`) $\rightarrow$ obții o **Tijă de Cărbune** (`kubejs:coal_rod`). Infuzează tija cu sulf și lavă în bazin sau pe bandă de asamblare secvențială $\rightarrow$ obții **Tije de Văpaie**.
  3. **Test Trezire Blaze Burner (Nivel 2)**: Pune într-un bazin neîncălzit cu mixer o Cușcă Burner (`create:empty_blaze_burner`) + 4 Sulf + 2 Salpetru + Magmă + 1000 mB Lavă $\rightarrow$ se trezește un nou **Blaze Burner activ** (`create:blaze_burner`)!
  4. **Test Nivel 3 Surge Termic (400%)**: Aprinde un Blaze Burner sub un bazin Create. Amestecă 4 Nisip + 2 Salpetru + 1 Sulf + 250 mB Lavă $\rightarrow$ mixerul produce **16 Nisip al Sufletelor** (salt masiv de 400%)!
  5. **Test Lacrimi Ghast Nivel 3**: Distilează termic 4 Slimeball + 2 Salpetru + 1 Sulf + 500 mB Apă $\rightarrow$ obții **8 Lacrimi de Ghast**.
- **Rezultat Așteptat**:
  - Economia de Nether este 100% regenerabilă și integrată perfect cu mașinăriile Create.
  - Producția industrială avansată este răsplătită cu randamente masive (400%+ surge cu încălzire și sulf).
> ⏩ **Validare Finală**: Apasă `[ ✔ CONFIRMĂ & FINALIZEAZĂ TESTUL! ]` pentru a vedea ecranul festiv de completare a suitei de 16 scenarii!

---

## 📝 5. Cum raportezi probleme (Feedback Template)

Dacă găsești vreo problemă în timpul testelor, trimite un raport folosind următorul format:

```markdown
**Testul Efectuat**: [Ex: Testul 3 - HUD Reîncărcare]
**Ce s-a întâmplat**: [Descrierea comportamentului observat]
**Ce te așteptai să se întâmple**: [Comportamentul conform ghidului]
**Pași de reproducere**:
1. Am luat muscheta...
2. Am apăsat tasta...
**Screenshots / Erori în chat**: [Dacă este cazul]
```

---

*Succes la testare, ostași ai Garnizoanei Straja! Trageți drept și țineți pulberea uscată.*
