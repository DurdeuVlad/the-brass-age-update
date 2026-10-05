// ============================================================================
// Port Checkpoint — contraband control + jail service
// ----------------------------------------------------------------------------
// Two-stage border crossing (each command takes @p from the pressure plate's
// command block):
//
//   Stage 1 — first plate/door set:
//     strajacheckpoint inspect <player>   — banned players are pushed back
//                                     (deny teleport + doors shut); carriers
//                                     of contraband get through but are warned
//                                     to leave it in the nearby chest; clean
//                                     players pass quietly.
//   Stage 2 — second plate/door set (no way back):
//     strajacheckpoint arrest <player>    — anyone still carrying contraband
//                                     (or banned) is faded to black, teleported
//                                     to the jail in adventure mode, and gets a
//                                     written-book report; contraband goes to
//                                     the evidence chest when one is picked.
//
//   Bans / jail admin:
//     ban <name> / unban <name> / bans  — ban list (blocked at stage 1)
//     release <name> [fine]            — jailer-only: frees, clears the name,
//                                     restores the old gamemode, optional fine
//     jailed / record <name>           — jail register (jailed/fugitive/fines)
//     jailhere                          — jail position = where you stand
//     pick door|evidence|off            — click iron doors / the evidence chest
//
//   Legacy single-stage actions (still available for other gates):
//     aggressive <player> — alarm + WANTED flag (Straja NPCs attack on sight)
//     info <player>       — chat list of the contraband
//     deny <player>       — teleport back off the plate + close doors
//
// Players who leave the jail radius while jailed become FUGITIVES (wanted by
// Straja NPCs) until released. Commands are permission-gated (level 2):
// command blocks pass, players don't — except release, which is restricted to
// CP_JAILERS by name even among ops.
//
// SINGLE PRISON SERVICE: this file is the canonical custody system — arrest,
// register, cells, fugitives, evidence, personal chests, release. straja_gold
// only flags players (strajaThief/strajaWantedUntil shared keys); checkpoint
// reads those flags and runs the whole custody lifecycle itself.
//   Contraband           → shared evidence chests per site ("la grămadă")
//   Everything else      → prisoner's personal chest pair (pick pchest:
//                          click 1-2 chests + the sign in front)
//   Thief/wanted death   → items seized at death, custody on respawn
//   Release              → belongings pour back; contraband stays evidence
// ============================================================================

function cpLoadClass(path) {
  try {
    return Java.loadClass(path)
  } catch (e) {
    console.error('[Checkpoint] Java.loadClass failed: ' + path + ' :: ' + e)
    return null
  }
}

const $CP_EntityArgument = cpLoadClass('net.minecraft.commands.arguments.EntityArgument')
const $CP_StringArgument = cpLoadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $CP_IntegerArgument = cpLoadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $CP_Registries = cpLoadClass('net.minecraft.core.registries.BuiltInRegistries')
const $CP_Player = cpLoadClass('net.minecraft.world.entity.player.Player')
const $CP_DataComponents = cpLoadClass('net.minecraft.core.component.DataComponents')
const $CP_Capabilities = cpLoadClass('net.neoforged.neoforge.capabilities.Capabilities')
const $CP_CuriosApi = cpLoadClass('top.theillusivec4.curios.api.CuriosApi')
const $CP_CompoundTag = cpLoadClass('net.minecraft.nbt.CompoundTag')
const $CP_ListTag = cpLoadClass('net.minecraft.nbt.ListTag')
const $CP_GameType = cpLoadClass('net.minecraft.world.level.GameType')
const $CP_ItemStack = cpLoadClass('net.minecraft.world.item.ItemStack')
const $CP_NpcAPI = cpLoadClass('noppes.npcs.api.NpcAPI')
const $CP_PlayerWrapper = cpLoadClass('noppes.npcs.api.wrapper.PlayerWrapper')

// ============================================================================
// CONFIG — edit these
// ============================================================================

// Items considered contraband at the port checkpoint.
// !!! EDIT THIS LIST — e.g. add 'minecraft:tnt': true, 'minecraft:flint_and_steel': true
const CP_CONTRABAND = {
  'minecraft:gold_block': true,
  'minecraft:gold_ingot': true,
  'minecraft:gold_nugget': true
}

// Teleport-back point for `strajacheckpoint deny` — the player is moved here,
// off the pressure plate, so its signal dies and the iron doors close.
// !!! SET THIS — e.g. { dim: 'minecraft:overworld', x: 100, y: 64, z: -200, yaw: 180 }
// (yaw is optional — the direction the player faces after the teleport)
const CP_DENY_TARGET = null

// Optional: bottom-half positions of iron doors the deny command should
// force-close (useful when the doors are NOT powered by the plate itself).
//   [{ dim: 'minecraft:overworld', x: 0, y: 0, z: 0 }, ...]
const CP_DOORS = []

// How long `strajacheckpoint aggressive` keeps the smuggler "wanted" (seconds).
const CP_WANTED_SECONDS = 60

// Player names the checkpoint never flags — managed in-game, persistent:
//   strajacheckpoint exempt|unexempt <name>|exempts   (CP_CFG.exempt)
// (survival/adventure are always processed; only creative/spectator skip)

// Should `strajacheckpoint info` also confirm when the inventory is clean?
const CP_INFO_CONFIRM_CLEAN = true

// Custody (jail cells, personal chests, seizure, release) is owned by
// straja_prison.js — this file only decides WHO gets arrested and calls
// `strajaprison arrest <player> <reason>`; `release` delegates the same way.
const CP_SITE_RADIUS = 24

// Only these players may run `strajacheckpoint release` — the judge.
// !!! EDIT — your in-game name goes here:
const CP_JAILERS = ['dwurdy']

// Fade-to-black length (ticks) between the arrest title and the jail teleport.
const CP_LOG_FILE = 'kubejs/checkpoint-log.json'
const CP_LOG_MAX = 2000

// ============================================================================
// Runtime config — in-game picks win over the file constants above. Multiple
// border posts share one jail/policy: inspect/arrest resolve the nearest site.
//   strajacheckpoint site <nume> denyhere      — gate's deny spot = where you stand
//   strajacheckpoint site <nume> pick door     — right-click that gate's iron doors
//   strajacheckpoint site <nume> pick evidence — right-click that gate's chests
//   strajacheckpoint denyhere|pick door [site] — same, targeting a site
//   strajacheckpoint site list|remove <nume>
//   strajacheckpoint addcontraband / delcontraband / status
// Selections persist in server.persistentData.portCheckpointCfg.
// ============================================================================

