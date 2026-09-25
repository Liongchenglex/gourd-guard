# Gourd Guard

A Halloween lane-defense puzzle game (working title). Playable prototype, headed toward a 120-level mobile game (6 worlds × 20 levels).

## What's in here

| Path | What it is |
|---|---|
| `src/` | The game: engine, data (levels, pumpkins, monsters), UI. Built with Vite. |
| `index.html` | Vite entry page (DOM shell). Run `npm run dev` or `npm run build`; it is not playable as a bare file. |
| `docs/GAME_DESIGN.md` | Every rule, number and decision so far, as currently built. |
| `docs/WORLDS.md` | The locked Release 1 content plan: worlds, gimmicks, pumpkins, monsters, bosses, weapons, R2 backlog. |
| `CLAUDE.md` | Briefing that Claude Code reads automatically at the start of every session. |
| `tools/balance_bot.py` | Bot that plays full nights at human pace and reports how they went. |
| `tools/smoke_test.py` | Quick check that the game runs with real touch/mouse input and no errors. |
| `tools/serve_dist.py` | Tiny static server for `dist/`, used by both tools. |
| `tools/check_levels.mjs` | Proves the world 1 data table matches the old level formulas. |

## Setting up Claude Code

1. Install the Claude desktop app from https://claude.ai/download and open the **Code** tab.
2. Unzip this folder somewhere permanent (for example `Documents/gourd-guard`) and open that folder in Claude Code.
3. Optional but recommended: let Claude Code turn it into a Git repository so every change can be undone.
4. For the test tools, Claude Code will need Python 3 and Playwright. You can simply ask it to set them up.

## Working with Claude Code

Claude Code reads `CLAUDE.md` at the start of every session, then `docs/GAME_DESIGN.md` (rules as built) and `docs/WORLDS.md` (Release 1 target). Ask it for one rule or one world at a time; it runs the balance bot before and after each change.

## Playing the prototype

```
npm install
npm run dev        # opens a local dev server with live reload
```
or `npm run build` then `python3 tools/serve_dist.py` and open http://127.0.0.1:4173/. On a phone, ask Claude Code to publish the current build as a private link.
