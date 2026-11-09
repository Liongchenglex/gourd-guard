// Nightmare Drowned Marsh's monsters (Release 9; spec Part 3, docs/GAME_DESIGN.md §9 "Nightmare Drowned Marsh (Release 9)"). Their numbers are in data/monsters.js.
// Every caller gates on `__RELEASE__ >= 9`, so lower builds drop this module. One section per monster; each new monster adds a case to initMarshMonster /
// updateMarshMonster and, when it stops or acts outside the walk, a line in monsters.js beside the Release 8 ones.
//  - The Blood Slime (`bloodslime`): killed, it splits into `splits` Bloodlets (`bloodblob`) in the lanes round it (splitBlood, from combat.js kill). At most
//    SLIME_CAP Blood Slimes and Bloodlets live at once, so a split makes min(splits, SLIME_CAP - alive) of them. A Bloodlet's clock `growT` runs every frame it is not frozen (walking, chewing the fence or knocked back: growBlob, called from monsters.js; owner), so ice alone holds it small; at `regrow` s it is replaced by a full Blood
//    Slime at its lane and place (no reward for the Bloodlet: it was not killed). `swell` (1..SWELL_MAX) is how big it is drawn, so the player sees it coming.
//    Blobs are minions, so they never count in the night's arrivals, and a night whose total is reached is not won while any monster stands (game.js).
//  - The Drowned Pirate (`pirate`): at spawn he picks 1..2 shots (`shots`) and that many stop points, one in each equal slice of `stopAt` (so they are apart).
//    marshStop holds him at the next one (monsters.js clamps his step there). There he aims `aim` s (a baked aim line and reticle on the target,
//    render/fx.js) and then destroys the pumpkin of his column nearest the top of the patch (pirateTarget): never a gourd (a gourd's square does not protect),
//    never one flying in or held, never a netted one. Nothing to shoot: he walks on at once. The clock stands still while he is frozen; a dead Pirate shoots no one.
//  - The Turtle Rider (`turtlerider`): walks as the Shell Turtle. Its clock `rotT` (from `rotEvery`) runs only while it walks; WIND s before it runs out its imp
//    starts the throw clip, and at zero a rotten pumpkin leaves for a random pumpkin of its column or a neighbouring one that rotCell would take (none: it tries
//    again in a second). The throw flies `rotFly` s (a vfx 'rotshot' with a `done` callback, game.js) and then calls rotCell; if that cell has changed meanwhile it
//    takes another, else the throw is lost. Killed, it lets its Imp loose in its lane (releaseImp, from combat.js kill).
//  - The Storm Eel (`eel`): the Puddle Diver's hidden/up cycle (m.hidden, m.upT, m.puddle) with a charge: up `up` s, which are the surface clip, the `charge` clip,
//    the shoot clip (the bolt leaves its mouth 0.17 s in, FIRE_AT) and the dive. The bolt is a G.arrows entry with `zap` (the Diver's wall damage, baked sprite).
//    Each dive it picks a new spot (eelSpot): another pool, or a random lane and place in the tide, never the spot it left. It never walks (sp 0).
//  - The Siren (`siren`): surfaces at the live shore - 0.03 in her lane and never walks (sp 0, no knockback; whirlpools never take her). Her clock `singT` runs while
//    she is free to act (not frozen); every `singEvery` s she sings (`sing` runs SING_CLIP s: the sing clip, and a note drifting down her lane, a vfx 'sirennote')
//    and hideRow()s a random row that is neither hidden nor already warned. Hidden rows: G.hidden[r] is the seconds left, G.hideWarn[r] the warning left
//    (HIDE_WARN s, a red wash on the row), G.hideDur[r] the time the warning will give it. A hide on a row already hidden resets it to its time at once. The
//    drawing only changes (render/draw.js: baked red spheres); bunches, lights and launches use the pumpkins' true colours, and the hint never points into a
//    hidden row (board.js). The Fallen blood twin calls hideRow too. A continued night keeps each row's time left (hiddenSnapshot / restoreHidden).

