// ============================================================================
// Straja Prison — shared custody engine
// ----------------------------------------------------------------------------
// THE canonical prison service. Any system (border checkpoints, gold-vault
// theft, future mods) hands players into custody through the same public
// command surface — nothing here is checkpoint-specific:
//
//   strajaprison arrest <player> [reason...]  — seize inventory, book, cell
//   strajaprison release <name> [fine]        — jailer-only: pour belongings
//                                               back, restore gamemode, tp out
//   strajaprison jailed / record <name>       — register + fines
//   strajaprison jailhere                     — shared overflow point = here
//   strajaprison cellhere                     — register cell = where you stand
//   strajaprison pick cell|pchest|off         — click cell floors / chest pairs
//   strajaprison jcells / pchests             — occupancy
//   strajaprison setup / status / help
//
// Contract for other scripts (KubeJS files can't share functions):
//   * arrest via `strajaprison arrest <player> <reason>` command — reason is
//     free text recorded in the register + prisoner report
//   * custody reads: player.persistentData.cpJailed (bool) — true while
//     jailed OR flagged fugitive-on-the-run; cpFugitive for escapees
//   * register reads: server.persistentData.strajaPrisonJail (JSON,
//     {jailed:{name:{status,reason,site,pchest,jcell}},fines,pendingChest})
//   * prison-owned setup persists in server.persistentData.strajaPrisonCfg
//     ({jailTarget,jcells,pcells}) — migrated from portCheckpointCfg on load
//   * checkpoint cfg is read READ-ONLY for context: sites (evidence chests,
//     release teleports), contraband classification, exempt list
// ============================================================================

function spLoadClass(path) {
  try {
    return Java.loadClass(path)
  } catch (e) {
    console.error('[Prison] Java.loadClass failed: ' + path + ' :: ' + e)
    return null
  }
}

const $SP_EntityArgument = spLoadClass('net.minecraft.commands.arguments.EntityArgument')
const $SP_StringArgument = spLoadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $SP_IntegerArgument = spLoadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $SP_Registries = spLoadClass('net.minecraft.core.registries.BuiltInRegistries')
const $SP_Player = spLoadClass('net.minecraft.world.entity.player.Player')
const $SP_DataComponents = spLoadClass('net.minecraft.core.component.DataComponents')
const $SP_Capabilities = spLoadClass('net.neoforged.neoforge.capabilities.Capabilities')
const $SP_CuriosApi = spLoadClass('top.theillusivec4.curios.api.CuriosApi')
const $SP_CompoundTag = spLoadClass('net.minecraft.nbt.CompoundTag')
const $SP_ListTag = spLoadClass('net.minecraft.nbt.ListTag')
const $SP_GameType = spLoadClass('net.minecraft.world.level.GameType')
const $SP_ItemStack = spLoadClass('net.minecraft.world.item.ItemStack')
const $SP_NpcAPI = spLoadClass('noppes.npcs.api.NpcAPI')
const $SP_PlayerWrapper = spLoadClass('noppes.npcs.api.wrapper.PlayerWrapper')

// ============================================================================
// CONFIG — edit these
// ============================================================================

// Items considered contraband at the port checkpoint.
// !!! EDIT THIS LIST — e.g. add 'minecraft:tnt': true, 'minecraft:flint_and_steel': true

// Teleport-back point for `strajaprison deny` — the player is moved here,
// off the pressure plate, so its signal dies and the iron doors close.
// !!! SET THIS — e.g. { dim: 'minecraft:overworld', x: 100, y: 64, z: -200, yaw: 180 }
// (yaw is optional — the direction the player faces after the teleport)
const SP_JAIL_TARGET = null

// A jailed player found farther than this from the jail becomes a FUGITIVE.
const SP_JAIL_RADIUS = 24
// How close a player must be to a site's anchor (deny point / first door /
// first evidence chest) for inspect/arrest/config commands to bind to it.
const SP_SITE_RADIUS = 24

// Only these players may run `strajaprison release` — the judge.
// !!! EDIT — your in-game name goes here:
const SP_JAILERS = ['dwurdy']

// Fade-to-black length (ticks) between the arrest title and the jail teleport.
const SP_ARREST_DELAY_TICKS = 40

// How long a fugitive stays wanted by Straja NPCs (seconds, wall clock).
const SP_FUGITIVE_WANTED_SECONDS = 86400

// CustomNPCs faction id for the Straja guard (same id straja_gold.js uses —
// faction 0 means attack-on-sight for all Straja NPCs).
const SP_STRAJA_FACTION = 12

// Border crossing log — every inspect/arrest gate pass is appended here with
// the full inventory snapshot. java.nio.file is blocked by KubeJS, so the log
// is a capped JSON file written through JsonIO (same mechanism custom_mines
// uses) and mirrored to the console.
const SP_LOG_FILE = 'kubejs/prison-log.json'
const SP_LOG_MAX = 2000

// ============================================================================
// Runtime config — in-game picks win over the file constants above. Multiple
// border posts share one jail/policy: inspect/arrest resolve the nearest site.
//   strajaprison site <nume> denyhere      — gate's deny spot = where you stand
//   strajaprison site <nume> pick door     — right-click that gate's iron doors
//   strajaprison site <nume> pick evidence — right-click that gate's chests
//   strajaprison denyhere|pick door [site] — same, targeting a site
//   strajaprison site list|remove <nume>
//   strajaprison addcontraband / delcontraband / status
// Selections persist in server.persistentData.portCheckpointCfg.
// ============================================================================

// Prison-owned persistent config (strajaPrisonCfg): cells, overflow point,
// personal chests. Checkpoint cfg (portCheckpointCfg) is parsed read-only
// into SP_CP_CFG for context: sites/evidence, contraband, exempt, banned.
var SP_CFG = {
  jailTarget: SP_JAIL_TARGET,
  jcells: [], // individual cells [{dim,x,y,z,yaw}] — one inmate each; jailTarget = overflow/shared room
  pcells: [] // per-prisoner personal chests: [{a,b|null,sign|null}]
}

var SP_CP_CFG = {
  sites: {},
  contraband: {},
  banned: {},
  exempt: {}
}

// evidence chests are an ordered list — the first full chest overflows into
// the next one. Older saves stored a single {dim,x,y,z}; normalize.
function cpNormalizeEvidence(saved) {
  if (saved === null || saved === undefined) {
    return []
  }
  if (saved.length !== undefined) {
    return saved
  }
  return [saved]
}

function spNormalizeSites(raw) {
  var out = {}
  for (var sn in raw) {
    out[sn] = raw[sn]
    out[sn].name = sn
    out[sn].evidence = cpNormalizeEvidence(out[sn].evidence || [])
    if (out[sn].doors === undefined) out[sn].doors = []
    if (out[sn].denyTarget === undefined) out[sn].denyTarget = null
    if (out[sn].gates === undefined) out[sn].gates = []
    if (out[sn].board === undefined) out[sn].board = null
    if (out[sn].cb === undefined) out[sn].cb = {}
    if (out[sn].exempt === undefined) out[sn].exempt = {}
    if (out[sn].link === undefined) out[sn].link = null
  }
  return out
}

function spCfgLoad(server) {
  SP_CFG = { jailTarget: SP_JAIL_TARGET, jcells: [], pcells: [] }
  SP_CP_CFG = { sites: {}, contraband: {}, banned: {}, exempt: {} }
  // checkpoint cfg — read-only context + one-time migration source for the
  // prison fields that used to live inside it
  var migrated = false
  try {
    var craw = String(server.persistentData.getString('portCheckpointCfg') || '')
    if (craw.length > 2) {
      var csaved = JSON.parse(craw)
      if (csaved.sites !== undefined) SP_CP_CFG.sites = spNormalizeSites(csaved.sites)
      if (csaved.contraband !== undefined) SP_CP_CFG.contraband = csaved.contraband
      if (csaved.banned !== undefined) SP_CP_CFG.banned = csaved.banned
      if (csaved.exempt !== undefined) SP_CP_CFG.exempt = csaved.exempt
      if (csaved.jailTarget !== undefined) SP_CFG.jailTarget = csaved.jailTarget
      if (csaved.jcells !== undefined) SP_CFG.jcells = csaved.jcells
      if (csaved.pcells !== undefined) SP_CFG.pcells = csaved.pcells
    }
  } catch (e) {
    console.error('[Prison] could not read checkpoint cfg: ' + e)
  }
  // own key wins when present — and only when it's absent does the checkpoint
  // blob's jail fields get adopted (one-time migration, then never again)
  var ownPresent = false
  try {
    var raw = String(server.persistentData.getString('strajaPrisonCfg') || '')
    if (raw.length > 2) {
      ownPresent = true
      var saved = JSON.parse(raw)
      if (saved.jailTarget !== undefined) SP_CFG.jailTarget = saved.jailTarget
      if (saved.jcells !== undefined) SP_CFG.jcells = saved.jcells
      if (saved.pcells !== undefined) SP_CFG.pcells = saved.pcells
    }
  } catch (e) {
    console.error('[Prison] could not load prison cfg: ' + e)
  }
  if (!ownPresent && (SP_CFG.jailTarget !== SP_JAIL_TARGET || SP_CFG.jcells.length > 0 || SP_CFG.pcells.length > 0)) {
    migrated = true
  }
  // persist migrated fields under the new key so the old blob's copies are
  // never consulted again (checkpoint's own save drops them anyway)
  if (migrated) {
    spCfgSave(server)
    console.info('[Prison] migrated jailTarget/jcells/pcells from portCheckpointCfg -> strajaPrisonCfg')
  }
}

function cpSiteAnchor(site) {
  if (site.denyTarget !== null && site.denyTarget !== undefined) return site.denyTarget
  if (site.doors.length > 0) return site.doors[0]
  if (site.evidence.length > 0) return site.evidence[0]
  return null
}

// The site object (with .name) of the checkpoint the player is standing at,
// or null when nobody configured a site near them.

function cpSiteNearest(server, player) {
  var best = null
  var bestDist = SP_SITE_RADIUS * SP_SITE_RADIUS
  var dim = String(player.level.dimension)
  for (var n in SP_CP_CFG.sites) {
    var anchor = cpSiteAnchor(SP_CP_CFG.sites[n])
    if (anchor === null || anchor.dim !== dim) {
      continue
    }
    var dx = player.x - anchor.x
    var dy = player.y - anchor.y
    var dz = player.z - anchor.z
    var d = dx * dx + dy * dy + dz * dz
    if (d <= bestDist) {
      bestDist = d
      best = SP_CP_CFG.sites[n]
    }
  }
  return best
}

// Where confiscated goods go when no site is in scope (e.g. death inside the
// jail, which is nowhere near a gate): every site's chests in order.

function cpSiteEvidenceList(site) {
  if (site !== null && site !== undefined) {
    return site.evidence
  }
  var all = []
  for (var n in SP_CP_CFG.sites) {
    for (var i = 0; i < SP_CP_CFG.sites[n].evidence.length; i++) {
      all.push(SP_CP_CFG.sites[n].evidence[i])
    }
  }
  return all
}

// brigadier SuggestionProvider — TAB completes configured site names so an
// admin never has to remember them (site <nume> ... / site remove <nume> /
// denyhere|pick door [site]).

