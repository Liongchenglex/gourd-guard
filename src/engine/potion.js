// Potions on the field (Release 7, Nightmare Witchwood; spec Part 2, docs/GAME_DESIGN.md §9 "Nightmare Witchwood").
// A potion stands on one field tile: a lane and a tile row (its p is the row's centre, the fire tile grid of Release 4: TILE_P() rows from
// the top of the field). A monster that walks onto its tile drinks it if it may (canDrink) and the potion vanishes; one that may not walks
// past and leaves it for the next. The player cannot remove potions: pumpkins fly over them and tools ignore them.
// Kinds: bulky (health and full health double), speed (walks and chews POTION_SPEED times as fast; read in engine/monsters.js and the
// scarecrow chew in engine/game.js), colour (hexed as a witch hexes: a Chameleon at POTION_COLOUR_CHAMELEON, else a Reverse Chameleon).
// A monster holds a count of each kind: `m.drank = { bulky?, speed?, colour? }`, up to POTION_STACK (bulky 3, speed 3, colour 1; owner 2026-11-09).
// Every caller gates on `__RELEASE__ >= 7`, so lower builds drop this module.

import { BREW_CROWS, BREW_CUT, FIRE_P_RANGE, POTION_CAP, POTION_COLOUR_CHAMELEON, POTION_STACK, drankN } from '../data/rules.js';
import { ICE_ONLY } from '../data/monsters.js';
import { SFX, sample } from './audio.js';
import { addFloat, spark } from './combat.js';
import { TILE_P, hexMonster, hexable, lanesOf, mY, spawnMonster } from './monsters.js';
import { COLS, FIELD_BOT, FIELD_TOP, G, LANE } from './state.js';
import { shuffle } from './util.js';
import { banner } from '../ui/hud.js';
import { coachHolds } from './coach.js';

export const POTION_KINDS = ['bulky', 'speed', 'colour'];
/** Each kind's colours: the bottle's glow and the sparks of a drink (render/potion.js paints the bottles). */
export const POTION_FX = { bulky:['#ff4a4a', '#ffb0a0'], speed:['#6cf05a', '#e8ff7a'], colour:['#b46cff', '#f0c8ff'] };
const FLOAT = { bulky:[['Bulky!', 'Bulkier!', 'Bulkiest!'], '#ff8a7a'], speed:[['Speedy!', 'Speedier!', 'Speediest!'], '#a6f06a'] };   // colour says "Hexed!" itself (hexMonster)

/** Field tile rows: as many whole tiles as fit between the top of the field and the fence (as fire tiles). */
const rows = () => Math.max(1, Math.floor(1 / TILE_P()));
const rowOf = p => Math.min(rows() - 1, Math.max(0, Math.floor(p / TILE_P())));
const centre = row => (row + 0.5) * TILE_P();
/** Screen y of a potion's tile centre. */
export const potionY = o => FIELD_TOP + o.p * (FIELD_BOT - FIELD_TOP);

const soundAt = {};
const once = (key, ms) => { const n = performance.now(); if (n - (soundAt[key] || 0) < ms) return false; soundAt[key] = n; return true; };

/** The potion standing on the tile that holds field position p in this lane, or null. */
export function potionAt(lane, p){
  if (!G || !G.potions) return null;
  const tp = TILE_P();
  for (const o of G.potions) if (o.lane === lane && Math.abs(o.p - p) < tp / 2) return o;
  return null;
}

/** Put a potion of `kind` on the tile at (lane, p), p snapped to its tile-row centre. False when that tile holds one already or is off the field. */
export function placePotion(lane, p, kind, quiet){
  if (!G || !G.potions || !(lane >= 0 && lane < COLS) || !(p >= 0 && p <= 1) || !POTION_KINDS.includes(kind)) return false;
  const q = centre(rowOf(p));
  if (potionAt(lane, q)) return false;
  G.potions.push({ lane, p:q, kind, t:0 });
  if (!quiet){
    const x = LANE(lane), y = FIELD_TOP + q * (FIELD_BOT - FIELD_TOP), [a, b] = POTION_FX[kind];
    for (let i = 0; i < 8; i++) spark(x, y - 14, i % 2 ? a : b, 110);
    if (once('place', 90)) sample('glassping', 0.35) || SFX.extra('splash');
  }
  return true;
}

