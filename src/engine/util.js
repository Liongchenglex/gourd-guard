

export const TAU = Math.PI * 2;

export const $ = s => document.querySelector(s);

export const rnd = (a, b) => a + Math.random() * (b - a);

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

export const fmt = v => String(Math.round(v * 10) / 10);

export function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

