import { TYPES, BOSS_NAMES, ICE_ONLY, HUSK_STRIP } from '../data/monsters.js';
import { BLUE, BURN_AMT, BURN_EVERY, BURN_N, CHAIN_FRAC, CHAIN_N, COIN_MULT, FREEZE_P, HEAL_AMT, KB_CHANCE, KB_PINK, PINK, POWER, PTYPES, RAINBOW, RAINBOW_P, SLOW_T, SPAWN_P, SPLASH_FRAC, SPLASH_ROWS, YELLOW, TURQUOISE, BROWN, TURQ_FRAC, BROWN_KB, BROWN_SIZE_MULT, PAINT, BEIGE } from '../data/pumpkins.js';
import { layGlue } from './glue.js';
import { hkGate, hkAfterHit, onHkFormDown, onKingDown } from './hollowking.js';
import { SFX, musicStart } from './audio.js';
import { MUSIC } from '../data/music.js';
import { emptyCells, flyInto, groupCells, launchGids, primaryGid, randColor, randSprout, resolveMatches, brownSize, paintPull, paintInherit } from './board.js';
import { TILE_P, mS, mY, spMulNow, spawnMonster, inHexZone, stripHusk } from './monsters.js';
import { CS, FIELD_BOT, FIELD_TOP, G, GY, LANE, W, grid, COLS, walls, FENCE_Y } from './state.js';
import { TAU, clamp, fmt, rnd } from './util.js';
import { lvOf, save, persist } from '../save.js';
import { KILL_REWARD, PROTECT_HEAL, ROT_DMG, ROT_HEAL, WART_DMG } from '../data/rules.js';
import { SACK, BOSS_SEED, ENDLESS_BOSS_SEED, CHEST_KILL_CHANCE } from '../data/economy.js';
import { addChest, addSeeds, grant, toolSet } from './loot.js';
import { GEAR } from '../data/shop.js';
import { toolsForNight, highestOpen, progressNight } from '../data/worlds/index.js';
import { banner } from '../ui/hud.js';
import { dropJukebox, jukeboxPoints } from './spawner.js';
import { lightFire } from './fire.js';
import { dropCoffin } from './nightmare.js';
import { reaperFalls, cometBreaks, fpAfterHit, fpReaperHit } from './hollow.js';
import { witchwoodFalls, fhGate, fhAfterHit } from './witchwood.js';
import { shieldedNow, shieldPuff, keepFalls, pieceFalls, knockArcher, archersGuard, siegeFalls, countGate, fcCross, countFalls } from './keep.js';
import { inWartSquare, isProtected } from './gourd.js';
import { ROTTEN, ROT_FX, hitRule } from './rot.js';

/** Release 5: a pumpkin launched from (r, c) inside a Protector Gourd's 3×3 mends its column's fence by PROTECT_HEAL (never above full) and
 *  its projectile carries `ward` (its first monster hit always knocks back; see hitMonsterNow). Returns whether it is warded. */
function wardLaunch(r, c){
  if (!isProtected(r, c)) return false;
  const w = walls[c];
  if (w && w.hp < w.max){
    w.hp = Math.min(w.max, w.hp + PROTECT_HEAL); addFloat(`Wall +${PROTECT_HEAL}`, LANE(c), FENCE_Y - 40, '#f4eedc', 16, 0.9);
    for (let k = 0; k < 5; k++) spark(LANE(c), FENCE_Y - 10, '#f4eedc', 100);
  }
  return true;
}

export function launchGroup(ref){
  if (!ref || !ref.lit || !G || G.over) return;
  const gid = primaryGid(ref), grp = G.groups[gid];
  if (!grp) return;
  // Release 8: a Crookneck square's group goes with every bunch sharing a cell with it (board.js launchGids); bunches claim their cells first,
  // so a Rainbow in a bunch flies as that bunch's colour, and no cell launches twice. Below Release 8 this is the one group.
  const gids = __RELEASE__ >= 8 ? launchGids(gid) : [gid];
  const order = gids.length > 1 ? [...gids.filter(g => !G.groups[g].crook), ...gids.filter(g => G.groups[g].crook)] : gids;
  const seen = new Set(), sets = [];
  for (const g of order){ const own = groupCells(g).filter(o => !seen.has(o.cell)); for (const o of own) seen.add(o.cell); sets.push({ grp:G.groups[g], own, g }); }
  for (const st of sets){ st.pulled = paintPull(st.g, seen); for (const o of st.pulled) seen.add(o.cell); }   // Paint: touching pumpkins of any colour launch with the bunch, each as itself (owner, 2026-10-08)
  const nOwn = sets.reduce((a, st) => a + st.own.length, 0), nPulled = sets.reduce((a, st) => a + st.pulled.length, 0);
  if (!nOwn) return;
  const bunch = { spawned:false, small:nOwn < 3, kills:0 };   // shared by every projectile of this launch (Purple's one-per-bunch spawn; Turquoise pairs are half power)
  const guar = nOwn + nPulled >= 5;   // pulled pumpkins count toward the 5+ knockback (owner)
  const fly = (r, c, cell, type, lv) => {
    const x = LANE(c), y = GY + r * CS + CS / 2 + cell.oy;
    const ward = __RELEASE__ >= 5 && wardLaunch(r, c);   // from a Protector Gourd's square (Release 5)
    const wart = __RELEASE__ >= 7 && inWartSquare(r, c);   // from a Wartling Gourd's square (Release 7): double damage
    G.projs.push({ x, y, vy:-900, type, vis:cell.c, lv, guar, lane:c, hitWalls:new Set(), grp:bunch, size:cell.c === BROWN ? brownSize(cell) : 1, rot:Math.random() * TAU, spin:rnd(8, 12) * (Math.random() < 0.5 ? -1 : 1), hit:new Set(), trail:[], r:16, dead:false, ...(ward ? { ward:true } : {}), ...(wart ? { wart:true } : {}) });
    grid[r][c] = null;
  };
  for (const { grp:gp, own, pulled } of sets){
    if (__RELEASE__ >= 8 && gp.crook){   // a Crookneck group (Release 8): each pumpkin as itself at its own level; a Rainbow as Green
      for (const { r, c, cell } of own){ const t = cell.c === RAINBOW ? 0 : cell.c; fly(r, c, cell, t, lvOf(t)); }
      continue;
    }
    const type = gp.color, lv = __RELEASE__ >= 5 && type === ROTTEN ? 1 : lvOf(type);   // rotten (Release 5) has no level
    const inh = type === PAINT ? paintInherit(pulled) : null;   // Paint takes the power of the colour it borrows most, at Paint's own level (owner, 2026-10-09)
    for (const { r, c, cell } of own) fly(r, c, cell, inh != null ? inh : type, lv);
    for (const { r, c, cell } of pulled){ const o = cell.c === RAINBOW ? type : cell.c; fly(r, c, cell, o, lvOf(o)); }   // a pulled rainbow flies as Paint
  }
  const n = nOwn + nPulled;
  SFX.launch(n);
  const skin = save.wardrobe && save.wardrobe.skins[grp.color]; if (skin) SFX.skinLaunch(skin);   // a skin's launch accent, once per flick (owner, 2026-09-27)
  G.throws += n;
  if (n >= 5) G.q.big++;   // quests: bunches of 5
  G.idle = 0; G.hint = null;
  resolveMatches();
}

