// Server-side enforcement of authentic 18th-century flintlock ballistics and lock time.
// Intercepts TaCZ gun data loading to guarantee smoothbore conical dispersion and ignition delay.

TaCZServerEvents.gunDataLoad(event => {
    const gunId = String(event.id)
    
    if (gunId === 'qkl:fk15') {
        // FK15 Smoothbore Volley Musket
        const data = JSON.parse(event.getJson())
        
        // Mechanical Lock Time (140 ms: cock strike -> pan flash -> breech ignition)
        data.rpm = 100
        data.script = 'qkl:delayshoot_gun_logic'
        data.script_param = { shoot_delay: 0.14 }
        
        // Conical Dispersion: lethal at 0-30m, disciplined volleys at 30-60m, inaccurate past 60m
        if (data.inaccuracy) {
            data.inaccuracy.stand = 4.5
            data.inaccuracy.move = 7.5
            data.inaccuracy.sneak = 1.0 // Taking a knee braces the 5kg iron barrel
            data.inaccuracy.lie = 4.0
            data.inaccuracy.aim = 1.85 // 1.85 degrees conical spread (was 0.5 modern sniper)
        }
        
        // Black Powder External Ballistics: heavy round lead ball drop
        if (data.bullet) {
            data.bullet.speed = 135
            data.bullet.gravity = 0.031
            data.bullet.knockback = 0.45
            data.bullet.friction = 0.015
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
        data.script_param = { shoot_delay: 0.16 }
        
        if (data.inaccuracy) {
            data.inaccuracy.stand = 4.5
            data.inaccuracy.move = 5.5
            data.inaccuracy.sneak = 2.0
            data.inaccuracy.lie = 4.0
            data.inaccuracy.aim = 2.40 // Wide defensive spread beyond 15m
        }
        
        if (data.bullet) {
            data.bullet.speed = 95
            data.bullet.gravity = 0.038
        }
        
        event.setJson(JSON.stringify(data))
    }
})
