// ============================================================================
// Straja Prison Mine — mina de muncă a deținuților (copie comprimată a minei)
// ----------------------------------------------------------------------------
// Aceleași construcții ca mina Straja (mines:mine_entrance / mine_shaft_1 /
// warehouse / mine_shaft_2), aceleași poziții relative, dar zonele de minat
// sunt comprimate (24x24x17 în loc de 48x48x33) și etapele se pornesc cu o
// comandă. Fiecare zonă are minereurile ei, editabile din comenzi.
//
//   /prisonmine help [setup|etape|minereu|garda|reguli]
//   ADMIN (op):  setup · place <direcție> · exit · stage [id on|off|regen]
//                ore <zonă> add|remove|default · ores <zonă> · on|off · refill · reset
//   STRAJA/op:   status · list · send <deținut> · recall <deținut|all>
//
// Contract cu straja_prison.js (fișierele KubeJS nu partajează funcții):
//   * server.persistentData.strajaPrisonMine = JSON {enabled,dim,box,...} — box =
//     cutia care înconjoară etapele ACTIVE; straja_prison.js nu socotește fugar
//     un deținut care e înăuntru. Orice deținut nefugar muncește la mină când vrea — fără gardă.
//   * registrul și celulele se citesc DOAR-CITIRE (strajaPrisonJail / strajaPrisonCfg).
// Evadare/recapturare (fugar → survival, întors → adventure, gărzi agresive)
// rămân în straja_prison.js.
// ============================================================================

const PM_KEY = 'strajaPrisonMine'
const PM_BROKEN_KEY = 'strajaPrisonMineBroken'
const PM_TEAM = 'Straja'

// Minute după care un bloc săpat în zone reapare (per bloc, de la momentul săpării) — pentru deținuți ȘI
// pentru Straja, ca mina să dea la fel oricine o lucrează. 0 = oprit (rămâne doar resetul complet).
const PM_REFILL_MINUTES = 20
const PM_BROKEN_MAX = 30000
// Zone comprimate: lățime, adâncime (spre exterior), rază verticală. Originalul = 48 / 48 / 16.
const PM_ZONE_W = 24
const PM_ZONE_D = 24
const PM_ZONE_R = 8
const PM_RESTORE_PER_SECOND = 150
const PM_BLOCKS_PER_TICK = 3000
// Reset complet al zonei, ca în mina Straja (0 = oprit). Avertisment cu atâtea secunde înainte.
const PM_RESET_HOURS = 8
const PM_RESET_WARN_SECONDS = 60
// Mina existentă preluată automat la prima încărcare ('' = oprit). Vezi /prisonmine adopt.
const PM_ADOPT_MINE = 'mina_straja_continent'
const PM_MINES_FOLDER = 'kubejs/config/custom_mines/mines/'
const PM_OLD_STATE_FILE = 'kubejs/config/custom_mines_state_v6.json'

const PM_PICK_NAME = 'Târnăcop Straja'
// can_break: piatra de bază + #c:ores + EXACT blocurile din minereurile configurate ale zonelor
// (sulful butchery și dripstone nu sunt în niciun tag — fără asta deținuții nu le pot săpa).
function pmPickGiveString() {
  var ids = { 'minecraft:dripstone_block': true, 'minecraft:pointed_dripstone': true }
  for (var i = 0; i < PM_STAGES.length; i++) {
    var st = PM.stages[PM_STAGES[i].id]
    if (PM_STAGES[i].kind === 'zone' && st && st.ores) {
      for (var k = 0; k < st.ores.length; k++) ids[String(st.ores[k].block)] = true
    }
  }
  var list = Object.keys(ids).map(function (id) { return '"' + id + '"' }).join(',')
  return 'minecraft:iron_pickaxe[custom_name=\'{"text":"' + PM_PICK_NAME + '","color":"gray","italic":false}\',' +
    'can_break={predicates:[{blocks:"#minecraft:base_stone_overworld"},{blocks:"#c:ores"},{blocks:[' + list + ']}],show_in_tooltip:false},' +
    'unbreakable={show_in_tooltip:false}]'
}

// Etapele, în ordinea minei originale. `dir` = ramura (nord/est/sud/vest) ca în mina Straja.
const PM_STAGES = [
  { id: 'shaft_1', name: 'Puț 1 + hub', kind: 'shaft', tpl: 'mines:mine_shaft_1' },
  { id: 'warehouse', name: 'Depozit', kind: 'warehouse', tpl: 'mines:warehouse' },
  { id: 'zone_1', name: 'Zona 1 (peșteri de sulf)', kind: 'zone', dir: 'north' },
  { id: 'zone_2', name: 'Zona 2 (stalactite)', kind: 'zone', dir: 'east' },
  { id: 'zone_3', name: 'Zona 3 (filoane de fier)', kind: 'zone', dir: 'south' },
  { id: 'zone_4', name: 'Zona 4 (bolți de calcar)', kind: 'zone', dir: 'west' },
  { id: 'shaft_2', name: 'Puț 2', kind: 'shaft', tpl: 'mines:mine_shaft_2' }
]

// Minereuri implicite = cele din mina Straja (mina_straja_continent.json), cu
// număr de blocuri scalat la volumul comprimat. Editabile: /prisonmine ore.
const PM_DEFAULT_ORES = {
  zone_1: [['butchery:sulfur_ore', 900, 22], ['minecraft:iron_ore', 600, 20], ['minecraft:coal_ore', 700, 20], ['minecraft:dripstone_block', 300, 6]],
  zone_2: [['minecraft:dripstone_block', 1200, 28], ['minecraft:pointed_dripstone', 800, 14], ['butchery:sulfur_ore', 500, 14]],
  zone_3: [['minecraft:iron_ore', 800, 20], ['minecraft:deepslate_redstone_ore', 500, 12], ['butchery:sulfur_ore', 200, 8]],
  zone_4: [['butchery:sulfur_ore', 1000, 22], ['minecraft:deepslate_diamond_ore', 100, 5]]
}

var PM = { enabled: false, layout: null, exit: null, stages: {}, dim: null, box: null }
var PM_BROKEN = [] // [x, y, z, blockId, dueEpochMs]
var PM_LOADED = false
var PM_BROKEN_DIRTY = false
var PM_TICKS = 0
var PM_JOBS = [] // joburi în lot: umplere zonă + minereu

const $PM_Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const $PM_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $PM_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $PM_IdArgument = Java.loadClass('net.minecraft.commands.arguments.ResourceLocationArgument')
const $PM_BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $PM_Registries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $PM_Id = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $PM_PlaceSettings = Java.loadClass('net.minecraft.world.level.levelgen.structure.templatesystem.StructurePlaceSettings')
const $PM_Rotation = Java.loadClass('net.minecraft.world.level.block.Rotation')
const $PM_Mirror = Java.loadClass('net.minecraft.world.level.block.Mirror')
const $PM_StructureBE = Java.loadClass('net.minecraft.world.level.block.entity.StructureBlockEntity')

// ---- persistență ----------------------------------------------------------

function pmLoad(server) {
  PM = { enabled: false, layout: null, exit: null, stages: {}, dim: null, box: null }
  PM_BROKEN = []
  try {
    var raw = String(server.persistentData.getString(PM_KEY) || '')
    if (raw.length > 2) PM = JSON.parse(raw)
    var rawB = String(server.persistentData.getString(PM_BROKEN_KEY) || '')
    if (rawB.length > 2) PM_BROKEN = JSON.parse(rawB)
  } catch (e) {
    console.error('[PrisonMine] load failed: ' + e)
  }
  if (PM.stages === undefined) PM.stages = {}
  PM_LOADED = true
}

function pmSave(server) {
  server.persistentData.putString(PM_KEY, JSON.stringify(PM))
}

function pmSaveBroken(server) {
  server.persistentData.putString(PM_BROKEN_KEY, JSON.stringify(PM_BROKEN))
  PM_BROKEN_DIRTY = false
}

// ---- helpers ---------------------------------------------------------------

function pmName(p) {
  try { return String(p.getGameProfile().getName()) } catch (e) { return String(p.getName().getString()) }
}

function pmSay(src, text) {
  src.sendSystemMessage(Text.literal(text))
}

function pmLink(text, cmd) {
  var link = Text.literal('§b§n' + text)
  try { link = link.clickRunCommand(cmd) } catch (e) { /* text fallback */ }
  return link
}

function pmSrcPlayer(ctx) {
  var ent = null
  try { ent = ctx.source.getEntity() } catch (e) { ent = null }
  return (ent !== null && ent !== undefined && ent instanceof $PM_Player) ? ent : null
}

function pmTeam(p) {
  try { var t = p.getTeam(); return t ? String(t.getName()) : '' } catch (e) { return '' }
}

// Straja = echipa "Straja" sau op — ca în restul scripturilor Straja.
function pmIsStraja(p) {
  return pmTeam(p) === PM_TEAM || p.hasPermissions(2)
}

function pmStageDef(id) {
  for (var i = 0; i < PM_STAGES.length; i++) if (PM_STAGES[i].id === id) return PM_STAGES[i]
  return null
}

function pmStage(id) {
  if (PM.stages[id] === undefined) PM.stages[id] = { built: false, active: false, box: null, ores: null }
  return PM.stages[id]
}