export function damage(m, amt, color, small, big){
  if (m.dead) return;
  if (__RELEASE__ >= 8 && shieldedNow(m)){ shieldPuff(m); return; }   // the one shield door (engine/keep.js): red nets, a Bride's veil, the Fallen Count's clamp; every damage source comes through here
  if (__RELEASE__ >= 8 && archersGuard(m)) return;   // a Siege Tower with archers up: only a pumpkin's own hit gets past them, and that knocks one off instead (knockArcher, hitMonsterNow)
  if (m.type === 'jukebox' && m.lastHit === -1){ m.flash = 0.1; addFloat('Pumpkins only', m.x, mY(m) - m.r - 14, '#ffd35a', 15, 0.7); return; }   // tools never hurt the jukebox (owner)
  if (__RELEASE__ >= 5 && m.rotOnly && !rotDmg){ blockedPuff(m); return; }   // only rot can hurt it (Release 5): every other damage (splash, lightning, burn, mines, tools) is refused
  if (m.shield){   // shield knight marching: the hit bounces off
    m.flash = 0.1; addFloat('Blocked', m.x, mY(m) - m.r * mS(m) - 14, '#d8d8e0', 15, 0.6); SFX.monsterHit('knight', true);
    return;
  }
  const alt = m.lastHitAlt != null ? m.lastHitAlt : -1; m.lastHitAlt = -1;   // a Paint pumpkin that inherited a power counts as both colours (owner, 2026-10-09)
  if (m.colourLock != null && m.lastHit >= 0 && m.lastHit !== m.colourLock && alt !== m.colourLock){   // chameleon: wrong colour
    G.q.wrong++;
    m.flash = 0.1; addFloat('Wrong colour', m.x, mY(m) - m.r * mS(m) - 14, PTYPES[m.colourLock].light, 15, 0.7); SFX.monsterHit(m.type, true);
    return;
  }
  if (m.colourImmune != null && (m.lastHit === m.colourImmune || alt === m.colourImmune)){   // reverse chameleon: its own colour (either of Paint's two)
    G.q.wrong++;
    m.flash = 0.1; addFloat('Immune', m.x, mY(m) - m.r * mS(m) - 14, PTYPES[m.colourImmune].light, 15, 0.7); SFX.monsterHit(m.type, true);
    return;
  }
  m.calmT = 0;   // vampires and the Count stop regenerating for a while after any hit
  if (m.healing){   // Vampire Count trance: count the hit
    m.healHits--;
    const fc = __RELEASE__ >= 8 && m.kind === 'fallencount';   // the Fallen Count's blood trance works the same, with his own stun (engine/keep.js)
    if (m.healHits <= 0){ m.healing = false; m.stunT = fc ? TYPES.fallencount.tranceStun : TYPES.vampirecount.stun; addFloat('Trance broken!', m.x, mY(m) - m.r - 34, '#ffd35a', 20, 1.2); ring(m.x, mY(m), 60, 'rgba(255,211,90,.9)'); SFX.bossSfx(fc ? 'fallencount' : 'vampirecount', 'break'); }
    else { addFloat(`×${m.healHits} more`, m.x, mY(m) - m.r - 34, '#ff6a6a', 16, 0.8); SFX.bossSfx(fc ? 'fallencount' : 'vampirecount', 'tick'); }
  }
  if (m.carrier){   // wisp rider: the first hit breaks the carrier instead of hurting the rider
    if (__RELEASE__ >= 5 && m.type === 'comet'){ cometBreaks(m); return; }   // Wisp Rider 2: a plain Wisp and a walking Imp (engine/hollow.js)
    m.carrier = false; m.flash = 0.15; m.sp = TYPES.rider.walkSp * spMulNow() * rnd(0.92, 1.08);
    for (let i = 0; i < 12; i++) spark(m.x, mY(m) - 10, '#cfe8f2', 120); SFX.monsterAct('rider', 'break');
    addFloat('Wisp broken', m.x, mY(m) - m.r - 24, '#cfe8f2', 16, 0.9);
    return;
  }
  if (__RELEASE__ >= 3 && m.kind === 'hollowking' && !m.hkClone){ amt = hkGate(m, amt); if (amt <= 0) return; }   // immune while his form stands
  if (__RELEASE__ >= 7 && m.kind === 'fallenhexwitch'){ amt = fhGate(m, amt); if (amt <= 0) return; }   // the Fallen Hexwitch: immune while her altar stands, never past her next mark (engine/witchwood.js)
  if (__RELEASE__ >= 8 && m.kind === 'fallencount'){ amt = countGate(m, amt); if (amt <= 0) return; }   // a hit stops at his next blood-net mark (engine/keep.js)
  m.hp -= amt; m.flash = 0.1;
  addFloat(fmt(amt), m.x + rnd(-8, 8), mY(m) - m.r * mS(m) - 14, color || '#fff', small ? 16 : big ? 30 : 23, big ? 1 : 0.8);   // big: a Wartling hit (Release 7)
  if (m.hp <= 0.001) kill(m);
  else if (__RELEASE__ >= 3 && m.kind === 'hollowking') hkAfterHit(m);
  else if (__RELEASE__ >= 7 && m.kind === 'fallenhexwitch') fhAfterHit(m);   // a mark reached: her altar rises on this hit
  else if (__RELEASE__ >= 8 && m.kind === 'fallencount') fcCross(m);   // a blood-net mark reached: three red nets at once, so the next hit is refused (engine/keep.js)
  else if (__RELEASE__ >= 5 && m.kind === 'fallenpoltergeist') fpAfterHit(m);   // a reaper mark crossed: its phase starts on this hit (engine/hollow.js)
}

