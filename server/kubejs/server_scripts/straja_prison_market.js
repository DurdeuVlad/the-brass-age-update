// ============================================================================
// Straja Prison Market — "vinde tot" pentru ce se minează
// ----------------------------------------------------------------------------
// Deținutul (din registrul strajaprison) vinde TOT ce a minat dintr-o singură mișcare:
//   * creditul nu se cheltuiește: la un deținut cu datorie (/strajaprison sentence) fiecare vânzare
//     o plătește 1:1 (alamă) și la 0 e eliberat; fără datorie, creditul doar se adună.
//   * /sellall (sau /prisonmarket sellall) — pe el
//   * click dreapta pe un negustor: orice entitate (sătean sau CustomNPC) marcată cu
//     /prisonmarket buyer (privește-o) — clickul vinde tot în loc să deschidă dialogul/comerțul
//   * op: /sellall <jucător> — vinde pentru altcineva
// Marfa merge sortată în depozitul Străjii (depozitele din /strajamisiuni depozit —
// obiectivele de misiune "item" o numără automat), iar deținutul primește credit în
// balanța lui de prizonier. Membrii Straja / op: aceeași comandă, dar fără credit —
// marfa ajunge direct în depozit.
//
//   /prisonmarket help | sellall [jucător] | credit [jucător]
//   ADMIN: credit add|take|set <jucător> <n> · price [obiect valoare] · buyer · unbuyer
//
// Contract: server.persistentData.strajaPrisonMarket = {credit:{nume_lowercase:n}, prices:{id:n}}
// — alte scripturi pot citi/cheltui creditul. Registrul deținuților se citește DOAR-CITIRE.
// ============================================================================

const MK_KEY = 'strajaPrisonMarket'
const MK_TEAM = 'Straja'
const MK_BUYER_TAG = 'pm_buyer'
const MK_UNIT = 'credite'

// Prețuri implicite (credite / bucată). Ce nu e aici nu se vinde. Se suprascriu cu /prisonmarket price.
const MK_DEFAULT_PRICES = {
  'minecraft:coal': 2,
  'minecraft:raw_iron': 4,
  'minecraft:raw_copper': 3,
  'minecraft:raw_gold': 8,
  'minecraft:redstone': 1,
  'minecraft:lapis_lazuli': 2,
  'minecraft:diamond': 40,
  'minecraft:emerald': 30,
  'minecraft:dripstone_block': 1,
  'minecraft:pointed_dripstone': 1,
  'butchery:sulfur': 3
}

// Moloz de mină: nu se vinde, dar nici nu iese din mină cu el (poarta mine-out) — /sellall îl predă gratis.
const MK_RESIDUE = ['minecraft:cobblestone', 'minecraft:cobbled_deepslate', 'minecraft:tuff', 'minecraft:gravel', 'minecraft:flint']

var MK = { credit: {}, prices: {} }
var MK_LOADED = false

const $MK_Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const $MK_Container = Java.loadClass('net.minecraft.world.Container')
const $MK_ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const $MK_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $MK_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $MK_IdArgument = Java.loadClass('net.minecraft.commands.arguments.ResourceLocationArgument')
const $MK_EntityArgument = Java.loadClass('net.minecraft.commands.arguments.EntityArgument')

// ---- stare -------------------------------------------------------------------------

function mkLoad(server) {
  MK = { credit: {}, prices: {} }
  try {
    var raw = String(server.persistentData.getString(MK_KEY) || '')
    if (raw.length > 2) {
      var saved = JSON.parse(raw)
      if (saved.credit) MK.credit = saved.credit
      if (saved.prices) MK.prices = saved.prices
    }
  } catch (e) {
    console.error('[PrisonMarket] load failed: ' + e)
  }
  MK_LOADED = true
  mkPublishGoods(server)
}

function mkSave(server) {
  server.persistentData.putString(MK_KEY, JSON.stringify(MK))
  mkPublishGoods(server)
}

