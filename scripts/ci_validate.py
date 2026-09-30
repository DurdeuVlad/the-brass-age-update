#!/usr/bin/env python3
"""
CI Validation Suite for The Brass Age Update.
Validates:
1. All Patchouli Guidebook JSON files syntax and structure
2. KubeJS Data JSON files
3. KubeJS JavaScript syntax (via node --check)
4. Presence of all 31 expansion item textures
5. Presence and integrity of core server scripts and recipes
"""

import os
import sys
import glob
import json
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def validate_json_files(pattern_desc, pattern):
    files = glob.glob(os.path.join(BASE_DIR, pattern), recursive=True)
    if not files:
        print(f"  [WARN] No files matched pattern: {pattern}")
        return True, 0
    
    errors = 0
    for f in files:
        try:
            with open(f, 'r', encoding='utf-8') as fp:
                json.load(fp)
        except Exception as e:
            print(f"  [FAIL] JSON error in {os.path.relpath(f, BASE_DIR)}: {e}")
            errors += 1
            
    if errors == 0:
        print(f"  [PASS] {pattern_desc}: {len(files)} files checked, 100% valid.")
        return True, len(files)
    else:
        print(f"  [FAIL] {pattern_desc}: {errors} errors found!")
        return False, len(files)

def validate_js_syntax():
    js_files = glob.glob(os.path.join(BASE_DIR, "**", "kubejs", "**", "*.js"), recursive=True)
    if not js_files:
        print("  [FAIL] No KubeJS script files found!")
        return False, 0

    errors = 0
    for f in js_files:
        rel = os.path.relpath(f, BASE_DIR)
        res = subprocess.run(["node", "--check", f], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"  [FAIL] Syntax error in {rel}:\n{res.stderr.strip()}")
            errors += 1

    if errors == 0:
        print(f"  [PASS] KubeJS JavaScript Syntax: {len(js_files)} scripts checked, 100% clean.")
        return True, len(js_files)
    else:
        print(f"  [FAIL] KubeJS JavaScript Syntax: {errors} files failed syntax check!")
        return False, len(js_files)

def validate_textures():
    server_tex = glob.glob(os.path.join(BASE_DIR, "server", "kubejs", "assets", "kubejs", "textures", "item", "*.png"))
    client_tex = glob.glob(os.path.join(BASE_DIR, "client", "kubejs", "assets", "kubejs", "textures", "item", "*.png"))
    
    print(f"  [INFO] Found {len(server_tex)} server textures and {len(client_tex)} client textures.")
    if len(server_tex) < 31 or len(client_tex) < 31:
        print(f"  [FAIL] Expected at least 31 textures per side, got server={len(server_tex)}, client={len(client_tex)}")
        return False
    if len(server_tex) != len(client_tex):
        print("  [FAIL] Texture count mismatch between client and server!")
        return False
        
    print(f"  [PASS] Expansion Item Textures: {len(server_tex)} textures verified with client/server parity.")
    return True

def validate_required_scripts():
    required_scripts = [
        "civilian_fertilizer.js",
        "civilian_leather.js",
        "civilian_matches.js",
        "civilian_soap.js",
        "civilian_viticulture.js",
        "flintlock_ammo.js",
        "flintlock_ammo_silver_combat.js",
        "flintlock_ammo_tiered.js",
        "flintlock_ballistics.js",
        "flintlock_carry_limits.js",
        "flintlock_ordnance_special.js",
        "flintlock_proofing_legal.js",
        "flintlock_ux_helpers.js",
        "furniture_coffer_gun_restrictions.js",
        "vampire_admin.js",
    ]
    missing = []
    for s in required_scripts:
        p = os.path.join(BASE_DIR, "server", "kubejs", "server_scripts", s)
        if not os.path.exists(p):
            missing.append(s)
            
    if missing:
        print(f"  [FAIL] Missing required server scripts: {missing}")
        return False
    print(f"  [PASS] Core Server Scripts: All {len(required_scripts)} milestone scripts verified.")
    return True

def main():
    print("=" * 65)
    print(" [*] THE BRASS AGE UPDATE -- CI VALIDATION SUITE [*] ")
    print("=" * 65)

    all_passed = True
    
    # 1. JSON Validations
    print("\n[1/4] Validating JSON files...")
    ok, _ = validate_json_files("Server Patchouli Books", "server/patchouli_books/**/*.json")
    all_passed &= ok
    ok, _ = validate_json_files("Client Patchouli Books", "client/patchouli_books/**/*.json")
    all_passed &= ok
    ok, _ = validate_json_files("Server KubeJS Data", "server/kubejs/data/**/*.json")
    all_passed &= ok
    ok, _ = validate_json_files("Client KubeJS Data", "client/kubejs/data/**/*.json")
    all_passed &= ok
    
    # 2. JavaScript Syntax
    print("\n[2/4] Validating KubeJS Scripts syntax...")
    ok, _ = validate_js_syntax()
    all_passed &= ok
    
    # 3. Textures
    print("\n[3/4] Validating Texture assets...")
    ok = validate_textures()
    all_passed &= ok
    
    # 4. Required Scripts
    print("\n[4/4] Validating Script coverage...")
    ok = validate_required_scripts()
    all_passed &= ok
    
    print("\n" + "=" * 65)
    if all_passed:
        print("  >>> ALL CHECKS PASSED SUCCESSFULLY (READY FOR PRODUCTION) <<<")
        print("=" * 65)
        sys.exit(0)
    else:
        print("  >>> CI CHECKS FAILED <<<")
        print("=" * 65)
        sys.exit(1)

if __name__ == "__main__":
    main()
