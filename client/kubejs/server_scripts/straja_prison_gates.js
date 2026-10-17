// ============================================================================
// Straja Prison Gates — cine intră/iese din pușcărie și cu ce
// ----------------------------------------------------------------------------
// Aceeași mecanică ca la punctele de control Straja: placă de presiune → command block →
//   /prisongate use <poartă> @p
// iar poarta decide: trece (nu face nimic, placa deschide ușa) sau împinge jucătorul înapoi la
// punctul de refuz și închide ușile. Trei feluri de porți:
//
//   exit      ușa pentru exteriori/Straja, placa de pe partea dinăuntru. Deținuții (și fugarii)
//             sunt opriți; cine nu e în registru (liber, eliberat, Straja) iese fără control.
//   mine-in   ușa dintre cartiere și mină, placa de pe partea cartierelor. Deținuții nefugari trec
//             liber (muncesc la mină când vor); fugarii sunt opriți.
//   mine-out  aceeași ușă, placa de pe partea minei. Deținutul NU poate trece cu marfă de mină
//             pe el (minereuri, moloz — și în rucsaci/genți). Se golește cu /sellall.
//
// "Cartierele" (curte, cantină, celule…) = una sau mai multe cutii (grounds). Deținutul care e
// înăuntrul lor NU e fugar — contract cu straja_prison.js prin server.persistentData
// .strajaPrisonGrounds = {dim, boxes:[{x1,y1,z1,x2,y2,z2}]}. Doar cine iese din cartiere, din mină
// sau din celulă necontrolat devine fugar (survival, gărzi agresive; întors → adventure).
//
//   /prisongate help | setup | list
//   ADMIN: grounds pos1|pos2|list|remove <n>|clear · add <poartă> <exit|mine-in|mine-out>
//          deny <poartă> · door <poartă> [clear] · remove <poartă> · use <poartă> <jucător>
// Marfa de mină = lista publicată de straja_prison_market.js (strajaPrisonGoods).
// ============================================================================

const PG_KEY = 'strajaPrisonGates'
const PG_GROUNDS_KEY = 'strajaPrisonGrounds'
const PG_GOODS_KEY = 'strajaPrisonGoods'
const PG_KINDS = ['exit', 'mine-in', 'mine-out']

var PG = { gates: {}, grounds: { dim: null, boxes: [] }, tmp: {} }
var PG_LOADED = false

const $PG_Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const $PG_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $PG_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $PG_EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')
const $PG_DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const $PG_Capabilities = Java.loadClass('net.neoforged.neoforge.capabilities.Capabilities')

// ---- stare ----------------------------------------------------------------------------

function pgLoad(server) {
  PG = { gates: {}, grounds: { dim: null, boxes: [] }, tmp: {} }
  try {
    var raw = String(server.persistentData.getString(PG_KEY) || '')
    if (raw.length > 2) {
      var saved = JSON.parse(raw)
      if (saved.gates) PG.gates = saved.gates
      if (saved.grounds) PG.grounds = saved.grounds
    }
  } catch (e) {
    console.error('[PrisonGates] load failed: ' + e)
  }
  PG_LOADED = true
  pgPublish(server)
}

function pgEnsure(server) {
  if (!PG_LOADED) pgLoad(server)
}

function pgPublish(server) {
  server.persistentData.putString(PG_GROUNDS_KEY, JSON.stringify(PG.grounds))
}

function pgSave(server) {
  server.persistentData.putString(PG_KEY, JSON.stringify({ gates: PG.gates, grounds: PG.grounds }))
  pgPublish(server)
}

ServerEvents.loaded(function (event) { pgLoad(event.server) })
ServerEvents.tick(function (event) { pgEnsure(event.server) })

// ---- helpers ----------------------------------------------------------------------------

function pgName(p) {
  try { return String(p.getGameProfile().getName()) } catch (e) { return String(p.getName().getString()) }
}

function pgSay(src, text) {
  src.sendSystemMessage(Text.literal(text))
}

function pgSrcPlayer(ctx) {
  var ent = null
  try { ent = ctx.source.getEntity() } catch (e) { ent = null }
  return (ent !== null && ent !== undefined && ent instanceof $PG_Player) ? ent : null
}