export function dropHop(d){ return d.t < 0.45 ? Math.sin(d.t / 0.45 * Math.PI) * 26 : Math.sin(G.t * 3 + d.ph) * 2; }

export function dropPumpkins(m, n){
  const y = clamp(mY(m), FIELD_TOP + 20, FIELD_BOT - 30);
  for (let i = 0; i < n; i++){
    const x = clamp(m.x + (n > 1 ? (i - (n - 1) / 2) * 34 : 0), 26, W - 26);
    const c = (m.type === 'boss' && i === 0) ? RAINBOW : randSprout();
    G.drops.push({ x, y:y + (i % 2) * 16, c, t:-i * 0.08, life:7, ph:Math.random() * TAU, dead:false });
  }
}

/** Kill-reward roll (docs/WORLDS.md §2): exactly one of weapon / pumpkin / coins. A weapon roll with every
 *  weapon already at its carry limit pays coins instead. */
export function rollReward(){
  const r = Math.random();
  if (r < KILL_REWARD.weapon) return droppableTools().length ? 'weapon' : 'coins';
  if (r < KILL_REWARD.weapon + KILL_REWARD.pumpkin) return 'pumpkin';
  return 'coins';
}
/** Tools that can drop right now: introduced by the current night and below their carry limit. */
function droppableTools(){
  const open = toolsForNight(G.mode === 'story' ? progressNight(G.n) : highestOpen());
  return GEAR.filter(g => g.consumable && open.includes(g.key) && (save[g.key] || 0) < g.max);
}
export function dropWeapon(m){
  const options = droppableTools();
  const gear = options[Math.floor(Math.random() * options.length)];
  const y = clamp(mY(m), FIELD_TOP + 20, FIELD_BOT - 30);
  G.drops.push({ kind:'weapon', item:gear.key, x:clamp(m.x, 26, W - 26), y, t:0, life:7, ph:Math.random() * TAU, dead:false });
}
/** A treasure chest lying on the field (owner, 2026-09-27): tap it to pick it up before it fades. Boss chests are still given at once. */
const CHEST_LIFE = 10;
function dropChest(m, y){ G.drops.push({ kind:'chest', x:clamp(m.x, 30, W - 30), y:clamp(y, FIELD_TOP + 24, FIELD_BOT - 34), t:0, life:CHEST_LIFE, ph:Math.random() * TAU, dead:false }); }
/** Monetization loot (owner's monetization.md): the rare chest, boss seeds and chests, and the Loot Sack's prize. */
function lootOnKill(m, reward, y){
  if (G.mode !== 'story' && reward !== 'sack' && reward !== 'boss') return;   // endless: only its Loot Sacks and bosses give loot
  const pop = (kind, text, col) => { addFloat(text, m.x, y - m.r - 44, col, 19, 1.5); if (G.vfx) G.vfx.push({ kind:'loot', item:kind, x:m.x, y:y - 10, t:0, dur:1.4 }); };
  if (reward === 'sack'){
    const r = Math.random(), D = SACK.drop;
    if (r < D.chest){ dropChest(m, y); addFloat('Treasure chest! Tap it', m.x, y - m.r - 44, '#ffd35a', 19, 1.5); }
    else if (r < D.chest + D.tools){ const set = toolSet(); grant([set]); pop('tools', 'A set of 5 tools!', '#ffd35a'); }
    else { const c = Math.round(rnd(SACK.coins[0], SACK.coins[1])); G.coins += c; pop('coins', `+${c} coins!`, '#ffe27a'); }
    const seeds = SACK.guaranteedSeeds + (Math.random() < SACK.seedChance ? 1 : 0);
    if (seeds > 0) addSeeds(seeds); if (seeds > 0) setTimeout(() => { if (G.vfx) G.vfx.push({ kind:'loot', item:'seed', x:m.x + 30, y:y - 20, t:0, dur:1.4 }); addFloat(`+${seeds} seed${seeds > 1 ? 's' : ''}!`, m.x, y - m.r - 70, '#fff3c8', 18, 1.5); }, 350);
    return;
  }
  if (reward === 'boss'){
    const BS = G.mode === 'endless' ? ENDLESS_BOSS_SEED : BOSS_SEED;   // endless bosses: 50% (owner)
    if (Math.random() < BS.chance){ const n = BS.min + Math.floor(Math.random() * (BS.max - BS.min + 1)); addSeeds(n); pop('seed', `+${n} seed${n > 1 ? 's' : ''}!`, '#fff3c8'); }
    return;   // the boss chest is given once the boss is truly down (see kill)
  }
  // normal nights only: boss nights give their own chest (owner)
  if (!G.chestDropped && !(G.def && G.def.boss) && Math.random() < CHEST_KILL_CHANCE){ G.chestDropped = true; dropChest(m, y); addFloat('Treasure chest! Tap it', m.x, y - m.r - 44, '#ffd35a', 19, 1.5); }
}
export function kill(m){
  if (m.dead) return;
  if (m.type === 'boss' && m.kind === 'twintides' && !m.trueDeath){   // twins: one down alone rises again unless the other falls within the window
    const other = m.twin, T = TYPES.twintides, win = m.form === 2 ? T.form2.window : T.window;
    if (other && !other.dead && other.rise > 0){   // second kill inside the window: both die for real
      m.trueDeath = true; other.trueDeath = true; other.rise = 0;
      kill(other); kill(m); return;
    }
    if (other && !other.dead){
      m.hp = 0; m.rise = win; m.eating = false; m.anim = { clip:'collapse', t:0, dur:0.5 };   // the serpent sinks (render/chars/w5.js)
      addFloat(`Down! ${win}s to fell the other`, m.x, mY(m) - m.r - 34, '#9fe0f0', 18, 1.6);
      for (let i = 0; i < 14; i++) chunk(m.x, mY(m), '#2a7a78', 200); SFX.bossSfx('twintides', 'down');
      return;
    }
    m.trueDeath = true;
  }
  if (m.type !== 'boss' && m.type !== 'jukebox' && !m.trueDeath && G.hexZones && G.hexZones.length && inHexZone(m)){   // inside a hex zone: it rises again
    m.hp = 0; m.rise = TYPES.hexwitch.zoneRise; m.eating = false; m.kb = 0; m.burnLeft = 0;
    addFloat('Hexed: it will rise', m.x, mY(m) - m.r - 30, '#d09bff', 16, 1);
    for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#d09bff', 160); SFX.knock();
    return;
  }
  if (ICE_ONLY.has(m.type) && m.lastHit !== 2){   // not Ice: it collapses and rises again later
    m.hp = 0; m.rise = TYPES[m.type].rise; m.eating = false; m.kb = 0; m.burnLeft = 0;
    addFloat('Down… still burning', m.x, mY(m) - m.r - 30, '#ff8a3a', 16, 1);
    for (let i = 0; i < 10; i++) chunk(m.x, mY(m), '#ff8a3a', 160); SFX.knock();
    return;
  }
  if (m.type === 'mummy' && m.lastHit !== 3){   // not Fire: it collapses and rises again later
    m.hp = 0; m.rise = TYPES.mummy.rise; m.eating = false; m.kb = 0; m.burnLeft = 0;
    addFloat('Down… not out', m.x, mY(m) - m.r - 30, '#d8cfb0', 16, 1);
    for (let i = 0; i < 10; i++) chunk(m.x, mY(m), '#d8cfb0', 160);
    SFX.knock();
    return;
  }
  m.dead = true;
  if (__RELEASE__ >= 4 && m.type === 'rooster') lightFire(m.lane, m.p);   // a Cinder Rooster leaves a fire tile where it falls, whatever killed it
  if (__RELEASE__ >= 5 && m.type === 'reaper') reaperFalls(m);   // a crow bursts out where the Reaper fell (engine/hollow.js)
  if (__RELEASE__ >= 7) witchwoodFalls(m);   // the Flask Bearer's potion, the Cauldron Toad's burst (engine/witchwood.js)
  if (__RELEASE__ >= 8) countFalls(m);   // the Fallen Count's nets, bolt, spears and castle pieces go with him (engine/keep.js)
  if (__RELEASE__ >= 8) siegeFalls(m);   // the Siege Tower's own nets go with it (engine/keep.js)
  if (__RELEASE__ >= 8) keepFalls(m);   // a Glutton's red nets turn ordinary, a Bride's veil comes off (engine/keep.js)
  if (__RELEASE__ >= 4 && m.type === 'casketjack') dropCoffin(m);   // Casket Jack falls into a field coffin with one last mummy in it (engine/nightmare.js)
  if (hitBy){ const b = hitBy.grp; if (b){ b.kills++; if (b.kills > G.q.best) G.q.best = b.kills; } if (hitBy.type === BROWN && hitBy.size === 2) G.q.brown++; }   // quests: kills in one launch, big Brown kills
  G.kills++; if (!m.minion) G.resolved++;
  G.score += m.pts;
  const reward = m.type === 'sack' ? 'sack' : m.type === 'boss' ? 'boss' : (__RELEASE__ >= 4 && TYPES[m.type] && TYPES[m.type].noReward) ? 'none' : m.lastHit === YELLOW ? 'gold' : rollReward();   // none: Casket Jack's field coffin
  const y = mY(m), s = mS(m);
  const col = m.tint || { ghoul:'#8fae78', bat:'#5b3a7a', imp:'#e0503a', brute:'#6f8a45', wisp:'#cfe8f2', wraith:'#b8c8d8', rider:'#cfe8f2', doctor:'#4a6a3a', mummy:'#d8cfb0', knight:'#9aa0b0', hauler:'#8a7a6a', gargoyle:'#7a7c86', archer:'#d8d0c0', vampire:'#5a1a2a', crawler:'#3a7a8a', sailor:'#6a5a4a', diver:'#2a6a7a', slime:'#5ad08a', blob:'#7fe0a0', chameleon:'#6ab04a', rchameleon:'#3a3a4a', mirror:'#c8d8f0', firemummy:'#ff8a3a', fogwalker:'#b8c8d8', witch:'#6a3a8a', bulwark:'#8090a8', turtle:'#4a7a5a', sack:'#b08850', jukebox:'#c0392b', boss:'#6a3a7a', ...(__RELEASE__ >= 7 ? { flaskbearer:'#8a8a92', toad:'#3a3a42', ashcrone:'#5c5c62', covenwitch:'#9a1022', triptych:'#c8ccd8' } : {}) }[m.type] || '#aaa';
  for (let i = 0; i < (m.type === 'boss' ? 60 : 16); i++) chunk(m.x, y, col, m.type === 'boss' ? 420 : 220);
  ring(m.x, y, m.r * s * 2.2, 'rgba(255,220,150,.8)');
  if (__RELEASE__ >= 7 && G.vfx && (m.type === 'flaskbearer' || m.type === 'toad')) G.vfx.push({ kind:'clip', key:m.type, clip:'die', x:m.x, y, s, t:0, dur:m.type === 'toad' ? 0.6 : 0.55 });   // the bottles shatter and it topples / the toad swells and bursts (render/chars/witchwood.js)
  else if (__RELEASE__ >= 8 && G.vfx && m.kind === 'siegetower') G.vfx.push({ kind:'clip', key:'siegetower', clip:'break', n:10, m:{ type:'boss', kind:'siegetower', archers:m.archers || 0 }, x:m.x, y, s, t:0, dur:1 });   // it creaks and comes apart into a heap of timber (render/chars/keep.js)
  else if (__RELEASE__ >= 4 && G.vfx && m.type === 'graveriser') G.vfx.push({ kind:'clip', key:'graveriser', clip:'die', x:m.x, y, s, t:0, dur:0.7 });   // it sinks back into the earth, its hat left on the hole (render/chars/graveriser.js)
  else if (G.vfx) G.vfx.push({ kind:'pop', m:{ type:m.type, kind:m.kind, look:m.look, ph:m.ph, eating:m.eating, hop:m.hop, tint:m.tint, age:5, rise:0, flash:0, slowT:0, frozenT:0, r:m.r }, x:m.x, y, s, t:0, dur:0.35 });   // the last frame squashes and fades (baked characters only)
  if (reward === 'boss' || reward === 'coins' || reward === 'gold'){
    const mult = reward === 'gold' ? COIN_MULT[(m.lastHitLv || 1) - 1] : 1;
    G.coins += Math.round(m.coins * mult);
    if (reward === 'gold') addFloat(`+${Math.round(m.coins * mult)} coins!`, m.x, y - m.r - 40, '#ffe27a', 18, 1);
    const nc = Math.min(m.coins, m.type === 'boss' ? 12 : 5);
    for (let i = 0; i < nc; i++) G.coinFx.push({ sx:m.x + rnd(-12, 12), sy:y + rnd(-10, 10), t:-i * 0.05, dur:0.65 + Math.random() * 0.2 });
  }
  if (reward !== 'none') lootOnKill(m, reward, y);
  if (reward === 'boss') dropPumpkins(m, Math.floor(m.drop));
  else if (reward === 'pumpkin') dropPumpkins(m, Math.max(1, Math.round(m.drop)));
  else if (reward === 'weapon') dropWeapon(m);
  SFX.monsterDie(m.type);
  if (m.type === 'jukebox' && G.jukebox === m){   // the Frenzy is over: no more monsters past the night's total, the night's song comes back
    const more = __RELEASE__ >= 3 && (G.jbNext || 0) < jukeboxPoints(G.def).length;   // 6-19: a halfway jukebox; another comes at the end
    G.jukebox = null; G.jukeboxDone = !more; G.shake = 0.8;
    const bossUp = G.monsters.some(o => o.type === 'boss' && !o.dead);
    banner('The music stops!', more ? 'The night goes on.' : bossUp ? 'Now the boss.' : 'Finish the stragglers.', 2); musicStart(bossUp ? 'boss' : G.def.nightmare ? 'nightmare' : MUSIC['w' + G.def.worldNo] ? 'w' + G.def.worldNo : 'play');   // back to the boss track if a boss is still up
  }
  if (m.type === 'slime'){   // splits into blobs
    for (let i = 0; i < TYPES.slime.splits; i++){ const l = Math.max(0, Math.min(COLS - 1, m.lane + (i ? 1 : -1))); const bl = spawnMonster('blob', l, true, Math.max(0, m.p - 0.02)); bl.age = 0.2; }
    addFloat('Split!', m.x, y - 30, '#7fe0a0', 16, 0.9); SFX.monsterAct('slime', 'split');
  }
  if (__RELEASE__ >= 3 && m.hkClone) onHkFormDown(m);
  if (__RELEASE__ >= 3 && m.kind === 'hollowking' && !m.hkClone) onKingDown();
  if (m.type === 'boss'){
    const twinAlive = G.monsters.some(o => o !== m && o.type === 'boss' && !o.dead);   // the other Twin Tide, or the other boss of a two-boss night
    const levelChest = __RELEASE__ >= 4 ? G.def && G.def.bossChest : null;   // a level that names its boss chest (Release 4: the Strawlord's one normal chest on N1-4 and N1-13) whatever its levelNo
    if (!twinAlive && G.mode === 'story' && G.def && (levelChest || (!G.def.nightmare && (G.def.levelNo === 10 || G.def.levelNo === 20)))){ const itemOf = TYPES[m.kind].noItems ? null : m.kind;   // no costume for the Hollow King yet: boss items become coins; story boss chests only (Release 4: not on a nightmare night, unless the level names one)
      const ck = levelChest || (G.def.levelNo === 20 ? 'boss' : 'normal');
      const nc = __RELEASE__ >= 3 ? (G.def.bossChests || 1) + (G.def.extraChestP && Math.random() < G.def.extraChestP ? 1 : 0) : 1;   // 6-20: 2 chests, 50% a third (owner, 2026-11-03)
      for (let c = 0; c < nc; c++) addChest(ck, itemOf);
      if (nc > 1) addFloat(`${nc} chests!`, m.x, mY(m) - m.r - 100, '#ffd35a', 22, 2.2);
      addFloat(ck === 'boss' ? 'Boss chest!' : 'Treasure chest!', m.x, mY(m) - m.r - 70, '#ffd35a', 22, 2); if (G.vfx) G.vfx.push({ kind:'loot', item:ck === 'boss' ? 'bossChest' : 'chest', x:m.x, y:mY(m) - 20, t:0, dur:1.8 }); }
    const groupDown = m.kind !== 'twintides' || (m.twin && m.twin.dead);   // a whole boss is down (both of a Twin Tides pair)
    if (twinAlive && groupDown && G.def && G.def.boss2){
      G.shake = 1; SFX.bossSfx(m.kind, 'die');
      if (m.kind === 'twintides') banner('One pair falls!', 'One pair left. Monsters keep coming until it falls.', 2.4); else banner(`${BOSS_NAMES[m.kind]} falls!`, 'One boss left. Monsters keep coming until it falls.', 2.4);
      if (G.def.frenzy && G.def.frenzyAfterBoss && !G.jukebox && !G.jukeboxDone) dropJukebox();   // 6-16: the first pair down drops the jukebox
    }
    if (!twinAlive){ G.bossDead = true; G.shake = 1.2; banner(`${BOSS_NAMES[m.kind]} ${m.kind === 'twintides' ? 'fall' : 'falls'}!`, G.mode === 'endless' ? 'The night goes on…' : 'Finish the stragglers and grab the pumpkins it dropped!', 2.4); SFX.bossSfx(m.kind, 'die'); }
  }
}

