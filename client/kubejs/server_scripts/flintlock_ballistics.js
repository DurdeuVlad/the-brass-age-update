// Server-side enforcement of authentic 18th-century flintlock ballistics and lock time.
// Intercepts TaCZ gun data loading to guarantee smoothbore conical dispersion and ignition delay.

if (typeof TaCZServerEvents !== 'undefined') {
    TaCZServerEvents.gunDataLoad(event => {
        const gunId = String(event.id)
        
        if (gunId === 'qkl:fk15') {
            // FK15 Smoothbore Volley Musket
            const data = JSON.parse(event.getJson())
            
            // Direct Trigger Synchronization: eliminates recoil-induced high elevation misses
            data.rpm = 100
            data.script = 'qkl:delayshoot_gun_logic'
            data.script_param = { shoot_delay: 0.0 }
            
            // Calibrated Dispersion: pinpoint ADS torso hits at 10-25m, effective volleys at 30-50m, wide spread past 60m
            if (data.inaccuracy) {
                data.inaccuracy.stand = 2.4
                data.inaccuracy.move = 4.5
                data.inaccuracy.sneak = 0.25 // Taking a knee/bracing gives razor-sharp hold
                data.inaccuracy.lie = 0.35
                data.inaccuracy.aim = 0.45 // Reliable chest hit at 10-25m without becoming a 100m sniper
            }
            
            // Black Powder External Ballistics: heavy round lead ball trajectory
            if (data.bullet) {
                data.bullet.speed = 150
                data.bullet.gravity = 0.024
                data.bullet.knockback = 0.45
                data.bullet.friction = 0.012
                if (data.bullet.extra_damage) {
                    data.bullet.extra_damage.damage_adjust = [
                        { distance: 15, damage: 55 },
                        { distance: 30, damage: 48 },
                        { distance: 50, damage: 38 },
                        { distance: 80, damage: 25 },
                        { distance: 120, damage: 15 },
                        { distance: 'infinite', damage: 8 }
                    ]
                }
            }
            
            event.setJson(JSON.stringify(data))
        } else if (gunId === 'qkl:fk15p') {
            // FK15P Smoothbore Officer / Dragoon Pistol
            const data = JSON.parse(event.getJson())
            
            data.rpm = 100
            data.script = 'qkl:delayshoot_gun_logic'
            data.script_param = { shoot_delay: 0.0 }
            
            if (data.inaccuracy) {
                data.inaccuracy.stand = 2.8
                data.inaccuracy.move = 3.8
                data.inaccuracy.sneak = 0.45
                data.inaccuracy.lie = 0.50
                data.inaccuracy.aim = 0.70 // Reliable torso hit at 10-15m, sidearm scatter past 20m
            }
            
            if (data.bullet) {
                data.bullet.speed = 110
                data.bullet.gravity = 0.030
            }
            
            event.setJson(JSON.stringify(data))
        }
    })
} else {
    console.info('[TheBrassAge] TaCZServerEvents is not loaded in this environment; gun data definitions in ChocolateMan gunpack are active.')
}

