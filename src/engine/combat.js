import { TYPES, BOSS_NAMES } from '../data/monsters.js';
import { BLUE, BURN_AMT, BURN_EVERY, BURN_N, CHAIN_FRAC, CHAIN_N, COIN_MULT, FREEZE_P, HEAL_AMT, KB_CHANCE, KB_PINK, PINK, POWER, PTYPES, RAINBOW, RAINBOW_P, SLOW_T, SPAWN_P, SPLASH_FRAC, SPLASH_ROWS, YELLOW, TURQUOISE, BROWN, TURQ_FRAC, BROWN_KB, BROWN_SIZE_MULT } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { emptyCells, flyInto, groupCells, primaryGid, randColor, randSprout, resolveMatches, brownSize } from './board.js';
import { TILE_P, mS, mY, spMulNow, spawnMonster, inHexZone } from './monsters.js';
import { CS, FIELD_BOT, FIELD_TOP, G, GY, LANE, W, grid, COLS, walls, FENCE_Y } from './state.js';
import { TAU, clamp, fmt, rnd } from './util.js';
import { lvOf, save, persist } from '../save.js';
import { KILL_REWARD } from '../data/rules.js';
import { GEAR } from '../data/shop.js';
import { toolsForNight, highestOpen } from '../data/worlds/index.js';
import { banner } from '../ui/hud.js';

export function launchGroup(ref){
  if (!ref || !ref.lit || !G || G.over) return;
  const gid = primaryGid(ref), grp = G.groups[gid];
  const bunch = { spawned:false, small:!!grp && grp.size < 3 };   // shared by every projectile of this launch (Purple's one-per-bunch spawn; Turquoise pairs are half power)
  if (!grp) return;
  const cells = groupCells(gid);
  if (!cells.length) return;
  const type = grp.color, lv = lvOf(type), guar = grp.size >= 5;
  for (const { r, c, cell } of cells){
    const x = LANE(c), y = GY + r * CS + CS / 2 + cell.oy;
    G.projs.push({ x, y, vy:-900, type, vis:cell.c, lv, guar, lane:c, hitWalls:new Set(), grp:bunch, size:cell.c === BROWN ? brownSize(cell) : 1, rot:Math.random() * TAU, spin:rnd(8, 12) * (Math.random() < 0.5 ? -1 : 1), hit:new Set(), trail:[], r:16, dead:false });
    grid[r][c] = null;
  }
  SFX.launch(cells.length);
  const skin = save.wardrobe && save.wardrobe.skins[type]; if (skin) SFX.skinLaunch(skin);   // a skin's launch accent, once per flick (owner, 2026-09-27)
  G.throws += cells.length;
  G.idle = 0; G.hint = null;
  resolveMatches();
}

