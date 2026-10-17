// ============================================================================
// Straja Prison Setup — guided, click-through setup of the whole prison
// ----------------------------------------------------------------------------
//   /prisonsetup            shows ONLY the next thing to do (with clickable buttons)
//   /prisonsetup all        every step with a tick/cross; click a step to jump to it
//   /prisonsetup step <n>   show one step
//   /prisonsetup book       gives you a written book with all the steps (clickable)
//
// It reads the real state of every prison script (cells, chests, mine, grounds, gates, warehouse,
// buyer NPC), so a step turns green by itself the moment you finish it — just keep clicking
// "Next". Admin only (op). Reads other scripts' saved state read-only.
// ============================================================================

const $SU_Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const $SU_StringArgument = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $SU_IntegerArgument = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')

// ---- reading other scripts' state (read-only) -------------------------------------------------

function suJson(server, key) {
  try {
    var raw = String(server.persistentData.getString(key) || '')
    if (raw.length > 2) return JSON.parse(raw)
  } catch (e) { /* unreadable = treat as empty */ }
  return null
}

function suState(server) {
  var prison = suJson(server, 'strajaPrisonCfg')
  var checkpoint = suJson(server, 'portCheckpointCfg')
  // the prison keeps its own copy; the old checkpoint blob is only the fallback it migrates from
  var cfg = prison !== null ? prison : (checkpoint !== null ? checkpoint : {})
  var cells = 0
  var jc = cfg.jcells || []
  for (var i = 0; i < jc.length; i++) if (jc[i].removed !== true) cells++
  var releasePoint = false
  var sites = checkpoint !== null && checkpoint.sites ? checkpoint.sites : {}
  for (var s in sites) if (sites[s].denyTarget) releasePoint = true
  var mine = suJson(server, 'strajaPrisonMine') || {}
  var gates = (suJson(server, 'strajaPrisonGates') || {}).gates || {}
  var grounds = suJson(server, 'strajaPrisonGrounds') || { boxes: [] }
  var missions = suJson(server, 'strajaMissions') || {}
  var market = suJson(server, 'strajaPrisonMarket') || {}
  var jail = (suJson(server, 'strajaPrisonJail') || {}).jailed || {}
  var stages = mine.stages || {}
  var zones = 0
  for (var z = 1; z <= 4; z++) if (stages['zone_' + z] && stages['zone_' + z].active) zones++
  return {
    cells: cells,
    overflow: !!cfg.jailTarget,
    pchests: (cfg.pcells || []).length,
    releasePoint: releasePoint,
    mineReady: !!mine.layout,
    shaft: !!(stages.shaft_1 && stages.shaft_1.active),
    zones: zones,
    mineOn: mine.enabled === true,
    mineExit: !!mine.exit,
    adopted: mine.adopted || '',
    groundsBoxes: (grounds.boxes || []).length,
    gates: gates,
    depots: (missions.depozite || []).length,
    buyers: Number(market.buyers || 0),
    prisoners: Object.keys(jail).length
  }
}

function suGateDone(st, kind) {
  for (var n in st.gates) {
    var g = st.gates[n]
    if (g.kind === kind && g.deny && g.doors && g.doors.length > 0) return true
  }
  return false
}

function suGateName(st, kind) {
  for (var n in st.gates) if (st.gates[n].kind === kind) return n
  return null
}

// ---- the steps ------------------------------------------------------------------------------------
// do: [{b: button label, c: command, s: true → only puts the command in the chat box instead of running it}]
//     or {t: plain text line}

