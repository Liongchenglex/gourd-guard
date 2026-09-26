import { endGame, shoreP } from './game.js';
import { resolveMatches } from './board.js';
import { TYPES, MODS, VARIANTS } from '../data/monsters.js';
import { BURN_EVERY, RAINBOW } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { chunk, damage, spark, ring, addFloat } from './combat.js';
import { COLS, CS, FENCE_Y, FIELD_BOT, FIELD_TOP, G, LANE, grid, ROWS, GY, walls } from './state.js';
import { clamp, rnd, shuffle } from './util.js';
import { damageWall } from './walls.js';

// ---------- Monsters ----------

export function mY(m){ return FIELD_TOP + clamp(m.p, -0.1, 1.05) * (FIELD_BOT - FIELD_TOP); }

export function mS(m){ return 0.85 + 0.2 * clamp(m.p, 0, 1); }

export const TILE_P = () => CS / (FIELD_BOT - FIELD_TOP);

export function spMulNow(){ return G.mode === 'story' ? G.def.spMul : 0.85 + (G.diff - 1) * 0.015; }

export function hpExtra(){ return G.mode === 'story' ? 0 : Math.min(2, Math.floor((G.diff - 1) / 10)); }

export function lanesOf(m){ return [m.lane]; }

export function pickLane(){
  const busy = new Set(G.monsters.filter(m => m.p < 0.15).map(m => m.lane));
  const wts = (G.def && G.def.laneWeights) || null;
  const all = [...Array(COLS).keys()].filter(l => !wts || wts[l] > 0), free = all.filter(l => !busy.has(l));
  const arr = free.length ? free : all;
  if (!wts) return arr[Math.floor(Math.random() * arr.length)];
  let tot = 0; for (const l of arr) tot += wts[l];
  let r = Math.random() * tot; for (const l of arr){ r -= wts[l]; if (r <= 0) return l; }
  return arr[arr.length - 1];
}