function cpJailedSuggest(ctx, builder) {
  try {
    for (var s in CP_JAIL.jailed) {
      builder.suggest(s)
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// Ban-list names for unban.

function cpPlayerSuggest(ctx, builder) {
  try {
    var players = ctx.source.server.getPlayerList().getPlayers()
    for (var i = 0; i < players.size(); i++) {
      builder.suggest(cpPlayerName(players.get(i)))
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// Names on the exempt list — for `unexempt` completion.

function spCfgSave(server) {
  server.persistentData.putString('strajaPrisonCfg', JSON.stringify(SP_CFG))
}

// kubejs reload re-executes this file but does NOT re-fire ServerEvents.loaded —
// self-heal config + jail register from persistentData on the first tick

var spJailSweepTicks = 0

// Every ~2s: enforce adventure on the jailed, reconcile flags against the
// register, and flag fugitives found beyond the jail radius.
function cpSweepJail(server) {
  var players = server.getPlayerList().getPlayers()
  for (var i = 0; i < players.size(); i++) {
    var p = players.get(i)
    var name = null
    try {
      name = cpPlayerName(p)
    } catch (e) {
      continue
    }
    var entry = cpJailEntry(name)
    var pd = p.persistentData

    if (entry === null) {
      // released while offline — clear the stale flags, restore mode and rep
      if (pd.getBoolean('cpJailed')) {
        pd.putBoolean('cpJailed', false)
        pd.putBoolean('cpFugitive', false)
        server.runCommandSilent('tag ' + cpQuoted(name) + ' remove cp_jailed')
        cpRestoreRep(server, p)
        var wasMode = String(pd.getString('cpJailWasMode') || '')
        pd.remove('cpJailWasMode')
        if (cpGameModeName(p) === 'adventure' && wasMode.length > 0) {
          cpSetGameMode(p, wasMode)
        }
      }
      continue
    }

    if (!pd.getBoolean('cpJailed')) {
      pd.putBoolean('cpJailed', true)
      if (String(pd.getString('cpJailWasMode') || '').length === 0) {
        pd.putString('cpJailWasMode', cpGameModeName(p))
      }
    }

    if (!spIsExempt(p) && cpGameModeName(p) !== 'adventure') {
      cpSetGameMode(p, 'adventure')
    }
    // adventure_zone datapack force-reverts adventure players outside its
    // zones — the cp_jailed tag exempts prisoners from that revert
    server.runCommandSilent('tag ' + cpQuoted(name) + ' add cp_jailed')

    var jt = cpJailSpot(name)
    if (jt !== null && entry.status !== 'fugitive') {
      var escaped = String(p.level.dimension) !== jt.dim
      if (!escaped) {
        var dx = p.x - jt.x
        var dy = p.y - jt.y
        var dz = p.z - jt.z
        escaped = dx * dx + dy * dy + dz * dz > SP_JAIL_RADIUS * SP_JAIL_RADIUS
      }
      if (escaped) {
        entry.status = 'fugitive'
        pd.putBoolean('cpFugitive', true)
        try {
          pd.putLong('strajaWantedUntil', Date.now() + SP_FUGITIVE_WANTED_SECONDS * 1000)
        } catch (e) { /* wanted flag is best-effort */ }
        cpSuppressRep(server, p)
        cpJailSave(server)
        spLogEvent('escaped', name, cpInvSummary(p), 'fugitiv — straja set 0, wanted activ')
        try {
          var all = server.getPlayerList().getPlayers()
          for (var n = 0; n < all.size(); n++) {
            all.get(n).tell(Text.literal('§c§lFUGITIV! §r§c' + name + ' a evadat din arestul Straja — gărzile atacă la vedere!'))
          }
        } catch (e) { /* broadcast best-effort */ }
        console.info('[Prison] ' + name + ' escaped custody — FUGITIVE (faction 0)')
      }
    } else if (jt !== null && entry.status === 'fugitive') {
      // a fugitive physically back inside their cell's perimeter is recaptured
      var jt2 = jt
      var backInside = String(p.level.dimension) === jt2.dim
      if (backInside) {
        var dx2 = p.x - jt2.x
        var dy2 = p.y - jt2.y
        var dz2 = p.z - jt2.z
        backInside = dx2 * dx2 + dy2 * dy2 + dz2 * dz2 <= SP_JAIL_RADIUS * SP_JAIL_RADIUS
      }
      if (backInside) {
        cpRecapture(server, p, name, 'reintrat în perimetrul arestului')
      }
    }
  }
}

function spPickMode(player) {
  return String(player.persistentData.getString('spPick') || '')
}

function spSetPick(player, mode) {
  player.persistentData.putString('spPick', mode)
}

function cpCmdSourcePlayer(ctx) {
  var ent = null
  try {
    ent = ctx.source.getEntity()
  } catch (e) {
    try {
      ent = ctx.source.entity
    } catch (e2) { /* not a player source */ }
  }
  if (ent === null || ent === undefined || !(ent instanceof $SP_Player)) {
    return null
  }
  return ent
}

// Messages (Romanian, § colour codes)
const SP_AGGRO_TITLE = '§4§lSTOP! MARFĂ ILEGALĂ!'
const SP_AGGRO_SUBTITLE = '§cAi încercat să treci punctul de control cu marfă interzisă!'
const SP_INFO_HEADER = '§cMarfă ilegală detectată în bagaj:'
const SP_INFO_FOOTER = '§eLasă marfa interzisă în urmă sau pred-o — nu treci cu ea peste hotar.'
const SP_INFO_CLEAN = '§aVerificare încheiată — nu ai nimic ilegal. Treci liber.'
const SP_DENY_TITLE = '§4§lACCES INTERZIS'
const SP_DENY_SUBTITLE = '§cPunctul de control nu te lasă să treci cu marfă ilegală.'
const SP_DENY_SOUND = 'minecraft:block.iron_door.close'
const SP_AGGRO_SOUND = 'minecraft:entity.ravager.roar'

const SP_BANNED_SUBTITLE = '§cEști interzis la acest punct de control.'
const SP_WARN_TITLE = '§e§lMARFA E INTERZISĂ'
const SP_WARN_SUBTITLE = '§eLas-o în cufărul de lângă poartă — la punctul următor riști arestarea.'
const SP_WARN_SOUND = 'minecraft:block.note_block.bass'
const SP_ARREST_TITLE = '§4§lAI FOST ARESTAT'
const SP_ARREST_SUBTITLE = '§cPentru contraband. Bunurile suspecte au fost reținute.'
const SP_FREE_TITLE = '§a§lEȘTI LIBER'
const SP_FREE_SUBTITLE = '§7Numele ți-a fost șters. Nu te mai întoarce cu contrabandă.'

// ============================================================================
// Jail register — server-side roster, works while the player is offline.
// persistentData 'strajaPrisonJail': {
//   jailed: { name: { t, reason, items:{id:{count,name}}, confiscated, status,
//                     arrests } },           // status: 'jailed' | 'fugitive'
//   fines:  { name: totalFine }
// }
// ============================================================================
var CP_JAIL = { jailed: {}, fines: {}, pendingChest: {} }

function cpJailLoad(server) {
  CP_JAIL = { jailed: {}, fines: {}, pendingChest: {} }
  try {
    var raw = String(server.persistentData.getString('strajaPrisonJail') || '')
    if (raw.length <= 2) {
      // one-time migration from the checkpoint-era key
      raw = String(server.persistentData.getString('portCheckpointJail') || '')
      if (raw.length > 2) {
        console.info('[Prison] migrating jail register from portCheckpointJail -> strajaPrisonJail')
      }
    }
    if (raw.length > 2) {
      var saved = JSON.parse(raw)
      if (saved.jailed !== undefined) CP_JAIL.jailed = saved.jailed
      if (saved.fines !== undefined) CP_JAIL.fines = saved.fines
      if (saved.pendingChest !== undefined) CP_JAIL.pendingChest = saved.pendingChest
      cpJailSave(server)
      try { server.persistentData.remove('portCheckpointJail') } catch (e2) { /* cleanup best-effort */ }
    }
  } catch (e) {
    console.error('[Prison] could not load jail register: ' + e)
  }
}

function cpJailSave(server) {
  server.persistentData.putString('strajaPrisonJail', JSON.stringify(CP_JAIL))
}

// Exact-name first, then case-insensitive — returns the entry or null.
function cpJailEntry(name) {
  var entry = CP_JAIL.jailed[name]
  if (entry !== undefined) {
    return entry
  }
  var lower = String(name).toLowerCase()
  for (var k in CP_JAIL.jailed) {
    if (k.toLowerCase() === lower) {
      return CP_JAIL.jailed[k]
    }
  }
  return null
}

function spLogEvent(event, name, inv, detail) {
  var iso = ''
  try {
    iso = new Date().toISOString().replace('T', ' ').substring(0, 19)
  } catch (e) {
    iso = String(Date.now())
  }
  console.info('[BorderLog] ' + event + ' ' + name + ' | ' + inv + (detail ? ' | ' + detail : ''))
  try {
    var log = JsonIO.read(SP_LOG_FILE)
    if (log === null || log === undefined || log.events === undefined || log.events.length === undefined) {
      log = { events: [] }
    }
    log.events.push({ t: Date.now(), iso: iso, event: event, name: name, inv: inv, detail: detail || '' })
    while (log.events.length > SP_LOG_MAX) {
      log.events.shift()
    }
    JsonIO.write(SP_LOG_FILE, log)
  } catch (e) {
    console.error('[Prison] border log write failed: ' + e)
  }
}

// "3x minecraft:gold_ingot; 64x minecraft:dirt" — compact inventory summary.
function cpInvSummary(player) {
  var counts = {}
  try {
    var inv = player.getInventory()
    var size = inv.getContainerSize()
    for (var i = 0; i < size; i++) {
      var stack = inv.getItem(i)
      if (stack === null || stack.isEmpty()) {
        continue
      }
      var id = cpItemId(stack)
      counts[id] = (counts[id] || 0) + stack.getCount()
    }
  } catch (e) {
    return '(inventar ilizibil)'
  }
  var parts = []
  for (var k in counts) {
    parts.push(counts[k] + 'x ' + k)
  }
  var out = parts.length === 0 ? '(gol)' : parts.join('; ')
  return out.length > 500 ? out.substring(0, 500) + '…' : out
}

// Faction suppression for fugitives — Straja (12) drops to 0 so guards attack
// on sight. The pre-suppression rep is backed up in player persistentData and
// restored on recapture/release so "clearing the name" actually clears it.
function cpReadRep(player) {
  try {
    // this CNPC build (Unofficial 1.21.1) has no NpcAPI.getIPlayer —
    // PlayerWrapper has a public ServerPlayer ctor and getFactionPoints
    return Number(new $SP_PlayerWrapper(player).getFactionPoints(SP_STRAJA_FACTION))
  } catch (e) {
    console.error('[Prison] getFactionPoints failed for ' + cpPlayerName(player) + ' :: ' + e)
    return null
  }
}

function cpSuppressRep(server, player) {
  var pd = player.persistentData
  if (!pd.getBoolean('cpRepBackedUp')) {
    var rep = cpReadRep(player)
    if (rep !== null) {
      pd.putInt('cpRepBackup', rep)
      pd.putBoolean('cpRepBackedUp', true)
    }
  }
  server.runCommandSilent('noppes faction ' + cpQuoted(player) + ' ' + SP_STRAJA_FACTION + ' set 0')
}

function cpRestoreRep(server, player) {
  var pd = player.persistentData
  if (pd.getBoolean('cpRepBackedUp')) {
    server.runCommandSilent('noppes faction ' + cpQuoted(player) + ' ' + SP_STRAJA_FACTION + ' set ' + pd.getInt('cpRepBackup'))
    pd.putBoolean('cpRepBackedUp', false)
    pd.remove('cpRepBackup')
    return true
  }
  return false
}

// Back in custody: status -> jailed, fugitive flag off, wanted cleared, rep
// restored while inside (guards shouldn't kill a prisoner in his cell).
function cpRecapture(server, player, name, how) {
  var entry = cpJailEntry(name)
  if (entry === null) {
    return
  }
  entry.status = 'jailed'
  cpJailSave(server)
  var pd = player.persistentData
  pd.putBoolean('cpJailed', true)
  pd.putBoolean('cpFugitive', false)
  cpClearHuntFlags(server, player) // thief/wanted flags too — he's inside
  var repOk = cpRestoreRep(server, player)
  spLogEvent('recaptured', name, cpInvSummary(player), how + (repOk ? '' : ' | rep nerestaurată'))
  player.tell(Text.literal('§cEști din nou în custodia Straja (' + how + ').'))
  console.info('[Prison] ' + name + ' recaptured (' + how + ')')
}

// ============================================================================
// Helpers
// ============================================================================

function cpPlayerName(player) {
  // accepts either a player object or an already-resolved name string —
  // several runCommandSilent call sites pass the name directly
  if (typeof player === 'string' || player instanceof String) return String(player)
  try {
    return String(player.getGameProfile().getName())
  } catch (e) {
    return String(player.getName().getString())
  }
}

function cpQuoted(player) {
  return '"' + cpPlayerName(player) + '"'
}

// Processing is gamemode-gated: only survival/adventure players are checked —
// creative and spectator are skipped, ops included. The ONLY other bypass is
// the command-managed exempt list (persistent, like banned).
function cpItemId(stack) {
  try {
    return String($SP_Registries.ITEM.getKey(stack.getItem()))
  } catch (e) {
    return String(stack.getItem())
  }
}

// Direct-API gamemode helpers (same idiom as petty_admin.js).
const SP_MODE_NAMES = {
  creative: 'CREATIVE',
  survival: 'SURVIVAL',
  adventure: 'ADVENTURE',
  spectator: 'SPECTATOR'
}

function cpGameModeName(player) {
  try {
    return String(player.gameMode.getGameModeForPlayer().getName()).toLowerCase()
  } catch (e) {
    return 'adventure'
  }
}

function cpSetGameMode(player, mode) {
  try {
    player.setGameMode($SP_GameType.valueOf(SP_MODE_NAMES[mode] || 'ADVENTURE'))
    return true
  } catch (e) {
    console.error('[Prison] setGameMode(' + mode + ') failed for ' + cpPlayerName(player) + ' :: ' + e)
    return false
  }
}

// Force-closes a site's configured doors — shared by deny/wrong-way flows.
function cpSubStacks(stack) {
  var out = []
  if (stack === null || stack.isEmpty()) {
    return out
  }
  try {
    var cont = stack.get($SP_DataComponents.CONTAINER)
    if (cont !== null && cont !== undefined) {
      var it = cont.nonEmptyItems().iterator()
      while (it.hasNext()) {
        out.push(it.next())
      }
    }
  } catch (e) { /* no container component */ }
  try {
    var bundle = stack.get($SP_DataComponents.BUNDLE_CONTENTS)
    if (bundle !== null && bundle !== undefined) {
      var iter = null
      try {
        iter = bundle.items().iterator()
      } catch (e1) {
        try {
          iter = bundle.items.iterator() // property form
        } catch (e2) {
          try {
            iter = bundle.itemCopyOfItems().iterator()
          } catch (e3) { /* give up on the bundle API */ }
        }
      }
      if (iter !== null) {
        while (iter.hasNext()) {
          out.push(iter.next())
        }
      }
    }
  } catch (e) { /* not a bundle */ }
  if (out.length > 0) {
    return out
  }
  try {
    var cap = stack.getCapability($SP_Capabilities.ItemHandler.ITEM)
    if (cap !== null && cap !== undefined) {
      var slots = cap.getSlots()
      for (var i = 0; i < slots; i++) {
        var st = cap.getStackInSlot(i)
        if (st !== null && !st.isEmpty()) {
          out.push(st)
        }
      }
    }
  } catch (e) { /* no item handler */ }
  return out
}

// Deep fallback: serialize the stack and count contraband item records
// inside its *component data only* — catches containers that expose neither
// vanilla components nor a capability (custom storage layouts). The walk is
// structural, not textual: only the `components` subtree is descended, so
// the stack's own top-level {id,count} entry can never double-count itself
// regardless of the order CompoundTag serializes its keys. A nested record
// is counted when it carries both an `id` string and a numeric `count`.
// Returns { itemId: count }.
function cpScanTagForContraband(tag, hits, depth) {
  if (tag === null || tag === undefined || depth > 8) {
    return
  }
  if (tag instanceof $SP_CompoundTag) {
    try {
      // item-id key: vanilla components use 'id'; mod inventory NBT often
      // serializes as 'item'/'Item'. count: 'count' (1.21) or legacy 'Count'.
      var id = String(tag.getString('id'))
      if (id.length === 0) {
        id = String(tag.getString('item'))
      }
      if (id.length === 0) {
        id = String(tag.getString('Item'))
      }
      var ckey = tag.contains('count') ? 'count' : (tag.contains('Count') ? 'Count' : null)
      var ct = ckey !== null ? Number(tag.getTagType(ckey)) : 0 // numeric tag ids are 1-6
      if (id.length > 0 && ct >= 1 && ct <= 6 && SP_CP_CFG.contraband[id]) {
        hits[id] = (hits[id] || 0) + tag.getInt(ckey)
      }
    } catch (e) { /* odd compound — its children may still hold items */ }
    var keys = tag.getAllKeys().iterator()
    while (keys.hasNext()) {
      cpScanTagForContraband(tag.get(keys.next()), hits, depth + 1)
    }
    return
  }
  if (tag instanceof $SP_ListTag) {
    for (var i = 0; i < tag.size(); i++) {
      cpScanTagForContraband(tag.get(i), hits, depth + 1)
    }
  }
}

function cpDeepScan(stack, level) {
  var hits = {}
  try {
    var ra = level !== null && level !== undefined ? level.registryAccess() : null
    if (ra === null) {
      return hits
    }
    var root = stack.save(ra)
    if (root === null || !(root instanceof $SP_CompoundTag)) {
      return hits
    }
    // absent/mistyped 'components' yields an empty compound -> no hits
    cpScanTagForContraband(root.getCompound('components'), hits, 0)
  } catch (e) { /* serialization not possible — ignore */ }
  return hits
}

// Scans the inventory (items, armor, offhand, curios) AND the contents of any
// container items (backpacks, bundles, shulker boxes, ...). Returns a map of
// contraband itemId -> { count, name }.
// Effective contraband resolution for a site: a local override wins, else the
// global list. cb[id]=true = extra ban here; cb[id]=false = exception here.
function cpIsCb(id, site) {
  if (site !== null && site !== undefined && site.cb !== undefined &&
      site.cb[id] !== undefined) {
    return site.cb[id] === true
  }
  return SP_CP_CFG.contraband[id] === true
}

function cpScanContraband(player, site) {
  var found = {}
  var level = null
  try {
    level = player.level
  } catch (e) { /* unreachable */ }

  function note(stack) {
    var id = cpItemId(stack)
    if (!cpIsCb(id, site)) {
      return
    }
    var entry = found[id]
    if (entry === undefined) {
      entry = { count: 0, name: String(stack.getHoverName().getString()) }
      found[id] = entry
    }
    entry.count += stack.getCount()
  }

  function scan(stack, depth) {
    if (stack === null || stack.isEmpty() || depth > 3) {
      return
    }
    note(stack)
    var subs = cpSubStacks(stack)
    if (subs.length === 0) {
      // no enumerable contents — fall back to serialized-NBT sniffing so
      // contraband hidden in mod-specific storage can't slip through
      var deep = cpDeepScan(stack, level)
      for (var id in deep) {
        if (!cpIsCb(id, site)) {
          continue
        }
        var entry = found[id]
        if (entry === undefined) {
          entry = { count: 0, name: id + ' (în container)' }
          found[id] = entry
        }
        entry.count += deep[id]
      }
      return
    }
    subs.forEach(function (sub) {
      scan(sub, depth + 1)
    })
  }

  var inv = player.getInventory()
  var size = inv.getContainerSize()
  for (var i = 0; i < size; i++) {
    scan(inv.getItem(i), 0)
  }
  // curios slots (backpack on the back, belt pouches, ...)
  try {
    var opt = $SP_CuriosApi.getCuriosInventory(player)
    if (opt !== null && opt !== undefined && opt.isPresent()) {
      var eq = opt.get().getEquippedCurios()
      for (var s = 0; s < eq.getSlots(); s++) {
        scan(eq.getStackInSlot(s), 0)
      }
    }
  } catch (e) { /* no curios — plain inventory only */ }
  return found
}

function cpIsEmpty(obj) {
  for (var k in obj) {
    return false
  }
  return true
}

function cpResolvePlayer(ctx) {
  try {
    return $SP_EntityArgument.getPlayer(ctx, 'player')
  } catch (e) {
    return null // selector matched nobody
  }
}

function cpTitle(server, player, title, subtitle) {
  var who = cpQuoted(player)
  server.runCommandSilent('title ' + who + ' times 10 60 10')
  server.runCommandSilent('title ' + who + ' subtitle {"text":"' + subtitle + '"}')
  server.runCommandSilent('title ' + who + ' title {"text":"' + title + '"}')
}

function cpSound(server, player, soundId) {
  server.runCommandSilent(
    'playsound ' + soundId + ' master ' + cpQuoted(player)
  )
}

// ============================================================================
// Actions
// ============================================================================

// aggressive: alarm + wanted bounty (Straja guards aggro the smuggler)
function cpBeginArrest(server, player, name, reason, site) {
  cpTitle(server, player, SP_ARREST_TITLE, SP_ARREST_SUBTITLE)
  var seconds = Math.ceil(SP_ARREST_DELAY_TICKS / 20) + 1
  server.runCommandSilent('effect give ' + cpQuoted(player) + ' minecraft:darkness ' + seconds + ' 0 true')
  server.runCommandSilent('effect give ' + cpQuoted(player) + ' minecraft:blindness ' + seconds + ' 0 true')
  server.scheduleInTicks(SP_ARREST_DELAY_TICKS, function () {
    cpFinishArrest(server, name, reason, site)
  })
}

// inspect — stage 1 (first plate/door set). Banned players are pushed back;
// fugitives are arrested on sight; contraband carriers pass but are warned to
// drop it in the chest; clean players pass quietly.
function cpSlotIsContraband(stack, level, depth, site) {
  if (stack === null || stack.isEmpty() || depth > 3) {
    return false
  }
  if (cpIsCb(cpItemId(stack), site)) {
    return true
  }
  var subs = cpSubStacks(stack)
  if (subs.length === 0) {
    var deep = cpDeepScan(stack, level)
    for (var id in deep) {
      if (cpIsCb(id, site)) {
        return true
      }
    }
    return false
  }
  for (var i = 0; i < subs.length; i++) {
    if (cpSlotIsContraband(subs[i], level, depth + 1, site)) {
      return true
    }
  }
  return false
}

// ============================================================================
// Evidence room — each site's evidence[] is an ordered list of container positions;
// a full chest overflows into the next one ("a room full of evidence").
// ============================================================================

// Returns the block entity at a configured evidence position, or null.
function cpEvidenceContainer(server, ev, fallbackLevel) {
  var evLevel = null
  try {
    evLevel = server.getLevel(ev.dim)
  } catch (e) { /* dimension not loaded */ }
  if (evLevel === null || evLevel === undefined) {
    evLevel = fallbackLevel
  }
  if (evLevel === null || evLevel === undefined) {
    return null
  }
  var chest = null
  try {
    var blk = evLevel.getBlock(ev.x, ev.y, ev.z)
    try { chest = blk.entity } catch (e1) { /* not exposed */ }
    if (chest === null || chest === undefined) {
      try { chest = blk.getEntity() } catch (e2) { /* still nothing */ }
    }
    if (chest !== null && chest !== undefined && chest.getContainerSize() > 0) {
      return chest
    }
  } catch (e) {
    console.error('[Prison] evidence chest unreadable at ' + ev.x + ' ' + ev.y + ' ' + ev.z + ' :: ' + e)
  }
  return null
}

// Stores a copy of `stack` in the evidence room, merging into existing stacks
// then filling empty slots; walks chests in order and overflows. Returns true
// when the whole stack was stored.
function cpStoreEvidence(server, stack, fallbackLevel, evList) {
  var id = cpItemId(stack)
  for (var c = 0; c < evList.length; c++) {
    var chest = cpEvidenceContainer(server, evList[c], fallbackLevel)
    if (chest === null) {
      continue
    }
    var chestSize = chest.getContainerSize()
    // merge into same-id stacks first, then the first empty slot
    for (var pass = 0; pass < 2; pass++) {
      for (var s = 0; s < chestSize; s++) {
        var cur = chest.getItem(s)
        if (pass === 0) {
          if (!cur.isEmpty() && cpItemId(cur) === id && cur.getCount() + stack.getCount() <= cur.getMaxStackSize()) {
            cur.setCount(cur.getCount() + stack.getCount())
            chest.setChanged()
            return true
          }
        } else if (cur.isEmpty()) {
          chest.setItem(s, stack.copy())
          chest.setChanged()
          return true
        }
      }
    }
  }
  return false
}

// ============================================================================
// Personal chests — one prisoner per chest pair. SP_CFG.pcells =
// [{a:{dim,x,y,z}, b:{dim,x,y,z}|null, sign:{dim,x,y,z}|null}] — 'b' is the
// second half of a double chest (or null for a single); the sign in front is
// tagged with the occupant's name on assignment and cleared on release.
// ============================================================================

function cpPChestBoxes(idx) {
  var cell = SP_CFG.pcells[idx]
  if (cell === null || cell === undefined) {
    return []
  }
  var out = []
  if (cell.a !== null && cell.a !== undefined) {
    out.push(cell.a)
  }
  if (cell.b !== null && cell.b !== undefined) {
    out.push(cell.b)
  }
  return out
}

// Same item = same id + same components (renamed/enchanted gear never merges).
function cpSameStack(a, b) {
  try {
    return $SP_ItemStack.isSameItemSameComponents(a, b) === true
  } catch (e) { /* not bridged — compare pieces below */ }
  try {
    return String(a.getItem()) === String(b.getItem()) &&
      a.getComponents().equals(b.getComponents())
  } catch (e2) {
    try {
      return String(a.getItem()) === String(b.getItem())
    } catch (e3) {
      return false
    }
  }
}

// Insert a stack into one resolved container; merges same stacks then fills
// empty slots. Shrinks `stack` by the amount stored.
function cpInsertIntoContainer(chest, stack) {
  var size = chest.getContainerSize()
  var cap = stack.getMaxStackSize()
  var i
  for (i = 0; i < size && !stack.isEmpty(); i++) {
    var cur = chest.getItem(i)
    if (!cur.isEmpty() && cur.getCount() < cap && cpSameStack(cur, stack)) {
      var mv = Math.min(cap - cur.getCount(), stack.getCount())
      cur.setCount(cur.getCount() + mv)
      chest.setItem(i, cur)
      chest.setChanged()
      stack.shrink(mv)
    }
  }
  for (i = 0; i < size && !stack.isEmpty(); i++) {
    var slot = chest.getItem(i)
    if (slot.isEmpty()) {
      var mv2 = Math.min(cap, stack.getCount())
      chest.setItem(i, stack.copyWithCount(mv2))
      chest.setChanged()
      stack.shrink(mv2)
    }
  }
}

// Spread a stack across a list of chest positions (personal pair). Returns
// true when the whole stack fit — the caller empties the slot afterwards.
function cpStoreInChests(server, stack, level, boxes) {
  var anyChest = false
  for (var b = 0; b < boxes.length && !stack.isEmpty(); b++) {
    var chest = cpEvidenceContainer(server, boxes[b], level)
    if (chest === null) {
      continue
    }
    anyChest = true
    cpInsertIntoContainer(chest, stack)
  }
  return anyChest && stack.isEmpty()
}

// ============================================================================
// Full seizure — EVERY stack leaves the prisoner (inventory, armor, offhand,
// curios — backpack contents included). Contraband goes to the shared
// evidence pile ("la grămadă"); everything else to the prisoner's personal
// chest. Personal overflow spills into the pile — nothing stays behind.
// Returns { items, contra, left } unit counts.
// ============================================================================
function cpSeizeAll(server, player, level, site, pcIdx) {
  var stats = { items: 0, contra: 0, left: 0 }
  var evList = cpSiteEvidenceList(site)
  var boxes = cpPChestBoxes(pcIdx)

  function place(stack) {
    if (stack === null || stack.isEmpty()) {
      return
    }
    var n = stack.getCount()
    if (cpSlotIsContraband(stack, level, 0, site)) {
      if (cpStoreEvidence(server, stack, level, evList)) {
        stats.contra += n
        stack.setCount(0)
      } else {
        stats.left += n
      }
      return
    }
    if (cpStoreInChests(server, stack, level, boxes)) {
      stats.items += n
      stack.setCount(0)
      return
    }
    if (cpStoreEvidence(server, stack, level, evList)) {
      stats.items += n
      stack.setCount(0)
    } else {
      stats.left += n
    }
  }

  var inv = player.getInventory()
  var size = inv.getContainerSize()
  for (var i = 0; i < size; i++) {
    place(inv.getItem(i))
  }
  // curios slots — backpacks on the back, belt pouches (the "inventories in
  // inventories" gap): equipped containers are seized like inventory stacks
  try {
    var opt = $SP_CuriosApi.getCuriosInventory(player)
    if (opt !== null && opt !== undefined && opt.isPresent()) {
      var eq = opt.get().getEquippedCurios()
      for (var s = 0; s < eq.getSlots(); s++) {
        var st = eq.getStackInSlot(s)
        if (st === null || st.isEmpty()) {
          continue
        }
        place(st)
        if (st.isEmpty()) {
          eq.setStackInSlot(s, $SP_ItemStack.EMPTY)
        }
      }
    }
  } catch (e) { /* no curios — inventory only */ }
  if (stats.left > 0) {
    console.warn('[Prison] chests full/missing — ' + stats.left + ' item(s) stayed on ' + cpPlayerName(player))
  }
  return stats
}

// Hand a stack to a player; whatever doesn't fit drops at their feet.
function cpGivePlayer(player, st) {
  try {
    player.getInventory().add(st)
  } catch (e) { /* fall through to world drop */ }
  if (st !== null && !st.isEmpty()) {
    try {
      player.spawnAtLocation(st)
    } catch (e2) {
      console.error('[Prison] could not return stack: ' + e2)
    }
  }
}

// Release path: pour a personal chest pair back to the player and clear it.
function cpPourPChest(server, player, idx) {
  var boxes = cpPChestBoxes(idx)
  var fallbackLevel = null
  try { fallbackLevel = player.level } catch (e) { /* unreachable */ }
  for (var b = 0; b < boxes.length; b++) {
    var chest = cpEvidenceContainer(server, boxes[b], fallbackLevel)
    if (chest === null) {
      continue
    }
    var size = chest.getContainerSize()
    for (var s = 0; s < size; s++) {
      var st = chest.getItem(s)
      if (st === null || st.isEmpty()) {
        continue
      }
      cpGivePlayer(player, st)
      chest.setItem(s, $SP_ItemStack.EMPTY)
    }
    chest.setChanged()
  }
}

// Writes a sign's front text — prisoner name on assignment, blank on release.
function cpWriteSign(server, pos, name) {
  if (pos === null || pos === undefined) {
    return
  }
  var level = null
  try { level = server.getLevel(pos.dim) } catch (e) { /* dim unloaded */ }
  if (level === null || level === undefined) {
    return
  }
  try {
    var blk = level.getBlock(pos.x, pos.y, pos.z)
    var msgs
    if (name === '') {
      msgs = ['{"text":""}', '{"text":""}', '{"text":""}', '{"text":""}']
    } else {
      msgs = [
        '{"text":""}',
        JSON.stringify({ text: String(name), color: 'dark_red' }),
        JSON.stringify({ text: 'AREST', color: 'dark_gray' }),
        '{"text":""}'
      ]
    }
    var data = { front_text: { messages: msgs } }
    try { blk.mergeEntityData(data); return } catch (e1) { /* alt bridge */ }
    try { blk.setEntityData(data); return } catch (e2) { /* alt bridge */ }
    try { blk.entityData = data } catch (e3) { /* give up */ }
  } catch (e) {
    console.error('[Prison] could not write sign at ' + pos.x + ' ' + pos.y + ' ' + pos.z + ' :: ' + e)
  }
}

// Squared distance between {dim,x,y,z} points; cross-dimension = Infinity so
// same-dim candidates always win and cross-dim ones remain a last resort.
function cpDist2(ref, pos) {
  if (ref === null || ref === undefined || pos === null || pos === undefined) {
    return Infinity
  }
  if (String(ref.dim) !== String(pos.dim)) {
    return Infinity
  }
  var dx = ref.x - pos.x
  var dy = ref.y - pos.y
  var dz = ref.z - pos.z
  return dx * dx + dy * dy + dz * dz
}

// Reference position for allocations: the player's position when available,
// else the site's anchor — "closest free X" is measured from the arrest point.
function cpPosOf(p) {
  try {
    return { dim: String(p.level.dimension), x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) }
  } catch (e) {
    return null
  }
}

// Is this block position still a live container? Broken/removed chests are
// skipped at allocation so a demolished locker never swallows items.
function cpContainerUsable(server, pos) {
  if (pos === null || pos === undefined) {
    return false
  }
  try {
    var lvl = server.getLevel(pos.dim)
    if (lvl === null || lvl === undefined) {
      return false
    }
    var blk = lvl.getBlock(pos.x, pos.y, pos.z)
    var be = null
    try { be = blk.entity } catch (e) { /* none */ }
    if (be === null || be === undefined) {
      try { be = blk.getEntity() } catch (e2) { /* none */ }
    }
    return be !== null && be !== undefined && be.getContainerSize() > 0
  } catch (e) {
    return false
  }
}

function cpPChestUsable(server, cell) {
  if (cell === null || cell === undefined || cell.removed === true) {
    return false
  }
  if (!cpContainerUsable(server, cell.a)) {
    return false
  }
  if (cell.b !== null && cell.b !== undefined && !cpContainerUsable(server, cell.b)) {
    return false
  }
  return true
}

// Who currently owns pcell/jcell idx? A name string, or null when free.
// Entries keep INDEX references, so unassign never splices the array —
// removed=true marks dead units without renumbering everyone's holdings.
function cpPChestTaken(idx) {
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    if (e !== null && e !== undefined && e.pchest === idx) {
      return k
    }
  }
  for (var p in CP_JAIL.pendingChest) {
    if (CP_JAIL.pendingChest[p] === idx) {
      return p
    }
  }
  return null
}

function cpJCellTaken(idx) {
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    if (e !== null && e !== undefined && e.jcell === idx) {
      return k
    }
  }
  return null
}

// CLOSEST free personal chest to ref — tags the sign with the occupant's name.
// -1 when every unit is taken/broken (seizure overflows to the shared pile).
function cpAllocPChest(server, name, ref) {
  var used = {}
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    if (e !== null && e !== undefined && e.pchest !== undefined && e.pchest >= 0) {
      used[e.pchest] = true
    }
  }
  // released-but-offline players keep their pair reserved until they relog
  // and collect — never assign a chest that still holds someone's items
  for (var p in CP_JAIL.pendingChest) {
    if (CP_JAIL.pendingChest[p] >= 0) {
      used[CP_JAIL.pendingChest[p]] = true
    }
  }
  var best = -1
  var bestD = Infinity
  for (var i = 0; i < SP_CFG.pcells.length; i++) {
    if (used[i]) {
      continue
    }
    if (!cpPChestUsable(server, SP_CFG.pcells[i])) {
      console.error('[Prison] pchest #' + (i + 1) + ' lipsește/demolat — sărit (re-pune cufărul sau re-pick)')
      continue
    }
    var d = cpDist2(ref, SP_CFG.pcells[i].a)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (best < 0) {
    // self-managing: exhaustion is announced, not silent — jailers see it and
    // can extend the wall with `pick pchest` without reading logs
    try {
      var jps = server.getPlayerList().getPlayers()
      for (var j = 0; j < jps.size(); j++) {
        var jp = jps.get(j)
        if (SP_JAILERS.indexOf(cpPlayerName(jp)) >= 0) {
          jp.tell(Text.literal('§e[Prison] TOATE cuferele personale sunt ocupate/distruse — ' + name + ' fără cufăr; bunurile merg la grămadă. `pick pchest` pentru extindere.'))
        }
      }
    } catch (e) { /* notification best-effort */ }
    console.error('[Prison] pchest pool exhausted — ' + name + ' has no personal chest (items → evidence pile)')
    return -1
  }
  var cell = SP_CFG.pcells[best]
  // auto-claim a plain adjacent sign when none was bound during pick —
  // hands-free: staff just places an empty sign in front of the pair
  if (cell.sign === null || cell.sign === undefined) {
    var found = cpFindSignNear(server, cell)
    if (found !== null) {
      cell.sign = found
      spCfgSave(server)
    }
  }
  cpWriteSign(server, cell.sign, name)
  return best
}

function cpFreePChest(server, idx) {
  if (idx === undefined || idx === null || idx < 0 || idx >= SP_CFG.pcells.length) {
    return
  }
  cpWriteSign(server, SP_CFG.pcells[idx].sign, '')
}

function cpPosEq(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b
  }
  return a.dim === b.dim && a.x === b.x && a.y === b.y && a.z === b.z
}

// ---- jail cells --------------------------------------------------------------
// SP_CFG.jcells = [{dim,x,y,z,yaw}] — picked spot per cell, one inmate each.
// jailTarget stays as the shared overflow/fallback when all cells are taken
// (or when the admin prefers one big room — with jcells empty everything
// behaves exactly like before).

// CLOSEST free cell to ref; -1 = all taken → the shared jailTarget overflow.
function cpAllocJCell(name, ref) {
  var used = {}
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    if (k === name) {
      continue // re-assigning one's own cell counts as free
    }
    if (e !== null && e !== undefined && e.jcell !== undefined && e.jcell >= 0) {
      used[e.jcell] = true
    }
  }
  var best = -1
  var bestD = Infinity
  for (var i = 0; i < SP_CFG.jcells.length; i++) {
    if (used[i] || SP_CFG.jcells[i].removed === true) {
      continue
    }
    var d = cpDist2(ref, SP_CFG.jcells[i])
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  if (best < 0 && SP_CFG.jcells.length > 0) {
    console.error('[Prison] jail cells all occupied — ' + name + ' goes to the shared overflow point')
  }
  return best
}

// Where this prisoner physically belongs: their assigned cell (if still live),
// else the shared jailTarget overflow point. Null only when nothing exists.
function cpJailSpot(name) {
  var entry = cpJailEntry(name)
  if (entry !== null && entry.jcell !== undefined && entry.jcell >= 0 && entry.jcell < SP_CFG.jcells.length && SP_CFG.jcells[entry.jcell].removed !== true) {
    return SP_CFG.jcells[entry.jcell]
  }
  return SP_CFG.jailTarget
}

// Single TP primitive for every "put them in the cell" call site.
function cpTpJail(server, player) {
  var jt = cpJailSpot(cpPlayerName(player))
  if (jt === null || jt === undefined) {
    // Safe fallback detention coordinate: player's current location in holding
    try {
      var dim = String(player.level.dimension)
      jt = { dim: dim, x: Math.floor(player.x), y: Math.floor(player.y), z: Math.floor(player.z), yaw: 0 }
    } catch (e) {
      return false
    }
  }
  var yaw = jt.yaw === undefined ? 0 : jt.yaw
  server.runCommandSilent(
    'execute in ' + jt.dim + ' run tp ' + cpQuoted(player) +
    ' ' + jt.x + ' ' + jt.y + ' ' + jt.z + ' ' + yaw + ' 0'
  )
  return true
}

// ---- chest pair / sign detection ----------------------------------------------
// A vanilla double chest is two block entities: blockstate type=left|right with
// the same facing — the joined half sits adjacent with the opposite type. Any
// clicked half resolves the whole pair, so the admin clicks each chest ONCE.
function cpChestPartner(level, x, y, z) {
  var block = null
  try { block = level.getBlock(x, y, z) } catch (e) { return null }
  if (block === null || block === undefined) {
    return null
  }
  var id = String(block.id)
  var type = ''
  try { type = String(block.properties.type || '') } catch (e) { /* not a chest */ }
  if (type !== 'left' && type !== 'right') {
    return null
  }
  var facing = ''
  try { facing = String(block.properties.facing || '') } catch (e) { /* no facing */ }
  var want = type === 'left' ? 'right' : 'left'
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (var i = 0; i < dirs.length; i++) {
    var other = null
    try { other = level.getBlock(x + dirs[i][0], y, z + dirs[i][1]) } catch (e) { continue }
    if (other === null || other === undefined || String(other.id) !== id) {
      continue
    }
    var ot = ''
    var of = ''
    try { ot = String(other.properties.type || '') } catch (e) { continue }
    try { of = String(other.properties.facing || '') } catch (e2) { continue }
    if (ot === want && of === facing) {
      return { dim: String(level.dimension), x: x + dirs[i][0], y: y, z: z + dirs[i][1] }
    }
  }
  return null
}

// Finds a sign block adjacent to the chest pair — lets staff place a plain
// sign in front of each locker and the system claims it automatically.
function cpFindSignNear(server, cell) {
  if (cell === null || cell === undefined) {
    return null
  }
  var level = null
  try { level = server.getLevel(cell.a.dim) } catch (e) { /* unloaded */ }
  if (level === null || level === undefined) {
    return null
  }
  var chests = [cell.a]
  if (cell.b !== null && cell.b !== undefined) {
    chests.push(cell.b)
  }
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (var c = 0; c < chests.length; c++) {
    for (var i = 0; i < dirs.length; i++) {
      var sx = chests[c].x + dirs[i][0]
      var sz = chests[c].z + dirs[i][1]
      var sb = null
      try { sb = level.getBlock(sx, chests[c].y, sz) } catch (e) { continue }
      if (sb === null || sb === undefined) {
        continue
      }
      var sid = String(sb.id)
      if (sid.substring(Math.max(0, sid.length - 4)) === 'sign') {
        return { dim: chests[c].dim, x: sx, y: chests[c].y, z: sz }
      }
    }
  }
  return null
}

// ============================================================================
// Hunt flags — checkpoint reads/writes the shared persistentData keys that
// straja_gold.js sets (strajaThief / strajaWantedUntil), so the two files
// never need to call each other.
// ============================================================================

function cpIsHunted(player) {
  var pd = player.persistentData
  try { if (pd.getBoolean('strajaThief')) { return true } } catch (e) { /* no flag */ }
  try { if (pd.getBoolean('cpFugitive')) { return true } } catch (e) { /* no flag */ }
  try {
    var until = pd.getLong('strajaWantedUntil')
    if (until > 0 && Date.now() < until) {
      return true
    }
  } catch (e) { /* no flag */ }
  return false
}

// Custody ends the hunt: thief/wanted flags clear and the earliest rep
// backup wins (strajaRepBackup predates cpRepBackup — the fugitive suppressor
// can back up an already-thief-zeroed rep, so it must never overwrite it).
function cpClearHuntFlags(server, player) {
  var pd = player.persistentData
  try { pd.putBoolean('strajaThief', false) } catch (e) { /* best-effort */ }
  try { pd.putInt('strajaOwed', 0) } catch (e) { /* best-effort */ }
  try { pd.putLong('strajaWantedUntil', 0) } catch (e) { /* best-effort */ }
  try { pd.putBoolean('cpFugitive', false) } catch (e) { /* best-effort */ }
  server.runCommandSilent('scoreboard players set ' + cpQuoted(player) + ' straja_thief 0')
  try {
    if (pd.contains('strajaRepBackup')) {
      var rep = pd.getInt('strajaRepBackup')
      server.runCommandSilent('noppes faction ' + cpQuoted(player) + ' ' + SP_STRAJA_FACTION + ' set ' + rep)
      pd.remove('strajaRepBackup')
      // consumed — cpRestoreRep must not roll this back to a stale 0
      pd.putBoolean('cpRepBackedUp', false)
      pd.remove('cpRepBackup')
    }
  } catch (e) { /* rep restore best-effort */ }
}

// A register entry must exist before items can be seized into a personal
// chest — hunted deaths create one here so the pchest index + record survive
// even if the player never comes back.
function cpJailEnsureEntry(server, name, reason, site, ref) {
  var prev = cpJailEntry(name)
  if (prev !== null) {
    return prev
  }
  var siteName = site !== null && site !== undefined ? site.name : null
  var entry = {
    t: Date.now(),
    reason: reason,
    items: {},
    confiscated: false,
    status: 'jailed',
    site: siteName,
    arrests: 0, // cpFinishArrest increments when custody actually completes
    jcell: cpAllocJCell(name, ref)
  }
  CP_JAIL.jailed[name] = entry
  cpJailSave(server)
  return entry
}

// Hands the prisoner a written-book arrest report (Romanian, § codes render).
function cpGiveReport(server, player, name, reason, found, confiscated) {
  var when = ''
  try {
    when = new Date().toISOString().replace('T', ' ').substring(0, 16)
  } catch (e) {
    when = String(Date.now())
  }

  var pages = []
  pages.push('§0§lPROCES-VERBAL DE AREST§r\n§0\nInculpat: ' + name + '\nData: ' + when + '\nMotiv: ' + reason)

  var items = []
  for (var id in found) {
    items.push(found[id].count + 'x ' + found[id].name + ' (' + id + ')')
  }
  if (items.length === 0) {
    items.push('niciunul (interdicție activă)')
  }
  var per = 0
  var buf = '§0Marfă reținută' + (confiscated ? '' : ' §8(nedepusă — cufăr lipsă)') + ':\n'
  for (var i = 0; i < items.length; i++) {
    buf += '§8- §0' + items[i] + '\n'
    per++
    if (per === 11) {
      pages.push(buf)
      buf = ''
      per = 0
    }
  }
  if (per > 0) {
    pages.push(buf)
  }

  pages.push('§0Dispoziție:\nEliberarea și ștergerea numelui se fac numai de ' + SP_JAILERS.join('/') + '.\nBunurile personale → cufărul personal; contrabanda rămâne probă la Straja.')

  var snbt = []
  for (var p = 0; p < pages.length; p++) {
    // SNBT quoted strings reject \n — double the backslashes (\\ -> \) so the
    // inner JSON still decodes real newlines, then escape single quotes
    snbt.push('\'' + JSON.stringify({ text: pages[p] }).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'')
  }
  var give = 'give ' + cpQuoted(player) +
    ' minecraft:written_book[minecraft:written_book_content={title:\'Proces-verbal\',author:\'Straja\',pages:[' +
    snbt.join(',') + ']}]'
  try {
    server.runCommandSilent(give)
  } catch (e) {
    console.error('[Prison] could not give report book to ' + name + ' :: ' + e)
  }
}

// Finalize the arrest after the fade-out. Re-resolves the player (they may
// have disconnected during the delay) and re-scans — the report reflects what
// they held when the cell door shut, not when the plate fired.
// Mojmap: PlayerList.getPlayerByName(String). Resolves to null when offline.
function cpOnlinePlayer(server, name) {
  try {
    return server.getPlayerList().getPlayerByName(name)
  } catch (e) {
    try {
      return server.getPlayerList().getPlayer(name)
    } catch (e2) {
      return null
    }
  }
}

function cpFinishArrest(server, name, reason, site) {
  var player = cpOnlinePlayer(server, name)

  var found = {}
  var confiscated = false
  var inv = ''
  var prev = cpJailEntry(name)
  var ref = (player !== null && player !== undefined) ? cpPosOf(player)
    : (site !== null && site !== undefined ? cpSiteAnchor(site) : null)
  var pcIdx = (prev !== null && prev.pchest !== undefined) ? prev.pchest : cpAllocPChest(server, name, ref)
  var jcIdx = (prev !== null && prev.jcell !== undefined) ? prev.jcell : cpAllocJCell(name, ref)
  if (player !== null && player !== undefined) {
    var level = null
    try { level = player.level } catch (e) { /* unreachable */ }
    found = cpScanContraband(player, site)
    inv = cpInvSummary(player) // snapshot before confiscation empties the slots
    var seized = cpSeizeAll(server, player, level, site, pcIdx)
    confiscated = seized.left === 0

    var pd = player.persistentData
    if (!pd.getBoolean('cpJailed')) {
      pd.putString('cpJailWasMode', cpGameModeName(player))
    }
    pd.putBoolean('cpJailed', true)
    pd.putBoolean('cpFugitive', false)
    server.runCommandSilent('tag ' + cpQuoted(name) + ' add cp_jailed')

    // custody consumes the hunt — thief/wanted flags clear and the pre-crime
    // rep is restored so guards don't kill a prisoner inside
    cpClearHuntFlags(server, player)
    cpRestoreRep(server, player)

    cpSetGameMode(player, 'adventure')

    if (!cpTpJail(server, player)) {
      console.error('[Prison] no jail spot configured (use `strajaprison pick cell` or `cellhere`/`jailhere`) — ' + name + ' flagged jailed but not moved')
    }

    cpGiveReport(server, player, name, reason, found, confiscated)
    player.tell(Text.literal('§cEști în arestul Straja. Numai ' + SP_JAILERS.join('/') + ' te poate elibera.'))
  }

  var siteName = site !== null && site !== undefined ? site.name : null
  CP_JAIL.jailed[name] = {
    t: Date.now(),
    reason: reason,
    items: found,
    confiscated: confiscated,
    status: 'jailed',
    site: siteName,
    arrests: (prev !== null && prev.arrests !== undefined ? prev.arrests : 0) + 1,
    pchest: pcIdx,
    jcell: jcIdx
  }
  cpJailSave(server)
  spLogEvent('arrested', name, inv === '' ? '(offline la arest)' : inv, reason + ' | confiscat=' + confiscated + (siteName !== null ? ' | punct=' + siteName : ''))

  // notify online jailers — command blocks see the console, players see chat
  try {
    var players = server.getPlayerList().getPlayers()
    for (var i = 0; i < players.size(); i++) {
      var pl = players.get(i)
      if (SP_JAILERS.indexOf(cpPlayerName(pl)) >= 0) {
        pl.tell(Text.literal('§b[Prison] ' + name + ' a fost arestat (' + reason + ').'))
      }
    }
  } catch (e) { /* notification is best-effort */ }

  console.info('[Prison] ' + name + ' arrested (' + reason + '), confiscated=' + confiscated)
}

// arrest — stage 2 (second plate/door set, no way back). Anyone still carrying
// contraband, banned, or already on the jail register is faded to black and
// jailed.
function cpRelease(ctx, name, fine) {
  var src = cpCmdSourcePlayer(ctx)
  if (src !== null && !ctx.source.hasPermission(2) && SP_JAILERS.indexOf(cpPlayerName(src)) < 0) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] numai ' + SP_JAILERS.join('/') + ' poate elibera prizonieri.'))
    return 0
  }
  var server = ctx.source.server

  var entry = cpJailEntry(name)
  var realName = name
  if (entry === null) {
    ctx.source.sendSystemMessage(Text.literal('§7[Prison] ' + name + ' nu e în arest.'))
    return 0
  }
  for (var k in CP_JAIL.jailed) {
    if (CP_JAIL.jailed[k] === entry) {
      realName = k
      break
    }
  }

  if (fine > 0) {
    CP_JAIL.fines[realName] = (CP_JAIL.fines[realName] || 0) + fine
  }
  var player = cpOnlinePlayer(server, realName)
  var pcIdx = entry.pchest !== undefined ? entry.pchest : -1
  delete CP_JAIL.jailed[realName]
  if (pcIdx >= 0 && (player === null || player === undefined)) {
    // released while offline: chest stays sealed under their name until they
    // relog and collect — pendingChest keeps the pair out of allocation
    CP_JAIL.pendingChest[realName] = pcIdx
  }
  cpJailSave(server)

  var repOk = null

  if (player !== null && player !== undefined) {
    var pd = player.persistentData
    pd.putBoolean('cpJailed', false)
    pd.putBoolean('cpFugitive', false)
    server.runCommandSilent('tag ' + cpQuoted(realName) + ' remove cp_jailed')
    // their personal chest pours back — the contraband pile keeps its share
    if (pcIdx >= 0) {
      cpPourPChest(server, player, pcIdx)
      cpFreePChest(server, pcIdx)
    }
    cpClearHuntFlags(server, player) // pardon erases thief/wanted flags too
    repOk = cpRestoreRep(server, player)
    var wasMode = String(pd.getString('cpJailWasMode') || '')
    pd.remove('cpJailWasMode')
    // freed players get their pre-jail mode back; with none recorded the
    // sensible default is survival, not a second confinement in adventure
    cpSetGameMode(player, wasMode.length > 0 ? wasMode : 'survival')
    // freed at the gate that arrested them when it's known; else nearest;
    // else the first configured site — never leave them standing in the cell
    var relSite = (entry.site !== undefined && SP_CP_CFG.sites[entry.site] !== undefined)
      ? SP_CP_CFG.sites[entry.site]
      : cpSiteNearest(server, player)
    if (relSite === null) {
      for (var first in SP_CP_CFG.sites) {
        relSite = SP_CP_CFG.sites[first]
        break
      }
    }
    var rt = relSite !== null ? relSite.denyTarget : null
    if (rt !== null && rt !== undefined) {
      var yaw = rt.yaw === undefined ? 0 : rt.yaw
      server.runCommandSilent(
        'execute in ' + rt.dim + ' run tp ' + cpQuoted(player) +
        ' ' + rt.x + ' ' + rt.y + ' ' + rt.z + ' ' + yaw + ' 0'
      )
    }
    cpTitle(server, player, SP_FREE_TITLE, SP_FREE_SUBTITLE)
    if (fine > 0) {
      player.tell(Text.literal('§eAi fost eliberat cu o amendă de ' + fine + '. Numele ți-a fost șters.'))
    } else {
      player.tell(Text.literal('§aAi fost eliberat și numele ți-a fost șters.'))
    }
  }

  spLogEvent('released', realName, '', 'eliberat de ' + (src !== null ? cpPlayerName(src) : 'consolă') + (fine > 0 ? ' | amendă ' + fine : '') + (repOk === false ? ' | rep fără backup' : ''))
  ctx.source.sendSystemMessage(Text.literal('§a[Prison] ' + realName + ' eliberat' +
    (fine > 0 ? ' cu amendă ' + fine : '') + ' — nume șters din registru.'))
  console.info('[Prison] ' + realName + ' released' + (fine > 0 ? ' (fine ' + fine + ')' : ''))
  return 1
}