function suSteps(st) {
  var exitG = suGateName(st, 'exit') || 'exit'
  var inG = suGateName(st, 'mine-in') || 'minein'
  var outG = suGateName(st, 'mine-out') || 'mineout'
  return [
    { id: 'cells', title: 'Prison cells', required: true, done: st.cells > 0,
      info: st.cells + ' cell(s) set. One cell = one prisoner with their own bed/cell; extra prisoners go to the common room.',
      do: [{ t: 'Walk INSIDE a cell and stand where the prisoner should appear. Click once per cell:' }, { b: 'Set cell here', c: 'strajaprison cellhere' }, { t: 'Move to the next cell and click again. (Or: ' }, { b: 'click-the-floor mode', c: 'strajaprison pick cell' }, { t: ')' }] },
    { id: 'overflow', title: 'Common room (overflow)', required: false, done: st.overflow,
      info: 'Where prisoners go when every cell is taken. Optional but recommended.',
      do: [{ t: 'Stand in a big shared room and click:' }, { b: 'Set common room here', c: 'strajaprison jailhere' }] },
    { id: 'pchests', title: 'Personal chests', required: true, done: st.pchests > 0,
      info: st.pchests + ' chest(s). Each prisoner gets one chest to hold their belongings (backpack, items) until release.',
      do: [{ t: 'Click this, then RIGHT-CLICK each chest (double chests pair automatically, one per prisoner):' }, { b: 'Start picking chests', c: 'strajaprison pick pchest' }, { t: 'When finished:' }, { b: 'Stop picking', c: 'strajaprison pick off' }] },
    { id: 'release', title: 'Release point', required: true, done: st.releasePoint,
      info: 'Where a freed prisoner appears. Without it they stay inside the prison.',
      do: [{ t: 'Stand OUTSIDE the prison where freed prisoners should appear, then click:' }, { b: 'Set release point here', c: 'strajacheckpoint site prison denyhere' }] },
    { id: 'mine', title: 'The mine', required: true, done: st.mineReady,
      info: st.adopted !== '' ? 'Taken over from ' + st.adopted + '.' : 'Not placed yet.',
      do: [{ t: 'Option A - use the EXISTING Straja mine exactly where it is (the old mine script is switched off, nothing is deleted):' }, { b: 'Take over the existing mine', c: 'prisonmine adopt' },
        { t: 'Option B - build a new compressed mine. Stand on the ground where the entrance should be, then click the direction the entrance faces:' }, { b: 'north', c: 'prisonmine place north' }, { b: 'east', c: 'prisonmine place east' }, { b: 'south', c: 'prisonmine place south' }, { b: 'west', c: 'prisonmine place west' }] },
    { id: 'stages', title: 'Mine stages', required: true, done: st.shaft && st.zones > 0,
      info: 'Shaft: ' + (st.shaft ? 'on' : 'off') + ' - zones active: ' + st.zones + '/4. Zones are the ore areas; each can have different ores.',
      do: [{ t: 'Switch on the shaft first, then the zones you want:' }, { b: 'Shaft 1', c: 'prisonmine stage shaft_1 on' }, { b: 'Zone 1', c: 'prisonmine stage zone_1 on' }, { b: 'Zone 2', c: 'prisonmine stage zone_2 on' }, { b: 'Zone 3', c: 'prisonmine stage zone_3 on' }, { b: 'Zone 4', c: 'prisonmine stage zone_4 on' }, { b: 'Warehouse', c: 'prisonmine stage warehouse on' }, { b: 'Shaft 2', c: 'prisonmine stage shaft_2 on' }, { t: 'See everything:' }, { b: 'Stage list', c: 'prisonmine stage' }] },
    { id: 'mineon', title: 'Switch the mine on', required: true, done: st.mineOn,
      info: 'Until it is on, nobody can mine.',
      do: [{ b: 'Mine ON', c: 'prisonmine on' }] },
    { id: 'mineexit', title: 'Mine exit point', required: false, done: st.mineExit,
      info: 'Where intruders (free non-Straja players) are thrown out. Default: 8 blocks in front of the entrance.',
      do: [{ t: 'Stand just OUTSIDE the mine and click:' }, { b: 'Set mine exit here', c: 'prisonmine exit' }] },
    { id: 'grounds', title: 'Prisoner area (grounds)', required: true, done: st.groundsBoxes > 0,
      info: st.groundsBoxes + ' box(es). A prisoner inside the grounds is NOT escaping, however far from the cell. Include cells, yard, food court and the corridors between them.',
      do: [{ t: 'Stand in one corner (floor level, then it spans up) and click:' }, { b: 'Corner 1', c: 'prisongate grounds pos1' }, { t: 'Walk to the OPPOSITE corner and click:' }, { b: 'Corner 2', c: 'prisongate grounds pos2' }, { t: 'Several areas? Repeat. Check:' }, { b: 'List boxes', c: 'prisongate grounds list' }] },
    { id: 'gate-exit', title: 'Gate 1: the visitors/Straja door', required: true, done: suGateDone(st, 'exit'),
      info: 'The door to the outside. Prisoners are blocked here until freed; Straja and visitors walk through with whatever they carry.',
      do: [{ t: 'a) Create the gate:' }, { b: 'Create gate "' + exitG + '"', c: 'prisongate add ' + exitG + ' exit' },
        { t: 'b) Stand INSIDE the prison, 2 blocks before the door (off the pressure plate). Prisoners get pushed back here:' }, { b: 'Set push-back spot', c: 'prisongate deny ' + exitG },
        { t: 'c) LOOK AT the closed iron door and click (repeat for a double door):' }, { b: 'Add the door I am looking at', c: 'prisongate door ' + exitG },
        { t: 'd) Build: pressure plate in front of the door (inside) -> command block with this command:' }, { b: '/prisongate use ' + exitG + ' @p', c: 'prisongate use ' + exitG + ' @p', s: true }] },
    { id: 'gate-in', title: 'Gate 2: into the mine', required: true, done: suGateDone(st, 'mine-in'),
      info: 'The door between the prison and the mine, plate on the PRISON side. Only fugitives are blocked; prisoners mine whenever they like.',
      do: [{ b: 'Create gate "' + inG + '"', c: 'prisongate add ' + inG + ' mine-in' }, { t: 'Stand on the prison side, off the plate:' }, { b: 'Set push-back spot', c: 'prisongate deny ' + inG },
        { t: 'Look at the door:' }, { b: 'Add the door I am looking at', c: 'prisongate door ' + inG }, { t: 'Plate on the prison side -> command block:' }, { b: '/prisongate use ' + inG + ' @p', c: 'prisongate use ' + inG + ' @p', s: true }] },
    { id: 'gate-out', title: 'Gate 3: out of the mine', required: true, done: suGateDone(st, 'mine-out'),
      info: 'Same door, plate on the MINE side. Prisoners carrying ore or rubble (even in bags) are pushed back until they /sellall.',
      do: [{ b: 'Create gate "' + outG + '"', c: 'prisongate add ' + outG + ' mine-out' }, { t: 'Stand on the mine side, off the plate:' }, { b: 'Set push-back spot', c: 'prisongate deny ' + outG },
        { t: 'Look at the same door:' }, { b: 'Add the door I am looking at', c: 'prisongate door ' + outG }, { t: 'Plate on the mine side -> command block:' }, { b: '/prisongate use ' + outG + ' @p', c: 'prisongate use ' + outG + ' @p', s: true }] },
    { id: 'depot', title: 'Straja warehouse (where goods go)', required: true, done: st.depots > 0,
      info: st.depots + ' warehouse(s). Everything prisoners sell is stored here, sorted. Straja missions count it too.',
      do: [{ t: 'Click this, then RIGHT-CLICK any chest in the Straja warehouse (the whole chunk becomes the depot):' }, { b: 'Pick warehouse chest', c: 'strajamisiuni depozit' }] },
    { id: 'buyer', title: 'Buyer NPC', required: true, done: st.buyers > 0,
      info: 'The villager / CustomNPC prisoners right-click to sell everything they mined. (They can also type /sellall.)',
      do: [{ t: 'Place a villager or CustomNPC, LOOK AT it (within 8 blocks) and click:' }, { b: 'Make this NPC the buyer', c: 'prisonmarket buyer' }, { t: 'Prices:' }, { b: 'Show prices', c: 'prisonmarket price' }] },
    { id: 'test', title: 'Try it', required: false, done: st.prisoners > 0,
      info: 'Everything is set up. Sentence someone to test the whole loop.',
      do: [{ t: 'Sentence a player to a debt (their coins are taken first, the rest is worked off in the mine; at 0 they are freed):' }, { b: '/strajaprison sentence <player> <amount> [reason]', c: 'strajaprison sentence ', s: true },
        { t: 'Or arrest with no debt: ' }, { b: '/strajaprison arrest <player> [reason]', c: 'strajaprison arrest ', s: true },
        { t: 'Free someone: ' }, { b: '/strajaprison release <name>', c: 'strajaprison release ', s: true }, { t: 'Who is in prison:' }, { b: 'Prisoners', c: 'strajaprison jailed' }] }
  ]
}