var CP_CFG = {
  sites: {},
  contraband: JSON.parse(JSON.stringify(CP_CONTRABAND)),
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

function cpCfgLoad(server) {
  // sites[<name>] = per-checkpoint geometry (deny target, doors, evidence
  // chests). Policy (contraband, bans, jail, register) is global and shared
  // by every border post — a fugitive caught at the exit gate goes to the
  // same jail as one caught at the entry gate.
  CP_CFG = {
    sites: {},
    contraband: JSON.parse(JSON.stringify(CP_CONTRABAND)),
    banned: {},
    exempt: {}
  }
  try {
    var raw = String(server.persistentData.getString('portCheckpointCfg') || '')
    if (raw.length > 2) {
      var saved = JSON.parse(raw)
      if (saved.contraband !== undefined) CP_CFG.contraband = saved.contraband
      if (saved.banned !== undefined) CP_CFG.banned = saved.banned
      if (saved.exempt !== undefined) CP_CFG.exempt = saved.exempt
      if (saved.sites !== undefined) {
        CP_CFG.sites = saved.sites
        for (var sn in CP_CFG.sites) {
          CP_CFG.sites[sn].name = sn
          CP_CFG.sites[sn].evidence = cpNormalizeEvidence(CP_CFG.sites[sn].evidence || [])
          if (CP_CFG.sites[sn].doors === undefined) CP_CFG.sites[sn].doors = []
          if (CP_CFG.sites[sn].denyTarget === undefined) CP_CFG.sites[sn].denyTarget = null
          if (CP_CFG.sites[sn].gates === undefined) CP_CFG.sites[sn].gates = []
          if (CP_CFG.sites[sn].board === undefined) CP_CFG.sites[sn].board = null
          if (CP_CFG.sites[sn].cb === undefined) CP_CFG.sites[sn].cb = {}
          if (CP_CFG.sites[sn].exempt === undefined) CP_CFG.sites[sn].exempt = {}
          if (CP_CFG.sites[sn].link === undefined) CP_CFG.sites[sn].link = null
        }
      } else if (saved.denyTarget !== undefined || saved.doors !== undefined || saved.evidence !== undefined) {
        // migrate the pre-sites flat config into the default site
        CP_CFG.sites = {
          main: {
            name: 'main',
            denyTarget: saved.denyTarget !== undefined ? saved.denyTarget : null,
            doors: saved.doors !== undefined ? saved.doors : [],
            evidence: cpNormalizeEvidence(saved.evidence !== undefined ? saved.evidence : [])
          }
        }
        console.info('[Checkpoint] migrated flat config into site "main"')
      }
    }
  } catch (e) {
    console.error('[Checkpoint] could not load saved config: ' + e)
  }
}

// ============================================================================
// Site helpers — a "site" is one physical border post. inspect/arrest resolve
// the site by proximity so both gates' command blocks run the same commands.
// ============================================================================

function cpSiteNew(name) {
  return {
    name: name, denyTarget: null, doors: [], evidence: [],
    // one-way lanes: each gate is a line a<->b drawn across the corridor plus
    // `from` — a point on the side travelers legitimately COME FROM. Crossing
    // the line starting on the wrong side = denied (pushed back + doors shut).
    gates: [],
    // boarding zone (island<->continent boats): {dim,x1,z1,x2,z2,y} — riders
    // get checked the moment they mount a boat inside it.
    board: null,
    // localized contraband: cb[id]=true extra ban here, cb[id]=false allowed here
    cb: {},
    // site-local player exemptions (fishermen on that dock, ferrymen, ...)
    exempt: {},
    // linked site name — a stamp from the linked site passes this site's gates
    link: null
  }
}

function cpSiteEnsure(name) {
  if (CP_CFG.sites[name] === undefined) {
    CP_CFG.sites[name] = cpSiteNew(name)
  }
  CP_CFG.sites[name].name = name
  return CP_CFG.sites[name]
}

// The position that defines "at this checkpoint": deny target first, then the
// first watched door, then the first evidence chest.
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
  var bestDist = CP_SITE_RADIUS * CP_SITE_RADIUS
  var dim = String(player.level.dimension)
  for (var n in CP_CFG.sites) {
    var anchor = cpSiteAnchor(CP_CFG.sites[n])
    if (anchor === null || anchor.dim !== dim) {
      continue
    }
    var dx = player.x - anchor.x
    var dy = player.y - anchor.y
    var dz = player.z - anchor.z
    var d = dx * dx + dy * dy + dz * dz
    if (d <= bestDist) {
      bestDist = d
      best = CP_CFG.sites[n]
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
  for (var n in CP_CFG.sites) {
    for (var i = 0; i < CP_CFG.sites[n].evidence.length; i++) {
      all.push(CP_CFG.sites[n].evidence[i])
    }
  }
  return all
}

// brigadier SuggestionProvider — TAB completes configured site names so an
// admin never has to remember them (site <nume> ... / site remove <nume> /
// denyhere|pick door [site]).
function cpSiteSuggest(ctx, builder) {
  try {
    for (var s in CP_CFG.sites) {
      builder.suggest(s)
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// Jail-register names for release/record — read from the prison service's
// persistent register (custody lives in straja_prison.js; this file only
// delegates to it).
function cpJailRegister(ctx) {
  try {
    var raw = String(ctx.source.server.persistentData.getString('strajaPrisonJail') || '')
    if (raw.length > 2) {
      var saved = JSON.parse(raw)
      if (saved.jailed !== undefined) return saved.jailed
    }
  } catch (e) { /* suggestions are best-effort */ }
  return {}
}

function cpInCustody(player) {
  try { return player.persistentData.getBoolean('cpJailed') } catch (e) { return false }
}

function cpJailedSuggest(ctx, builder) {
  try {
    for (var s in cpJailRegister(ctx)) {
      builder.suggest(s)
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// Ban-list names for unban.
function cpBannedSuggest(ctx, builder) {
  try {
    for (var s in CP_CFG.banned) {
      builder.suggest(s)
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// Online player names for ban — bans work on offline names too, but the
// common case is the player standing at the gate.
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
function cpExemptSuggest(ctx, builder) {
  try {
    for (var k in CP_CFG.exempt) {
      builder.suggest(k)
    }
  } catch (e) { /* suggestions are best-effort */ }
  return builder.buildFuture()
}

// The site a config command applies to: the explicit name when given, else
// the nearest site to the running player (null when nowhere near any).
function cpSiteScope(ctx, siteName) {
  if (siteName !== null && siteName !== undefined && String(siteName).length > 0) {
    return cpSiteEnsure(String(siteName))
  }
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    return null
  }
  return cpSiteNearest(ctx.source.server, p)
}

// ============================================================================
// Setup wizard — reads live config and prints what is missing, with the next
// command to run as a clickable chat link (plain text fallback).
// ============================================================================

// One wizard line: green ✓ when done; red ✗ + a runnable hint when missing.
// Returns 0 when satisfied, 1 when missing (so callers can count gaps).
function cpWizardStep(ctx, ok, label, cmd) {
  if (ok) {
    ctx.source.sendSystemMessage(Text.literal('  §a✓ §f' + label))
    return 0
  }
  if (cmd === null || cmd === undefined) {
    ctx.source.sendSystemMessage(Text.literal('  §c✗ §f' + label))
    return 1
  }
  var link = Text.literal('§b§n/' + cmd)
  try {
    link = link.clickRunCommand('/' + cmd)
  } catch (e) { /* underlined text fallback — still copyable */ }
  ctx.source.sendSystemMessage(
    Text.literal('  §c✗ §f' + label + ' §8→ §eurmează: ').append(link))
  return 1
}

// Manual step the wizard cannot detect (command blocks, smoke test).
function cpWizardNote(ctx, label) {
  ctx.source.sendSystemMessage(Text.literal('  §6• §7' + label))
}

// Per-site completeness block shared by `setup` and `setup <site>`.
// Returns the number of missing pieces for that site.
function cpWizardSite(ctx, site) {
  var missing = 0
  ctx.source.sendSystemMessage(Text.literal('§b  » §f' + site.name + '§7:'))
  missing += cpWizardStep(ctx,
    site.denyTarget !== null && site.denyTarget !== undefined,
    'punct de respingere — stai în poziția de împingere înapoi',
    'strajacheckpoint site ' + site.name + ' denyhere')
  missing += cpWizardStep(ctx, site.doors.length > 0,
    'uși de fier urmărite (' + site.doors.length + ') — se închid la deny',
    'strajacheckpoint site ' + site.name + ' pick door')
  missing += cpWizardStep(ctx, site.evidence.length > 0,
    'cufere de probe (' + site.evidence.length + ') — se umplu în ordine',
    'strajacheckpoint site ' + site.name + ' pick evidence')
  // optional layers — reported as notes, not missing pieces
  var bits = []
  if (site.gates !== undefined && site.gates.length > 0) bits.push(site.gates.length + ' porți un-sens')
  if (site.board !== null && site.board !== undefined) bits.push('zonă îmbarcare')
  if (site.link !== null && site.link !== undefined) bits.push('legat ↔ ' + site.link)
  var ncb = 0
  for (var ck in (site.cb || {})) { ncb++ }
  if (ncb > 0) bits.push(ncb + ' reguli contraband locale')
  var nex = 0
  for (var ex in (site.exempt || {})) { nex++ }
  if (nex > 0) bits.push(nex + ' scutiți locali')
  if (bits.length > 0) {
    ctx.source.sendSystemMessage(Text.literal('§7    (extra: ' + bits.join(' · ') + ')'))
  } else {
    ctx.source.sendSystemMessage(Text.literal('§7    (opțional: §fsite ' + site.name + ' pick gate§7 — benzi un-sens · §fpick board§7 — îmbarcare bărci · §flink§7 · §fcb/exempt§7 — reguli locale. §bhelp benzi|vapoare§7)'))
  }
  return missing
}

function cpCfgSave(server) {
  server.persistentData.putString('portCheckpointCfg', JSON.stringify(CP_CFG))
}

// kubejs reload re-executes this file but does NOT re-fire ServerEvents.loaded —
// self-heal config + jail register from persistentData on the first tick
var CP_CFG_DIRTY = true

var cpJailSweepTicks = 0

// Border scans only — custody enforcement (adventure-on-jailed, fugitive
// flagging, sweeps) belongs to straja_prison.js.
ServerEvents.tick(function (event) {
  if (CP_CFG_DIRTY) {
    cpCfgLoad(event.server)
    CP_CFG_DIRTY = false
  }
  cpJailSweepTicks++
  if (cpJailSweepTicks % 5 === 0) {
    cpGateScan(event.server)
    cpBoardScan(event.server)
  }
})

// Gate-crossing state is per-session — drop it on login so a stale prev-pos
// can't phantom-cross a lane after relog.
PlayerEvents.loggedIn(function (event) {
  var name = cpPlayerName(event.player)
  if (cpGatePrev[name] !== undefined) delete cpGatePrev[name]
})

function cpPickMode(player) {
  return String(player.persistentData.getString('cpPick') || '')
}

function cpSetPick(player, mode) {
  player.persistentData.putString('cpPick', mode)
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
  if (ent === null || ent === undefined || !(ent instanceof $CP_Player)) {
    return null
  }
  return ent
}

// Messages (Romanian, § colour codes)
const CP_AGGRO_TITLE = '§4§lSTOP! MARFĂ ILEGALĂ!'
const CP_AGGRO_SUBTITLE = '§cAi încercat să treci punctul de control cu marfă interzisă!'
const CP_INFO_HEADER = '§cMarfă ilegală detectată în bagaj:'
const CP_INFO_FOOTER = '§eLasă marfa interzisă în urmă sau pred-o — nu treci cu ea peste hotar.'
const CP_INFO_CLEAN = '§aVerificare încheiată — nu ai nimic ilegal. Treci liber.'
const CP_DENY_TITLE = '§4§lACCES INTERZIS'
const CP_DENY_SUBTITLE = '§cPunctul de control nu te lasă să treci cu marfă ilegală.'
const CP_DENY_SOUND = 'minecraft:block.iron_door.close'
const CP_AGGRO_SOUND = 'minecraft:entity.ravager.roar'

const CP_BANNED_SUBTITLE = '§cEști interzis la acest punct de control.'
const CP_WARN_TITLE = '§e§lMARFA E INTERZISĂ'
const CP_WARN_SUBTITLE = '§eLas-o în cufărul de lângă poartă — la punctul următor riști arestarea.'
const CP_WARN_SOUND = 'minecraft:block.note_block.bass'
const CP_ARREST_TITLE = '§4§lAI FOST ARESTAT'
const CP_ARREST_SUBTITLE = '§cPentru contraband. Bunurile suspecte au fost reținute.'
const CP_FREE_TITLE = '§a§lEȘTI LIBER'
const CP_FREE_SUBTITLE = '§7Numele ți-a fost șters. Nu te mai întoarce cu contrabandă.'

// ============================================================================
// Jail register — server-side roster, works while the player is offline.
// persistentData 'portCheckpointJail': {
//   jailed: { name: { t, reason, items:{id:{count,name}}, confiscated, status,
//                     arrests } },           // status: 'jailed' | 'fugitive'
//   fines:  { name: totalFine }
// }
// ============================================================================
function cpIsBanned(name) {
  var lower = String(name).toLowerCase()
  for (var k in CP_CFG.banned) {
    if (k.toLowerCase() === lower) {
      return true
    }
  }
  return false
}

// ============================================================================
// Border log — JSON file (JsonIO; java.nio is blocked) + console mirror.
// Every gate pass writes: { t, iso, event, name, inv } where event is one of
// in|out|warned|denied|arrested|escaped|recaptured|released|died.
// ============================================================================
function cpLogEvent(event, name, inv, detail) {
  var iso = ''
  try {
    iso = new Date().toISOString().replace('T', ' ').substring(0, 19)
  } catch (e) {
    iso = String(Date.now())
  }
  console.info('[BorderLog] ' + event + ' ' + name + ' | ' + inv + (detail ? ' | ' + detail : ''))
  try {
    var log = JsonIO.read(CP_LOG_FILE)
    if (log === null || log === undefined || log.events === undefined || log.events.length === undefined) {
      log = { events: [] }
    }
    log.events.push({ t: Date.now(), iso: iso, event: event, name: name, inv: inv, detail: detail || '' })
    while (log.events.length > CP_LOG_MAX) {
      log.events.shift()
    }
    JsonIO.write(CP_LOG_FILE, log)
  } catch (e) {
    console.error('[Checkpoint] border log write failed: ' + e)
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
function cpIsExempt(player, site) {
  var mode = cpGameModeName(player)
  if (cpIsExemptListed(cpPlayerName(player)) || (mode !== 'survival' && mode !== 'adventure')) {
    return true
  }
  // site-local exemption — the ferryman is unchecked at HIS border only
  if (site !== null && site !== undefined && site.exempt !== undefined) {
    var lower = String(cpPlayerName(player)).toLowerCase()
    for (var k in site.exempt) {
      if (k.toLowerCase() === lower) {
        return true
      }
    }
  }
  return false
}

function cpIsExemptListed(name) {
  var lower = String(name).toLowerCase()
  for (var k in CP_CFG.exempt) {
    if (k.toLowerCase() === lower) {
      return true
    }
  }
  return false
}

function cpItemId(stack) {
  try {
    return String($CP_Registries.ITEM.getKey(stack.getItem()))
  } catch (e) {
    return String(stack.getItem())
  }
}

// Direct-API gamemode helpers (same idiom as petty_admin.js).
const CP_MODE_NAMES = {
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
    player.setGameMode($CP_GameType.valueOf(CP_MODE_NAMES[mode] || 'ADVENTURE'))
    return true
  } catch (e) {
    console.error('[Checkpoint] setGameMode(' + mode + ') failed for ' + cpPlayerName(player) + ' :: ' + e)
    return false
  }
}

// Force-closes a site's configured doors — shared by deny/wrong-way flows.
function cpCloseDoors(server, site) {
  var doors = site !== null && site !== undefined ? site.doors : []
  doors.forEach(function (door) {
    try {
      var level = server.getLevel(door.dim)
      if (level === null || level === undefined) {
        return
      }
      for (var dy = 0; dy <= 1; dy++) {
        var block = level.getBlock(door.x, door.y + dy, door.z)
        if (String(block.id) === 'minecraft:iron_door') {
          var props = block.properties
          props.open = 'false'
          props.powered = 'false'
          block.set('minecraft:iron_door', props)
        }
      }
    } catch (e) {
      console.error('[Checkpoint] could not close door at ' + door.x + ' ' + door.y + ' ' + door.z + ' :: ' + e)
    }
  })
}

// Teleports the player back to the site's deny point (off the plate -> doors
// shut) and force-closes that site's doors. Shared by deny/banned flows.
function cpPushBack(server, player, site) {
  var t = site !== null && site !== undefined ? site.denyTarget : null
  if (t !== null && t !== undefined) {
    var yaw = t.yaw === undefined ? 0 : t.yaw
    server.runCommandSilent(
      'execute in ' + t.dim + ' run tp ' + cpQuoted(player) +
      ' ' + t.x + ' ' + t.y + ' ' + t.z + ' ' + yaw + ' 0'
    )
  }
  cpCloseDoors(server, site)
}

// ============================================================================
// Subinventory traversal — smugglers hide contraband inside container items
// ============================================================================
//
// Yields the contents of a stack when it is a container:
//   * vanilla `minecraft:container` component  (shulker boxes, chests-in-items)
//   * vanilla `minecraft:bundle_contents`      (bundles)
//   * NeoForge ItemHandler capability          (Backpacked/Sophisticated/etc.)
// Components are tried first; the capability is only consulted when no
// component yielded contents, otherwise the same contents get counted twice.
function cpSubStacks(stack) {
  var out = []
  if (stack === null || stack.isEmpty()) {
    return out
  }
  try {
    var cont = stack.get($CP_DataComponents.CONTAINER)
    if (cont !== null && cont !== undefined) {
      var it = cont.nonEmptyItems().iterator()
      while (it.hasNext()) {
        out.push(it.next())
      }
    }
  } catch (e) { /* no container component */ }
  try {
    var bundle = stack.get($CP_DataComponents.BUNDLE_CONTENTS)
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
    var cap = stack.getCapability($CP_Capabilities.ItemHandler.ITEM)
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
  if (tag instanceof $CP_CompoundTag) {
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
      if (id.length > 0 && ct >= 1 && ct <= 6 && CP_CFG.contraband[id]) {
        hits[id] = (hits[id] || 0) + tag.getInt(ckey)
      }
    } catch (e) { /* odd compound — its children may still hold items */ }
    var keys = tag.getAllKeys().iterator()
    while (keys.hasNext()) {
      cpScanTagForContraband(tag.get(keys.next()), hits, depth + 1)
    }
    return
  }
  if (tag instanceof $CP_ListTag) {
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
    if (root === null || !(root instanceof $CP_CompoundTag)) {
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
  return CP_CFG.contraband[id] === true
}

function cpIsAuthorizedInspector(player) {
  if (!player) return false
  try {
    if (typeof player.hasPermissions === 'function' && player.hasPermissions(2)) return true
    if (typeof player.hasPermission === 'function' && player.hasPermission(2)) return true
  } catch (e) {}
  try {
    var tags = player.tags
    if (tags && (tags.contains('inspector') || tags.contains('gunsmith') || tags.contains('armurier'))) return true
  } catch (e) {}
  try {
    var pd = player.persistentData
    if (pd && (pd.getBoolean('is_inspector') || pd.getBoolean('is_gunsmith'))) return true
  } catch (e) {}
  try {
    var server = player.getServer ? player.getServer() : player.server
    if (server && server.persistentData) {
      var raw = String(server.persistentData.getString('StrajaInspectors') || '')
      if (raw.length > 2) {
        var list = JSON.parse(raw)
        var pName = String(player.username || (player.getName && player.getName().getString()) || '').toLowerCase()
        if (list.some(function(n) { return String(n).toLowerCase() === pName })) return true
      }
    }
  } catch (e) {}
  return false
}

function cpIsWeaponsTransporter(player) {
  if (!player) return false
  if (cpIsAuthorizedInspector(player)) return true
  try {
    var tags = player.tags
    if (tags && (tags.contains('transporter') || tags.contains('weapon_transporter') || tags.contains('transportator_arme'))) return true
  } catch (e) {}
  try {
    var pd = player.persistentData
    if (pd && pd.getBoolean('is_transporter')) return true
  } catch (e) {}
  try {
    var server = player.getServer ? player.getServer() : player.server
    if (server && server.persistentData) {
      var raw = String(server.persistentData.getString('StrajaTransporters') || '')
      if (raw.length > 2) {
        var list = JSON.parse(raw)
        var pName = String(player.username || (player.getName && player.getName().getString()) || '').toLowerCase()
        if (list.some(function(n) { return String(n).toLowerCase() === pName })) return true
      }
    }
  } catch (e) {}
  try {
    var inv = player.getInventory ? player.getInventory() : player.inventory
    if (inv) {
      var size = inv.getContainerSize ? inv.getContainerSize() : (inv.size || 36)
      for (var i = 0; i < size; i++) {
        var st = inv.getItem(i)
        if (st && !st.isEmpty() && String(st.id).indexOf('crate_flintlock_service_pack') !== -1) {
          return true
        }
      }
    }
  } catch (e) {}
  return false
}

function cpEvaluateWeaponContraband(stack, player) {
  if (!stack || stack.isEmpty()) return null
  if (cpIsWeaponsTransporter(player)) return null // Exempt!

  var isProofed = false
  var isDefaced = false
  var isForged = false
  var forgeryTier = 0
  var serial = ''
  try {
    var tag = stack.get('minecraft:custom_data')
    if (tag && typeof tag.copyTag === 'function') tag = tag.copyTag()
    if (tag) {
      if (typeof tag.getBoolean === 'function') {
        isProofed = tag.getBoolean('Proofed')
        isDefaced = tag.getBoolean('Defaced')
        isForged = tag.getBoolean('Forged')
        forgeryTier = tag.getInt('ForgeryTier') || tag.getByte('ForgeryTier')
        serial = String(tag.getString('Serial') || tag.getString('GunSerial') || '')
      } else {
        isProofed = !!tag.Proofed
        isDefaced = !!tag.Defaced
        isForged = !!tag.Forged
        forgeryTier = Number(tag.ForgeryTier || 0)
        serial = String(tag.Serial || tag.GunSerial || '')
      }
    }
  } catch (e) {}

  if (isDefaced) {
    return { key: 'contraband_defaced_gun', name: 'Armă de contrabandă cu seria pilită (Piața Neagră)' }
  }
  if (!isProofed && !isForged && (!serial || serial.length === 0)) {
    return { key: 'contraband_unmarked_gun', name: 'Armă de foc nemarcată / neînregistrată' }
  }
  if (forgeryTier === 3 || (isForged && forgeryTier >= 3)) {
    return { key: 'contraband_tier3_gun', name: 'Armă falsificată grosolan (Nivel 3 / Tinichea)' }
  }
  return null
}

function cpScanContraband(player, site) {
  var found = {}
  var level = null
  try {
    level = player.level
  } catch (e) { /* unreachable */ }

  function note(stack) {
    var id = cpItemId(stack)

    // Check firearm contraband via Straja Weapons Law
    if (id === 'tacz:modern_kinetic_gun') {
      var wCheck = cpEvaluateWeaponContraband(stack, player)
      if (wCheck !== null) {
        var entry = found[wCheck.key]
        if (entry === undefined) {
          entry = { count: 0, name: wCheck.name }
          found[wCheck.key] = entry
        }
        entry.count += stack.getCount()
        return
      }
    }

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
    var opt = $CP_CuriosApi.getCuriosInventory(player)
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
    return $CP_EntityArgument.getPlayer(ctx, 'player')
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
function cpAggressive(ctx) {
  var player = cpResolvePlayer(ctx)
  var cps = cpSiteNearest(ctx.source.server, player)
  if (player === null || cpIsExempt(player, cps)) {
    return 0
  }
  var found = cpScanContraband(player, cps)
  if (cpIsEmpty(found)) {
    return 0
  }
  var server = ctx.source.server
  cpTitle(server, player, CP_AGGRO_TITLE, CP_AGGRO_SUBTITLE)
  cpSound(server, player, CP_AGGRO_SOUND)
  try {
    // Wall-clock expiry: Level.getGameTime() is unreachable from the KubeJS
    // wrapper and server.getTickCount() resets every boot, which would leave
    // a persisted bounty active for days after a restart. Epoch millis are
    // already the convention here (strajaPrisonLootJobs' t, strajaPrisonLootDone).
    var until = Date.now() + CP_WANTED_SECONDS * 1000
    player.persistentData.putLong('strajaWantedUntil', until)
  } catch (e) {
    console.error('[Checkpoint] could not set wanted flag: ' + e)
  }
  console.info('[Checkpoint] ' + cpPlayerName(player) + ' tried to smuggle contraband (aggressive)')
  return 1
}

// info: lists the contraband found, or confirms a clean inventory
function cpInfo(ctx) {
  var player = cpResolvePlayer(ctx)
  var cps = cpSiteNearest(ctx.source.server, player)
  if (player === null || cpIsExempt(player, cps)) {
    return 0
  }
  var found = cpScanContraband(player, cps)
  var server = ctx.source.server
  if (cpIsEmpty(found)) {
    if (CP_INFO_CONFIRM_CLEAN) {
      player.tell(Text.literal(CP_INFO_CLEAN))
    }
    return 0
  }
  player.tell(Text.literal(CP_INFO_HEADER))
  for (var id in found) {
    var entry = found[id]
    player.tell(Text.literal('§7- §f' + entry.count + 'x ' + entry.name + ' §8(' + id + ')'))
  }
  player.tell(Text.literal(CP_INFO_FOOTER))
  console.info('[Checkpoint] ' + cpPlayerName(player) + ' checkpoint scan (info)')
  return 1
}

// deny: cancels the passage — teleports the player off the plate and
// optionally force-closes configured doors
function cpDeny(ctx) {
  var player = cpResolvePlayer(ctx)
  var cps = cpSiteNearest(ctx.source.server, player)
  if (player === null || cpIsExempt(player, cps)) {
    return 0
  }
  var found = cpScanContraband(player, cps)
  if (cpIsEmpty(found)) {
    return 0
  }
  var server = ctx.source.server
  cpTitle(server, player, CP_DENY_TITLE, CP_DENY_SUBTITLE)
  cpSound(server, player, CP_DENY_SOUND)
  cpPushBack(server, player, cpSiteNearest(server, player))

  console.info('[Checkpoint] ' + cpPlayerName(player) + ' denied passage (contraband)')
  return 1
}

// ============================================================================
// Two-stage crossing + jail
// ============================================================================

// Custody handoff: the checkpoint decides WHO gets arrested and WHY; the
// actual confinement (cells, personal chests, seizure, release) is the
// strajaprison service's job. Any system can arrest through the same
// command — reason rides as free text.
function cpDelegateArrest(server, player, name, reason, site) {
  // site context is resolved inside the prison (nearest site = evidence
  // routing + release point); reason is free text for the register
  server.runCommandSilent('strajaprison arrest ' + name + ' ' + reason)
}

// inspect — stage 1 (first plate/door set). Banned players are pushed back;
// fugitives are arrested on sight; contraband carriers pass but are warned to
// drop it in the chest; clean players pass quietly.
function cpInspect(ctx) {
  var player = cpResolvePlayer(ctx)
  var server = ctx.source.server
  var site = cpSiteNearest(server, player)
  if (player === null || cpIsExempt(player, site)) {
    return 0
  }
  var name = cpPlayerName(player)
  var at = site !== null ? ' | punct=' + site.name : ''

  var inv = cpInvSummary(player)

  if (cpIsBanned(name)) {
    cpTitle(server, player, CP_DENY_TITLE, CP_BANNED_SUBTITLE)
    cpSound(server, player, CP_DENY_SOUND)
    cpPushBack(server, player, site)
    cpLogEvent('denied', name, inv, 'interzis (ban)' + at)
    console.info('[Checkpoint] ' + name + ' pushed back (banned)' + at)
    return 1
  }

  if (cpInCustody(player)) {
    cpDelegateArrest(server, player, name, 'fugitiv prins la punctul de control', site)
    console.info('[Checkpoint] ' + name + ' re-arrested at stage 1 (fugitive)' + at)
    return 1
  }

  var found = cpScanContraband(player, site)
  if (cpIsEmpty(found)) {
    cpLogEvent('in', name, inv, 'curat' + at)
    if (CP_INFO_CONFIRM_CLEAN) {
      player.tell(Text.literal(CP_INFO_CLEAN))
    }
    return 0
  }

  cpLogEvent('warned', name, inv, 'contraband la etapa 1' + at)
  cpTitle(server, player, CP_WARN_TITLE, CP_WARN_SUBTITLE)
  cpSound(server, player, CP_WARN_SOUND)
  player.tell(Text.literal(CP_INFO_HEADER))
  for (var id in found) {
    var entry = found[id]
    player.tell(Text.literal('§7- §f' + entry.count + 'x ' + entry.name + ' §8(' + id + ')'))
  }
  player.tell(Text.literal('§eLasă marfa în cufărul de lângă poartă acum — la al doilea punct vii direct la arest.'))
  console.info('[Checkpoint] ' + name + ' warned at stage 1 (contraband present)')
  return 1
}

// True when the stack itself is contraband or hides contraband inside
// (container components, bundles, item-handler capability, NBT fallback).
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
function cpPosEq(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b
  }
  return a.dim === b.dim && a.x === b.x && a.y === b.y && a.z === b.z
}

// Hunt flags written by other systems (straja_gold thief/wanted, prison
// fugitive) — the checkpoint reads them to decide arrest reasons; clearing
// them is the prison service's job on arrest/release.
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
function cpArrest(ctx) {
  var player = cpResolvePlayer(ctx)
  if (player === null || player === undefined) {
    return 0
  }
  var server = ctx.source.server
  var site = cpSiteNearest(server, player)
  if (cpIsExempt(player, site)) {
    return 0
  }
  var name = cpPlayerName(player)
  var at = site !== null ? ' | punct=' + site.name : ''
  var banned = cpIsBanned(name)
  var found = cpScanContraband(player, site)
  var inJail = cpInCustody(player)
  var hunted = cpIsHunted(player) // thief / wanted / fugitive flags live here
  if (!banned && !inJail && !hunted && cpIsEmpty(found)) {
    cpLogEvent('out', name, cpInvSummary(player), 'curat — a trecut frontiera' + at)
    return 0
  }
  var reason = inJail
    ? 'fugitiv prins la punctul de control'
    : (hunted ? 'vânat de Straja prins la frontieră'
      : (banned ? 'interdicție la punctul de control (ban activ)' : 'marfă interzisă la frontieră'))

  cpDelegateArrest(server, player, name, reason, site)
  return 1
}

// release <name> [fine] — jailer gate lives here too (defense in depth: both
// the checkpoint alias and the prison service enforce it); the actual release
// — chest pour, gamemode restore, register cleanup — happens in strajaprison.
function cpReleaseAlias(ctx, name, fine) {
  var src = cpCmdSourcePlayer(ctx)
  if (src !== null && CP_JAILERS.indexOf(cpPlayerName(src)) < 0) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] numai ' + CP_JAILERS.join('/') + ' poate elibera prizonieri.'))
    return 0
  }
  ctx.source.server.runCommandSilent('strajaprison release ' + name + ' ' + fine)
  ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] release delegat la strajaprison pentru ' + name + '.'))
  return 1
}


// Custody commands moved to the prison service — these aliases stay so admin
// muscle memory still lands somewhere useful.
function cpCmdPrisonMoved(ctx, cmd) {
  ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] custodia e gestionată de §bstrajaprison§7 — folosește `strajaprison ' + cmd + '`.'))
  return 1
}

function cpCmdJailed(ctx) { return cpCmdPrisonMoved(ctx, 'jailed') }
function cpCmdRecord(ctx, name) { return cpCmdPrisonMoved(ctx, 'record ' + name) }
function cpCmdPChests(ctx) { return cpCmdPrisonMoved(ctx, 'pchests') }
function cpCmdJCells(ctx) { return cpCmdPrisonMoved(ctx, 'jcells') }
function cpCmdJailHere(ctx) { return cpCmdPrisonMoved(ctx, 'jailhere') }
function cpCmdCellHere(ctx) { return cpCmdPrisonMoved(ctx, 'cellhere') }

// ---- admin/config commands --------------------------------------------------

// strajacheckpoint denyhere [site] — the site's deny teleport target becomes
// where you stand. Without a name it binds to the nearest configured site.
function cpCmdDenyHere(ctx, siteName) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] denyhere must be run by a player.'))
    return 0
  }
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    p.tell(Text.literal('§c[Checkpoint] niciun checkpoint în apropiere — folosește `strajacheckpoint site <nume> denyhere`.'))
    return 0
  }
  var yaw = 0
  try {
    yaw = Math.round(Number(p.getYRot()))
  } catch (e) { /* getYRot not exposed on the KubeJS wrapper */ }
  site.denyTarget = {
    dim: String(p.level.dimension),
    x: Math.floor(p.x),
    y: Math.floor(p.y),
    z: Math.floor(p.z),
    yaw: yaw
  }
  cpCfgSave(ctx.source.server)
  p.tell(Text.literal('§a[Checkpoint] ' + site.name + ' deny target = ' + JSON.stringify(site.denyTarget)))
  return 1
}

function cpCmdPick(ctx, mode, siteName) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] pick must be run by a player.'))
    return 0
  }
  // repeat the same pick command to toggle the picker off
  var curCp = String(p.persistentData.getString('cpPick') || '')
  var curSp = String(p.persistentData.getString('spPick') || '')
  if ((mode === 'pchest' || mode === 'cell') && curSp === mode) {
    p.persistentData.putString('spPick', '')
    p.tell(Text.literal('§7[Checkpoint] picker off.'))
    return 1
  }
  if (mode !== 'off' && mode !== 'pchest' && mode !== 'cell' && curCp === mode) {
    cpSetPick(p, '')
    p.tell(Text.literal('§7[Checkpoint] picker off.'))
    return 1
  }
  var site = null
  if (mode !== 'off' && mode !== 'pchest' && mode !== 'cell') {
    site = cpSiteScope(ctx, siteName)
    if (site === null) {
      p.tell(Text.literal('§c[Checkpoint] niciun checkpoint în apropiere — folosește `strajacheckpoint site <nume> pick ' + mode + '`.'))
      return 0
    }
  }
  if (mode === 'pchest' || mode === 'cell') {
    // shared jail infrastructure lives in the prison service — forward the
    // pick mode through the spPick flag it reads
    p.persistentData.putString('spPick', mode)
    cpSetPick(p, '')
  } else {
    p.persistentData.putString('spPick', '')
    cpSetPick(p, mode === 'off' ? '' : mode)
  }
  p.persistentData.putString('cpPickSite', site !== null ? site.name : '')
  if (mode === 'off') {
    p.persistentData.putString('spPick', '')
    p.tell(Text.literal('§7[Checkpoint] picker off.'))
  } else if (mode === 'door') {
    p.tell(Text.literal('§b[Checkpoint] ' + site.name + ': click dreapta pe ușile de fier ale checkpoint-ului. `strajacheckpoint pick off` la final.'))
  } else if (mode === 'evidence') {
    p.tell(Text.literal('§b[Checkpoint] ' + site.name + ': click dreapta pe cuferele de probe — poți adăuga mai multe, revarsă în ordine. `strajacheckpoint pick off` la final.'))
  } else if (mode === 'pchest') {
    p.tell(Text.literal('§b[Prison] click dreapta pe fiecare cufăr personal — dublele se împerechează singure; un semn clickuit se leagă la ultimul cufăr. `strajaprison pick off` la final.'))
  } else if (mode === 'cell') {
    p.tell(Text.literal('§b[Prison] click dreapta pe podeaua fiecărei celule — un deținut per celulă; surplusul ajunge la punctul comun. `strajaprison pick off` la final.'))
  } else if (mode === 'gate') {
    p.tell(Text.literal('§b[Checkpoint] ' + site.name + ': POARTĂ — 1) click pe un capăt al liniei, 2) click pe celălalt capăt, 3) click pe partea DE UNDE VIN călătorii (sensul permis). Se repetă pentru fiecare bandă. `pick off` la final.'))
  } else if (mode === 'board') {
    p.tell(Text.literal('§b[Checkpoint] ' + site.name + ': ÎMBARCARE — click pe două colțuri opuse ale zonei de îmbarcare (ponton). Cine urcă într-o barcă înăuntru e controlat pe loc.'))
  }
  return 1
}

// site <nume> gates — list the site's one-way lanes
function cpCmdGates(ctx, siteName) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  if (site.gates.length === 0) {
    ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] ' + site.name +
      ': nicio poartă — `site ' + site.name + ' pick gate` (3 clickuri: capăt A, capăt B, partea de unde vin).'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] ' + site.name + ' — porți (' + site.gates.length + '):'))
  for (var i = 0; i < site.gates.length; i++) {
    var g = site.gates[i]
    ctx.source.sendSystemMessage(Text.literal('§7  #' + (i + 1) + ' (' + g.a.x + ',' + g.a.z +
      ')<->(' + g.b.x + ',' + g.b.z + ') §8dinspre (' + g.from.x + ',' + g.from.z + ') ' + g.dim))
  }
  return 1
}

// site <nume> gate del <i> — retire a gate (splices are safe: nothing stores gate indexes)
function cpCmdGateDel(ctx, siteName, idx) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  if (idx < 1 || idx > site.gates.length) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] poarta #' + idx + ' nu există la ' + site.name + '.'))
    return 0
  }
  site.gates.splice(idx - 1, 1)
  cpCfgSave(ctx.source.server)
  ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + site.name + ': poarta #' + idx + ' ștearsă.'))
  return 1
}