/** Up to n potions on random free field tiles, spread across lanes: every lane gets one before any lane gets a second (as lightRandomFires).
 *  Only rows whose centre lies in FIRE_P_RANGE; a tile under a castle wall or a boss is skipped. Kinds drawn from `kinds` (all three when left out).
 *  Returns how many were placed. */
export function placeRandomPotions(n, kinds, quiet){
  if (!G || !G.potions || !(n > 0)) return 0;
  const tp = TILE_P(), [lo, hi] = FIRE_P_RANGE, ks = kinds && kinds.length ? kinds : POTION_KINDS;
  let band = [...Array(rows()).keys()].filter(r => centre(r) >= lo && centre(r) <= hi);
  if (!band.length) band = [rowOf(0.5)];   // a very short field: the middle row
  const blocked = (lane, p) => (G.castles || []).some(w => !w.dead && w.lane === lane && Math.abs(w.p - p) < tp)
    || G.monsters.some(m => !m.dead && m.type === 'boss' && lanesOf(m).includes(lane) && Math.abs(m.p - p) < tp);
  const free = lane => band.map(centre).filter(p => !potionAt(lane, p) && !blocked(lane, p));
  let put = 0;
  while (put < n){
    const lanes = shuffle([...Array(COLS).keys()]).filter(l => free(l).length);   // one round: each lane with room gets at most one potion
    if (!lanes.length) break;
    for (const l of lanes){
      if (put >= n) break;
      const ps = free(l); if (!ps.length) continue;
      if (placePotion(l, ps[Math.floor(Math.random() * ps.length)], ks[Math.floor(Math.random() * ks.length)], true)) put++;
    }
  }
  if (put && !quiet){
    for (const o of G.potions.slice(-put)){ const x = LANE(o.lane), y = potionY(o), [a, b] = POTION_FX[o.kind]; for (let i = 0; i < 6; i++) spark(x, y - 14, i % 2 ? a : b, 100); }
    sample('glassping', 0.4) || SFX.extra('splash');
  }
  return put;
}

/** Who may drink: any monster except bosses and mini bosses (type boss), the Loot Sack, the jukebox, mummies of every kind (ICE_ONLY too) and
 *  crows; never one that is down (rising) or dead, never more of a kind than POTION_STACK allows (bulky and speed 3, colour 1); the colour potion only lands where a hex may (hexable: never a
 *  true Chameleon or Reverse Chameleon). */
const NO_DRINK = new Set(['boss', 'sack', 'jukebox', 'mummy', 'crow', ...ICE_ONLY]);
export function canDrink(m, kind){
  if (!m || m.dead || m.rise > 0 || NO_DRINK.has(m.type)) return false;
  if (drankN(m, kind) >= (POTION_STACK[kind] || 1)) return false;
  return kind !== 'colour' || hexable(m);
}

/** m drinks a potion of `kind` (the caller has checked canDrink). Bulky: the first doubles its health and full health (the Bulwark aura halves
 *  and doubles around it, so the potion's doubling stays), each more adds the full health it had before the first (x3, x4); speed is read
 *  where the monster walks and chews (potionSpeed in data/rules.js); colour hexes it. */
export function drink(m, kind, quiet){
  const n = drankN(m, kind) + 1;
  (m.drank || (m.drank = {}))[kind] = n;
  if (kind === 'bulky'){
    if (n === 1){ m.bulkBase = m.maxHp; m.hp *= 2; m.maxHp *= 2; }
    else { const b = m.bulkBase || m.maxHp / n; m.hp += b; m.maxHp += b; }
  }
  else if (kind === 'colour') hexMonster(m, Math.random() >= POTION_COLOUR_CHAMELEON, quiet);
  if (quiet) return;
  const x = m.x, y = mY(m), [a, b] = POTION_FX[kind];
  for (let i = 0; i < 10; i++) spark(x, y - 6, i % 2 ? a : b, 130);
  if (G.vfx) G.vfx.push({ kind:'potiondrink', potion:kind, x, y:y - m.r * 0.4, t:0, dur:0.6 });   // a coloured puff (render/potion.js)
  if (FLOAT[kind]) addFloat(FLOAT[kind][0][Math.min(n, 3) - 1], x, y - m.r - 24, FLOAT[kind][1], 16, 0.9);
  m.flash = Math.max(m.flash || 0, 0.15);
  if (once('drink', 80)) sample('bubbles', 0.5) || SFX.extra('splash');
}

