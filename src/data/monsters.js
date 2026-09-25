// ---------- Monsters ----------

export const TYPES = {
  ghoul:  { hp:1,  r:21, sp:0.055, coins:2,  eat:0.5, pts:10, drop:0.8 },
  bat:    { hp:1,  r:16, sp:0.085, coins:2,  eat:0.4, pts:12, drop:0.8 },
  imp:    { hp:2,  r:17, sp:0.074, coins:3,  eat:0.6, pts:14, drop:1.5 },
  brute:  { hp:4,  r:28, sp:0.028, coins:6,  eat:1.1, pts:30, drop:3 },
  wraith: { hp:2,  r:21, sp:0.05,  coins:4,  eat:0.5, pts:20, drop:1.5 },
  boss:   { hp:13, r:52, sp:0.0092,coins:40, eat:1.0, pts:250, drop:6 },
};

export const MINTRO = {
  bat:'New foe: bats. Quick, but one hit does it.',
  imp:'New foe: imps. They take 2 hits and hop in sudden bursts.',
  brute:'New foe: mossbacks. They take 4 hits and chew walls fast, but drop 3 pumpkins.',
  wraith:'New foe: wraiths. They drift into the next column now and then.',
};

export const MFIRST = { bat:3, imp:5, brute:7, wraith:9 };