import { TYPES, SLIME_CAP } from '../data/monsters.js';
import { PTYPES } from '../data/pumpkins.js';
import { SFX } from './audio.js';
import { addFloat, chunk, ring, spark } from './combat.js';
import { resolveMatches } from './board.js';
import { isProtected } from './gourd.js';
import { ROTTEN, rotCell } from './rot.js';
import { liveShore, inWater } from './tide.js';
import { mS, mY, spawnMonster } from './monsters.js';
import { COLS, CS, FENCE_Y, G, GY, LANE, ROWS, gest, grid, walls } from './state.js';
import { rnd } from './util.js';

export const HIDE_WARN = 1.5, HIDE_DUR = 6;   // a row is warned this long, then hidden this long (spec)
const SING_CLIP = 1.5, NOTE_DRIFT = 2.2;   // the sing clip's length, and how long the note takes down her lane
export const SWELL_MAX = 1.7;   // a Bloodlet about to regrow is drawn this much bigger (r 13 -> a Blood Slime's r 23 is 1.77)

const ROT_WIND = 0.45;   // the imp's throw clip: it lets go 0.45 s in (render/chars/marsh.js, 10 frames at 14 fps, release at 0.63)
const EEL_SURFACE = 0.4, EEL_FIRE_LAG = 0.17;   // the surface clip, and how far into the shoot clip the bolt leaves its mouth
const eelFireAt = () => EEL_SURFACE + TYPES.eel.charge + EEL_FIRE_LAG;   // seconds after it surfaces (a function: a lower build has no TYPES.eel and still loads this file)

const isSlimeKind = m => m.type === 'bloodslime' || m.type === 'bloodblob';
/** Living Blood Slimes and Bloodlets on the field. */
export const slimesAlive = () => G.monsters.reduce((n, m) => n + (!m.dead && isSlimeKind(m) ? 1 : 0), 0);

/** A new monster's Release 9 set-up (spawnMonster, before it joins the field). */
export function initMarshMonster(m){
  if (m.type === 'bloodblob'){ m.growT = 0; m.swell = 1; }
  if (m.type === 'pirate'){
    const T = TYPES.pirate, n = T.shots[0] + Math.floor(Math.random() * (T.shots[1] - T.shots[0] + 1)), [a, b] = T.stopAt, w = (b - a) / n;
    m.stops = [];
    for (let i = 0; i < n; i++) m.stops.push(a + w * i + Math.random() * w);   // one in each slice, in walking order
    m.aiming = false; m.aimT = 0; m.aimRow = -1;
  }
  if (m.type === 'turtlerider'){ m.rotT = TYPES.turtlerider.rotEvery; m.winding = false; }
  if (m.type === 'siren'){ m.singT = TYPES.siren.singEvery; m.sing = 0; m.noKnockback = true; m.p = Math.max(0.02, liveShore() - 0.03); }   // she sits at the water's edge
  if (m.type === 'eel'){   // lurks in the water from the start, as a Diver in its pool
    m.hidden = true; m.upT = TYPES.eel.down; m.fired = false; m.charged = false;
    if (!m.puddle) m.puddle = { lane:m.lane, p:Math.max(0, m.p) };
  }
}

/** A Bloodlet's regrow clock: it swells and, at `regrow` s, is a full Blood Slime again where it stands (no reward: it was not killed). monsters.js runs it
 *  every frame the Bloodlet is not frozen: walking, chewing the fence or knocked back (owner: only Ice holds it small). */
export function growBlob(m, dt){
  const T = TYPES.bloodblob;
  m.growT += dt;
  m.swell = 1 + (SWELL_MAX - 1) * Math.min(1, m.growT / T.regrow);
  if (m.growT >= T.regrow && !m.dead){
    m.dead = true;   // it did not die: no reward, no split
    const s = spawnMonster('bloodslime', m.lane, true, m.p); s.age = 0.2; s.flash = 0.25;
    for (let i = 0; i < 8; i++) spark(m.x, mY(m), '#ff6a78', 110);
    SFX.monsterAct('bloodslime', 'regrow');
  }
}

