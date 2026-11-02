import { defineConfig } from 'vite';

// Releases (docs/RELEASES.md): every feature is tagged with the release it ships in, and a build includes releases up to __RELEASE__.
// Store builds (`npm run build`, then `npx cap sync`) ship STORE_RELEASE; the private playtest (`npm run build:playtest`) ships all.
// Bump STORE_RELEASE only when the owner ships the next release to the stores.
const STORE_RELEASE = 1;
const e = process.env;
const RELEASE = e.VITE_RELEASE === 'all' || e.VITE_W6 ? 999 : Number(e.VITE_RELEASE || STORE_RELEASE);   // VITE_W6=1 is the old name for "all"

export default defineConfig({ base: './', define: { __RELEASE__: JSON.stringify(RELEASE) }, build: { target: 'es2019', assetsInlineLimit: 0 } });