/** Resolve a pool key (type, variant or 'boss') into { type, kind, T, variant }. */
export function resolveMonster(key){
  if (key === 'boss'){
    const kind = G.mode === 'story' && G.def.boss ? G.def.boss : 'gravekeeper';
    return { type:'boss', kind, T:TYPES[kind], variant:null };
  }
  const v = VARIANTS[key];
  if (v) return { type:v.base, kind:v.base, T:TYPES[v.base], variant:v };
  return { type:key, kind:key, T:TYPES[key], variant:null };
}
export function spawnMonster(key, lane, minion, p){
  const { type, kind, T, variant } = resolveMonster(key);
  const mod = variant ? MODS[variant.mod] : null;
  if (type === 'boss' && kind === 'twintides' && !minion){   // the twins spawn as a pair on the sea row
    const lanes = shuffle([...Array(COLS).keys()]).slice(0, 2);
    const a = spawnMonster('boss', lanes[0], true, p), b = spawnMonster('boss', lanes[1], true, p);
    a.minion = b.minion = false; a.twin = b; b.twin = a;
    return a;
  }
  let puddle = null;
  const seaEdge = shoreP();
  if (type === 'diver' && seaEdge > 0.05 && p == null && Math.random() < 0.5){   // divers may lurk anywhere in the sea
    puddle = { lane:lane != null ? lane : pickLane(), p:rnd(0.02, seaEdge - 0.03) }; lane = puddle.lane; p = puddle.p;
  } else if ((type === 'crawler' || type === 'diver' || type === 'turtle') && G.puddles && G.puddles.length && p == null){   // rise from a random puddle
    puddle = G.puddles[Math.floor(Math.random() * G.puddles.length)];
    lane = puddle.lane; p = puddle.p;
  }
  if (p == null && type !== 'boss' && G.def && G.def.shore) p = seaEdge - 0.02;   // shoreline levels: everything else surfaces at the water's edge
  let hp = T.hp + (type === 'imp' || type === 'brute' || type === 'wisp' ? hpExtra() : 0) + (mod && mod.hp ? mod.hp : 0);
  const form = type === 'boss' ? (G.mode === 'story' ? (G.def.bossForm || 1) : (G.world >= 1 ? 2 : 1)) : 1;
  if (type === 'boss') hp = form === 2 ? T.form2.hp : T.hp + (G.mode === 'endless' ? 4 * G.world : 0);
  if (lane == null) lane = pickLane();
  const x = LANE(lane);
  const m = { type, kind, lane, x, tx:x, p:p != null ? p : -0.02, hp, maxHp:hp, r:T.r, hw:CS * 0.42, form,
    variant:variant ? variant.name : null, tint:variant ? variant.tint : null, noKnockback:!!(mod && mod.noKnockback),
    sp:T.sp * spMulNow() * rnd(0.92, 1.08) * (mod && mod.speed ? mod.speed : 1), coins:T.coins, eat:T.eat * (mod && mod.eat ? mod.eat : 1), pts:T.pts, drop:T.drop, ph:Math.random() * 10, age:0, flash:0,
    slowT:0, frozenT:0, burnLeft:0, burnAmt:0, burnTick:0, kb:0, eating:false, dead:false, minion:!!minion, summon:4, hop:0, drift:rnd(2.5, 4.5), rise:0, lastHit:null,
    hold:T.hold || 1, teleport:T.teleportEvery || 0, shove:form === 2 && T.form2 && T.form2.shoveEvery ? T.form2.shoveEvery : 0,
    hidden:false, vanish:T.show || 0, carrier:type === 'rider', healT:T.healEvery || 0,
    driftT:T.driftEvery || 0, swapT:T.swapEvery || 0, recolourT:form === 2 && T.form2 && T.form2.recolourEvery ? T.form2.recolourEvery : 0,
    phase:'move', phaseT:T.move || 0, shield:type === 'knight', gargs:null, freed:false, shootT:T.shootEvery || 0, calmT:0, regenT:0,
    laneT:T.laneEvery || 0, batsT:T.batsEvery || 0, wallT:T.wallEvery || 0, healT:T.healEvery || 0, healing:false, healHits:0, stunT:0,
    puddle, staggerT:T.stagger ? rnd(T.stagger[0], T.stagger[1]) : 0, lurch:1, upT:T.up || 0, boltT:T.boltEvery || 0, twin:null, trueDeath:false,
    colourLock:null, colourImmune:null, reflecting:false, mirrorT:T.open || 0, hexT:T.hexEvery || 0, zoneT:T.zoneEvery || 0, bulk:1 };
  if (T.noKnockback) m.noKnockback = true;
  if (form === 2 && T.form2 && T.form2.hold != null) m.hold = T.form2.hold;
  if (G.def && G.def.hexAll && type !== 'boss' && type !== 'chameleon' && type !== 'rchameleon') hexMonster(m, G.def.hexAll === 'reverse', true);
  if (type === 'turtle' && !puddle && G.puddles && G.puddles.length && p == null){ const pd = G.puddles[Math.floor(Math.random() * G.puddles.length)]; m.lane = pd.lane; m.x = m.tx = LANE(pd.lane); m.p = pd.p; }
  if (type === 'chameleon' || type === 'rchameleon'){   // takes one of the player's colours
    const pool = (G.loadout || [0, 1]).filter(t => t !== RAINBOW);
    const col = pool[Math.floor(Math.random() * pool.length)];
    if (type === 'chameleon') m.colourLock = col; else m.colourImmune = col;
  }
  if (type === 'diver'){
    if (puddle){ m.hidden = true; m.upT = T.down; }        // starts submerged, surfaces after `down`
    else { m.sp = 0.04 * spMulNow(); m.walker = true; }    // no puddles on this level: it just walks in
  }
  if (puddle){ for (let i = 0; i < 12; i++) spark(m.x, mY(m), '#7fd0e8', 120); if (type !== 'diver') SFX.monsterAct(type, 'rise'); }
  else if (G.def && G.def.sea && m.p <= 0 && type !== 'boss') for (let i = 0; i < 10; i++) spark(m.x, FIELD_TOP + 8, '#9fe0f0', 100);
  if (type === 'hauler'){   // its gargoyles walk ahead of it in the same lane
    m.gargs = [];
    for (let i = 0; i < T.push; i++) m.gargs.push(spawnMonster('gargoyle', lane, true, m.p + 0.07 * (i + 1)));
  }
  if (type === 'vampire'){   // ringed by bats: left, right, ahead and behind
    const spots = [[lane - 1, 0], [lane + 1, 0], [lane, 0.06], [lane, -0.06]];
    for (const [l, dp] of spots.slice(0, T.bats)) spawnMonster('bat', Math.max(0, Math.min(COLS - 1, l)), true, Math.max(-0.02, m.p + dp));
  }
  G.monsters.push(m);
  return m;
}

