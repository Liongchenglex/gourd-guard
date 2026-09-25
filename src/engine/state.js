export const W = 540, COLS = 7, ROWS = 5, CS = 74, GX = (W - COLS * CS) / 2;

export const LANE = c => GX + c * CS + CS / 2;

export let H = 960, GY = 0, FENCE_Y = 0, FIELD_TOP = 150, FIELD_BOT = 0;

export function layout(){
  GY = H - 26 - ROWS * CS;
  FENCE_Y = GY - 34;
  FIELD_BOT = FENCE_Y - 22;
  FIELD_TOP = Math.round(Math.max(140, H * 0.15));
}

layout();

// ---------- Game state ----------

export let G = null;

export let state = 'title';

export let grid = [], graves = [], walls = [];

export let gest = null;

export let bannerTimer = 0;

export let gidSeq = 0;

export const HOLD_TIME = 0.6;

export const setG = v => { G = v; };
export const setStateRaw = v => { state = v; };
export const setGrid = v => { grid = v; };
export const setGraves = v => { graves = v; };
export const setWalls = v => { walls = v; };
export const setGest = v => { gest = v; };
export const setBannerTimer = v => { bannerTimer = v; };
export const nextGid = () => ++gidSeq;
export const setH = v => { H = v; };