export function knockback(m){
  if (m.dead || m.type === 'boss' || m.noKnockback || m.shield) return;
  m.kb = Math.max(m.kb, TILE_P()); m.eating = false;
  ring(m.x, mY(m), 34, 'rgba(255,240,200,.9)');
  SFX.knock();
}

/** A launched pumpkin's hit power: Turquoise pairs half, Brown by size (small ×0.5, medium ×1, big ×2). Used for monsters and castle walls. */
export function pumpkinPower(pr){ return POWER[pr.lv - 1] * (pr.type === TURQUOISE && pr.grp && pr.grp.small ? TURQ_FRAC : pr.type === BROWN ? BROWN_SIZE_MULT[pr.size == null ? 1 : pr.size] : 1); }
/** Pink (owner, 2026-09-27): repairs the wall of its column once, as it flies over the fence, whether or not it hits anything. */
export function pinkHeal(pr){
  const i = pr.lv - 1, w = walls[pr.lane]; if (!w || w.hp >= w.max) return;
  G.q.heal++; w.hp = Math.min(w.max, w.hp + HEAL_AMT[i]); addFloat(`Wall +${HEAL_AMT[i]}`, LANE(pr.lane), FENCE_Y - 40, '#ffb3e6', 16, 0.9); SFX.extra('heal');
  for (let k = 0; k < 6; k++) spark(LANE(pr.lane), FENCE_Y - 10, '#ffb3e6', 100);
}
/** A Mirror Sprite's mirror, or a Triptych Sprite's barrier (Release 7, in any of its lanes), sends pumpkin pr back down `lane` into that lane's
 *  fence for its power (it flies from just in front of the reflector, at the Mirror Sprite's bolt speed). Counts for the mirror quests. */