export function aheadLimit(m){
  let limit = 1;
  const myLanes = lanesOf(m);
  for (const o of G.monsters){
    if (o === m || o.dead || o.p <= m.p || o.eating) continue;   // a monster already at the wall does not block the queue: everyone gets to chew
    if (!lanesOf(o).some(l => myLanes.includes(l))) continue;
    limit = Math.min(limit, o.p - (m.r + o.r) * 0.75 / (FIELD_BOT - FIELD_TOP));
  }
  return limit;
}

/** Short puff of dust/particles where the Gravekeeper vanishes or appears. */
function puff(x, y){ for (let i = 0; i < 14; i++) spark(x, y, i % 2 ? '#c9b6ff' : '#5a3a7a', 150); ring(x, y, 30, 'rgba(200,170,255,.8)'); }
export function updateMonster(m, dt){
  m.age += dt; m.ph += dt;
  if (m.flash > 0) m.flash -= dt;
  if (m.rise > 0){   // collapsed mummy: lies still, untargetable, then stands back up at full health
    m.rise -= dt;
    if (m.rise <= 0){ m.rise = 0; m.hp = (m.type === 'mummy' || m.type === 'firemummy') ? 1 : m.maxHp; m.flash = 0.2; addFloat('Rises again', m.x, mY(m) - m.r - 30, '#d8cfb0', 16, 0.9); if (m.type === 'boss') SFX.bossSfx(m.kind, 'revive'); else SFX.monsterAct('mummy', 'rise'); }   // mummies come back with 1 HP (owner)
    return;
  }
  let sp = m.sp;
  if (m.frozenT > 0){ m.frozenT -= dt; sp = 0; }
  else if (m.slowT > 0){ m.slowT -= dt; sp *= 0.5; }
  if ((m.frozenT > 0 || m.slowT > 0) && Math.random() < dt * 5) G.parts.push({ x:m.x + rnd(-m.r, m.r), y:mY(m) + rnd(-m.r, m.r), vx:0, vy:20, t:0, life:0.8, size:2.5, color:'#bfefff', kind:'dot', grav:0 });
  if (m.burnLeft > 0){
    m.burnTick -= dt;
    if (Math.random() < dt * 16) G.parts.push({ x:m.x + rnd(-m.r * 0.6, m.r * 0.6), y:mY(m) + rnd(-4, 10), vx:rnd(-10, 10), vy:-rnd(50, 90), t:0, life:0.5, size:rnd(3, 6), color:'#ff8a3a', kind:'flame', grav:0 });
    if (m.burnTick <= 0){ m.burnLeft--; m.burnTick = BURN_EVERY; m.lastHit = 3; SFX.extra('burn'); damage(m, m.burnAmt, '#ff9a4a', true); if (m.dead) return; }
  }
  if (m.kb > 0){
    const st = Math.min(m.kb, dt * 2.2);
    m.p = Math.max(-0.05, m.p - st); m.kb -= st;
    return;
  }
  if (m.eating){
    m.shield = false;   // a shield knight lowers its shield to chew
    m.reflecting = false;   // a mirror sprite drops its mirror to chew
    const mul = m.frozenT > 0 ? 0 : m.slowT > 0 ? 0.5 : 1;
    if (walls[m.lane].hp <= 0){   // the wall is down: it walks through the gap; the night is lost when it is in
      m.breach = (m.breach || 0) + dt * mul;
      m.p = Math.min(1.05, 1 + m.breach * 0.04); SFX.alarm();
      if (m.breach >= 1.2 && !G.over){ G.brokeAt = m.lane; endGame(false); }
      return;
    }
    m.breach = 0;
    const eaters = G.monsters.filter(o => !o.dead && o.eating && o.lane === m.lane), k = eaters.indexOf(m);
    m.x = m.tx + (k - (eaters.length - 1) / 2) * 15;   // chewers share the wall side by side
    for (const c of lanesOf(m)) damageWall(c, m.eat * mul * dt);
    if (mul > 0){ SFX.chew(m.type); if (Math.random() < dt * 5) chunk(m.x + rnd(-10, 10), FENCE_Y - 18, '#8a6440', 90); }
    return;
  }
  if (m.frozenT <= 0){
    switch (m.type){
      case 'bat': m.x = m.tx + Math.sin(m.ph * 3) * 6; break;
      case 'imp': { const h = Math.max(0, Math.sin(m.ph * 4.5)); sp *= 0.25 + 2.2 * h; m.hop = h; m.x = m.tx; break; }
      case 'wisp':
        m.drift -= dt;
        if (m.drift <= 0 && m.p > 0.05 && m.p < 0.85){
          m.drift = rnd(3.2, 5);
          const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
          m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
        }
        m.x += (m.tx - m.x) * Math.min(1, dt * 3.5);
        break;
      case 'wraith': {   // fades out for T.hide seconds every T.show seconds; keeps walking, cannot be seen or hit
        m.vanish -= dt;
        if (m.vanish <= 0 && m.p > 0.05 && m.p < 0.9){
          m.hidden = !m.hidden; m.vanish = m.hidden ? TYPES.wraith.hide : TYPES.wraith.show; SFX.monsterAct('wraith', m.hidden ? 'vanish' : 'return');
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#cfe8f2', 90);
        }
        if (m.hidden && m.p >= 0.9){ m.hidden = false; m.vanish = TYPES.wraith.show; }
        m.x = m.tx + Math.sin(m.ph * 1.2) * 3;
        break;
      }
      case 'rider': m.x = m.tx + (m.carrier ? Math.sin(m.ph * 4) * 5 : 0); break;
      case 'knight': {   // march / rest cycle; shield up while marching
        m.phaseT -= dt;
        if (m.phaseT <= 0){ m.phase = m.phase === 'move' ? 'stop' : 'move'; m.phaseT = m.phase === 'move' ? TYPES.knight.move : TYPES.knight.stop; }
        m.shield = m.phase === 'move' && !m.eating;
        if (m.phase === 'stop') sp = 0;
        break;
      }
      case 'hauler': {
        if (!m.freed && m.gargs && m.gargs.every(g => g.dead)){ m.freed = true; m.sp = TYPES.hauler.freeSp * spMulNow(); addFloat('Unburdened!', m.x, mY(m) - m.r - 26, '#ffd35a', 16, 1); SFX.monsterAct('hauler', 'freed'); }
        m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
        break;
      }
      case 'archer': {   // holds near the top and shoots arrows down its lane
        if (m.p >= TYPES.archer.hold){
          sp = 0; m.shootT -= dt;
          if (m.shootT <= 0 && walls[m.lane].hp > 0){ m.shootT = TYPES.archer.shootEvery; G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:0.4, dmg:TYPES.archer.arrow, dead:false }); SFX.monsterAct('archer', 'shoot'); }   // holds fire at a wall that is already down
        }
        break;
      }
      case 'sailor': {   // staggers between lanes and lurches at uneven speed
        m.staggerT -= dt;
        if (m.staggerT <= 0){
          m.staggerT = rnd(TYPES.sailor.stagger[0], TYPES.sailor.stagger[1]);
          m.lurch = rnd(0.3, 1.7);
          if (m.p > 0.03 && m.p < 0.9 && Math.random() < 0.7){
            const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
            m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
          }
        }
        sp *= m.lurch;
        m.x += (m.tx - m.x) * Math.min(1, dt * 4);
        break;
      }
      case 'diver': {   // surfaces from its puddle to hurl a bolt, then hides again
        if (m.walker) break;
        sp = 0;
        m.upT -= dt;
        if (m.upT <= 0){
          m.hidden = !m.hidden;
          m.upT = m.hidden ? TYPES.diver.down : TYPES.diver.up; SFX.monsterAct('diver', m.hidden ? 'submerge' : 'surface');
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#7fd0e8', 110);
          if (!m.hidden && walls[m.lane].hp > 0){ G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:TYPES.diver.boltSp, dmg:TYPES.diver.bolt, dead:false, water:true }); SFX.monsterAct('diver', 'bolt'); }
        }
        break;
      }
      case 'firemummy': {   // sets ordinary mummies alight as it passes
        for (const o of G.monsters) if (o.type === 'mummy' && !o.dead && o.rise <= 0 && Math.abs(o.lane - m.lane) <= 1 && Math.abs(o.p - m.p) < TILE_P()){
          o.type = 'firemummy'; o.flash = 0.3; addFloat('Alight!', o.x, mY(o) - o.r - 24, '#ff8a3a', 16, 0.9); SFX.monsterAct('firemummy', 'ignite'); for (let i = 0; i < 10; i++) spark(o.x, mY(o), '#ff8a3a', 120);
        }
        if (Math.random() < dt * 14) G.parts.push({ x:m.x + rnd(-m.r * 0.6, m.r * 0.6), y:mY(m) + rnd(-10, 6), vx:rnd(-10, 10), vy:-rnd(50, 90), t:0, life:0.5, size:rnd(3, 6), color:'#ff8a3a', kind:'flame', grav:0 });
        m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
        break;
      }
      case 'witch': {   // hexes one monster at a time
        m.hexT -= dt;
        if (m.hexT <= 0 && m.p > 0.05){
          m.hexT = TYPES.witch.hexEvery;
          const pick = G.monsters.filter(o => o !== m && !o.dead && o.type !== 'boss' && o.type !== 'chameleon' && o.type !== 'rchameleon' && o.rise <= 0 && o.p > 0);   // anything but bosses and true chameleons; may re-hex an already hexed monster; witches hex each other (owner)
          if (pick.length){ const o = pick[Math.floor(Math.random() * pick.length)]; hexBolt(m, o); hexMonster(o, Math.random() >= TYPES.witch.chameleonChance); SFX.monsterAct('witch', 'hex'); }
        }
        m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
        break;
      }
      case 'mirror': {   // mirror up / mirror down cycle
        m.mirrorT -= dt;
        if (m.mirrorT <= 0){ m.reflecting = !m.reflecting; m.mirrorT = m.reflecting ? TYPES.mirror.reflect : TYPES.mirror.open; if (m.reflecting) SFX.monsterAct('mirror', 'up'); }
        m.x = m.tx + Math.sin(m.ph * 2) * 3;
        break;
      }
      case 'vampire': {   // heals when left alone
        m.calmT += dt;
        if (m.calmT >= TYPES.vampire.calm && m.hp < m.maxHp){
          m.regenT -= dt;
          if (m.regenT <= 0){ m.regenT = TYPES.vampire.regenEvery; m.hp = Math.min(m.maxHp, m.hp + TYPES.vampire.regen); SFX.monsterAct('vampire', 'heal'); addFloat('+' + TYPES.vampire.regen, m.x, mY(m) - m.r - 20, '#ff6a6a', 14, 0.7); }
        }
        m.x = m.tx + Math.sin(m.ph * 1.2) * 3;
        break;
      }
      case 'doctor': {   // heals every other monster in its column
        m.healT -= dt;
        if (m.healT <= 0 && m.p > 0.05){
          m.healT = TYPES.doctor.healEvery;
          const reach = 1.5 * TILE_P();   // 3 lanes × 3 tile heights around the doctor
          for (const o of G.monsters) if (o !== m && !o.dead && Math.abs(o.lane - m.lane) <= 1 && Math.abs(o.p - m.p) <= reach && o.rise <= 0 && o.hp < o.maxHp){
            o.hp = Math.min(o.maxHp, o.hp + TYPES.doctor.heal); addFloat('+' + TYPES.doctor.heal, o.x, mY(o) - o.r - 20, '#9fe07a', 14, 0.7);
          }
          ring(m.x, mY(m), 40, 'rgba(160,230,120,.8)'); SFX.monsterAct('doctor', 'heal');
        }
        break;
      }
      case 'boss': {
        if (m.kind === 'poltergeist'){ updatePoltergeist(m, dt); if (m.p >= m.hold) sp = 0; break; }
        if (m.kind === 'vampirecount'){ if (updateVampireCount(m, dt) || m.p >= m.hold) sp = 0; break; }
        if (m.kind === 'hexwitch'){ updateHexwitch(m, dt); if (m.p >= m.hold) sp = 0; break; }
        if (m.kind === 'twintides'){   // sits on the sea row and hurls water bolts at random walls
          if (m.p >= m.hold) sp = 0;
          if (m.p > 0.05){
            m.boltT -= dt;
            if (m.boltT <= 0){
              const T = TYPES.twintides;
              m.boltT = m.form === 2 ? T.form2.boltEvery : T.boltEvery;
              const standing = [...Array(COLS).keys()].filter(l => walls[l].hp > 0);
              if (standing.length){   // a tail rises from the water in any column and hurls the bolt from there
                const lane = standing[Math.floor(Math.random() * standing.length)], p0 = Math.max(0.04, shoreP() - 0.03);
                G.tails.push({ lane, p:p0, t:0.9 });
                G.arrows.push({ lane, p:p0, sp:m.form === 2 ? T.form2.boltSp : T.boltSp, dmg:T.bolt, dead:false, water:true });
                for (let i = 0; i < 12; i++) spark(LANE(lane), FIELD_TOP + p0 * (FIELD_BOT - FIELD_TOP), '#9fe0f0', 160);
              }
              SFX.bossSfx('twintides', 'bolt');
            }
          }
          m.x = m.tx + Math.sin(m.ph * 1.4) * 4;
          break;
        }
        // Gravekeeper (docs/WORLDS.md §7): holds position, teleports between lanes, raises ghouls; form 2 shoves monsters forward
        const T = TYPES.gravekeeper;
        if (m.p >= m.hold) sp = 0;
        if (m.p > 0.05){
          m.summon -= dt;
          if (m.summon <= 0){
            m.summon = m.form === 2 ? T.form2.summonEvery : T.summonEvery;
            const g = spawnMonster('ghoul', pickLane(), true, Math.max(0, m.p - 0.02));
            puff(g.x, mY(g)); SFX.bossSfx('gravekeeper', 'summon');
          }
          m.teleport -= dt;
          if (m.teleport <= 0){
            m.teleport = T.teleportEvery; SFX.bossSfx('gravekeeper', 'teleport');
            const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
            puff(m.x, mY(m));
            m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); m.age = 0;
            puff(m.x, mY(m));
          }
          if (m.form === 2){
            m.shove -= dt;
            if (m.shove <= 0){
              m.shove = T.form2.shoveEvery;
              const pick = G.monsters.filter(o => o !== m && !o.dead && o.rise <= 0 && !o.eating && o.p > 0 && o.p < 0.6);
              if (pick.length){ const o = pick[Math.floor(Math.random() * pick.length)]; ring(o.x, mY(o), 36, 'rgba(200,170,255,.9)'); o.p = Math.min(0.95, o.p + T.form2.shove); ring(o.x, mY(o), 36, 'rgba(200,170,255,.9)'); SFX.bossSfx('gravekeeper', 'shove'); }
            }
          }
        }
        break;
      }
      default: m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
    }
  }
  let np = Math.min(m.p + sp * dt, aheadLimit(m));
  if (m.chewing && !m.chewing.dead) np = Math.min(np, m.chewing.p);   // held at a scarecrow
  if (np > m.p) m.p = np;
  if (m.p >= 1){ m.p = 1; m.eating = true; }
}

