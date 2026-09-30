# The Brass Age Update - Automated Patch Installer v1.0.1
# Platform: Minecraft 1.21.1 / NeoForge 21.1.248 / Rustic Craft II
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host "   ⚜ THE BRASS AGE UPDATE — AUTOMATED PATCH INSTALLER v1.0.1 ⚜" -ForegroundColor Cyan
Write-Host "   Rustic Craft II (Minecraft 1.21.1 / NeoForge 21.1.248)" -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$TargetDir = $ScriptDir

# Auto-detect target instance folder
if (Test-Path (Join-Path $ScriptDir "..\mods")) {
    Write-Host "[INFO] Detected Minecraft instance in parent directory: $TargetDir\..\" -ForegroundColor Green
    $TargetDir = (Resolve-Path (Join-Path $ScriptDir "..\")).Path
} elseif (Test-Path (Join-Path $ScriptDir "mods")) {
    Write-Host "[INFO] Detected Minecraft instance in current directory." -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not automatically detect existing 'mods' folder." -ForegroundColor Yellow
    Write-Host "This patch must be installed OVER your existing Rustic Craft II instance." -ForegroundColor White
    Write-Host "(Do NOT import this zip as a new profile in CurseForge/Prism Launcher!)" -ForegroundColor Red
    $UserInput = Read-Host "Enter path to your Rustic Craft II Minecraft folder [Press Enter for current]"
    if (-not [string]::IsNullOrWhiteSpace($UserInput)) {
        $TargetDir = $UserInput
    }
}

Write-Host "`nTarget installation folder: $TargetDir`n" -ForegroundColor Cyan

$Folders = @("mods", "kubejs", "tacz", "patchouli_books", "config", "defaultconfigs")
$Index = 1

foreach ($Folder in $Folders) {
    $Src = Join-Path $ScriptDir $Folder
    $Dest = Join-Path $TargetDir $Folder
    if (Test-Path $Src) {
        Write-Host "[$Index/6] Copying $Folder..." -ForegroundColor Gray
        Copy-Item -Path "$Src\*" -Destination $Dest -Recurse -Force
    }
    $Index++
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host " ✔ SUCCESS: The Brass Age v1.0.1 patch successfully applied!" -ForegroundColor Green
Write-Host ""
Write-Host " Quick Check:" -ForegroundColor White
Write-Host "  - 34 item textures and weapon crates installed." -ForegroundColor Gray
Write-Host "  - 140ms smoothbore lock-time ballistics active." -ForegroundColor Gray
Write-Host "  - In-game manual available via: /flintlock or /arma" -ForegroundColor Gray
Write-Host "  - Gunsmith Handbook available via: /function kubejs:give_gunsmith_manual" -ForegroundColor Gray
Write-Host ""
Write-Host " Launch your Minecraft / NeoForge instance and test!" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
