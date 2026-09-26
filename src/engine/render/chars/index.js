// ---------- Character registry ----------
// Each world module exports a map of monster type (or boss kind) → character entry:
//   { draw(g, pose), scale, dy, box:{x,y,w,h}, clips:{ name:{ n, fps, once?, pose(t) } }, still?, frame?(m, clips), variants?:{ vkey:true } }
// draw() paints the character around (0,0) in drawing units with the feet near y = 50; pose carries the clip's
// parameters plus `variant` (a VARIANTS key) when the monster is a world variant. frame() may pick [clip, frameIndex]
// from the live monster for special states (shield up, submerged, hidden…); return null to use the default walk/chew logic.
// Spec: docs/superpowers/specs/2026-09-26-toy-plastic-sprites-design.md
import { W1, pumpkin } from './w1.js';
import { W2 } from './w2.js';
import { W3 } from './w3.js';
import { W4 } from './w4.js';
import { W5 } from './w5.js';

export const CHARS = { ...W1, ...W2, ...W3, ...W4, ...W5 };
export { pumpkin };
/** The type or boss kind a monster is drawn as, or null when it still uses the old vector drawing. */
export function charKey(m){ const k = m.type === 'boss' ? m.kind : m.type; return CHARS[k] ? k : null; }
/** Atlas key: a variant with its own costume gets its own strips. */
export function atlasKey(k, vkey){ const C = CHARS[k]; return C && C.variants && vkey && C.variants[vkey] ? k + '|' + vkey : k; }
/** The variant key a live monster draws with: its VARIANTS key, or one the character derives from state (chameleon colour). */
export function vkeyOf(m, k){ const C = CHARS[k]; if (C && C.vkeyOf){ const v = C.vkeyOf(m); if (v) return v; } if (m.form === 2 && C && C.variants && C.variants.form2) return 'form2'; return m.vkey || null; }
/** Whether a variant of this character has a drawn costume (then no colour tint is applied). */
export function hasCostume(k, vkey){ const C = CHARS[k]; return !!(C && C.variants && vkey && C.variants[vkey]); }