/** The Poltergeist (world 2 boss): drifts between neighbouring lanes, swaps two pumpkins every few seconds; form 2 also recolours one. */
function updatePoltergeist(m, dt){
  const T = TYPES.poltergeist;
  m.x += (m.tx - m.x) * Math.min(1, dt * 2.5);
  if (m.p < 0.05) return;
  m.driftT -= dt;
  if (m.driftT <= 0){
    m.driftT = T.driftEvery;
    const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
    m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
  }
  m.swapT -= dt;
  if (m.swapT <= 0){
    m.swapT = m.form === 2 ? T.form2.swapEvery : T.swapEvery;
    const cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && !grid[r][c].fly) cells.push([r, c]);
    const k = m.form === 2 ? 3 : 2;   // form 2 juggles three pumpkins at once (owner)
    if (cells.length >= k){
      const picks = shuffle(cells.slice()).slice(0, k), moved = picks.map(([r, c]) => grid[r][c]);
      for (let q = 0; q < k; q++){   // each pumpkin moves to the next picked cell
        const [r0, c0] = picks[q], [r1, c1] = picks[(q + 1) % k], cell = moved[q];
        grid[r1][c1] = cell; cell.fly = 0.55; cell.ox = LANE(c0) - LANE(c1); cell.oy = (r0 - r1) * CS;
        ring(LANE(c1), GY + r1 * CS + CS / 2, 30, 'rgba(200,220,255,.9)');
      }
      addFloat('Swapped!', m.x, mY(m) - m.r - 30, '#cfe8f2', 16, 0.9);
      SFX.bossSfx('poltergeist', 'swap');
      setTimeout(resolveMatches, 600);
    }
  }
  if (m.recolourT > 0 || (m.form === 2 && m.recolourT === 0)){
    if (m.form === 2){
      m.recolourT -= dt;
      if (m.recolourT <= 0){
        m.recolourT = T.form2.recolourEvery;
        const cells = [];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const x = grid[r][c]; if (x && !x.fly && x.c !== RAINBOW) cells.push(x); }
        if (cells.length && G.loadout.length > 1){
          for (const cell of shuffle(cells.slice()).slice(0, 3)){   // three repaints in form 2 (owner)
            const others = G.loadout.filter(t => t !== cell.c);
            cell.c = others[Math.floor(Math.random() * others.length)]; cell.pop = 1;
          }
          addFloat('Repainted!', m.x, mY(m) - m.r - 30, '#cfe8f2', 16, 0.9); SFX.bossSfx('poltergeist', 'repaint');
          resolveMatches();
        }
      }
    }
  }
}

