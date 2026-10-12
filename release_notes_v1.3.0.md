# ⚜ The Brass Age Update v1.3.0 — 100% In-Universe Roleplay, Sensory "Papers, Please" Cues, High-Stakes Checkpoints & Prison Escapes ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified on Live Dedicated Server with 30/30 Automated Tests Passing (0 Overflows across 270 Pages)

---

## 🎯 Rezumatul Lansării v1.3.0 (Release Highlights)

Versiunea minoră **v1.3.0** aduce transformarea completă a modpack-ului într-o experiență **100% In-Universe Medieval Roleplay**, eliminând orice urmă de alertă tehnică, ID-uri de sistem sau mesaje meta, în favoarea unei atmosfere imersive de tensiune, suspans și dramă:

1. **Eliminarea Totală a Spoilerelor Meta & Atmosferă Sonoră de Rol**:
   - Toate textele robotice de sistem (`[Server]`, `[DEBUG]`, `NBT`, `Ilegal`, `[Arsenal]`, `minecraft:item_id`) au fost complet eliminate din experiența de joc.
   - Peste 6 straturi audio ambientale tactile au fost integrate fără dependențe externe:
     - Bătăile inimii la control (`minecraft:entity.warden.heartbeat`).
     - Zăngănitul armurii de fier a gărzilor (`minecraft:item.armor.equip_iron`).
     - Cătușe grele de fier și trântirea ușilor celulei (`minecraft:item.armor.equip_chain`, `minecraft:block.iron_door.close`).
     - Clopotele masive de alarmă din turn (`minecraft:block.bell.use`) și cornul de vânătoare (`minecraft:item.goat_horn.sound.0`) la evadare.
     - Scârțâitul lacătului deschis la grațiere (`minecraft:block.iron_door.open`, `minecraft:item.armor.equip_leather`).

2. **Indicii Senzoriale Fizice în Stil „Papers, Please” pentru Arme Falsificate**:
   - Armele măsluite pe nicovală clandestină nu mai afișează mesaje directe de contrabandă, ci indicii fizice de epocă pe care soldații și jucătorii le pot cerceta:
     - **Tier 1 (5% Fals Aproape Perfect)**: Micro-greșeli de tipar în serie (`#RC-1S-XXXX` sau `#RC-I5-XXXX` în loc de `15-`) și punct subtil la finalul ștanței imperiale.
     - **Tier 2 (50% Fals Comun)**: Cerneală oxidată verde-închis de vitriol (`§2`) și lipsa literei `l` în Registru (`Registru Imperial Straja`).
     - **Tier 3 (45% Fals Grotesc / Tinichea)**: Cerneală gălbuie de chihlimbar (`§6`), ștanță descentrată cu bavuri aspre și greșeli grosolane de ortografie (`POASONAT` fără `N`, `Garnisoana`).
     - **Arme Pilite (Piața Neagră)**: Urme adânci de tocilă mecanică și ștergerea completă a marcajului imperial de pe culată (`§4⚠ SERIE PILITĂ DE PE CULATĂ`).

3. **Puncte de Control de Mare Tensiune la Hotar („Butt-Wrenching Moments”)**:
   - Inspecție în două etape: soldatul din avanpost bate cu pumnul în desagă, cere socoteală pentru marfă și face un semn discret către lada de descărcare de la perete, oferind călătorului șansa de a scăpa înainte de a da ochii cu sergentul la poarta a doua.
   - Vameși și pontonieri de rol (*Portărel*, *Vameș Ponton*) care ștampilează tichetele de călătorie la ambarcațiuni.

4. **Dramă Penitenciară & Evadări Spectaculoase („Close Escapes”)**:
   - **Arest Cinematic**: Sergentul ordonă predarea armelor, ecranul se întunecă și se aud cătușele de fier.
   - **Sosirea în Celulă & Procesul-Verbal**: Ușa grea se trântește cu ecou în piatră, iar deținutul primește pe sub grilaj un pergament oficial cu sigiliu de ceară roșie („Pergament de Arestare - Garnizoana Straja”).
   - **Evadarea din Temniță**: La părăsirea perimetrului celulei, clopotul din turn începe să bată neîncetat, cornul de vânătoare răsună în toată garnizoana, fugarul primește titlul de `EVADARE!`, iar tot serverul este alertat de urmărirea generală.
   - **Recapturare & Grațiere**: Zăvorul trântit cu dialog de strajă la prindere; eliberare cu zornăit de chei și restituirea lăzii personale la grațiere.

5. **Comutatorul Persistent Admin Debug (`/straja debug on|off|status`)**:
   - Permite administratorilor (OP 2) să comute la nevoie între regimul 100% Roleplay (implicit) și modul de diagnostic tehnic cu afișare de ID-uri brute.

6. **Voce de Rol pentru Limita Militară de Purtare**:
   - Notificarea mecanică a fost înlocuită cu replica miliției: *„[Miliție] Povara e prea mare! Cureaua nu poate ține mai mult de o pușcă pe spate și două pistoale la brâu.”* însoțită de sunet de curea de piele.

7. **Verificare Empirică Completă**:
   - **30/30 Teste Automate Trecute (100% PASS)** pe serverul dedicat live NeoForge 21.1.248.
   - **270 Pagini Patchouli** verificate fără depășiri de text.

---

## 📦 Pachete de Descărcat (Release Downloads v1.3.0)

1. **`TheBrassAge-Update-All-In-One-v1.3.0.zip`** *(Recomandat)*:
   - Conține pachetul complet actualizat (mods, configs, kubejs server/client/startup, tacz gunpacks, cărți patchouli, lăzi militare, rețete Netherless, texturi pixel-art și sistemul complet de roleplay).
   - Soluția completă pentru Singleplayer și actualizare drop-in.
2. **`TheBrassAge-Update-Server-v1.3.0.zip`**:
   - Pachet optimizat exclusiv pentru administratorii de servere dedicate.
3. **`TheBrassAge-Update-Client-v1.3.0.zip`**:
   - Pachet optimizat pentru clienți și jucători care se conectează la un server dedicat.

---

## 🛠️ Ghid Rapid de Instalare (1-Click)

1. Deschideți folderul instanței de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.3.0.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau click-dreapta `Run with PowerShell` pe `install_patch.ps1`).
4. Porniți jocul!