// ---- admin/config commands --------------------------------------------------

// strajaprison denyhere [site] — the site's deny teleport target becomes
// where you stand. Without a name it binds to the nearest configured site.
function cpCmdJailHere(ctx) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] jailhere must be run by a player.'))
    return 0
  }
  var yaw = 0
  try {
    yaw = Math.round(Number(p.getYRot()))
  } catch (e) { /* getYRot not exposed on the KubeJS wrapper */ }
  SP_CFG.jailTarget = {
    dim: String(p.level.dimension),
    x: Math.floor(p.x),
    y: Math.floor(p.y),
    z: Math.floor(p.z),
    yaw: yaw
  }
  spCfgSave(ctx.source.server)
  p.tell(Text.literal('§a[Prison] jail (punct comun / overflow) = ' + JSON.stringify(SP_CFG.jailTarget)))
  return 1
}

// strajaprison cellhere — appends the spot you're standing on as one cell.
// One cell holds one inmate; extras overflow to the shared jailTarget.
function cpCmdCellHere(ctx) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] cellhere must be run by a player.'))
    return 0
  }
  var yaw = 0
  try {
    yaw = Math.round(Number(p.getYRot()))
  } catch (e) { /* getYRot not exposed on the KubeJS wrapper */ }
  var dim = String(p.level.dimension)
  var cx = Math.floor(p.x)
  var cy = Math.floor(p.y)
  var cz = Math.floor(p.z)
  for (var i = 0; i < SP_CFG.jcells.length; i++) {
    var jc = SP_CFG.jcells[i]
    if (jc.dim === dim && jc.x === cx && jc.y === cy && jc.z === cz) {
      if (jc.removed === true) {
        jc.removed = false
        spCfgSave(ctx.source.server)
        p.tell(Text.literal('§a[Prison] celula #' + (i + 1) + ' reactivată.'))
      } else {
        p.tell(Text.literal('§7[Prison] celula #' + (i + 1) + ' e deja fix aici.'))
      }
      return 0
    }
  }
  SP_CFG.jcells.push({ dim: dim, x: cx, y: cy, z: cz, yaw: yaw, removed: false })
  spCfgSave(ctx.source.server)
  p.tell(Text.literal('§a[Prison] celulă #' + SP_CFG.jcells.length + ' la ' + cx + ' ' + cy + ' ' + cz +
    ' — ' + SP_CFG.jcells.length + ' deținuți cu celule proprii; restul la punctul comun.'))
  return 1
}

