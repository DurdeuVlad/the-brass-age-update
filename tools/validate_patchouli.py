import os
import json
import re

ENTRIES_DIR = r"server/patchouli_books/rustic_gunsmith/en_us/entries"

# Exact Minecraft Patchouli font metrics:
# Book width = 116px
# Default font average character width ~ 5.6px
# Average line capacity = ~21 characters (safe wrap limit is 20-22 chars per line)
# Page 1 (has entry title + category header + separator): max 9-10 lines of text
# Subsequent pages (Page 2+): max 13-14 lines of text
# Spotlight pages (has item icon + item name at top taking ~40px): max 8-9 lines of text

def estimate_page_lines(text, page_type='patchouli:text', is_first_page=False):
    if not text:
        return 0, []
    
    # Split paragraphs by $(br2)
    paras = text.split('$(br2)')
    rendered_lines = []
    
    for p_idx, p in enumerate(paras):
        # Within paragraph, split by $(br)
        sub_paras = p.split('$(br)')
        for s in sub_paras:
            # Strip formatting commands like $(bold), $(6), $(), etc.
            clean = re.sub(r'\$\([a-zA-Z0-9_:]*\)', '', s).strip()
            if not clean:
                rendered_lines.append("")
                continue
            
            # Word-wrap simulation
            words = clean.split(' ')
            cur_line = []
            cur_len = 0
            for w in words:
                # If adding this word exceeds ~21 chars, wrap to next line
                if cur_len + len(w) + (1 if cur_line else 0) > 21:
                    if cur_line:
                        rendered_lines.append(" ".join(cur_line))
                    cur_line = [w]
                    cur_len = len(w)
                else:
                    cur_line.append(w)
                    cur_len += len(w) + (1 if len(cur_line) > 1 else 0)
            if cur_line:
                rendered_lines.append(" ".join(cur_line))
        
        # Blank line between $(br2) paragraphs
        if p_idx < len(paras) - 1:
            rendered_lines.append("")
            
    return len(rendered_lines), rendered_lines

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_directory(entries_dir):
    print(f"\n--- Checking: {entries_dir} ---")
    if not os.path.exists(entries_dir):
        print(f"Directory not found: {entries_dir}")
        return 0, 0

    overflow_count = 0
    total_pages = 0

    for filename in sorted(os.listdir(entries_dir)):
        if not filename.endswith('.json'):
            continue
        filepath = os.path.join(entries_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        entry_name = data.get('name', filename)
        pages = data.get('pages', [])

        # Check entry icon
        icon = data.get('icon', '')
        if 'item/' in icon or not icon:
            print(f"[INVALID ICON] {filename}: icon='{icon}'")

        for idx, page in enumerate(pages):
            total_pages += 1
            ptype = page.get('type', 'patchouli:text')
            ptext = page.get('text', '')
            pitem = page.get('item', '')
            is_first = (idx == 0)

            if ptype == 'patchouli:spotlight':
                max_lines = 8
            elif is_first:
                max_lines = 10
            else:
                max_lines = 13

            line_count, lines = estimate_page_lines(ptext, ptype, is_first)

            if line_count > max_lines:
                overflow_count += 1
                print(f"\n[OVERFLOW] {filename} -> Page {idx + 1} ({ptype})")
                print(f"   Lines: {line_count} (Safe max: {max_lines}) | Excess: +{line_count - max_lines} lines")
                print(f"   Text snippet: {ptext[:60]}...")
                print("   Rendered breakdown:")
                for l_no, l in enumerate(lines, 1):
                    prefix = "   [!] " if l_no > max_lines else "       "
                    print(f"{prefix}{l_no:02d}: {l}")
            elif line_count >= max_lines - 1:
                print(f"[BORDERLINE] {filename} -> Page {idx + 1} ({ptype}): {line_count}/{max_lines} lines")

    return total_pages, overflow_count

def audit_all_entries():
    print("=" * 70)
    print("AUDITING PATCHOULI BOOK ENTRIES FOR OVERFLOWS & DEFECTS")
    print("=" * 70)

    dirs_to_check = [
        r"server/patchouli_books/rustic_gunsmith/en_us/entries",
        r"client/patchouli_books/rustic_gunsmith/en_us/entries"
    ]

    total_checked = 0
    total_overflows = 0

    for d in dirs_to_check:
        pages, overflows = audit_directory(d)
        total_checked += pages
        total_overflows += overflows

    print("\n" + "=" * 70)
    print(f"Audit completed: Checked {total_checked} total pages across all target directories.")
    print(f"Total Overflows Found: {total_overflows}")
    print("=" * 70)

    if total_overflows > 0:
        sys.exit(1)
    else:
        print("ALL PAGES PASS GUARDRAILS. ZERO OVERFLOWS.")
        sys.exit(0)

if __name__ == '__main__':
    audit_all_entries()
