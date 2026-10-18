## The Brass Age — Version 1.3.7 Release

### ⚜️ Flintlock Ballistics Calibration Fine-Tuning

Following combat gameplay testing and balance review, this bugfix release fine-tunes aimed dispersion values for the flintlock arsenal:

#### 🎯 1. Ballistics Accuracy Recalibration
- **FK15 Smoothbore Volley Musket**: Aimed inaccuracy calibrated from `0.45°` to `0.70°`. Retains reliable torso hits at 10–25 blocks while re-establishing authentic smoothbore dispersion at long ranges, preventing modern sniper rifle precision. Muzzle velocity (150 m/s) and reduced gravity drop (0.024) are maintained for flat black powder flight.
- **FK15P Smoothbore Dragoon Pistol**: Aimed inaccuracy calibrated from `0.70°` to `1.40°`. Provides dependable close-quarters defense at 5–15 blocks while preserving realistic sidearm dispersion beyond 20 blocks. Muzzle velocity (110 m/s) and gravity (0.030) are maintained.

#### 📦 2. Full Sync Across Gunpacks & KubeJS
- `ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip` updated in `server/tacz` and `client/tacz` with new gun data JSONs (`fk15_data.json` and `fk15p_data.json`).
- `flintlock_ballistics.js` synchronized in both `server/kubejs/server_scripts/` and `client/kubejs/server_scripts/` to enforce identical dispersion bounds.

#### 🧪 3. Verification & Stability
- CI validation passed 100% across all JSON definitions, KubeJS scripts, and texture assets.
- Live server script suite verified with 0 syntax or runtime errors.