// strajaprison jcells — list cells + occupants
function cpCmdJCells(ctx) {
  if (SP_CFG.jcells.length === 0 && SP_CFG.jailTarget === null) {
    ctx.source.sendSystemMessage(Text.literal('§7[Prison] nicio celulă/punct de arest — `cellhere`/`pick cell` sau `jailhere`.'))
    return 1
  }
  var owner = {}
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    if (e !== null && e !== undefined && e.jcell !== undefined && e.jcell >= 0) {
      owner[e.jcell] = k
    }
  }
  for (var i = 0; i < SP_CFG.jcells.length; i++) {
    var c = SP_CFG.jcells[i]
    ctx.source.sendSystemMessage(Text.literal('§7  celula #' + (i + 1) + ' @ ' + c.x + ' ' + c.y + ' ' + c.z +
      ' — ' + (c.removed === true ? '§8retrasă' : (owner[i] !== undefined ? '§c' + owner[i] : '§aliberă'))))
  }
  ctx.source.sendSystemMessage(Text.literal('§7  punct comun (overflow): ' +
    (SP_CFG.jailTarget !== null ? JSON.stringify(SP_CFG.jailTarget) : 'nedefinit — `jailhere`')))
  return 1
}

function cpCmdJailed(ctx) {
  var names = []
  for (var k in CP_JAIL.jailed) {
    var e = CP_JAIL.jailed[k]
    var fine = CP_JAIL.fines[k] || 0
    names.push(k + ' §7(' + e.status + (fine > 0 ? ', amendă ' + fine : '') + ')')
  }
  if (names.length === 0) {
    ctx.source.sendSystemMessage(Text.literal('§7[Prison] arestul e gol — niciun prizonier, niciun fugitiv.'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Prison] registru (' + names.length + '):'))
  names.forEach(function (n) {
    ctx.source.sendSystemMessage(Text.literal('§7  - ' + n))
  })
  return 1
}

function cpCmdRecord(ctx, name) {
  var entry = cpJailEntry(name)
  if (entry === null) {
    ctx.source.sendSystemMessage(Text.literal('§7[Prison] ' + name + ' nu are dosar activ.'))
    return 0
  }
  // entry was matched case-insensitively — resolve the canonical register key
  // so the fine lookup uses the same name `release` wrote
  var realName = name
  for (var k in CP_JAIL.jailed) {
    if (CP_JAIL.jailed[k] === entry) {
      realName = k
      break
    }
  }
  var when = 'n/a'
  try {
    when = new Date(entry.t).toISOString().replace('T', ' ').substring(0, 16)
  } catch (e) { /* keep n/a */ }
  ctx.source.sendSystemMessage(Text.literal('§b[Prison] dosar ' + realName + ':'))
  ctx.source.sendSystemMessage(Text.literal('§7  status: ' + entry.status + ' §7| arestări: ' + (entry.arrests || 1) + ' §7| data: ' + when +
    (entry.pchest !== undefined && entry.pchest >= 0 ? ' §7| cufăr personal #' + (entry.pchest + 1) : '')))
  ctx.source.sendSystemMessage(Text.literal('§7  motiv: ' + (entry.reason || 'n/a') + ' §7| confiscat: ' + (entry.confiscated ? 'da' : 'nu')))
  var found = entry.items || {}
  var any = false
  for (var id in found) {
    any = true
    ctx.source.sendSystemMessage(Text.literal('§7  - ' + found[id].count + 'x ' + found[id].name + ' §8(' + id + ')'))
  }
  if (!any) {
    ctx.source.sendSystemMessage(Text.literal('§7  fără obiecte pe dosar'))
  }
  var fine = CP_JAIL.fines[realName] || 0
  if (fine > 0) {
    ctx.source.sendSystemMessage(Text.literal('§7  amendă totală: ' + fine))
  }
  return 1
}

// checkpoint addcontraband / delcontraband — held item in/out of the list
function cpCmdPChests(ctx) {
  if (SP_CFG.pcells.length === 0) {
    ctx.source.sendSystemMessage(Text.literal('§7[Prison] niciun cufăr personal — `strajaprison pick pchest` apoi click pe fiecare cufăr (dublurile se împerechează singure).'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Prison] cufere personale (' + SP_CFG.pcells.length + '):'))
  for (var i = 0; i < SP_CFG.pcells.length; i++) {
    var c = SP_CFG.pcells[i]
    var owner = '§7liber'
    for (var k in CP_JAIL.jailed) {
      var e = CP_JAIL.jailed[k]
      if (e !== null && e !== undefined && e.pchest === i) {
        owner = '§c' + k
      }
    }
    for (var pk in CP_JAIL.pendingChest) {
      if (CP_JAIL.pendingChest[pk] === i) {
        owner = '§e' + pk + ' (eliberat-offline)'
      }
    }
    ctx.source.sendSystemMessage(Text.literal(
      '§7  #' + (i + 1) + ': ' + c.a.dim + ' ' + c.a.x + ',' + c.a.y + ',' + c.a.z +
      (c.b !== null && c.b !== undefined ? ' +' + c.b.x + ',' + c.b.y + ',' + c.b.z : '') +
      ' → ' + (c.removed === true ? '§8retras' : owner)))
  }
  return 1
}


// ============================================================================
// Exempt resolution — global exempt list lives in the checkpoint cfg; the
// prison honors it so border-service exemptions also skip custody handling.
// ============================================================================
function spIsExemptListed(name) {
  var lower = String(name).toLowerCase()
  for (var k in SP_CP_CFG.exempt) {
    if (k.toLowerCase() === lower) {
      return true
    }
  }
  return false
}

function spIsExempt(player) {
  var mode = cpGameModeName(player)
  return spIsExemptListed(cpPlayerName(player)) || (mode !== 'survival' && mode !== 'adventure')
}

// ============================================================================
// Events — the prison owns every custody lifecycle hook. Nothing else should
// re-apply adventure mode, re-jail reloggers, or sweep the register.
// ============================================================================

// kubejs reload re-executes this file but does NOT re-fire ServerEvents.loaded —
// self-heal config + register from persistentData on the first tick
var SP_CFG_DIRTY = true


// Every ~2s: enforce adventure on the jailed, reconcile flags against the
// register, and flag fugitives found beyond the jail radius. The checkpoint
// cfg view refreshes on the same cadence so site/exempt changes propagate.
ServerEvents.tick(function (event) {
  if (SP_CFG_DIRTY) {
    spCfgLoad(event.server)
    cpJailLoad(event.server)
    SP_CFG_DIRTY = false
  }
  spJailSweepTicks++
  if (spJailSweepTicks % 40 === 0) {
    spCfgLoad(event.server) // refresh read-only checkpoint view too
    cpSweepJail(event.server)
  }
})

// A prisoner who logs out stays jailed: on the next login they go straight
// back to the cell, in adventure, with their flags re-applied. A fugitive who
// relogs is treated as recaptured (they wake up inside the cell anyway).
PlayerEvents.loggedIn(function (event) {
  var p = event.player
  if (p === null || p === undefined) {
    return
  }
  var name = cpPlayerName(p)

  // jailer login alert — the judge gets a pling + custody summary if anyone
  // is currently jailed or on the run
  if (SP_JAILERS.indexOf(name) >= 0) {
    var sv = event.server
    sv.scheduleInTicks(60, function () {
      var fresh = cpOnlinePlayer(sv, name)
      if (fresh === null || fresh === undefined) {
        return
      }
      var names = []
      var fug = 0
      for (var k in CP_JAIL.jailed) {
        var st = CP_JAIL.jailed[k] === null || CP_JAIL.jailed[k] === undefined ? 'jailed' : String(CP_JAIL.jailed[k].status)
        names.push(k + (st === 'fugitive' ? ' §c(fugitiv)' : ''))
        if (st === 'fugitive') {
          fug++
        }
      }
      if (names.length === 0) {
        return
      }
      fresh.tell(Text.literal('§e[Prison] §f' + names.length + ' în custodie' + (fug > 0 ? ' §c— ' + fug + ' FUGITIV(I)!' : '') + '§7: ' + names.join('§7, ')))
      fresh.tell(Text.literal('§7/strajaprison jailed pentru registru complet.'))
      try {
        sv.runCommandSilent('playsound minecraft:block.note_block.pling master ' + cpQuoted(name) + ' ~ ~ ~ 1 1.2')
      } catch (e) { /* sound best-effort */ }
    })
  }

  var server = event.server
  var pd = p.persistentData

  // released while offline: they relog to their belongings — pour the
  // reserved chest back, then free the pair for the next prisoner
  var pendIdx = CP_JAIL.pendingChest[name]
  if (pendIdx !== undefined && pendIdx >= 0) {
    delete CP_JAIL.pendingChest[name]
    cpJailSave(server)
    cpPourPChest(server, p, pendIdx)
    cpFreePChest(server, pendIdx)
    p.tell(Text.literal('§a[Prison] Bunurile ți-au fost returnate din cufărul personal.'))
  }

  var entry = cpJailEntry(name)
  if (entry === null) {
    return
  }

  if (entry.status === 'fugitive') {
    cpRecapture(server, p, name, 'relog în arest')
  }
  pd.putBoolean('cpJailed', true)
  pd.putBoolean('cpFugitive', false)
  if (String(pd.getString('cpJailWasMode') || '').length === 0) {
    pd.putString('cpJailWasMode', cpGameModeName(p))
  }
  // a prisoner must relog empty-handed — covers arrests that fired while
  // they were offline (seizure can't touch an offline inventory)
  var relogRef = cpPosOf(p)
  if (entry.pchest === undefined) {
    entry.pchest = cpAllocPChest(server, name, relogRef) // pre-refactor entries get one now
    cpJailSave(server)
  }
  if (entry.jcell === undefined) {
    entry.jcell = cpAllocJCell(name, relogRef)
    cpJailSave(server)
  }
  var pcIdxL = entry.pchest
  var relogSite = (entry.site !== undefined && entry.site !== null && SP_CP_CFG.sites[entry.site] !== undefined)
    ? SP_CP_CFG.sites[entry.site]
    : cpSiteNearest(server, p)
  var relogLevel = null
  try { relogLevel = p.level } catch (e) { /* unreachable */ }
  cpSeizeAll(server, p, relogLevel, relogSite, pcIdxL)
  if (!spIsExempt(p)) {
    cpSetGameMode(p, 'adventure')
  }
  cpTpJail(server, p)
  p.tell(Text.literal('§cEști în continuare în arestul Straja. Numai ' + SP_JAILERS.join('/') + ' te poate elibera.'))
})

// Death: a flag carrier (thief / wanted / fugitive) who dies still gets
// booked — seize everything now, jail them on respawn.
EntityEvents.death(function (event) {
  var p = event.entity
  if (p === null || p === undefined || !p.isPlayer()) {
    return
  }
  var name = cpPlayerName(p)
  var pd = p.persistentData
  var entry = cpJailEntry(name)
  var site = cpSiteNearest(event.server, p)
  var hunted = false
  if (entry === null) {
    // not in custody — a flag carrier who dies still gets booked
    hunted = cpIsHunted(p)
    if (!hunted || spIsExempt(p)) {
      return
    }
    entry = cpJailEnsureEntry(event.server, name, 'vânător de Straja — mort în fugă', site, cpPosOf(p))
    entry.pchest = cpAllocPChest(event.server, name, cpPosOf(p))
    cpJailSave(event.server)
    pd.putBoolean('cpJailOnRespawn', true)
  }
  var level = null
  try { level = p.level } catch (e) { /* unreachable */ }
  var diedInv = cpInvSummary(p)
  if (entry.pchest === undefined) {
    entry.pchest = cpAllocPChest(event.server, name, cpPosOf(p)) // pre-refactor entries get one now
    cpJailSave(event.server)
  }
  if (entry.jcell === undefined) {
    entry.jcell = cpAllocJCell(event.server, cpPosOf(p))
    cpJailSave(event.server)
  }
  cpSeizeAll(event.server, p, level, site, entry.pchest)
  spLogEvent('died', name, diedInv, hunted
    ? 'mort în fugă — iteme confiscate, celula la respawn'
    : 'posediuni mutate în camera de probe')
})

PlayerEvents.respawned(function (event) {
  var p = event.player
  if (p === null || p === undefined) {
    return
  }
  var name = cpPlayerName(p)
  var pd = p.persistentData
  // a flag carrier who died is straight into custody — items already seized
  if (pd.getBoolean('cpJailOnRespawn')) {
    pd.putBoolean('cpJailOnRespawn', false)
    cpFinishArrest(event.server, name, 'vânător de Straja — mort în fugă', cpSiteNearest(event.server, p))
    return
  }
  var entry = cpJailEntry(name)
  if (entry === null) {
    return
  }
  var server = event.server
  cpRecapture(server, p, name, 'mort — respawn în celulă')
  if (!spIsExempt(p)) {
    cpSetGameMode(p, 'adventure')
  }
  cpTpJail(server, p)
})

// Pick handler — cell floors + personal chest pairs (the 'spPick' flag can be
// armed from here OR from `strajacheckpoint pick cell|pchest`, which forwards
// shared infrastructure picks to this service).
BlockEvents.rightClicked(event => {
  var player = event.player
  if (player === null || player === undefined) {
    return
  }
  if (!player.hasPermissions(2)) {
    return
  }
  var mode = spPickMode(player)
  if (mode !== 'pchest' && mode !== 'cell') {
    return
  }

  // personal-chest picker — global (not site-bound): EVERY chest click commits
  // one unit immediately; a double chest's second half resolves itself from the
  // blockstate (type=left|right + matching facing). Click a sign to bind it to
  // the last-registered chest; otherwise an adjacent sign is auto-claimed at
  // allocation time. Click all 12 in a row — the system handles in/out.
  if (mode === 'pchest') {
    var pos2 = event.block.pos
    var x2 = pos2.getX()
    var y2 = pos2.getY()
    var z2 = pos2.getZ()
    var dim2 = String(event.level.dimension)
    var bid = String(event.block.id)
    var isSign = bid.substring(Math.max(0, bid.length - 4)) === 'sign'
    var be2 = null
    try { be2 = event.block.entity } catch (e) { /* no block entity */ }
    if (be2 === null || be2 === undefined) {
      try { be2 = event.block.getEntity() } catch (e2) { /* still nothing */ }
    }
    var isChest = false
    try {
      isChest = be2 !== null && be2 !== undefined && be2.getContainerSize() > 0
    } catch (e3) { /* not a container */ }

    if (isChest) {
      var aPos = { dim: dim2, x: x2, y: y2, z: z2 }
      var bPos = cpChestPartner(event.level, x2, y2, z2)
      for (var q = 0; q < SP_CFG.pcells.length; q++) {
        var cell = SP_CFG.pcells[q]
        if (cpPosEq(cell.a, aPos) || cpPosEq(cell.b, aPos) ||
          (bPos !== null && (cpPosEq(cell.a, bPos) || cpPosEq(cell.b, bPos)))) {
          // toggle: click a registered FREE chest retires it; click a retired
          // one re-enables it; an occupied chest refuses everything
          var owner = cpPChestTaken(q)
          if (cell.removed === true) {
            cell.removed = false
            spCfgSave(event.server)
            player.tell(Text.literal('§a[Prison] cufăr #' + (q + 1) + ' reactivat — reintră în rotație.'))
          } else if (owner !== null) {
            player.tell(Text.literal('§c[Prison] cufăr #' + (q + 1) + ' e ocupat de ' + owner + ' — nu-l pot scoate.'))
          } else {
            cell.removed = true
            spCfgSave(event.server)
            player.tell(Text.literal('§e[Prison] cufăr #' + (q + 1) + ' retras din rotație — click din nou pentru reactivare.'))
          }
          event.cancel()
          return
        }
      }
        SP_CFG.pcells.push({ a: aPos, b: bPos, sign: null, removed: false })
      spCfgSave(event.server)
      player.persistentData.putInt('cpPcLast', SP_CFG.pcells.length - 1)
      var nNew = SP_CFG.pcells.length
      var found = cpFindSignNear(event.server, SP_CFG.pcells[nNew - 1])
      if (found !== null) {
        SP_CFG.pcells[nNew - 1].sign = found
        spCfgSave(event.server)
      }
      player.tell(Text.literal('§a[Prison] cufăr personal #' + nNew + ' înregistrat (' +
        (bPos !== null ? 'dublu' : 'simplu') +
        (found !== null ? ' + semn' : ' — click un semn adiacent dacă vrei etichetă') + '). ' +
        nNew + ' total — `strajaprison pick off` la final.'))
      event.cancel()
      return
    }
    if (isSign) {
      var last = -1
      try { last = player.persistentData.getInt('cpPcLast') } catch (e4) { /* none */ }
      if (last >= 0 && last < SP_CFG.pcells.length) {
        SP_CFG.pcells[last].sign = { dim: dim2, x: x2, y: y2, z: z2 }
        spCfgSave(event.server)
        player.tell(Text.literal('§a[Prison] semn legat la cufăr #' + (last + 1) + '.'))
      } else {
        player.tell(Text.literal('§c[Prison] click întâi pe cufărul căruia îi aparține semnul.'))
      }
      event.cancel()
      return
    }
    player.tell(Text.literal('§c[Prison] click pe cufere (dublurile se împerechează singure) sau pe un semn pt. ultimul cufăr.'))
    event.cancel()
    return
  }

  // jail-cell picker — global: click the floor block inside each cell; the
  // inmate is teleported onto it (feet at block+1). One cell = one inmate.
  if (mode === 'cell') {
    var cpos = event.block.pos
    var cx = cpos.getX()
    var cy = cpos.getY() + 1 // stand spot = the air above the clicked block
    var cz = cpos.getZ()
    var cdim = String(event.level.dimension)
    for (var ci = 0; ci < SP_CFG.jcells.length; ci++) {
      var jc = SP_CFG.jcells[ci]
      if (jc.dim === cdim && jc.x === cx && jc.y === cy && jc.z === cz) {
        var occupant = cpJCellTaken(ci)
        if (jc.removed === true) {
          jc.removed = false
          spCfgSave(event.server)
          player.tell(Text.literal('§a[Prison] celula #' + (ci + 1) + ' reactivată.'))
        } else if (occupant !== null) {
          player.tell(Text.literal('§c[Prison] celula #' + (ci + 1) + ' e ocupată de ' + occupant + ' — nu o pot scoate.'))
        } else {
          jc.removed = true
          spCfgSave(event.server)
          player.tell(Text.literal('§e[Prison] celula #' + (ci + 1) + ' retrasă — click din nou pentru reactivare.'))
        }
        event.cancel()
        return
      }
    }
    SP_CFG.jcells.push({ dim: cdim, x: cx, y: cy, z: cz, yaw: 0, removed: false })
    spCfgSave(event.server)
    player.tell(Text.literal('§a[Prison] celulă #' + SP_CFG.jcells.length +
      ' la ' + cx + ' ' + cy + ' ' + cz + ' — o celulă = un deținut. `strajaprison pick off` la final.'))
    event.cancel()
    return
  }


})

// ============================================================================
// Command surface — `strajaprison` is THE custody API. Command blocks, NPCs
// and other scripts arrest/release through it; the jailer gate on release is
// enforced here AND at the checkpoint alias.
// ============================================================================

function spArrestCmd(ctx, reasonArg) {
  var player = null
  try { player = $SP_EntityArgument.getPlayer(ctx, 'player') } catch (e) { player = null }
  if (player === null || player === undefined) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] jucătorul nu e online.'))
    return 0
  }
  var isExemptListed = spIsExemptListed(cpPlayerName(player))
  if (isExemptListed) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] ' + cpPlayerName(player) + ' este pe lista de scutiri — nu poate fi arestat.'))
    return 0
  }
  var mode = cpGameModeName(player)
  if (mode !== 'survival' && mode !== 'adventure') {
    // Admin explicit arrest or test simulation: switch to survival mode
    cpSetGameMode(player, 'survival')
  }
  var server = ctx.source.server
  var name = cpPlayerName(player)
  var reason = reasonArg !== null && reasonArg !== undefined && String(reasonArg).length > 0
    ? String(reasonArg)
    : 'arest administrativ'
  cpBeginArrest(server, player, name, reason, cpSiteNearest(server, player))
  ctx.source.sendSystemMessage(Text.literal('§a[Prison] ' + name + ' trimis în arest — ' + reason))
  return 1
}