function pgLink(text, cmd) {
  var link = Text.literal('§b§n' + text)
  try { link = link.clickRunCommand(cmd) } catch (e) { /* text fallback */ }
  return link
}

function pgJailEntry(server, name) {
  try {
    var raw = String(server.persistentData.getString('strajaPrisonJail') || '')
    if (raw.length <= 2) return null
    var jailed = JSON.parse(raw).jailed || {}
    if (jailed[name] !== undefined) return jailed[name]
    var lower = String(name).toLowerCase()
    for (var k in jailed) if (k.toLowerCase() === lower) return jailed[k]
  } catch (e) { /* registru ilizibil */ }
  return null
}

function pgGameMode(p) {
  try { return String(p.gameMode.getGameModeForPlayer().getName()).toLowerCase() } catch (e) { return 'survival' }
}

function pgGoods(server) {
  var out = {}
  try {
    var raw = String(server.persistentData.getString(PG_GOODS_KEY) || '')
    if (raw.length > 2) {
      var ids = JSON.parse(raw)
      for (var i = 0; i < ids.length; i++) out[ids[i]] = true
    }
  } catch (e) { /* fără listă — nimic nu e marfă */ }
  return out
}

// ---- inventar: și în rucsaci / genți / shulkere ---------------------------------------------------

function pgSubStacks(stack) {
  var out = []
  if (stack === null || stack.isEmpty()) return out
  try {
    var cont = stack.get($PG_DataComponents.CONTAINER)
    if (cont !== null && cont !== undefined) {
      var it = cont.nonEmptyItems().iterator()
      while (it.hasNext()) out.push(it.next())
    }
  } catch (e) { /* fără container */ }
  try {
    var bundle = stack.get($PG_DataComponents.BUNDLE_CONTENTS)
    if (bundle !== null && bundle !== undefined) {
      var iter = null
      try { iter = bundle.items().iterator() } catch (e1) { try { iter = bundle.items.iterator() } catch (e2) { /* nu */ } }
      if (iter !== null) while (iter.hasNext()) out.push(iter.next())
    }
  } catch (e) { /* nu e bundle */ }
  if (out.length > 0) return out
  try {
    var cap = stack.getCapability($PG_Capabilities.ItemHandler.ITEM)
    if (cap !== null && cap !== undefined) {
      for (var i = 0; i < cap.getSlots(); i++) {
        var st = cap.getStackInSlot(i)
        if (st !== null && !st.isEmpty()) out.push(st)
      }
    }
  } catch (e) { /* fără item handler */ }
  return out
}

// {id: {n, name}} pentru tot ce e marfă de mină în inventar + conținutul genților
function pgFindGoods(player, goods) {
  var found = {}
  function scan(stack, depth) {
    if (stack === null || stack.isEmpty() || depth > 3) return
    var id = String(stack.id)
    if (goods[id]) {
      if (found[id] === undefined) found[id] = { n: 0, name: String(stack.getHoverName().getString()) }
      found[id].n += stack.getCount()
    }
    var subs = pgSubStacks(stack)
    for (var i = 0; i < subs.length; i++) scan(subs[i], depth + 1)
  }
  var inv = player.getInventory()
  for (var i = 0; i < inv.getContainerSize(); i++) scan(inv.getItem(i), 0)
  return found
}

// ---- refuz: înapoi la punctul de refuz + uși închise --------------------------------------------------

function pgCloseDoors(server, gate) {
  var doors = gate.doors || []
  for (var i = 0; i < doors.length; i++) {
    var d = doors[i]
    try {
      var level = server.getLevel(d.dim)
      for (var dy = 0; dy <= 1; dy++) {
        var block = level.getBlock(d.x, d.y + dy, d.z)
        var id = String(block.id)
        if (id.indexOf('door') >= 0 || id.indexOf('gate') >= 0) {
          var props = block.properties
          props.open = 'false'
          if (props.powered !== undefined) props.powered = 'false'
          block.set(id, props)
        }
      }
    } catch (e) {
      console.error('[PrisonGates] nu pot închide ușa ' + d.x + ' ' + d.y + ' ' + d.z + ' :: ' + e)
    }
  }
}