export function reflectPumpkin(pr, m, lane){
  const y = mY(m), x = lane === m.lane ? m.x : LANE(lane);
  G.q.refl++;
  G.arrows.push({ lane, p:m.p + 0.03, sp:TYPES.mirror.boltSp, dmg:POWER[pr.lv - 1], dead:false, mirror:true, vis:pr.vis });
  addFloat('Reflected!', x, y - m.r - 24, '#e8f4ff', 16, 0.9); ring(x, y, 34, 'rgba(232,244,255,.9)'); SFX.monsterAct('mirror', 'reflect');
}
let hitBy = null;   // the pumpkin whose hit is being resolved (quest counters credit its kills)
export function hitMonster(pr, m){ hitBy = pr; try { hitMonsterNow(pr, m); } finally { hitBy = null; } }
function hitMonsterNow(pr, m){
  pr.hit.add(m);
  if (__RELEASE__ >= 5){ const rot = pr.type === ROTTEN, rule = hitRule(m, rot); if (rot || rule === 'blocked'){ rotHitNow(pr, m, rule); return; } }   // a rotten pumpkin, or the wrong kind (Release 5)
  const i = pr.lv - 1, y = mY(m);
  const wc = save.wardrobe && save.wardrobe.costume;   // the worn costume's hit effect (visual only), capped so a big bunch stays cheap
  if (wc && G.vfx && G.vfx.filter(v => v.kind === 'costumeHit').length < 5) { G.vfx.push({ kind:'costumeHit', key:wc, x:m.x, y:y - m.r * .3, t:0, dur:0.75 }); SFX.costumeHit(wc); }
  for (let k = 0; k < 10; k++) chunk(pr.x, pr.y, pr.vis === RAINBOW ? '#f0a020' : PTYPES[pr.vis].base, 200);
  let kb = pr.guar || (pr.type === PINK ? Math.random() < KB_PINK[i] : pr.type === BROWN ? Math.random() < BROWN_KB[i] : (pr.type <= 1 || pr.type >= 4) && Math.random() < KB_CHANCE[i]);
  if (__RELEASE__ >= 5 && pr.ward && !pr.wardHit){ pr.wardHit = true; kb = true; }   // launched from a Protector Gourd's square: its first monster hit always knocks back (bosses and noKnockback stay immune in knockback)
  if (pr.type === 2){
    G.q.chill++;
    if (m.type !== 'boss' && Math.random() < FREEZE_P[i]){ m.frozenT = Math.max(m.frozenT, SLOW_T[i]); addFloat('Frozen!', m.x, y - m.r - 34, '#bfefff', 18, 0.9); SFX.freeze(); }
    else m.slowT = Math.max(m.slowT, SLOW_T[i]);
    ring(m.x, y, 42, 'rgba(180,240,255,.9)');
  }
  if (pr.type === 3){ G.q.burn++; m.burnLeft = Math.max(m.burnLeft, BURN_N[i]); m.burnAmt = Math.max(m.burnAmt, BURN_AMT[i]); m.burnTick = BURN_EVERY; }
  if ((m.type === 'mirror' || (__RELEASE__ >= 7 && m.type === 'triptych')) && m.reflecting){ reflectPumpkin(pr, m, m.lane); return; }   // bounces the pumpkin back down its lane into the wall (a Triptych's barrier is normally met first: game.js)
  m.lastHit = pr.type; m.lastHitLv = pr.lv; m.lastHitAlt = pr.vis === PAINT && pr.type !== PAINT ? PAINT : -1;
  const hitPower = pumpkinPower(pr) * (__RELEASE__ >= 7 && pr.wart ? WART_DMG : 1);   // launched from a Wartling Gourd's square (Release 7): its hit damage doubles; damage() still applies every immunity
  if (__RELEASE__ >= 8 && !shieldedNow(m) && knockArcher(m)) { /* an archer takes the hit: no health lost (engine/keep.js) */ }
  else if (__RELEASE__ >= 4 && HUSK_STRIP[m.type] && !(__RELEASE__ >= 8 && shieldedNow(m))) stripHusk(m);   // a Corn Husker's first hit only takes the husk off (Release 4); a shielded one keeps it: damage() refuses the hit (Release 8)
  else damage(m, hitPower, __RELEASE__ >= 7 && pr.wart ? '#d9b8ff' : PTYPES[pr.type].spark, false, __RELEASE__ >= 7 && pr.wart);
  if (pr.type === 5 && pr.grp && !pr.grp.spawned){   // Purple: every launched bunch spawns one pumpkin on its first hit
    pr.grp.spawned = true; purpleSpawn(m, y, i);
  }
  if (pr.type === BLUE){   // Deep Blue: lightning runs along the row and strikes up to CHAIN_N monsters (including this one)
    const others = G.monsters.filter(o => o !== m && !o.dead && !o.hidden && o.rise <= 0 && !(__RELEASE__ >= 5 && o.rotOnly) && Math.abs(mY(o) - y) < CS * 0.8).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, CHAIN_N[i] - 1);
    let from = m;
    for (const o of others){
      const y1 = mY(from), y2 = mY(o);
      if (G.vfx) G.vfx.push({ kind:'bolt', x1:from.x, y1, x2:o.x, y2, t:0, dur:0.45, seed:Math.floor(Math.random() * 1e6) });   // jagged lightning (render/fx.js)
      for (let k = 0; k < 6; k++) spark(o.x, y2, '#bfe0ff', 160);
      o.lastHit = BLUE; o.lastHitLv = pr.lv; damage(o, POWER[i] * CHAIN_FRAC[i], '#9ab0ff', true); SFX.extra('chain');
      from = o;
    }
  }
  if (pr.type === 7){   // Black: blast the neighbouring lanes at the same height for half power
    for (let k = 0; k < 14; k++) chunk(pr.x, y, k % 2 ? '#ff9a3a' : '#3a3540', 300); G.shake = Math.max(G.shake, 0.4);
    if (G.vfx) G.vfx.push({ kind:'blast', x:pr.x, y, t:0, dur:0.7, r:SPLASH_ROWS[i] === 3 ? CS * 1.5 : CS * 0.95, seed:Math.floor(Math.random() * 1e6) });   // fireball and shockwave (render/fx.js)
    const reach = SPLASH_ROWS[i] === 3 ? CS * 1.6 : CS * 0.7, frac = SPLASH_FRAC[i];
    for (const o of G.monsters.slice()) if (o !== m && !o.dead && !o.hidden && o.rise <= 0 && !(__RELEASE__ >= 5 && o.rotOnly) && Math.abs(o.lane - m.lane) <= 1 && Math.abs(mY(o) - y) < reach){ o.lastHit = 7; o.lastHitLv = pr.lv; damage(o, POWER[i] * frac, '#ff9a3a', true); SFX.extra('splash'); if (i >= 4 && !o.dead) knockback(o); }
    for (const w of G.castles) if (!w.dead && Math.abs(w.lane - m.lane) <= 1 && Math.abs(castleY(w) - y) < reach) damageCastle(w, POWER[i] * frac);
  }
  if (__RELEASE__ >= 3 && pr.type === BEIGE) layGlue(m.lane, m.p, pr.lv);   // Beige: every hit leaves glue where it lands (owner, 2026-11-03; was kills only)
  if (kb && !m.dead) knockback(m);
  if (m.dead && pr.type === 5 && Math.random() < SPAWN_P[i]) purpleSpawn(m, y, i);   // Purple: extra spawn per kill
  SFX.pumpkinHit(pr.type, pr.size, pr.vis === RAINBOW);   // pumpkin layer
  if (m.type === 'boss') SFX.bossSfx(m.kind, 'hit'); else SFX.monsterHit(m.type);   // monster layer
  if (pr.type === 4 && pr.hit.size > 1){ G.q.pierce++; SFX.extra('pierce'); }
}

