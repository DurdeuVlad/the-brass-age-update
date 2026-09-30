# ⚜ THE BRASS AGE UPDATE — TESTER & REVIEW GUIDE ⚜
### Ghid de Testare & Instalare pentru Testeri (Rustic Craft II)

Versiune: `v1.0.0-Release`  
Platformă: `Minecraft 1.21.1` / `NeoForge 21.1.248`  
Modpack: **Rustic Craft II**  
Repository: `DurdeuVlad/the-brass-age-update`

---

## 📦 1. Ce conține acest pachet de export?

Acest export conține sistemul complet al expansiunii **The Brass Age**:
1. **Arme cu Cremene Autentice**: Muscheta cu țeavă lisă FK15 (140ms timp de dare a focului, dispersie conică), Pistolul de cavalerie FK15-P, Muscheta ghintuită FK15-R Jaeger.
2. **Limită Realistă de Transport & Lăzi Militare**: Pe jos, ostașul poartă maxim 1 armă lungă (muschetă) pe spate și 2 arme scurte (pistoale) la brâu. Pentru transportul de mari cantități, armamentul se ambalează în **Lăzi Militare Sigilate** (`kubejs:crate_muskets` - 8 muschete, `kubejs:crate_pistols` - 8 pistoale, `kubejs:ammunition_crate` - 256 muniții), ideale pentru transportul în căruțe de povară (*Trotting Wagons*), vagoane de tren Create sau animale de povară.
3. **Muniție & Război Supranatural**: Cartușe sfințite de argint (daune 4× împotriva strigoilor/nemorților și 2× împotriva vampirilor), Mitralii (Canister Shot - 8 alice) și Gloanțe Incendiare de sulf.
4. **Economie Industrială pe 3 Niveluri (Factorio-Style)**: Rafinarea pulberii negre (Mojar manual -> Moară cu ciocane Create & Corning -> Linie chimică automatizată de asamblare secvențială).
5. **5 Linii Civile P.U.L.A SRL**: Benzi de sulf pentru vinificație (Vinery), Îngrășământ mineral Super-Fosfat (creștere triplă a recoltelor), Săpun medicinal antiseptic de sulf, Chibrituri de siguranță, Piele grea tratată cu vitriol.
6. **Mina Continentală Straja**: Integrare completă în motorul de mine `custom_mines` cu 3 zone de adâncime (Galerie carstică de sulf, Fisiuri de salpetru, Adâncuri de saramură și alamă).
7. **Sistem Legal de Poansonare & Piață Neagră**: Armele noi sunt contrabandă (`NEPOANSONAT`); baterea pe nicovală cu Sigiliul Imperial aplică serie unică `#RC-15-XXXX`; polizarea pe tocilă (grindstone) pilește seria pentru lumea interlopă.
8. **UX Prietenos**: Comenzi universale `/flintlock` și `/arma`, HUD dinamic pe actionbar la reîncărcare (numărătoare inversă 20s, avertizare la sprint).

---

## 🚀 2. Instalare Rapidă (Quick Start)

### Opțiunea A: Pentru Testeri Client / Singleplayer (Cea mai comună)
1. Deschide launcher-ul tău de Minecraft (Prism Launcher, CurseForge, Modrinth sau ATLauncher).
2. Dă click-dreapta pe instanța **Rustic Craft II** și alege **Open Folder** / **Folder Instanță** (unde se află folderele `mods`, `config`, `kubejs`).
3. Descarcă arhiva **`TheBrassAge-Update-All-In-One-v1.0.0.zip`**.
4. Extrage conținutul arhivei direct peste instanța ta, permițând suprascrierea fișierelor (Overwrite All):
   - `kubejs/` -> se îmbină cu folderul `kubejs` existent
   - `patchouli_books/` -> se copiază în folderul principal
   - `tacz/` -> se copiază în folderul principal
   - `mods/` -> adaugă TaCZ și compatibilitățile necesare
   - `config/` -> actualizează configurațiile de rucsac și depozitare
5. Pornește jocul!

### Opțiunea B: Pentru Administratori de Server Dedicat
1. Oprește serverul (`stop`).
2. Descarcă **`TheBrassAge-Update-Server-v1.0.0.zip`** (sau `All-In-One`).
3. Extrage în rădăcina serverului dedicat.
4. Repornește serverul.

---

## 🛠 3. Cheat Sheet & Comenzi de Pornire Rapidă

Pentru a testa rapid fără a mina resursele manual, deschide chat-ul și folosește următoarele comenzi:

### Manual & Ghiduri
- `/flintlock` sau `/arma`  
  *Afișează cartonașul ghid complet de tragere, ochire și reîncărcare.*
- `/function kubejs:give_gunsmith_manual`  
  *Îți oferă direct în inventar cartea oficială Patchouli "Manualul Armurierului" (The Rustic Gunsmith).*