/** combat.js kill(): the Turtle Rider's Imp is loose where it died. */
export function releaseImp(m){
  const imp = spawnMonster('imp', m.lane, true, Math.max(0, m.p)); imp.age = 0.2; imp.flash = 0.25;
  for (let i = 0; i < 8; i++) spark(m.x, mY(m), '#ff7a4a', 110);
  addFloat('The imp is loose!', m.x, mY(m) - m.r - 20, '#ff9a6a', 16, 0.9);
}

/** Would rotCell take (r, c)? Mirrors its refusals without changing anything. */
const rotOk = (r, c) => { const x = grid[r] && grid[r][c]; return !!x && !x.gourd && !(x.fly > 0) && x.c !== ROTTEN && !isProtected(r, c); };
/** The cells of columns lane-1..lane+1 a rotten pumpkin could land on. */
function rotTargets(lane){
  const out = [];
  for (let c = Math.max(0, lane - 1); c <= Math.min(COLS - 1, lane + 1); c++) for (let r = 0; r < ROWS; r++) if (rotOk(r, c)) out.push([r, c]);
  return out;
}
function throwRot(m){
  const T = rotTargets(m.lane); if (!T.length) return false;
  const [r, c] = T[Math.floor(Math.random() * T.length)], lane = m.lane;
  const x0 = m.x, y0 = mY(m) - m.r * mS(m) * 0.8, x1 = LANE(c), y1 = GY + r * CS + CS / 2;
  if (G.vfx) G.vfx.push({ kind:'rotshot', x0, y0, x1, y1, t:0, dur:TYPES.turtlerider.rotFly, done:() => {
    let hit = rotCell(r, c);
    if (!hit){ const alt = rotTargets(lane); if (alt.length){ const [r2, c2] = alt[Math.floor(Math.random() * alt.length)]; hit = rotCell(r2, c2); } }   // its cell changed in the air: any other, else the throw is lost
    if (G.vfx) G.vfx.push({ kind:'clip', key:'rotshot', clip:'splat', n:7, x:x1, y:y1 - 14, s:1.5, t:0, dur:0.5 });
  } });
  SFX.monsterAct('turtlerider', 'throw');
  return true;
}

/** Where a Storm Eel dives to: another pool, or a random lane and place in the tide (inWater), never the spot it is leaving. Null: nowhere else, it stays. */
function eelSpot(m){
  const pools = (G.puddles || []).filter(pd => pd !== m.puddle && !(pd.lane === m.lane && Math.abs(pd.p - m.p) < 0.005)), sh = liveShore();
  if (pools.length && (sh <= 0.05 || Math.random() < 0.5)){ const pd = pools[Math.floor(Math.random() * pools.length)]; return { lane:pd.lane, p:pd.p, puddle:pd }; }
  if (sh > 0.05) for (let i = 0; i < 24; i++){
    const lane = Math.floor(Math.random() * COLS), p = rnd(0.02, sh - 0.02);
    if (inWater(lane, p) && !(lane === m.lane && Math.abs(p - m.p) < 0.03)) return { lane, p, puddle:{ lane, p } };
  }
  return null;
}
function eelBolt(m){
  const T = TYPES.eel;
  if (walls[m.lane] && walls[m.lane].hp > 0) G.arrows.push({ lane:m.lane, p:m.p + 0.03, sp:T.boltSp, dmg:T.bolt, dead:false, zap:true });
  SFX.monsterAct('eel', 'bolt');
}