/** The Vampire Count (world 3 boss). Returns true while it must stand still (healing trance or stun). */
function updateVampireCount(m, dt){
  const T = TYPES.vampirecount;
  if (m.stunT > 0){ m.stunT -= dt; return true; }
  if (m.healing){ m.hp = Math.min(m.maxHp, m.hp + T.healRate * dt); m.pulseT = (m.pulseT || 0) - dt; if (m.pulseT <= 0){ m.pulseT = 0.9; SFX.bossSfx('vampirecount', 'pulse'); } return true; }
  if (m.p < 0.05) return false;
  if (m.form === 2){   // full form also heals when left alone
    m.calmT += dt;
    if (m.calmT >= T.form2.calm && m.hp < m.maxHp){
      m.regenT -= dt;
      if (m.regenT <= 0){ m.regenT = T.form2.regenEvery; m.hp = Math.min(m.maxHp, m.hp + T.form2.regen); addFloat('+' + T.form2.regen, m.x, mY(m) - m.r - 30, '#ff6a6a', 14, 0.7); }
    }
  }
  m.laneT -= dt;
  if (m.laneT <= 0){   // bursts into bats and reforms in another lane
    m.laneT = T.laneEvery; SFX.bossSfx('vampirecount', 'burst');
    const opts = [...Array(COLS).keys()].filter(l => l !== m.lane);
    for (let i = 0; i < 16; i++) spark(m.x, mY(m), i % 2 ? '#3a1a2a' : '#8a5aa8', 160);
    m.lane = opts[Math.floor(Math.random() * opts.length)]; m.x = m.tx = LANE(m.lane); m.age = 0.2;
    for (let i = 0; i < 16; i++) spark(m.x, mY(m), i % 2 ? '#3a1a2a' : '#8a5aa8', 160);
  }
  m.batsT -= dt;
  if (m.batsT <= 0){
    m.batsT = m.form === 2 ? T.form2.batsEvery : T.batsEvery;
    for (let i = 0; i < T.bats; i++) spawnMonster('bat', pickLane(), true, Math.max(0, m.p - 0.02));
    SFX.bossSfx('vampirecount', 'bats');
  }
  m.wallT -= dt;
  if (m.wallT <= 0){
    m.wallT = T.wallEvery;
    if (G.castles.filter(w => !w.dead).length < T.maxWalls){
      const used = new Set(G.castles.filter(w => !w.dead).map(w => w.lane));
      const free = [...Array(COLS).keys()].filter(l => !used.has(l));
      if (free.length){ const lane = free[Math.floor(Math.random() * free.length)]; const whp = G.mode === 'story' && G.def.castles ? G.def.castles.hp : T.wallHp;
      G.castles.push({ lane, p:rnd(0.45, 0.7), hp:whp, maxHp:whp, flash:0, dead:false }); ring(LANE(lane), FIELD_TOP + 0.55 * (FIELD_BOT - FIELD_TOP), 40, 'rgba(200,180,220,.9)'); addFloat('A wall rises', m.x, mY(m) - m.r - 30, '#d8cfe0', 16, 1); SFX.bossSfx('vampirecount', 'wall'); }
    }
  }
  m.healT -= dt;
  if (m.healT <= 0){   // healing trance: the player must land N hits to break it
    m.healT = m.form === 2 ? T.form2.healEvery : T.healEvery;
    m.healing = true; m.healHits = T.healHits[Math.floor(Math.random() * T.healHits.length)];
    addFloat(`Healing: hit it ×${m.healHits}`, m.x, mY(m) - m.r - 34, '#ff6a6a', 18, 1.4); SFX.bossSfx('vampirecount', 'trance');
    return true;
  }
  return false;
}

