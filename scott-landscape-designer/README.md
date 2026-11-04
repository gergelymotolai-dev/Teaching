# Scott Residence Landscape Designer

An online version of the AGPS 1024 landscape design lab: students design the Scott family's yard on the real base plan, then export a sheet to turn in.

A professional-style landscape design tool (modeled on PRO Landscape): rendered presentation plans, a 57-plant library for central Arkansas, freeform beds, lawns and paving, multi-select/align/snap editing, named undo history, an automatic plant schedule and material takeoff, and an 11×17 presentation-board export.

Open `dist/landscape-designer.html` in any browser. Press `?` in the app for keyboard shortcuts.

## Hand it to Claude Code

1. Unzip this folder.
2. Open a terminal in it and run `claude`.
3. Tell it: "Read CLAUDE.md and build the app."

CLAUDE.md has the full brief. It covers what's done, what's left, the base plan geometry, every tool and check, and the export format.

## Build

```bash
python3 scripts/build.py   # → dist/landscape-designer.html
node scripts/e2e_test.js   # Playwright end-to-end check at 1440×900 and 390×844
```
