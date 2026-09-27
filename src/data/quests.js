// Quests and stars (owner, 2026-09-27). Every level has three quests; completing one earns its star for good.
// Quest 1 is always "finish the night". Levels before QUEST_START give all three stars on a win (the owner's
// "1-1 and 1-2 are completed with 3 stars by default"). A level may list its own quests in its data as
// `quests: [['walls', 80], ['noTools']]` (slots 2 and 3); otherwise the stand-in rotation below is used until
// the owner's quest list arrives. Progress is kept per night as a bitmask in save.quests[n]; save.stars[n] is its count.
import { save } from '../save.js';

export const QUEST_START = 3;   // night 3 = level 1-3, where quests are introduced

/** Each type: text for the card, and done(stats, param) checked at the end of a WON night. */
export const QUEST_TYPES = {
  win:     { text: () => 'Finish the night', done: () => true },
  walls:   { text: p => `End the night with walls at ${p}% or more`, done: (s, p) => s.wallPct >= p },
  noTools: { text: () => 'Win without using a tool', done: s => s.toolsUsed === 0 },
  bunch5:  { text: p => `Launch ${p} bunch${p > 1 ? 'es' : ''} of 5 or more`, done: (s, p) => s.bigBunches >= p },
};

// Stand-in slots 2 and 3, rotated by level so neighbouring nights differ. Replace with the owner's list.
const ROTATION = [
  [['walls', 75], ['bunch5', 1]],
  [['noTools'], ['walls', 60]],
  [['bunch5', 2], ['noTools']],
];

/** The three quests of level def: [[type, param], ...]. */
export function questsFor(def){
  const extra = def.quests && def.quests.length ? def.quests : ROTATION[(def.levelNo - 1) % ROTATION.length];
  return [['win'], ...extra].slice(0, 3);
}
export const questText = ([t, p]) => QUEST_TYPES[t] ? QUEST_TYPES[t].text(p) : t;
export const questBits = n => (save.quests && save.quests[n]) || 0;
export const countBits = b => ((b & 1) + ((b >> 1) & 1) + ((b >> 2) & 1));

/** After a won night: which quests were met this run (bitmask), and the new total (bitmask). Saves both. */
export function settleQuests(n, def, stats){
  let now = 0;
  if (n < QUEST_START) now = 7;
  else questsFor(def).forEach(([t, p], i) => { if (QUEST_TYPES[t] && QUEST_TYPES[t].done(stats, p)) now |= 1 << i; });
  const before = questBits(n), total = before | now;
  save.quests = save.quests || {}; save.quests[n] = total; save.stars[n] = countBits(total);
  return { now, before, total };
}