// site <nume> board off — clear the boarding zone
function cpCmdBoardClear(ctx, siteName) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  site.board = null
  cpCfgSave(ctx.source.server)
  ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + site.name + ': zona de îmbarcare ștearsă.'))
  return 1
}

// site <nume> link <other> — two-way link: a boarding stamp from either side
// counts as verified at the other's gates (island dock <-> continent gate)
function cpCmdLink(ctx, siteName, otherName) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut: ' + siteName))
    return 0
  }
  var other = cpSiteEnsure(otherName)
  if (other.name === site.name) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] un site nu se leagă cu el însuși.'))
    return 0
  }
  site.link = other.name
  other.link = site.name
  cpCfgSave(ctx.source.server)
  ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + site.name + ' <-> ' + other.name +
    ' legate: verificarea la îmbarcare de pe o parte validează trecerea pe cealaltă.'))
  return 1
}

function cpCmdUnlink(ctx, siteName) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  var other = site.link !== null ? CP_CFG.sites[site.link] : null
  site.link = null
  if (other !== null && other !== undefined && other.link === site.name) {
    other.link = null
  }
  cpCfgSave(ctx.source.server)
  ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + site.name + ': legătură desfăcută.'))
  return 1
}

// site <nume> cb add|allow|reset — localized contraband using the held item:
//   add   = extra ban at THIS border only
//   allow = globally-banned item permitted HERE (local exception)
//   reset = back to the global rule
// `site <nume> cb` lists the local rules.
function cpCmdCbLocal(ctx, siteName, action) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  if (action === 'list') {
    var ids = []
    for (var k in site.cb) {
      ids.push(k)
    }
    if (ids.length === 0) {
      ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] ' + site.name + ': fără reguli locale — se aplică lista globală.'))
      return 1
    }
    ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] ' + site.name + ' — reguli locale:'))
    ids.forEach(function (id) {
      ctx.source.sendSystemMessage(Text.literal('§7  ' + id + ' -> ' + (site.cb[id] ? '§cINTERZIS aici' : '§apermis aici')))
    })
    return 1
  }
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] trebuie rulat de un jucător (ține itemul în mână).'))
    return 0
  }
  var held = p.getMainHandItem()
  if (held.isEmpty()) {
    p.tell(Text.literal('§c[Checkpoint] ține itemul în mâna principală.'))
    return 0
  }
  var id = cpItemId(held)
  if (action === 'add') {
    site.cb[id] = true
    p.tell(Text.literal('§a[Checkpoint] ' + site.name + ': ' + id + ' INTERZIS aici.'))
  } else if (action === 'allow') {
    site.cb[id] = false
    p.tell(Text.literal('§a[Checkpoint] ' + site.name + ': ' + id + ' permis aici (excepție locală).'))
  } else {
    delete site.cb[id]
    p.tell(Text.literal('§a[Checkpoint] ' + site.name + ': ' + id + ' revine la regula globală.'))
  }
  cpCfgSave(ctx.source.server)
  return 1
}

