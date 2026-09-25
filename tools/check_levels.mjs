// Equivalence check: the world1.js data table must reproduce the prototype's levelDef(n) exactly.
// Run: node tools/check_levels.mjs
import { levelFor, LEVELS } from '../src/data/worlds/index.js';
import { legacyLevelDef } from './legacy_leveldef.mjs';
if (LEVELS !== 15){ console.error('expected 15 levels, got', LEVELS); process.exit(1); }
for (let n = 1; n <= 15; n++){
  const a = JSON.stringify(levelFor(n)), b = JSON.stringify(legacyLevelDef(n));
  if (a !== b){ console.error('MISMATCH night', n, '\n', a, '\n', b); process.exit(1); }
}
console.log('levels identical');
