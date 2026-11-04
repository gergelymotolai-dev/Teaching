# Verdant Studio (Scott Residence Landscape Designer)

The app's name is **Verdant Studio**; the built file is `dist/verdant-studio.html`. localStorage keys keep their old `scottDesign.*` / `ldProject*` names so students' saved work survives.

A browser-based landscape design tool for Gary Motolai's **AGPS 1024 Principles of Plant Science** lab at Arkansas Tech University. Students act as landscape designers for a fictional client, the Scott family. They design the yard, turn in the design, and present it to the class, who play the client.

Right now students do this on paper. This tool lets them do it online too: place plant symbols and hardscape on the real base plan at true scale, label things, check off the client's list, and export a sheet to turn in.

## Status

| Piece | State |
|---|---|
| `src/template.html` | **Done.** Dark pro-app shell modeled on PRO Landscape: menu bar (File/Edit/View/Arrange/Help), options bar with plan style (Rendered / Color line / B&W) and Snap, icon tool rail, docked plant library, rulers, tabbed dock (Properties, History, Navigator, Layers, Objects, Client, Check, Schedule), context menu, status bar. |
| `src/plants.js` | **Done.** 57-species plant library for central Arkansas (zone 7b): mature size, light, hardiness, spacing, render colors, canopy form (`f`), schedule key codes. |
| `src/render.js` | **Done.** Species canopy forms (`FORMS`: maple, oak, ginkgo, birch, redbud, dogwood, crape, jmaple, fruit, multistem, pine, column, deodar, magnolia; shrubs fine, spiky, mophead, rose, berry, shrub), item types, shared SVG patterns/filters, rendered presentation symbols (textured canopies with sun shadows, mowing stripes, mulch beds, stone/brick/paver/deck textures) and the lab's drafting symbols. |
| `src/app.js` | **Done.** State, undo history with named steps, multi-select/marquee, copy/paste, align/distribute, lock/hide, grid and corner snapping, freeform curved/straight shapes with point editing, design check (incl. tree crowding and mature height under wires), plant schedule and material takeoff, 11×17 export (PNG/PDF/JSON), open/save. |
| `data/core.json` | **Done.** Base plan geometry as SVG element strings (see Geometry). |
| `scripts/build.py` | **Done.** Bundles plants.js + render.js + app.js into one script scope and inlines it, core.json, the fonts and jsPDF (from `src/vendor/`) into the template → `dist/verdant-studio.html`. Fails the build if any external `<link>`/`<script src>` is left. |
| `src/vendor/` | Bundled jsPDF 2.5.1 (MIT) and Oswald / Source Sans 3 variable fonts (SIL OFL), with their licenses. The fonts are also embedded in the exported sheet, so PNG/PDF use the real typefaces. |
| `scripts/e2e_test.js` | Playwright check at 1440×900 and 390×844 (`node scripts/e2e_test.js`). |
| `scripts/e2e_custom.js` | Playwright check of the own-yard flow (`node scripts/e2e_custom.js`). |
| `scripts/e2e_client.js` | Playwright check of the editable client checklist (`node scripts/e2e_client.js`). |
| `scripts/e2e_beds.js` | Playwright check of bed shapes, mixed beds, freeform beds and your own plants (`node scripts/e2e_beds.js`). |

### Projects and the base plan

