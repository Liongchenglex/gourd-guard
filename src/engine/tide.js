// The rising blood tide (Release 9, Nightmare Drowned Marsh; spec Part 2, docs/GAME_DESIGN.md §9 "Nightmare Drowned Marsh (Release 9)").
// A night with `tideMarks: [{ at, to }]` has a moving shore. G.tide = { shore, from, target, t, marksDone, tT }: `shore` is the live line (a field
// fraction), which game.js `shoreP()` returns while G.tide is set. When the spawn bar (arrivals / total) reaches the next mark's `at`, the shore
// eases from where it is to min(to, TIDE_STOP) over SURGE_TIME; pools the shore reaches are swallowed. A night without tideMarks has
// G.tide = null, so every story night reads shoreP() exactly as before. Every caller gates on `__RELEASE__ >= 9`.

import { shoreP, placePuddles } from './game.js';
import { SFX } from './audio.js';
import { spark, addFloat } from './combat.js';
import { TILE_P } from './monsters.js';
import { COLS, FIELD_BOT, FIELD_TOP, G, LANE } from './state.js';
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

/** A whirlpool end the shore passes goes with the tide (spec Part 6): it moves to the water's edge, a hair inside the shore, so it still lies in the path of a walker that
 *  spawns at the live shore (shore - 0.02) and keeps working; once wet it follows the shore through every later surge. Ends already in the sea at the start are left alone. */
export const WHIRL_EDGE = 0.01;
function carryWhirlEnds(from){
  if (!G.whirls) return;
  const s = liveShore();
  for (const w of G.whirls) for (const e of [w.a, w.b]) if (e.wet || (e.p > from && e.p <= s)){ e.wet = true; e.p = s - WHIRL_EDGE; }
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
    swallowPools(); carryWhirlEnds(T.from);
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
  if (G.whirls) for (const w of G.whirls) for (const e of [w.a, w.b]) if (e.wet) e.p = liveShore() - WHIRL_EDGE;   // a snapshot taken mid-surge holds the target shore: wet ends follow it, as carryWhirlEnds does
}

// ---------- Whirlpools (Release 9; spec Part 2): pairs of ends in water that carry a walking monster from one end to the other ----------
export const WHIRL_MAX = 4;     // pairs on a night (owner)
export const WHIRL_COOL = 2;    // seconds a monster that just came out cannot be taken again (our number)
export const WHIRL_COLOURS = ['#ff4a4a', '#ffb04a', '#c04aff', '#4affd0'];   // one per pair, so linked ends read at a glance
/** Never taken: the water dwellers surface rather than walk (the Kraken's tentacles, Divers, Storm Eels, the Siren); sacks and jukeboxes span two lanes. Bosses are checked by type. */
const WHIRL_NEVER = new Set(['diver', 'eel', 'siren', 'tentacle', 'kraken', 'sack', 'jukebox']);

/** Start of a night, after the pools are placed: the level's own pairs (an end the level puts on dry land is refused). */
export function initWhirls(def){
  G.whirls = [];
  if (def && def.whirlpools) for (const [a, b] of def.whirlpools) addWhirlPair(a, b);
}
/** Stand a pair: false when 4 pairs already stand or when either end is not in water now. Each end is its own {lane, p}, so it stays when a pool under it is swallowed. */
export function addWhirlPair(a, b){
  if (!G.whirls) G.whirls = [];
  if (G.whirls.length >= WHIRL_MAX || !a || !b || !inWater(a.lane, a.p) || !inWater(b.lane, b.p)) return false;
  const s = liveShore(), edge = e => e.p < s - WHIRL_EDGE ? { lane:e.lane, p:s - WHIRL_EDGE, wet:true } : { lane:e.lane, p:e.p };   // an end out in the sea sits at the water's edge, where a walker can cross it, and follows later surges
  G.whirls.push({ a:edge(a), b:edge(b), col:WHIRL_COLOURS[G.whirls.length] });
  return true;
}
/** After a walk step (monsters.js): a monster that crossed an end's p going down the field, in that end's lane, comes out of the other end. */
export function whirlStep(m, pPrev){
  if (!G.whirls || !G.whirls.length) return false;
  if (m.dead || m.type === 'boss' || m.boss || WHIRL_NEVER.has(m.type) || m.whirlCool > 0 || m.frozenT > 0 || m.eating || m.rise > 0 || m.hidden || m.kb > 0 || m.p <= pPrev) return false;
  for (const w of G.whirls) for (const [from, to] of [[w.a, w.b], [w.b, w.a]]){
    if (from.lane !== m.lane || !(pPrev < from.p && m.p >= from.p)) continue;
    m.lane = to.lane; m.x = m.tx = LANE(to.lane); m.p = to.p; m.whirlCool = WHIRL_COOL; m.chewing = null;
    for (let i = 0; i < 6; i++) spark(m.x, FIELD_TOP + m.p * (FIELD_BOT - FIELD_TOP), w.col, 90);
    return true;
  }
  return false;
}
export const whirlSnapshot = () => (G.whirls || []).map(w => [[w.a.lane, w.a.p, ...(w.a.wet ? [1] : [])], [w.b.lane, w.b.p, ...(w.b.wet ? [1] : [])]]);   // a third entry marks an end the tide carried
/** A continued night: the same pairs, in their colours, wherever they stood (the water under them is as it was). */
export function restoreWhirls(s){
  G.whirls = [];
  for (const [a, b] of s || []) if (G.whirls.length < WHIRL_MAX && a[0] >= 0 && a[0] < COLS && b[0] >= 0 && b[0] < COLS) G.whirls.push({ a:{ lane:a[0], p:a[1], wet:!!a[2] }, b:{ lane:b[0], p:b[1], wet:!!b[2] }, col:WHIRL_COLOURS[G.whirls.length] });
}
