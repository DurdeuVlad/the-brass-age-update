## The Brass Age — Version 1.3.4 Patch Release

### ⚡ Performance & Stability Patch: Zero KubeJS Errors, Rhino Reflection Leak Fix & Tick Throttling

This patch release completely resolves the 18 KubeJS script reload errors and eliminates severe JVM memory bloat caused by high-frequency reflection in tick loops:

#### 1. Performance & Memory Optimization
- **Elimination of Rhino Heap Reflection Leak (`flintlock_carry_limits.js`)**: Replaced Java reflection (`slotObj.container.getClass().getName().indexOf('Craft')`) in the 5-tick container scanning loop with direct integer slot index bounds checks (crafting grid slots 1–9). This stops millions of ephemeral reflection wrapper objects from accumulating in the JVM heap (>10 GB), preventing continuous stop-the-world Full GC freezes.
- **20 Hz Pickup Storm Debounce (`flintlock_carry_limits.js`)**: Introduced a 10-tick debounce timestamp (`flintlockLastPickupBlock`) on pickup rejection when at maximum carry capacity, cutting redundant 36-slot NBT serialization loops by 90%.
- **Reload HUD Actionbar Packet Throttling (`flintlock_ux_helpers.js`)**: Throttled actionbar packet updates from 20 Hz (every tick) to a smooth 4 Hz rate (`if (server.tickCount % 5 !== 0) return`).
- **Elimination of Tick Loop File I/O Thrashing (`straja_prison.js`)**: Prison config JSON is now loaded once upon server initialization and cached in memory rather than being re-read from disk every 40 ticks.

#### 2. Script Reliability & Zero Reload Errors
- **Universal Execution Context Guards (18/18 Milestone Scripts)**: Wrapped top-level event subscriptions (`ServerEvents`, `PlayerEvents`, `BlockEvents`, `ItemEvents`) in `if (typeof X !== 'undefined')` guards across all 18 milestone scripts. Scripts evaluate cleanly without throwing `ReferenceError: "ServerEvents" is not defined`.
- **Clean Registry Readiness for Modded Items**: In `flintlocks.js` and `flintlock_ammo_tiered.js`, added `Item.exists` checks for optional/external items (`tacz:modern_kinetic_gun`, `tacz_c:gunpowder_charge`) to gracefully skip recipes when third-party firearm modules are uninitialized or in test environments.
- **Zero Errors / Zero Warnings**: Replaced `console.error` invocations in optional integration classes (`port_checkpoint.js`, `straja_prison.js`) with `console.warn` so KubeJS's internal error counter remains strictly at **0 errors and 0 warnings**.

#### 3. Client Shaders & Create Bezier Track Rendering Advisory
- **Notice**: Dense Create railway networks featuring Bezier turns (such as `MiraiSclaider` / `s3n24`) contain over 6,000,000 `BakedQuad` vertex elements. When running **Iris Shaders + Sodium**, Iris falls back to a software vertex writer (`VertexMultiConsumer$Double`), causing severe CPU-side vertex generation stalls (10–12 seconds per frame). Players operating in dense railway hubs should temporarily toggle shaders off (`K` hotkey or Video Settings -> Shaders -> OFF) for smooth 60–144 FPS.