function pmReady() {
  return PM.layout !== null && PM.layout !== undefined
}

function pmBoxHas(b, x, y, z) {
  return b !== null && b !== undefined && x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2 && z >= b.z1 && z <= b.z2
}

// Cutiile ACTIVE (intrarea e mereu activă după `place`). Doar acolo se intră și se sapă.
function pmActiveBoxes() {
  var out = []
  if (!pmReady()) return out
  if (PM.stages.entrance && PM.stages.entrance.box) out.push(PM.stages.entrance.box)
  var shaftActive = (PM.stages.shaft_1 && PM.stages.shaft_1.active) || (PM.stages.shaft_2 && PM.stages.shaft_2.active)
  if (shaftActive && PM.stages.shaft_1 && PM.stages.shaft_1.box) out.push(PM.stages.shaft_1.box)
  for (var i = 0; i < PM_STAGES.length; i++) {
    var d = PM_STAGES[i]
    if (d.kind === 'shaft') continue
    var s = PM.stages[d.id]
    if (s && s.active && s.box) out.push(s.box)
  }
  return out
}

function pmInActive(dim, x, y, z) {
  if (!pmReady() || PM.layout.dim !== dim) return false
  var boxes = pmActiveBoxes()
  for (var i = 0; i < boxes.length; i++) if (pmBoxHas(boxes[i], x, y, z)) return true
  return false
}

function pmInZone(dim, x, y, z) {
  if (!pmReady() || PM.layout.dim !== dim) return false
  for (var i = 0; i < PM_STAGES.length; i++) {
    if (PM_STAGES[i].kind !== 'zone') continue
    var st = PM.stages[PM_STAGES[i].id]
    if (st && st.active && pmBoxHas(st.box, x, y, z)) return true
  }
  return false
}

function pmPlayerInActive(p) {
  return pmInActive(String(p.level.dimension), Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))
}

// publică cutia care înconjoară etapele active (citită de straja_prison.js)
function pmPublish(server) {
  var boxes = pmActiveBoxes()
  PM.box = null
  PM.dim = pmReady() ? PM.layout.dim : null
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i]
    if (PM.box === null) PM.box = { x1: b.x1, y1: b.y1, z1: b.z1, x2: b.x2, y2: b.y2, z2: b.z2 }
    else {
      PM.box.x1 = Math.min(PM.box.x1, b.x1); PM.box.x2 = Math.max(PM.box.x2, b.x2)
      PM.box.y1 = Math.min(PM.box.y1, b.y1); PM.box.y2 = Math.max(PM.box.y2, b.y2)
      PM.box.z1 = Math.min(PM.box.z1, b.z1); PM.box.z2 = Math.max(PM.box.z2, b.z2)
    }
  }
  pmSave(server)
}

// registrul de custodie (read-only): {name:{status,jcell,...}}
var PM_JAIL_RAW = null
var PM_JAIL_PARSED = {}
function pmJailMap(server) {
  try {
    var raw = String(server.persistentData.getString('strajaPrisonJail') || '')
    if (raw === PM_JAIL_RAW) return PM_JAIL_PARSED
    PM_JAIL_RAW = raw
    PM_JAIL_PARSED = raw.length > 2 ? (JSON.parse(raw).jailed || {}) : {}
    return PM_JAIL_PARSED
  } catch (e) { /* registru ilizibil */ }
  return {}
}

function pmJailEntry(jailed, name) {
  if (jailed[name] !== undefined) return jailed[name]
  var lower = String(name).toLowerCase()
  for (var k in jailed) if (k.toLowerCase() === lower) return jailed[k]
  return null
}

// Deținut care poate munci = în registru și nefugar. Liber la mină oricând — nu trebuie trimis de nimeni.
function pmIsWorker(jailed, p) {
  var e = pmJailEntry(jailed, pmName(p))
  return e !== null && e.status !== 'fugitive'
}

function pmCellOf(server, entry) {
  try {
    var cfg = JSON.parse(String(server.persistentData.getString('strajaPrisonCfg') || '{}'))
    var jc = cfg.jcells || []
    if (entry.jcell !== undefined && entry.jcell >= 0 && entry.jcell < jc.length && jc[entry.jcell].removed !== true) return jc[entry.jcell]
    return cfg.jailTarget || null
  } catch (e) { return null }
}

// urcă punctul până găsește 2 blocuri libere (șabloanele își pun podeaua chiar pe stratul de start)
function pmSafeSpot(server, spot) {
  try {
    var level = server.getLevel(spot.dim)
    var x = Math.floor(spot.x)
    var z = Math.floor(spot.z)
    for (var dy = 0; dy <= 8; dy++) {
      var y = Math.floor(spot.y) + dy
      var a = String(level.getBlock(x, y, z).id)
      var b = String(level.getBlock(x, y + 1, z).id)
      if (a.indexOf('air') >= 0 && b.indexOf('air') >= 0) {
        return { dim: spot.dim, x: spot.x, y: y, z: spot.z, yaw: spot.yaw }
      }
    }
  } catch (e) { /* chunk indisponibil — punctul brut */ }
  return spot
}

function pmTp(server, p, spot) {
  spot = pmSafeSpot(server, spot)
  var yaw = spot.yaw === undefined ? 0 : spot.yaw
  server.runCommandSilent('execute in ' + spot.dim + ' run tp "' + pmName(p) + '" ' + spot.x + ' ' + spot.y + ' ' + spot.z + ' ' + yaw + ' 0')
}

function pmEntrancePoint() {
  var l = PM.layout
  return { dim: l.dim, x: l.x + 0.5, y: l.y, z: l.z + 0.5, yaw: 0 }
}

// ieșirea: setată de admin sau, implicit, 8 blocuri în fața intrării
function pmExitPoint() {
  if (PM.exit !== null && PM.exit !== undefined) return PM.exit
  var l = PM.layout
  var f = pmForward(l.facing)
  return { dim: l.dim, x: l.x + f.x * 8 + 0.5, y: l.y, z: l.z + f.z * 8 + 0.5, yaw: 0 }
}

// ---- geometrie (aceeași ca în custom_mines/20_layout.js) ----------------------------

const PM_FACINGS = ['north', 'east', 'south', 'west']

function pmForward(facing) {
  if (facing === 'north') return { x: 0, z: -1 }
  if (facing === 'east') return { x: 1, z: 0 }
  if (facing === 'south') return { x: 0, z: 1 }
  return { x: -1, z: 0 }
}

function pmRight(facing) {
  if (facing === 'north') return { x: 1, z: 0 }
  if (facing === 'east') return { x: 0, z: 1 }
  if (facing === 'south') return { x: -1, z: 0 }
  return { x: 0, z: -1 }
}

function pmCentered(center, size) {
  var min = center - Math.floor((size - 1) / 2)
  return { min: min, max: min + size - 1 }
}

// origine de așezare pentru un dreptunghi rotit (colțul-pivot al șablonului)
function pmRectOrigin(cx, cz, sx, sz, facing) {
  var hx = Math.floor((sx - 1) / 2)
  var hz = Math.floor((sz - 1) / 2)
  if (facing === 'north') return { x: cx - hx, z: cz - hz }
  if (facing === 'east') return { x: cx + hz, z: cz - hx }
  if (facing === 'south') return { x: cx + hx, z: cz + hz }
  return { x: cx - hz, z: cz + hx }
}

function pmRotationFor(facing) {
  var turns = PM_FACINGS.indexOf(facing)
  if (turns === 0) return $PM_Rotation.NONE
  if (turns === 1) return $PM_Rotation.CLOCKWISE_90
  if (turns === 2) return $PM_Rotation.CLOCKWISE_180
  return $PM_Rotation.COUNTERCLOCKWISE_90
}

function pmRotateFacing(facing, quarter) {
  var i = (PM_FACINGS.indexOf(facing) + quarter) % 4
  return PM_FACINGS[i < 0 ? i + 4 : i]
}

// Parametrii geometriei. Impliciți = mina Straja cu zonele comprimate; la `adopt` se iau din
// definiția minei existente (aceleași mărimi, aceleași poziții).
function pmDefaultOpts() {
  return { entW: 11, entD: 11, entH: 11, shW: 19, shD: 19, shH: 44, back: -1, up: 7,
    zoneW: PM_ZONE_W, zoneD: PM_ZONE_D, zoneR: PM_ZONE_R, zoneYOff: 0,
    whW: 11, whD: 21, whH: 15, whDiag: 16, whBack: 3, whQuarter: 1, whY: 0, whFixed: null }
}