- `state.site` absent = the Scott lab. `state.site = {kind:'custom', name, client, w, h, street, north, streetName, img?}` = a student's own yard. Every design keeps an editable client checklist in `state.wants = [{t, d}]` (add, double-click to edit, reorder, remove; the Scott lab starts with the brief's seven and has *Reset to the Scott family's list*). Older files with the fixed `checklist: [bool×7]` convert on open. `lot()`, `fitRect()`, `buildingPolys()`, `wantList()` hide the difference from the rest of the app.
- Each design has a `pid`. Autosave writes `scottDesign.v1` (current) plus `ldProject.<pid>` and the `ldProjects` index; File → My designs lists them.
- The Scott plan starts clean: only lot, roof plan, drive, sidewalk and street. Two layers are off by default: **Notes & labels** (`SITE_NOTES` dimensions/elevations, `BASE_NOTES`, `houseNotes()` door labels) and **Utility lines** (`SITE_UTIL`, overhead electric, service drop, underground). The power-line check still runs and tells students to turn the layer on.
- Beds (perennial, annual, groundcover boxes and `bedShape`) take any bed plant. `it.mix = [{sp, w}]` (2+ plants, shares kept at 100% by `balance()`) is drawn in drifts by `bedSpots()`/`plantedBed()` and counted per plant in the takeoff; one plant uses `it.sp`. Box beds have `form` (oval, rect, round). *Make freeform* turns box beds, lawns and patios into shapes with draggable corners.
- Plant library: clicking a plant always starts planting it (`pickPlant`); dragging a plant drops it on the plan or into the bed under the pointer (`dropPlant`, mouse and touch). Swapping a selected plant or adding to a selected bed are explicit buttons on the library card (`libActions`). The options bar (`renderOptCtx`) shows bed shape buttons (Oval, Rectangle, Rounded, Draw any shape / Freeform) and curved/straight edges for drawn shapes; it has a fixed height so the plan never shifts.
- Stacking: `state.items` order is the drawing order (bottom first), within each layer (design, diagram). `addItem()` inserts new items above everything of their band or lower, so defaults still look right (lawn under trees); `addCopies()` puts copies right above their originals. `reorder(2|1|-1|-2)` = to front, forward, backward, to back (forward/backward skip past the next overlapping item). Version-2 files are sorted by band once on open. The dock's **Layers** tab lists items top-first; dragging a row restacks (Alt+arrow keys too). The old visibility toggles are on the **Show** tab.
- Beds can have a raised `edge` (wood, stone, brick) or flat steel edging, drawn by `edgeUnder()`/`edgeOver()` and listed in the takeoff by length (`bedPerimeter()`).
- Students can add their own plants (library → Add your own plant). They live in `state.customPlants` (ids `u…`), are validated by `cleanCustomPlants()` and merged into `PLANTS`/`PLANT_BY_ID`/`PLANT_CODE` by `registerCustom()` on load, undo and design switch; new designs copy them.
- Fences have a `style` (privacy, picket, split, chain, iron) and `height`; Arrange → Fence the property line and the New design dialog add one along the non-street lot lines.
- The Scott house draws as a clean hip-roof plan (`cleanHouse()`), with door stoops, A/C and gas meter. The original floor plan from core.json (`BASE_FLOOR`, everything from the house polygon on) is the optional "House floor plan" layer.
- Title block: `titleInfo()` is the single source for the sheet header and title block (project, client, address, company, contact, designer, section, date). The Scott lab defaults to the lab title (editable, *Reset to the Scott lab title*); an own-yard design prints only what the student typed and the Export dialog requires project, client and designer before a PDF/PNG. Extra fields live in `state.title`; project/client of own-yard designs live in `state.site`.
- North arrow: `state.site.north` is degrees clockwise from the top of the page (old 'up'/'left' strings convert via `toNorthDeg`); the Scott lab is fixed at 270 (north left, per the brief). `state.title.arrow` picks the style (classic, simple, rose), drawn by `northSymbol()` on the plan and in the title block. Set in the Export dialog's North arrow section and in New design / Lot settings (`northControl`).
- The export picks the largest engineering scale (1 in = 10, 20, 30… ft) that fits a custom lot; the Scott sheet stays at 1 in = 10 ft.

Build with `python3 scripts/build.py`. Test with Playwright: Chromium and Playwright are usually installed already.

## Deliverable

One self-contained HTML file, `dist/verdant-studio.html`. No build tools beyond `build.py`, no frameworks, vanilla JS and inline SVG. It must work in two places:

1. **As a Claude artifact (claude.ai page).** It runs in a sandboxed frame:
   - `window.print`, `alert`, `confirm` and `prompt` are refused. Build in-page dialogs (`<dialog id="dlg">` is already in the template).
   - Downloads started by `<a download>` are refused. Use the `downloads` capability: `const dl = await window.claude?.use?.("downloads")`. If you get `null`, hide or fall back. Then `await dl.save({filename, data})`, where data is a string, Blob or ArrayBuffer. Allowed extensions include png, json, svg, pdf and html. The viewer confirms each save. Handle a rejection by its `.code`: `declined` gets no retry; `unavailable`/`not_granted` mean use the fallback.
   - Only scripts from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com (and a few others) load. Fonts come from Google Fonts. fetch to other hosts is blocked. Remote images don't load.
   - localStorage works per viewer but may throw. Wrap it in try/catch and use it only for autosave convenience.
2. **As a plain file** (Blackboard, a course website, or opened from disk). With no `window.claude`, use a normal `<a download>` with a blob URL.

**Fallback when neither download path works:** show the exported PNG in the dialog with "right-click → Save image as", and the design JSON in a textarea with a Copy button.

## Geometry (units are FEET)

World coordinates are in feet: x runs right from the left (north) property line, y runs down from the back (east) property line.