### Comenzi Vampirism (pentru testul de argint)
- `/vampire add <jucător>`  
  *Marchează un jucător ca Vampir (vulnerabil la argint: 2× damage).*
- `/vampire check <jucător>`  
  *Verifică dacă jucătorul este marcat ca Vampir.*
- `/vampire remove <jucător>`  
  *Elimină statutul de Vampir.*

### Give Arme & Muniție
```
/give @s tacz:modern_kinetic_gun[tacz:gun_id="qkl:fk15"] 1
/give @s tacz:modern_kinetic_gun[tacz:gun_id="qkl:fk15p"] 1
/give @s tacz:ammo[tacz:ammo_id="qkl:round_ball_silver"] 64
/give @s tacz:ammo[tacz:ammo_id="qkl:canister_shot"] 64
/give @s tacz:ammo[tacz:ammo_id="qkl:incendiary_round"] 64
/give @s tacz:ammo[tacz:ammo_id="qkl:round_ball"] 64
```

### Give Obiecte Legale & Civile
```
/give @s kubejs:proof_stamp 1
/give @s kubejs:permit_blank 4
/give @s kubejs:miracle_fertilizer 64
/give @s kubejs:sulfur_soap 16
/give @s kubejs:safety_matches 16
/give @s kubejs:fumigation_strip 16
/give @s kubejs:vitriol_leather 16
```

---

## 🧪 4. Scenarii de Testare Pas-cu-Pas (Test Checklist)

### ✅ Test 1: Balistică cu Cremene & Timp de Dare a Focului (140ms Lock-Time)
- **Ce testezi**: Întârzierea mecanică dintre apăsarea pe trăgaci și plecarea glonțului.
- **Acțiune**: Încarcă muscheta FK15. Ochește o țintă la 20 de metri și apasă click-dreapta.
- **Comportament Așteptat**: Vei auzi scăpărarea cremenei, o mică fracțiune de secundă de întârziere (140ms - arderea pulberii din tigaie), urmată de bubuitura masivă a țevii. Dacă miști arma brusc în acele 140ms, tragi pe lângă țintă!

### ✅ Test 2: Poziția în Genunchi (Kneel / SHIFT Dispersion)
- **Ce testezi**: Reducerea dispersiei când pui genunchiul la pământ.
- **Acțiune**: Trage 3 focuri din picioare la 40 de metri. Apoi ține apăsat `SHIFT` (genunchi pus la sol pentru sprijinirea țevii grele) și trage alte 3 focuri.
- **Comportament Așteptat**: Din picioare, dispersia este largă (con istoric). În genunchi, dispersia scade cu ~70%, permițând lovituri precise.

### ✅ Test 3: HUD Dinamic pe Actionbar la Reîncărcare (20s)
- **Ce testezi**: Feedback-ul vizual și sonor în timpul reîncărcării.
- **Acțiune**: Apasă tasta `[R]` pentru a reîncărca muscheta.
- **Comportament Așteptat**:
  1. Se aude sunetul de turnare a pulberii din corn în țeavă.
  2. Pe Actionbar (deasupra barei de viață) apare numărătoarea inversă cu contrast ridicat:  
     `[Muschetă] Încarci pulberea și glonțul... 18.4s (Nu schimba arma, nu sprinta!)`
  3. La finalul celor 20s, se aude un sunet mecanic puternic de armare a cocoșului și mesajul verde `Armă încărcată și armată!`.
- **Test Suplimentar (Anulare Sprint)**: Pornește reîncărcarea și sprintează sau schimbă slotul.  
  *Rezultat*: Reîncărcarea este anulată instant cu mesajul roșu `✖ Reîncărcare anulată (sprint sau armă schimbată)!`.

### ✅ Test 4: Limita de Transport pe Jos & Transportul în Vrac cu Lăzi Militare și Căruțe
- **Ce testezi**: Restricția la maxim 1 muschetă și 2 pistoale pe jos, și transportul de mari cantități folosind Lăzile de Armament.
- **Test 4A (Pe jos)**: Pune în inventar 1 muschetă și 2 pistoale. Apoi încearcă să mai iei de pe jos sau dintr-un cufăr încă o muschetă.  
  *Rezultat*: A doua muschetă va cădea imediat pe pământ la picioarele tale, însoțită de un mesaj clar: `Nu poți purta mai mult de 1 armă lungă pe umeri!`.
- **Test 4B (Ambalare în Ladă de Muschete)**: Folosește rețeta din masa de lucru (8 muschete în jurul unui cufăr de lemn) sau dă-ți o ladă: `/give @s kubejs:crate_muskets 4`.  
  *Rezultat*: Lăzile de armament sunt obiecte sigilate de transport și NU cad pe sol! Poți purta zeci de lăzi în inventar, căruțe de povară (*Trotting Wagons: Conestoga Wagon*) sau vagoane Create.