// Calculează cutiile + originile pentru toate construcțiile minei.
function pmCompute(layout) {
  var o = layout.o || pmDefaultOpts()
  var f = pmForward(layout.facing)
  var r = pmRight(layout.facing)
  var out = {}

  // intrarea, centrată pe punctul adminului
  var ex = pmCentered(layout.x, o.entW)
  var ez = pmCentered(layout.z, o.entD)
  out.entrance = { x1: ex.min, x2: ex.max, y1: layout.y, y2: layout.y + o.entH - 1, z1: ez.min, z2: ez.max,
    origin: pmRectOrigin(layout.x, layout.z, o.entW, o.entD, layout.facing), oy: layout.y, facing: layout.facing }

  // puțul, în spatele intrării (jumătăți + 1 + offset), cu `up` pe verticală
  var halfHubX = Math.floor((o.shW - 1) / 2)
  var halfHubZ = Math.floor((o.shD - 1) / 2)
  var dist = Math.floor((o.entD - 1) / 2) + 1 + halfHubZ + o.back
  var sx = layout.x - f.x * dist
  var sz = layout.z - f.z * dist
  var sy = layout.y + o.up
  var shx = pmCentered(sx, o.shW)
  var shz = pmCentered(sz, o.shD)
  var shaftMinY = sy - o.shH + 1
  out.shaft = { x1: shx.min, x2: shx.max, y1: shaftMinY, y2: sy, z1: shz.min, z2: shz.max,
    origin: pmRectOrigin(sx, sz, o.shW, o.shD, layout.facing), oy: shaftMinY, facing: layout.facing }

  // depozitul: poziția salvată de mina existentă, altfel în diagonală (lateral + înainte − înapoi)
  if (o.whFixed) {
    out.warehouse = o.whFixed
  } else {
    var wf = pmRotateFacing(layout.facing, o.whQuarter)
    var wx = layout.x + f.x * o.whDiag + r.x * o.whDiag - f.x * o.whBack
    var wz = layout.z + f.z * o.whDiag + r.z * o.whDiag - f.z * o.whBack
    var swap = wf === 'east' || wf === 'west'
    var wbx = pmCentered(wx, swap ? o.whD : o.whW)
    var wbz = pmCentered(wz, swap ? o.whW : o.whD)
    out.warehouse = { x1: wbx.min, x2: wbx.max, y1: layout.y + o.whY, y2: layout.y + o.whY + o.whH - 1, z1: wbz.min, z2: wbz.max,
      origin: pmRectOrigin(wx, wz, o.whW, o.whD, wf), oy: layout.y + o.whY, facing: wf }
  }

  // zonele de minat: adiacente puțului, la nivelul hubului
  var wxs = pmCentered(sx, o.zoneW)
  var wzs = pmCentered(sz, o.zoneW)
  var y1 = shaftMinY + o.zoneYOff - o.zoneR
  var y2 = shaftMinY + o.zoneYOff + o.zoneR
  out.north = { x1: wxs.min, x2: wxs.max, y1: y1, y2: y2, z1: sz - halfHubZ - o.zoneD, z2: sz - halfHubZ - 1 }
  out.south = { x1: wxs.min, x2: wxs.max, y1: y1, y2: y2, z1: sz + halfHubZ + 1, z2: sz + halfHubZ + o.zoneD }
  out.east = { x1: sx + halfHubX + 1, x2: sx + halfHubX + o.zoneD, y1: y1, y2: y2, z1: wzs.min, z2: wzs.max }
  out.west = { x1: sx - halfHubX - o.zoneD, x2: sx - halfHubX - 1, y1: y1, y2: y2, z1: wzs.min, z2: wzs.max }
  return out
}

function pmBoxFor(def, geo) {
  if (def.kind === 'shaft') return geo.shaft
  if (def.kind === 'warehouse') return geo.warehouse
  return geo[def.dir]
}

// ---- construcții: șabloanele minei ---------------------------------------------------

function pmPlaceTemplate(server, dim, tplId, g) {
  try {
    var level = server.getLevel(dim)
    var opt = server.getStructureManager().get($PM_Id.parse(tplId))
    if (!opt || !opt.isPresent()) throw new Error('șablon lipsă: ' + tplId)
    var pos = new $PM_BlockPos(g.origin.x, g.oy, g.origin.z)
    var settings = new $PM_PlaceSettings().setMirror($PM_Mirror.NONE).setRotation(pmRotationFor(g.facing))
    return !!opt.get().placeInWorld(level, pos, pos, settings, $PM_StructureBE.createRandom(0), 2)
  } catch (e) {
    console.error('[PrisonMine] placement failed (' + tplId + '): ' + e)
    return false
  }
}

function pmCmdPlace(ctx, facing) {
  var p = pmSrcPlayer(ctx)
  if (p === null) { pmSay(ctx.source, '§c[Mina] comanda se rulează de un jucător.'); return 0 }
  if (pmReady()) { pmSay(ctx.source, '§c[Mina] există deja o mină plasată. §f/prisonmine reset§c o uită (blocurile rămân în lume).'); return 0 }
  var server = ctx.source.server
  var layout = { dim: String(p.level.dimension), facing: facing, x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z), o: pmDefaultOpts() }
  var geo = pmCompute(layout)
  if (!pmPlaceTemplate(server, layout.dim, 'mines:mine_entrance', geo.entrance)) {
    pmSay(ctx.source, '§c[Mina] intrarea n-a putut fi plasată (șablonul mines:mine_entrance există în world/generated?). Vezi consola.')
    return 0
  }
  PM.layout = layout
  PM.stages = {}
  PM.stages.entrance = { built: true, active: true, box: geo.entrance, ores: null }
  // cutiile etapelor se rețin acum — comprimarea rămâne stabilă chiar dacă constantele se schimbă
  for (var i = 0; i < PM_STAGES.length; i++) {
    var d = PM_STAGES[i]
    var s = pmStage(d.id)
    s.box = pmBoxFor(d, geo)
    if (d.kind === 'zone') { s.ores = pmDefaultOres(d.id); s.resetHours = PM_RESET_HOURS; s.nextResetAt = 0 }
  }
  pmPublish(server)
  pmSay(ctx.source, '§a[Mina] intrarea plasată (' + facing + '). Următorul pas: §f/prisonmine stage shaft_1 on')
  return 1
}

// ---- etape ----------------------------------------------------------------------------------

function pmBlockExists(id) {
  try { return !!$PM_Registries.BLOCK.containsKey($PM_Id.parse(String(id))) } catch (e) { return false }
}

function pmZoneScale() {
  return (PM_ZONE_W * PM_ZONE_D * (PM_ZONE_R * 2 + 1)) / (48 * 48 * 33)
}

function pmDefaultOres(zoneId) {
  var out = []
  var src = PM_DEFAULT_ORES[zoneId] || []
  for (var i = 0; i < src.length; i++) {
    if (!pmBlockExists(src[i][0])) { console.error('[PrisonMine] bloc inexistent în implicite: ' + src[i][0]); continue }
    out.push({ block: src[i][0], count: Math.max(6, Math.round(src[i][1] * pmZoneScale())), vein: src[i][2] })
  }
  return out
}

// Listă de minereuri de pus: vene aleatorii în cutie; în jumătatea de jos (deepslate)
// minecraft:*_ore devine varianta deepslate_ dacă există.
function pmGenOres(box, split, ores) {
  var out = []
  var used = {}
  for (var i = 0; i < ores.length; i++) {
    var o = ores[i]
    var id = String(o.block)
    var deepId = null
    var m = id.match(/^minecraft:([a-z_]+_ore)$/)
    if (m !== null && pmBlockExists('minecraft:deepslate_' + m[1])) deepId = 'minecraft:deepslate_' + m[1]
    var placed = 0
    var attempts = 0
    while (placed < o.count && attempts < o.count * 6) {
      attempts++
      var x = box.x1 + Math.floor(Math.random() * (box.x2 - box.x1 + 1))
      var y = box.y1 + Math.floor(Math.random() * (box.y2 - box.y1 + 1))
      var z = box.z1 + Math.floor(Math.random() * (box.z2 - box.z1 + 1))
      for (var v = 0; v < o.vein && placed < o.count; v++) {
        if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2 && z >= box.z1 && z <= box.z2) {
          var key = x + ',' + y + ',' + z
          if (used[key] === undefined) {
            used[key] = true
            out.push([x, y, z, (y <= split && deepId !== null) ? deepId : id])
            placed++
          }
        }
        var axis = Math.floor(Math.random() * 3)
        var step = Math.random() < 0.5 ? -1 : 1
        if (axis === 0) x += step
        else if (axis === 1) y += step
        else z += step
      }
    }
  }
  return out
}

// sus de linia de despărțire = stone, dedesubt = deepslate (ca la resetul minei)
function pmZoneSplit(box) {
  return box.y1 + Math.floor((box.y2 - box.y1 + 1) / 2) - 1
}

function pmQueueZone(server, id, by) {
  var s = pmStage(id)
  // zona se reface complet: reapariția pe blocuri din zonă nu mai are sens
  var keep = []
  for (var i = 0; i < PM_BROKEN.length; i++) if (!pmBoxHas(s.box, PM_BROKEN[i][0], PM_BROKEN[i][1], PM_BROKEN[i][2])) keep.push(PM_BROKEN[i])
  PM_BROKEN = keep
  PM_BROKEN_DIRTY = true
  var split = pmZoneSplit(s.box)
  s.warned = false
  PM_JOBS.push({ id: id, box: s.box, split: split, ores: pmGenOres(s.box, split, s.ores || []), x: s.box.x1, y: s.box.y1, z: s.box.z1, phase: 0, i: 0, by: by })
}

