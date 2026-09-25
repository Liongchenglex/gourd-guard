import { TAU, clamp } from '../util.js';

export function ell(g, x, y, rx, ry, rot){ g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); }

export function tri(g, x, y, s){ g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.95, y + s * 0.6); g.lineTo(x - s * 0.95, y + s * 0.6); g.closePath(); g.fill(); }

export function rrect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export function hexToRgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

export function mix(a, b, t){ const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }

export function shade(c, d){ if (c[0] !== '#') return c; const A = hexToRgb(c); return `rgb(${A.map(v => clamp(v + d, 0, 255)).join(',')})`; }