export function damage(m, amt, color, small){
  if (m.dead) return;
  if (m.shield){   // shield knight marching: the hit bounces off
    m.flash = 0.1; addFloat('Blocked', m.x, mY(m) - m.r * mS(m) - 14, '#d8d8e0', 15, 0.6); SFX.monsterHit('knight', true);
    return;
  }
  if (m.colourLock != null && m.lastHit >= 0 && m.lastHit !== m.colourLock){   // chameleon: wrong colour
    m.flash = 0.1; addFloat('Wrong colour', m.x, mY(m) - m.r * mS(m) - 14, PTYPES[m.colourLock].light, 15, 0.7); SFX.monsterHit(m.type, true);
    return;
  }
  if (m.colourImmune != null && m.lastHit === m.colourImmune){   // reverse chameleon: its own colour
    m.flash = 0.1; addFloat('Immune', m.x, mY(m) - m.r * mS(m) - 14, PTYPES[m.colourImmune].light, 15, 0.7); SFX.monsterHit(m.type, true);
    return;
  }
  m.calmT = 0;   // vampires and the Count stop regenerating for a while after any hit
  if (m.healing){   // Vampire Count trance: count the hit
    m.healHits--;
    if (m.healHits <= 0){ m.healing = false; m.stunT = TYPES.vampirecount.stun; addFloat('Trance broken!', m.x, mY(m) - m.r - 34, '#ffd35a', 20, 1.2); ring(m.x, mY(m), 60, 'rgba(255,211,90,.9)'); SFX.bossSfx('vampirecount', 'break'); }
    else { addFloat(`×${m.healHits} more`, m.x, mY(m) - m.r - 34, '#ff6a6a', 16, 0.8); SFX.bossSfx('vampirecount', 'tick'); }
  }
  if (m.carrier){   // wisp rider: the first hit breaks the carrier instead of hurting the rider
    m.carrier = false; m.flash = 0.15; m.sp = TYPES.rider.walkSp * spMulNow() * rnd(0.92, 1.08);
    for (let i = 0; i < 12; i++) spark(m.x, mY(m) - 10, '#cfe8f2', 120); SFX.monsterAct('rider', 'break');
    addFloat('Wisp broken', m.x, mY(m) - m.r - 24, '#cfe8f2', 16, 0.9);
    return;
  }
  m.hp -= amt; m.flash = 0.1;
  addFloat(fmt(amt), m.x + rnd(-8, 8), mY(m) - m.r * mS(m) - 14, color || '#fff', small ? 16 : 23, 0.8);
  if (m.hp <= 0.001) kill(m);
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
  const open = toolsForNight(G.mode === 'story' ? Math.max(G.n, highestOpen()) : highestOpen());
  return GEAR.filter(g => g.consumable && open.includes(g.key) && (save[g.key] || 0) < g.max);
}
export function dropWeapon(m){
  const options = droppableTools();
  const gear = options[Math.floor(Math.random() * options.length)];
  const y = clamp(mY(m), FIELD_TOP + 20, FIELD_BOT - 30);
  G.drops.push({ kind:'weapon', item:gear.key, x:clamp(m.x, 26, W - 26), y, t:0, life:7, ph:Math.random() * TAU, dead:false });
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
  if (m.type !== 'boss' && !m.trueDeath && G.hexZones && G.hexZones.length && inHexZone(m)){   // inside a hex zone: it rises again
    m.hp = 0; m.rise = TYPES.hexwitch.zoneRise; m.eating = false; m.kb = 0; m.burnLeft = 0;
    addFloat('Hexed: it will rise', m.x, mY(m) - m.r - 30, '#d09bff', 16, 1);
    for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#d09bff', 160); SFX.knock();
    return;
  }
  if (m.type === 'firemummy' && m.lastHit !== 2){   // not Ice: it collapses and rises again later
    m.hp = 0; m.rise = TYPES.firemummy.rise; m.eating = false; m.kb = 0; m.burnLeft = 0;
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
  G.kills++; if (!m.minion) G.resolved++;
  G.score += m.pts;
  const reward = m.type === 'boss' ? 'boss' : m.lastHit === YELLOW ? 'gold' : rollReward();
  const y = mY(m), s = mS(m);
  const col = m.tint || { ghoul:'#8fae78', bat:'#5b3a7a', imp:'#e0503a', brute:'#6f8a45', wisp:'#cfe8f2', wraith:'#b8c8d8', rider:'#cfe8f2', doctor:'#4a6a3a', mummy:'#d8cfb0', knight:'#9aa0b0', hauler:'#8a7a6a', gargoyle:'#7a7c86', archer:'#d8d0c0', vampire:'#5a1a2a', crawler:'#3a7a8a', sailor:'#6a5a4a', diver:'#2a6a7a', slime:'#5ad08a', blob:'#7fe0a0', chameleon:'#6ab04a', rchameleon:'#3a3a4a', mirror:'#c8d8f0', firemummy:'#ff8a3a', fogwalker:'#b8c8d8', witch:'#6a3a8a', bulwark:'#8090a8', turtle:'#4a7a5a', boss:'#6a3a7a' }[m.type] || '#aaa';
  for (let i = 0; i < (m.type === 'boss' ? 60 : 16); i++) chunk(m.x, y, col, m.type === 'boss' ? 420 : 220);
  ring(m.x, y, m.r * s * 2.2, 'rgba(255,220,150,.8)');
  if (G.vfx) G.vfx.push({ kind:'pop', m:{ type:m.type, kind:m.kind, ph:m.ph, eating:m.eating, hop:m.hop, tint:m.tint, age:5, rise:0, flash:0, slowT:0, frozenT:0, r:m.r }, x:m.x, y, s, t:0, dur:0.35 });   // the last frame squashes and fades (baked characters only)
  if (reward === 'boss' || reward === 'coins' || reward === 'gold'){
    const mult = reward === 'gold' ? COIN_MULT[(m.lastHitLv || 1) - 1] : 1;
    G.coins += Math.round(m.coins * mult);
    if (reward === 'gold') addFloat(`+${Math.round(m.coins * mult)} coins!`, m.x, y - m.r - 40, '#ffe27a', 18, 1);
    const nc = Math.min(m.coins, m.type === 'boss' ? 12 : 5);
    for (let i = 0; i < nc; i++) G.coinFx.push({ sx:m.x + rnd(-12, 12), sy:y + rnd(-10, 10), t:-i * 0.05, dur:0.65 + Math.random() * 0.2 });
  }
  if (reward === 'boss') dropPumpkins(m, Math.floor(m.drop));
  else if (reward === 'pumpkin') dropPumpkins(m, Math.max(1, Math.round(m.drop)));
  else if (reward === 'weapon') dropWeapon(m);
  SFX.monsterDie(m.type);
  if (m.type === 'slime'){   // splits into blobs
    for (let i = 0; i < TYPES.slime.splits; i++){ const l = Math.max(0, Math.min(COLS - 1, m.lane + (i ? 1 : -1))); const bl = spawnMonster('blob', l, true, Math.max(0, m.p - 0.02)); bl.age = 0.2; }
    addFloat('Split!', m.x, y - 30, '#7fe0a0', 16, 0.9); SFX.monsterAct('slime', 'split');
  }
  if (m.type === 'boss'){
    const twinAlive = m.kind === 'twintides' && m.twin && !m.twin.dead;
    if (!twinAlive){ G.bossDead = true; G.shake = 1.2; banner(`${BOSS_NAMES[m.kind]} ${m.kind === 'twintides' ? 'fall' : 'falls'}!`, 'Finish the stragglers and grab the pumpkins it dropped!', 2.4); SFX.bossSfx(m.kind, 'die'); }
  }
}

export function knockback(m){
  if (m.dead || m.type === 'boss' || m.noKnockback || m.shield) return;
  m.kb = Math.max(m.kb, TILE_P()); m.eating = false;
  ring(m.x, mY(m), 34, 'rgba(255,240,200,.9)');
  SFX.knock();
}

export function hitMonster(pr, m){
  pr.hit.add(m);
  const i = pr.lv - 1, y = mY(m);
  const wc = save.wardrobe && save.wardrobe.costume;   // the worn costume's hit effect (visual only), capped so a big bunch stays cheap
  if (wc && G.vfx && G.vfx.filter(v => v.kind === 'costumeHit').length < 5) { G.vfx.push({ kind:'costumeHit', key:wc, x:m.x, y:y - m.r * .3, t:0, dur:0.75 }); SFX.costumeHit(wc); }
  for (let k = 0; k < 10; k++) chunk(pr.x, pr.y, pr.vis === RAINBOW ? '#f0a020' : PTYPES[pr.vis].base, 200);
  let kb = pr.guar || (pr.type === PINK ? Math.random() < KB_PINK[i] : pr.type === BROWN ? Math.random() < BROWN_KB[i] : (pr.type <= 1 || pr.type >= 4) && Math.random() < KB_CHANCE[i]);
  if (pr.type === 2){
    if (m.type !== 'boss' && Math.random() < FREEZE_P[i]){ m.frozenT = Math.max(m.frozenT, SLOW_T[i]); addFloat('Frozen!', m.x, y - m.r - 34, '#bfefff', 18, 0.9); SFX.freeze(); }
    else m.slowT = Math.max(m.slowT, SLOW_T[i]);
    ring(m.x, y, 42, 'rgba(180,240,255,.9)');
  }
  if (pr.type === 3){ m.burnLeft = Math.max(m.burnLeft, BURN_N[i]); m.burnAmt = Math.max(m.burnAmt, BURN_AMT[i]); m.burnTick = BURN_EVERY; }
  if (m.type === 'mirror' && m.reflecting){   // bounces the pumpkin back down its lane into the wall
    G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:TYPES.mirror.boltSp, dmg:POWER[i], dead:false, mirror:true, vis:pr.vis });
    addFloat('Reflected!', m.x, y - m.r - 24, '#e8f4ff', 16, 0.9); ring(m.x, y, 34, 'rgba(232,244,255,.9)'); SFX.monsterAct('mirror', 'reflect');
    return;
  }
  m.lastHit = pr.type; m.lastHitLv = pr.lv;
  const hitPower = POWER[i] * (pr.type === TURQUOISE && pr.grp && pr.grp.small ? TURQ_FRAC : pr.type === BROWN ? BROWN_SIZE_MULT[pr.size == null ? 1 : pr.size] : 1);   // Turquoise: half; Brown: by size
  damage(m, hitPower, PTYPES[pr.type].spark);
  if (pr.type === PINK){   // Pink: repairs the wall of the column it flew up
    const w = walls[pr.lane]; if (w.hp < w.max){ w.hp = Math.min(w.max, w.hp + HEAL_AMT[i]); addFloat(`Wall +${HEAL_AMT[i]}`, LANE(pr.lane), FENCE_Y - 40, '#ffb3e6', 16, 0.9); SFX.extra('heal'); for (let k = 0; k < 6; k++) spark(LANE(pr.lane), FENCE_Y - 10, '#ffb3e6', 100); }
  }
  if (pr.type === 5 && pr.grp && !pr.grp.spawned){   // Purple: every launched bunch spawns one pumpkin on its first hit
    pr.grp.spawned = true; purpleSpawn(m, y, i);
  }
  if (pr.type === BLUE){   // Deep Blue: lightning runs along the row and strikes up to CHAIN_N monsters (including this one)
    const others = G.monsters.filter(o => o !== m && !o.dead && !o.hidden && o.rise <= 0 && Math.abs(mY(o) - y) < CS * 0.8).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, CHAIN_N[i] - 1);
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
    for (const o of G.monsters.slice()) if (o !== m && !o.dead && !o.hidden && o.rise <= 0 && Math.abs(o.lane - m.lane) <= 1 && Math.abs(mY(o) - y) < reach){ o.lastHit = 7; o.lastHitLv = pr.lv; damage(o, POWER[i] * frac, '#ff9a3a', true); SFX.extra('splash'); if (i >= 4 && !o.dead) knockback(o); }
    for (const w of G.castles) if (!w.dead && Math.abs(w.lane - m.lane) <= 1 && Math.abs(castleY(w) - y) < reach) damageCastle(w, POWER[i] * frac);
  }
  if (kb && !m.dead) knockback(m);
  if (m.dead && pr.type === 5 && Math.random() < SPAWN_P[i]) purpleSpawn(m, y, i);   // Purple: extra spawn per kill
  SFX.pumpkinHit(pr.type, pr.size, pr.vis === RAINBOW);   // pumpkin layer
  if (m.type === 'boss') SFX.bossSfx(m.kind, 'hit'); else SFX.monsterHit(m.type);   // monster layer
  if (pr.type === 4 && pr.hit.size > 1) SFX.extra('pierce');
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
  if (w.hp <= 0.001){ w.dead = true; for (let i = 0; i < 22; i++) chunk(LANE(w.lane), y, i % 2 ? '#8a8d96' : '#55585f', 260); ring(LANE(w.lane), y, 44, 'rgba(220,220,230,.9)'); SFX.wallDown('castle'); G.shake = Math.max(G.shake, 0.5); }
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