function pmJobStep(server) {
  var job = PM_JOBS[0]
  var level = server.getLevel(PM.layout.dim)
  if (level === null || level === undefined) { PM_JOBS.shift(); return }
  var b = job.box
  var n = 0
  while (n < PM_BLOCKS_PER_TICK) {
    if (job.phase === 0) {
      if (job.y > b.y2) { job.phase = 1; continue }
      try { level.getBlock(job.x, job.y, job.z).set(job.y <= job.split ? 'minecraft:deepslate' : 'minecraft:stone') } catch (e) { /* bloc indisponibil */ }
      job.x++
      if (job.x > b.x2) { job.x = b.x1; job.z++ }
      if (job.z > b.z2) { job.z = b.z1; job.y++ }
    } else {
      if (job.i >= job.ores.length) {
        PM_JOBS.shift()
        var done = PM.stages[job.id]
        if (done) {
          done.nextResetAt = done.resetHours > 0 ? Date.now() + done.resetHours * 3600000 : 0
          done.warned = false
          pmSave(server)
        }
        var who = job.by === '' ? null : server.getPlayerList().getPlayerByName(job.by)
        if (who !== null && who !== undefined) who.tell(Text.literal('§a[Mina] ' + job.id + ' gata — ' + job.ores.length + ' blocuri de minereu.'))
        console.info('[PrisonMine] ' + job.id + ' regenerated: ' + job.ores.length + ' ore blocks')
        return
      }
      var o = job.ores[job.i++]
      try { level.getBlock(o[0], o[1], o[2]).set(o[3]) } catch (e) { /* bloc indisponibil */ }
    }
    n++
  }
}

function pmSetStage(ctx, id, action) {
  var def = pmStageDef(id)
  if (def === null) { pmSay(ctx.source, '§c[Mina] etapă necunoscută. Etape: ' + PM_STAGES.map(function (d) { return d.id }).join(', ')); return 0 }
  if (!pmReady()) { pmSay(ctx.source, '§c[Mina] plasează întâi intrarea: §f/prisonmine place <north|east|south|west>'); return 0 }
  var server = ctx.source.server
  var s = pmStage(id)
  var by = ''
  var p = pmSrcPlayer(ctx)
  if (p !== null) by = pmName(p)

  if (action === 'off') {
    pmRecallWorkers(server, def.kind === 'shaft' ? null : s.box)
    s.active = false
    pmPublish(server)
    pmSay(ctx.source, '§e[Mina] ' + def.name + ' dezactivată — rămâne construită, dar nu se mai intră/sapă acolo.')
    return 1
  }
  if (action === 'regen' && def.kind !== 'zone') { pmSay(ctx.source, '§c[Mina] regen doar pentru zone.'); return 0 }
  if (def.kind !== 'warehouse' && id !== 'shaft_1' && !pmStage('shaft_1').built) {
    pmSay(ctx.source, '§c[Mina] mai întâi §fstage shaft_1 on§c (zonele și puțul 2 pleacă din puț).')
    return 0
  }

  if (def.kind === 'zone') {
    if (action === 'on' && s.built) { s.active = true; pmPublish(server); pmSay(ctx.source, '§a[Mina] ' + def.name + ' activată.'); return 1 }
    pmQueueZone(server, id, by)
    s.built = true
    s.active = true
    pmPublish(server)
    pmSay(ctx.source, '§e[Mina] ' + def.name + ': se umple + minereu (' + PM_BLOCKS_PER_TICK + ' blocuri/tick) — primești mesaj la final.')
    return 1
  }

  // construcții din șablon: puț 1 / depozit / puț 2
  if (action === 'on' && s.built) { s.active = true; pmPublish(server); pmSay(ctx.source, '§a[Mina] ' + def.name + ' activată.'); return 1 }
  var geo = pmCompute(PM.layout)
  if (!pmPlaceTemplate(server, PM.layout.dim, def.tpl, pmBoxFor(def, geo))) {
    pmSay(ctx.source, '§c[Mina] ' + def.name + ' n-a putut fi plasată. Vezi consola.')
    return 0
  }
  s.built = true
  s.active = true
  pmPublish(server)
  pmSay(ctx.source, '§a[Mina] ' + def.name + ' construită și activă.')
  return 1
}

function pmOresText(s) {
  if (!s.ores || s.ores.length === 0) return 'fără minereu'
  return s.ores.map(function (o) { return o.block.replace('minecraft:', '') + ' ' + o.count + '/' + o.vein }).join(', ')
}

function pmCmdStages(ctx) {
  var src = ctx.source
  if (!pmReady()) { pmSay(src, '§c[Mina] nu e plasată: §f/prisonmine place <north|east|south|west>'); return 0 }
  pmSay(src, '§b[Mina] etape (click pentru on/off):')
  for (var i = 0; i < PM_STAGES.length; i++) {
    var d = PM_STAGES[i]
    var s = pmStage(d.id)
    var line = Text.literal('  ' + (s.active ? '§a✓ ' : (s.built ? '§e● ' : '§c✗ ')) + '§f' + d.id + ' §7' + d.name + ' ')
    line = line.append(pmLink('[' + (s.active ? 'off' : 'on') + ']', '/prisonmine stage ' + d.id + ' ' + (s.active ? 'off' : 'on')))
    if (d.kind === 'zone') line = line.append(Text.literal(' ')).append(pmLink('[regen]', '/prisonmine stage ' + d.id + ' regen'))
    src.sendSystemMessage(line)
    if (d.kind === 'zone') pmSay(src, '      §8' + pmOresText(s))
  }
  pmSay(src, '§7  ✓ activă · ● construită dar oprită · ✗ neconstruită. Minereuri: §f/prisonmine help minereu')
  return 1
}

// ---- minereu pe zonă ------------------------------------------------------------------------

function pmZoneStage(ctx, id) {
  var def = pmStageDef(id)
  if (def === null || def.kind !== 'zone') { pmSay(ctx.source, '§c[Mina] zonă validă: zone_1, zone_2, zone_3, zone_4'); return null }
  if (!pmReady()) { pmSay(ctx.source, '§c[Mina] plasează întâi intrarea.'); return null }
  return pmStage(id)
}

function pmCmdOres(ctx, id) {
  var s = pmZoneStage(ctx, id)
  if (s === null) return 0
  pmSay(ctx.source, '§b[Mina] ' + id + ' — minereu (bloc număr/mărime-venă): §f' + pmOresText(s))
  pmSay(ctx.source, '§7  modifici cu §fore ' + id + ' add|remove|default§7, apoi §fstage ' + id + ' regen§7 ca să se aplice.')
  return 1
}

function pmCmdOreAdd(ctx, id, blockId, count, vein) {
  var s = pmZoneStage(ctx, id)
  if (s === null) return 0
  var block = String(blockId)
  if (!pmBlockExists(block)) { pmSay(ctx.source, '§c[Mina] blocul ' + block + ' nu există.'); return 0 }
  if (s.ores === null) s.ores = []
  var found = false
  for (var i = 0; i < s.ores.length; i++) {
    if (s.ores[i].block === block) { s.ores[i].count = count; s.ores[i].vein = vein; found = true }
  }
  if (!found) s.ores.push({ block: block, count: count, vein: vein })
  pmSave(ctx.source.server)
  pmSay(ctx.source, '§a[Mina] ' + id + ': ' + block + ' ' + count + ' blocuri, vene de ' + vein + '. §7Aplică cu §fstage ' + id + ' regen')
  return 1
}

function pmCmdOreRemove(ctx, id, blockId) {
  var s = pmZoneStage(ctx, id)
  if (s === null) return 0
  var block = String(blockId)
  var keep = []
  for (var i = 0; i < (s.ores || []).length; i++) if (s.ores[i].block !== block) keep.push(s.ores[i])
  if (keep.length === (s.ores || []).length) { pmSay(ctx.source, '§c[Mina] ' + block + ' nu e în ' + id + '.'); return 0 }
  s.ores = keep
  pmSave(ctx.source.server)
  pmSay(ctx.source, '§a[Mina] ' + id + ': ' + block + ' scos. §7Aplică cu §fstage ' + id + ' regen')
  return 1
}

function pmCmdOreDefault(ctx, id) {
  var s = pmZoneStage(ctx, id)
  if (s === null) return 0
  s.ores = pmDefaultOres(id)
  pmSave(ctx.source.server)
  pmSay(ctx.source, '§a[Mina] ' + id + ': minereurile minei Straja restaurate. §7Aplică cu §fstage ' + id + ' regen')
  return 1
}

// ---- târnăcop ----------------------------------------------------------------

function pmIsPick(stack) {
  if (stack.isEmpty() || String(stack.id) !== 'minecraft:iron_pickaxe') return false
  try { return String(stack.getHoverName().getString()) === PM_PICK_NAME } catch (e) { return false }
}

function pmHasPick(p) {
  var inv = p.getInventory()
  for (var i = 0; i < inv.getContainerSize(); i++) if (pmIsPick(inv.getItem(i))) return true
  return false
}

function pmStripPicks(p) {
  var inv = p.getInventory()
  var n = 0
  for (var i = 0; i < inv.getContainerSize(); i++) {
    if (pmIsPick(inv.getItem(i))) { inv.setItem(i, Item.empty); n++ }
  }
  return n
}

