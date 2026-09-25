# Gourd Guard

A Halloween lane-defense puzzle game (working title). Playable prototype, headed toward a 120-level mobile game (6 worlds × 20 levels).

## What's in here

| Path | What it is |
|---|---|
| `index.html` | The playable prototype. Open it in any browser. |
| `docs/GAME_DESIGN.md` | Every rule, number and decision so far, as currently built. |
| `docs/WORLDS.md` | The locked Release 1 content plan: worlds, gimmicks, pumpkins, monsters, bosses, weapons, R2 backlog. |
| `CLAUDE.md` | Briefing that Claude Code reads automatically at the start of every session. |
| `tools/balance_bot.py` | Bot that plays full nights at human pace and reports how they went. |
| `tools/smoke_test.py` | Quick check that the game runs with real touch/mouse input and no errors. |

## Setting up Claude Code

1. Install the Claude desktop app from https://claude.ai/download and open the **Code** tab.
2. Unzip this folder somewhere permanent (for example `Documents/gourd-guard`) and open that folder in Claude Code.
3. Optional but recommended: let Claude Code turn it into a Git repository so every change can be undone.
4. For the test tools, Claude Code will need Python 3 and Playwright. You can simply ask it to set them up.

## Suggested first message to Claude Code

> Read CLAUDE.md and docs/GAME_DESIGN.md. Then set up the testing tools (Python + Playwright), run the smoke test and a balance run for nights 1, 5 and 10 so we have a baseline. After that, propose a plan for restructuring index.html into a data-driven project as described in CLAUDE.md, but don't start the restructure until I approve the plan.

After the restructure, bring your new ground rules and pumpkin ideas. Tell Claude Code to write them into the design doc first, then build them.

## Playing the prototype

Open `index.html` in a browser (phone or desktop). On a phone, the easiest way is to serve the folder from your computer on the same Wi-Fi, which Claude Code can set up for you.
