// Quests and stars (owner, 2026-09-27). Every level has three quests; completing one earns its star for good.
// Quest 1 is always "finish the night". Levels before QUEST_START give all three stars on a win (the owner's
// "1-1 and 1-2 are completed with 3 stars by default"). Quests 2 and 3 of every level come from QUEST_TABLE
// (src/data/questTable.js, generated from the owner's lists by tools/quest_gen.mjs); a level's own `quests` field
// overrides it. On level 20 quests 2 and 3 are a pair: both must be done in the same run for their two stars.
// Progress is kept per night as a bitmask in save.quests[n]; save.stars[n] is its count.
import { save } from '../save.js';
import { G, walls } from '../engine/state.js';
import { PTYPES } from './pumpkins.js';
import { QUEST_TABLE } from './questTable.js';

export const QUEST_START = 3;   // night 3 = level 1-3, where quests are introduced

const pname = k => { const p = PTYPES.find(t => t.key === k); return p ? p.name : k; };
const list = ks => ks.length < 2 ? pname(ks[0]) : ks.slice(0, -1).map(pname).join(', ') + ' and ' + pname(ks[ks.length - 1]);
const MON = { ghoul:'a ghoul', fogwalker:'a fogwalker' };

/** Fresh per-night quest counters (kept on G.q; carried over when an ad continues the night). */
export const newQuestCounters = () => ({ tools:0, big:0, best:0, chill:0, burn:0, boom:0, heal:0, refl:0, wrong:0, pierce:0, brown:0, touched:{} });

/** What the quests read at any moment of the night. */
function snap(){
  const q = (G && G.q) || newQuestCounters();
  const fr = walls.map(w => w.max ? Math.max(0, w.hp) / w.max : 1);
  const tot = walls.reduce((a, w) => a + Math.max(0, w.hp), 0), mx = walls.reduce((a, w) => a + w.max, 0);
  const keys = ((G && G.loadout) || []).map(t => PTYPES[t] && PTYPES[t].key);
  return { q, minPct:Math.round(Math.min(1, ...fr) * 100), avgPct:Math.round((mx ? tot / mx : 1) * 100), keys, castlesLeft:((G && G.castles) || []).filter(w => !w.dead).length };
}

/**
 * Each type: text (card), short (in-night tracker) and check(s, p) -> { done, failed, txt }.
 * `done` is read at the end of a won night; `failed` means it can no longer be met tonight (tracker turns red).
 */