// ---- rendering --------------------------------------------------------------------------------------

function suBtn(label, cmd, suggest) {
  var t = Text.literal('§a[§f' + label + '§a]')
  try {
    t = suggest ? t.clickSuggestCommand('/' + cmd) : t.clickRunCommand('/' + cmd)
  } catch (e) { /* text fallback */ }
  return t
}

function suSend(src, text) {
  src.sendSystemMessage(text)
}

function suRenderDo(src, items) {
  var line = null
  var flush = function () { if (line !== null) { suSend(src, line); line = null } }
  for (var i = 0; i < items.length; i++) {
    var it = items[i]
    if (it.t !== undefined) {
      // a text item starts a new line unless it is a short continuation like ")"
      if (it.t.length > 3) flush()
      var seg = Text.literal((line === null ? '  §7' : '§7') + it.t + ' ')
      line = line === null ? seg : line.append(seg)
    } else {
      var btn = suBtn(it.b, it.c, it.s === true)
      line = line === null ? Text.literal('    ').append(btn) : line.append(Text.literal(' ')).append(btn)
    }
  }
  flush()
}

function suProgress(steps) {
  var req = 0
  var done = 0
  for (var i = 0; i < steps.length; i++) {
    if (steps[i].required) { req++; if (steps[i].done) done++ }
  }
  return { req: req, done: done }
}