// Underlined, clickable command link — same idiom as checkpoint's wizard.
function spCmdLink(text, cmd) {
  var link = Text.literal('§b§n' + text)
  try {
    link = link.clickRunCommand(cmd)
  } catch (e) { /* underlined text fallback — still copyable */ }
  return link
}

function spCmdPick(ctx, mode) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Prison] pick trebuie rulat de un jucător.'))
    return 0
  }
  var current = String(p.persistentData.getString('spPick') || '')
  if (mode === 'off' || mode === current) {
    spSetPick(p, '')
    p.tell(Text.literal('§7[Prison] picker off.'))
    return 1
  }
  if (mode === 'pchest') {
    spSetPick(p, 'pchest')
    p.tell(Text.literal('§b[Prison] click dreapta pe fiecare cufăr personal — dublele se împerechează singure; un semn clickuit se leagă la ultimul cufăr. §7`strajaprison pick pchest` din nou = off.'))
    return 1
  }
  if (mode === 'cell') {
    spSetPick(p, 'cell')
    p.tell(Text.literal('§b[Prison] click dreapta pe podeaua fiecărei celule — un deținut per celulă; surplusul ajunge la punctul comun. §7`strajaprison pick cell` din nou = off.'))
    return 1
  }
  p.tell(Text.literal('§c[Prison] pick cell|pchest — repeti comanda pentru off.'))
  return 0
}