// site <nume> exempt/unexempt <player> — site-local exemption (ferryman on
// that dock stays exempt there but is checked at every other border)
function cpCmdSiteExempt(ctx, siteName, playerName, add) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  if (add) {
    site.exempt[playerName] = true
    ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + playerName + ' scutit la ' + site.name + ' (doar aici).'))
  } else {
    delete site.exempt[playerName]
    ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + playerName + ' controlat din nou la ' + site.name + '.'))
  }
  cpCfgSave(ctx.source.server)
  return 1
}

function cpCmdSiteExempts(ctx, siteName) {
  var site = cpSiteScope(ctx, siteName)
  if (site === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] site necunoscut.'))
    return 0
  }
  var names = []
  for (var k in site.exempt) {
    names.push(k)
  }
  ctx.source.sendSystemMessage(Text.literal(names.length === 0
    ? '§7[Checkpoint] ' + site.name + ': nimeni scutit local.'
    : '§b[Checkpoint] ' + site.name + ' — scutiți locali (' + names.length + '): ' + names.join(', ')))
  return 1
}

// strajacheckpoint jailhere — the jail cell becomes where you stand
function cpCmdBan(ctx, name, add) {
  var server = ctx.source.server
  if (add) {
    CP_CFG.banned[name] = true
    cpCfgSave(server)
    ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + name + ' interzis la punctul de control — va fi respins la primul punct.'))
    console.info('[Checkpoint] banned ' + name)
  } else {
    var lower = name.toLowerCase()
    var removed = false
    for (var k in CP_CFG.banned) {
      if (k.toLowerCase() === lower) {
        delete CP_CFG.banned[k]
        removed = true
      }
    }
    if (removed) {
      cpCfgSave(server)
      ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + name + ' poate trece din nou.'))
      console.info('[Checkpoint] unbanned ' + name)
    } else {
      ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] ' + name + ' nu e pe lista de interziși.'))
    }
  }
  return 1
}