function suShowStep(src, steps, idx) {
  var s = steps[idx]
  var pr = suProgress(steps)
  suSend(src, Text.literal('§6§l== PRISON SETUP §r§6- step ' + (idx + 1) + '/' + steps.length + '  §7(required done: ' + pr.done + '/' + pr.req + ')'))
  suSend(src, Text.literal('§e§l' + s.title + (s.required ? '' : ' §7(optional)') + (s.done ? '  §a[done]' : '')))
  suSend(src, Text.literal('§7' + s.info))
  suRenderDo(src, s.do)
  suSend(src, Text.literal('§8--- ').append(suBtn('Next >', 'prisonsetup', false)).append(Text.literal(' ')).append(suBtn('All steps', 'prisonsetup all', false)).append(Text.literal(' ')).append(suBtn('Book', 'prisonsetup book', false)))
}

function suCmdNext(ctx) {
  var steps = suSteps(suState(ctx.source.server))
  for (var i = 0; i < steps.length; i++) {
    if (!steps[i].done && steps[i].required) { suShowStep(ctx.source, steps, i); return 1 }
  }
  // all required steps are done: offer the optional ones, then the "try it" page
  for (var j = 0; j < steps.length - 1; j++) {
    if (!steps[j].done) {
      suSend(ctx.source, Text.literal('§a§lAll required steps are done!§r§7 Optional step left:'))
      suShowStep(ctx.source, steps, j)
      return 1
    }
  }
  suSend(ctx.source, Text.literal('§a§lSetup complete.§r§7 Everything is configured:'))
  suShowStep(ctx.source, steps, steps.length - 1)
  return 1
}