function pmGivePick(server, p) {
  if (!pmHasPick(p)) server.runCommandSilent('give "' + pmName(p) + '" ' + pmPickGiveString())
}

// ---- bucla principală ---------------------------------------------------------

// 1s: reapariția blocurilor săpate (max PM_RESTORE_PER_SECOND / secundă).
function pmRestoreTick(server) {
  if (PM_BROKEN.length === 0 || !pmReady()) return
  var level = server.getLevel(PM.layout.dim)
  if (level === null || level === undefined) return
  var now = Date.now()
  var done = 0
  var keep = []
  for (var i = 0; i < PM_BROKEN.length; i++) {
    var r = PM_BROKEN[i]
    if (done < PM_RESTORE_PER_SECOND && r[4] <= now) {
      try {
        if (!level.isLoaded(new $PM_BlockPos(r[0], r[1], r[2]))) { keep.push(r); continue } // fără încărcare forțată de chunkuri
        done++
        var b = level.getBlock(r[0], r[1], r[2])
        var cur = String(b.id)
        if (cur === 'minecraft:air' || cur === 'minecraft:cave_air') b.set(r[3])
      } catch (e) {
        keep.push(r) // chunk indisponibil — reîncearcă
      }
    } else {
      keep.push(r)
    }
  }
  if (done > 0) {
    PM_BROKEN = keep
    PM_BROKEN_DIRTY = true
  }
}

// 1s: reset complet al zonelor la termen (ca în mina Straja) + avertisment cu PM_RESET_WARN_SECONDS înainte.
function pmZoneResetTick(server) {
  var now = Date.now()
  for (var i = 0; i < PM_STAGES.length; i++) {
    var d = PM_STAGES[i]
    if (d.kind !== 'zone') continue
    var s = PM.stages[d.id]
    if (!s || !s.built || !s.active || !s.box || !(s.resetHours > 0) || !(s.nextResetAt > 0)) continue
    var left = s.nextResetAt - now
    if (left <= 0) {
      var busy = false
      for (var j = 0; j < PM_JOBS.length; j++) if (PM_JOBS[j].id === d.id) busy = true
      if (busy) continue
      pmEvacuate(server, s.box)
      pmQueueZone(server, d.id, '')
      pmSave(server)
      console.info('[PrisonMine] ' + d.id + ' scheduled reset')
    } else if (!s.warned && left <= PM_RESET_WARN_SECONDS * 1000) {
      s.warned = true
      var players = server.getPlayerList().getPlayers()
      for (var k = 0; k < players.size(); k++) {
        var p = players.get(k)
        if (pmBoxHas(s.box, Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) {
          p.tell(Text.literal('§c[Mina] ' + d.name + ' se resetează în ' + PM_RESET_WARN_SECONDS + 's — ieși din zonă!'))
        }
      }
    }
  }
}

// înainte de reset: deținuții la muncă → celulă, ceilalți → intrarea minei
function pmEvacuate(server, box) {
  pmRecallWorkers(server, box)
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var p = players.get(i)
    if (pmBoxHas(box, Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) pmTp(server, p, pmEntrancePoint())
  }
}

// 2s: acces la mină + târnăcop. Un singur pas peste jucători.
function pmAccessTick(server) {
  var jailed = pmJailMap(server)
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var p = players.get(i)
    if (!pmPlayerInActive(p)) {
      // a părăsit zonele active — târnăcopul dispare
      if (pmStripPicks(p) > 0) p.tell(Text.literal('§7[Mina] Târnăcopul Straja a fost retras.'))
      continue
    }
    if (pmIsStraja(p)) continue
    if (PM.enabled && pmIsWorker(jailed, p)) {
      pmGivePick(server, p)
      continue
    }
    // intrus (liber non-Straja sau fugar) → scos din mină
    pmTp(server, p, pmExitPoint())
    p.tell(Text.literal('§c[Mina] Zonă interzisă — mina Straja e doar pentru deținuți și Straja.'))
  }
}

ServerEvents.tick(function (event) {
  var server = event.server
  if (!PM_LOADED) pmLoad(server)

  if (PM_JOBS.length > 0 && pmReady()) pmJobStep(server)

  PM_TICKS++
  if (PM_TICKS % 20 === 0 && PM.enabled) pmRestoreTick(server)
  if (PM_TICKS % 20 === 10 && pmReady()) pmZoneResetTick(server)
  if (PM_TICKS % 40 === 0 && pmReady()) pmAccessTick(server)
  if (PM_TICKS % 200 === 0 && PM_BROKEN_DIRTY) pmSaveBroken(server)
})

ServerEvents.loaded(function (event) {
  pmLoad(event.server)
  // prima încărcare: preia automat mina existentă (aceeași poziție), dezactivând-o în scriptul vechi
  if (PM_ADOPT_MINE !== '' && !pmReady() && PM.adopted !== PM_ADOPT_MINE) pmAdopt(event.server, PM_ADOPT_MINE, null)
})

// ---- blocuri interzise (ca în mina Straja: TNT și ancora de respawn) -----------------------

BlockEvents.placed(function (event) {
  var b = event.block
  var id = String(b.id)
  var p = event.player
  var banned = id === 'minecraft:tnt' || id === 'minecraft:respawn_anchor'
  if (!banned && (p === null || p === undefined || !p.isPlayer() || pmIsStraja(p))) return
  if (pmInActive(String(event.level.dimension), b.x, b.y, b.z)) event.cancel() // TNT/ancoră: toți; restul: doar Straja construiește
})

// ---- săpat -----------------------------------------------------------------------

BlockEvents.broken(function (event) {
  var p = event.player
  if (p === null || p === undefined || !p.isPlayer()) return
  var server = event.server
  var b = event.block
  var inActive = pmInActive(String(event.level.dimension), b.x, b.y, b.z)
  var pd = p.persistentData

  if (!inActive) {
    // un deținut nu sapă în afara zonelor active
    if (pd.getBoolean('cpJailed') && !pd.getBoolean('cpFugitive') && !p.hasPermissions(2)) event.cancel()
    return
  }
  var guard = pmIsStraja(p)
  if (!guard && (!PM.enabled || !pmIsWorker(pmJailMap(server), p))) {
    event.cancel()
    return
  }
  // gărzile/adminii construiesc liber; ce sapă în ZONE (nu în creative) reapare la fel ca la deținuți,
  // ca mina să dea același randament, indiferent cine o lucrează
  if (guard && (p.isCreative() || !pmInZone(String(event.level.dimension), b.x, b.y, b.z))) return
  if (!(PM_REFILL_MINUTES > 0)) return
  var id = String(b.id)
  if (id === 'minecraft:air' || id === 'minecraft:cave_air') return
  PM_BROKEN.push([b.x, b.y, b.z, id, Date.now() + PM_REFILL_MINUTES * 60000])
  if (PM_BROKEN.length > PM_BROKEN_MAX) PM_BROKEN.shift()
  PM_BROKEN_DIRTY = true
})

// ---- preluarea minei existente -----------------------------------------------------------------
// Citește definiția + starea minei din custom_mines, își copiază poziția/etapele/minereurile și
// o dezactivează în scriptul vechi ("enabled": false) — construcțiile rămân neatinse. Copii de
// siguranță: <mină>.prisonmine-backup.json și kubejs/config/prisonmine_backup_<mină>_state.json.

const $PM_Gson = Java.loadClass('com.google.gson.Gson')

function pmJsonRaw(path) {
  try {
    var raw = JsonIO.read(path)
    return (raw === undefined) ? null : raw
  } catch (e) { return null }
}

function pmJsonPlain(raw) {
  if (raw === null) return null
  try { return JSON.parse(String(new $PM_Gson().toJson(raw))) } catch (e) { return null }
}

function pmScheduleReload(server) {
  // scriptul vechi citește definițiile la încărcare: un reload aplică dezactivarea fără restart
  server.scheduleInTicks(100, function () {
    console.info('[PrisonMine] /reload pentru a aplica dezactivarea minei vechi')
    server.runCommandSilent('reload')
  })
}