// ---------- Rotten pumpkins and blocked hits (Release 5; rules in engine/rot.js) ----------

let rotDmg = false;   // a rotten pumpkin's own hit is being dealt: damage() lets it through to a rotOnly monster
/** A grey puff where a hit did nothing (the wrong kind of pumpkin, or any non-rotten damage on a rotOnly monster). */
function blockedPuff(m){
  const y = mY(m); m.flash = 0.08;
  for (let k = 0; k < 6; k++) spark(m.x, y - 6, k % 2 ? '#a8a4ae' : '#d8d6dc', 90);
  ring(m.x, y, 26, 'rgba(200,198,206,.75)');
  SFX.extra('blocked');
}
/** A rotten pumpkin's hit, or a normal one that is 'blocked': ROT_DMG flat ('hurt'), half a hit point back ('heal', never above full), or
 *  nothing ('blocked'). No on-hit power, no knockback (not the 5+ bunch's, not the Protector's ward). Either way the pumpkin is used up there,
 *  Grey's pierce included. */
function rotHitNow(pr, m, rule){
  pr.dead = true;
  if (rule === 'blocked'){ addFloat('Blocked', m.x, mY(m) - m.r * mS(m) - 14, '#c8c6ce', 15, 0.6); blockedPuff(m); return; }
  const y = mY(m);
  for (let k = 0; k < 10; k++) chunk(pr.x, pr.y, k % 3 ? ROT_FX.base : ROT_FX.mould, 180);   // a rotten splat
  m.lastHit = ROTTEN; m.lastHitLv = 1; m.lastHitAlt = -1;
  if (rule === 'hurt'){ const inPhase = __RELEASE__ >= 5 && m.reaper > 0; rotDmg = true; try { damage(m, ROT_DMG, ROT_FX.spark); } finally { rotDmg = false; } if (inPhase) fpReaperHit(m); }   // a Fallen Poltergeist's reaper phase counts each rotten pumpkin (not the hit that crosses a mark and starts it)
  else {
    const was = m.hp; m.hp = Math.min(m.maxHp, m.hp + ROT_HEAL); m.flash = 0.06;
    for (let k = 0; k < 5; k++) spark(m.x, y - 8, ROT_FX.spark, 80);
    if (m.hp > was) addFloat(`+${fmt(m.hp - was)}`, m.x + rnd(-8, 8), y - m.r * mS(m) - 14, '#a6e05a', 18, 0.8);   // a green "+": it fed on the rot
  }
  SFX.pumpkinHit(ROTTEN, 1, false);
  if (m.type === 'boss') SFX.bossSfx(m.kind, 'hit'); else SFX.monsterHit(m.type);
}

