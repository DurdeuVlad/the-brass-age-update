# ⚜ The Brass Age Update v1.1.2 — Garrison Registry & Counterfeit System ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified on Live Dedicated Server with 26/26 Automated Tests Passing (0 KubeJS Errors)

---

## 🎯 Rezumatul Lansării (Release Highlights)

Versiunea **v1.1.2** aduce arhitectura completă de control al armamentului pentru Garnizoana Straja și lumea interlopă a modpack-ului:
1. **Registrul Central al Garnizoanei Straja**: Evidență durabilă a armelor și posesorilor, cu perioadă de maturare pending de 24h (o zi din viața reală) pentru orice armă nou înregistrată.
2. **Cărți Fizice de Patrulă Straja (`/straja book give`)**: Ghid de rol și registru de patrulă pentru ostași, conținând indicii vizuale subtile de inspecție (fără spoilere de mecanică) care **nu se actualizează automat** pe teren, cerând soldaților să ceară zilnic o ediție nouă de la garnizoană.
3. **Licențiere Oficială de Inspectori & Transportatori (`/straja inspector` & `/straja transporter`)**: Doar inspectorii licențiați pot bate pe nicovală poansoane autentice și emite permise. Transportatorii licențiați și transportul în lăzi militare sigilate sunt protejate la punctele de control.
4. **Falsificare "Papers, Please" pe Piața Neagră**: Civilii și infractorii neautorizați care încearcă să bată sigiliul imperial produc falsuri pe o curbă de probabilitate calibrată:
   - **5% Nivel 1 (Aproape Perfect)**: Detalii foarte subtile (ex: cifră romană greșită `#RC-XV-`), trece neobservat la ocheade rapide.
   - **50% Nivel 2 (Comun Defectuos)**: Erori vizibile (ex: font asimetric, separatori greșiți `#RC-15_`), identificabil rapid de patrule vigilente.
   - **45% Nivel 3 (Grosolan Eșuat)**: Fals caraghios și grosolan (ex: `#RUSTY-GUN-99`), duce la alarmă imediată și arestare fără avertisment.
5. **Integrare Puncte de Control & Penitenciar**: Scanerele de contrabandă de la porți confiscă automat armele neînregistrate, armele pilite (defaced) și falsurile grosolane de nivel 3, trimițând făptașul direct în celulele închisorii Straja.
6. **Suita de Testare Automatizată (`/straja test`)**: 26/26 aserțiuni verificate empiric, inclusiv simulare Monte Carlo de 10.000 de iterații pentru distribuția RNG a falsurilor.

---

## 📦 Pachete de Descărcat (Release Downloads)

1. **`TheBrassAge-Update-All-In-One-v1.1.2.zip`** *(Recomandat)*:
   - Conține pachetul complet actualizat (mods, configs, kubejs server/client/startup, tacz gunpacks, cărți patchouli, lăzi militare, registre și texturi pixel-art).
   - Soluția completă pentru Singleplayer și actualizare drop-in.
2. **`TheBrassAge-Update-Server-v1.1.2.zip`**:
   - Pachet complet optimizat exclusiv pentru administratorii de servere dedicate.
3. **`TheBrassAge-Update-Client-v1.1.2.zip`**:
   - Pachet optimizat pentru clienți și jucători care se conectează la un server dedicat.

---

## 🛠️ Ghid Rapid de Instalare (1-Click)

1. Deschideți folderul instanței de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.1.2.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau click-dreapta `Run with PowerShell` pe `install_patch.ps1`).
4. Porniți jocul!

---

## 📋 Comenzi Administrative & Verificare în Joc

- `/straja test` — Execută suita completă de 26 teste automate (verificare instantanee a întregului sistem).
- `/straja inspector add|remove|list|check <nume>` — Gestionează inspectorii autorizați de armament.
- `/straja transporter add|remove|list|check <nume>` — Gestionează transportatorii autorizați de logistică.
- `/straja register_serial <serie> <posesor>` — Adaugă o armă în lista de așteptare (pending).
- `/straja rollover` — Forțează trecerea zilei și maturarea armelor din pending în registrul oficial activ.
- `/straja lookup <serie>` — Interoghează starea legală a unei arme după serie.
- `/straja book give [jucător]` — Oferă cartea fizică de patrulă a garnizoanei (cu indicii de inspecție și registrul activ).
- `/straja checkpoint status` — Afișează starea punctelor de control și a scanerelor de contrabandă.
- `/straja prison status` — Afișează starea celulelor de detenție și a cufărelor de confiscări.