function pmAdopt(server, mineId, src) {
  var say = function (m) {
    if (src !== null) pmSay(src, m)
    console.info('[PrisonMine] adopt ' + mineId + ': ' + m.replace(/§./g, ''))
  }
  var path = PM_MINES_FOLDER + mineId + '.json'
  var raw = pmJsonRaw(path)
  var def = pmJsonPlain(raw)
  if (def === null || !def.layout || !def.layout.entranceCenter) {
    say('§c[Mina] definiția ' + mineId + ' nu există sau nu e validă (' + path + ').')
    return false
  }
  var st = pmJsonPlain(pmJsonRaw(PM_OLD_STATE_FILE))
  var ms = (st !== null && st.mines && st.mines[mineId]) ? st.mines[mineId] : null

  var L = def.layout
  var o = pmDefaultOpts()
  o.entW = L.entrance.width; o.entD = L.entrance.depth; o.entH = L.entrance.height
  o.shW = L.shaft.width; o.shD = L.shaft.depth; o.shH = L.shaft.height
  var off = (L.shaftStructure && L.shaftStructure.placementOffset) || {}
  o.back = Number(off.back || 0); o.up = Number(off.y || 0)
  o.zoneW = L.miningZone.width; o.zoneD = L.miningZone.depth; o.zoneR = Number(L.miningZone.verticalRadius || 16)
  o.zoneYOff = Number(L.miningZone.entranceYOffset || 0)
  var W = L.warehouseStructure || {}
  o.whW = Number(W.width || 11); o.whD = Number(W.depth || 21); o.whH = Number(W.height || 15)
  o.whDiag = Number(W.diagonalOffset || 10); o.whBack = Number(W.backOffset || 0)
  o.whQuarter = ((Number(W.facingOffsetQuarterTurns || 0) % 4) + 4) % 4
  o.whY = Number(W.yOffset || 0)
  // depozitul pus de jucător: poziția/orientarea salvate de mina veche
  var wp = ms !== null ? ms.warehousePlacement : null
  var wb = (ms !== null && ms.structureBaselines && ms.structureBaselines.warehouse) ? ms.structureBaselines.warehouse.bounds : null
  if (wp && wp.center && wp.facing && wb) {
    o.whFixed = { x1: wb.minX, x2: wb.maxX, y1: wb.minY, y2: wb.maxY, z1: wb.minZ, z2: wb.maxZ,
      origin: pmRectOrigin(wp.center.x, wp.center.z, o.whW, o.whD, String(wp.facing)), oy: wp.center.y, facing: String(wp.facing) }
  }

  var c = L.entranceCenter
  var layout = { dim: String(def.dimension), facing: String(L.facing).toLowerCase(), x: Number(c.x), y: Number(c.y), z: Number(c.z), o: o }
  var geo = pmCompute(layout)

  PM.layout = layout
  PM.exit = null
  PM.stages = {}
  PM.stages.entrance = { built: true, active: true, box: geo.entrance, ores: null }
  var placed = (ms !== null && ms.placedStructures) ? ms.placedStructures : {}
  var done = (ms !== null && ms.completedStages) ? ms.completedStages : {}
  for (var i = 0; i < PM_STAGES.length; i++) {
    var d = PM_STAGES[i]
    var s = pmStage(d.id)
    s.box = pmBoxFor(d, geo)
    var on = d.kind === 'zone' ? done[d.id] === true : placed[d.id] === true
    s.built = on
    s.active = on
    if (d.kind === 'zone') {
      var br = def.branches && def.branches[d.dir] ? def.branches[d.dir] : null
      s.ores = []
      var src2 = br && br.ores ? br.ores : []
      for (var k = 0; k < src2.length; k++) {
        if (pmBlockExists(src2[k].block)) s.ores.push({ block: String(src2[k].block), count: Number(src2[k].count), vein: Number(src2[k].veinSize) })
      }
      s.resetHours = br ? Number(br.resetHours || 0) : 0
      var oldBr = (ms !== null && ms.branches && ms.branches[d.dir]) ? ms.branches[d.dir] : null
      s.nextResetAt = (oldBr !== null && s.resetHours > 0) ? Number(oldBr.nextResetAt || 0) : 0
    }
  }
  PM.enabled = true
  PM.adopted = mineId

  // copii de siguranță, apoi dezactivarea minei vechi (blocurile rămân)
  var changed = false
  try {
    JsonIO.write(PM_MINES_FOLDER + mineId + '.prisonmine-backup.json', raw)
    if (ms !== null) JsonIO.write('kubejs/config/prisonmine_backup_' + mineId + '_state.json', ms)
    if (def.enabled !== false) {
      if (typeof raw.addProperty === 'function') raw.addProperty('enabled', false)
      else raw.put('enabled', false)
      JsonIO.write(path, raw)
      changed = true
    }
  } catch (e) {
    console.error('[PrisonMine] adopt: nu s-a putut dezactiva ' + path + ' :: ' + e)
    say('§c[Mina] mina preluată, dar ' + mineId + ' NU a putut fi dezactivată în scriptul vechi — vezi consola.')
  }
  pmPublish(server)
  if (changed) pmScheduleReload(server)
  say('§a[Mina] ' + mineId + ' preluată în același loc (' + layout.x + ' ' + layout.y + ' ' + layout.z + ', ' + layout.facing + '). Scriptul vechi o dezactivează' + (changed ? ' (reload automat în 5s)' : ' (deja dezactivată)') + '; construcțiile rămân.')
  return true
}

function pmUnadopt(ctx) {
  var id = PM.adopted
  if (!id) { pmSay(ctx.source, '§c[Mina] nicio mină preluată.'); return 0 }
  var backup = pmJsonRaw(PM_MINES_FOLDER + id + '.prisonmine-backup.json')
  if (backup === null) { pmSay(ctx.source, '§c[Mina] lipsește copia de siguranță a definiției ' + id + '.'); return 0 }
  try {
    JsonIO.write(PM_MINES_FOLDER + id + '.json', backup)
  } catch (e) { pmSay(ctx.source, '§c[Mina] nu s-a putut restaura definiția: ' + e); return 0 }
  var server = ctx.source.server
  pmRecallWorkers(server, null)
  PM = { enabled: false, layout: null, exit: null, stages: {}, dim: null, box: null, adopted: id }
  PM_JOBS = []
  pmSave(server)
  pmScheduleReload(server)
  pmSay(ctx.source, '§e[Mina] ' + id + ' redată scriptului vechi (reload automat în 5s). Mina din acest script e oprită; §f/prisonmine adopt ' + id + '§e o preia din nou.')
  return 1
}

function pmCmdAdopt(ctx, id) {
  if (id === '') { pmSay(ctx.source, '§c[Mina] spune ce mină: §f/prisonmine adopt <mine_id>'); return 0 }
  if (pmReady()) { pmSay(ctx.source, '§c[Mina] există deja o mină în acest script. §f/prisonmine reset§c întâi.'); return 0 }
  return pmAdopt(ctx.source.server, id, ctx.source) ? 1 : 0
}

// ---- comenzi: setup -------------------------------------------------------------------

function pmStep(src, done, label, cmds) {
  if (done) { pmSay(src, '  §a✓ §f' + label); return 0 }
  var line = Text.literal('  §c✗ §f' + label)
  if (cmds !== null) {
    line = line.append(Text.literal(' §8→ '))
    for (var i = 0; i < cmds.length; i++) {
      if (i > 0) line = line.append(Text.literal(' §7· '))
      line = line.append(pmLink('/prisonmine ' + cmds[i], '/prisonmine ' + cmds[i]))
    }
  }
  src.sendSystemMessage(line)
  return 1
}

function pmCmdSetup(ctx) {
  var src = ctx.source
  pmSay(src, '§b[Mina] checklist:')
  var miss = 0
  miss += pmStep(src, pmReady(), 'intrarea — stai unde vrei intrarea (la sol) și alege direcția în care privește', ['place north', 'place east', 'place south', 'place west'])
  miss += pmStep(src, pmReady() && pmStage('shaft_1').built, 'puț 1 + hub', pmReady() ? ['stage shaft_1 on'] : null)
  var zones = 0
  for (var i = 0; i < PM_STAGES.length; i++) if (PM_STAGES[i].kind === 'zone' && pmReady() && pmStage(PM_STAGES[i].id).active) zones++
  miss += pmStep(src, zones > 0, 'cel puțin o zonă de minat (' + zones + '/4 active)', pmReady() ? ['stage zone_1 on'] : null)
  miss += pmStep(src, PM.enabled, 'mina pornită', pmReady() ? ['on'] : null)
  pmSay(src, '§7  opțional: §fstage warehouse on§7 · §fstage shaft_2 on§7 · §fexit§7 (altfel ieșirea e 8 blocuri în fața intrării) · §fstage§7 listă · §fhelp')
  if (miss === 0) pmSay(src, '§aGata. Gardă: §f/prisonmine send <deținut>§a — și §f/prisonmine recall <deținut>§a la sfârșit.')
  return 1
}

// coordonatele fiecărei etape (util la verificarea unei mine preluate)
function pmCmdBoxes(ctx) {
  if (!pmReady()) { pmSay(ctx.source, '§c[Mina] nu e plasată.'); return 0 }
  var l = PM.layout
  pmSay(ctx.source, '§b[Mina] intrare ' + l.x + ' ' + l.y + ' ' + l.z + ' (' + l.facing + ')' + (PM.adopted ? ' §7— preluată din ' + PM.adopted : ''))
  var ids = ['entrance'].concat(PM_STAGES.map(function (d) { return d.id }))
  for (var i = 0; i < ids.length; i++) {
    var s = PM.stages[ids[i]]
    if (!s || !s.box) continue
    var b = s.box
    pmSay(ctx.source, '§7  ' + ids[i] + (s.active ? ' §a✓' : (s.built ? ' §e●' : ' §c✗')) + ' §f' + b.x1 + ' ' + b.y1 + ' ' + b.z1 + ' → ' + b.x2 + ' ' + b.y2 + ' ' + b.z2 +
      (s.resetHours > 0 ? ' §8reset ' + s.resetHours + 'h' + (s.nextResetAt > 0 ? ', în ' + Math.round((s.nextResetAt - Date.now()) / 60000) + ' min' : '') : ''))
  }
  return 1
}

