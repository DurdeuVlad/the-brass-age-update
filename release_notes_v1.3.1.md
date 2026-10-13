# Release Notes — The Brass Age Update v1.3.1

**The Brass Age Update v1.3.1** addresses and resolves bugs in the physical Straja Patrol Book (`Registrul Straja`, `minecraft:written_book`) obtained via `/straja book` / `/straja registry`:

## Summary of Fixes

### 1. Title Length Codec Overflow (The Primary Failure)
- **Problem**: In Minecraft 1.20.5+ / 1.21.1, Mojang's Filterable Component codec enforces a strict title string limit of 32 characters (`[0-32]`). The previous title `"Registrul de Arme Straja (Ed. #3)"` was 33 characters (and longer for double-digit editions), causing NeoForge to throw a `KubeRuntimeException: Malformed written_book_content: String is too long: 33, expected range [0-32]` whenever the book was generated or given.
- **Solution**: Title adjusted to `"Registrul Straja (Ed. #" + edition + ")"` (25 characters, strictly $\le 32$ even up to edition #9999).

### 2. 14-Line Book Page Limit Overflow & Entry Truncation
- **Problem**: Minecraft books strictly cap display height at 14 vertical lines. The previous catastif attempted to pack 3 weapon entries per page with 5 lines per entry ($3 \times 5 = 15$ lines + 3 lines header = 18 lines), causing the 3rd weapon entry on every page to be permanently pushed off-screen and invisible. Page 2 also overflowed (>20 lines).
- **Solution**:
  - Catastif restructured to 2 entries per page (3 lines header + 2 entries of 3 lines = 9-10 lines total), ensuring zero line overflow and zero truncation.
  - Page 2 (*SEMNELE ADEVĂRULUI*) redesigned to 11 compact lines fitting all 4 "Papers, Please" inspection cues cleanly.

### 3. Inclusion of Authorized Military Patterns Catalog (Tipare Autorizate)
- **Enhancement**: Added Page 3 (**TIPARE AUTORIZATE**), listing the realm's officially approved firearms (*Muschetă FK15* 16.5mm infanterie, limită 1 armă/cetățean; *Pistol Cavalerie FK15-P* 16.5mm, limită 2 arme/cetățean) and Page 4 (**MUNIȚIE & LOGISTICĂ**), detailing authorized 16.5mm ammunition types (Lead, Consecrated Silver, Canister, Incendiary) and sealed crate logistics.

### 4. Inclusion of Today's Maturing Firearms Queue (StrajaPendingToday)
- **Enhancement**: Firearms proofed today by inspectors awaiting midnight rollover are now clearly displayed in a dedicated section (**ARME ÎN CURS DE MATURARE (AZI)**) with status `⏳ Așteaptă Rollover`, enabling inspectors to cross-check newly proofed weapons against same-day permits.

### 5. Unified Command Tree for `/straja book` and `/straja registry`
- **Fix**: Upgraded command arguments so that `/straja book give @s`, `/straja book give <player>`, `/straja book <player>`, and `/straja book` all execute flawlessly without Brigadier syntax errors.

### 6. Empirical Test Suite Expansion
- `/straja test` expanded to **41 assertions (100% PASS)**, validating catalog contents, visual page line limits, and error-free book item generation.
