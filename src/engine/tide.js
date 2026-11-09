// The rising blood tide (Release 9, Nightmare Drowned Marsh; spec Part 2, docs/GAME_DESIGN.md §9 "Nightmare Drowned Marsh (Release 9)").
// A night with `tideMarks: [{ at, to }]` has a moving shore. G.tide = { shore, from, target, t, marksDone, tT }: `shore` is the live line (a field
// fraction), which game.js `shoreP()` returns while G.tide is set. When the spawn bar (arrivals / total) reaches the next mark's `at`, the shore
// eases from where it is to min(to, TIDE_STOP) over SURGE_TIME; pools the shore reaches are swallowed. A night without tideMarks has
// G.tide = null, so every story night reads shoreP() exactly as before. Every caller gates on `__RELEASE__ >= 9`.

import { shoreP, placePuddles } from './game.js';
import { SFX } from './audio.js';
import { spark, addFloat } from './combat.js';
import { TILE_P } from './monsters.js';
import { FIELD_BOT, FIELD_TOP, G, LANE } from './state.js';
import { banner } from '../ui/hud.js';

export const SURGE_TIME = 0.8;   // seconds for the wave to sweep (spec)
/** The tide never passes one tile row before the fence. */
export const TIDE_STOP = () => 1 - 1.0 * TILE_P();
const ease = u => u * u * (3 - 2 * u);

/** Start of a night (after setG, before the pools are placed): a tide only on a night with tideMarks. */
export function initTide(def){
  const marks = def && def.tideMarks && def.tideMarks.length ? def.tideMarks : null;
  G.tide = null;   // read the level's own shore, not a previous tide's
  G.tide = marks ? { shore:shoreP(), from:0, target:0, t:-1, marksDone:0, tT:-99 } : null;
}

/** The shore now (a field fraction): the live line while a tide moves, the level's own otherwise. */
export const liveShore = () => shoreP();

/** Is the point (lane, p) in water: at or above the live shore, or inside a pool of that lane. */
export function inWater(lane, p){
  if (p <= liveShore()) return true;
  const r = TILE_P() * 0.5;
  for (const pd of G.puddles || []) if (pd.lane === lane && Math.abs(pd.p - p) <= r) return true;
  return false;
}

/** Pools the shore has reached are swallowed into the tide; whatever hid in one is in the tide now, in its own lane. */
export function swallowPools(){
  if (!G.puddles || !G.puddles.length) return;
  const s = liveShore(), gone = G.puddles.filter(pd => pd.p <= s);
  if (!gone.length) return;
  G.puddles = G.puddles.filter(pd => pd.p > s);
  for (const m of G.monsters) if (m.puddle && m.hidden && gone.includes(m.puddle)){   // only a lurker still hidden in the pool moves; a Crawler or Turtle that rose from it and walks keeps its p
    m.puddle = { lane:m.lane, p:Math.min(m.p, s) }; if (m.p > s) m.p = s; }   // a lurker keeps its lane and now lurks in the tide
  for (const pd of gone) for (let i = 0; i < 8; i++) spark(LANE(pd.lane), FIELD_TOP + pd.p * (FIELD_BOT - FIELD_TOP), '#ff8a80', 110);
}

/** Per-frame: fire the next tide mark when the bar reaches it, then ease the shore through a surge. */
export function updateTide(dt){
  const T = G.tide, d = G.def;
  if (!T || !d || !d.tideMarks) return;
  const mk = d.tideMarks[T.marksDone];
  if (mk && T.t < 0 && G.spawned >= Math.floor((G.total || d.total) * mk.at)){
    T.marksDone++; T.tT = G.t; T.from = T.shore; T.target = Math.max(T.shore, Math.min(mk.to, TIDE_STOP())); T.t = 0;
    banner('The tide rises!', 'The blood sea creeps toward the fence.', 2.2); SFX.bossAlert();
    addFloat('The tide rises!', 195, FIELD_TOP + 40, '#ff8a80', 18, 1.2);
  }
  if (T.t >= 0){
    T.t += dt;
    const u = Math.min(1, T.t / SURGE_TIME);
    T.shore = T.from + (T.target - T.from) * ease(u);
    swallowPools();
    if (u >= 1){ T.shore = T.target; T.t = -1; }
  }
}

export const tideSnapshot = () => G.tide ? { shore:G.tide.target > G.tide.shore ? G.tide.target : G.tide.shore, marks:G.tide.marksDone } : null;
/** A continued night: the marks passed and the shore they reached stay, and no surge replays. */
export function restoreTide(s){
  if (!s || !G.tide) return;
  G.tide.marksDone = s.marks || 0; G.tide.shore = s.shore; G.tide.t = -1; G.tide.from = G.tide.target = s.shore;
  const d = G.def;   // startGame placed the pools at the start shore: lay them again below the restored one (same count), without swallow sparks
  if (d.puddlesLayout) G.puddles = G.puddles.filter(pd => pd.p > s.shore);
  else if (d.puddles){ G.puddles = []; placePuddles(d.puddles); }
}