function pgDeny(server, player, gate, reason) {
  var d = gate.deny
  var who = '"' + pgName(player) + '"'
  if (d !== null && d !== undefined) {
    server.runCommandSilent('execute in ' + d.dim + ' run tp ' + who + ' ' + d.x + ' ' + d.y + ' ' + d.z + ' ' + (d.yaw === undefined ? 0 : d.yaw) + ' 0')
  }
  pgCloseDoors(server, gate)
  server.runCommandSilent('title ' + who + ' times 10 60 10')
  server.runCommandSilent('title ' + who + ' subtitle {"text":"' + reason.replace(/"/g, '') + '","color":"red"}')
  server.runCommandSilent('title ' + who + ' title {"text":"POARTA ÎNCHISĂ","color":"dark_red","bold":true}')
  server.runCommandSilent('playsound minecraft:block.iron_door.close master ' + who)
  player.tell(Text.literal('§c[Poartă] ' + reason))
}

// ---- poarta: /prisongate use <poartă> @p ---------------------------------------------------------------

function pgUse(ctx, gateName, player) {
  var server = ctx.source.server
  pgEnsure(server)
  var gate = PG.gates[gateName]
  if (gate === undefined) { console.error('[PrisonGates] poartă necunoscută: ' + gateName); return 0 }
  if (player === null || player === undefined) return 0
  var mode = pgGameMode(player)
  if (mode !== 'survival' && mode !== 'adventure') return 0 // creative/spectator = staff, nu se controlează

  var entry = pgJailEntry(server, pgName(player))
  if (entry === null) return 0 // liber, eliberat sau Straja: trece
  var fugitive = entry.status === 'fugitive'

  if (gate.kind === 'exit') {
    pgDeny(server, player, gate, 'Ești deținut — nu poți ieși până nu ești eliberat.')
    console.info('[PrisonGates] ' + pgName(player) + ' blocat la ' + gateName + ' (exit)')
    return 1
  }
  if (gate.kind === 'mine-in') {
    if (fugitive) {
      pgDeny(server, player, gate, 'Ești fugar — nu ai voie în mină.')
      return 1
    }
    return 0
  }
  if (gate.kind === 'mine-out') {
    var found = pgFindGoods(player, pgGoods(server))
    var ids = Object.keys(found)
    if (fugitive || ids.length > 0) {
      var list = ids.slice(0, 4).map(function (k) { return found[k].n + '× ' + found[k].name }).join(', ')
      pgDeny(server, player, gate, fugitive ? 'Ești fugar — nu ai voie în cartiere.' : 'Nu ieși cu marfă de mină (' + list + (ids.length > 4 ? '…' : '') + '). Folosește /sellall sau negustorul.')
      console.info('[PrisonGates] ' + pgName(player) + ' blocat la ' + gateName + ' (mine-out): ' + ids.join(', '))
      return 1
    }
    return 0
  }
  return 0
}

// ---- configurare ---------------------------------------------------------------------------------------

function pgBoxFromTmp(ctx) {
  var a = PG.tmp.p1
  var b = PG.tmp.p2
  if (!a || !b || a.dim !== b.dim) return false
  var box = { x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x), y1: Math.min(a.y, b.y), y2: Math.max(a.y, b.y), z1: Math.min(a.z, b.z), z2: Math.max(a.z, b.z) }
  if (PG.grounds.dim !== null && PG.grounds.dim !== a.dim) { pgSay(ctx.source, '§c[Poartă] toate cutiile cartierelor trebuie să fie în aceeași dimensiune.'); return false }
  PG.grounds.dim = a.dim
  PG.grounds.boxes.push(box)
  PG.tmp = {}
  pgSave(ctx.source.server)
  pgSay(ctx.source, '§a[Poartă] cutie cartiere #' + PG.grounds.boxes.length + ': ' + box.x1 + ' ' + box.y1 + ' ' + box.z1 + ' → ' + box.x2 + ' ' + box.y2 + ' ' + box.z2)
  return true
}