function cpCmdBans(ctx) {
  var names = []
  for (var k in CP_CFG.banned) {
    names.push(k)
  }
  if (names.length === 0) {
    ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] nimeni interzis.'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] interziși (' + names.length + '): ' + names.join(', ')))
  return 1
}

function cpCmdContraband(ctx, add) {
  var p = cpCmdSourcePlayer(ctx)
  if (p === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] must be run by a player.'))
    return 0
  }
  var held = p.getMainHandItem()
  if (held.isEmpty()) {
    p.tell(Text.literal('§c[Checkpoint] ține itemul în mâna principală.'))
    return 0
  }
  var id = cpItemId(held)
  if (add) {
    CP_CFG.contraband[id] = true
    p.tell(Text.literal('§a[Checkpoint] contraband +: ' + id))
  } else {
    delete CP_CFG.contraband[id]
    p.tell(Text.literal('§a[Checkpoint] contraband -: ' + id))
  }
  cpCfgSave(ctx.source.server)
  return 1
}

function cpCmdStatus(ctx) {
  var ids = []
  for (var k in CP_CFG.contraband) {
    ids.push(k)
  }
  var bans = []
  for (var b in CP_CFG.banned) {
    bans.push(b)
  }
  var jailed = 0
  for (var j in cpJailRegister(ctx)) {
    jailed++
  }
  var exempts = []
  for (var x in CP_CFG.exempt) {
    exempts.push(x)
  }
  var siteNames = []
  for (var s in CP_CFG.sites) {
    siteNames.push(s)
  }
  ctx.source.sendSystemMessage(
    Text.literal('§b[Checkpoint] site-uri=' + (siteNames.length ? siteNames.join(', ') : 'niciunul') +
      ' §8(custodie: strajaprison status)')
  )
  siteNames.forEach(function (sn) {
    var st = CP_CFG.sites[sn]
    ctx.source.sendSystemMessage(
      Text.literal('§7  - ' + sn + ': denyTarget=' + JSON.stringify(st.denyTarget) +
        ' uși=' + st.doors.length + ' cufere=' + st.evidence.length)
    )
  })
  ctx.source.sendSystemMessage(
    Text.literal('§b[Checkpoint] contraband=' + ids.join(', ') +
      ' banned=' + (bans.length ? bans.join(', ') : 'none') +
      ' jailed=' + jailed +
      ' exempt=' + (exempts.length ? exempts.join(', ') : 'none'))
  )
  return 1
}

function cpCmdSiteList(ctx) {
  var names = []
  for (var s in CP_CFG.sites) {
    names.push(s)
  }
  if (names.length === 0) {
    ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] niciun checkpoint configurat — `site add <nume>` apoi `site <nume> denyhere|pick ...`.'))
    return 1
  }
  ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] site-uri (' + names.length + '):'))
  names.forEach(function (sn) {
    var s = CP_CFG.sites[sn]
    var tags = []
    if (s.gates.length > 0) tags.push(s.gates.length + ' porți')
    if (s.board !== null && s.board !== undefined) tags.push('îmbarcare')
    if (s.link !== null && s.link !== undefined) tags.push('↔ ' + s.link)
    var loc = 0
    for (var k in s.cb) { loc++ }
    if (loc > 0) tags.push(loc + ' reguli locale')
    ctx.source.sendSystemMessage(Text.literal('§7  ' + sn + (tags.length > 0 ? ' §8(' + tags.join(' · ') + ')' : '')))
  })
  return 1
}

// strajacheckpoint exempt|unexempt — the only bypass beside gamemode:
// command-managed, persistent (CP_CFG.exempt)
function cpCmdExempt(ctx, name, add) {
  var server = ctx.source.server
  if (add) {
    CP_CFG.exempt[name] = true
    cpCfgSave(server)
    ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + name + ' scos de la control (exempt list) — nimic nu-l mai scanează.'))
    console.info('[Checkpoint] exempted ' + name)
  } else {
    var lower = name.toLowerCase()
    var removed = false
    for (var k in CP_CFG.exempt) {
      if (k.toLowerCase() === lower) {
        delete CP_CFG.exempt[k]
        removed = true
      }
    }
    if (removed) {
      cpCfgSave(server)
      ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + name + ' controlat din nou.'))
      console.info('[Checkpoint] unexempted ' + name)
    } else {
      ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] ' + name + ' nu e pe lista de scutiți.'))
    }
  }
  return 1
}

function cpCmdExempts(ctx) {
  var names = []
  for (var k in CP_CFG.exempt) {
    names.push(k)
  }
  ctx.source.sendSystemMessage(Text.literal(names.length === 0
    ? '§7[Checkpoint] nimeni scutit — orice survival/adventure e controlat (op-inclus).'
    : '§b[Checkpoint] scutiți (' + names.length + '): ' + names.join(', ')))
  return 1
}

// strajacheckpoint why <player> — verdict for every gate, live
function cpCmdWhy(ctx) {
  var t = cpResolvePlayer(ctx)
  if (t === null) {
    ctx.source.sendSystemMessage(Text.literal('§c[Checkpoint] why <player> — selectorul nu a rezolvat pe nimeni.'))
    return 0
  }
  var name = cpPlayerName(t)
  var mode = cpGameModeName(t)
  var listed = cpIsExemptListed(name)
  var ws = cpSiteNearest(ctx.source.server, t)
  var exempt = cpIsExempt(t, ws)
  var op = '?'
  try { op = String(t.hasPermissions(2)) } catch (e) {
    try { op = String(t.hasPermission(2)) } catch (e2) { op = 'n/a' }
  }
  var inJail = cpInCustody(t)
  var found = cpScanContraband(t, ws)
  var nFound = 0
  for (var k in found) {
    nFound += found[k].count
  }
  ctx.source.sendSystemMessage(Text.literal(
    '§b[Checkpoint] why ' + name + ': exempt=' + exempt +
    ' (list=' + listed + ' gamemode=' + mode + ' op=' + op + ')' +
    ' banned=' + cpIsBanned(name) +
    ' jailed=' + inJail + ' (detalii: strajaprison record ' + name + ')' +
    ' hunted=' + cpIsHunted(t) +
    ' contraband=' + nFound))
  var verdict = exempt
    ? 'SKIP — exempt (creative/spectator/list)'
    : ((cpIsEmpty(found) && !cpIsBanned(name) && !inJail) ? 'PASS — curat' : 'ARREST — flag/ban/contraband')
  ctx.source.sendSystemMessage(Text.literal('§7  verdict etapa 2 acum: ' + verdict))
  return 1
}

// strajacheckpoint pchests — list personal chest pairs + their occupants
function cpCmdSiteRemove(ctx, name) {
  if (CP_CFG.sites[name] === undefined) {
    ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] ' + name + ' nu e un checkpoint cunoscut.'))
    return 0
  }
  delete CP_CFG.sites[name]
  cpCfgSave(ctx.source.server)
  ctx.source.sendSystemMessage(Text.literal('§a[Checkpoint] ' + name + ' șters — uși/cufere/deny target eliberate.'))
  return 1
}

// strajacheckpoint setup [site] — guided checklist. Without a name it covers
// every configured site + shared settings; with a name it walks one gate.
// Everything missing prints the exact next command as a clickable link.
function cpCmdSetup(ctx, siteName) {
  var missing = 0
  ctx.source.sendSystemMessage(Text.literal('§b§l=== Configurare border Straja ==='))

  var names = []
  for (var s in CP_CFG.sites) {
    names.push(s)
  }

  if (siteName !== null && siteName !== undefined && String(siteName).length > 0) {
    var sn = String(siteName)
    // transient entry when the name is unknown — the checklist still shows
    // every missing step, without registering a ghost site into config
    var one = CP_CFG.sites[sn] !== undefined ? CP_CFG.sites[sn] : cpSiteNew(sn)
    missing += cpWizardSite(ctx, one)
  } else {
    if (names.length === 0) {
      ctx.source.sendSystemMessage(Text.literal('§7Niciun checkpoint încă. Primul pas creează unul direct:'))
      missing += cpWizardStep(ctx, false,
        'primul checkpoint — stai în poziția de respingere și rulează',
        'strajacheckpoint site intrare denyhere')
    } else {
      for (var i = 0; i < names.length; i++) {
        missing += cpWizardSite(ctx, CP_CFG.sites[names[i]])
      }
      cpWizardNote(ctx, 'al doilea post (ex. ieșirea): repetă aceiași pași cu §f/strajacheckpoint site iesire denyhere')
    }
  }

  ctx.source.sendSystemMessage(Text.literal('§b  » §farest — infrastructura de custodie e în strajaprison§7:'))
  cpWizardNote(ctx, 'celule + cufere personale + punct comun: rulează §f/strajaprison setup§7 — are propriul checklist (pick cell|pchest, cellhere, jailhere)')
  var cbCount = 0
  for (var cb in CP_CFG.contraband) {
    cbCount++
  }
  missing += cpWizardStep(ctx, cbCount > 0,
    'listă contraband (' + cbCount + ' id-uri) — ține itemul în mână',
    'strajacheckpoint addcontraband')

  cpWizardNote(ctx, 'plăci de presiune → command blocks (identice la fiecare poartă): §fetapa 1 = strajacheckpoint inspect @p§7, §fetapa 2 = strajacheckpoint arrest @p')
  cpWizardNote(ctx, 'proba: treci cu un gold_ingot — etapa 1 avertizează, etapa 2 arestează')

  if (missing === 0) {
    ctx.source.sendSystemMessage(Text.literal('§a§lGata — configurația e completă. §7Doar plăcile/command blocks mai rămân de legat manual.'))
  } else {
    ctx.source.sendSystemMessage(Text.literal('§e' + missing + ' punct(e) lipsesc — click pe comenzile de mai sus sau tastează-le.'))
  }
  return 1
}

// strajacheckpoint help [topic] — index by default; topic pages keep the
// one-liner index short while still covering every behavior.
const CP_HELP_TOPICS = ['setup', 'siteuri', 'arest', 'marfa', 'benzi', 'vapoare']

