import zipfile
import json
import os
import shutil

NEW_LUA = """local M = {}

-- Trigger pull: direct firing aligned with reticle (eliminates recoil-induced high elevation misses)
function M.shoot(api)
    api:shootOnce(api:isShootingNeedConsumeAmmo())
end

function M.modify_property(api, property_name, value)
    if property_name == "bullet_amount" then
        local nbt = api:getNbt()
        if nbt and nbt:getString("ChamberAmmoType") == "canister" then
            return 8
        end
    elseif property_name == "inaccuracy" then
        local nbt = api:getNbt()
        if nbt and nbt:getString("ChamberAmmoType") == "canister" then
            return 7.0
        end
    end
    return value
end

return M
"""

paths = [
    'server/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'client/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/new-clone-28-sept/_/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'E:/Github2/rusticcraft2-clona/test-silver-instance/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip',
    'C:/Users/User/.mct/clients/rustic-nf/minecraft/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip'
]

for p in paths:
    if not os.path.exists(p):
        print('Skipping non-existent:', p)
        continue
    tmp_p = p + '.tmp'
    with zipfile.ZipFile(p, 'r') as zin, zipfile.ZipFile(tmp_p, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == 'data/qkl/scripts/delayshoot_gun_logic.lua':
                zout.writestr(item, NEW_LUA.encode('utf-8'))
            elif item.filename == 'data/qkl/data/guns/fk15_data.json':
                data = json.loads(zin.read(item.filename).decode('utf-8'))
                data['script_param'] = {'shoot_delay': 0.0}
                data['inaccuracy'] = {
                    'stand': 2.4,
                    'move': 4.5,
                    'sneak': 0.25,
                    'lie': 0.35,
                    'aim': 0.45
                }
                data['bullet']['speed'] = 150
                data['bullet']['gravity'] = 0.024
                data['bullet']['friction'] = 0.012
                zout.writestr(item, json.dumps(data, indent=2).encode('utf-8'))
            elif item.filename == 'data/qkl/data/guns/fk15p_data.json':
                data = json.loads(zin.read(item.filename).decode('utf-8'))
                data['script_param'] = {'shoot_delay': 0.0}
                data['inaccuracy'] = {
                    'stand': 2.8,
                    'move': 3.8,
                    'sneak': 0.45,
                    'lie': 0.50,
                    'aim': 0.70
                }
                data['bullet']['speed'] = 110
                data['bullet']['gravity'] = 0.030
                zout.writestr(item, json.dumps(data, indent=2).encode('utf-8'))
            else:
                zout.writestr(item, zin.read(item.filename))
    shutil.move(tmp_p, p)
    print('Updated successfully:', p)

print('Done patching all gunpacks with calibrated ballistics!')