function spCmdStatus(ctx) {
  var jailed = 0
  var fug = 0
  for (var j in CP_JAIL.jailed) {
    jailed++
    if (CP_JAIL.jailed[j] !== null && CP_JAIL.jailed[j] !== undefined && CP_JAIL.jailed[j].status === 'fugitive') {
      fug++
    }
  }
  var freeCells = 0
  for (var c = 0; c < SP_CFG.jcells.length; c++) {
    if (cpJCellTaken(c) < 0) {
      freeCells++
    }
  }
  var freeP = 0
  for (var q = 0; q < SP_CFG.pcells.length; q++) {
    if (cpPChestTaken(q) < 0) {
      freeP++
    }
  }
  ctx.source.sendSystemMessage(Text.literal(
    '§b[Prison] deținuți=' + jailed + (fug > 0 ? ' §c(' + fug + ' fugitivi)' : '') +
    ' §bcelule=' + SP_CFG.jcells.length + ' (' + freeCells + ' libere)' +
    ' §bcufere=' + SP_CFG.pcells.length + ' (' + freeP + ' libere)' +
    ' §bpunct comun=' + (SP_CFG.jailTarget !== null ? 'setat' : '§cNESETAT')))
  var fines = 0
  for (var f in CP_JAIL.fines) {
    fines++
  }
  ctx.source.sendSystemMessage(Text.literal('§7  amenzi înregistrate: ' + fines + ' — `strajaprison jailed` pentru registru, `record <nume>` pt. fișă.'))
  return 1
}

