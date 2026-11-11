# Verdant Studio

Landscape design software for the AGPS 1024 Scott Residence lab at Arkansas Tech University.

An online version of the AGPS 1024 landscape design lab: students design the Scott family's yard on the real base plan, then export a sheet to turn in.

A professional-style landscape design tool (modeled on PRO Landscape): rendered presentation plans, a 74-plant library for central Arkansas, freeform beds, lawns and paving, multi-select/align/snap editing, named undo history, an automatic plant schedule and material takeoff, and an 11×17 presentation-board export.

Open `dist/verdant-studio.html` in any browser. Press `?` in the app for keyboard shortcuts.

## Giving it to students

The HTML file is fully self-contained (about 700 KB): fonts, the PDF maker and the base plan are all inside it. It needs no internet connection.

- **USB drive or computer:** copy `verdant-studio.html` anywhere and double-click it. Chrome, Edge, Firefox and Safari all work.
- **Blackboard:** upload the same file as a course file. Tell students to download it and open it from their computer. If they open it inside Blackboard instead, it still runs, but Blackboard may block the Save and Export downloads; the app then explains this and offers a copy/save-image fallback.
- **Personal use:** *New* (or File → New design) starts either another Scott Residence lab design or **My own yard**: enter the lot size, street side and north direction, start with a house outline, and optionally import a Google Maps screenshot or survey to trace (then *Set scale* by dragging along a known length). The Building tool draws more structures. The export sheet uses the project name, the client and a scale that fits the lot. File → My designs switches between designs kept in the browser.
- Work autosaves in the browser on that computer only. On a shared or lab computer, students should use **Save** to keep a `.json` design file (on their USB drive, for example) and **Open** to continue later.

## Hand it to Claude Code

1. Unzip this folder.
2. Open a terminal in it and run `claude`.
3. Tell it: "Read CLAUDE.md and build the app."

CLAUDE.md has the full brief. It covers what's done, what's left, the base plan geometry, every tool and check, and the export format.

## Build

```bash
python3 scripts/build.py   # → dist/verdant-studio.html
node scripts/e2e_test.js   # Playwright end-to-end check at 1440×900 and 390×844
node scripts/e2e_custom.js # own-yard flow: new design, trace image, export, My designs
node scripts/e2e_pro.js    # textures, smooth pan/zoom, lawn fill, edge snapping, safe saving
```