function cpHelpSuggest(ctx, builder) {
  for (var i = 0; i < CP_HELP_TOPICS.length; i++) {
    builder.suggest(CP_HELP_TOPICS[i])
  }
  return builder.buildFuture()
}

function cpCmdHelp(ctx, topic) {
  switch (String(topic)) {
    case 'setup':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Configurare (wizard) —'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint setup §7- checklist global: ce e gata, ce lipsește, cu link clickabil pentru fiecare pas'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint setup <nume> §7- același ghidaj pentru un singur post'))
      ctx.source.sendSystemMessage(Text.literal('§7Ordinea recomandată: §fsite <nume> denyhere§7 → §fpick evidence§7 → §fpick door§7 → §fpick cell§7 (click podelele celulelor) sau §fcellhere§7 → §fpick pchest§7 (click fiecare cufăr) → legi plăcile la command blocks.'))
      return 1
    case 'siteuri':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Posturi multiple —'))
      ctx.source.sendSystemMessage(Text.literal('§7Fiecare post are propriul §fdeny target§7, §fuși§7 și §fcufere de probe§7; celula, contrabandul, ban-urile și registrul sunt comune.'))
      ctx.source.sendSystemMessage(Text.literal('§binspect/arrest/deny §7aleg automat postul cel mai apropiat (24 blocuri de ancora) — command blocks identice la ambele porți.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> denyhere|pick door|pick evidence §7configurează/creează un post; §bsite list§7 enumeră; §bsite remove <nume>§7 șterge.'))
      ctx.source.sendSystemMessage(Text.literal('§bdenyhere|pick door|pick evidence [site] §7fără nume = postul cel mai apropiat de tine.'))
      return 1
    case 'arest':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Arest, fugitivi, eliberare —'))
      ctx.source.sendSystemMessage(Text.literal('§7Etapa 2 cu contraband/ban/fugitiv/vânat → fade + celulă (proprie sau punct comun) + adventure + proces-verbal; TOT inventarul → cufărul personal al deținutului (semn cu numele); contrabanda → grămada de probe.'))
      ctx.source.sendSystemMessage(Text.literal('§7Pleci din rază → §cfugitiv§7 (rep Straja 0, garda atacă); revii → recapturat; mori (în celulă SAU în fugă ca vânat) → itemele confiscate + celula la respawn.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint release <nume> [amendă] §7- doar ' + CP_JAILERS.join('/') + '; teleportează la poarta care l-a arestat și șterge numele.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint jailed|record <nume> §7- registru; la login jailerul e alertat dacă sunt prizonieri.'))
      return 1
    case 'marfa':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Contraband și ban-uri —'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint addcontraband|delcontraband §7- itemul din mâna principală în/din listă; §bcontraband §7- lista.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint ban|unban <nume>|bans §7- jucător interzis → respins cu pushback la orice poartă.'))
      ctx.source.sendSystemMessage(Text.literal('§7Etapa 1: curat → trece · contraband → avertisment + lasă marfa în cufăr · ban → deny. Etapa 2: orice problemă → arest.'))
      return 1
    case 'benzi':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Benzi cu sens unic (porți) —'))
      ctx.source.sendSystemMessage(Text.literal('§7Exploit-ul „prietenul deschide ușile" se oprește la linia porții, nu la placă: cine traversează banda în sensul greșit e teleportat înapoi pe partea din care a venit + ușile se închid.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> pick gate §7- apoi 3 clickuri: capăt A, capăt B al liniei, și un bloc DE PE PARTEA DE UNDE VIN călătorii.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> gates §7- listează; §bsite <nume> gate del <i>§7 șterge. Repetă pick gate pentru fiecare bandă (intrare + ieșire = 2 porți cu sensuri opuse).'))
      ctx.source.sendSystemMessage(Text.literal('§7Poarta nu înlocuiește plăcile — inspect/arrest rulează tot prin ele. Poarta e doar gardianul de sens.'))
      return 1
    case 'vapoare':
      ctx.source.sendSystemMessage(Text.literal('§b§l— Feribot: îmbarcare + site-uri legate —'))
      ctx.source.sendSystemMessage(Text.literal('§7Pentru insulă↔continent: controlul se face la URarea în barcă — cine sare pe drum și înoată la mal fără ștampila e prins la poarta legată.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <doc> pick board §7- 2 clickuri pe colțurile opuse ale pontonului; cine urcă în barcă înăuntru e verificat pe loc (contraband → arest la doc).'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <doc> link <mal> §7- leagă ambele site-uri: curat la îmbarcare = ștampilă 20 min → trece poarta site-ului legat fără re-verificare; §bunlink§7 desface.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> cb add|allow|reset §7- reguli de contraband LOCALE cu itemul din mână (interzis aici / permis aici); §bcb §7le listează.'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> exempt|unexempt|exempts <juc> §7- scutiri locale (ferryman-ul e scutit la docul lui, controlat în rest).'))
      return 1
    default:
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint inspect|arrest <player> §7- platele 1 și 2 (command block)'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint setup [site] §7- ghidaj pas-cu-pas cu linkuri clickabile'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <nume> denyhere|pick door|pick evidence §7- punct de control (intrare/ieșire)'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint ban|unban <nume>|bans §7- interdicții; §brelease <nume> [amendă] §7- doar ' + CP_JAILERS.join('/')))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint jailed|record <nume>|pchests|jcells|status §7- registru și configurare'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint why <player> §7- verdictul porților pt. un jucător; §bexempt|unexempt|exempts §7- scutiri'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint site <n> pick gate|board|link|cb|exempt §7- benzi un-sens, îmbarcare bărci, site-uri legate, reguli locale — §bhelp benzi|vapoare'))
      ctx.source.sendSystemMessage(Text.literal('§b/strajacheckpoint denyhere|jailhere|cellhere|pick door|evidence|pchest|cell|off|addcontraband|delcontraband|resetcfg'))
      ctx.source.sendSystemMessage(Text.literal('§7Detalii: §b/strajacheckpoint help §7<§b' + CP_HELP_TOPICS.join('§7|§b') + '§7>'))
      return 1
  }
}

function cpCmdResetCfg(ctx) {
  var server = ctx.source.server
  server.persistentData.remove('portCheckpointCfg')
  cpCfgLoad(server)
  ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] config reset to the port_checkpoint.js file constants.'))
  return 1
}

// pickers: armed via `strajacheckpoint pick door|evidence` — right-click
// iron doors to watch, or a container block to mark as the evidence chest
BlockEvents.rightClicked(event => {
  var player = event.player
  if (player === null || player === undefined || !(player instanceof $CP_Player)) {
    return
  }
  var mode = cpPickMode(player)
  if (mode !== 'door' && mode !== 'evidence' && mode !== 'pchest' && mode !== 'cell' &&
      mode !== 'gate' && mode !== 'board') {
    return
  }
  if (String(event.hand).toLowerCase().indexOf('off') >= 0) {
    return // ignore offhand echo
  }

  // gate picker — site-bound, three clicks per lane:
  //   1) one end of the crossing line, 2) the other end,
  //   3) a block on the side travelers legitimately COME FROM.
  // Wrong-way crossings get teleported to that from-point + doors shut.
  if (mode === 'gate') {
    var gsiteName = ''
    try { gsiteName = player.persistentData.getString('cpPickSite') } catch (e0) { /* none */ }
    var gsite = gsiteName !== '' ? cpSiteEnsure(gsiteName) : null
    if (gsite === null) {
      player.tell(Text.literal('§c[Checkpoint] poarta trebuie legată de un site — `site <nume> pick gate`.'))
      event.cancel()
      return
    }
    var gpos = event.block.pos
    var gpt = {
      dim: String(event.level.dimension),
      x: gpos.getX(), y: gpos.getY(), z: gpos.getZ()
    }
    var gname = cpPlayerName(player)
    var draft = cpGateDraft[gname]
    if (draft === undefined) {
      draft = { site: gsite.name, a: null, b: null }
      cpGateDraft[gname] = draft
    }
    if (draft.site !== gsite.name) {
      draft = { site: gsite.name, a: null, b: null }
      cpGateDraft[gname] = draft
    }
    if (draft.a === null) {
      draft.a = { x: gpt.x, y: gpt.y, z: gpt.z }
      draft.dim = gpt.dim
      player.tell(Text.literal('§e[Checkpoint] capăt A = (' + gpt.x + ', ' + gpt.z + ') — click capătul B.'))
    } else if (draft.b === null) {
      draft.b = { x: gpt.x, y: gpt.y, z: gpt.z }
      player.tell(Text.literal('§e[Checkpoint] capăt B = (' + gpt.x + ', ' + gpt.z + ') — click pe partea DE UNDE VIN călătorii.'))
    } else {
      var ng = {
        dim: draft.dim,
        a: { x: draft.a.x, z: draft.a.z },
        b: { x: draft.b.x, z: draft.b.z },
        from: { x: gpt.x, y: gpt.y, z: gpt.z }
      }
      gsite.gates.push(ng)
      cpCfgSave(event.server)
      var sideWarn = cpGateSide(ng, gpt.x, gpt.z) === 0
        ? ' §c(ATENȚIE: punctul e exact pe linie — sens ambiguu, re-fă poarta cu un punct clar lateral)'
        : ''
      player.tell(Text.literal('§a[Checkpoint] ' + gsite.name + ': poarta #' + gsite.gates.length +
        ' înregistrată (' + draft.a.x + ',' + draft.a.z + ')<->(' + draft.b.x + ',' + draft.b.z +
        '), sens permis dinspre (' + gpt.x + ',' + gpt.z + ').' + sideWarn + ' Mai adaugă benzi sau `pick off`.'))
      draft.a = null
      draft.b = null
    }
    event.cancel()
    return
  }

  // board-zone picker — site-bound, two opposite corners of the dock
  if (mode === 'board') {
    var bsiteName = ''
    try { bsiteName = player.persistentData.getString('cpPickSite') } catch (e1) { /* none */ }
    var bsite = bsiteName !== '' ? cpSiteEnsure(bsiteName) : null
    if (bsite === null) {
      player.tell(Text.literal('§c[Checkpoint] zona de îmbarcare trebuie legată de un site — `site <nume> pick board`.'))
      event.cancel()
      return
    }
    var bpos = event.block.pos
    var bname = cpPlayerName(player)
    var bd = cpBoardDraft[bname]
    if (bd === undefined || bd.site !== bsite.name) {
      bd = { site: bsite.name, c1: null }
      cpBoardDraft[bname] = bd
    }
    if (bd.c1 === null) {
      bd.c1 = { x: bpos.getX(), y: bpos.getY(), z: bpos.getZ(), dim: String(event.level.dimension) }
      player.tell(Text.literal('§e[Checkpoint] colț 1 = (' + bd.c1.x + ', ' + bd.c1.z + ') — click colțul opus.'))
    } else {
      bsite.board = {
        dim: bd.c1.dim,
        x1: bd.c1.x, z1: bd.c1.z,
        x2: bpos.getX(), z2: bpos.getZ(),
        y: bpos.getY()
      }
      cpCfgSave(event.server)
      player.tell(Text.literal('§a[Checkpoint] ' + bsite.name + ': zonă de îmbarcare ' +
        '(' + bsite.board.x1 + ',' + bsite.board.z1 + ')<->(' + bsite.board.x2 + ',' + bsite.board.z2 +
        ') — cine urcă în barcă aici e controlat pe loc.'))
      bd.c1 = null
      cpSetPick(player, '')
    }
    event.cancel()
    return
  }

  var siteName = String(player.persistentData.getString('cpPickSite') || '')
  // lookup WITHOUT creating — a removed site's stale picker must not
  // resurrect it as an empty ghost entry
  var site = siteName.length > 0 && CP_CFG.sites[siteName] !== undefined
    ? CP_CFG.sites[siteName]
    : null
  if (site === null) {
    player.tell(Text.literal('§c[Checkpoint] picker fără checkpoint — reia cu `strajacheckpoint site <nume> pick ' + mode + '`.'))
    cpSetPick(player, '')
    return
  }

  var pos = event.block.pos
  var x = pos.getX()
  var y = pos.getY()
  var z = pos.getZ()
  var dim = String(event.level.dimension)

  if (mode === 'evidence') {
    var be = null
    try { be = event.block.entity } catch (e) { /* no block entity */ }
    if (be === null || be === undefined) {
      try { be = event.block.getEntity() } catch (e2) { /* still nothing */ }
    }
    var ok = false
    try {
      ok = be !== null && be !== undefined && be.getContainerSize() > 0
    } catch (e) { /* not a container */ }
    if (!ok) {
      player.tell(Text.literal('§c[Checkpoint] blocul ăsta nu are inventar — alege un cufăr/barrel/etc.'))
      event.cancel()
      return
    }
    var dup = site.evidence.some(function (c) {
      return c.dim === dim && c.x === x && c.y === y && c.z === z
    })
    if (dup) {
      player.tell(Text.literal('§7[Checkpoint] cufărul ăsta e deja în camera de probe a ' + site.name + '.'))
      event.cancel()
      return
    }
    site.evidence.push({ dim: dim, x: x, y: y, z: z })
    cpCfgSave(event.server)
    player.tell(Text.literal('§a[Checkpoint] ' + site.name + ' probă #' + site.evidence.length + ' = ' + x + ' ' + y + ' ' + z + ' — cuferele se umplu în ordine și revarsă în următorul.'))
    event.cancel() // last call — cancel() aborts the handler in this KubeJS build
    return
  }

  if (String(event.block.id) !== 'minecraft:iron_door') {
    player.tell(Text.literal('§c[Checkpoint] asta nu e o ușă de fier.'))
    event.cancel()
    return
  }
  // store the lower half of the door
  try {
    if (String(event.block.properties.half) === 'upper') {
      y = y - 1
    }
  } catch (e) { /* keep clicked pos */ }
  var dup = site.doors.some(function (d) {
    return d.dim === dim && d.x === x && d.y === y && d.z === z
  })
  if (dup) {
    player.tell(Text.literal('§7[Checkpoint] ușa e deja urmărită la ' + site.name + '.'))
    event.cancel()
    return
  }
  site.doors.push({ dim: dim, x: x, y: y, z: z })
  cpCfgSave(event.server)
  player.tell(Text.literal('§a[Checkpoint] ' + site.name + ' ușă adăugată (' + site.doors.length + ' total): ' + x + ' ' + y + ' ' + z))
  event.cancel() // last call — cancel() aborts the handler in this KubeJS build
})

