# ⚜ The Brass Age Update v1.2.0 — Netherless Industrial Synthesis & Typography Engine ⚜
**Target Modpack**: Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248 / Create 6 / TaCZ / KubeJS)  
**Status**: 100% Empirically Verified on Live Dedicated Server with 30/30 Automated Tests Passing (0 Overflows across 270 Pages)

---

## 🎯 Rezumatul Lansării v1.2.0 (Release Highlights)

Versiunea minoră **v1.2.0** introduce integrarea industrială completă a tehnologiei Netherless în modpack, garantează o experiență de lectură impecabilă în cărțile in-game și aduce instrumente avansate de testare pentru inspectori și testeri:

1. **Alchimia Netherless Create pe 3 Niveluri Industriale (`create_netherless_pyro.js`)**:
   - Resursele din Nether sunt complet regenerabile în Overworld prin respectarea strictă a standardului industrial:
     - **Nivel 1 (Manual de Urgență)**: 1× randament pe bancul de lucru clasic sau cu unelte manuale.
     - **Nivel 2 (Cinetic Mecanic Create)**: 2×–4× randament folosind bazine de mixare neîncălzite, spălare cu ventilator și lustruire cu șmirghel.
     - **Nivel 3 (Surge Termic cu Sulf & Asamblare Secvențială)**: 8×–16× randament (salt industrial de 400%+) alimentat de bazine încălzite cu arzătoare Blaze Burner, benzi de asamblare și roți de concasare Create.
   - **8 Linii de Producție (38 Rețete)**: Netherrack, Cremă de Magmă, Încărcături de Foc, Nisip/Pământ al Sufletelor, Cuarț Nether, Tije de Văpaie (Blaze Rods), Arzătoare Blaze Burner și Lacrimi de Ghast / Obsidian Plângător.

2. **Motorul de Tipografie & Guardrails Zero-Overflow pentru Cărți (`tools/validate_patchouli.py`)**:
   - Sistem automatizat de auditare a paginilor din cărțile Patchouli (lățime 116px, ~20–21 caractere/linie, maxim 10 linii pe Pagina 1, maxim 13 linii pe Pagina 2+, maxim 8 linii pe paginile Spotlight).
   - **Toate cele 270 de pagini** din cărțile de pe server și client au fost verificate și optimizate: **0 depășiri de text, 0 coliziuni grafice cu chenarul pergamentului**.
   - Capitole noi adăugate în Manualul Armurierului: *Netherless Alchemy* și *Blaze Burner Awakening*.

3. **Ghid Interactiv de Testare Extins la 16 Pași (`admin_test_runner.js`)**:
   - Adăugate scenariile **Pasul 15** (Netherless N1 & N2) și **Pasul 16** (Netherless N3 & Trezire Blaze Burner).
   - Comenzi rapide adăugate:
     - `/brass_test help` — Afișează sumarul comenzilor în chat.
     - `/brass_test netherless` (sau `/brass_test pyro`) — Distribuie kitul industrial complet (minerale, chimicale, utilaje Create).
     - Butoane interactive cu 1-click în chat pentru echipare, spawnare de ținte și navigare între pași.

4. **Suită de Testare Automatizată 30/30 Aserțiuni (`/straja test`)**:
   - 30/30 aserțiuni trecute cu 100% succes pe serverul dedicat live, inclusiv noua Suită 6 de verificare a celor 38 de rețete alchimice pe toate cele 3 niveluri.

5. **Corecturi Critice de Securitate & Compatibilitate**:
   - Rezolvat ID-ul de șmirghel conform Create 1.21.1 (`create:sand_paper`).
   - Eliminat apelurile ilegale la variabila `global` în scripturile KubeJS conform sandbox-ului Rhino 1.21.1.
   - Corectat bug-ul de generare aleatorie a documentelor false de către civili și logica de arestare a santinelelor la punctele de control.

---

## 📦 Pachete de Descărcat (Release Downloads)

1. **`TheBrassAge-Update-All-In-One-v1.2.0.zip`** *(Recomandat)*:
   - Conține pachetul complet actualizat (mods, configs, kubejs server/client/startup, tacz gunpacks, cărți patchouli, lăzi militare, rețete Netherless și texturi pixel-art).
   - Soluția completă pentru Singleplayer și actualizare drop-in.
2. **`TheBrassAge-Update-Server-v1.2.0.zip`**:
   - Pachet optimizat exclusiv pentru administratorii de servere dedicate.
3. **`TheBrassAge-Update-Client-v1.2.0.zip`**:
   - Pachet optimizat pentru clienți și jucători care se conectează la un server dedicat.

---

## 🛠️ Ghid Rapid de Instalare (1-Click)

1. Deschideți folderul instanței de **Rustic Craft II** în launcher (CurseForge / Prism / Modrinth).
2. Extrageți arhiva **`TheBrassAge-Update-All-In-One-v1.2.0.zip`** direct în folderul instanței.
3. Rulați cu dublu click fișierul **`install_patch.bat`** (sau click-dreapta `Run with PowerShell` pe `install_patch.ps1`).
4. Porniți jocul!

---

## 📋 Comenzi Administrative & Verificare în Joc

- `/straja test` — Execută suita completă de 30 teste automate (verificare instantanee a sistemului).
- `/brass_test help` — Afișează ghidul complet al comenzilor de testare.
- `/brass_test [1..16]` — Sare direct la pasul de testare dorit.
- `/brass_test netherless` — Îți oferă în inventar kitul complet de alchimie Netherless (ingrediente + utilaje Create).
- `/brass_test fakes` — Îți oferă pachetul complet de arme și permise contrafăcute pentru inspecție.
- `/gunsmith book [jucător]` — Oferă Manualul Oficial al Armurierului cu toate diagramele secrete de asamblare.
- `/straja book give [jucător]` — Oferă registrul fizic de patrulă al garnizoanei.