export const QUEST_TYPES = {
  win:       { text: () => 'Finish the night', check: () => ({ done:true, txt:'' }) },
  bunch5:    { text: p => `Launch ${p} bunch${p > 1 ? 'es' : ''} of 5 or more`, short:'Bunches of 5', check: (s, p) => ({ done:s.q.big >= p, txt:`${Math.min(s.q.big, p)}/${p}` }) },
  noTools:   { text: () => 'Win without using a tool', short:'No tools', check: s => ({ done:s.q.tools === 0, failed:s.q.tools > 0, txt:s.q.tools ? '✗' : '✓' }) },
  wallMin:   { text: p => `End the night with no wall below ${p}%`, short:p => `Lowest wall, ${p}%+`, check: (s, p) => ({ done:s.minPct >= p, failed:s.minPct < p, txt:`${s.minPct}%` }) },
  wallAvg:   { text: p => `End the night with walls at ${p}% or more`, short:p => `Walls, ${p}%+`, check: (s, p) => ({ done:s.avgPct >= p, failed:s.avgPct < p, txt:`${s.avgPct}%` }) },
  noTouch:   { text: p => `Do not let ${MON[p] || p} reach the fence`, short:p => p === 'fogwalker' ? 'No fogwalker at fence' : 'No ghoul at fence', check: (s, p) => ({ done:!s.q.touched[p], failed:!!s.q.touched[p], txt:s.q.touched[p] ? '✗' : '✓' }) },
  oneLaunch: { text: p => `Defeat ${p} monsters with one launch`, short:'Best launch', check: (s, p) => ({ done:s.q.best >= p, txt:`${Math.min(s.q.best, p)}/${p}` }) },
  chill:     { text: p => `Freeze or slow monsters ${p} times with Ice`, short:'Ice hits', check: (s, p) => ({ done:s.q.chill >= p, txt:`${Math.min(s.q.chill, p)}/${p}` }) },
  burn:      { text: p => `Burn monsters ${p} times with Fire`, short:'Fire hits', check: (s, p) => ({ done:s.q.burn >= p, txt:`${Math.min(s.q.burn, p)}/${p}` }) },
  iceOrFire: { text: p => `Freeze or slow monsters ${p} times with Ice, or burn them ${p} times with Fire`, short:s => 'Ice or Fire hits', check: (s, p) => ({ done:Math.max(s.q.chill, s.q.burn) >= p, txt:`${Math.min(Math.max(s.q.chill, s.q.burn), p)}/${p}` }) },
  boomer:    { text: p => `Boomerang ${p} White pumpkins back to the patch`, short:'Boomerangs', check: (s, p) => ({ done:s.q.boom >= p, txt:`${Math.min(s.q.boom, p)}/${p}` }) },
  heal:      { text: p => `Heal the fence ${p} times with Pink`, short:'Pink heals', check: (s, p) => ({ done:s.q.heal >= p, txt:`${Math.min(s.q.heal, p)}/${p}` }) },
  reflectMax:{ text: p => `Do not let pumpkins be reflected more than ${p} times`, short:'Reflects left', check: (s, p) => ({ done:s.q.refl <= p, failed:s.q.refl > p, txt:s.q.refl > p ? '✗' : `${p - s.q.refl}` }) },
  wrongMax:  { text: p => `Hit monsters with the wrong colour fewer than ${p} times`, short:'Wrong hits left', check: (s, p) => ({ done:s.q.wrong < p, failed:s.q.wrong >= p, txt:s.q.wrong >= p ? '✗' : `${p - 1 - s.q.wrong}` }) },
  castlesAll:{ text: () => 'Destroy every castle wall', short:'Castle walls left', check: s => ({ done:s.castlesLeft === 0, txt:`${s.castlesLeft}` }) },
  pierce:    { text: p => `Pierce ${p} monsters with Grey`, short:'Grey pierces', check: (s, p) => ({ done:s.q.pierce >= p, txt:`${Math.min(s.q.pierce, p)}/${p}` }) },
  brownBig:  { text: p => `Defeat ${p} monsters with a big Brown pumpkin`, short:'Big Brown kills', check: (s, p) => ({ done:s.q.brown >= p, txt:`${Math.min(s.q.brown, p)}/${p}` }) },
  must:      { text: ks => `Bring ${list(ks)} in your team`, short:'Team', check: (s, ks) => { const ok = ks.every(k => s.keys.includes(k)); return { done:ok, failed:!ok, txt:ok ? '✓' : '✗' }; } },
  team:      { text: ks => `Win with a team of ${list(ks)} (plus one more of any colour)`, short:'Team', check: (s, ks) => { const ok = ks.every(k => s.keys.includes(k)) && s.keys.length <= ks.length + 1; return { done:ok, failed:!ok, txt:ok ? '✓' : '✗' }; } },
};

/** The three quests of a level as [type, param] pairs. */
export function questsFor(def){
  const extra = def.quests && def.quests.length ? def.quests : QUEST_TABLE[def.label] || [['bunch5', 1], ['noTools']];
  return [['win'], ...extra].slice(0, 3);
}
/** Level 20: quests 2 and 3 only count together, in one run (owner). */
export const isPair = def => def.levelNo === 20;
export const questText = ([t, p]) => QUEST_TYPES[t] ? QUEST_TYPES[t].text(p) : t;
export const questShort = ([t, p]) => { const s = QUEST_TYPES[t] && QUEST_TYPES[t].short; return typeof s === 'function' ? s(p) : s || t; };
export const questBits = n => (save.quests && save.quests[n]) || 0;
export const countBits = b => ((b & 1) + ((b >> 1) & 1) + ((b >> 2) & 1));

/** Live state of one quest tonight (trackers and the pause menu). */
export function questLive([t, p]){ const T = QUEST_TYPES[t]; return T ? T.check(snap(), p) : { done:false, txt:'' }; }

/** Called on a won night: marks the quests met this run and returns { now, before, total } bitmasks. */
export function settleQuests(n, def){
  let now = 0;
  if (n < QUEST_START) now = 7;
  else {
    questsFor(def).forEach((q, i) => { if (questLive(q).done) now |= 1 << i; });
    if (isPair(def) && (now & 6) !== 6) now &= 1;   // the level-20 pair: both in one run, or neither
  }
  const before = questBits(n), total = before | now;
  save.quests = save.quests || {}; save.quests[n] = total; save.stars[n] = countBits(total);
  return { now, before, total };
}
