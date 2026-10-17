#!/usr/bin/env bash
# =====================================================================
#   ⚜ THE BRASS AGE UPDATE — AUTOMATED PATCH INSTALLER v1.3.6 ⚜
#   Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248)
#   Linux, WSL (Windows Subsystem for Linux) & Headless Server Support
# =====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$SCRIPT_DIR}"

echo "====================================================================="
echo "   ⚜ THE BRASS AGE UPDATE — AUTOMATED PATCH INSTALLER v1.3.6 ⚜"
echo "   Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248)"
echo "====================================================================="
echo ""

# Auto-detect target instance folder
if [ -d "$SCRIPT_DIR/../mods" ] && [ -d "$SCRIPT_DIR/../libraries" ]; then
    echo "[INFO] Detected existing Minecraft instance in parent directory."
    TARGET_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [ -d "$SCRIPT_DIR/mods" ] && [ -d "$SCRIPT_DIR/libraries" ]; then
    echo "[INFO] Detected existing Minecraft instance in current directory."
    TARGET_DIR="$SCRIPT_DIR"
elif [ "$TARGET_DIR" = "$SCRIPT_DIR" ]; then
    if [ -n "$1" ]; then
        TARGET_DIR="$1"
    else
        echo "[WARNING] Could not automatically detect existing base 'mods' or 'libraries' folder."
        echo "This patch must be installed OVER your existing Rustic Craft II instance."
        echo "(Do NOT import this zip as a new profile in CurseForge/Prism Launcher!)"
        echo ""
        read -r -p "Enter path to your Rustic Craft II Minecraft folder [Press Enter for current]: " USER_INPUT
        if [ -n "$USER_INPUT" ]; then
            TARGET_DIR="$USER_INPUT"
        fi
    fi
fi

echo ""
echo "Target installation folder: $TARGET_DIR"
echo ""

if [ ! -d "$TARGET_DIR" ]; then
    echo "[ERROR] Target directory '$TARGET_DIR' does not exist."
    exit 1
fi

FOLDERS=("mods" "kubejs" "tacz" "patchouli_books" "config" "defaultconfigs")
STEP=1

for FOLDER in "${FOLDERS[@]}"; do
    SRC="$SCRIPT_DIR/$FOLDER"
    DEST="$TARGET_DIR/$FOLDER"
    if [ -d "$SRC" ]; then
        echo "[$STEP/6] Copying $FOLDER..."
        mkdir -p "$DEST"
        cp -r "$SRC"/* "$DEST"/
    fi
    STEP=$((STEP + 1))
done

echo ""
echo "====================================================================="
echo "  ✔ SUCCESS: The Brass Age v1.3.6 patch successfully applied!"
echo ""
echo "  Quick Check:"
echo "   - 35 item textures and weapon crates installed."
echo "   - Calibrated smoothbore ballistics & back-holstered weapons active."
echo "   - Anvil preview duplication exploit patched."
echo "   - In-game manual available via: /flintlock or /arma"
echo "   - Gunsmith Handbook available via: /function kubejs:give_gunsmith_manual"
echo ""
echo "  You can now start your Minecraft / NeoForge instance!"
echo "====================================================================="
echo ""
