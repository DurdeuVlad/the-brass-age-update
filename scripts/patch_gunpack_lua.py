import zipfile
import os
import shutil

NEW_LUA = """local M = {}

-- 尝试开火射击时调用
function M.shoot(api)
    -- 先从data文件中获取开火延迟数据，由于以毫秒为单位，因此将秒乘以1000转为毫秒
    local shoot_delay = api:getScriptParams().shoot_delay * 1000
    -- 将执行射击的部分委托为一次性的延时任务，从而达到延迟开火的目的
    api:safeAsyncTask(function ()
        api:shootOnce(api:isShootingNeedConsumeAmmo())
        return false
    end,shoot_delay,0,1)
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
    'E:/Github2/rusticcraft2-clona/new-clone-28-sept/_/tacz/ChocolateMan V1.2.6a1-Public Edition+1.21.1.zip'
]

target_entry = 'data/qkl/scripts/delayshoot_gun_logic.lua'

for p in paths:
    if not os.path.exists(p):
        print('Skipping non-existent:', p)
        continue
    tmp_p = p + '.tmp'
    with zipfile.ZipFile(p, 'r') as zin, zipfile.ZipFile(tmp_p, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == target_entry:
                zout.writestr(item, NEW_LUA.encode('utf-8'))
            else:
                zout.writestr(item, zin.read(item.filename))
    shutil.move(tmp_p, p)
    print('Updated successfully:', p)

print('Done patching gunpacks!')