function pgCmdGroundsPos(ctx, which) {
  var p = pgSrcPlayer(ctx)
  if (p === null) { pgSay(ctx.source, '§c[Poartă] comanda se rulează de un jucător.'); return 0 }
  pgEnsure(ctx.source.server)
  PG.tmp[which] = { dim: String(p.level.dimension), x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }
  if (!pgBoxFromTmp(ctx)) {
    pgSay(ctx.source, '§a[Poartă] ' + which + ' = ' + Math.floor(p.x) + ' ' + Math.floor(p.y) + ' ' + Math.floor(p.z) + ' §7— acum ' + (which === 'p1' ? 'pos2' : 'pos1') + ' în colțul opus.')
  }
  return 1
}

function pgCmdGrounds(ctx, action, n) {
  pgEnsure(ctx.source.server)
  if (action === 'list') {
    if (PG.grounds.boxes.length === 0) { pgSay(ctx.source, '§7[Poartă] nicio cutie de cartiere. §f/prisongate grounds pos1§7 + §fpos2'); return 1 }
    for (var i = 0; i < PG.grounds.boxes.length; i++) {
      var b = PG.grounds.boxes[i]
      pgSay(ctx.source, '§7  #' + (i + 1) + ' §f' + b.x1 + ' ' + b.y1 + ' ' + b.z1 + ' → ' + b.x2 + ' ' + b.y2 + ' ' + b.z2)
    }
    return 1
  }
  if (action === 'clear') { PG.grounds = { dim: null, boxes: [] }; pgSave(ctx.source.server); pgSay(ctx.source, '§e[Poartă] cartiere șterse.'); return 1 }
  if (action === 'remove') {
    if (n < 1 || n > PG.grounds.boxes.length) { pgSay(ctx.source, '§c[Poartă] nu există cutia #' + n); return 0 }
    PG.grounds.boxes.splice(n - 1, 1)
    if (PG.grounds.boxes.length === 0) PG.grounds.dim = null
    pgSave(ctx.source.server)
    pgSay(ctx.source, '§e[Poartă] cutia #' + n + ' ștearsă.')
    return 1
  }
  return 0
}

function pgCmdAdd(ctx, name, kind) {
  pgEnsure(ctx.source.server)
  if (PG_KINDS.indexOf(kind) < 0) { pgSay(ctx.source, '§c[Poartă] fel: ' + PG_KINDS.join(' | ')); return 0 }
  var existing = PG.gates[name]
  PG.gates[name] = { kind: kind, deny: existing ? existing.deny : null, doors: existing ? existing.doors : [] }
  pgSave(ctx.source.server)
  pgSay(ctx.source, '§a[Poartă] ' + name + ' (' + kind + '). Apoi: §f/prisongate deny ' + name + '§a (stai unde ești împins înapoi) și §f/prisongate door ' + name + '§a (privește ușa). Command block: §f/prisongate use ' + name + ' @p')
  return 1
}

function pgCmdRemove(ctx, name) {
  pgEnsure(ctx.source.server)
  if (PG.gates[name] === undefined) { pgSay(ctx.source, '§c[Poartă] nu există ' + name); return 0 }
  delete PG.gates[name]
  pgSave(ctx.source.server)
  pgSay(ctx.source, '§e[Poartă] ' + name + ' ștearsă.')
  return 1
}

function pgCmdDeny(ctx, name) {
  var p = pgSrcPlayer(ctx)
  pgEnsure(ctx.source.server)
  if (p === null) { pgSay(ctx.source, '§c[Poartă] comanda se rulează de un jucător.'); return 0 }
  var g = PG.gates[name]
  if (g === undefined) { pgSay(ctx.source, '§c[Poartă] nu există ' + name); return 0 }
  var yaw = 0
  try { yaw = Math.round(Number(p.getYRot())) } catch (e) { /* implicit 0 */ }
  g.deny = { dim: String(p.level.dimension), x: Math.floor(p.x) + 0.5, y: Math.floor(p.y), z: Math.floor(p.z) + 0.5, yaw: yaw }
  pgSave(ctx.source.server)
  pgSay(ctx.source, '§a[Poartă] ' + name + ': punctul de refuz = aici (în afara plăcii de presiune).')
  return 1
}