// ---------- Effects ----------

export function spark(x, y, color, spd){ if (!G) return; const a = Math.random() * TAU, s = rnd(0.3, 1) * spd; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, t:0, life:rnd(0.3, 0.6), size:rnd(2, 3.5), color, kind:'spark', grav:0 }); }

export function chunk(x, y, color, spd){ const a = Math.random() * TAU, s = rnd(0.3, 1) * spd; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 60, t:0, life:rnd(0.4, 0.8), size:rnd(3, 6), color, kind:'chunk', grav:600, rot:Math.random() * TAU }); }

export function ring(x, y, r, color){ G.parts.push({ x, y, r, t:0, life:0.4, color, kind:'ring' }); }

export function addFloat(text, x, y, color, size, life){ if (!G) return; G.floats.push({ text, x, y, color, size, t:0, life:life || 0.8 }); }

/** Castle walls (world 3): y position and damage. */
export function castleY(w){ return FIELD_TOP + w.p * (FIELD_BOT - FIELD_TOP); }
export function damageCastle(w, amt){
  if (w.dead) return;
  w.hp -= amt; w.flash = 0.12;
  const y = castleY(w);
  addFloat(fmt(amt), LANE(w.lane) + rnd(-8, 8), y - 30, '#d8d0c8', 16, 0.7);
  for (let i = 0; i < 6; i++) chunk(LANE(w.lane), y, '#8a8d96', 160);
  if (w.hp <= 0.001){ w.dead = true; for (let i = 0; i < 22; i++) chunk(LANE(w.lane), y, i % 2 ? '#8a8d96' : '#55585f', 260); ring(LANE(w.lane), y, 44, 'rgba(220,220,230,.9)'); SFX.wallDown('castle'); G.shake = Math.max(G.shake, 0.5); if (__RELEASE__ >= 8 && w.kind && w.kind !== 'wall') pieceFalls(w); }
  else SFX.wallHit('castle');
}

/** Purple spawn: a random loadout pumpkin (or rainbow) flies into a random empty patch cell. */
export function purpleSpawn(m, y, i){
  const empties = emptyCells();
  if (!empties.length) return;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  flyInto(r, c, Math.random() < RAINBOW_P[i] && !(G.mode === 'story' && G.n < 9) ? RAINBOW : randColor(), m.x, y);   // no rainbows before 1-9 (owner)
  addFloat('+1 pumpkin', m.x, y - 40, '#d09bff', 18, 1); SFX.extra('spawn');
}