- Lot: 82 ft × 111 ft, rectangle (0,0)–(82,111).
- Orientation: **north points LEFT** on the page, so the street at the bottom is west. This is deliberate: the client brief says the busy street is on the west side.
- House footprint, as a polygon: (34,44) (59,44) (59,47) (75,47) (75,74) (34,74). The 59–75 notch at the back is set in 3 ft.
- Garage: rect (14,53)–(34,80).
- Driveway: x 16–32 from y 80 down to the sidewalk, flaring at the street.
- Public sidewalk: y 107–110.5, full width. Curb at y 112, street band 112–121, with the street centerline at 121.
- Overhead electric: along the back line at y 1.6, x 0.6→81.4, 15 ft high. Service drop from (81.4,1.6) to (74.6,47), 12 ft high.
- Underground line: (75.2,74.2) to (81,106.6), 2 ft below grade.
- Doors: front (50–53, y=74); family room back door (52–55, y=44); sliding doors (65–72, y=47); garage side door (19–22, y=53); garage overhead door (16–32, y=80).
- A/C unit at (76.4–78.8, 50.6–53). Gas meter at (70.3, 74.45).
- Spot elevations: FF 25.0; ground at the back 24.0; ground at the front door 23.5; garage slab 24.5.

`data/core.json` = `{"base": [...], "site": [...]}`. Each array holds SVG element strings drawn in **px** at 9.6 px/ft with the lot origin at px (120,128). Wrap them like this to get feet:

```html
<g transform="scale(0.1041666667) translate(-120,-128)"> ...base... </g>
<g id="siteInfo" transform="(same)"> ...site... </g>   <!-- toggle with "Site info" -->
```

- `base` = lot line, street, sidewalk, driveway, house and garage with doors, windows and room labels.
- `site` = dimensions, utility lines and labels, spot elevations, FF/slab elevations.

To change the base plan, edit `scripts/gen_baseplan.py` and regenerate:

```bash
python3 scripts/gen_baseplan.py --core > /tmp/full.json
python3 scripts/gen_baseplan.py --core --blank > /tmp/blank.json
python3 - <<'EOF'
import json
full=json.load(open('/tmp/full.json')); blank=json.load(open('/tmp/blank.json'))
bs=set(blank)
json.dump({"base":blank,"site":[e for e in full if e not in bs]},open('data/core.json','w'))
EOF
```

The same script also writes the printable 11×17 sheets (`python3 scripts/gen_baseplan.py out.html` gives the base plan with key; add `--blank` for the design plan sheet). Those are canvas-format `.dc.html` files. PDFs of both are in `reference/lab-materials/`.

## What app.js has to do

The template already has every element ID wired for these: `toolsBasic`, `toolsPlants`, `toolsBeds`, `toolsAreas`, `toolsDiagram`, `plan`, `hint`, `zIn`/`zOut`/`zFit`, `toast`, `props`, `clientList`, `bCheck`, `issues`, `sched`, `tSite`, `tGrid`, `tDiagram`, `tDesign`, `tTypes`, `tColor`, `bClear`, `bUndo`, `bRedo`, `bOpen`, `bSave`, `bExport`, `fileIn`, `fName`, `fSection`, `fDate`, `dlg`, `dlgBody`.

### Item types (defaults in feet)

Use the symbol styles from `reference/original/plan_graphic_symbols_scan.png` and the key on the base plan PDF: the same look as the paper version.

| Group | Kind | Shape | Default |
|---|---|---|---|
| Plants | Deciduous tree | circle, center dot, 5 branch lines | 30 ft spread |
| | Evergreen tree (conifer) | circle with radial spikes | 20 ft |
| | Broadleaf evergreen shrub | scalloped circle | 6 ft |
| | Deciduous shrub | circle with inner ring and dot | 6 ft |
| Beds | Herbaceous perennial bed | ellipse with small circles | 10 × 6 |
| | Annual bed | ellipse with stipple | 8 × 4 |
| | Ground cover | rounded rect with vertical hatch | 10 × 6 |
| Hardscape and use areas | Patio | rect, stone or concrete pattern | 16 × 14 |
| | Deck | rect, wood planks | 12 × 12 |
| | Walk / path | polyline, 4 ft wide, click points and double-click to finish | 4 ft |
| | Fence / screen | polyline with posts | — |
| | Vegetable garden | rect with row lines | 12 × 10 |
| | Wood stockpile | rect with log ends | 8 × 4 |
| | Lawn / recreation area | rounded rect, light stipple | 30 × 20 |
| | Bird bath / feeder | small circle symbol (the kids bird-watch) | 3 ft |
| Functional diagram | Use-area bubble | dashed ellipse with label; zone = public, private, service, recreation or garden; each zone gets its own light tint | 20 × 14 |
| | Circulation arrow | polyline with arrowhead | — |
| Basic | Select / move, Label (text), Measure (drag to show distance in ft; not saved) | | |

### Interaction