// ---------- hidden rows (the Siren's song; the Fallen blood twin calls hideRow too) ----------
/** Start of a night: no row hidden or warned. */
export function initHidden(){ G.hidden = Array(ROWS).fill(0); G.hideWarn = Array(ROWS).fill(0); G.hideDur = Array(ROWS).fill(HIDE_DUR); }
export const rowHidden = r => !!(G && G.hidden && G.hidden[r] > 0);
/** Warn row r for `warn` s, then hide it for `dur` s. A row already hidden is reset to `dur` at once; a row already warned keeps its warning (the longer time). */
export function hideRow(r, warn = HIDE_WARN, dur = HIDE_DUR){
  if (!G.hidden) initHidden();
  if (r < 0 || r >= ROWS) return;
  if (G.hidden[r] > 0){ G.hidden[r] = dur; return; }
  if (G.hideWarn[r] > 0){ G.hideDur[r] = Math.max(G.hideDur[r], dur); return; }
  if (warn <= 0){ G.hidden[r] = dur; return; }
  G.hideWarn[r] = warn; G.hideDur[r] = dur;
}
/** Per-frame (game.js): the warnings run down into hidden time, and hidden time runs down. */
export function updateHidden(dt){
  for (let r = 0; r < ROWS; r++){
    if (G.hideWarn[r] > 0){ G.hideWarn[r] -= dt; if (G.hideWarn[r] <= 0){ G.hideWarn[r] = 0; G.hidden[r] = G.hideDur[r]; } }
    else if (G.hidden[r] > 0) G.hidden[r] = Math.max(0, G.hidden[r] - dt);
  }
}
/** Each row's time left (a warning not yet over is dropped). */
export const hiddenSnapshot = () => G.hidden ? G.hidden.slice() : null;
/** A continued night: the same rows hidden with the same time left. */
export function restoreHidden(s){
  initHidden();
  if (Array.isArray(s)) for (let r = 0; r < ROWS; r++) G.hidden[r] = s[r] > 0 ? s[r] : 0;
}

function sing(m){
  m.sing = SING_CLIP;
  const free = []; for (let r = 0; r < ROWS; r++) if (!(G.hidden[r] > 0) && !(G.hideWarn[r] > 0)) free.push(r);
  if (free.length) hideRow(free[Math.floor(Math.random() * free.length)]);
  if (G.vfx) G.vfx.push({ kind:'sirennote', x:m.x, y0:mY(m) - m.r * 0.5, y1:FENCE_Y - 20, t:0, dur:NOTE_DRIFT });
  SFX.monsterAct('siren', 'sing');
}

/** combat.js kill(): a Blood Slime falls into Bloodlets, as many as the cap leaves room for. */
export function splitBlood(m, y){
  const room = SLIME_CAP - slimesAlive(), n = Math.max(0, Math.min(TYPES.bloodslime.splits, room));
  for (let i = 0; i < n; i++){
    const l = Math.max(0, Math.min(COLS - 1, m.lane + i - 1));   // left, the same lane, right
    const bl = spawnMonster('bloodblob', l, true, Math.max(0, m.p - 0.02)); bl.age = 0.2;
  }
  addFloat(n ? 'Split!' : 'No room to split', m.x, y - 30, '#ff6a78', 16, 0.9); SFX.monsterAct('bloodslime', 'split');
}

/** The pumpkin a Pirate in `lane` would shoot: the one nearest the top of the patch, as {r, cell}, or null. */
export function pirateTarget(lane){
  for (let r = 0; r < ROWS; r++){
    const cell = grid[r][lane];
    if (!cell || cell.gourd || cell.fly > 0 || cell.net || (gest && gest.ref === cell)) continue;
    return { r, cell };
  }
  return null;
}

function shoot(m){
  m.aiming = false; m.aimT = 0;
  const t = pirateTarget(m.lane); if (!t) return;
  const x = LANE(m.lane), y = GY + t.r * CS + CS / 2, cell = t.cell;
  grid[t.r][m.lane] = null;
  if (G.vfx) G.vfx.push({ kind:'pirateshot', x, y0:mY(m) + m.r * mS(m) * 0.4, y1:y, t:0, dur:0.16 });
  for (let i = 0; i < 12; i++) chunk(x, y, cell.c >= 0 && PTYPES[cell.c] ? PTYPES[cell.c].base : '#f0a020', 200);
  ring(x, y, 34, 'rgba(255,90,90,.8)'); spark(x, y, '#ffd25a', 120);
  SFX.monsterAct('pirate', 'shoot'); SFX.smash();
  resolveMatches();
}