// ============================================================================
// Command registration
// ============================================================================

// ============================================================================
// ONE-WAY GATES — a gate is a line a<->b drawn across a lane plus `from`, a
// point on the side travelers legitimately COME FROM. Crossing the line from
// the wrong side = pushed back to `from` + doors shut — independent of who
// opened them, so accomplices can't plate-open a lane backwards.
// A right-way crossing at a LINKED site consumes a boarding stamp or runs the
// full arrival check right at the line.
// ============================================================================

const CP_GATE_SCAN_EVERY = 5 // ticks between crossing scans
const CP_BOARD_MS = 20 * 60 * 1000 // boarding stamp validity
const CP_GATE_MAX_STEP = 14  // bigger jump between scans => teleport, ignore

var cpGatePrev = {} // name -> {x, z, dim} last scanned position
var cpGateDraft = {} // name -> {site, a, b} gate pick in progress (3 clicks)
var cpBoardDraft = {} // name -> {site, c1} board-zone pick in progress (2 clicks)

// sign of which side of the directed a->b line the point (x,z) sits on
function cpGateSide(g, x, z) {
  return (g.b.x - g.a.x) * (z - g.a.z) - (g.b.z - g.a.z) * (x - g.a.x)
}

function cpSegCross(ax, az, bx, bz, cx, cz, dx, dz) {
  var d1 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx)
  var d2 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx)
  var d3 = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
  var d4 = (bz - az) * (dx - ax) - (bx - ax) * (dz - az)
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))
}

// movement segment (px,pz)->(x,z) bbox vs gate bbox, small margin
function cpGateNear(g, px, pz, x, z) {
  var m = 3
  var lx = Math.min(px, x), hx = Math.max(px, x)
  var lz = Math.min(pz, z), hz = Math.max(pz, z)
  var gx1 = Math.min(g.a.x, g.b.x), gx2 = Math.max(g.a.x, g.b.x)
  var gz1 = Math.min(g.a.z, g.b.z), gz2 = Math.max(g.a.z, g.b.z)
  return !(hx < gx1 - m || lx > gx2 + m || hz < gz1 - m || lz > gz2 + m)
}

function cpBoardStamp(player) {
  try {
    var raw = player.persistentData.getString('cpBoard')
    if (raw !== null && String(raw).length > 0) {
      var st = JSON.parse(String(raw))
      if (st !== null && st.until !== undefined && Date.now() < st.until) {
        return st
      }
    }
  } catch (e) { /* no stamp */ }
  return null
}

function cpBoardStampSet(player, siteName) {
  try {
    player.persistentData.putString('cpBoard',
      JSON.stringify({ site: siteName, until: Date.now() + CP_BOARD_MS }))
  } catch (e) { /* best-effort */ }
}

function cpBoardStampClear(player) {
  try { player.persistentData.remove('cpBoard') } catch (e) { /* none */ }
}

// wrong-way crossing — send them back to the position they crossed FROM
// (never to gate.from: for an exit-direction violation that would deliver
// them to their destination instead of bouncing them back)
function cpGateDeny(server, player, site, gate, backTo) {
  var name = cpPlayerName(player)
  server.runCommandSilent(
    'execute in ' + gate.dim + ' run tp ' + cpQuoted(player) +
    ' ' + backTo.x + ' ' + backTo.y + ' ' + backTo.z)
  cpCloseDoors(server, site)
  try {
    player.tell(Text.literal('§c[Checkpoint] Sens interzis — această bandă merge doar într-un sens.'))
  } catch (e) { /* chat optional */ }
  cpSound(server, player, CP_DENY_SOUND)
  cpLogEvent('denied', name, '', 'sens interzis la poartă (' + site.name + ')')
  console.info('[Checkpoint] ' + name + ' pushed back — wrong-way at gate (' + site.name + ')')
}

// right-way arrival at a linked gate with no boarding stamp — they got here
// without being checked: full stage-2 pipeline right at the line
function cpGateArrive(server, player, site) {
  var name = cpPlayerName(player)
  var inv = cpInvSummary(player)
  if (cpIsBanned(name)) {
    cpTitle(server, player, CP_DENY_TITLE, CP_BANNED_SUBTITLE)
    cpPushBack(server, player, site)
    cpLogEvent('denied', name, inv, 'interzis (ban) | punct=' + site.name)
    return
  }
  if (cpInCustody(player)) {
    cpDelegateArrest(server, player, name, 'fugitiv prins la punctul de control', site)
    return
  }
  var found = cpScanContraband(player, site)
  if (!cpIsEmpty(found)) {
    cpDelegateArrest(server, player, name, 'marfă interzisă — control ocolit la îmbarcare', site)
    return
  }
  cpLogEvent('in', name, inv, 'curat — trecere fără îmbarcare | punct=' + site.name)
}

function cpGateScan(server) {
  var anyGates = false
  for (var sn0 in CP_CFG.sites) {
    if (CP_CFG.sites[sn0].gates.length > 0) { anyGates = true; break }
  }
  if (!anyGates) {
    return
  }
  var players = server.getPlayerList().getPlayers()
  for (var pi = 0; pi < players.size(); pi++) {
    var p = players.get(pi)
    try {
      var name = cpPlayerName(p)
      var dim = String(p.level.dimension)
      var x = p.x, z = p.z, y = p.y
      var prev = cpGatePrev[name]
      cpGatePrev[name] = { x: x, y: y, z: z, dim: dim }
      if (prev === undefined || prev.dim !== dim) {
        continue
      }
      var mx = x - prev.x, mz = z - prev.z
      if (mx * mx + mz * mz > CP_GATE_MAX_STEP * CP_GATE_MAX_STEP) {
        continue // teleport/fly — not a walking crossing
      }
      if (mx === 0 && mz === 0) {
        continue
      }
      var gm = cpGameModeName(p)
      if (gm !== 'survival' && gm !== 'adventure') {
        continue
      }
      // test every site's gates — a lane can sit farther than the 24-block
      // site-anchor radius, so nearest-site binding would miss it
      for (var sn in CP_CFG.sites) {
        var site = CP_CFG.sites[sn]
        if (site.gates.length === 0 || cpIsExempt(p, site)) {
          continue
        }
        var hit = false
        for (var gi = 0; gi < site.gates.length; gi++) {
          var g = site.gates[gi]
          if (g.dim !== dim || g.from === null) {
            continue
          }
          if (!cpGateNear(g, prev.x, prev.z, x, z) ||
              !cpSegCross(prev.x, prev.z, x, z, g.a.x, g.a.z, g.b.x, g.b.z)) {
            continue
          }
          hit = true
          var origin = cpGateSide(g, prev.x, prev.z)
          var allowed = cpGateSide(g, g.from.x, g.from.z)
          if (origin === 0) {
            break // started exactly ON the line — ambiguous, don't punish
          }
          var wrongWay = (origin > 0) !== (allowed > 0)
          if (wrongWay) {
            cpGateDeny(server, p, site, g, prev)
            break
          }
          // right-way: linked site consumes a boarding stamp or checks arrivals
          if (site.link !== null && site.link !== undefined) {
            var st = cpBoardStamp(p)
            if (st !== null && st.site === site.link) {
              cpBoardStampClear(p)
              cpLogEvent('in', name, '', 'controlat la îmbarcare (' + st.site + ') | punct=' + site.name)
              p.tell(Text.literal('§a[Checkpoint] Controlul de la ' + site.link + ' e valabil — treceți.'))
            } else {
              cpGateArrive(server, p, site)
            }
          }
          break
        }
        if (hit) {
          break
        }
      }
    } catch (e) { /* one bad player never stops the scan */ }
  }
}

// ============================================================================
// BOARDING ZONES — site.board = {dim,x1,z1,x2,z2,y}: a rectangle on the dock.
// A player who mounts a boat inside it is checked on the spot — the whole
// point is they can't jump off mid-route and skip the land-side checkpoint.
// Clean riders get a stamp that the LINKED site's gate consumes on arrival.
// ============================================================================

function cpInBoardZone(board, p) {
  if (board === null || board === undefined) {
    return false
  }
  if (String(p.level.dimension) !== board.dim) {
    return false
  }
  var x = p.x, z = p.z
  var lx = Math.min(board.x1, board.x2), hx = Math.max(board.x1, board.x2)
  var lz = Math.min(board.z1, board.z2), hz = Math.max(board.z1, board.z2)
  if (x < lx || x > hx || z < lz || z > hz) {
    return false
  }
  return Math.abs(p.y - board.y) <= 6
}

function cpIsBoat(ent) {
  try {
    var t = String(ent.type).toLowerCase()
    return t.indexOf('boat') >= 0 || t.indexOf('raft') >= 0
  } catch (e) {
    return false
  }
}