// One wizard line: green check when done; red cross + clickable command
// links when missing (click runs the command). Same idiom as checkpoint's
// cpWizardStep. cmds = string or array of commands.
function spWizardStep(ctx, done, label, cmds) {
  if (done) {
    ctx.source.sendSystemMessage(Text.literal('  §a✓ §f' + label))
    return 0
  }
  var line = Text.literal('  §c✗ §f' + label)
  if (cmds !== null && cmds !== undefined) {
    if (typeof cmds === 'string') cmds = [cmds]
    line = line.append(Text.literal(' §8→ §eurmează: '))
    for (var i = 0; i < cmds.length; i++) {
      if (i > 0) line = line.append(Text.literal(' §7· '))
      line = line.append(spCmdLink('/' + cmds[i], '/' + cmds[i]))
    }
  }
  ctx.source.sendSystemMessage(line)
  return 1
}

function spCmdSetup(ctx) {
  var missing = 0
  ctx.source.sendSystemMessage(Text.literal('§b[Prison] checklist custodie:'))
  missing += spWizardStep(ctx, SP_CFG.jcells.length > 0 || SP_CFG.jailTarget !== null,
    'celule de arest (' + SP_CFG.jcells.length + (SP_CFG.jailTarget !== null ? ' + punct comun' : '') + ') — click podeaua fiecărei celule sau stai înăuntru',
    ['strajaprison pick cell', 'strajaprison cellhere', 'strajaprison jailhere'])
  missing += spWizardStep(ctx, SP_CFG.pcells.length > 0,
    'cufere personale pt. deținuți (' + SP_CFG.pcells.length + ') — unul per prizonier; click pe fiecare, dublele se împerechează singure',
    'strajaprison pick pchest')
  var evCount = 0
  for (var sn in SP_CP_CFG.sites) {
    evCount += SP_CP_CFG.sites[sn].evidence.length
  }
  ctx.source.sendSystemMessage(Text.literal('§7  probe disponibile: ' + evCount + ' cufere pe ' +
    Object.keys(SP_CP_CFG.sites).length + ' site-uri (configurate la §fstrajacheckpoint§7 — opțional; fără probe, contrabandul cade lângă cuferele personale).'))
  if (missing === 0) {
    ctx.source.sendSystemMessage(Text.literal('§aTotul e configurat — `strajaprison arrest <jucător> [motiv]` pune pe cineva în custodie.'))
  }
  return 1
}