function pmCmdExit(ctx) {
  var p = pmSrcPlayer(ctx)
  if (p === null) { pmSay(ctx.source, '§c[Mina] comanda se rulează de un jucător.'); return 0 }
  var dim = String(p.level.dimension)
  if (pmInActive(dim, Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) { pmSay(ctx.source, '§c[Mina] ieșirea trebuie să fie ÎN AFARA etapelor active.'); return 0 }
  var yaw = 0
  try { yaw = Math.round(Number(p.getYRot())) } catch (e) { /* implicit 0 */ }
  PM.exit = { dim: dim, x: Math.floor(p.x) + 0.5, y: Math.floor(p.y), z: Math.floor(p.z) + 0.5, yaw: yaw }
  pmSave(ctx.source.server)
  pmSay(ctx.source, '§a[Mina] ieșirea setată aici.')
  return 1
}

function pmCmdOnOff(ctx, on) {
  if (on && !pmReady()) { pmSay(ctx.source, '§c[Mina] nu e gata — rulează §f/prisonmine setup'); return 0 }
  if (!on) pmRecallWorkers(ctx.source.server, null)
  PM.enabled = on
  pmPublish(ctx.source.server)
  pmSay(ctx.source, on ? '§a[Mina] PORNITĂ — deținuții trimiși pot săpa.' : '§e[Mina] OPRITĂ — nu se mai sapă, nu reapare nimic.')
  return 1
}

function pmCmdRefill(ctx) {
  for (var i = 0; i < PM_BROKEN.length; i++) PM_BROKEN[i][4] = 0
  pmSay(ctx.source, '§a[Mina] ' + PM_BROKEN.length + ' blocuri programate să reapară în câteva secunde.')
  return 1
}

function pmCmdReset(ctx) {
  PM = { enabled: false, layout: null, exit: null, stages: {}, dim: null, box: null, adopted: PM.adopted }
  PM_BROKEN = []
  PM_JOBS = []
  pmSave(ctx.source.server)
  pmSaveBroken(ctx.source.server)
  pmSay(ctx.source, '§e[Mina] configurația ștearsă (construcțiile rămân în lume). Rulează §f/prisonmine setup§e.')
  return 1
}

// ---- comenzi: gardă ------------------------------------------------------------------------

function pmCmdStatus(ctx) {
  var server = ctx.source.server
  var jailed = pmJailMap(server)
  var inMine = 0
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) if (pmReady() && pmPlayerInActive(players.get(i)) && pmIsWorker(jailed, players.get(i))) inMine++
  var active = []
  for (var k = 0; k < PM_STAGES.length; k++) if (pmReady() && pmStage(PM_STAGES[k].id).active) active.push(PM_STAGES[k].id)
  pmSay(ctx.source, '§b[Mina] ' + (PM.enabled ? '§aPORNITĂ' : '§cOPRITĂ') + '§b · ' + (pmReady() ? 'plasată' : '§cneplasată (/prisonmine setup)') +
    '§b · etape active: §f' + (active.length > 0 ? active.join(', ') : '—') + '§b · la muncă: §f' + inMine +
    '§b · în reapariție: §f' + PM_BROKEN.length + (PM_JOBS.length > 0 ? ' §e· construcție în curs (' + PM_JOBS.length + ')' : ''))
  return 1
}

function pmCmdList(ctx) {
  var server = ctx.source.server
  var jailed = pmJailMap(server)
  var names = []
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var p = players.get(i)
    if (pmIsWorker(jailed, p)) names.push(pmName(p))
  }
  pmSay(ctx.source, names.length === 0 ? '§7[Mina] nimeni la muncă.' : '§b[Mina] la muncă (' + names.length + '): §f' + names.join('§7, §f'))
  return 1
}

function pmFindPrisoner(ctx, name) {
  var server = ctx.source.server
  var p = server.getPlayerList().getPlayerByName(name)
  if (p === null || p === undefined) { pmSay(ctx.source, '§c[Mina] ' + name + ' nu e online.'); return null }
  var entry = pmJailEntry(pmJailMap(server), pmName(p))
  if (entry === null) { pmSay(ctx.source, '§c[Mina] ' + pmName(p) + ' nu e în arest.'); return null }
  if (entry.status === 'fugitive') { pmSay(ctx.source, '§c[Mina] ' + pmName(p) + ' e fugar — trebuie prins, nu trimis la muncă.'); return null }
  return { p: p, entry: entry }
}

// Scurtătură pentru gardă (nu e necesară): duce deținutul la intrarea minei, cu târnăcop.
function pmSend(ctx, name) {
  if (!PM.enabled || !pmReady()) { pmSay(ctx.source, '§c[Mina] nu e pornită (§f/prisonmine setup§c).'); return 0 }
  var f = pmFindPrisoner(ctx, name)
  if (f === null) return 0
  var server = ctx.source.server
  pmTp(server, f.p, pmEntrancePoint())
  pmGivePick(server, f.p)
  f.p.tell(Text.literal('§e[Mina] Ești dus la mină. Sapă minereu cu târnăcopul primit.'))
  pmSay(ctx.source, '§a[Mina] ' + pmName(f.p) + ' dus la mină.')
  return 1
}

function pmRecallOne(server, p, entry) {
  pmStripPicks(p)
  var cell = pmCellOf(server, entry)
  if (cell !== null) pmTp(server, p, cell)
  p.tell(Text.literal('§e[Mina] Ai fost rechemat în celulă.'))
}

// deținuții la muncă (în `box`, sau oriunde dacă box e null) sunt rechemați în celulă —
// altfel oprirea unei etape i-ar scoate din mină și i-ar face fugari
function pmRecallWorkers(server, box) {
  var jailed = pmJailMap(server)
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var p = players.get(i)
    if (!pmIsWorker(jailed, p)) continue
    if (box !== null && !pmBoxHas(box, Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) continue
    pmRecallOne(server, p, pmJailEntry(jailed, pmName(p)))
  }
}

function pmRecall(ctx, name) {
  var server = ctx.source.server
  if (name === 'all') {
    var jailed = pmJailMap(server)
    var n = 0
    var players = server.getPlayerList().getPlayers()
    for (var i = 0; i < players.size(); i++) {
      var p = players.get(i)
      if (pmIsWorker(jailed, p)) { pmRecallOne(server, p, pmJailEntry(jailed, pmName(p))); n++ }
    }
    pmSay(ctx.source, '§a[Mina] ' + n + ' deținuți rechemați.')
    return 1
  }
  var f = pmFindPrisoner(ctx, name)
  if (f === null) return 0
  pmRecallOne(server, f.p, f.entry)
  pmSay(ctx.source, '§a[Mina] ' + pmName(f.p) + ' rechemat în celulă.')
  return 1
}

// ---- help ----------------------------------------------------------------------------------------

function pmHelpSuggest(ctx, builder) {
  var t = ['setup', 'etape', 'minereu', 'garda', 'reguli']
  for (var i = 0; i < t.length; i++) builder.suggest(t[i])
  return builder.buildFuture()
}

function pmCmdHelp(ctx, topic) {
  var src = ctx.source
  var t = topic === null ? '' : String(topic)
  if (t === 'setup') {
    pmSay(src, '§b[Mina] SETUP (admin) — §f/prisonmine setup§b arată ce lipsește, cu butoane click.')
    pmSay(src, '§7  1) stai la sol unde vrei intrarea → §fplace <north|east|south|west>§7 (direcția = încotro dă intrarea)')
    pmSay(src, '§7  2) §fstage shaft_1 on§7 (puț + hub, în spatele intrării) · apoi zonele · §fon§7 pornește mina')
    pmSay(src, '§7  (mina Straja existentă e preluată AUTOMAT la prima pornire — aceeași poziție, etape, minereuri; scriptul vechi o dezactivează, construcțiile rămân. §fadopt [mine_id]§7 manual, §funadopt§7 o redă scriptului vechi, §fboxes§7 arată coordonatele)')
    pmSay(src, '§7  3) §fexit§7 = unde sunt scoși intruși (implicit 8 blocuri în fața intrării) · §frefill§7 reapariție imediată · §freset§7 uită configurația')
    return 1
  }
  if (t === 'etape') {
    pmSay(src, '§b[Mina] ETAPE — aceleași construcții ca mina Straja, zonele comprimate (' + PM_ZONE_W + 'x' + PM_ZONE_D + 'x' + (PM_ZONE_R * 2 + 1) + ').')
    pmSay(src, '§7  ' + PM_STAGES.map(function (d) { return d.id }).join(' · '))
    pmSay(src, '§7  §fstage§7 listă · §fstage <id> on§7 construiește + activează · §foff§7 oprește accesul (rămâne construit) · §fregen§7 (zone) reface piatra + minereul')
    return 1
  }
  if (t === 'minereu') {
    pmSay(src, '§b[Mina] MINEREU pe zonă — implicit cel din mina Straja, scalat la zona comprimată.')
    pmSay(src, '§7  §fores <zonă>§7 listă · §fore <zonă> add <bloc> <număr> [mărime-venă]§7 · §fore <zonă> remove <bloc>§7 · §fore <zonă> default')
    pmSay(src, '§7  Modificările se aplică la următorul §fstage <zonă> regen§7 (zona se umple din nou cu piatră + minereul ales).')
    return 1
  }
  if (t === 'garda') {
    pmSay(src, '§b[Mina] GARDĂ (Straja/op):')
    pmSay(src, '§7  Deținuții muncesc la mină când vor (poarta mine-in îi lasă să treacă) — gardianul nu trebuie să-i trimită.')
    pmSay(src, '§7  §fsend <deținut>§7 — scurtătură: îl duce la intrare, cu târnăcop · §frecall <deținut|all>§7 — înapoi în celulă · §flist§7 cine e în mină · §fstatus§7')
    return 1
  }
  if (t === 'reguli') {
    pmSay(src, '§b[Mina] REGULI:')
    pmSay(src, '§7  • doar deținuții trimiși + Straja + op intră în etapele ACTIVE; ceilalți sunt scoși în ≤2s')
    pmSay(src, '§7  • deținuții rămân în adventure; sapă DOAR piatră/minereu, DOAR în etape active, cu Târnăcopul Straja')
    pmSay(src, '§7  • blocurile săpate reapar după ' + PM_REFILL_MINUTES + ' min (ce construiește Straja/op nu e atins)')
    pmSay(src, '§7  • zonele se resetează complet la ' + PM_RESET_HOURS + 'h (avertisment ' + PM_RESET_WARN_SECONDS + 's, cei dinăuntru sunt scoși); TNT și ancora de respawn nu se pun în mină')
    pmSay(src, '§7  • deținut care părăsește mina/celula necontrolat → fugar: survival + gărzi agresive; întors în perimetru → iar adventure')
    return 1
  }
  pmSay(src, '§b[Mina] /prisonmine — mina deținuților Straja:')
  pmSay(src, '§7  gardă: §fsend <deținut> · recall <deținut|all> · list · status')
  pmSay(src, '§7  admin: §fsetup · place <direcție> · adopt/unadopt · boxes · stage [id on|off|regen] · ores/ore <zonă> · exit · on · off · refill · reset')
  pmSay(src, '§7  §fhelp setup | etape | minereu | garda | reguli')
  return 1
}