- **Select tool:** click an item to select it; drag to move. Drag on empty space to pan; the mouse wheel zooms around the cursor; +/−/fit buttons do the same. Touch must work for drag and pan (pointer events).
- **Handles:** circles get one radius handle. Rects and ellipses get a size handle and a rotate handle. Polylines get a handle on each vertex.
- **Placing:** plants stay in place mode so students can drop several, until Esc or the Select tool. Everything else goes back to Select after one placement. Show a ghost preview under the cursor and a hint in `#hint`.
- **Keys:** Delete/Backspace removes the selection (not while typing in an input). Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Shift+Z redo, Ctrl/Cmd+D duplicate, arrows nudge 1 ft (Shift for 5 ft), Esc cancels.
- **Properties panel (`#props`):** the type name; spread for plants, or width/length/rotation for areas; the label text; the zone for bubbles; the path width; the text size for labels. Plus Duplicate, Delete, Bring to front and Send to back.
- **Undo/redo:** snapshots of the state JSON, pushed after each committed change. Debounce typing.
- **Autosave** to localStorage (`scottDesign.v1`, in try/catch). Restore it on load.

### Right-hand panels

- **Client wants:** seven checkboxes, saved with the design: sidewalk to the front door; recreation area; outdoor sitting and entertaining area with partial shade; privacy on the patio and from the busy street on the west side; flower gardens front and back; small vegetable garden; wood stockpile area.
- **Design check** (`#bCheck` → `#issues`). Each issue gets a "Show" button that selects the item. Checks:
  1. A tree canopy overlaps the house or garage roof.
  2. A tree trunk is closer than 15 ft to the house (the handout says 15–20 ft from the side, 12–15 ft from a corner).
  3. A tree canopy reaches the overhead line or the service drop.
  4. An item is outside the property line, or sits on the driveway.
  5. A client-wants item is still unchecked.

  Show a green "No problems found" when everything passes. It's a nudge, not a grader.
- **Plant schedule:** a count of each plant and bed type.
- **Show toggles:** site info, 10 ft grid, functional diagram layer, design layer, plant type labels, color. Color off means a pure black-and-white drafting look.

### Export ("Export to turn in")

Build one **11×17 portrait sheet** that matches the paper design plan:

- Header: "SCOTT RESIDENCE — DESIGN PLAN · CLIENT: THE SCOTT FAMILY".
- The plan with the current layers.
- A symbol key showing only the types actually used, with counts.
- A title block: green panel with SCOTT RESIDENCE / DESIGN PLAN / AGPS 1024 · ARKANSAS TECH UNIVERSITY, then designer, section and date from the header fields, a north arrow pointing left, and a scale bar.

Offer three formats:

- **PNG** at about 3300×5100 px. Rasterize the SVG through an Image and a canvas. Web fonts won't embed in an SVG image, so use fallback fonts or convert text first.
- **PDF** at 11×17. jsPDF from cdnjs is fine: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`.
- **The design file (.json)**, so the student or Gary can reopen it.

"Save file" and "Open file" handle the `.json` (`{version, meta:{name,section,date}, checklist, items:[...]}`). Validate on open, and show a friendly error in the dialog if the file is bad.

## Look and voice

**ATU design system:**

- Colors: green `#1B5633`, deep green `#0E3A21`, gold `#FFCE00` (accent only, never big fills), paper `#F6F5EF`, hairline `#D9DCD3`, brick `#B23A2B` for errors.
- Fonts: Oswald, uppercase for display; Source Sans 3 for body.
- Radii 2–4 px, low soft shadows, no emoji, no gradients, no colored left-border cards.

The drawing itself stays drafting-style: black ink on white, with light tints only when Color is on. Copy is plain and addressed to students ("Click the plan to place it"). Accessibility: real buttons, labels on inputs, `aria-label` on icon-only buttons, visible focus (a gold outline), contrast of at least 4.5:1.

## Done means

- `python3 scripts/build.py` produces one HTML file under ~1 MB that works opened straight from disk.
- In Playwright, at 1440×900 and at 390×844:
  - place one of every item type;
  - move, resize, rotate and delete one;
  - undo and redo;
  - run the design check and get the expected issues: a tree placed against the house wall, a tree under the power line, and a clean design;
  - export the PNG and look at it;
  - save and reopen the JSON round trip;
  - get no console errors.
- No `alert`, `prompt`, `confirm` or `window.print` anywhere.

## Distribution (decided)

Gary uploads the HTML to Blackboard and also hands it out on USB drives. So the page must work **offline from file://**: no network requests at all (the e2e test runs with the network off and asserts zero requests, bundled fonts loaded, and a real PDF export). Inside a frame that blocks downloads (Blackboard), `saveBlob` returns `'framed'` and the app shows the copy / save-image fallback with a note.

## Open questions for Gary (ask, don't assume)

- Should designs be submitted inside the tool? That needs signed-in viewers, which students may not have. For now they turn in the exported PDF or PNG.

## Background files

- `reference/lab-materials/`: the lab handout (Design Project: The Scott Residence), the base plan and design plan PDFs, and the combined HTML. The handout's client brief, wants list and site notes are the spec for what students design.
- `reference/original/`: Gary's original lab document plus the scans of the base plan and the plan graphic symbols sheet.