const SP_HELP_TOPICS = ['setup', 'arest', 'eliberare', 'celule', 'cufere']

function spHelpSuggest(ctx, builder) {
  try {
    for (var i = 0; i < SP_HELP_TOPICS.length; i++) {
      builder.suggest(SP_HELP_TOPICS[i])
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

function spCmdHelp(ctx, topic) {
  var t = topic === null || topic === undefined ? '' : String(topic).toLowerCase()
  if (t === 'arest') {
    ctx.source.sendSystemMessage(Text.literal('§b[Prison] AREST — §fstrajaprison arrest <jucător> [motiv]'))
    ctx.source.sendSystemMessage(Text.literal('§7  Public pentru orice sistem: command blocks, NPC-uri, strajacheckpoint îl apelează intern.'))
    ctx.source.sendSystemMessage(Text.literal('§7  Sechestrează tot inventarul (inclusiv nested + curios), alocă celulă + cufăr personal,'))
    ctx.source.sendSystemMessage(Text.literal('§7  mută contrabandul în camera de probe a site-ului cel mai apropiat (dacă există).'))
    return 1
  }
  if (t === 'eliberare') {
    ctx.source.sendSystemMessage(Text.literal('§b[Prison] ELIBERARE — §fstrajaprison release <nume> [amendă]'))
    ctx.source.sendSystemMessage(Text.literal('§7  Doar ' + SP_JAILERS.join('/') + '. Reversează bunurile din cufărul personal, contrabandul rămâne la probe,'))
    ctx.source.sendSystemMessage(Text.literal('§7  restaurare gamemode, teleport la poarta care a arestat; amenda se înregistrează în registru.'))
    return 1
  }
  if (t === 'celule') {
    ctx.source.sendSystemMessage(Text.literal('§b[Prison] CELULE — §fstrajaprison pick cell§7 (click pe podea) · §fcellhere§7 (stai înăuntru) · §fjailhere§7 (punct comun)'))
    ctx.source.sendSystemMessage(Text.literal('§7  O celulă = un deținut; surplusul ajunge la punctul comun (jailTarget). §fjcells§7 = ocupare.'))
    ctx.source.sendSystemMessage(Text.literal('§7  Fugitivii (ieșit din raza arestului) devin vânați de Straja și sunt rearestați la contact.'))
    return 1
  }
  if (t === 'cufere') {
    ctx.source.sendSystemMessage(Text.literal('§b[Prison] CUFERE PERSONALE — §fstrajaprison pick pchest'))
    ctx.source.sendSystemMessage(Text.literal('§7  Click pe fiecare cufăr (dublele se împerechează singure), semnul se leagă la ultimul. §fpchests§7 = listă.'))
    ctx.source.sendSystemMessage(Text.literal('§7  Bunurile ne-contraband ale deținutului stau aici și revarsă înapoi la eliberare/relog.'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Prison] strajaprison — serviciul de custodie:'))
  ctx.source.sendSystemMessage(Text.literal('§7  arest <jucător> [motiv] · release <nume> [amendă] · jailed · record <nume>'))
  ctx.source.sendSystemMessage(Text.literal('§7  pick cell|pchest|off · jailhere · cellhere · jcells · pchests · setup · status'))
  ctx.source.sendSystemMessage(Text.literal('§7  help ' + SP_HELP_TOPICS.join(' | ')))
  return 1
}

ServerEvents.commandRegistry(event => {
  var Commands = event.commands

  event.register(
    Commands.literal('strajaprison')
      .requires(src => src.hasPermission(2))
      .executes(ctx => spCmdHelp(ctx, null))
      .then(Commands.literal('arrest')
        .then(Commands.argument('player', $SP_EntityArgument.player())
          .executes(ctx => spArrestCmd(ctx, null))
          .then(Commands.argument('reason', $SP_StringArgument.greedyString())
            .executes(ctx => spArrestCmd(ctx, $SP_StringArgument.getString(ctx, 'reason'))))))
      .then(Commands.literal('release')
        .then(Commands.argument('name', $SP_StringArgument.word()).suggests(cpJailedSuggest)
          .executes(ctx => cpRelease(ctx, $SP_StringArgument.getString(ctx, 'name'), 0))
          .then(Commands.argument('fine', $SP_IntegerArgument.integer(0))
            .executes(ctx => cpRelease(ctx, $SP_StringArgument.getString(ctx, 'name'), $SP_IntegerArgument.getInteger(ctx, 'fine'))))))
      .then(Commands.literal('jailed')
        .executes(ctx => cpCmdJailed(ctx)))
      .then(Commands.literal('record')
        .then(Commands.argument('name', $SP_StringArgument.word()).suggests(cpJailedSuggest)
          .executes(ctx => cpCmdRecord(ctx, $SP_StringArgument.getString(ctx, 'name')))))
      .then(Commands.literal('jcells')
        .executes(ctx => cpCmdJCells(ctx)))
      .then(Commands.literal('pchests')
        .executes(ctx => cpCmdPChests(ctx)))
      .then(Commands.literal('jailhere')
        .executes(ctx => cpCmdJailHere(ctx)))
      .then(Commands.literal('cellhere')
        .executes(ctx => cpCmdCellHere(ctx)))
      .then(Commands.literal('pick')
        .then(Commands.argument('mode', $SP_StringArgument.word())
          .executes(ctx => spCmdPick(ctx, $SP_StringArgument.getString(ctx, 'mode')))))
      .then(Commands.literal('setup')
        .executes(ctx => spCmdSetup(ctx)))
      .then(Commands.literal('status')
        .executes(ctx => spCmdStatus(ctx)))
      .then(Commands.literal('help')
        .executes(ctx => spCmdHelp(ctx, null))
        .then(Commands.argument('topic', $SP_StringArgument.word()).suggests(spHelpSuggest)
          .executes(ctx => spCmdHelp(ctx, $SP_StringArgument.getString(ctx, 'topic')))))
  )
})

ServerEvents.loaded(event => {
  spCfgLoad(event.server)
  cpJailLoad(event.server)
  if (SP_CFG.jailTarget === null && SP_CFG.jcells.length === 0) {
    console.error('[Prison] no jail spot configured (use `strajaprison pick cell`, `cellhere`, or `jailhere`) — arrests will flag but not move prisoners!')
  }
  if (SP_CFG.pcells.length === 0) {
    console.info('[Prison] no personal chests configured (`strajaprison pick pchest`) — belongings will be returned/dropped instead.')
  }
  console.info('[Prison] loaded — ' + Object.keys(CP_JAIL.jailed).length + ' in register, ' + SP_CFG.jcells.length + ' cells, ' + SP_CFG.pcells.length + ' personal chests')
})