// ---- înregistrare ----------------------------------------------------------------------------------

function pmCanUse(src) {
  if (src.hasPermission(2)) return true
  try {
    var e = src.getEntity()
    return e !== null && e !== undefined && e instanceof $PM_Player && pmTeam(e) === PM_TEAM
  } catch (err) { return false }
}

function pmPlayerSuggest(ctx, builder) {
  try {
    var ps = ctx.source.server.getPlayerList().getPlayers()
    for (var i = 0; i < ps.size(); i++) builder.suggest(pmName(ps.get(i)))
  } catch (e) { /* sugestii best-effort */ }
  return builder.buildFuture()
}

function pmStageSuggest(ctx, builder) {
  for (var i = 0; i < PM_STAGES.length; i++) builder.suggest(PM_STAGES[i].id)
  return builder.buildFuture()
}

function pmZoneSuggest(ctx, builder) {
  for (var i = 0; i < PM_STAGES.length; i++) if (PM_STAGES[i].kind === 'zone') builder.suggest(PM_STAGES[i].id)
  return builder.buildFuture()
}

var PM_ORE_IDS = null
function pmOreSuggest(ctx, builder) {
  try {
    if (PM_ORE_IDS === null) {
      PM_ORE_IDS = []
      var it = $PM_Registries.BLOCK.keySet().iterator()
      while (it.hasNext()) {
        var id = String(it.next())
        if (id.indexOf('_ore') >= 0 || id.indexOf('dripstone') >= 0) PM_ORE_IDS.push(id)
      }
    }
    var typed = String(builder.getRemaining()).toLowerCase()
    for (var i = 0; i < PM_ORE_IDS.length; i++) if (PM_ORE_IDS[i].indexOf(typed) >= 0) builder.suggest(PM_ORE_IDS[i])
  } catch (e) { /* sugestii best-effort */ }
  return builder.buildFuture()
}

ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  var admin = function (src) { return src.hasPermission(2) }
  var str = function (ctx, n) { return $PM_StringArgument.getString(ctx, n) }

  var stageNode = Commands.literal('stage').requires(admin)
    .executes(function (ctx) { return pmCmdStages(ctx) })
    .then(Commands.argument('id', $PM_StringArgument.word()).suggests(pmStageSuggest)
      .then(Commands.literal('on').executes(function (ctx) { return pmSetStage(ctx, str(ctx, 'id'), 'on') }))
      .then(Commands.literal('off').executes(function (ctx) { return pmSetStage(ctx, str(ctx, 'id'), 'off') }))
      .then(Commands.literal('regen').executes(function (ctx) { return pmSetStage(ctx, str(ctx, 'id'), 'regen') })))

  var oreNode = Commands.literal('ore').requires(admin)
    .then(Commands.argument('zone', $PM_StringArgument.word()).suggests(pmZoneSuggest)
      .then(Commands.literal('add')
        .then(Commands.argument('block', $PM_IdArgument.id()).suggests(pmOreSuggest)
          .then(Commands.argument('count', $PM_IntegerArgument.integer(1, 5000))
            .executes(function (ctx) { return pmCmdOreAdd(ctx, str(ctx, 'zone'), $PM_IdArgument.getId(ctx, 'block'), $PM_IntegerArgument.getInteger(ctx, 'count'), 8) })
            .then(Commands.argument('vein', $PM_IntegerArgument.integer(1, 64))
              .executes(function (ctx) { return pmCmdOreAdd(ctx, str(ctx, 'zone'), $PM_IdArgument.getId(ctx, 'block'), $PM_IntegerArgument.getInteger(ctx, 'count'), $PM_IntegerArgument.getInteger(ctx, 'vein')) })))))
      .then(Commands.literal('remove')
        .then(Commands.argument('block', $PM_IdArgument.id()).suggests(pmOreSuggest)
          .executes(function (ctx) { return pmCmdOreRemove(ctx, str(ctx, 'zone'), $PM_IdArgument.getId(ctx, 'block')) })))
      .then(Commands.literal('default').executes(function (ctx) { return pmCmdOreDefault(ctx, str(ctx, 'zone')) })))

  var placeNode = Commands.literal('place').requires(admin)
  for (var i = 0; i < PM_FACINGS.length; i++) {
    (function (dir) {
      placeNode.then(Commands.literal(dir).executes(function (ctx) { return pmCmdPlace(ctx, dir) }))
    })(PM_FACINGS[i])
  }

  event.register(
    Commands.literal('prisonmine')
      .requires(function (src) { return pmCanUse(src) })
      .executes(function (ctx) { return pmCmdHelp(ctx, null) })
      .then(Commands.literal('help')
        .executes(function (ctx) { return pmCmdHelp(ctx, null) })
        .then(Commands.argument('topic', $PM_StringArgument.word()).suggests(pmHelpSuggest)
          .executes(function (ctx) { return pmCmdHelp(ctx, str(ctx, 'topic')) })))
      .then(Commands.literal('status').executes(function (ctx) { return pmCmdStatus(ctx) }))
      .then(Commands.literal('list').executes(function (ctx) { return pmCmdList(ctx) }))
      .then(Commands.literal('send')
        .then(Commands.argument('name', $PM_StringArgument.word()).suggests(pmPlayerSuggest)
          .executes(function (ctx) { return pmSend(ctx, str(ctx, 'name')) })))
      .then(Commands.literal('recall')
        .then(Commands.argument('name', $PM_StringArgument.word()).suggests(pmPlayerSuggest)
          .executes(function (ctx) { return pmRecall(ctx, str(ctx, 'name')) })))
      .then(Commands.literal('setup').requires(admin).executes(function (ctx) { return pmCmdSetup(ctx) }))
      .then(placeNode)
      .then(stageNode)
      .then(Commands.literal('ores').requires(admin)
        .then(Commands.argument('zone', $PM_StringArgument.word()).suggests(pmZoneSuggest)
          .executes(function (ctx) { return pmCmdOres(ctx, str(ctx, 'zone')) })))
      .then(oreNode)
      .then(Commands.literal('adopt').requires(admin)
        .executes(function (ctx) { return pmCmdAdopt(ctx, PM_ADOPT_MINE) })
        .then(Commands.argument('mine_id', $PM_StringArgument.word())
          .executes(function (ctx) { return pmCmdAdopt(ctx, str(ctx, 'mine_id')) })))
      .then(Commands.literal('unadopt').requires(admin).executes(function (ctx) { return pmUnadopt(ctx) }))
      .then(Commands.literal('boxes').requires(admin).executes(function (ctx) { return pmCmdBoxes(ctx) }))
      .then(Commands.literal('exit').requires(admin).executes(function (ctx) { return pmCmdExit(ctx) }))
      .then(Commands.literal('on').requires(admin).executes(function (ctx) { return pmCmdOnOff(ctx, true) }))
      .then(Commands.literal('off').requires(admin).executes(function (ctx) { return pmCmdOnOff(ctx, false) }))
      .then(Commands.literal('refill').requires(admin).executes(function (ctx) { return pmCmdRefill(ctx) }))
      .then(Commands.literal('reset').requires(admin).executes(function (ctx) { return pmCmdReset(ctx) }))
  )
})