/** Seconds between the level's random potions now: `potions.every`, cut by a quarter at each brew mark passed (G.bmNext, Task 3). 0 with no field potions. */
export function potionEveryNow(){
  const d = G && G.def && G.def.potions;
  if (!d || !(d.every > 0)) return 0;
  return d.every * Math.pow(BREW_CUT, G.bmNext || 0);
}

/** Brew marks (Release 7): a mark on the spawn bar is reached. A banner, a swoop of BREW_CROWS crows at the top of random lanes (as the Fallen
 *  Gravekeeper's, minions that do not count toward `total`), and the potion clock is cut from now on (potionEveryNow reads G.bmNext). */
export function dropBrewMark(){
  G.bmNext = (G.bmNext || 0) + 1; G.bmT = G.t;
  const [a, b] = BREW_CROWS, n = a + Math.floor(Math.random() * (b - a + 1));
  for (let i = 0; i < n; i++) spawnMonster('crow', Math.floor(Math.random() * COLS), true, -0.02);
  banner('The brew boils!', 'Crows swoop in and the potions come faster.', 2.2); SFX.bossAlert();
}

/** Per-frame: the potions' clocks (drawing reads o.t to grow them in), the level's clock (every potionEveryNow() s, `count` [min, max] new
 *  potions up to `cap` on the field), and monsters that have walked onto a potion's tile: one that may drinks it and the potion is gone. */
export function updatePotions(dt){
  if (!G || !G.potions) return;
  for (const o of G.potions) o.t += dt;
  const d = G.def && G.def.potions;
  if (d && d.every > 0 && !coachHolds()){   // the level clock holds while a coach teaches (N3-5's Wartling script), as monsters and sprouts do
    G.potionT -= dt;
    if (G.potionT <= 0){
      G.potionT = potionEveryNow();
      const [lo, hi] = d.count || [1, 1], want = lo + Math.floor(Math.random() * (hi - lo + 1));
      const room = (d.cap != null ? d.cap : POTION_CAP) - G.potions.length;
      if (room > 0) placeRandomPotions(Math.min(want, room), d.kinds);
    }
  }
  if (!G.potions.length) return;
  for (const m of G.monsters){
    if (m.dead) continue;
    const o = potionAt(m.lane, m.p);
    if (!o || !canDrink(m, o.kind)) continue;
    G.potions.splice(G.potions.indexOf(o), 1);
    drink(m, o.kind);
  }
}

/** What a continued night keeps (game.js continueState): the potions on the field, the clock to the next ones, and what each drinker still
 *  on the field had drunk (with its colour hex), handed to the first unbeaten monsters as they come back. */
export function potionSnapshot(){
  const g = G;
  const drank = g.monsters.filter(m => !m.dead && !m.minion && m.drank && POTION_KINDS.some(k => m.drank[k]))
    .map(m => ({ kinds:POTION_KINDS.flatMap(k => Array(drankN(m, k)).fill(k)), lock:m.colourLock, immune:m.colourImmune }));   // one entry per potion drunk
  return { potions:(g.potions || []).map(o => [o.lane, o.p, o.kind]), t:g.potionT, drank, bm:g.bmNext || 0 };   // bm: brew marks passed
}
/** Put a snapshot back on a continued night (after startGame). */
export function restorePotions(s){
  if (!s || !G) return;
  G.potions = []; for (const [lane, p, kind] of s.potions || []) placePotion(lane, p, kind, true);
  if (s.t != null) G.potionT = s.t;
  G.bmNext = s.bm || 0;   // a passed brew mark does not fire again
  G.drankCarry = (s.drank || []).map(d => ({ ...d, kinds:d.kinds.slice() }));
}
/** The spawner (spawnOne): a continued night's next unbeaten monster takes the next carried drinker's potions, those it may drink. */
export function carryDrank(m){
  const c = G.drankCarry && G.drankCarry.shift(); if (!c) return;
  for (const k of c.kinds){
    if (!canDrink(m, k)) continue;
    drink(m, k, true);
    if (k === 'colour' && (c.lock != null || c.immune != null)){ m.colourLock = c.lock; m.colourImmune = c.immune; }   // the same hex it had
  }
}
