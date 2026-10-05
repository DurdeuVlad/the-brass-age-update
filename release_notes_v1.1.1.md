# ⚜ The Brass Age Update v1.1.1 — Tester Patch & Critical Fixes ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified on Live Dedicated Server with 0 KubeJS Errors

---

## 🎯 Rezumatul Lansării (Release Highlights)

Această versiune rezolvă toate problemele raportate de testeri pe serverul dedicat și în sesiunile de client singleplayer, aducând compatibilitate și stabilitate totală pentru mecanicile tactice și de armament ale expansiunii **The Brass Age**.

---

### 🐛 Remedieri Critice & Mecanici Noi (Bug Fixes & Refinements)

#### 1. 📦 Despachetarea Lăzilor Militare pe Sol (`weaapon crate nu merge pus pe jos`)
- **Problemă**: Lăzile militare de transport (`kubejs:crate_muskets`, `kubejs:crate_pistols`, `kubejs:ammunition_crate`) nu puteau fi deschise făcând click-dreapta pe sol.
- **Remediere**: Adăugat handler dedicat `BlockEvents.rightClicked` în `military_logistics_crates.js`. Click-dreapta pe sol sau pe orice bloc solid desigilează lada, descarcă armamentul (8 muschete, 8 pistoale sau 256 cartușe) pe bloc sau la picioare, returnează un cufăr de lemn gol (`minecraft:chest`), redă sunetul de rupere a lemnului și generează particule de stejar.

#### 2. 🛡️ Închiderea Breșei de Purtare prin Masa de Crafting (`armele pot sa fie luate in inv daca le pui in crafting table`)
- **Problemă**: Jucătorii puteau ocoli limita de purtare (1 armă lungă, 2 pistoale) plasând arme suplimentare în grila 3×3 a mesei de crafting sau 2×2 din inventar.
- **Remediere**: Reconstruit `flintlock_carry_limits.js` cu scanare de adâncime a containerelor și interceptarea evenimentului `$PlayerContainerCloseEvent`. La închiderea oricărei interfețe GUI (crafting table, cufăr, nicovală), toate sloturile sunt evaluate strict; armele în exces dincolo de pragul legal cad instantaneu pe sol la picioarele jucătorului cu semnal de alarmă sonor și mesaj de la garnizoană.

#### 3. ⚙️ Pilirea Serie pe Tocilă în Lume (`nu pot scoate seria de pe arme`)
- **Problemă**: Jucătorii din lumea interlopă nu puteau pili seria de pe armele legale pe blocul de tocilă (*Grindstone*).
- **Remediere**: Implementată interacțiunea directă în lume prin `flintlock_proofing_legal.js`. Click-dreapta pe un bloc de Grindstone având în mâna principală o armă poansonată pilește seria, șterge etichetele `Serial` și `Proofed`, setează `Defaced: 1b`, redă sunetul de polizare (`block.grindstone.use`) cu particule de piatră și atașează lore-ul roșu de contrabandă `§c⚠ [SERIE PILITĂ / DEFACED]`.

#### 4. ⚡ Variațiuni Tactice de Muniție Funcționale (`nu merg variatunile de ammo`)
- **Problemă**: Cartușele de argint, mitralii și incendiare încărcate în arme nu aplicau efectele speciale la tragere.
- **Remediere**: Re-arhitecturat `flintlock_ammo_silver_combat.js` utilizând evenimentele native TaCZ KubeJS (`TimelessGunEvents`):
  - **Glonț de Argint Consfințit**: Încărcat din mâna secundară (offhand). Aplică **4.0× daune sfinte** împotriva strigoilor/nemorților (one-shot kill garantat la 160 daune) și **2.0× daune** împotriva vampirilor, cu clinchet sfânt de ametist.
  - **Mitralii (Canister Scattershot)**: Dispersie largă ce aplică impuls masiv de respingere orizontală (`target.knockback(2.0, ...)` cu sincronizare de impuls în rețea).
  - **Cartuș Incendiar cu Sulf**: Aprinde ținta în flăcări timp de **8 secunde consecutive** (160 tick-uri de foc).
  - **Comutare Dinamică**: Eliminată blocarea tipului de muniție; schimbarea cartușelor din offhand la reîncărcare actualizează instantaneu camera armei.

#### 5. 📜 Validare Dual-Hand Permise & Respingere Arme Defaced (`[Permis] Arma din mâna stângă nu este poansonată legal!`)
- **Problemă**: Emiterea permiselor dădea erori din cauza verificării neclare a sloturilor sau permitea ștanțarea armelor pilite.
- **Remediere**: Adaptat `flintlock_proofing_legal.js` pentru validare strictă în ambele mâini: click-dreapta cu `kubejs:permit_blank` în mâna principală și arma legal poansonată în mâna stângă (offhand) emite o carte scrisă `minecraft:written_book` semnată de Gheorghe Comandantul. Armele de contrabandă/pilite (`Defaced: 1b`) sunt refuzate categoric, fără a consuma formularul de permis.

#### 6. 🚀 Stabilitate Motor de Scripturi (Rhino JS Scoping)
- **Problemă**: La pornirea pe NeoForge 21.1.248, scriptul de durabilitate `steel_durability.js` cauza crash în faza de bootstrap (`Redeclaration of const mults`).
- **Remediere**: Convertite declarațiile lexicale din interiorul callback-urilor de modificare în variabile `var`, asigurând încărcarea completă și curată a tuturor celor 52/52 scripturi KubeJS (0 erori).

---

## 📦 Pachete de Descărcat (Release Downloads)

1. **`TheBrassAge-Update-All-In-One-v1.1.1.zip`** *(Recomandat)*:
   - Conține întregul pachet actualizat (mods, configs, kubejs server/client/startup, tacz gunpacks, cărți patchouli, lăzi militare și texturi pixel-art).
   - Ideal atât pentru Singleplayer cât și pentru actualizarea rapidă a instanței de joc.
2. **`TheBrassAge-Update-Server-v1.1.1.zip`**:
   - Pachet complet optimizat pentru administratorii de servere dedicate.
3. **`TheBrassAge-Update-Client-v1.1.1.zip`**:
   - Pachet optimizat pentru clienți / jucători conectându-se la un server dedicat.

---

## 🛠️ Ghid Rapid de Instalare (1-Click)

1. Deschideți folderul instanței voastre de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.1.1.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau `install_patch.ps1`).
4. Porniți jocul!