function suCmdStep(ctx, n) {
  var steps = suSteps(suState(ctx.source.server))
  if (n < 1 || n > steps.length) { suSend(ctx.source, Text.literal('§c[Setup] steps are 1-' + steps.length)); return 0 }
  suShowStep(ctx.source, steps, n - 1)
  return 1
}

function suCmdAll(ctx) {
  var steps = suSteps(suState(ctx.source.server))
  var pr = suProgress(steps)
  suSend(ctx.source, Text.literal('§6§l== PRISON SETUP - all steps §r§7(required done: ' + pr.done + '/' + pr.req + ')'))
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i]
    var mark = s.done ? '§a✓ ' : (s.required ? '§c✗ ' : '§7○ ')
    var line = Text.literal(' ' + mark + '§f' + (i + 1) + '. ' + s.title + (s.required ? '' : ' §7(optional)') + ' ')
    line = line.append(suBtn(s.done ? 'view' : 'do this', 'prisonsetup step ' + (i + 1), false))
    suSend(ctx.source, line)
  }
  return 1
}

// ---- the book ---------------------------------------------------------------------------------------------

function suJsonText(s) {
  return JSON.stringify(s)
}

function suBookPage(s, idx) {
  var comps = ['', { text: (idx + 1) + '. ' + s.title + '\n', bold: true, color: 'dark_red' }, { text: s.info + '\n', color: 'dark_gray' }]
  for (var i = 0; i < s.do.length; i++) {
    var it = s.do[i]
    if (it.t !== undefined) comps.push({ text: '\n' + it.t + '\n', color: 'black' })
    else comps.push({ text: '[' + it.b + ']\n', color: 'dark_green', clickEvent: { action: it.s === true ? 'suggest_command' : 'run_command', value: '/' + it.c } })
  }
  return comps
}

function suCmdBook(ctx) {
  var p = null
  try { var e = ctx.source.getEntity(); if (e instanceof $SU_Player) p = e } catch (err) { p = null }
  if (p === null) { suSend(ctx.source, Text.literal('§c[Setup] the book is for a player.')); return 0 }
  var steps = suSteps(suState(ctx.source.server))
  var pages = []
  pages.push(['', { text: 'STRAJA PRISON\nSETUP\n\n', bold: true, color: 'dark_red' }, { text: 'Click the green buttons, top to bottom. Each page is one step. Same wizard as /prisonsetup - the chat version also ticks steps off by itself.\n\n', color: 'black' }, { text: '[Open the wizard]', color: 'dark_green', clickEvent: { action: 'run_command', value: '/prisonsetup' } }])
  for (var i = 0; i < steps.length; i++) pages.push(suBookPage(steps[i], i))
  var snbtPages = pages.map(function (pg) {
    var json = suJsonText(pg).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return "{raw:'" + json + "'}"
  })
  var nbt = 'minecraft:written_book[written_book_content={title:"Straja Prison Setup",author:"Straja",pages:[' + snbtPages.join(',') + ']}]'
  ctx.source.server.runCommandSilent('give "' + String(p.getGameProfile().getName()) + '" ' + nbt)
  suSend(ctx.source, Text.literal('§a[Setup] Book given. Open it and click the green buttons.'))
  return 1
}

ServerEvents.commandRegistry(function (event) {
  var Commands = event.commands
  event.register(
    Commands.literal('prisonsetup')
      .requires(function (src) { return src.hasPermission(2) })
      .executes(function (ctx) { return suCmdNext(ctx) })
      .then(Commands.literal('all').executes(function (ctx) { return suCmdAll(ctx) }))
      .then(Commands.literal('book').executes(function (ctx) { return suCmdBook(ctx) }))
      .then(Commands.literal('step')
        .then(Commands.argument('n', $SU_IntegerArgument.integer(1, 99))
          .executes(function (ctx) { return suCmdStep(ctx, $SU_IntegerArgument.getInteger(ctx, 'n')) })))
  )
})
