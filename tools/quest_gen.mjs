// Builds src/data/questTable.js from the owner's quest lists (questdump.md, 2026-09-27).
// Run: node tools/quest_gen.mjs   (deterministic: the same seed gives the same table; edit the output by hand if needed)
// Rules: fixed quests where the owner named them; otherwise two different picks from the level's pool, never
// sharing a quest type with the night before or after. N grows through each world.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const worlds = [];
for (let i = 1; i <= 5; i++){ const m = await import(`${root}src/data/worlds/world${i}.js`); worlds.push(Object.values(m).find(Array.isArray)); }
const ALL = worlds.flat();
const UNLOCK = {}; ALL.forEach((d, i) => (d.unlockPumpkins || []).forEach(k => { UNLOCK[k] = i; }));
const idx = d => ALL.indexOf(d);
const has = (d, re) => re.test(JSON.stringify(d.pool || []));

let seed = 20260927; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)];

const t = l => (l - 1) / 19;   // 0 at level 1, 1 at level 20
const N = {
  bunch5: l => 1 + Math.round(t(l) * 2),
  oneLaunch: l => Math.min(5, 2 + Math.round(t(l) * 3)),
  wallMin: l => 50 + Math.round(t(l) * 5) * 5,     // 50% -> 75%
  wallAvg: l => 60 + Math.round(t(l) * 5) * 5,     // 60% -> 85%
  boomer: l => 3 + Math.round(t(l) * 5),
  pierce: l => 8 + Math.round(t(l) * 7),
  heal: l => 10 + Math.round(t(l) * 5),
  brownBig: l => 10 + Math.round(t(l) * 4),
};
const q = (type, l, p) => p !== undefined ? [type, p] : N[type] ? [type, N[type](l)] : [type];

function mustPick(d, w){
  const i = idx(d), no = new Set(['rainbow', ...(d.unlockPumpkins || [])]);
  if (w < 5){ no.add('blue'); no.add('brown'); }
  if (w === 3) no.add('black');
  const ok = Object.keys(UNLOCK).filter(k => UNLOCK[k] <= i && !no.has(k)).concat(['green']).filter((k, j, a) => a.indexOf(k) === j && !no.has(k));
  const a = pick(ok); const two = rnd() < 0.5 ? pick(ok.filter(k => k !== a)) : null;
  return two ? [a, two] : [a];
}

function pool(d){
  const w = d.world, l = d.level, ghoul = has(d, /ghoul/i);
  const base = ['bunch5', 'noTools', 'wallMin', 'oneLaunch', ...(ghoul ? ['noTouch:ghoul'] : [])];
  if (w === 1) return base;
  if (w === 2) return [...base, 'iceOrFire', ...(l >= 4 ? ['boomer'] : [])];
  if (w === 3){
    if (l <= 9 || l === 12) return [...base, 'iceOrFire', 'boomer'];
    return ['noTools', 'wallAvg', 'heal', 'iceOrFire', 'wallMin', 'must'];
  }
  const w45 = [...base, ...(l >= 4 || w === 5 ? ['pierce'] : []), 'heal', 'iceOrFire', 'must'];
  if (w === 4) return [...w45, 'castlesAll'];
  return [...w45, ...(l >= 7 ? ['brownBig'] : [])];
}
const make = (key, d) => {
  const [type, arg] = key.split(':');
  if (type === 'must') return ['must', mustPick(d, d.world)];
  if (arg) return [type, arg];
  return q(type, d.level);
};

function fixed(d){
  const w = d.world, l = d.level;
  if (w === 1 && l < 3) return [];
  if (l === 20) return {
    1: [q('noTools', l), ['team', ['green', 'yellow', 'fire', 'ice']]],
    2: [q('noTools', l), ['team', ['green', 'pink', 'fire', 'white']]],
    3: [q('wallMin', l), ['team', ['turquoise', 'purple', 'white', 'ice']]],
    4: [q('castlesAll', l), ['team', ['black', 'fire', 'grey', 'ice']]],
    5: [['brownBig', 14], ['team', ['blue', 'brown', 'turquoise', 'pink']]],   // owner: 14 big-Brown kills (was 5 kills in one launch, too easy)
  }[w];
  if (l === 10) return {
    1: [q('noTools', l), q('wallMin', l)], 2: [q('noTools', l), q('wallMin', l)], 3: [['heal', 15], q('noTools', l)],
    4: [q('castlesAll', l), q('noTools', l)], 5: [q('noTools', l), q('wallAvg', l)],
  }[w];
  if (w === 1 && (l === 13 || l === 17)) return [['chill', 15], ['burn', 15]];
  if (w === 3 && (l === 13 || l === 17)) return [['reflectMax', 50], q('bunch5', l)];
  if (w === 3 && l === 14) return [['wrongMax', 15], q('noTools', l)];
  if (w === 2 && l >= 17) return [['noTouch', 'fogwalker'], null];   // plus one random from the world-2 pool
  if (w === 4 && l >= 18) return [q('castlesAll', l), null];
  return null;
}
// "freeze OR burn" (owner): each such slot is one or the other, never both; chosen by level so the other picks stay put
const N15 = (k, d) => k === 'iceOrFire' ? [(d.world + d.level) % 2 ? 'chill' : 'burn', 15] : null;

const fam = k => k.startsWith('wall') ? 'wall' : k.startsWith('noTouch') ? 'noTouch' : k;   // never two wall quests or two fence quests on one level
const table = {};
const types = x => (x || []).filter(Boolean).map(e => e[0] === 'chill' || e[0] === 'burn' ? 'iceOrFire' : e[0] + (e[0] === 'noTouch' ? ':' + e[1] : ''));
// pass 1: fixed levels
for (const d of ALL){ const f = fixed(d); if (f && !f.includes(null)) table[`${d.world}-${d.level}`] = f; }
// pass 2: the rest, avoiding the neighbours' quest types
for (const d of ALL){
  const key = `${d.world}-${d.level}`; if (table[key] || (d.world === 1 && d.level < 3)) continue;
  const f = fixed(d) || [null, null];
  const i = idx(d), prev = ALL[i - 1] && table[`${ALL[i - 1].world}-${ALL[i - 1].level}`], next = ALL[i + 1] && table[`${ALL[i + 1].world}-${ALL[i + 1].level}`];
  const avoid = new Set([...types(prev), ...types(next)]);
  const p = pool(d).filter(k => !f.some(e => e && (types([e])[0] === k || fam(types([e])[0]) === fam(k))));
  let cand = p.filter(k => !avoid.has(k)); if (cand.length < 2) cand = p;
  const out = f.slice();
  for (let s = 0; s < 2; s++){
    if (out[s]) continue;
    const k = pick(cand); cand = cand.filter(x => x !== k && fam(x) !== fam(k));
    out[s] = N15(k, d) || make(k, d);
  }
  table[key] = out;
}
delete table['1-1']; delete table['1-2'];

const lines = Object.entries(table).map(([k, v]) => `  '${k}': ${JSON.stringify(v).replace(/"/g, "'")},`);
writeFileSync(`${root}src/data/questTable.js`, `// Generated by tools/quest_gen.mjs from the owner's quest lists (2026-09-27). Quests 2 and 3 of each level as
// [type, param]; quest 1 is always "Finish the night". Hand edits are fine; re-running the tool overwrites them.
export const QUEST_TABLE = {
${lines.join('\n')}
};
`);
console.log(Object.keys(table).length, 'levels');