// blocul la care se uită jucătorul — rayTrace-ul KubeJS ratează uși subțiri, deci și un marș manual
function pgLookBlock(player, dist) {
  try {
    var rt = player.rayTrace(dist)
    if (rt !== null && rt !== undefined && rt.block !== null && rt.block !== undefined && String(rt.block.id) !== 'minecraft:air') return rt.block
  } catch (e) { /* cade pe marș */ }
  try {
    var eye = player.getEyePosition()
    var look = player.getLookAngle()
    var lvl = player.level
    for (var d = 0.25; d <= dist; d += 0.25) {
      var blk = lvl.getBlock(Math.floor(eye.x + look.x * d), Math.floor(eye.y + look.y * d), Math.floor(eye.z + look.z * d))
      if (blk !== null && blk !== undefined && String(blk.id) !== 'minecraft:air') return blk
    }
  } catch (e2) { /* nimic în fața lui */ }
  return null
}

function pgCmdDoor(ctx, name, clear) {
  var p = pgSrcPlayer(ctx)
  pgEnsure(ctx.source.server)
  var g = PG.gates[name]
  if (g === undefined) { pgSay(ctx.source, '§c[Poartă] nu există ' + name); return 0 }
  if (clear) { g.doors = []; pgSave(ctx.source.server); pgSay(ctx.source, '§e[Poartă] ' + name + ': uși șterse.'); return 1 }
  if (p === null) { pgSay(ctx.source, '§c[Poartă] comanda se rulează de un jucător.'); return 0 }
  var pos = pgLookBlock(p, 6)
  if (pos === null) { pgSay(ctx.source, '§c[Poartă] privește ușa (max 6 blocuri).'); return 0 }
  var id = String(pos.id)
  if (id.indexOf('door') < 0 && id.indexOf('gate') < 0) { pgSay(ctx.source, '§c[Poartă] asta nu e ușă/poartă (' + id + ').'); return 0 }
  var y = pos.y
  if (String(pos.properties.half) === 'upper') y -= 1
  g.doors.push({ dim: String(p.level.dimension), x: pos.x, y: y, z: pos.z })
  pgSave(ctx.source.server)
  pgSay(ctx.source, '§a[Poartă] ' + name + ': ușă adăugată (' + g.doors.length + ').')
  return 1
}

function pgStep(src, done, label, cmds) {
  if (done) { pgSay(src, '  §a✓ §f' + label); return 0 }
  var line = Text.literal('  §c✗ §f' + label)
  if (cmds !== null) {
    line = line.append(Text.literal(' §8→ '))
    for (var i = 0; i < cmds.length; i++) {
      if (i > 0) line = line.append(Text.literal(' §7· '))
      line = line.append(pgLink('/prisongate ' + cmds[i], '/prisongate ' + cmds[i]))
    }
  }
  src.sendSystemMessage(line)
  return 1
}

function pgCmdSetup(ctx) {
  pgEnsure(ctx.source.server)
  var src = ctx.source
  pgSay(src, '§b[Poartă] checklist:')
  var miss = 0
  miss += pgStep(src, PG.grounds.boxes.length > 0, 'cartiere (curte, cantină, celule…) — ' + PG.grounds.boxes.length + ' cutii; deținutul dinăuntru nu e fugar', ['grounds pos1', 'grounds pos2'])
  var kinds = { 'exit': 'exit — ușa exteriorilor', 'mine-in': 'mine-in — spre mină', 'mine-out': 'mine-out — din mină' }
  for (var k in kinds) {
    var found = null
    for (var n in PG.gates) if (PG.gates[n].kind === k) found = n
    miss += pgStep(src, found !== null && PG.gates[found].deny !== null && PG.gates[found].doors.length > 0, 'poarta ' + kinds[k] + (found !== null ? ' (' + found + ')' : ''), found === null ? ['add ' + k + ' ' + k] : ['deny ' + found, 'door ' + found])
  }
  pgSay(src, '§7  fiecare poartă: placă de presiune → command block cu §f/prisongate use <poartă> @p§7 (ca la punctele de control). §fhelp§7 pentru reguli.')
  if (miss === 0) pgSay(src, '§aGata. Deținuții muncesc la mină când vor.')
  return 1
}

function pgCmdList(ctx) {
  pgEnsure(ctx.source.server)
  var any = false
  for (var n in PG.gates) {
    any = true
    var g = PG.gates[n]
    pgSay(ctx.source, '§7  §f' + n + '§7 (' + g.kind + ') refuz: ' + (g.deny ? Math.floor(g.deny.x) + ' ' + g.deny.y + ' ' + Math.floor(g.deny.z) : '§cNESETAT') + '§7 · uși: ' + g.doors.length)
  }
  if (!any) pgSay(ctx.source, '§7[Poartă] nicio poartă. §f/prisongate setup')
  return 1
}