function cpBoardScan(server) {
  var players = server.getPlayerList().getPlayers()
  for (var pi = 0; pi < players.size(); pi++) {
    var p = players.get(pi)
    try {
      var v = null
      try { v = p.getVehicle() } catch (e0) { /* none */ }
      if (v === null || v === undefined || !cpIsBoat(v)) {
        continue
      }
      var gm = cpGameModeName(p)
      if (gm !== 'survival' && gm !== 'adventure') {
        continue
      }
      // every site's board zone — the dock can be away from its own anchor
      var site = null
      for (var sn in CP_CFG.sites) {
        var cand = CP_CFG.sites[sn]
        if (cand.board !== null && cand.board !== undefined &&
            cpInBoardZone(cand.board, p)) {
          site = cand
          break
        }
      }
      if (site === null) {
        continue
      }
      var name = cpPlayerName(p)
      if (cpIsExempt(p, site)) {
        continue
      }
      if (cpBoardStamp(p) !== null) {
        continue // already stamped this trip
      }
      var found = cpScanContraband(p, site)
      if (!cpIsEmpty(found) || cpIsBanned(name) || cpInCustody(p)) {
        var reason = cpInCustody(p) ? 'fugitiv la îmbarcare'
          : (cpIsBanned(name) ? 'interzis la îmbarcare (ban activ)'
            : 'marfă interzisă la îmbarcare')
        cpDelegateArrest(server, p, name, reason, site)
        console.info('[Checkpoint] ' + name + ' arrested at boarding (' + site.name + ')')
      } else {
        cpBoardStampSet(p, site.name)
        p.tell(Text.literal('§a[Checkpoint] Îmbarcare verificată — control curat. Valabil ' +
          Math.round(CP_BOARD_MS / 60000) + ' minute la punctul de frontieră legat.'))
        cpLogEvent('boarded', name, cpInvSummary(p), 'curat | punct=' + site.name)
      }
    } catch (e) { /* one bad player never stops the scan */ }
  }
}

ServerEvents.commandRegistry(event => {
  var Commands = event.commands

  event.register(
    Commands.literal('strajacheckpoint')
      .requires(src => src.hasPermission(2))
      .executes(ctx => cpCmdHelp(ctx, ''))
      .then(Commands.literal('aggressive')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpAggressive(ctx))))
      .then(Commands.literal('info')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpInfo(ctx))))
      .then(Commands.literal('deny')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpDeny(ctx))))
      .then(Commands.literal('inspect')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpInspect(ctx))))
      .then(Commands.literal('arrest')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpArrest(ctx))))
      .then(Commands.literal('ban')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpPlayerSuggest)
          .executes(ctx => cpCmdBan(ctx, $CP_StringArgument.getString(ctx, 'name'), true))))
      .then(Commands.literal('unban')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpBannedSuggest)
          .executes(ctx => cpCmdBan(ctx, $CP_StringArgument.getString(ctx, 'name'), false))))
      .then(Commands.literal('bans')
        .executes(ctx => cpCmdBans(ctx)))
      .then(Commands.literal('release')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpJailedSuggest)
          .executes(ctx => cpReleaseAlias(ctx, $CP_StringArgument.getString(ctx, 'name'), 0))
          .then(Commands.argument('fine', $CP_IntegerArgument.integer(0, 1000000))
            .executes(ctx => cpReleaseAlias(ctx, $CP_StringArgument.getString(ctx, 'name'), $CP_IntegerArgument.getInteger(ctx, 'fine'))))))
      .then(Commands.literal('jailed')
        .executes(ctx => cpCmdJailed(ctx)))
      .then(Commands.literal('record')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpJailedSuggest)
          .executes(ctx => cpCmdRecord(ctx, $CP_StringArgument.getString(ctx, 'name')))))
      .then(Commands.literal('why')
        .then(Commands.argument('player', $CP_EntityArgument.player())
          .executes(ctx => cpCmdWhy(ctx))))
      .then(Commands.literal('exempt')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpPlayerSuggest)
          .executes(ctx => cpCmdExempt(ctx, $CP_StringArgument.getString(ctx, 'name'), true))))
      .then(Commands.literal('unexempt')
        .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpExemptSuggest)
          .executes(ctx => cpCmdExempt(ctx, $CP_StringArgument.getString(ctx, 'name'), false))))
      .then(Commands.literal('exempts')
        .executes(ctx => cpCmdExempts(ctx)))
      .then(Commands.literal('pchests')
        .executes(ctx => cpCmdPChests(ctx)))
      .then(Commands.literal('denyhere')
        .executes(ctx => cpCmdDenyHere(ctx, null))
        .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
          .executes(ctx => cpCmdDenyHere(ctx, $CP_StringArgument.getString(ctx, 'site')))))
      .then(Commands.literal('jailhere')
        .executes(ctx => cpCmdJailHere(ctx)))
      .then(Commands.literal('cellhere')
        .executes(ctx => cpCmdCellHere(ctx)))
      .then(Commands.literal('jcells')
        .executes(ctx => cpCmdJCells(ctx)))
      .then(Commands.literal('site')
        .then(Commands.literal('list')
          .executes(ctx => cpCmdSiteList(ctx)))
        .then(Commands.literal('remove')
          .then(Commands.argument('name', $CP_StringArgument.word()).suggests(cpSiteSuggest)
            .executes(ctx => cpCmdSiteRemove(ctx, $CP_StringArgument.getString(ctx, 'name')))))
        .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
          .then(Commands.literal('denyhere')
            .executes(ctx => cpCmdDenyHere(ctx, $CP_StringArgument.getString(ctx, 'site'))))
          .then(Commands.literal('pick')
            .then(Commands.literal('door')
              .executes(ctx => cpCmdPick(ctx, 'door', $CP_StringArgument.getString(ctx, 'site'))))
            .then(Commands.literal('evidence')
              .executes(ctx => cpCmdPick(ctx, 'evidence', $CP_StringArgument.getString(ctx, 'site'))))
            .then(Commands.literal('gate')
              .executes(ctx => cpCmdPick(ctx, 'gate', $CP_StringArgument.getString(ctx, 'site'))))
            .then(Commands.literal('board')
              .executes(ctx => cpCmdPick(ctx, 'board', $CP_StringArgument.getString(ctx, 'site'))))
            .then(Commands.literal('off')
              .executes(ctx => cpCmdPick(ctx, 'off', $CP_StringArgument.getString(ctx, 'site')))))
          .then(Commands.literal('gates')
            .executes(ctx => cpCmdGates(ctx, $CP_StringArgument.getString(ctx, 'site'))))
          .then(Commands.literal('gate')
            .then(Commands.literal('del')
              .then(Commands.argument('idx', $CP_IntegerArgument.integer(1))
                .executes(ctx => cpCmdGateDel(ctx, $CP_StringArgument.getString(ctx, 'site'), $CP_IntegerArgument.getInteger(ctx, 'idx'))))))
          .then(Commands.literal('board')
            .then(Commands.literal('off')
              .executes(ctx => cpCmdBoardClear(ctx, $CP_StringArgument.getString(ctx, 'site')))))
          .then(Commands.literal('link')
            .then(Commands.argument('other', $CP_StringArgument.word()).suggests(cpSiteSuggest)
              .executes(ctx => cpCmdLink(ctx, $CP_StringArgument.getString(ctx, 'site'), $CP_StringArgument.getString(ctx, 'other')))))
          .then(Commands.literal('unlink')
            .executes(ctx => cpCmdUnlink(ctx, $CP_StringArgument.getString(ctx, 'site'))))
          .then(Commands.literal('cb')
            .executes(ctx => cpCmdCbLocal(ctx, $CP_StringArgument.getString(ctx, 'site'), 'list'))
            .then(Commands.literal('add')
              .executes(ctx => cpCmdCbLocal(ctx, $CP_StringArgument.getString(ctx, 'site'), 'add')))
            .then(Commands.literal('allow')
              .executes(ctx => cpCmdCbLocal(ctx, $CP_StringArgument.getString(ctx, 'site'), 'allow')))
            .then(Commands.literal('reset')
              .executes(ctx => cpCmdCbLocal(ctx, $CP_StringArgument.getString(ctx, 'site'), 'reset'))))
          .then(Commands.literal('exempt')
            .then(Commands.argument('player', $CP_StringArgument.word()).suggests(cpPlayerSuggest)
              .executes(ctx => cpCmdSiteExempt(ctx, $CP_StringArgument.getString(ctx, 'site'), $CP_StringArgument.getString(ctx, 'player'), true))))
          .then(Commands.literal('unexempt')
            .then(Commands.argument('player', $CP_StringArgument.word()).suggests(cpPlayerSuggest)
              .executes(ctx => cpCmdSiteExempt(ctx, $CP_StringArgument.getString(ctx, 'site'), $CP_StringArgument.getString(ctx, 'player'), false))))
          .then(Commands.literal('exempts')
            .executes(ctx => cpCmdSiteExempts(ctx, $CP_StringArgument.getString(ctx, 'site'))))))
      .then(Commands.literal('pick')
        .then(Commands.literal('door')
          .executes(ctx => cpCmdPick(ctx, 'door', null))
          .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
            .executes(ctx => cpCmdPick(ctx, 'door', $CP_StringArgument.getString(ctx, 'site')))))
        .then(Commands.literal('evidence')
          .executes(ctx => cpCmdPick(ctx, 'evidence', null))
          .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
            .executes(ctx => cpCmdPick(ctx, 'evidence', $CP_StringArgument.getString(ctx, 'site')))))
        .then(Commands.literal('pchest')
          .executes(ctx => cpCmdPick(ctx, 'pchest', null)))
        .then(Commands.literal('cell')
          .executes(ctx => cpCmdPick(ctx, 'cell', null)))
        .then(Commands.literal('gate')
          .executes(ctx => cpCmdPick(ctx, 'gate', null))
          .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
            .executes(ctx => cpCmdPick(ctx, 'gate', $CP_StringArgument.getString(ctx, 'site')))))
        .then(Commands.literal('board')
          .executes(ctx => cpCmdPick(ctx, 'board', null))
          .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
            .executes(ctx => cpCmdPick(ctx, 'board', $CP_StringArgument.getString(ctx, 'site')))))
        .then(Commands.literal('off').executes(ctx => cpCmdPick(ctx, 'off', null))))
      .then(Commands.literal('addcontraband')
        .executes(ctx => cpCmdContraband(ctx, true)))
      .then(Commands.literal('delcontraband')
        .executes(ctx => cpCmdContraband(ctx, false)))
      .then(Commands.literal('contraband')
        .executes(ctx => {
          var ids = []
          for (var k in CP_CFG.contraband) {
            ids.push(k)
          }
          if (ids.length === 0) {
            ctx.source.sendSystemMessage(Text.literal('§7[Checkpoint] lista de contraband e goală.'))
            return 1
          }
          ctx.source.sendSystemMessage(Text.literal('§b[Checkpoint] contraband (' + ids.length + '):'))
          ids.forEach(function (id) {
            ctx.source.sendSystemMessage(Text.literal('§7  - ' + id))
          })
          return 1
        }))
      .then(Commands.literal('status')
        .executes(ctx => cpCmdStatus(ctx)))
      .then(Commands.literal('resetcfg')
        .executes(ctx => cpCmdResetCfg(ctx)))
      .then(Commands.literal('setup')
        .executes(ctx => cpCmdSetup(ctx, null))
        .then(Commands.argument('site', $CP_StringArgument.word()).suggests(cpSiteSuggest)
          .executes(ctx => cpCmdSetup(ctx, $CP_StringArgument.getString(ctx, 'site')))))
      .then(Commands.literal('help')
        .executes(ctx => cpCmdHelp(ctx, ''))
        .then(Commands.argument('topic', $CP_StringArgument.word()).suggests(cpHelpSuggest)
          .executes(ctx => cpCmdHelp(ctx, $CP_StringArgument.getString(ctx, 'topic')))))
  )
})

ServerEvents.loaded(event => {
  cpCfgLoad(event.server)
  var siteCount = 0
  var unconfigured = []
  for (var sn in CP_CFG.sites) {
    siteCount++
    if (cpSiteAnchor(CP_CFG.sites[sn]) === null) {
      unconfigured.push(sn)
    }
  }
  if (siteCount === 0) {
    console.error('[Checkpoint] no sites configured (use `strajacheckpoint site <nume> denyhere`) — deny will only show a title!')
  }
  if (unconfigured.length > 0) {
    console.error('[Checkpoint] sites without an anchor (no denyTarget/doors/evidence): ' + unconfigured.join(', '))
  }
})