// Marfa de mină (preț > 0 + moloz) pentru poarta mine-out din straja_prison_gates.js
function mkPublishGoods(server) {
  var ids = {}
  for (var a in MK_DEFAULT_PRICES) if (mkPrice(a) > 0) ids[a] = true
  for (var b in MK.prices) if (mkPrice(b) > 0) ids[b] = true
  for (var r = 0; r < MK_RESIDUE.length; r++) ids[MK_RESIDUE[r]] = true
  server.persistentData.putString('strajaPrisonGoods', JSON.stringify(Object.keys(ids)))
}

ServerEvents.loaded(function (event) { mkLoad(event.server) })

// /reload re-rulează fișierul dar nu re-declanșează `loaded`: starea se reia din persistentData
// înainte de orice citire/scriere (altfel o scriere ar suprascrie balanțele cu un obiect gol).
function mkEnsure(server) {
  if (!MK_LOADED) mkLoad(server)
}

ServerEvents.tick(function (event) { mkEnsure(event.server) })

// ---- helpers --------------------------------------------------------------------------

function mkName(p) {
  try { return String(p.getGameProfile().getName()) } catch (e) { return String(p.getName().getString()) }
}

function mkSay(src, text) {
  src.sendSystemMessage(Text.literal(text))
}

function mkTeam(p) {
  try { var t = p.getTeam(); return t ? String(t.getName()) : '' } catch (e) { return '' }
}

function mkIsStraja(p) {
  return mkTeam(p) === MK_TEAM || p.hasPermissions(2)
}

function mkSrcPlayer(ctx) {
  var ent = null
  try { ent = ctx.source.getEntity() } catch (e) { ent = null }
  return (ent !== null && ent !== undefined && ent instanceof $MK_Player) ? ent : null
}

function mkPrice(id) {
  if (MK.prices[id] !== undefined) return Number(MK.prices[id])
  return MK_DEFAULT_PRICES[id] !== undefined ? MK_DEFAULT_PRICES[id] : 0
}

