import os

source = 'E:/Github2/rusticcraft2-clona/test-silver-instance/config/weaponmaster_ydm-common.toml'
with open(source, 'r', encoding='utf-8') as f:
    content = f.read()

old_line = 'whitelist = "empty,totem_of_undying"'
new_line = 'whitelist = "empty,totem_of_undying,modern_kinetic_gun,tacz:modern_kinetic_gun"'

if old_line in content:
    content = content.replace(old_line, new_line)
    print('Replaced whitelist in content')
elif new_line in content:
    print('Already has updated whitelist')
else:
    print('Warning: neither old_line nor new_line found in content')

targets = [
    'server/config/weaponmaster_ydm-common.toml',
    'client/config/weaponmaster_ydm-common.toml',
    'E:/Github2/rusticcraft2-clona/new-clone-28-sept/_/config/weaponmaster_ydm-common.toml',
    'E:/Github2/rusticcraft2-clona/test-silver-instance/config/weaponmaster_ydm-common.toml',
    'C:/Users/User/.mct/clients/rustic-nf/minecraft/config/weaponmaster_ydm-common.toml'
]

for t in targets:
    os.makedirs(os.path.dirname(t), exist_ok=True)
    with open(t, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated:', t)
print('Done!')
