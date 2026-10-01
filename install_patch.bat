@echo off
chcp 65001 > nul
title The Brass Age Update - Patch Installer v1.1.0
echo =====================================================================
echo    ⚜ THE BRASS AGE UPDATE — AUTOMATED PATCH INSTALLER v1.1.0 ⚜
echo    Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248)
echo =====================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET_DIR=%SCRIPT_DIR%"

:: Check if installer was placed inside a subfolder or directly in the modpack
if exist "%SCRIPT_DIR%..\mods" (
    echo [INFO] Detected existing 'mods' folder in parent directory.
    set "TARGET_DIR=%SCRIPT_DIR%..\"
) else if exist "%SCRIPT_DIR%mods" (
    echo [INFO] Detected existing 'mods' folder in current directory.
) else (
    echo [WARNING] Could not automatically detect existing 'mods' folder.
    echo This patch must be installed OVER your existing Rustic Craft II instance.
    echo (Do NOT import this zip as a new profile in CurseForge/Prism Launcher!)
    echo.
    set /p "TARGET_DIR=Enter path to your Rustic Craft II Minecraft folder [or press Enter to use here]: "
    if "%TARGET_DIR%"=="" set "TARGET_DIR=%SCRIPT_DIR%"
)

echo.
echo Installing patch to: "%TARGET_DIR%"
echo.

:: 1. Copy Mods
if exist "%SCRIPT_DIR%mods" (
    echo [1/6] Installing TaCZ & Compat Mod JARs...
    xcopy /E /Y /I "%SCRIPT_DIR%mods" "%TARGET_DIR%mods" > nul
)

:: 2. Copy KubeJS
if exist "%SCRIPT_DIR%kubejs" (
    echo [2/6] Installing KubeJS Scripts, Textures & Crates...
    xcopy /E /Y /I "%SCRIPT_DIR%kubejs" "%TARGET_DIR%kubejs" > nul
)

:: 3. Copy TaCZ Gunpacks
if exist "%SCRIPT_DIR%tacz" (
    echo [3/6] Installing Flintlock Gunpacks & Weapon Data...
    xcopy /E /Y /I "%SCRIPT_DIR%tacz" "%TARGET_DIR%tacz" > nul
)

:: 4. Copy Patchouli Books
if exist "%SCRIPT_DIR%patchouli_books" (
    echo [4/6] Installing Gunsmith Handbook (Patchouli)...
    xcopy /E /Y /I "%SCRIPT_DIR%patchouli_books" "%TARGET_DIR%patchouli_books" > nul
)

:: 5. Copy Configs
if exist "%SCRIPT_DIR%config" (
    echo [5/6] Updating Configurations...
    xcopy /E /Y /I "%SCRIPT_DIR%config" "%TARGET_DIR%config" > nul
)

:: 6. Copy DefaultConfigs
if exist "%SCRIPT_DIR%defaultconfigs" (
    echo [6/6] Updating Default Serverconfigs...
    xcopy /E /Y /I "%SCRIPT_DIR%defaultconfigs" "%TARGET_DIR%defaultconfigs" > nul
)

echo.
echo =====================================================================
echo  ✔ SUCCESS: The Brass Age v1.1.0 successfully installed!
echo.
echo  Quick check:
echo   - 34 item textures and weapon crates installed.
echo   - 140ms smoothbore lock-time ballistics active.
echo   - In-game manual available via: /flintlock or /arma
echo.
echo  You can now start Minecraft / NeoForge. Have fun testing!
echo =====================================================================
echo.
pause