// intrarea din registrul de custodie (read-only) sau null
function mkJailEntry(server, name) {
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

function mkBalance(name) {
  return Number(MK.credit[String(name).toLowerCase()] || 0)
}

function mkSetBalance(server, name, value) {
  MK.credit[String(name).toLowerCase()] = Math.max(0, Math.round(value))
  mkSave(server)
}

// ---- depozitul Străjii (citit din strajaMissions.depozite, doar-citire) -----------------

function mkChunkOf(level, cx, cz) {
  var ch = null
  try {
    var src = level.getChunkSource()
    try { ch = src.getChunkNow(cx, cz) } catch (e1) { /* nu e încărcat */ }
    if (ch === null || ch === undefined) {
      try { ch = src.getChunk(cx, cz, false) } catch (e2) { /* nu e încărcat */ }
    }
  } catch (e3) { /* fără chunk source */ }
  if (ch === null || ch === undefined) {
    // depozitul trebuie să primească marfa chiar dacă nimeni nu e prin zonă: îl încărcăm (ca scanul misiunilor)
    try { ch = level.getChunk(cx, cz) } catch (e4) { /* chunk imposibil de încărcat */ }
  }
  return (ch === null || ch === undefined) ? null : ch
}

// containerele din chunkurile depozitelor, deterministe (sortate după cheie)
// câte depozite sunt CONFIGURATE (indiferent dacă chunkurile lor sunt încărcate acum)
function mkDepotCount(server) {
  try {
    var raw = String(server.persistentData.getString('strajaMissions') || '')
    if (raw.length > 2) return (JSON.parse(raw).depozite || []).length
  } catch (e) { /* fără configurare */ }
  return 0
}

function mkDepotContainers(server) {
  var out = []
  var seen = {}
  var depots = []
  try {
    var raw = String(server.persistentData.getString('strajaMissions') || '')
    if (raw.length > 2) depots = JSON.parse(raw).depozite || []
  } catch (e) { return out }
  for (var i = 0; i < depots.length; i++) {
    var w = depots[i]
    if (!w || !w.chunks) continue
    for (var c = 0; c < w.chunks.length; c++) {
      var parts = String(w.chunks[c]).split(' ')
      if (parts.length < 2) continue
      var xz = parts[1].split(',')
      var cx = parseInt(xz[0])
      var cz = parseInt(xz[1])
      if (isNaN(cx) || isNaN(cz)) continue
      var level = null
      try { level = server.getLevel(parts[0]) } catch (e2) { /* dimensiune lipsă */ }
      if (level === null || level === undefined) continue
      var chunk = mkChunkOf(level, cx, cz)
      if (chunk === null) continue
      var bes = null
      try { bes = chunk.getBlockEntities() } catch (e3) { /* fără block entities */ }
      if (bes === null || bes === undefined) continue
      for (var it = bes.entrySet().iterator(); it.hasNext();) {
        var ent = it.next()
        var be = ent.getValue()
        var ok = false
        try { ok = (be instanceof $MK_Container) && be.getContainerSize() > 0 } catch (e4) { /* nu e container */ }
        if (!ok) continue
        var bp = ent.getKey()
        var key = parts[0] + ' ' + bp.getX() + ',' + bp.getY() + ',' + bp.getZ()
        if (seen[key]) continue
        seen[key] = 1
        out.push({ key: key, chest: be })
      }
    }
  }
  out.sort(function (a, b) { return a.key < b.key ? -1 : (a.key > b.key ? 1 : 0) })
  return out
}

function mkSameStack(a, b) {
  try { return $MK_ItemStack.isSameItemSameComponents(a, b) === true } catch (e) { return String(a.id) === String(b.id) }
}

function mkHolds(chest, stack) {
  for (var i = 0; i < chest.getContainerSize(); i++) {
    var cur = chest.getItem(i)
    if (!cur.isEmpty() && mkSameStack(cur, stack)) return true
  }
  return false
}

// Pune `stack` într-un container: întâi completează stackurile existente, apoi sloturile goale.
function mkInsert(chest, stack) {
  var size = chest.getContainerSize()
  var cap = stack.getMaxStackSize()
  var i
  for (i = 0; i < size && !stack.isEmpty(); i++) {
    var cur = chest.getItem(i)
    if (!cur.isEmpty() && cur.getCount() < cap && mkSameStack(cur, stack) && chest.canPlaceItem(i, stack)) {
      var mv = Math.min(cap - cur.getCount(), stack.getCount())
      cur.setCount(cur.getCount() + mv)
      chest.setItem(i, cur)
      stack.shrink(mv)
    }
  }
  for (i = 0; i < size && !stack.isEmpty(); i++) {
    if (chest.getItem(i).isEmpty() && chest.canPlaceItem(i, stack)) {
      var mv2 = Math.min(cap, stack.getCount())
      chest.setItem(i, stack.copyWithCount(mv2))
      stack.shrink(mv2)
    }
  }
  chest.setChanged()
}

// Sortat: containerele care au deja acest obiect primesc întâi; apoi oricare cu loc.
// Returnează câte bucăți au intrat.
function mkStore(containers, stack) {
  var copy = stack.copy()
  var total = copy.getCount()
  for (var pass = 0; pass < 2 && !copy.isEmpty(); pass++) {
    for (var i = 0; i < containers.length && !copy.isEmpty(); i++) {
      if (pass === 0 && !mkHolds(containers[i].chest, copy)) continue
      mkInsert(containers[i].chest, copy)
    }
  }
  return total - copy.getCount()
}

// ---- vânzarea -----------------------------------------------------------------------------------

// Vinde tot ce are preț din inventarul lui `p`. `by` = cine a cerut (pentru mesaj), sau null.
function mkSellAll(server, p, by) {
  mkEnsure(server)
  var name = mkName(p)
  var entry = mkJailEntry(server, name)
  var prisoner = entry !== null
  if (prisoner && entry.status === 'fugitive') {
    p.tell(Text.literal('§c[Piață] Ești fugar — nimeni nu cumpără de la tine.'))
    return 0
  }
  if (!prisoner && !mkIsStraja(p)) {
    p.tell(Text.literal('§c[Piață] Aici vând doar deținuții și Straja.'))
    return 0
  }

  var containers = mkDepotContainers(server)
  var depotsSet = mkDepotCount(server)
  if (depotsSet > 0 && containers.length === 0) {
    p.tell(Text.literal('§c[Piață] Depozitul Străjii nu poate fi citit acum — marfa rămâne la tine. Încearcă din nou.'))
    return 0
  }
  if (depotsSet === 0 && !prisoner) {
    p.tell(Text.literal('§c[Piață] Niciun depozit setat (§f/strajamisiuni depozit§c) — nu predau marfa în gol.'))
    return 0
  }
  var depotConfigured = containers.length > 0
  var inv = p.getInventory()
  var lines = {}
  var order = []
  var soldValue = 0
  var blocked = 0

  for (var i = 0; i < inv.getContainerSize(); i++) {
    if (i >= 36 && i !== 40) continue // armura nu se vinde
    var stack = inv.getItem(i)
    if (stack.isEmpty()) continue
    var id = String(stack.id)
    var price = mkPrice(id)
    if (!(price > 0)) continue
    var count = stack.getCount()
    var label = String(stack.getHoverName().getString()) // înainte de shrink — un stack gol devine "Air"
    var taken = count
    if (depotConfigured) {
      taken = mkStore(containers, stack)
      if (taken < count) blocked += count - taken
    }
    if (taken <= 0) continue
    stack.shrink(taken)
    if (lines[id] === undefined) {
      lines[id] = { n: 0, name: label }
      order.push(id)
    }
    lines[id].n += taken
    soldValue += taken * price
  }

  // moloz de mină: deținutul îl predă gratis (n-are voie să-l scoată din mină)
  var junk = 0
  if (prisoner) {
    for (var j = 0; j < inv.getContainerSize(); j++) {
      if (j >= 36 && j !== 40) continue
      var js = inv.getItem(j)
      if (!js.isEmpty() && MK_RESIDUE.indexOf(String(js.id)) >= 0) {
        junk += js.getCount()
        inv.setItem(j, Item.empty)
      }
    }
  }

  if (order.length === 0 && junk > 0) {
    p.tell(Text.literal('§7[Piață] Moloz predat: ' + junk + ' bucăți (nu se plătește).'))
    return 1
  }
  if (order.length === 0) {
    p.tell(Text.literal(blocked > 0
      ? '§c[Piață] Depozitul Străjii e plin — nu s-a putut lua nimic.'
      : '§7[Piață] N-ai nimic de vândut (minereuri, cărbune, sulf…). §8/prisonmarket price = ce cumpărăm.'))
    return 0
  }

  var parts = order.map(function (k) { return lines[k].n + '× ' + lines[k].name })
  if (prisoner) {
    // creditul nu se cheltuiește: plătește datoria (alamă 1:1). Când ajunge la 0, închisoarea îl eliberează.
    var debt = Number(entry.debt || 0)
    var applied = Math.min(debt, soldValue)
    var surplus = soldValue - applied
    if (applied > 0) server.runCommandSilent('strajaprison paydebt ' + name + ' ' + applied)
    if (surplus > 0) mkSetBalance(server, name, mkBalance(name) + surplus)
    p.tell(Text.literal('§a[Piață] Vândut: §f' + parts.join(', ') + '§a → §e' + soldValue + ' ' + MK_UNIT +
      (debt > 0 ? '§a. Datorie: §f' + debt + ' → ' + Math.max(0, debt - applied) + '§a.' : '§a. Balanță: §e' + mkBalance(name) + ' ' + MK_UNIT + '§a.') +
      (junk > 0 ? ' §7(+ ' + junk + ' moloz predat)' : '')))
  } else {
    p.tell(Text.literal('§a[Piață] Predat în depozitul Străjii: §f' + parts.join(', ') + '§a.' + (depotConfigured ? '' : ' §7(niciun depozit setat — §f/strajamisiuni depozit§7)')))
  }
  if (blocked > 0) p.tell(Text.literal('§e[Piață] ' + blocked + ' bucăți au rămas la tine — depozitul Străjii e plin.'))
  if (by !== null && by !== name) {
    try { by.tell(Text.literal('§a[Piață] Vândut pentru ' + name + ': ' + parts.join(', ') + (prisoner ? ' → +' + soldValue + ' ' + MK_UNIT : ''))) } catch (e) { /* mesaj best-effort */ }
  }
  console.info('[PrisonMarket] ' + name + (prisoner ? ' (deținut)' : ' (Straja)') + ' sold ' + parts.join(', ') + ' value=' + soldValue + (depotConfigured ? '' : ' (no depot)'))
  return 1
}

// ---- negustorul ---------------------------------------------------------------------------------

// PlayerInteractEvent.EntityInteract: ItemEvents.entityInteracted nu se declanșează cu mâna goală.
try {
  var MK_INTERACT = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$EntityInteract')
  // HIGHEST: CustomNPCs își deschide dialogul pe același eveniment — trebuie să-l anulăm înaintea lui
  var MK_PRIORITY = Java.loadClass('net.neoforged.bus.api.EventPriority').HIGHEST
  NativeEvents.onEvent(MK_PRIORITY, MK_INTERACT, function (e) {
    try {
      var player = e.getEntity()
      var target = e.getTarget()
      if (player === null || target === null || e.getLevel().isClientSide()) return
      if (!target.getTags().contains(MK_BUYER_TAG)) return
      e.setCanceled(true) // fără fereastra de comerț a săteanului
      if (String(e.getHand()) !== 'MAIN_HAND') return
      mkSellAll(player.getServer(), player, null)
    } catch (err) {
      console.error('[PrisonMarket] buyer interact failed: ' + err)
    }
  })
} catch (err) {
  console.error('[PrisonMarket] init failed: ' + err)
}

function mkCmdBuyer(ctx, on) {
  var p = mkSrcPlayer(ctx)
  if (p === null) { mkSay(ctx.source, '§c[Piață] comanda se rulează de un jucător.'); return 0 }
  var ent = null
  try {
    var ray = p.rayTrace(8)
    if (ray !== null && ray !== undefined) ent = ray.entity
  } catch (e) { ent = null }
  if (ent === null || ent === undefined || ent === p || ent instanceof $MK_Player) { mkSay(ctx.source, '§c[Piață] uită-te la entitatea-negustor (sătean/NPC), la max 8 blocuri.'); return 0 }
  var uuid = ''
  var tries = [function () { return ent.stringUuid }, function () { return ent.uuid }, function () { return ent.getStringUUID() }, function () { return ent.getStringUuid() }]
  for (var t = 0; t < tries.length && uuid.length < 30; t++) {
    try { uuid = String(tries[t]()) } catch (e2) { uuid = '' }
  }
  if (uuid.length < 30) { mkSay(ctx.source, '§c[Piață] nu pot citi UUID-ul entității.'); return 0 }
  if (on) {
    ent.addTag(MK_BUYER_TAG)
    MK.buyers = Number(MK.buyers || 0) + 1 // numărat pentru /prisonsetup
    mkSave(ctx.source.server)
    var isNpc = false
    try { isNpc = String(ent.type).indexOf('customnpc') >= 0 } catch (e3) { isNpc = false }
    // un CustomNPC își are propriile setări (nemișcat/invulnerabil din editor) — doar sătenii/mobii primesc NBT
    if (!isNpc) ctx.source.server.runCommandSilent('data merge entity ' + uuid + ' {NoAI:1b,Invulnerable:1b,PersistenceRequired:1b}')
    mkSay(ctx.source, '§a[Piață] ' + String(ent.getName().getString()) + ' e negustor — click dreapta = vinde tot pentru cel care dă click.')
  } else {
    ent.removeTag(MK_BUYER_TAG)
    mkSay(ctx.source, '§e[Piață] negustorul scos (rămâne fără AI; scoate-i singur dacă vrei).')
  }
  return 1
}

// ---- comenzi ---------------------------------------------------------------------------------------

function mkCmdSellAll(ctx, targetName) {
  var server = ctx.source.server
  var self = mkSrcPlayer(ctx)
  if (targetName === null) {
    if (self === null) { mkSay(ctx.source, '§c[Piață] de la consolă: /sellall <jucător>'); return 0 }
    return mkSellAll(server, self, null)
  }
  var target = server.getPlayerList().getPlayerByName(targetName)
  if (target === null || target === undefined) { mkSay(ctx.source, '§c[Piață] ' + targetName + ' nu e online.'); return 0 }
  return mkSellAll(server, target, self !== null ? self : null) || 0
}

function mkCmdCredit(ctx, targetName) {
  var server = ctx.source.server
  mkEnsure(server)
  var self = mkSrcPlayer(ctx)
  var name = targetName
  if (name === null) {
    if (self === null) { mkSay(ctx.source, '§c[Piață] spune un jucător.'); return 0 }
    name = mkName(self)
  } else if (!(self === null || self.hasPermissions(2) || mkIsStraja(self) || mkName(self).toLowerCase() === String(name).toLowerCase())) {
    mkSay(ctx.source, '§c[Piață] balanța altcuiva o văd doar Straja/op.')
    return 0
  }
  var entry = mkJailEntry(server, name)
  mkSay(ctx.source, '§e[Piață] ' + name + ': §f' + mkBalance(name) + ' ' + MK_UNIT + (entry !== null ? '§7 (deținut' + (entry.status === 'fugitive' ? ', FUGAR' : '') + ')' : '') +
    (entry !== null && entry.debt > 0 ? '§e · datorie de plătit: §c' + entry.debt + ' alamă' : ''))
  return 1
}

function mkCmdCreditAdjust(ctx, mode, name, n) {
  var server = ctx.source.server
  mkEnsure(server)
  var cur = mkBalance(name)
  var next = mode === 'add' ? cur + n : (mode === 'take' ? cur - n : n)
  mkSetBalance(server, name, next)
  mkSay(ctx.source, '§a[Piață] ' + name + ': ' + cur + ' → ' + mkBalance(name) + ' ' + MK_UNIT)
  console.info('[PrisonMarket] credit ' + mode + ' ' + name + ' ' + n + ' (' + cur + ' -> ' + mkBalance(name) + ') by ' + String(ctx.source.getTextName()))
  return 1
}

function mkCmdPriceList(ctx) {
  mkEnsure(ctx.source.server)
  var ids = {}
  for (var a in MK_DEFAULT_PRICES) ids[a] = true
  for (var b in MK.prices) ids[b] = true
  var rows = []
  for (var id in ids) {
    var pr = mkPrice(id)
    if (pr > 0) rows.push(id.replace('minecraft:', '') + ' ' + pr + (MK.prices[id] !== undefined ? '*' : ''))
  }
  mkSay(ctx.source, '§b[Piață] cumpărăm (' + MK_UNIT + '/buc): §f' + rows.join('§7, §f') + '§7  (* = preț setat de admin)')
  return 1
}

function mkCmdPriceSet(ctx, id, value) {
  mkEnsure(ctx.source.server)
  var key = String(id)
  if (value === 0 && MK_DEFAULT_PRICES[key] === undefined) delete MK.prices[key]
  else MK.prices[key] = value
  mkSave(ctx.source.server)
  mkSay(ctx.source, value > 0 ? '§a[Piață] ' + key + ' = ' + value + ' ' + MK_UNIT + '/buc' : '§e[Piață] ' + key + ' nu se mai cumpără.')
  return 1
}

function mkCmdPriceReset(ctx, id) {
  mkEnsure(ctx.source.server)
  delete MK.prices[String(id)]
  mkSave(ctx.source.server)
  mkSay(ctx.source, '§a[Piață] ' + String(id) + ': preț implicit (' + (MK_DEFAULT_PRICES[String(id)] || 0) + ').')
  return 1
}

function mkCmdHelp(ctx) {
  mkSay(ctx.source, '§b[Piață] /sellall — vinzi tot ce ai minat dintr-o mișcare (sau click dreapta pe negustor).')
  mkSay(ctx.source, '§7  Deținut: marfa merge în depozitul Străjii, primești §ecredite§7 (§fcredit§7 = balanța). Straja/op: marfa doar în depozit.')
  mkSay(ctx.source, '§7  §fprisonmarket price§7 = ce cumpărăm · §fcredit [jucător]§7 · op: §fsellall <jucător>§7 · §fcredit add|take|set <jucător> <n>')
  mkSay(ctx.source, '§7  admin: §fprice <obiect> <valoare>§7 (0 = nu se cumpără) · §fprice reset <obiect>§7 · §fbuyer§7 (privește entitatea) · §funbuyer')
  return 1
}

function mkPlayerSuggest(ctx, builder) {
  try {
    var ps = ctx.source.server.getPlayerList().getPlayers()
    for (var i = 0; i < ps.size(); i++) builder.suggest(mkName(ps.get(i)))
  } catch (e) { /* sugestii best-effort */ }
  return builder.buildFuture()
}

ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  var admin = function (src) { return src.hasPermission(2) }
  var str = function (ctx, n) { return $MK_StringArgument.getString(ctx, n) }

  event.register(
    Commands.literal('sellall')
      .executes(function (ctx) { return mkCmdSellAll(ctx, null) })
      .then(Commands.argument('player', $MK_StringArgument.word()).requires(admin).suggests(mkPlayerSuggest)
        .executes(function (ctx) { return mkCmdSellAll(ctx, str(ctx, 'player')) }))
  )

  event.register(
    Commands.literal('prisonmarket')
      .executes(function (ctx) { return mkCmdHelp(ctx) })
      .then(Commands.literal('help').executes(function (ctx) { return mkCmdHelp(ctx) }))
      .then(Commands.literal('sellall')
        .executes(function (ctx) { return mkCmdSellAll(ctx, null) })
        .then(Commands.argument('player', $MK_StringArgument.word()).requires(admin).suggests(mkPlayerSuggest)
          .executes(function (ctx) { return mkCmdSellAll(ctx, str(ctx, 'player')) })))
      .then(Commands.literal('credit')
        .executes(function (ctx) { return mkCmdCredit(ctx, null) })
        .then(Commands.literal('add').requires(admin)
          .then(Commands.argument('player', $MK_StringArgument.word()).suggests(mkPlayerSuggest)
            .then(Commands.argument('n', $MK_IntegerArgument.integer(0))
              .executes(function (ctx) { return mkCmdCreditAdjust(ctx, 'add', str(ctx, 'player'), $MK_IntegerArgument.getInteger(ctx, 'n')) }))))
        .then(Commands.literal('take').requires(admin)
          .then(Commands.argument('player', $MK_StringArgument.word()).suggests(mkPlayerSuggest)
            .then(Commands.argument('n', $MK_IntegerArgument.integer(0))
              .executes(function (ctx) { return mkCmdCreditAdjust(ctx, 'take', str(ctx, 'player'), $MK_IntegerArgument.getInteger(ctx, 'n')) }))))
        .then(Commands.literal('set').requires(admin)
          .then(Commands.argument('player', $MK_StringArgument.word()).suggests(mkPlayerSuggest)
            .then(Commands.argument('n', $MK_IntegerArgument.integer(0))
              .executes(function (ctx) { return mkCmdCreditAdjust(ctx, 'set', str(ctx, 'player'), $MK_IntegerArgument.getInteger(ctx, 'n')) }))))
        .then(Commands.argument('player', $MK_StringArgument.word()).suggests(mkPlayerSuggest)
          .executes(function (ctx) { return mkCmdCredit(ctx, str(ctx, 'player')) })))
      .then(Commands.literal('price')
        .executes(function (ctx) { return mkCmdPriceList(ctx) })
        .then(Commands.literal('reset').requires(admin)
          .then(Commands.argument('item', $MK_IdArgument.id())
            .executes(function (ctx) { return mkCmdPriceReset(ctx, $MK_IdArgument.getId(ctx, 'item')) })))
        .then(Commands.argument('item', $MK_IdArgument.id()).requires(admin)
          .then(Commands.argument('value', $MK_IntegerArgument.integer(0, 100000))
            .executes(function (ctx) { return mkCmdPriceSet(ctx, $MK_IdArgument.getId(ctx, 'item'), $MK_IntegerArgument.getInteger(ctx, 'value')) }))))
      .then(Commands.literal('buyer').requires(admin).executes(function (ctx) { return mkCmdBuyer(ctx, true) }))
      .then(Commands.literal('unbuyer').requires(admin).executes(function (ctx) { return mkCmdBuyer(ctx, false) }))
  )
})