function pgCmdHelp(ctx) {
  pgSay(ctx.source, '§b[Poartă] /prisongate — porțile pușcăriei Straja:')
  pgSay(ctx.source, '§7  §fexit§7: deținuții nu ies până nu sunt eliberați · §fmine-in§7: deținuții nefugari trec liber · §fmine-out§7: fără marfă de mină pe ei')
  pgSay(ctx.source, '§7  Exteriorii/Straja intră și ies liber, cu orice au la ei. Fugarii sunt opriți peste tot.')
  pgSay(ctx.source, '§7  admin: §fsetup · grounds pos1|pos2|list|remove <n>|clear · add <poartă> <fel> · deny <poartă> · door <poartă> [clear] · remove <poartă> · list')
  return 1
}

function pgGateSuggest(ctx, builder) {
  for (var n in PG.gates) builder.suggest(n)
  return builder.buildFuture()
}

function pgKindSuggest(ctx, builder) {
  for (var i = 0; i < PG_KINDS.length; i++) builder.suggest(PG_KINDS[i])
  return builder.buildFuture()
}

ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  var str = function (ctx, n) { return $PG_StringArgument.getString(ctx, n) }
  var gateArg = function () { return Commands.argument('gate', $PG_StringArgument.word()).suggests(pgGateSuggest) }

  event.register(
    Commands.literal('prisongate')
      .requires(function (src) { return src.hasPermission(2) })
      .executes(function (ctx) { return pgCmdHelp(ctx) })
      .then(Commands.literal('help').executes(function (ctx) { return pgCmdHelp(ctx) }))
      .then(Commands.literal('setup').executes(function (ctx) { return pgCmdSetup(ctx) }))
      .then(Commands.literal('list').executes(function (ctx) { return pgCmdList(ctx) }))
      .then(Commands.literal('grounds')
        .then(Commands.literal('pos1').executes(function (ctx) { return pgCmdGroundsPos(ctx, 'p1') }))
        .then(Commands.literal('pos2').executes(function (ctx) { return pgCmdGroundsPos(ctx, 'p2') }))
        .then(Commands.literal('list').executes(function (ctx) { return pgCmdGrounds(ctx, 'list', 0) }))
        .then(Commands.literal('clear').executes(function (ctx) { return pgCmdGrounds(ctx, 'clear', 0) }))
        .then(Commands.literal('remove')
          .then(Commands.argument('n', $PG_IntegerArgument.integer(1))
            .executes(function (ctx) { return pgCmdGrounds(ctx, 'remove', $PG_IntegerArgument.getInteger(ctx, 'n')) }))))
      .then(Commands.literal('add')
        .then(Commands.argument('gate', $PG_StringArgument.word())
          .then(Commands.argument('kind', $PG_StringArgument.word()).suggests(pgKindSuggest)
            .executes(function (ctx) { return pgCmdAdd(ctx, str(ctx, 'gate'), str(ctx, 'kind')) }))))
      .then(Commands.literal('remove').then(gateArg().executes(function (ctx) { return pgCmdRemove(ctx, str(ctx, 'gate')) })))
      .then(Commands.literal('deny').then(gateArg().executes(function (ctx) { return pgCmdDeny(ctx, str(ctx, 'gate')) })))
      .then(Commands.literal('door')
        .then(gateArg()
          .executes(function (ctx) { return pgCmdDoor(ctx, str(ctx, 'gate'), false) })
          .then(Commands.literal('clear').executes(function (ctx) { return pgCmdDoor(ctx, str(ctx, 'gate'), true) }))))
      .then(Commands.literal('use')
        .then(gateArg()
          .then(Commands.argument('player', $PG_EntityArgument.player())
            .executes(function (ctx) {
              var player = null
              try { player = $PG_EntityArgument.getPlayer(ctx, 'player') } catch (e) { player = null }
              return pgUse(ctx, str(ctx, 'gate'), player)
            }))))
  )
})