/** monsters.js: where a Pirate may walk to. His next stop point while shots are left (never back from where he is), his own place while he aims. */
export function marshStop(m){
  if (m.type !== 'pirate') return Infinity;
  if (m.aiming) return m.p;
  return m.stops && m.stops.length ? Math.max(m.p, m.stops[0]) : Infinity;
}

/** The type switch of updateMonster's default branch (a monster that is walking: not frozen, chewing, knocked back or down). True when handled. */
export function updateMarshMonster(m, dt){
  switch (m.type){
    case 'bloodslime': m.x = m.tx; return true;
    case 'bloodblob': m.x = m.tx; growBlob(m, dt); return true;
    case 'turtlerider': {
      const T = TYPES.turtlerider;
      m.x = m.tx + Math.sin(m.ph * 1.6) * 2;
      m.rotT -= dt;
      if (!m.winding && m.rotT <= ROT_WIND && m.rotT > 0 && rotTargets(m.lane).length){ m.winding = true; m.anim = { clip:'throw', t:0, dur:0.714 }; }
      if (m.rotT <= 0){
        m.winding = false;
        if (throwRot(m)) m.rotT += T.rotEvery; else m.rotT = 1;   // nothing to rot: look again in a second
      }
      return true;
    }
    case 'siren':
      m.x = m.tx; m.singT -= dt; if (m.sing > 0) m.sing -= dt;
      if (m.singT <= 0){ m.singT += TYPES.siren.singEvery; sing(m); }
      return true;
    case 'eel': {
      const T = TYPES.eel;
      m.x = m.tx; m.upT -= dt;
      if (!m.hidden){
        const el = T.up - m.upT;
        if (!m.charged && el >= EEL_SURFACE){ m.charged = true; SFX.monsterAct('eel', 'charge'); }
        if (!m.fired && el >= eelFireAt()){ m.fired = true; eelBolt(m); }
      }
      if (m.upT <= 0){
        if (m.hidden){   // up it comes
          m.hidden = false; m.upT = T.up; m.fired = false; m.charged = false; SFX.monsterAct('eel', 'surface');
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#9fe0f0', 110);
        } else {   // down it goes, to come up elsewhere
          m.hidden = true; m.upT = T.down; SFX.monsterAct('eel', 'submerge');
          for (let i = 0; i < 10; i++) spark(m.x, mY(m), '#9fe0f0', 110);
          const sp = eelSpot(m);
          if (sp){ m.lane = sp.lane; m.p = sp.p; m.puddle = sp.puddle; m.x = m.tx = LANE(sp.lane); }
        }
      }
      return true;
    }
    case 'pirate': {
      m.x = m.tx;
      if (m.aiming){
        m.aimT -= dt;
        const tg = pirateTarget(m.lane); m.aimRow = tg ? tg.r : -1;   // the line follows the pumpkin he would shoot now (it may have flown or slid)
        if (m.aimT <= 0.267 && !m.anim) m.anim = { clip:'shoot', t:0, dur:0.667 };   // the gun comes up so it fires as the aim runs out (render/chars/marsh.js, 8 frames at 12 fps)
        if (m.aimT <= 0) shoot(m);
        return true;
      }
      if (m.stops && m.stops.length && m.p >= m.stops[0] - 0.002){
        m.stops.shift();
        const t = pirateTarget(m.lane);
        if (t){ m.aiming = true; m.aimT = TYPES.pirate.aim; m.aimRow = t.r; SFX.monsterAct('pirate', 'aim'); }
      }
      return true;
    }
  }
  return false;
}