/** A crackling purple bolt from a witch to the monster it hexes (owner: hexes should zap and show lightning). */
function hexBolt(from, o){
  const y1 = mY(from), y2 = mY(o), n = 8;
  for (let k = 0; k <= n; k++){ const f = k / n; G.parts.push({ x:from.x + (o.x - from.x) * f + rnd(-9, 9), y:y1 + (y2 - y1) * f + rnd(-9, 9), vx:0, vy:0, t:0, life:0.45, size:5, color:k % 2 ? '#d09bff' : '#f0e0ff', kind:'dot', grav:0 }); }
  ring(o.x, y2, 32, 'rgba(208,155,255,.9)');
}

/** Turn a monster into a chameleon (or, with `reverse`, a reverse chameleon) of a random loadout colour. */
export function hexMonster(o, reverse, quiet){
  const pool = (G.loadout || [0, 1]).filter(t => t !== RAINBOW);
  const col = pool[Math.floor(Math.random() * pool.length)];
  if (reverse){ o.colourImmune = col; o.colourLock = null; } else { o.colourLock = col; o.colourImmune = null; }
  if (quiet) return;
  ring(o.x, mY(o), 36, 'rgba(210,120,255,.9)'); addFloat('Hexed!', o.x, mY(o) - o.r - 24, '#d09bff', 16, 0.9);
}
/** The Hexwitch (world 3 boss): drifts between lanes, hexes 2–3 monsters into chameleons, and lays hex zones where the dead rise again. */
function updateHexwitch(m, dt){
  const T = TYPES.hexwitch;
  m.x += (m.tx - m.x) * Math.min(1, dt * 2.5);
  if (m.p < 0.05) return;
  m.driftT -= dt;
  if (m.driftT <= 0){
    m.driftT = T.driftEvery;
    const opts = [m.lane - 1, m.lane + 1].filter(l => l >= 0 && l < COLS);
    m.lane = opts[Math.floor(Math.random() * opts.length)]; m.tx = LANE(m.lane);
  }
  m.hexT -= dt;
  if (m.hexT <= 0){
    m.hexT = m.form === 2 ? T.form2.hexEvery : T.hexEvery;
    const pick = shuffle(G.monsters.filter(o => o !== m && !o.dead && o.type !== 'boss' && o.type !== 'chameleon' && o.type !== 'rchameleon' && o.rise <= 0 && o.p > 0));   // same targets as a witch
    const n = T.hexCount[0] + Math.floor(Math.random() * (T.hexCount[1] - T.hexCount[0] + 1));
    for (const o of pick.slice(0, n)){ hexBolt(m, o); hexMonster(o, m.form === 2 ? Math.random() >= T.chameleonChance : true); }   // form 1: reverse only (owner); form 2: 25% chameleon, 75% reverse
    if (pick.length) SFX.bossSfx('hexwitch', 'hex');
  }
  m.zoneT -= dt;
  if (m.zoneT <= 0){
    m.zoneT = T.zoneEvery;
    const want = m.form === 2 ? T.form2.zones : T.zones, shapes = m.form === 2 ? T.form2.shapes : T.shapes;
    while (G.hexZones.length < want){
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      G.hexZones.push({ shape, lane:Math.floor(Math.random() * COLS), p:rnd(0.25, 0.8), t:T.zoneLast });
    }
    addFloat('Hex zone!', m.x, mY(m) - m.r - 30, '#d09bff', 18, 1.2); SFX.bossSfx('hexwitch', 'zone');
  }
}
/** Is a monster inside a Hexwitch zone? (box: 3 lanes × 3 tile heights; col: whole column; row: 3 tile heights across the field) */
export function inHexZone(m){
  for (const z of G.hexZones || []){
    if (z.shape === 'col'){ if (m.lane === z.lane) return true; }
    else if (z.shape === 'row'){ if (Math.abs(m.p - z.p) <= 0.5 * TILE_P()) return true; }   // 1 tile tall across all 7 lanes
    else if (Math.abs(m.lane - z.lane) <= 1 && Math.abs(m.p - z.p) <= 1.5 * TILE_P()) return true;
  }
  return false;
}
/** Bulwark Knights: monsters inside a knight's 3×3 aura carry double health while they stay there. */
export function applyBulwarks(){
  const knights = G.monsters.filter(k => k.type === 'bulwark' && !k.dead);
  for (const o of G.monsters){
    if (o.dead || o.type === 'bulwark' || o.type === 'boss') continue;
    const inside = knights.some(k => Math.abs(o.lane - k.lane) <= 1 && Math.abs(o.p - k.p) <= 1.5 * TILE_P());
    if (inside && o.bulk !== 2){ o.bulk = 2; o.hp *= 2; o.maxHp *= 2; }
    else if (!inside && o.bulk === 2){ o.bulk = 1; o.maxHp /= 2; o.hp = Math.min(o.hp / 2, o.maxHp); }
  }
}