- **Test 4C (Desigilare Ladă)**: Ține `Lada de Muschete` în mână și apasă `Shift + Click-Dreapta` pe sol (sau plaseaz-o în masa de lucru).  
  *Rezultat*: Se aude sunetul de rupere a scândurilor și lada se desface, descărcând pe loc cele 8 muschete și returnând cufărul!

### ✅ Test 5: Cartușe Sfințite de Argint vs Nemuritori & Vampiri
- **Ce testezi**: Multiplicatorii de daune supranaturale și selectarea muniției din mâna secundară (*Offhand*).
- **Acțiune**:
  1. Plasează `Glonț de Argint` în mâna secundară (slotul de scut/offhand, tasta `F`).
  2. Apasă `[R]` pentru reîncărcare. Muscheta se va încărca cu glonțul de argint din mâna secundară.
  3. Trage într-un Zombie sau Schelet.
  4. Trage într-un jucător marcat cu `/vampire add <nume>`.
- **Comportament Așteptat**:
  - La impact, se aude un clopoțel de ametist (`minecraft:block.amethyst_block.hit`).
  - Nemorții primesc daune cvadruple (**4.0×**), murind dintr-o singură lovitură.
  - Vampirii primesc daune duble (**2.0×**).

### ✅ Test 6: Muniție Tactică — Mitralii (Canister) & Incendiar
- **Ce testezi**: Împrăștierea de alice și focul persistent.
- **Acțiune**: Încarcă un `Canister Shot` din mâna secundară și trage într-un grup de mobi la mică distanță. Apoi trage cu un `Incendiary Round`.
- **Comportament Așteptat**: Mitraliile aruncă 8 fragmente de schije care lovesc mai multe ținte simultan. Glonțul incendiar aprinde ținta în flăcări timp de 8 secunde.

### ✅ Test 7: Sistem Legal de Poansonare, Serii & Piață Neagră
- **Ce testezi**: Traseul legal al armelor de la fabrică până la jandarmerie.
- **Acțiune**:
  1. Dă-ți o muschetă nouă: tooltip-ul va afișa `§cNEPOANSONAT (Contrabandă)`.
  2. Pune muscheta pe o Nicovală (*Anvil*), iar în al doilea slot pune un `Sigiliu Imperial` (`kubejs:proof_stamp`).
  3. Asigură-te că ai cel puțin 5 niveluri de experiență și ridică arma.
  4. Ține arma poansonată în mâna stângă (offhand) și dă click-dreapta cu un `Permis Blank` (`kubejs:permit_blank`) în mâna dreaptă.
  5. Ia arma poansonată și pune-o pe o Tocilă (*Grindstone*).
- **Comportament Așteptat**:
  - Nicovala ștanțează o serie unică secvențială (ex: `✔ POANSONAT: #RC-15-0101`).
  - Permisul devine o carte oficială scrisă semnată de Comandamentul Garnizoanei Straja cu numele tău și seria armei.
  - Tocila rade seria mecanic, transformând arma în `⚠ [SERIE PILITĂ / DEFACED]` pentru contrabandiști.

### ✅ Test 8: Cele 5 Linii Civile P.U.L.A SRL
- **Săpun cu Sulf** (`kubejs:sulfur_soap`): Dă-ți efect de otravă (`/effect give @s poison 30 1`) și folosește săpunul prin click-dreapta.  
  *Rezultat*: Efectul de otravă este curățat instant.
- **Îngrășământ Super-Fosfat** (`kubejs:miracle_fertilizer`): Aplică prin click-dreapta pe culturi de grâu/cartofi.  
  *Rezultat*: Planta crește instant cu 3 stadii (triplul făinii de oase obișnuite).
- **Chibrituri de Siguranță** (`kubejs:safety_matches`): Dă click-dreapta pe sol sau pe un foc de tabără stins.  
  *Rezultat*: Aprinde focul garantat.
- **Benzi de Fumigație** (`kubejs:fumigation_strip`): Ingredient vital pentru sterilizarea butoaielor de stejar Vinery.
- **Piele cu Vitriol** (`kubejs:vitriol_leather`): Piele tratată cu acid pentru armuri de durabilitate mare.

### ✅ Test 9: Mina Continentală Straja
- **Ce testezi**: Deblocarea noilor filoane carstice în motorul `custom_mines`.
- **Acțiune**: Interacționează cu NPC-ul Mirel la mina din Straja.
- **Comportament Așteptat**: Dialogul include cele 3 zone de extracție (`mina_straja_continent`), oferind minereu de sulf, salpetru și adâncuri de saramură.

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
