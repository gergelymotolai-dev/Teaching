/* Scott Residence Landscape Designer — app: state, tools, panels, export.
 * World units are FEET: x runs right from the north property line, y runs down from the back (east) line.
 * Concatenated after plants.js and render.js by scripts/build.py. CORE comes from data/core.json. */

/* ------------------------------------------------------------------ constants */
const $ = (id) => document.getElementById(id);
const PX = 9.6, X0 = 120, Y0 = 128;
const CORE_T = `scale(${1 / PX}) translate(${-X0},${-Y0})`;
const LOT = { w: 82, h: 111 };
const FIT = { x: -6, y: -6, w: 94, h: 129 };
const HOUSE = [[34, 44], [59, 44], [59, 47], [75, 47], [75, 74], [34, 74]];
const GARAGE = [[14, 53], [34, 53], [34, 80], [14, 80]];
const DRIVE = { x1: 16, x2: 32, y1: 80, y2: 107 };
const WIRES = [
  { name: 'the overhead power line', a: [0.6, 1.6], b: [81.4, 1.6], h: 15 },
  { name: 'the service drop to the house', a: [81.4, 1.6], b: [74.6, 47], h: 12 },
];
const SNAP_PTS = [[0, 0], [82, 0], [82, 111], [0, 111], ...HOUSE, ...GARAGE, [16, 80], [32, 80], [16, 107], [32, 107], [50, 74], [53, 74], [52, 44], [55, 44], [65, 47], [72, 47]];
const STORE_KEY = 'scottDesign.v1';
const INDEX_KEY = 'ldProjects';
const PROJ_KEY = (id) => 'ldProject.' + id;
const NORTHS = { left: 'Left', up: 'Up', right: 'Right', down: 'Down' };
const STREETS = { bottom: 'Bottom', top: 'Top', left: 'Left', right: 'Right', none: 'No street' };
const VIEW_KEY = 'scottDesign.v3.view';
const WANTS = [
  'Sidewalk to the front door',
  'Recreation area',
  'Outdoor sitting and entertaining area with partial shade',
  'Privacy on the patio and from the busy street on the west side',
  'Flower gardens, front and back',
  'Small vegetable garden',
  'Wood stockpile area',
];
const NS = 'http://www.w3.org/2000/svg';
const KEYS = {
  select: 'V', hand: 'H', label: 'T', measure: 'M',
  dtree: '1', etree: '2', bshrub: '3', dshrub: '4', perennial: '5', annual: '6', groundcover: '7', bedShape: 'B',
  lawn: 'L', lawnShape: 'N', patio: 'P', paveShape: 'O', deck: 'K', path: 'W', fence: 'F', veg: 'G', wood: 'S', birdbath: 'Y',
  bubble: 'U', arrow: 'A', building: 'Q',
};
const LINE_ICO = {
  select: '<path d="M5 3l14 8-6 1.6L10 19z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v6"/><path d="M8 12.5 6.6 11a1.6 1.6 0 0 0-2.3 2.2L8 18c1.5 2 3 3 5.5 3H14a5 5 0 0 0 5-5v-4.5a1.5 1.5 0 0 0-3 0"/>',
  label: '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>',
  measure: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  imgscale: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M6 15 18 9"/><circle cx="6" cy="15" r="1.5"/><circle cx="18" cy="9" r="1.5"/>',
  library: '<path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M4 19a2 2 0 0 1 2-2h12"/><path d="M12 7c-2 0-3 1.4-3 3 2 0 3-1.4 3-3zm0 0c2 0 3 1.4 3 3-2 0-3-1.4-3-3zm0 0v6"/>',
};
const BASIC_NAMES = { select: 'Select / move', hand: 'Hand (pan)', label: 'Text label', measure: 'Measure', imgscale: 'Set image scale' };
const TIPS = {
  select: 'Click to select, Shift-click to add. Drag empty space to box-select. Alt-drag copies.',
  hand: 'Drag to move around the plan. Hold Space for the hand from any tool.',
  label: 'Click the plan to add a text label.', measure: 'Drag to measure a distance in feet.',
  dtree: 'Pick a species in the library, then click to plant. Drawn at mature spread.', etree: 'Conifers and evergreen trees for screens and windbreaks.',
  bshrub: 'Holly, boxwood, azalea and other evergreen shrubs.', dshrub: 'Hydrangea, rose, beautyberry and other shrubs that drop leaves.',
  perennial: 'Oval bed of perennials. Pick the plant in the library.', annual: 'Oval bed of annuals for seasonal color.', groundcover: 'Rectangle of ground cover.',
  bedShape: 'Draw any bed outline: click each point, double-click or click the first point to close.',
  lawn: 'Rectangle of lawn. Pick the grass in the library.', lawnShape: 'Draw a curved lawn edge point by point.',
  patio: 'Rectangle patio. Choose stone, pavers, brick or concrete.', paveShape: 'Draw any paved shape point by point.',
  deck: 'Wood deck.', path: 'Click each corner of the walk, double-click to finish.', fence: 'Click each corner of the fence, double-click to finish. Pick the style (privacy, picket, split rail, chain link, metal) under Properties, or use Arrange → Fence the property line.',
  veg: 'Raised vegetable garden.', wood: 'Firewood stockpile.', birdbath: 'Bird bath or feeder. The kids birdwatch.',
  bubble: 'Use-area bubble for the functional diagram.', arrow: 'Circulation arrow: click points, double-click to finish.',
  building: 'Draw a house, garage or shed outline: click each corner, then click the first corner to close.',
};
const RAIL = [
  ['select', 'hand', 'label', 'measure'],
  ['dtree', 'etree', 'bshrub', 'dshrub'],
  ['perennial', 'annual', 'groundcover', 'bedShape'],
  ['building', 'lawn', 'lawnShape', 'patio', 'paveShape', 'deck', 'path', 'fence', 'veg', 'wood', 'birdbath'],
  ['bubble', 'arrow'],
];

/* ------------------------------------------------------------------ state */
let idSeq = 0;
const uid = () => 'i' + Date.now().toString(36) + (idSeq++).toString(36) + Math.floor(Math.random() * 1296).toString(36);
const scottWants = () => WANTS.map((t) => ({ t, d: false }));
function blankState() { return { version: 2, pid: uid(), meta: { name: '', section: '', date: '' }, wants: scottWants(), items: [] }; }
const isScott = () => !state.site;
const lot = () => (isScott() ? LOT : { w: state.site.w, h: state.site.h });
const projName = () => (isScott() ? 'Scott Residence' : (state.site.name || 'My yard'));
const clientName = () => (isScott() ? 'The Scott family' : (state.site.client || ''));
function fitRect() {
  if (isScott()) return FIT;
  const st = state.site, m = 6, sw = 16;
  let x = -m, y = -m, x2 = st.w + m, y2 = st.h + m;
  if (st.street === 'bottom') y2 = st.h + sw; if (st.street === 'top') y = -sw;
  if (st.street === 'left') x = -sw; if (st.street === 'right') x2 = st.w + sw;
  return { x, y, w: x2 - x, h: y2 - y };
}
function wantList() { if (!Array.isArray(state.wants)) state.wants = []; return state.wants; }
function buildingPolys() {
  const b = isScott() ? [{ poly: HOUSE, name: 'house' }, { poly: GARAGE, name: 'garage' }] : [];
  for (const it of state.items) if (it.type === 'building' && !it.hidden) b.push({ poly: it.pts, name: it.label ? it.label.toLowerCase() : 'building', id: it.id });
  return b;
}
let state = blankState();
let sel = [];                      // selected ids
let tool = 'select';
const curSp = Object.assign({}, SP_DEFAULT);
let libSp = SP_DEFAULT.dtree;      // species shown in the library info card
const view = { cx: 41, cy: 58, k: 6, site: false, util: false, grid: false, diagram: true, design: true, tags: false, base: true, style: 'render', snap: true, lib: true, floor: false, img: true };
let hist = [], hIdx = -1, commitTimer = null, pendingLabel = 'Edit';
let checkRun = false;
let draft = null, hover = null, measure = null, marquee = null, snapMark = null;
let clip = [], pasteN = 0;
const lastFence = { style: 'privacy', height: 6 };
const byId = (id) => state.items.find((i) => i.id === id);
const selItems = () => sel.map(byId).filter(Boolean);
const single = () => (sel.length === 1 ? byId(sel[0]) || null : null);
const drawOpts = (extra) => Object.assign({ u: 0.125, render: view.style === 'render', color: view.style !== 'bw', tags: view.tags }, extra || {});

/* ------------------------------------------------------------------ history */
const snapshot = () => JSON.stringify(state);
function commit(label) {
  clearTimeout(commitTimer); commitTimer = null;
  const s = snapshot();
  if (hist[hIdx] && hist[hIdx].s === s) return;
  hist = hist.slice(0, hIdx + 1);
  hist.push({ s, label: label || pendingLabel || 'Edit' });
  if (hist.length > 150) hist.shift();
  hIdx = hist.length - 1;
  autosave(s);
  renderSide();
}
function commitSoon(label) { pendingLabel = label || 'Edit'; clearTimeout(commitTimer); commitTimer = setTimeout(() => commit(pendingLabel), 450); renderSide(true); }
function flush() { if (commitTimer) commit(pendingLabel); }
function jumpTo(i) {
  flush();
  if (i < 0 || i >= hist.length || i === hIdx) return;
  hIdx = i; restore(hist[hIdx].s);
}
function undo() { flush(); if (hIdx <= 0) { toast('Nothing to undo'); return; } toast('Undo ' + hist[hIdx].label); jumpTo(hIdx - 1); }
function redo() { flush(); if (hIdx >= hist.length - 1) { toast('Nothing to redo'); return; } jumpTo(hIdx + 1); toast('Redo ' + hist[hIdx].label); }
function restore(s) {
  state = JSON.parse(s);
  registerCustom(state.customPlants);
  sel = sel.filter((id) => byId(id));
  autosave(s);
  syncMeta(); renderAll();
}
let storageWarned = false;
function readIndex() { try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}') || {}; } catch (e) { return {}; } }
function autosave(s) {
  try {
    localStorage.setItem(STORE_KEY, s);
    localStorage.setItem(PROJ_KEY(state.pid), s);
    const idx = readIndex();
    idx[state.pid] = { name: projName(), kind: isScott() ? 'scott' : 'custom', t: Date.now(), n: state.items.length, by: state.meta.name || '' };
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch (e) {
    if (!storageWarned && e && /quota/i.test(e.name + e.message)) { storageWarned = true; toast('Browser storage is full. Use Save to keep a design file.'); }
  }
}
function saveView() {
  try { localStorage.setItem(VIEW_KEY, JSON.stringify({ site: view.site, grid: view.grid, diagram: view.diagram, design: view.design, tags: view.tags, base: view.base, style: view.style, snap: view.snap, lib: view.lib, floor: view.floor, img: view.img, util: view.util })); } catch (e) { /* ignore */ }
}

/* ------------------------------------------------------------------ validation */
function numOr(v, min, max, def) {
  const x = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(x)) { if (def === undefined) throw new Error('bad number'); return def; }
  return clamp(x, min, max);
}
function cleanState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error("This file isn't a Scott Residence design file.");
  if (!Array.isArray(raw.items)) throw new Error("This file doesn't have a list of design items, so it isn't a Scott Residence design file.");
  if (raw.items.length > 3000) throw new Error('This file has too many items to open.');
  const st = blankState();
  const m = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  for (const k of ['name', 'section', 'date']) st.meta[k] = typeof m[k] === 'string' ? m[k].slice(0, 80) : '';
  const cleanWants = (w) => w.slice(0, 40).filter((x) => x && typeof x.t === 'string' && x.t.trim()).map((x) => ({ t: x.t.slice(0, 120), d: !!x.d }));
  /* older Scott files kept a fixed list of seven checkboxes; turn it into the editable list */
  st.wants = Array.isArray(raw.wants) ? cleanWants(raw.wants) : WANTS.map((t, i) => ({ t, d: Array.isArray(raw.checklist) && !!raw.checklist[i] }));
  if (typeof raw.pid === 'string' && /^[\w-]{1,40}$/.test(raw.pid)) st.pid = raw.pid;
  if (raw.site && typeof raw.site === 'object') {
    const r = raw.site;
    let w, h;
    try { w = numOr(r.w, 10, 2000); h = numOr(r.h, 10, 2000); } catch (e) { throw new Error('The lot size in this file is missing or not a number.'); }
    st.site = { kind: 'custom', name: typeof r.name === 'string' ? r.name.slice(0, 60) : 'My yard', client: typeof r.client === 'string' ? r.client.slice(0, 60) : '',
      w, h, street: STREETS[r.street] ? r.street : 'bottom', north: NORTHS[r.north] ? r.north : 'up', streetName: typeof r.streetName === 'string' ? r.streetName.slice(0, 40) : '' };
    const im = r.img;
    if (im && typeof im === 'object' && typeof im.src === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(im.src) && im.src.length < 6e6) {
      try { st.site.img = { src: im.src, x: numOr(im.x, -2000, 4000), y: numOr(im.y, -2000, 4000), w: numOr(im.w, 1, 6000), h: numOr(im.h, 1, 6000), op: numOr(im.op, 0.05, 1, 0.6) }; } catch (e) { /* drop a broken image */ }
    }
    if (!Array.isArray(raw.wants)) st.wants = [];
  }
  st.customPlants = cleanCustomPlants(raw.customPlants);
  const localCustom = Object.fromEntries(st.customPlants.map((c) => [c.id, c]));
  const findSp = (id) => (PLANT_BY_ID[id] && !PLANT_BY_ID[id].custom ? PLANT_BY_ID[id] : localCustom[id]);
  const seen = new Set();
  raw.items.forEach((r, i) => {
    const where = `Item ${i + 1}`;
    if (!r || typeof r !== 'object') throw new Error(`${where} in the file is damaged.`);
    const t = T[r.type];
    if (!t) throw new Error(`${where} has a type this tool doesn't know ("${String(r.type).slice(0, 30)}").`);
    let id = typeof r.id === 'string' && r.id ? r.id.slice(0, 40) : uid();
    if (seen.has(id)) id = uid();
    seen.add(id);
    const it = { id, type: r.type };
    try {
      if (t.kind === 'line' || t.kind === 'shape') {
        const min = t.kind === 'shape' ? 3 : 2;
        if (!Array.isArray(r.pts) || r.pts.length < min || r.pts.length > 500) throw 0;
        it.pts = r.pts.map((p) => { if (!Array.isArray(p)) throw 0; return [numOr(p[0], -200, 300), numOr(p[1], -200, 300)]; });
        if (r.type === 'path') it.width = numOr(r.width, 1, 30, 4);
        if (t.kind === 'shape') it.smooth = r.smooth === undefined ? !!t.d.smooth : !!r.smooth;
      } else {
        it.x = numOr(r.x, -200, 300); it.y = numOr(r.y, -200, 300);
        if (t.kind === 'circle') it.r = numOr(r.r, 0.25, 60, t.d.r);
        if (t.kind === 'box') { it.w = numOr(r.w, 1, 200, t.d.w); it.h = numOr(r.h, 1, 200, t.d.h); it.rot = numOr(r.rot, -360, 360, 0); }
        if (t.kind === 'text') { it.text = typeof r.text === 'string' ? r.text.slice(0, 200) : 'Label'; it.size = numOr(r.size, 0.5, 20, 2); }
      }
    } catch (e) { throw new Error(`${where} (${t.name.toLowerCase()}) has a missing or bad position or size.`); }
    if (typeof r.label === 'string' && r.label && t.kind !== 'text') it.label = r.label.slice(0, 120);
    if (r.type === 'bubble') it.zone = ZONES[r.zone] ? r.zone : 'private';
    if (r.type === 'patio' || r.type === 'paveShape') it.finish = FINISHES[r.finish] ? r.finish : t.d.finish;
    if (r.type === 'path') it.finish = PATH_FINISHES[r.finish] ? r.finish : 'concrete';
    if (r.type === 'fence') { it.style = FENCE_STYLES[r.style] ? r.style : 'privacy'; it.height = numOr(r.height, 2, 12, FENCE_HEIGHT[it.style]); }
    const cats = spCats(r.type);
    if (cats.length) {
      const sp = findSp(r.sp);
      if (sp && cats.includes(sp.t)) it.sp = sp.id;
      else if (r.type !== 'bedShape') it.sp = t.d.sp;
      if (isBedType(r.type) && Array.isArray(r.mix)) {
        const mix = r.mix.slice(0, 12).map((m) => m && findSp(m.sp) && cats.includes(findSp(m.sp).t) ? { sp: m.sp, w: numOr(m.w, 1, 100, 1) } : null).filter(Boolean);
        if (mix.length > 1) { it.mix = mix; it.sp = mix[0].sp; }
      }
    }
    if (['perennial', 'annual', 'groundcover'].includes(r.type) && ['oval', 'rect', 'round'].includes(r.form)) it.form = r.form;
    if (r.locked) it.locked = true;
    if (r.hidden) it.hidden = true;
    st.items.push(it);
  });
  return st;
}

/* ------------------------------------------------------------------ plan SVG */
const svg = $('plan');
svg.setAttribute('xmlns', NS);
svg.innerHTML = DEFS +
  `<defs><filter id="sheetShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="0.6" stdDeviation="1.2" flood-color="#000" flood-opacity="0.5"/></filter></defs>` +
  `<rect id="sheetRect" fill="#fff" filter="url(#sheetShadow)"/>` +
  `<g id="gImg" pointer-events="none"></g><g id="gBase" pointer-events="none"></g><g id="gGrid" pointer-events="none"></g><g id="gDesign"></g>` +
  `<g id="gSite" pointer-events="none"></g>` +
  `<g id="gDiagram"></g><g id="gOver"></g>`;
const gImg = $('gImg'), gBase = $('gBase'), gGrid = $('gGrid'), gSite = $('gSite'), gDesign = $('gDesign'), gDiagram = $('gDiagram'), gOver = $('gOver');
const css = document.createElement('style');
css.textContent = `
#plan.sel [data-id]{cursor:move}
#plan [data-h]{cursor:grab}
#plan [data-h^="m"]{cursor:copy}
#plan.place{cursor:crosshair}
#plan.hand,#plan.space,#plan.space [data-id],#plan.hand [data-id]{cursor:grab}
#plan.panning,#plan.panning [data-id]{cursor:grabbing}
.dlg .btnrow{margin-top:12px}
.dlg .warn{background:#3A3320;border:1px solid #8A7428;color:#F5E3A3;padding:8px 10px;border-radius:3px}
.dlg .err{background:#3D2320;border:1px solid #8E4338;color:#F6C2B9;padding:8px 10px;border-radius:3px}
.dlg .fmt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
.dlg .fmt .btn{flex-direction:column;justify-content:center;min-height:60px;text-align:center;font-size:13px}
.dlg .fmt .btn small{font-weight:400;color:var(--muted);font-size:12px}
.dlg .fmt .btn.gold small{color:#3D3300}
.dlg .preview{background:#1A1B19;border:1px solid #000;padding:12px;border-radius:2px;margin-bottom:10px}
.dlg .preview img{max-height:46vh;background:#fff;margin:0 auto}
.dlg .keys{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}
.dlg .keys div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:3px 0}
.props-h{display:flex;align-items:center;gap:8px;font-family:var(--display);font-weight:500;font-size:14px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em}
.props-h .chip{width:28px;height:24px}.props-h .chip svg{width:26px;height:22px}
.mixrow{display:flex;align-items:center;gap:5px;margin-bottom:5px}
.mixrow .chip{width:26px;height:24px;border-radius:2px;background:#F4F3EE}.mixrow .chip svg{width:24px;height:22px}
.mixrow select{flex:1;min-width:0;height:28px;padding:3px 6px;border:1px solid var(--line-2);border-radius:2px;background:var(--well);color:var(--text)}
.mixrow input{width:52px;height:28px;padding:3px 5px;border:1px solid var(--line-2);border-radius:2px;background:var(--well);color:var(--text)}
.yours{font-family:var(--display);font-size:9.5px;font-weight:600;letter-spacing:.08em;color:#1A1A1A;background:var(--gold);border-radius:2px;padding:0 4px;margin-left:4px;vertical-align:1px}
.dlg .sunpick{display:flex;gap:14px;flex-wrap:wrap}.dlg .sunpick label{display:flex;gap:5px;align-items:center;font-size:14px;text-transform:none;letter-spacing:0;color:var(--text);font-weight:400}
.dlg input[type=color]{height:30px;padding:2px;width:100%}
.want{display:flex;align-items:flex-start;gap:4px}
.want .check{flex:1;min-width:0}
.want .wb{display:flex;opacity:0;transition:opacity .12s}
.want:hover .wb,.want:focus-within .wb{opacity:1}
@media (hover:none){.want .wb{opacity:1}}
.want .iconbtn{width:22px;height:22px}
.want .iconbtn svg{width:13px;height:13px}
.wedit{flex:1;min-width:0;height:28px;padding:3px 7px;border:1px solid var(--line-2);border-radius:2px;background:var(--well);color:var(--text)}
@media (max-width:560px){.dlg .fmt{grid-template-columns:1fr}.dlg .keys{grid-template-columns:1fr}}
`;
document.head.appendChild(css);

/* ------------------------------------------------------------------ view / zoom / rulers */
function size() { const r = svg.getBoundingClientRect(); return { W: Math.max(1, r.width), H: Math.max(1, r.height), L: r.left, T: r.top }; }
function applyView() {
  const { W, H } = size();
  svg.setAttribute('viewBox', `${n(view.cx - W / 2 / view.k)} ${n(view.cy - H / 2 / view.k)} ${n(W / view.k)} ${n(H / view.k)}`);
  renderOverlay(); renderRulers(); renderNavRect();
  $('sbZoom').innerHTML = `Zoom <b>${Math.round(view.k / PX * 100)}%</b>`;
}
function fitK() { const { W, H } = size(), F = fitRect(); return Math.min(W / F.w, H / F.h) * 0.96; }
function fit() { const F = fitRect(); view.k = fitK(); view.cx = F.x + F.w / 2; view.cy = F.y + F.h / 2; applyView(); }
function toWorld(cx, cy) { const { W, H, L, T: Tp } = size(); return [view.cx + (cx - L - W / 2) / view.k, view.cy + (cy - Tp - H / 2) / view.k]; }
function zoomAt(sx, sy, f) {
  const p = toWorld(sx, sy), { W, H, L, T: Tp } = size();
  view.k = clamp(view.k * f, fitK() * 0.4, 160);
  view.cx = p[0] - (sx - L - W / 2) / view.k; view.cy = p[1] - (sy - Tp - H / 2) / view.k;
  applyView();
}
function zoomCenter(f) { const { W, H, L, T: Tp } = size(); zoomAt(L + W / 2, Tp + H / 2, f); }
function zoomActual() { view.k = PX; applyView(); }
function centerOn(p) { view.cx = p[0]; view.cy = p[1]; if (view.k < fitK() * 1.6) view.k = fitK() * 1.6; applyView(); }
function rulerMarks(len, w0, k, vertical) {
  const major = [1, 2, 5, 10, 20, 50].find((s) => s * k >= 56) || 50;
  const minor = major / (major % 5 === 0 ? 5 : 2);
  let d = '', txt = '';
  for (let v = Math.ceil(w0 / minor) * minor; (v - w0) * k <= len; v += minor) {
    const px = n((v - w0) * k) + 0.5;
    const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const L = isMaj ? 20 : (Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6 ? 8 : 5);
    d += vertical ? `M${20 - L},${px}H20` : `M${px},${20 - L}V20`;
    if (isMaj) { const lab = Math.round(v * 10) / 10; txt += vertical ? `<text x="9" y="${px + 3}" transform="rotate(-90 9 ${px + 3})">${lab}</text>` : `<text x="${px + 3}" y="9">${lab}</text>`; }
  }
  return `<path d="${d}" stroke="#7D8077" stroke-width="1" fill="none"/><g fill="#A9ACA2" font-size="9" font-family="'Source Sans 3',Arial,sans-serif">${txt}</g>` +
    `<line id="${vertical ? 'rlCur' : 'rtCur'}" ${vertical ? 'x1="0" x2="20"' : 'y1="0" y2="20"'} stroke="#FFCE00" stroke-width="1" visibility="hidden"/>`;
}
function renderRulers() {
  const top = $('rulerTop'), left = $('rulerLeft');
  if (!top || !top.clientWidth) return;
  const { W, H } = size();
  top.innerHTML = rulerMarks(W, view.cx - W / 2 / view.k, view.k, false);
  left.innerHTML = rulerMarks(H, view.cy - H / 2 / view.k, view.k, true);
}
function trackCursor(p) {
  const { W, H } = size(), rt = $('rtCur'), rl = $('rlCur');
  if (p) {
    $('sbXY').innerHTML = `X <b>${p[0].toFixed(1)}</b> ft &nbsp; Y <b>${p[1].toFixed(1)}</b> ft`;
    const x = n((p[0] - (view.cx - W / 2 / view.k)) * view.k) + 0.5, y = n((p[1] - (view.cy - H / 2 / view.k)) * view.k) + 0.5;
    if (rt) { rt.setAttribute('x1', x); rt.setAttribute('x2', x); rt.setAttribute('visibility', 'visible'); }
    if (rl) { rl.setAttribute('y1', y); rl.setAttribute('y2', y); rl.setAttribute('visibility', 'visible'); }
  } else {
    $('sbXY').innerHTML = 'X <b>—</b> &nbsp; Y <b>—</b>';
    if (rt) rt.setAttribute('visibility', 'hidden');
    if (rl) rl.setAttribute('visibility', 'hidden');
  }
}

/* ------------------------------------------------------------------ navigator */
const nav = $('nav');
nav.innerHTML = `<svg id="navSvg" preserveAspectRatio="xMidYMid meet" pointer-events="none">` +
  `<rect id="navBg" fill="#fff"/>` +
  '<use href="#gImg"/><use href="#gBase"/><use href="#gDesign"/><use href="#gDiagram"/>' +
  '<rect id="navRect" fill="rgba(79,155,217,.12)" stroke="#E0453A" stroke-width="0.9"/></svg>';
function renderNavRect() {
  const r = $('navRect');
  if (!r) return;
  const { W, H } = size();
  r.setAttribute('x', n(view.cx - W / 2 / view.k)); r.setAttribute('y', n(view.cy - H / 2 / view.k));
  r.setAttribute('width', n(W / view.k)); r.setAttribute('height', n(H / view.k));
}
function navTo(e) {
  const F = fitRect(), r = nav.getBoundingClientRect(), vw = F.w + 4, vh = F.h + 4;
  const s = Math.min(r.width / vw, r.height / vh), ox = (r.width - vw * s) / 2, oy = (r.height - vh * s) / 2;
  view.cx = F.x - 2 + (e.clientX - r.left - ox) / s; view.cy = F.y - 2 + (e.clientY - r.top - oy) / s;
  applyView();
}
nav.addEventListener('pointerdown', (e) => { nav.setPointerCapture(e.pointerId); navTo(e); nav.dataset.drag = '1'; });
nav.addEventListener('pointermove', (e) => { if (nav.dataset.drag) navTo(e); });
nav.addEventListener('pointerup', () => { delete nav.dataset.drag; });


/* ------------------------------------------------------------------ base plan: Scott lab house or the student's own lot */
const HOUSE_IDX = CORE.base.findIndex((e) => e.startsWith('<polygon'));
const isNoteText = (e) => /<text[^>]*>(DRIVEWAY|PUBLIC SIDEWALK)<\/text>/.test(e);
const BASE_LOT = CORE.base.slice(0, HOUSE_IDX).filter((e) => !isNoteText(e)).join(''), BASE_FLOOR = CORE.base.slice(HOUSE_IDX).join('');
const BASE_NOTES = CORE.base.slice(0, HOUSE_IDX).filter(isNoteText).join('');
/* core.json site layer: 0-13 lot dimensions, 14-46 overhead electric, service drop and underground line, 47+ elevations */
const UTIL_FROM = CORE.site.findIndex((e) => /<line[^>]*y1="143\.4"/.test(e)), UTIL_TO = CORE.site.findIndex((e) => /FF EL\./.test(e));
const SITE_UTIL = CORE.site.slice(UTIL_FROM, UTIL_TO).join('');
const SITE_NOTES = CORE.site.slice(0, UTIL_FROM).concat(CORE.site.slice(UTIL_TO)).join('');
/* hip roof on a rectangle: faces shaded as if lit from the south (page right) */
function hipRoof(x1, y1, x2, y2, o) {
  const w = x2 - x1, h = y2 - y1, base = o.render ? '#CBC5BA' : (o.color ? '#EFEEE9' : '#fff');
  const tone = (k) => (o.render ? shade(base, k) : base);
  let R1, R2, faces;
  if (w >= h) {
    const r = h / 2; R1 = [x1 + r, y1 + r]; R2 = [x2 - r, y1 + r];
    faces = [[[[x1, y1], [x2, y1], R2, R1], 0.1], [[[x1, y2], [x2, y2], R2, R1], -0.08], [[[x1, y1], R1, [x1, y2]], -0.2], [[[x2, y1], R2, [x2, y2]], 0.22]];
  } else {
    const r = w / 2; R1 = [x1 + r, y1 + r]; R2 = [x1 + r, y2 - r];
    faces = [[[[x1, y1], [x1, y2], R2, R1], -0.2], [[[x2, y1], [x2, y2], R2, R1], 0.22], [[[x1, y1], [x2, y1], R1], 0.1], [[[x1, y2], [x2, y2], R2], -0.08]];
  }
  const line = o.render ? '#6E675E' : INK;
  let s = faces.map(([pts, k]) => `<path d="${ptsD(pts)}Z" fill="${tone(k)}"/>`).join('');
  s += `<path d="M${n(R1[0])},${n(R1[1])}L${n(R2[0])},${n(R2[1])}M${n(x1)},${n(y1)}L${n(R1[0])},${n(R1[1])}M${n(x2)},${n(y1)}L${n(R2[0])},${n(R2[1])}M${n(x1)},${n(y2)}L${n(w >= h ? R1[0] : R2[0])},${n(w >= h ? R1[1] : R2[1])}M${n(x2)},${n(y2)}L${n(R2[0])},${n(R2[1])}" stroke="${line}" stroke-width="0.14" fill="none"/>`;
  return s;
}
function cleanHouse(o) {
  const ink = '#222', paper = o.render ? '#EDEAE3' : '#fff', lab = (x, y, t, fs, w) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="${w || 600}" font-size="${fs}" letter-spacing="0.05em" fill="${INK}" paint-order="stroke" stroke="${o.render ? '#E6E1D8' : '#fff'}" stroke-width="${n(fs * 0.3)}" stroke-linejoin="round">${t}</text>`;
  let s = '';
  if (o.render) s += `<path d="${ptsD(HOUSE)}Z${ptsD(GARAGE)}Z" transform="translate(-1.8 1)" fill="#0E1408" fill-opacity="0.32" filter="url(#ld-soft)"/>`;
  s += hipRoof(14, 53, 34, 80, o);                                   // garage
  s += hipRoof(34, 47, 75, 74, o);                                   // house, main block
  s += `<path d="M34,44H59V47H34Z" fill="${o.render ? shade('#CBC5BA', 0.1) : (o.color ? '#EFEEE9' : '#fff')}" stroke="${o.render ? '#6E675E' : INK}" stroke-width="0.14"/>`;  // rear bay
  s += `<rect x="75" y="57" width="1.6" height="6" fill="${paper}" stroke="${ink}" stroke-width="0.15"/>`;   // chimney
  s += `<path d="${ptsD(GARAGE)}Z" fill="none" stroke="${ink}" stroke-width="0.34"/><path d="${ptsD(HOUSE)}Z" fill="none" stroke="${ink}" stroke-width="0.4" stroke-linejoin="miter"/>`;
  // doors: openings in the wall with a stoop, so students can see where walks must go
  const gap = (x1, y1, x2, y2) => `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="${paper}"/>`;
  s += gap(50, 73.7, 53, 74.3) + `<rect x="49.5" y="74.3" width="4" height="2.2" rx="0.2" fill="${o.render ? '#D9D3C6' : paper}" stroke="${ink}" stroke-width="0.1"/>`;
  s += gap(52, 43.7, 55, 44.3) + `<rect x="51.5" y="41.5" width="4" height="2.2" rx="0.2" fill="${o.render ? '#D9D3C6' : paper}" stroke="${ink}" stroke-width="0.1"/>`;
  s += gap(65, 46.7, 72, 47.3) + `<path d="M65,46.85H72M65,47.15H72" stroke="${o.render ? '#5F8FB0' : ink}" stroke-width="0.09"/>`;
  s += gap(19, 52.7, 22, 53.3) + gap(16, 79.7, 32, 80.3) + `<path d="M16,80H32" stroke="${ink}" stroke-width="0.12" stroke-dasharray="0.8 0.5"/>`;
  // A/C and gas meter: things to screen with plants
  s += `<rect x="76.4" y="50.6" width="2.4" height="2.4" fill="#fff" stroke="${ink}" stroke-width="0.12"/><path d="M76.4,50.6L78.8,53M78.8,50.6L76.4,53" stroke="${ink}" stroke-width="0.07"/>`;
  s += `<rect x="70.3" y="74.45" width="1.4" height="1" fill="#fff" stroke="${ink}" stroke-width="0.12"/>`;
  s += lab(54.5, 57.2, 'SCOTT RESIDENCE', 1.6) + lab(24, 66.5, 'GARAGE', 1.5);
  return s;
}
/* small notes on the clean house; they live on the Notes & labels layer */
function houseNotes() {
  const lab = (x, y, t, fs) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="500" font-size="${fs}" letter-spacing="0.05em" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="${n(fs * 0.3)}" stroke-linejoin="round">${t}</text>`;
  return lab(54.5, 58.9, '2-STORY', 1) + lab(51.5, 77.4, 'FRONT DOOR', 0.85) + lab(53.5, 40.6, 'BACK DOOR', 0.85) + lab(68.5, 45.6, 'SLIDING DOORS', 0.85) + lab(80.2, 51.8, 'A/C', 0.85) + lab(71, 76.3, 'GAS', 0.75);
}
function customBase(o) {
  const st = state.site, L = lot();
  let s = '';
  const sw = 9, g = '#E6E7E2';
  const band = { bottom: [-4, L.h + 2, L.w + 8, sw], top: [-4, -2 - sw, L.w + 8, sw], left: [-2 - sw, -4, sw, L.h + 8], right: [L.w + 2, -4, sw, L.h + 8] }[st.street];
  if (band) {
    const [x, y, w, h] = band, vert = st.street === 'left' || st.street === 'right';
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${g}"/>`;
    s += vert ? `<path d="M${n(st.street === 'left' ? x + w : x)},${n(y)}V${n(y + h)}" stroke="${INK}" stroke-width="0.17"/>` : `<path d="M${n(x)},${n(st.street === 'top' ? y + h : y)}H${n(x + w)}" stroke="${INK}" stroke-width="0.17"/>`;
    const name = esc((st.streetName || 'STREET').toUpperCase());
    s += `<text x="${n(x + w / 2)}" y="${n(y + h / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="600" font-size="2.1" letter-spacing="0.3em" fill="${INK}"${vert ? ` transform="rotate(-90 ${n(x + w / 2)} ${n(y + h / 2)})"` : ''}>${name}</text>`;
  }
  s += `<rect x="0" y="0" width="${n(L.w)}" height="${n(L.h)}" fill="none" stroke="${INK}" stroke-width="0.19" stroke-dasharray="2.7 0.5 0.4 0.5 0.4 0.5"/>`;
  return s;
}
function northArrow(x, y, size, dir) {
  const rot = { left: 0, up: 90, right: 180, down: 270 }[dir] || 0;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rot}) scale(${n(size / 30)})"><circle r="30" fill="#fff" fill-opacity="0.85" stroke="${INK}" stroke-width="1.2"/><path d="M-26,0L20,-10L11,0Z" fill="${INK}"/><path d="M-26,0L20,10L11,0Z" fill="#fff" stroke="${INK}"/></g>` +
    `<text x="${n(x)}" y="${n(y + size * 1.45)}" text-anchor="middle" font-family="${FONT}" font-size="${n(size * 0.42)}" font-weight="600" letter-spacing="0.08em" fill="${INK}">NORTH</text>`;
}
function customSite() {
  const L = lot();
  const dim = (x1, y1, x2, y2, label, vert) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<path d="M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}" stroke="${INK}" stroke-width="0.09"/>` +
      (vert ? `<path d="M${n(x1 - 0.7)},${n(y1)}h1.4M${n(x2 - 0.7)},${n(y2)}h1.4" stroke="${INK}" stroke-width="0.09"/>` : `<path d="M${n(x1)},${n(y1 - 0.7)}v1.4M${n(x2)},${n(y2 - 0.7)}v1.4" stroke="${INK}" stroke-width="0.09"/>`) +
      `<text x="${n(mx)}" y="${n(my)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="1.5" font-weight="500" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="0.8"${vert ? ` transform="rotate(-90 ${n(mx)} ${n(my)})"` : ''}>${label}</text>`;
  };
  const ftl = (v) => `${Math.floor(v)}'-${Math.round((v % 1) * 12)}"`;
  const sw = state.site.street;
  return dim(0, sw === 'top' ? L.h + 3.5 : -3.5, L.w, sw === 'top' ? L.h + 3.5 : -3.5, ftl(L.w)) + dim(sw === 'left' ? L.w + 3.5 : -3.5, 0, sw === 'left' ? L.w + 3.5 : -3.5, L.h, ftl(L.h), true) +
    northArrow(sw === 'right' ? 4 : L.w - 4, sw === 'top' ? L.h - 5 : 5, 2.4, state.site.north);
}
function imageMarkup() {
  const im = !isScott() && state.site.img;
  return im ? `<image href="${im.src}" x="${n(im.x)}" y="${n(im.y)}" width="${n(im.w)}" height="${n(im.h)}" opacity="${im.op}" preserveAspectRatio="none"/>` : '';
}
function baseMarkup(o) {
  if (!isScott()) return customBase(o);
  return `<g transform="${CORE_T}">${BASE_LOT}${view.floor ? BASE_FLOOR : ''}</g>` + (view.floor ? '' : cleanHouse(o));
}
function siteMarkup() {
  if (!isScott()) return view.site ? customSite() : '';
  let s = '';
  if (view.util) s += `<g transform="${CORE_T}">${SITE_UTIL}</g>`;
  if (view.site) s += `<g transform="${CORE_T}">${SITE_NOTES}${view.floor ? '' : BASE_NOTES}</g>` + (view.floor ? '' : houseNotes());
  return s;
}
let baseKey = '';
function renderBase() {
  const o = drawOpts();
  const key = [isScott() ? 'scott' : JSON.stringify(Object.assign({}, state.site, { img: state.site.img ? [state.site.img.x, state.site.img.y, state.site.img.w, state.site.img.op, state.site.img.src.length] : 0 })), view.style, view.floor, view.site, view.util].join('|');
  if (key === baseKey) return;
  baseKey = key;
  gBase.innerHTML = baseMarkup(o);
  gSite.innerHTML = siteMarkup();
  gImg.innerHTML = imageMarkup();
  const F = fitRect(), r = $('sheetRect');
  r.setAttribute('x', F.x - 2); r.setAttribute('y', F.y - 2); r.setAttribute('width', F.w + 4); r.setAttribute('height', F.h + 4);
  const ns = $('navSvg'), nb = $('navBg');
  ns.setAttribute('viewBox', `${F.x - 2} ${F.y - 2} ${F.w + 4} ${F.h + 4}`);
  nb.setAttribute('x', F.x - 2); nb.setAttribute('y', F.y - 2); nb.setAttribute('width', F.w + 4); nb.setAttribute('height', F.h + 4);
  $('tImgRow').hidden = isScott() || !state.site.img;
  $('tFloorRow').hidden = !isScott();
  $('tUtilRow').hidden = !isScott();
  const t = esc(projName());
  document.querySelector('header.top h1').innerHTML = `${t}<span>Landscape Designer</span>`;
  document.title = `${projName()} · Landscape Designer`;
}

/* ------------------------------------------------------------------ rendering */
function gridMarkup() {
  let d = '';
  const L = lot();
  for (let x = 0; x <= L.w; x += 10) d += `M${x},0V${L.h}`;
  for (let y = 0; y <= L.h; y += 10) d += `M0,${y}H${L.w}`;
  return `<path d="${d}" stroke="#4F86B3" stroke-opacity="0.6" stroke-width="0.07" fill="none"/>`;
}
function sortedItems(layer) {
  return state.items.map((it, i) => [it, i]).filter(([it]) => layerOf(it) === layer)
    .sort((a, b) => (T[a[0].type].band - T[b[0].type].band) || (a[1] - b[1])).map(([it]) => it);
}
function renderPlan() {
  const o = drawOpts({ hit: true });
  gDesign.innerHTML = sortedItems('design').map((it) => drawItem(it, o)).join('');
  gDiagram.innerHTML = sortedItems('diagram').map((it) => drawItem(it, o)).join('');
  renderBase();
  gBase.style.display = view.base ? '' : 'none';
  gSite.style.display = '';
  gImg.style.display = view.img ? '' : 'none';
  gGrid.innerHTML = view.grid ? gridMarkup() : '';
  gDesign.style.display = view.design ? '' : 'none';
  gDiagram.style.display = view.diagram ? '' : 'none';
  gBase.style.filter = gSite.style.filter = view.style === 'bw' ? 'grayscale(1)' : '';
  renderOverlay();
}
/* fast path while dragging: redraw only the items that changed */
function renderItems(ids) {
  const o = drawOpts({ hit: true });
  for (const id of ids) {
    const it = byId(id), el = svg.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (it && el) el.outerHTML = drawItem(it, o);
  }
  renderOverlay();
}
function itemPoly(it) {
  const t = T[it.type];
  if (t.kind === 'circle') { const out = []; for (let k = 0; k < 16; k++) out.push([it.x + it.r * Math.cos(k * Math.PI / 8), it.y + it.r * Math.sin(k * Math.PI / 8)]); return out; }
  if (t.kind === 'box') return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => toWorldPt(it, [a * it.w / 2, b * it.h / 2]));
  if (t.kind === 'shape') return shapePoly(it.pts, it.smooth);
  if (t.kind === 'line') { const w = (it.width || 0.6) / 2; return it.pts.flatMap((p) => [[p[0] - w, p[1] - w], [p[0] + w, p[1] + w]]); }
  const w = Math.max(2, (it.text || '').length * it.size * 0.33), h = it.size * 0.65;
  return [[it.x - w, it.y - h], [it.x + w, it.y + h]];
}
function bbox(it) {
  const p = itemPoly(it), xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}
function handle(x, y, h, k, fill, r) {
  return `<circle data-h="${h}" cx="${n(x)}" cy="${n(y)}" r="${n((r || 6) / k)}" fill="${fill || '#fff'}" stroke="#2C7BC0" stroke-width="${n(1.6 / k)}"/>`;
}
function renderOverlay() {
  const k = view.k, sw = n(1.4 / k), SEL = '#2C7BC0';
  let s = '';
  const items = selItems().filter((it) => !it.hidden && (layerOf(it) === 'design' ? view.design : view.diagram));
  const one = items.length === 1 ? items[0] : null;
  for (const it of items) {
    const t = T[it.type], dash = `stroke-dasharray="${n(5 / k)} ${n(3 / k)}"`, col = it.locked ? '#9A9D94' : SEL;
    if (t.kind === 'circle') s += `<circle cx="${n(it.x)}" cy="${n(it.y)}" r="${n(it.r + 3 / k)}" fill="none" stroke="${col}" stroke-width="${sw}" ${dash}/>`;
    else if (t.kind === 'box') {
      const pad = 3 / k, w = it.w / 2 + pad, h = it.h / 2 + pad;
      s += `<path d="${ptsD([[-w, -h], [w, -h], [w, h], [-w, h]].map((p) => toWorldPt(it, p)))}Z" fill="none" stroke="${col}" stroke-width="${sw}" ${dash}/>`;
    } else if (t.kind === 'line') s += `<path d="${ptsD(it.pts)}" fill="none" stroke="${col}" stroke-width="${sw}" ${dash}/>`;
    else if (t.kind === 'shape') s += `<path d="${shapeD(it.pts, it.smooth)}" fill="none" stroke="${col}" stroke-width="${sw}" ${dash}/>` + (it.smooth ? `<path d="${ptsD(it.pts)}Z" fill="none" stroke="${col}" stroke-opacity="0.45" stroke-width="${n(1 / k)}"/>` : '');
    else { const b = bbox(it); s += `<rect x="${n(b.x1 - 3 / k)}" y="${n(b.y1 - 3 / k)}" width="${n(b.x2 - b.x1 + 6 / k)}" height="${n(b.y2 - b.y1 + 6 / k)}" fill="none" stroke="${col}" stroke-width="${sw}" ${dash}/>`; }
  }
  if (items.length > 1) {
    const bs = items.map(bbox), x1 = Math.min(...bs.map((b) => b.x1)), y1 = Math.min(...bs.map((b) => b.y1)), x2 = Math.max(...bs.map((b) => b.x2)), y2 = Math.max(...bs.map((b) => b.y2));
    s += `<rect x="${n(x1 - 6 / k)}" y="${n(y1 - 6 / k)}" width="${n(x2 - x1 + 12 / k)}" height="${n(y2 - y1 + 12 / k)}" fill="none" stroke="${SEL}" stroke-width="${n(1 / k)}"/>`;
  }
  if (one && !one.locked) {
    const t = T[one.type];
    if (t.kind === 'circle') {
      const a = -Math.PI / 4;
      s += `<line x1="${n(one.x)}" y1="${n(one.y)}" x2="${n(one.x + one.r * Math.cos(a))}" y2="${n(one.y + one.r * Math.sin(a))}" stroke="${SEL}" stroke-width="${n(1 / k)}"/>` + handle(one.x + one.r * Math.cos(a), one.y + one.r * Math.sin(a), 'r', k);
    } else if (t.kind === 'box') {
      const h = one.h / 2 + 3 / k, top = toWorldPt(one, [0, -h]), rh = toWorldPt(one, [0, -h - 24 / k]), sz = toWorldPt(one, [one.w / 2, one.h / 2]);
      s += `<line x1="${n(top[0])}" y1="${n(top[1])}" x2="${n(rh[0])}" y2="${n(rh[1])}" stroke="${SEL}" stroke-width="${n(1 / k)}"/>` + handle(sz[0], sz[1], 'size', k) + handle(rh[0], rh[1], 'rot', k, '#FFCE00');
    } else if (t.kind === 'line' || t.kind === 'shape') {
      const P = one.pts, N = P.length, segs = t.kind === 'shape' ? N : N - 1;
      for (let i = 0; i < segs; i++) { const a = P[i], b = P[(i + 1) % N]; s += handle((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 'm' + i, k, '#2C7BC0', 3.5); }
      P.forEach((p, i) => { s += handle(p[0], p[1], 'v' + i, k, '#fff', 5.5); });
    }
  }
  if (hover && T[tool] && T[tool].kind !== 'line' && T[tool].kind !== 'shape' && !draft) {
    s += `<g opacity="0.55" pointer-events="none">${drawItem(newItem(tool, hover), drawOpts({ tags: false }))}</g>`;
  }
  if (draft) {
    const pts = draft.pts.concat(hover ? [hover] : []);
    const t = T[draft.type];
    if (pts.length >= 2) {
      const g = { id: 'draft', type: draft.type, pts, width: t.d.width, finish: t.d.finish, smooth: t.d.smooth, sp: curSp[draft.type] || t.d.sp };
      if (t.kind === 'shape' && pts.length < 3) s += `<path d="${ptsD(pts)}" stroke="${SEL}" stroke-width="${sw}" fill="none" pointer-events="none"/>`;
      else s += `<g opacity="0.7" pointer-events="none">${drawItem(g, drawOpts({ tags: false }))}</g>`;
    }
    draft.pts.forEach((p, i) => { s += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n((i === 0 && t.kind === 'shape' ? 6 : 4) / k)}" fill="${i === 0 ? '#fff' : SEL}" stroke="${SEL}" stroke-width="${n(1.5 / k)}" pointer-events="none"/>`; });
  }
  if (snapMark) s += `<rect x="${n(snapMark[0] - 5 / k)}" y="${n(snapMark[1] - 5 / k)}" width="${n(10 / k)}" height="${n(10 / k)}" fill="none" stroke="#E08A00" stroke-width="${n(1.6 / k)}" transform="rotate(45 ${n(snapMark[0])} ${n(snapMark[1])})" pointer-events="none"/>`;
  if (marquee) {
    const x = Math.min(marquee.a[0], marquee.b[0]), y = Math.min(marquee.a[1], marquee.b[1]);
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.abs(marquee.b[0] - marquee.a[0]))}" height="${n(Math.abs(marquee.b[1] - marquee.a[1]))}" fill="rgba(44,123,192,.1)" stroke="${SEL}" stroke-width="${n(1 / k)}" stroke-dasharray="${n(4 / k)} ${n(3 / k)}" pointer-events="none"/>`;
  }
  if (measure) {
    const { a, b } = measure, d = dist(a, b), fs = 13 / k;
    s += `<g pointer-events="none"><line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="#D2452F" stroke-width="${n(2 / k)}" stroke-dasharray="${n(6 / k)} ${n(3 / k)}"/>`;
    s += `<circle cx="${n(a[0])}" cy="${n(a[1])}" r="${n(3.5 / k)}" fill="#D2452F"/><circle cx="${n(b[0])}" cy="${n(b[1])}" r="${n(3.5 / k)}" fill="#D2452F"/>`;
    if (d > 0.2) s += `<text x="${n((a[0] + b[0]) / 2)}" y="${n((a[1] + b[1]) / 2 - 8 / k)}" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="${n(fs)}" fill="#8E2414" paint-order="stroke" stroke="#fff" stroke-width="${n(4 / k)}" stroke-linejoin="round">${n(r1(d))} FT (${ftIn(d)})</text>`;
    s += '</g>';
  }
  gOver.innerHTML = s;
  statusSel();
}
function nameOf(it) {
  const sp = spOf(it), base = sp && T[it.type].plant ? sp.cn : T[it.type].name;
  if (it.label) return `${base} “${it.label}”`;
  const same = state.items.filter((i) => i.type === it.type && (i.sp || '') === (it.sp || ''));
  return same.length > 1 ? `${base} ${same.indexOf(it) + 1}` : base;
}
function areaOf(it) {
  const t = T[it.type];
  if (t.kind === 'shape') return polyArea(shapePoly(it.pts, it.smooth));
  if (t.kind === 'box') return it.type === 'perennial' || it.type === 'annual' || it.type === 'bubble' ? Math.PI * it.w * it.h / 4 : it.w * it.h;
  if (it.type === 'path') return polyLen(it.pts) * it.width;
  return 0;
}
function statusSel() {
  const el = $('sbSel');
  const items = selItems();
  if (!items.length) { el.textContent = draft ? `Drawing ${T[draft.type].name.toLowerCase()} · ${draft.pts.length} point${draft.pts.length === 1 ? '' : 's'}` : 'Nothing selected'; return; }
  if (items.length > 1) { el.textContent = `${items.length} items selected`; return; }
  const it = items[0], t = T[it.type];
  let s = nameOf(it) + (it.locked ? ' (locked)' : '');
  if (t.kind === 'circle') s += ` · ${n(it.r * 2)} ft spread · at ${it.x.toFixed(1)}, ${it.y.toFixed(1)}`;
  if (t.kind === 'box') s += ` · ${n(it.w)} × ${n(it.h)} ft · ${Math.round(areaOf(it))} sq ft${it.rot ? ` · ${it.rot}°` : ''}`;
  if (t.kind === 'shape') s += ` · ${Math.round(areaOf(it))} sq ft · ${it.pts.length} points`;
  if (t.kind === 'line') s += ` · ${polyLen(it.pts).toFixed(1)} ft long`;
  el.textContent = s;
}

/* ------------------------------------------------------------------ tool rail */
function toolName(tl) { return T[tl] ? T[tl].name : BASIC_NAMES[tl]; }
function toolIcon(tl) { return LINE_ICO[tl] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${LINE_ICO[tl]}</svg>` : iconSVG(tl, view.style, curSp[tl]); }
function renderRail() {
  let h = RAIL.map((grp) => `<div class="grp">${grp.map((tl) => {
    const line = !!LINE_ICO[tl];
    return `<button type="button" class="tool${line ? ' line' : ''}" data-tool="${tl}" aria-pressed="${tool === tl}" aria-label="${esc(toolName(tl))} (${KEYS[tl]})" aria-keyshortcuts="${KEYS[tl]}">${line ? toolIcon(tl) : `<span class="chip">${toolIcon(tl)}</span>`}<span class="key" aria-hidden="true">${KEYS[tl]}</span></button>`;
  }).join('')}</div>`).join('');
  h += `<div class="grp"><button type="button" class="tool line" id="bLib" aria-pressed="${view.lib}" aria-label="Plant library">${toolIcon('library')}</button></div>`;
  $('rail').innerHTML = h;
  $('rail').querySelectorAll('[data-tool]').forEach((b) => {
    b.addEventListener('click', () => setTool(b.dataset.tool));
    bindTip(b, () => `<b>${esc(toolName(b.dataset.tool))}</b> &nbsp;<kbd>${KEYS[b.dataset.tool]}</kbd><small>${esc(TIPS[b.dataset.tool] || '')}</small>`);
  });
  const bl = $('bLib');
  bl.addEventListener('click', () => toggleLib());
  bindTip(bl, () => '<b>Plant library</b><small>Show or hide the plant library.</small>');
}
const tipEl = $('tip');
function bindTip(b, html) {
  const show = () => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const r = b.getBoundingClientRect(), below = innerWidth <= 1000;
    tipEl.innerHTML = html();
    tipEl.style.left = (below ? Math.min(r.left, innerWidth - 260) : r.right + 8) + 'px';
    tipEl.style.top = (below ? r.bottom + 6 : r.top) + 'px';
    tipEl.classList.add('show');
  };
  b.addEventListener('mouseenter', show); b.addEventListener('focus', show);
  b.addEventListener('mouseleave', hideTip); b.addEventListener('blur', hideTip);
}
function hideTip() { tipEl.classList.remove('show'); }
function hintFor(tl) {
  const t = T[tl], touch = matchMedia('(pointer: coarse)').matches, click = touch ? 'Tap' : 'Click';
  if (tl === 'select') return touch ? 'Tap to select. Drag to pan, pinch to zoom.' : 'Click to select, Shift-click to add more, drag empty space to box-select. Alt-drag copies. Right-click for more.';
  if (tl === 'hand') return 'Drag to move around the plan.';
  if (tl === 'measure') return 'Drag between two points to measure the distance in feet.';
  if (tl === 'imgscale') return 'Drag along something on the image whose length you know, like a lot line or a house wall. Then type its real length.';
  if (tl === 'label') return `${click} where the label should go, then type it in Properties.`;
  if (t.kind === 'line' || t.kind === 'shape') {
    if (draft && draft.pts.length) return `${click} the next point. ${touch ? 'Double-tap' : 'Double-click or press Enter'} to finish${t.kind === 'shape' ? ', or click the first point to close' : ''}. Backspace removes the last point. Esc cancels.`;
    return `${click} the plan to start the ${t.name.replace(' (draw)', '').toLowerCase()} outline. Snap is ${view.snap ? 'on' : 'off'}.`;
  }
  const sp = PLANT_BY_ID[curSp[tl]];
  if (t.stay) return `${click} to plant ${sp ? sp.cn : t.name.toLowerCase()} (${sp ? sp.w : t.d.r * 2} ft mature spread). Keep ${touch ? 'tapping' : 'clicking'} to add more. Esc when done.`;
  return `${click} the plan to place the ${t.name.toLowerCase()}${sp ? ` of ${sp.cn.toLowerCase()}` : ''}. Drag its corner dot to resize.`;
}
function setTool(tl) {
  if (draft && tl !== tool) finishDraft();
  tool = tl;
  if (tl !== 'measure') measure = null;
  if (T[tl]) {
    const L = layerOf({ type: tl });
    if (L === 'design' && !view.design) { view.design = true; $('tDesign').checked = true; renderPlan(); toast('Design layer turned on'); }
    if (L === 'diagram' && !view.diagram) { view.diagram = true; $('tDiagram').checked = true; renderPlan(); toast('Functional diagram turned on'); }
    const cats = spCats(tl);
    if (cats.length && curSp[tl] && PLANT_BY_ID[curSp[tl]]) { libSp = curSp[tl]; if (!cats.includes(libCat) && libCat !== 'all') libCat = cats[0]; renderLib(); }
  }
  document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === tl ? 'true' : 'false'));
  svg.classList.toggle('sel', tl === 'select');
  svg.classList.toggle('hand', tl === 'hand');
  svg.classList.toggle('place', tl !== 'select' && tl !== 'hand');
  $('hint').textContent = hintFor(tl);
  const sp = PLANT_BY_ID[curSp[tl]];
  $('optTool').innerHTML = `<span class="chip${LINE_ICO[tl] ? ' line' : ''}">${toolIcon(tl)}</span>${esc(toolName(tl))}${sp && T[tl] && T[tl].plant ? ` <small>${esc(sp.cn)}</small>` : ''}`;
  if (!T[tl]) hover = null;
  renderOverlay();
}

/* ------------------------------------------------------------------ plant library */
let libCat = 'all', libSun = '', libQ = '';
function sunDots(sun) {
  return `<span class="sun" title="${sun.split('/').map((s) => SUN_NAMES[s]).join(', ')}">${sun.split('/').map((s) => `<i class="${s.toLowerCase()}"></i>`).join('')}</span>`;
}
function plantThumb(sp) {
  if (sp.t === 'perennial' || sp.t === 'annual' || sp.t === 'groundcover') return iconSVG('bedShape', 'render', sp.id);
  return iconSVG(sp.t === 'turf' ? 'lawnShape' : sp.t, 'render', sp.id);
}
function speciesInfo(sp) {
  return `<b>${esc(sp.cn)}</b> <span style="font-family:var(--display);font-size:11px;border:1px solid #6B6F64;border-radius:2px;padding:0 4px;margin-left:4px">${PLANT_CODE[sp.id]}</span><br><i>${esc(sp.bn)}</i>
    <dl>${sp.t === 'turf' ? '' : `<dt>Mature size</dt><dd>${sp.w} ft wide × ${sp.h} ft tall</dd>`}<dt>Light</dt><dd>${sp.sun.split('/').map((s) => SUN_NAMES[s]).join(', ')}</dd><dt>Hardiness</dt><dd>${!sp.z ? '—' : sp.z === 'annual' ? 'Annual' : 'USDA zones ' + sp.z}</dd>${sp.spc ? `<dt>Spacing</dt><dd>${sp.spc} ft apart</dd>` : ''}</dl><p>${esc(sp.note || '')}</p>` +
    (sp.custom ? `<div class="btnrow" style="margin-top:6px"><button type="button" class="btn" data-cp-edit="${sp.id}">Edit</button><button type="button" class="btn danger" data-cp-del="${sp.id}">Delete</button></div>` : '');
}
function renderLibControls() {
  $('libCat').innerHTML = `<option value="all">All plants (${PLANTS.length})</option>` + CATS.map(([k, name]) => `<option value="${k}">${name} (${PLANTS.filter((p) => p.t === k).length})</option>`).join('');
  $('libSun').innerHTML = [['', 'Any light'], ['F', 'Full sun'], ['P', 'Part shade'], ['S', 'Shade']].map(([k, l]) => `<button type="button" data-sun="${k}" aria-pressed="${libSun === k}">${l}</button>`).join('');
}
function renderLib() {
  $('lib').classList.toggle('collapsed', !view.lib);
  const bl = $('bLib'); if (bl) bl.setAttribute('aria-pressed', view.lib);
  if (!view.lib) return;
  $('libCat').value = libCat;
  $('libSun').querySelectorAll('[data-sun]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sun === libSun));
  const q = libQ.trim().toLowerCase();
  const list = PLANTS.filter((p) => (libCat === 'all' || p.t === libCat) && (!libSun || p.sun.includes(libSun)) && (!q || (p.cn + ' ' + p.bn + ' ' + p.note).toLowerCase().includes(q)));
  let h = '';
  for (const [cat, name] of CATS) {
    const rows = list.filter((p) => p.t === cat);
    if (!rows.length) continue;
    h += `<div class="libcat">${name}</div>`;
    h += rows.map((p) => `<button type="button" class="plant" data-sp="${p.id}" aria-pressed="${libSp === p.id}"><span class="thumb">${plantThumb(p)}</span><span class="pn"><b>${esc(p.cn)}${p.custom ? ' <span class="yours">YOURS</span>' : ''}</b><i>${esc(p.bn)}</i><span>${p.t === 'turf' ? 'Lawn grass' : `${p.w}′ W × ${p.h}′ H`} ${sunDots(p.sun)} ${p.z ? `<span>Z ${esc(p.z)}</span>` : ''}</span></span></button>`).join('');
  }
  $('libList').innerHTML = h || '<p class="muted" style="padding:12px">No plants match. Try another search or light setting.</p>';
  const sp = PLANT_BY_ID[libSp];
  $('libInfo').innerHTML = sp ? speciesInfo(sp) : '';
}
function toggleLib(force) { view.lib = force === undefined ? !view.lib : force; renderLib(); saveView(); requestAnimationFrame(applyView); }
$('libList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-sp]');
  if (!b) return;
  const sp = PLANT_BY_ID[b.dataset.sp];
  libSp = sp.id;
  const one = single();
  // with one matching item selected, the library swaps its species; otherwise it starts planting
  if (one && !one.locked && isBedType(one.type) && spCats(one.type).includes(sp.t) && tool === 'select') {
    const mix = mixOf(one);
    if (mix.some((m) => m.sp === sp.id)) { toast(`${sp.cn} is already in this bed`); return; }
    mix.push({ sp: sp.id, w: mix.length ? Math.round(100 / (mix.length + 1)) : 100 });
    balance(mix, mix.length - 1); setMix(one, mix); renderItems([one.id]); renderProps(); renderLib(); commit('Add ' + sp.cn + ' to bed');
    toast(`Added ${sp.cn} to the bed`);
    return;
  }
  if (one && !one.locked && spCats(one.type).includes(sp.t) && tool === 'select') {
    one.sp = sp.id;
    if (T[one.type].kind === 'circle') one.r = Math.max(0.5, sp.w / 2);
    renderPlan(); renderProps(); commit('Change plant to ' + sp.cn); renderLib();
    toast(`Changed to ${sp.cn}`);
    return;
  }
  const bedKind = ['perennial', 'annual', 'groundcover'].includes(sp.t);
  const type = sp.t === 'turf' ? (tool === 'lawnShape' ? 'lawnShape' : 'lawn') : (bedKind && tool === 'bedShape' ? 'bedShape' : sp.t);
  curSp[type] = sp.id;
  renderLib(); renderRail(); setTool(type);
});
$('libList').addEventListener('mouseover', (e) => { const b = e.target.closest('[data-sp]'); if (b) $('libInfo').innerHTML = speciesInfo(PLANT_BY_ID[b.dataset.sp]); });
$('libList').addEventListener('mouseleave', () => { const sp = PLANT_BY_ID[libSp]; $('libInfo').innerHTML = sp ? speciesInfo(sp) : ''; });
$('libAddPlant').addEventListener('click', () => showPlantForm());
$('libInfo').addEventListener('click', (e) => {
  const ed = e.target.closest('[data-cp-edit]'), del = e.target.closest('[data-cp-del]');
  if (ed) showPlantForm(ed.dataset.cpEdit);
  if (del) deleteCustomPlant(del.dataset.cpDel);
});
$('libSearch').addEventListener('input', (e) => { libQ = e.target.value; renderLib(); });
$('libCat').addEventListener('change', (e) => { libCat = e.target.value; renderLib(); });
$('libSun').addEventListener('click', (e) => { const b = e.target.closest('[data-sun]'); if (b) { libSun = b.dataset.sun; renderLib(); } });
$('libClose').addEventListener('click', () => toggleLib(false));
$('libClose').title = 'Hide plant library';

/* ------------------------------------------------------------------ dock tabs */
document.querySelectorAll('[data-tabs]').forEach((g) => {
  g.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.pane)));
});
function showTab(pane) {
  const b = document.querySelector(`[data-pane="${pane}"]`);
  if (!b) return;
  const g = b.closest('[data-tabs]');
  g.querySelectorAll('[role="tab"]').forEach((x) => { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); $(x.dataset.pane).hidden = x !== b; });
  if (pane === 'pHist') renderHist();
  if (pane === 'pObjects') renderObjects();
  if (pane === 'pSched') renderSched();
}
const tabOpen = (pane) => !$(pane).hidden;

/* ------------------------------------------------------------------ properties */
const fld = (label, input) => `<div class="field"><label>${label}</label>${input}</div>`;
const numIn = (f, v, min, max, step, aria) => `<input type="number" data-f="${f}" value="${n(v)}" min="${min}" max="${max}" step="${step}" inputmode="decimal" aria-label="${aria}">`;
const ALIGN_ICO = {
  left: '<path d="M4 3v18"/><rect x="7" y="6" width="10" height="4"/><rect x="7" y="14" width="6" height="4"/>',
  hcenter: '<path d="M12 3v18"/><rect x="6" y="6" width="12" height="4"/><rect x="8" y="14" width="8" height="4"/>',
  right: '<path d="M20 3v18"/><rect x="7" y="6" width="10" height="4"/><rect x="11" y="14" width="6" height="4"/>',
  top: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="7" width="4" height="6"/>',
  vmiddle: '<path d="M3 12h18"/><rect x="6" y="6" width="4" height="12"/><rect x="14" y="8" width="4" height="8"/>',
  bottom: '<path d="M3 20h18"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="11" width="4" height="6"/>',
  disth: '<path d="M3 4v16M21 4v16"/><rect x="9" y="8" width="6" height="8"/>',
  distv: '<path d="M4 3h16M4 21h16"/><rect x="8" y="9" width="8" height="6"/>',
};
const ALIGN_NAMES = { left: 'Align left edges', hcenter: 'Align centers', right: 'Align right edges', top: 'Align top edges', vmiddle: 'Align middles', bottom: 'Align bottom edges', disth: 'Distribute across', distv: 'Distribute down' };
function speciesCard(sp) {
  return `<div class="spcard"><span class="thumb">${plantThumb(sp)}</span><div><b>${esc(sp.cn)}</b><i>${esc(sp.bn)}</i>
    <small>${sp.t === 'turf' ? 'Lawn grass' : `Mature ${sp.w}′ W × ${sp.h}′ H`} · ${sp.sun.split('/').map((s) => SUN_NAMES[s]).join(', ')} · ${sp.z === 'annual' ? 'Annual' : 'Zones ' + sp.z}</small><small>${esc(sp.note)}</small></div></div>`;
}
function renderProps() {
  const P = $('props'), items = selItems();
  if (!items.length) {
    P.innerHTML = `<p class="muted">Pick a tool on the left, or a plant in the library, and click the plan to place it.</p>
      <p class="muted" style="margin-top:8px">Click anything you placed to move, resize or change it. Drag across empty space to select several. Right-click for more.</p>` + imageCard();
    return;
  }
  if (items.length > 1) {
    P.innerHTML = `<p class="props-h">${items.length} items selected</p>
      <div class="fieldlabel" style="margin-bottom:4px">Align &amp; distribute</div>
      <div class="alignbar">${Object.entries(ALIGN_ICO).map(([k, ico]) => `<button type="button" data-align="${k}" title="${ALIGN_NAMES[k]}" aria-label="${ALIGN_NAMES[k]}"><svg viewBox="0 0 24 24">${ico}</svg></button>`).join('')}</div>
      <div class="btnrow"><button type="button" class="btn" data-act="dup">Duplicate</button><button type="button" class="btn" data-act="lock">${items.every((i) => i.locked) ? 'Unlock' : 'Lock'}</button><button type="button" class="btn danger" data-act="del">Delete</button></div>`;
    return;
  }
  const it = items[0], t = T[it.type], sp = spOf(it), dis = it.locked ? ' disabled' : '';
  let h = `<p class="props-h"><span class="chip">${iconSVG(it.type, view.style, it.sp)}</span>${esc(t.name)}</p>`;
  const cats = spCats(it.type);
  if (isBedType(it.type)) {
    const mix = bedMix(it);
    const opts = (sel0) => cats.map((c) => `<optgroup label="${CATS.find((x) => x[0] === c)[1]}">${PLANTS.filter((q) => q.t === c).map((q) => `<option value="${q.id}" ${sel0 === q.id ? 'selected' : ''}>${esc(q.cn)}${q.custom ? ' (yours)' : ''}</option>`).join('')}</optgroup>`).join('');
    h += `<div class="fieldlabel" style="margin-bottom:4px">Plants in this bed</div>`;
    h += mix.map((m, i) => `<div class="mixrow"><span class="chip">${plantThumb(m.sp)}</span><select data-mix="${i}" aria-label="Plant ${i + 1}"${dis}>${opts(m.sp.id)}</select>${mix.length > 1 ? `<input type="number" data-mixw="${i}" value="${Math.round(m.w * 100)}" min="1" max="100" aria-label="Share of the bed in percent"${dis}><span class="muted">%</span>` : ''}<button type="button" class="iconbtn" data-mixdel="${i}" aria-label="Remove ${esc(m.sp.cn)} from the bed"${dis || (mix.length === 1 && it.type !== 'bedShape') ? ' disabled style="visibility:hidden"' : ''}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`).join('');
    if (!mix.length) h += '<p class="muted" style="margin-bottom:6px">Mulch only. Add plants, or place trees and shrubs on top of it.</p>';
    h += `<div class="btnrow" style="margin-bottom:6px"><button type="button" class="btn" data-act="mixadd"${dis}>+ Add a plant to this bed</button></div>`;
    h += `<p class="muted" style="margin-bottom:10px">${mix.length > 1 ? 'Plants are set out in natural drifts by their share. ' : ''}Tip: with the bed selected, click plants in the library to add them.</p>`;
    if (mix.length === 1) h += speciesCard(mix[0].sp);
    if (it.type !== 'bedShape') h += fld('Bed shape', `<select data-f="form" aria-label="Bed shape"${dis}>${[['oval', 'Oval'], ['rect', 'Rectangle (square corners)'], ['round', 'Rounded rectangle']].map(([k, l]) => `<option value="${k}" ${bedForm(it) === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`);
  } else if (cats.length) {
    if (sp) h += speciesCard(sp);
    const opts = (it.type === 'bedShape' ? '<option value="">Mulch only (no plants)</option>' : '') +
      cats.map((c) => `<optgroup label="${CATS.find((x) => x[0] === c)[1]}">${PLANTS.filter((p) => p.t === c).map((p) => `<option value="${p.id}" ${it.sp === p.id ? 'selected' : ''}>${esc(p.cn)}</option>`).join('')}</optgroup>`).join('');
    h += fld(it.type.startsWith('lawn') ? 'Grass' : 'Plant', `<select data-f="sp" aria-label="Plant"${dis}>${opts}</select>`);
  }
  if (t.kind === 'circle') h += `<div class="row3">${fld(it.type === 'birdbath' ? 'Size ft' : 'Spread ft', numIn('spread', it.r * 2, 0.5, 120, 0.5, 'Spread in feet'))}${fld('X ft', numIn('x', it.x, -50, 150, 0.5, 'X position'))}${fld('Y ft', numIn('y', it.y, -50, 150, 0.5, 'Y position'))}</div>`;
  if (t.kind === 'box') {
    h += `<div class="row3">${fld('Width ft', numIn('w', it.w, 1, 200, 0.5, 'Width in feet'))}${fld('Length ft', numIn('h', it.h, 1, 200, 0.5, 'Length in feet'))}${fld('Rotate °', numIn('rot', it.rot || 0, -360, 360, 5, 'Rotation in degrees'))}</div>`;
    h += `<div class="row2">${fld('X ft', numIn('x', it.x, -50, 150, 0.5, 'X position'))}${fld('Y ft', numIn('y', it.y, -50, 150, 0.5, 'Y position'))}</div>`;
  }
  if (FREEFORM[it.type]) h += `<div class="btnrow" style="margin-bottom:10px"><button type="button" class="btn" data-act="freeform"${dis}>Make freeform (drag corners to any shape)</button></div>`;
  if (t.kind === 'shape') h += `<label class="check" style="margin-bottom:8px"><input type="checkbox" data-f="smooth" ${it.smooth ? 'checked' : ''}${dis}> Smooth curved edge</label><p class="muted" style="margin-bottom:8px">${Math.round(areaOf(it))} sq ft · ${polyLen(shapePoly(it.pts, it.smooth), true).toFixed(0)} ft of edging. Drag the white dots to reshape; drag a blue dot to add a point; Alt-click a point to remove it.</p>`;
  if (it.type === 'bubble') h += fld('Zone', `<select data-f="zone" aria-label="Zone"${dis}>${Object.entries(ZONES).map(([k, z]) => `<option value="${k}" ${it.zone === k ? 'selected' : ''}>${z.name}</option>`).join('')}</select>`);
  if (it.type === 'patio' || it.type === 'paveShape') h += fld('Surface', `<select data-f="finish" aria-label="Surface"${dis}>${Object.entries(FINISHES).map(([k, z]) => `<option value="${k}" ${(it.finish || t.d.finish) === k ? 'selected' : ''}>${z}</option>`).join('')}</select>`);
  if (it.type === 'path') h += `<div class="row2">${fld('Width ft', numIn('width', it.width || 4, 1, 30, 0.5, 'Path width in feet'))}${fld('Surface', `<select data-f="finish" aria-label="Surface"${dis}>${Object.entries(PATH_FINISHES).map(([k, z]) => `<option value="${k}" ${(it.finish || 'concrete') === k ? 'selected' : ''}>${z}</option>`).join('')}</select>`)}</div>`;
  if (it.type === 'fence') {
    h += `<div class="row2">${fld('Fence style', `<select data-f="fstyle" aria-label="Fence style"${dis}>${Object.entries(FENCE_STYLES).map(([k, z]) => `<option value="${k}" ${(it.style || 'privacy') === k ? 'selected' : ''}>${z.replace(' fence', '')}</option>`).join('')}</select>`)}${fld('Height', `<select data-f="fheight" aria-label="Fence height"${dis}>${[3, 4, 5, 6, 8].map((v) => `<option value="${v}" ${(it.height || 6) === v ? 'selected' : ''}>${v} ft</option>`).join('')}</select>`)}</div>`;
    h += `<p class="muted" style="margin-bottom:8px">${{ privacy: 'Solid boards: blocks views and noise. Good for the busy street side and around the patio.', picket: 'Low and open: marks the edge of a front yard.', split: 'Rustic and open: marks a line without blocking views.', chain: 'See-through and low cost: keeps pets and kids in.', iron: 'Open and formal: lets light and views through.' }[it.style || 'privacy']}</p>`;
  }
  if (t.kind === 'line') h += `<p class="muted" style="margin-bottom:8px">${polyLen(it.pts).toFixed(1)} ft long. Drag a white dot to move a corner, a blue dot to add one.</p>`;
  if (t.kind === 'text') { h += fld('Text', `<input type="text" data-f="text" value="${esc(it.text || '')}" maxlength="200" aria-label="Label text"${dis}>`); h += fld('Text size ft', numIn('size', it.size, 0.5, 20, 0.25, 'Text size')); }
  else h += fld(it.type === 'bubble' ? 'Label (blank shows the zone)' : 'Label', `<input type="text" data-f="label" value="${esc(it.label || '')}" placeholder="${t.tree ? 'e.g. Shade for patio' : 'Optional'}" maxlength="120" aria-label="Label"${dis}>`);
  h += `<label class="check" style="margin:2px 0 10px"><input type="checkbox" data-f="locked" ${it.locked ? 'checked' : ''}> Lock (can't be moved or changed)</label>`;
  h += `<div class="btnrow"><button type="button" class="btn" data-act="dup">Duplicate</button><button type="button" class="btn" data-act="front">To front</button><button type="button" class="btn" data-act="back">To back</button><button type="button" class="btn danger" data-act="del"${dis}>Delete</button></div>`;
  P.innerHTML = h;
  if (it.locked) P.querySelectorAll('input[type="number"]').forEach((i) => { i.disabled = true; });
}
function syncPropsValues() {
  const it = single();
  if (!it) return;
  const set = (f, v) => { const el = $('props').querySelector(`[data-f="${f}"]`); if (el && document.activeElement !== el) el.value = n(v); };
  const k = T[it.type].kind;
  if (k === 'circle') { set('spread', it.r * 2); set('x', it.x); set('y', it.y); }
  if (k === 'box') { set('w', it.w); set('h', it.h); set('rot', it.rot || 0); set('x', it.x); set('y', it.y); }
}
$('props').addEventListener('input', (e) => {
  const f = e.target.dataset.f, it = single();
  if (!f || !it || it.locked) return;
  const v = e.target.value, num = parseFloat(v), ok = Number.isFinite(num);
  switch (f) {
    case 'spread': if (ok) it.r = clamp(num / 2, 0.25, 60); break;
    case 'x': if (ok) it.x = clamp(num, -50, 150); break;
    case 'y': if (ok) it.y = clamp(num, -50, 150); break;
    case 'w': if (ok) it.w = clamp(num, 1, 200); break;
    case 'h': if (ok) it.h = clamp(num, 1, 200); break;
    case 'rot': if (ok) it.rot = num % 360; break;
    case 'width': if (ok) it.width = clamp(num, 1, 30); break;
    case 'size': if (ok) it.size = clamp(num, 0.5, 20); break;
    case 'text': it.text = v.slice(0, 200); break;
    case 'label': if (v) it.label = v.slice(0, 120); else delete it.label; break;
    default: return;
  }
  renderItems([it.id]);
  commitSoon(f === 'label' || f === 'text' ? 'Edit label' : 'Edit ' + ({ spread: 'size', w: 'size', h: 'size', rot: 'rotation', x: 'position', y: 'position' }[f] || f));
});
$('props').addEventListener('change', (e) => {
  const it0 = single();
  if (it0 && !it0.locked && (e.target.dataset.mix !== undefined || e.target.dataset.mixw !== undefined)) {
    const mix = mixOf(it0), i = +(e.target.dataset.mix ?? e.target.dataset.mixw);
    if (e.target.dataset.mix !== undefined) mix[i].sp = e.target.value; else { mix[i].w = clamp(parseFloat(e.target.value) || 1, 1, 100); balance(mix, i); }
    setMix(it0, mix); renderItems([it0.id]); renderProps(); commit('Change bed plants'); return;
  }
  const f = e.target.dataset.f, it = single();
  if (!f || !it) return;
  const v = e.target.value;
  if (f === 'locked') { if (e.target.checked) it.locked = true; else delete it.locked; renderProps(); renderPlan(); commit(it.locked ? 'Lock' : 'Unlock'); return; }
  if (it.locked) return;
  if (f === 'sp') {
    const sp = PLANT_BY_ID[v];
    if (sp) { it.sp = sp.id; if (T[it.type].kind === 'circle') it.r = Math.max(0.5, sp.w / 2); } else delete it.sp;
    renderPlan(); renderProps(); commit('Change plant'); return;
  }
  if (f === 'smooth') { it.smooth = e.target.checked; renderItems([it.id]); renderProps(); commit(it.smooth ? 'Smooth edge' : 'Straight edge'); return; }
  if (f === 'zone') { it.zone = ZONES[v] ? v : 'private'; renderItems([it.id]); commit('Change zone'); return; }
  if (f === 'finish') { it.finish = v; renderItems([it.id]); commit('Change surface'); return; }
  if (f === 'form') { it.form = v; renderItems([it.id]); commit('Change bed shape'); return; }
  if (f === 'fstyle') { it.style = FENCE_STYLES[v] ? v : 'privacy'; it.height = FENCE_HEIGHT[it.style]; Object.assign(lastFence, { style: it.style, height: it.height }); renderItems([it.id]); renderProps(); commit('Change fence style'); return; }
  if (f === 'fheight') { it.height = +v || 6; lastFence.height = it.height; renderItems([it.id]); commit('Change fence height'); return; }
  flush();
});
$('props').addEventListener('click', (e) => {
  const md = e.target.closest('[data-mixdel]'), it0 = single();
  if (md && it0 && !it0.locked) { const mix = mixOf(it0); mix.splice(+md.dataset.mixdel, 1); balance(mix); setMix(it0, mix); renderItems([it0.id]); renderProps(); commit('Remove plant from bed'); return; }
  const al = e.target.closest('[data-align]');
  if (al) { align(al.dataset.align); return; }
  const a = e.target.closest('[data-act]');
  if (!a) return;
  ({ dup: duplicate, del: removeSel, front: () => reorder(1), back: () => reorder(-1), lock: toggleLock, mixadd: mixAdd, freeform: makeFreeform })[a.dataset.act]();
});

/* ------------------------------------------------------------------ selection and edits */
function setSel(ids) {
  flush();
  sel = ids.filter((id) => byId(id));
  renderProps(); renderOverlay();
  if (tabOpen('pObjects')) renderObjects();
}
const select = (id) => setSel(id ? [id] : []);
const editable = () => selItems().filter((i) => !i.locked);
function removeSel() {
  const items = editable();
  if (!items.length) { if (sel.length) toast('Unlock it first'); return; }
  const ids = new Set(items.map((i) => i.id));
  state.items = state.items.filter((i) => !ids.has(i.id));
  sel = sel.filter((id) => !ids.has(id));
  renderProps(); renderPlan(); commit(items.length > 1 ? `Delete ${items.length} items` : 'Delete ' + T[items[0].type].name.toLowerCase());
  toast(items.length > 1 ? `${items.length} items deleted` : `${T[items[0].type].name} deleted`);
}
function moveItem(it, dx, dy) {
  if (it.pts) it.pts = it.pts.map((p) => [r1(p[0] + dx), r1(p[1] + dy)]);
  else { it.x = r1(it.x + dx); it.y = r1(it.y + dy); }
}
function cloneItems(items, dx, dy) { return items.map((it) => { const c = clone(it); c.id = uid(); delete c.locked; moveItem(c, dx, dy); return c; }); }
function duplicate() {
  const items = selItems();
  if (!items.length) return;
  const copies = cloneItems(items, 3, 3);
  state.items.push(...copies);
  sel = copies.map((c) => c.id);
  renderProps(); renderPlan(); commit('Duplicate');
}
function copySel(cut) {
  const items = selItems();
  if (!items.length) return;
  clip = clone(items); pasteN = 0;
  if (cut) removeSel(); else toast(`Copied ${items.length} item${items.length > 1 ? 's' : ''}`);
}
function paste() {
  if (!clip.length) { toast('Nothing to paste'); return; }
  pasteN++;
  const copies = cloneItems(clip, 2 * pasteN, 2 * pasteN);
  state.items.push(...copies);
  sel = copies.map((c) => c.id);
  renderProps(); renderPlan(); commit('Paste');
}
function selectAll() { setSel(state.items.filter((i) => !i.locked && !i.hidden && (layerOf(i) === 'design' ? view.design : view.diagram)).map((i) => i.id)); }
function reorder(dir) {
  const items = selItems();
  if (!items.length) return;
  const ids = new Set(items.map((i) => i.id));
  const rest = state.items.filter((i) => !ids.has(i.id));
  state.items = dir > 0 ? rest.concat(items) : items.concat(rest);
  renderPlan(); commit(dir > 0 ? 'Bring to front' : 'Send to back');
}
function toggleLock() {
  const items = selItems();
  if (!items.length) return;
  const lock = !items.every((i) => i.locked);
  items.forEach((i) => { if (lock) i.locked = true; else delete i.locked; });
  renderProps(); renderPlan(); commit(lock ? 'Lock' : 'Unlock');
  toast(lock ? 'Locked' : 'Unlocked');
}
function rotate90() {
  const items = editable().filter((i) => T[i.type].kind === 'box');
  if (!items.length) { toast('Select a rectangle or oval to rotate'); return; }
  items.forEach((i) => { i.rot = (((i.rot || 0) + 90 + 180) % 360) - 180; });
  renderPlan(); renderProps(); commit('Rotate 90°');
}
function align(mode) {
  const items = editable();
  if (items.length < 2) return;
  const bs = items.map(bbox);
  const X1 = Math.min(...bs.map((b) => b.x1)), X2 = Math.max(...bs.map((b) => b.x2)), Y1 = Math.min(...bs.map((b) => b.y1)), Y2 = Math.max(...bs.map((b) => b.y2));
  if (mode === 'disth' || mode === 'distv') {
    if (items.length < 3) { toast('Select three or more to distribute'); return; }
    const ax = mode === 'disth' ? 0 : 1;
    const order = items.map((it, i) => ({ it, c: ax ? (bs[i].y1 + bs[i].y2) / 2 : (bs[i].x1 + bs[i].x2) / 2 })).sort((a, b) => a.c - b.c);
    const first = order[0].c, step = (order[order.length - 1].c - first) / (order.length - 1);
    order.forEach((o, i) => { const d = first + step * i - o.c; moveItem(o.it, ax ? 0 : d, ax ? d : 0); });
  } else {
    items.forEach((it, i) => {
      const b = bs[i];
      const dx = { left: X1 - b.x1, right: X2 - b.x2, hcenter: (X1 + X2) / 2 - (b.x1 + b.x2) / 2 }[mode] || 0;
      const dy = { top: Y1 - b.y1, bottom: Y2 - b.y2, vmiddle: (Y1 + Y2) / 2 - (b.y1 + b.y2) / 2 }[mode] || 0;
      moveItem(it, dx, dy);
    });
  }
  renderPlan(); commit(ALIGN_NAMES[mode]);
}

/* ------------------------------------------------------------------ placing and drawing */
function newItem(type, p) {
  const t = T[type];
  const it = Object.assign({ id: uid(), type }, clone(t.d));
  if (spCats(type).length) { if (PLANT_BY_ID[curSp[type]]) it.sp = curSp[type]; else delete it.sp; }
  if (type === 'fence') Object.assign(it, lastFence);
  if (t.kind === 'line' || t.kind === 'shape') return it;
  it.x = r1(p[0]); it.y = r1(p[1]);
  if (t.kind === 'circle' && t.plant && PLANT_BY_ID[it.sp]) it.r = Math.max(0.5, PLANT_BY_ID[it.sp].w / 2);
  if (t.kind === 'box') it.rot = 0;
  if (t.kind === 'text') it.text = 'Label';
  return it;
}
/* snapping: corners of other items and of the base plan within 10 px, else the 1 ft grid */
function snapPt(p, exceptId) {
  snapMark = null;
  if (!view.snap) return p;
  const tol = 10 / view.k;
  let best = null, bd = tol;
  const L = lot();
  const cand = isScott() ? SNAP_PTS.slice() : [[0, 0], [L.w, 0], [L.w, L.h], [0, L.h]];
  for (const it of state.items) {
    if (it.id === exceptId || it.hidden) continue;
    const k = T[it.type].kind;
    if (k === 'line' || k === 'shape') cand.push(...it.pts);
    else if (k === 'box') cand.push(...itemPoly(it), [it.x, it.y]);
    else if (k === 'circle') cand.push([it.x, it.y]);
  }
  if (draft) cand.push(...draft.pts);
  for (const c of cand) { const d = dist(c, p); if (d < bd) { bd = d; best = c; } }
  if (best) { snapMark = best; return [best[0], best[1]]; }
  return [Math.round(p[0]), Math.round(p[1])];
}
function placeAt(p) {
  const t = T[tool];
  if (!t || t.kind === 'line' || t.kind === 'shape') return;
  if (view.snap) p = [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2];
  const it = newItem(tool, p);
  state.items.push(it);
  sel = [it.id];
  const label = 'Place ' + (spOf(it) && t.plant ? spOf(it).cn : t.name.toLowerCase());
  if (!t.stay) setTool('select');
  renderProps(); renderPlan(); commit(label);
  if (t.kind === 'text') { const inp = $('props').querySelector('[data-f="text"]'); if (inp) { inp.focus(); inp.select(); } }
}
let lastTap = { t: 0, x: 0, y: 0 };
function polyClick(p, sx, sy) {
  const now = performance.now();
  const dbl = draft && now - lastTap.t < 380 && Math.hypot(sx - lastTap.x, sy - lastTap.y) < 12;
  lastTap = { t: now, x: sx, y: sy };
  if (dbl) { finishDraft(); return; }
  const t = T[tool];
  if (draft && t.kind === 'shape' && draft.pts.length >= 3 && dist(draft.pts[0], p) < 10 / view.k) { finishDraft(); return; }
  p = snapPt(p);
  if (!draft) draft = { type: tool, pts: [] };
  const last = draft.pts[draft.pts.length - 1];
  if (!last || dist(last, p) > 0.3) draft.pts.push([r1(p[0]), r1(p[1])]);
  $('hint').textContent = hintFor(tool);
  renderOverlay();
}
function finishDraft() {
  const d = draft;
  draft = null; snapMark = null;
  if (!d) return;
  const t = T[d.type], min = t.kind === 'shape' ? 3 : 2;
  if (d.pts.length < min) { renderOverlay(); $('hint').textContent = hintFor(tool); toast(`Needs at least ${min} points`); return; }
  const it = newItem(d.type, null);
  it.pts = d.pts;
  state.items.push(it);
  sel = [it.id];
  setTool('select');
  renderProps(); renderPlan(); commit('Draw ' + t.name.replace(' (draw)', '').toLowerCase());
}
function cancelDraft() { draft = null; snapMark = null; $('hint').textContent = hintFor(tool); renderOverlay(); }

/* ------------------------------------------------------------------ pointer input */
const pointers = new Map();
let drag = null, pinch = null, spaceDown = false;
svg.addEventListener('pointerdown', (e) => {
  closeMenus();
  if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
  try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (pointers.size === 2) {
    if (drag && drag.moved && (drag.mode === 'move' || drag.mode === 'handle')) commit(drag.label);
    drag = null; marquee = null;
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
    return;
  }
  if (pointers.size > 2) return;
  e.preventDefault();
  const p = toWorld(e.clientX, e.clientY);
  const startPan = () => ({ mode: 'pan', sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy });
  if (e.button === 1 || spaceDown || tool === 'hand') { drag = startPan(); svg.classList.add('panning'); return; }
  if (tool === 'select') {
    const hEl = e.target.closest('[data-h]');
    const iEl = e.target.closest('[data-id]');
    const one = single();
    if (hEl && one && !one.locked) {
      const h = hEl.getAttribute('data-h');
      if (h[0] === 'v' && e.altKey) { removeVertex(one, +h.slice(1)); return; }
      if (h[0] === 'm') { const i = +h.slice(1); one.pts.splice(i + 1, 0, [r1(p[0]), r1(p[1])]); drag = { mode: 'handle', h: 'v' + (i + 1), moved: true, label: 'Add point' }; renderOverlay(); return; }
      drag = { mode: 'handle', h, moved: false, label: { r: 'Resize', size: 'Resize', rot: 'Rotate' }[h] || 'Move point' };
      return;
    }
    const it = iEl ? byId(iEl.getAttribute('data-id')) : null;
    if (it && !it.locked) {
      if (e.shiftKey) { setSel(sel.includes(it.id) ? sel.filter((x) => x !== it.id) : sel.concat(it.id)); return; }
      if (!sel.includes(it.id)) select(it.id);
      let moving = editable(), copied = false;
      if (e.altKey) {   // Alt-drag copies
        moving = cloneItems(moving, 0, 0);
        state.items.push(...moving); sel = moving.map((c) => c.id); copied = true; renderPlan(); renderProps();
      }
      const a0 = moving[0] ? (moving[0].pts ? moving[0].pts[0] : [moving[0].x, moving[0].y]) : p;
      drag = { mode: 'move', start: p, orig: moving.map((m) => clone(m)), moved: false, copied, sx: e.clientX, sy: e.clientY, label: copied ? 'Copy' : 'Move', anchor: a0 };
      return;
    }
    if (e.pointerType === 'touch') { if (!e.shiftKey) select(null); drag = startPan(); return; }
    drag = { mode: 'marquee', base: e.shiftKey ? sel.slice() : [] };
    marquee = { a: p, b: p };
    return;
  }
  if (tool === 'measure' || tool === 'imgscale') { const q = tool === 'measure' ? snapPt(p) : p; measure = { a: q, b: q }; drag = { mode: 'measure' }; renderOverlay(); return; }
  drag = Object.assign(startPan(), { mode: 'tap', p });
});
function removeVertex(it, i) {
  const min = T[it.type].kind === 'shape' ? 3 : 2;
  if (it.pts.length <= min) { toast(`Needs at least ${min} points`); return; }
  it.pts.splice(i, 1);
  renderItems([it.id]); renderProps(); commit('Delete point');
}
svg.addEventListener('pointermove', (e) => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    view.cx -= (m[0] - pinch.m[0]) / view.k; view.cy -= (m[1] - pinch.m[1]) / view.k;
    if (pinch.d > 0) zoomAt(m[0], m[1], d / pinch.d); else applyView();
    pinch = { d, m };
    return;
  }
  const p = toWorld(e.clientX, e.clientY);
  trackCursor(p);
  if (!drag) {
    if (e.pointerType === 'mouse' && (T[tool] || draft)) {
      hover = draft || (T[tool] && (T[tool].kind === 'line' || T[tool].kind === 'shape')) ? snapPt(p) : p;
      renderOverlay();
    }
    return;
  }
  const it = single();
  switch (drag.mode) {
    case 'pan':
      view.cx = drag.cx - (e.clientX - drag.sx) / view.k; view.cy = drag.cy - (e.clientY - drag.sy) / view.k;
      svg.classList.add('panning'); applyView();
      break;
    case 'tap':
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.mode = 'pan';
      else if (e.pointerType === 'mouse') { hover = p; renderOverlay(); }
      break;
    case 'marquee': {
      marquee.b = p;
      const x1 = Math.min(marquee.a[0], p[0]), x2 = Math.max(marquee.a[0], p[0]), y1 = Math.min(marquee.a[1], p[1]), y2 = Math.max(marquee.a[1], p[1]);
      const hit = state.items.filter((i) => !i.locked && !i.hidden && (layerOf(i) === 'design' ? view.design : view.diagram)).filter((i) => { const b = bbox(i); return b.x1 < x2 && b.x2 > x1 && b.y1 < y2 && b.y2 > y1; }).map((i) => i.id);
      sel = [...new Set(drag.base.concat(hit))];
      renderOverlay();
      break;
    }
    case 'move': {
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 3) break;
      drag.moved = true;
      let dx = p[0] - drag.start[0], dy = p[1] - drag.start[1];
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      if (view.snap && !e.ctrlKey) { const a = drag.anchor; dx = Math.round((a[0] + dx) * 2) / 2 - a[0]; dy = Math.round((a[1] + dy) * 2) / 2 - a[1]; }
      for (const o of drag.orig) { const cur = byId(o.id); if (!cur) continue; if (o.pts) cur.pts = o.pts.map((q) => [r1(q[0] + dx), r1(q[1] + dy)]); else { cur.x = r1(o.x + dx); cur.y = r1(o.y + dy); } }
      renderItems(drag.orig.map((o) => o.id)); syncPropsValues();
      break;
    }
    case 'handle': {
      if (!it) break;
      drag.moved = true;
      const h = drag.h;
      if (h === 'r') it.r = clamp(r1(dist([it.x, it.y], p)), 0.25, 60);
      else if (h === 'size') { const l = toLocal(it, p); it.w = clamp(r1(Math.abs(l[0]) * 2), 1, 200); it.h = clamp(r1(Math.abs(l[1]) * 2), 1, 200); }
      else if (h === 'rot') {
        let a = Math.atan2(p[1] - it.y, p[0] - it.x) * 180 / Math.PI + 90;
        a = e.shiftKey || view.snap ? Math.round(a / 15) * 15 : Math.round(a);
        if (a > 180) a -= 360;
        it.rot = a;
      } else if (h[0] === 'v') { const i = +h.slice(1); if (it.pts[i]) { const q = snapPt(p, it.id); it.pts[i] = [r1(q[0]), r1(q[1])]; } }
      renderItems([it.id]); syncPropsValues();
      break;
    }
    case 'measure': measure.b = tool === 'measure' ? snapPt(p) : p; renderOverlay(); break;
  }
});
function endPointer(e, cancelled) {
  pointers.delete(e.pointerId);
  try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
  const d = drag;
  drag = null;
  svg.classList.remove('panning');
  if (!d) return;
  if ((d.mode === 'move' || d.mode === 'handle') && (d.moved || d.copied)) { snapMark = null; renderPlan(); commit(d.label); renderProps(); }
  if (d.mode === 'marquee') { marquee = null; setSel(sel); }
  if (d.mode === 'measure' && tool === 'imgscale' && !cancelled) askScale();
  if (d.mode === 'tap' && !cancelled) {
    const t = T[tool];
    if (t && (t.kind === 'line' || t.kind === 'shape')) polyClick(d.p, e.clientX, e.clientY); else placeAt(d.p);
  }
}
svg.addEventListener('pointerup', (e) => endPointer(e, false));
svg.addEventListener('pointercancel', (e) => endPointer(e, true));
svg.addEventListener('pointerleave', (e) => { trackCursor(null); if (e.pointerType === 'mouse' && !drag) { hover = null; renderOverlay(); } });
svg.addEventListener('dblclick', (e) => { e.preventDefault(); if (draft) finishDraft(); });
svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  zoomAt(e.clientX, e.clientY, Math.exp(-dy * 0.0015));
}, { passive: false });
$('zIn').addEventListener('click', () => zoomCenter(1.3));
$('zOut').addEventListener('click', () => zoomCenter(1 / 1.3));
$('zFit').addEventListener('click', fit);
if (window.ResizeObserver) new ResizeObserver(() => applyView()).observe(svg); else window.addEventListener('resize', applyView);

/* ------------------------------------------------------------------ menus (menu bar and right-click) */
const ctx = $('ctx');
function menuButtons(items) {
  return items.map((m) => {
    if (m === '-') return '<hr>';
    const en = m.en ? m.en() : true, ck = m.ck ? m.ck() : null;
    return `<button type="button" role="${ck === null ? 'menuitem' : 'menuitemcheckbox'}" data-m="${esc(m.id)}"${ck === null ? '' : ` aria-checked="${ck}"`}${en ? '' : ' disabled'}>${esc(m.l)}${m.k ? `<kbd>${m.k}</kbd>` : ''}</button>`;
  }).join('');
}
const hasSel = () => sel.length > 0;
const MI = {};
function mi(id, l, act, opts) { MI[id] = Object.assign({ id, l, act }, opts || {}); return MI[id]; }
const MENUS = [
  ['File', [mi('new', 'New design…', () => showNew(), { k: 'Ctrl+Alt+N' }), mi('mine', 'My designs…', () => showMine()), mi('open', 'Open design file…', () => showOpen(), { k: 'Ctrl+O' }), mi('save', 'Save design file', () => saveDesign(), { k: 'Ctrl+S' }), '-',
    mi('site', 'Lot and project settings…', () => showSiteSettings(), { en: () => !isScott() }), mi('img', 'Import trace image…', () => pickImage(), { en: () => !isScott() }), '-',
    mi('export', 'Export to turn in…', () => $('bExport').click(), { k: 'Ctrl+E' }), mi('clear', 'Start over (clear this plan)…', () => $('bClear').click())]],
  ['Edit', [mi('undo', 'Undo', undo, { k: 'Ctrl+Z', en: () => hIdx > 0 }), mi('redo', 'Redo', redo, { k: 'Ctrl+Y', en: () => hIdx < hist.length - 1 }), '-',
    mi('cut', 'Cut', () => copySel(true), { k: 'Ctrl+X', en: hasSel }), mi('copy', 'Copy', () => copySel(false), { k: 'Ctrl+C', en: hasSel }), mi('paste', 'Paste', paste, { k: 'Ctrl+V', en: () => clip.length > 0 }),
    mi('dup', 'Duplicate', duplicate, { k: 'Ctrl+D', en: hasSel }), mi('del', 'Delete', removeSel, { k: 'Del', en: hasSel }), '-',
    mi('all', 'Select all', selectAll, { k: 'Ctrl+A' }), mi('none', 'Deselect', () => select(null), { k: 'Esc', en: hasSel })]],
  ['View', [mi('zin', 'Zoom in', () => zoomCenter(1.3), { k: 'Ctrl +' }), mi('zout', 'Zoom out', () => zoomCenter(1 / 1.3), { k: 'Ctrl −' }), mi('zfit', 'Fit plan', fit, { k: 'Ctrl+0' }), mi('z100', 'Actual print size', zoomActual, { k: 'Ctrl+1' }), '-',
    mi('srender', 'Rendered plan', () => setStyle('render'), { ck: () => view.style === 'render' }), mi('scolor', 'Color line drafting', () => setStyle('color'), { ck: () => view.style === 'color' }), mi('sbw', 'Black & white drafting', () => setStyle('bw'), { ck: () => view.style === 'bw' }), '-',
    mi('vgrid', '10 ft grid', () => toggleView('tGrid'), { ck: () => view.grid }), mi('vsite', 'Notes & labels', () => toggleView('tSite'), { ck: () => view.site }), mi('vutil', 'Utility lines', () => toggleView('tUtil'), { ck: () => view.util, en: isScott }), mi('vtags', 'Plant tags', () => toggleView('tTypes'), { ck: () => view.tags }), mi('vdiag', 'Functional diagram', () => toggleView('tDiagram'), { ck: () => view.diagram }),
    mi('vfloor', 'House floor plan detail', () => toggleView('tFloor'), { ck: () => view.floor, en: isScott }),
    mi('vsnap', 'Snap', () => { $('optSnap').checked = !view.snap; $('optSnap').dispatchEvent(new Event('change')); }, { ck: () => view.snap }), mi('vlib', 'Plant library', () => toggleLib(), { ck: () => view.lib })]],
  ['Arrange', [mi('front', 'Bring to front', () => reorder(1), { k: 'Ctrl+]', en: hasSel }), mi('back', 'Send to back', () => reorder(-1), { k: 'Ctrl+[', en: hasSel }), '-',
    ...Object.keys(ALIGN_NAMES).map((k) => mi('al-' + k, ALIGN_NAMES[k], () => align(k), { en: () => editable().length > (k.startsWith('dist') ? 2 : 1) })), '-',
    mi('fencelot', 'Fence the property line', () => fenceLot(), {}), '-',
    mi('rot90', 'Rotate 90°', rotate90, { en: hasSel }), mi('lock', 'Lock / unlock', toggleLock, { k: 'Ctrl+L', en: hasSel })]],
  ['Help', [mi('keys', 'Keyboard shortcuts', showKeys, { k: '?' }), mi('brief', 'Project brief', showBrief), mi('about', 'About this tool', showAbout)]],
];
function renderMenubar() {
  $('menubar').innerHTML = MENUS.map(([name], i) => `<div><button type="button" aria-haspopup="menu" aria-expanded="false" data-menu="${i}">${name}</button><div class="menu" role="menu" id="menu${i}"></div></div>`).join('');
  $('menubar').querySelectorAll('[data-menu]').forEach((b) => {
    b.addEventListener('click', (e) => { e.stopPropagation(); const open = b.getAttribute('aria-expanded') === 'true'; closeMenus(); if (!open) openMenu(+b.dataset.menu); });
    b.addEventListener('mouseenter', () => { if (document.querySelector('.menu.open') && b.getAttribute('aria-expanded') !== 'true') { closeMenus(); openMenu(+b.dataset.menu); } });
  });
}
function openMenu(i) {
  const m = $('menu' + i), b = document.querySelector(`[data-menu="${i}"]`);
  m.innerHTML = menuButtons(MENUS[i][1]);
  m.classList.add('open'); b.setAttribute('aria-expanded', 'true');
  const r = m.getBoundingClientRect();
  if (r.right > innerWidth) m.style.left = (innerWidth - r.right - 4) + 'px';
}
function closeMenus() {
  document.querySelectorAll('.menu.open').forEach((m) => { m.classList.remove('open'); m.style.left = ''; });
  document.querySelectorAll('[data-menu]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  ctx.classList.remove('open');
}
const CTX_EXTRA = {};
document.addEventListener('click', (e) => {
  const b = e.target.closest('.menu [data-m], .ctx [data-m]');
  if (b) { const m = MI[b.dataset.m] || CTX_EXTRA[b.dataset.m]; closeMenus(); if (m) m.act(); return; }
  if (!e.target.closest('.menubar') && !e.target.closest('.ctx')) closeMenus();
});
svg.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (tool !== 'select') { if (draft) finishDraft(); return; }
  const hEl = e.target.closest('[data-h]'), iEl = e.target.closest('[data-id]');
  let items;
  const one = single();
  if (hEl && one && hEl.getAttribute('data-h')[0] === 'v') {
    const i = +hEl.getAttribute('data-h').slice(1);
    CTX_EXTRA.delpt = { id: 'delpt', l: 'Delete this point', act: () => removeVertex(one, i) };
    items = [CTX_EXTRA.delpt, '-', MI.del];
  } else if (iEl) {
    const it = byId(iEl.getAttribute('data-id'));
    if (it && !sel.includes(it.id)) select(it.id);
    const s = single();
    CTX_EXTRA.smooth = { id: 'smooth', l: 'Smooth curved edge', ck: () => !!(s && s.smooth), act: () => { const x = single(); if (x) { x.smooth = !x.smooth; renderItems([x.id]); renderProps(); commit(x.smooth ? 'Smooth edge' : 'Straight edge'); } } };
    CTX_EXTRA.hide = { id: 'hide', l: 'Hide', act: () => { selItems().forEach((i) => { i.hidden = true; }); setSel([]); renderPlan(); commit('Hide'); toast('Hidden. Show it again from the Objects tab.'); } };
    items = [MI.cut, MI.copy, MI.paste, MI.dup, MI.del, '-', MI.front, MI.back, '-', MI.rot90, MI.lock, CTX_EXTRA.hide];
    if (s && T[s.type].kind === 'shape') items.push('-', CTX_EXTRA.smooth);
  } else {
    items = [MI.paste, MI.all, '-', MI.zfit, MI.z100];
  }
  ctx.innerHTML = menuButtons(items);
  ctx.classList.add('open');
  const r = ctx.getBoundingClientRect();
  ctx.style.left = Math.min(e.clientX, innerWidth - r.width - 4) + 'px';
  ctx.style.top = Math.min(e.clientY, innerHeight - r.height - 4) + 'px';
});

/* ------------------------------------------------------------------ keyboard */
document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  if ($('dlg').open) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (e.key === 'Escape') {
    if (document.querySelector('.menu.open') || ctx.classList.contains('open')) { closeMenus(); return; }
    if (typing) { e.target.blur(); return; }
    if (draft) cancelDraft();
    else if (tool !== 'select') setTool('select');
    else if (measure) { measure = null; renderOverlay(); }
    else select(null);
    return;
  }
  if (mod && k === 's') { e.preventDefault(); saveDesign(); return; }
  if (mod && e.altKey && k === 'n') { e.preventDefault(); showNew(); return; }
  if (mod && k === 'o') { e.preventDefault(); showOpen(); return; }
  if (mod && k === 'e') { e.preventDefault(); $('bExport').click(); return; }
  if (typing) return;
  if (e.key === ' ' && !(e.target.closest && e.target.closest('button,a,summary,label'))) {
    e.preventDefault();
    if (!spaceDown) { spaceDown = true; svg.classList.add('space'); }
    return;
  }
  if (mod) {
    const acts = { z: () => (e.shiftKey ? redo() : undo()), y: redo, d: duplicate, c: () => copySel(false), x: () => copySel(true), v: paste, a: selectAll, l: toggleLock,
      '=': () => zoomCenter(1.3), '+': () => zoomCenter(1.3), '-': () => zoomCenter(1 / 1.3), 0: fit, 1: zoomActual, ']': () => reorder(1), '[': () => reorder(-1) };
    if (acts[k]) { e.preventDefault(); acts[k](); }
    return;
  }
  if (e.key === 'Enter' && draft) { e.preventDefault(); finishDraft(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (draft) { e.preventDefault(); draft.pts.pop(); if (!draft.pts.length) draft = null; renderOverlay(); return; }
    if (sel.length) { e.preventDefault(); removeSel(); }
    return;
  }
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (arrows[e.key] && sel.length) {
    e.preventDefault();
    const s = e.shiftKey ? 5 : (e.altKey ? 0.1 : 1), items = editable();
    items.forEach((it) => moveItem(it, arrows[e.key][0] * s, arrows[e.key][1] * s));
    renderItems(items.map((i) => i.id)); syncPropsValues(); commitSoon('Nudge');
    return;
  }
  if (e.key === '?') { showKeys(); return; }
  if (!e.altKey && e.key.length === 1) {
    const hit = Object.entries(KEYS).find(([, v]) => v === e.key.toUpperCase());
    if (hit) { e.preventDefault(); setTool(hit[0]); }
  }
});
document.addEventListener('keyup', (e) => { if (e.key === ' ') { spaceDown = false; svg.classList.remove('space'); } });
window.addEventListener('blur', () => { spaceDown = false; svg.classList.remove('space'); });

/* ------------------------------------------------------------------ design check */
function runCheck() {
  checkRun = true;
  const issues = [];
  const bldg = buildingPolys(), L = lot(), scott = isScott();
  const trees = state.items.filter((i) => T[i.type].tree && !i.hidden);
  for (const it of state.items) {
    if (it.hidden) continue;
    const t = T[it.type], sp = spOf(it);
    if (t.tree) {
      const p = [it.x, it.y];
      for (const b of bldg) if (polyDist(p, b.poly) < it.r) issues.push({ id: it.id, msg: `${nameOf(it)}: the canopy hangs over the ${b.name} roof. Move it out or choose a smaller tree.` });
      const dh = bldg.length ? Math.min(...bldg.map((b) => polyDist(p, b.poly))) : Infinity;
      if (dh < 15) issues.push({ id: it.id, msg: `${nameOf(it)}: the trunk is only ${dh.toFixed(1)} ft from the ${scott ? 'house' : 'building'}. Keep trees 15–20 ft from the side and 12–15 ft from a corner.` });
      for (const w of scott ? WIRES : []) {
        if (segDist(p, w.a, w.b) < it.r) issues.push({ id: it.id, msg: `${nameOf(it)}: the canopy reaches ${w.name}${sp && sp.h > w.h ? `, and it grows ${sp.h} ft tall (the wire is ${w.h} ft up)` : ''}. Move it, or use a small tree under 25 ft.${view.util ? '' : ' Turn on Utility lines under Layers to see the wires.'}` });
      }
    }
    if (layerOf(it) !== 'design' || t.kind === 'text') continue;
    const fp = t.kind === 'line' ? it.pts : itemPoly(it);
    if (fp.some(([x, y]) => x < -0.05 || y < -0.05 || x > L.w + 0.05 || y > L.h + 0.05)) issues.push({ id: it.id, msg: `${nameOf(it)} goes outside the property line.` });
    if (t.kind !== 'line' && it.type !== 'building') {
      const [cx, cy] = itemCenter(it);
      if (scott && cx > DRIVE.x1 && cx < DRIVE.x2 && cy > DRIVE.y1 && cy < DRIVE.y2) issues.push({ id: it.id, msg: `${nameOf(it)} sits on the driveway.` });
      else if (!t.tree) { const b = bldg.find((q) => q.id !== it.id && inPoly([cx, cy], q.poly)); if (b) issues.push({ id: it.id, msg: `${nameOf(it)} sits on top of the ${b.name}.` }); }
    }
  }
  for (let i = 0; i < trees.length; i++) for (let j = i + 1; j < trees.length; j++) {
    const a = trees[i], b = trees[j], d = dist([a.x, a.y], [b.x, b.y]);
    if (d < (a.r + b.r) * 0.55) issues.push({ id: b.id, msg: `${nameOf(a)} and ${nameOf(b)} are only ${d.toFixed(0)} ft apart. At full size they will crowd each other.` });
  }
  wantList().forEach((w, i) => { if (!w.d) issues.push({ want: i, msg: `Client wants: “${w.t}” isn't checked off yet.` }); });
  const ul = $('issues');
  const probs = issues.filter((s) => s.want === undefined).length;
  $('checkBadge').textContent = issues.length ? String(issues.length) : '✓';
  if (!issues.length) { ul.innerHTML = '<li class="ok"><span class="dot"></span><span>No problems found. Nice work.</span></li>'; return; }
  ul.innerHTML = (probs ? '' : '<li class="ok"><span class="dot"></span><span>The plan itself passes. Finish the client list.</span></li>') + issues.map((s, i) =>
    `<li class="${s.want !== undefined ? 'note' : ''}"><span class="dot"></span><span>${esc(s.msg)}</span><button type="button" data-issue="${i}">Show</button></li>`).join('');
  ul.querySelectorAll('[data-issue]').forEach((b) => b.addEventListener('click', () => {
    const s = issues[+b.dataset.issue];
    if (s.id) {
      const it = byId(s.id);
      if (!it) return;
      if (tool !== 'select') setTool('select');
      if (layerOf(it) === 'design' && !view.design) { view.design = true; $('tDesign').checked = true; renderPlan(); }
      select(it.id); centerOn(itemCenter(it)); showTab('pProps');
    } else {
      showTab('pWants');
      const cb = $('clientList').querySelector(`[data-want="${s.want}"]`);
      if (cb) cb.focus();
    }
  }));
}
$('bCheck').addEventListener('click', () => { flush(); runCheck(); });

/* ------------------------------------------------------------------ schedule and takeoff */
function takeoff() {
  const plants = {}, mats = {};
  const addM = (key, name, type, qty, unit, extra) => { mats[key] = mats[key] || { name, type, qty: 0, unit, extra: 0 }; mats[key].qty += qty; mats[key].extra += extra || 0; };
  for (const it of state.items) {
    if (layerOf(it) !== 'design' || it.hidden) continue;
    const t = T[it.type], sp = spOf(it), a = areaOf(it);
    if (isBedType(it.type)) {
      for (const m of bedMix(it)) {
        const row = plants[m.sp.id] = plants[m.sp.id] || { sp: m.sp, qty: 0, area: 0, approx: true };
        row.area += a * m.w; row.qty += Math.max(1, Math.round(a * m.w / ((m.sp.spc || 1.5) ** 2 * 0.866)));
      }
    } else if (sp) {
      const row = plants[sp.id] = plants[sp.id] || { sp, qty: 0, area: 0, approx: false };
      if (t.kind === 'circle') row.qty += 1;
      else { row.area += a; if (sp.t !== 'turf') { row.qty += Math.max(1, Math.round(a / ((sp.spc || 1.5) ** 2 * 0.866))); row.approx = true; } }
    }
    if (isBedType(it.type) && !(bedMix(it).length === 1 && bedMix(it)[0].sp.t === 'groundcover')) addM('mulch', 'Hardwood mulch, 3 in. deep', 'bedShape', a, 'sq ft', a * 0.25 / 27);
    if (it.type === 'patio' || it.type === 'paveShape') addM('pave-' + it.finish, `${FINISHES[it.finish] || 'Paving'} paving`, 'paveShape', a, 'sq ft');
    if (it.type === 'deck') addM('deck', 'Wood deck', 'deck', a, 'sq ft');
    if (it.type === 'path') addM('path-' + it.finish, `${PATH_FINISHES[it.finish] || 'Concrete'} walk`, 'path', polyLen(it.pts), 'lin ft', a);
    if (it.type === 'fence') { const fs = it.style || 'privacy'; addM('fence-' + fs + (it.height || 6), `${it.height || FENCE_HEIGHT[fs]} ft ${FENCE_STYLES[fs].toLowerCase()}`, 'fence', polyLen(it.pts), 'lin ft'); }
    if (it.type === 'veg') addM('veg', 'Raised vegetable beds', 'veg', a, 'sq ft');
    if (it.type === 'wood') addM('wood', 'Firewood stockpile', 'wood', 1, 'ea');
    if (it.type === 'birdbath') addM('bird', 'Bird bath / feeder', 'birdbath', 1, 'ea');
  }
  const order = CATS.map((c) => c[0]);
  const plantRows = Object.values(plants).sort((a, b) => order.indexOf(a.sp.t) - order.indexOf(b.sp.t) || a.sp.cn.localeCompare(b.sp.cn));
  return { plants: plantRows, mats: Object.values(mats) };
}
const fmtQty = (r) => (r.sp.t === 'turf' ? `${Math.round(r.area).toLocaleString()} sq ft` : `${r.approx ? '≈' : ''}${r.qty}`);
const fmtMat = (m) => `${Math.round(m.qty).toLocaleString()} ${m.unit}${m.unit === 'sq ft' && m.extra ? ` (${m.extra.toFixed(1)} cu yd)` : ''}${m.unit === 'lin ft' && m.extra ? ` (${Math.round(m.extra)} sq ft)` : ''}`;
function renderSched() {
  const { plants, mats } = takeoff();
  if (!plants.length && !mats.length) { $('sched').innerHTML = '<p class="muted">Nothing placed yet. The plant schedule and material takeoff build themselves as you design.</p>'; return; }
  let h = '<table class="sched"><thead><tr><th>Key</th><th>Plant</th><th style="text-align:right">Qty</th></tr></thead><tbody>';
  let lastCat = '';
  for (const r of plants) {
    if (r.sp.t !== lastCat) { lastCat = r.sp.t; h += `<tr class="grp"><td colspan="3">${CATS.find((c) => c[0] === lastCat)[1]}</td></tr>`; }
    h += `<tr><td><span class="code">${PLANT_CODE[r.sp.id]}</span></td><td>${esc(r.sp.cn)}<i>${esc(r.sp.bn)}${r.sp.t === 'turf' ? '' : ` · ${r.sp.w}′×${r.sp.h}′`}</i></td><td class="n">${fmtQty(r)}</td></tr>`;
  }
  if (mats.length) {
    h += '<tr class="grp"><td colspan="3">Materials</td></tr>';
    h += mats.map((m) => `<tr><td><span class="chip" style="width:26px;height:20px">${iconSVG(m.type, view.style)}</span></td><td>${esc(m.name)}</td><td class="n">${fmtMat(m)}</td></tr>`).join('');
  }
  $('sched').innerHTML = h + '</tbody></table><p class="muted" style="margin-top:8px">≈ bed counts come from the plant spacing. Mulch volume is for 3 in. deep.</p>';
}

/* ------------------------------------------------------------------ objects and history panels */
const EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.1A11 11 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.2 6.3C3.6 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4.3-1"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const UNLOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
function renderObjects() {
  $('objBadge').textContent = state.items.length || '';
  if (!tabOpen('pObjects')) return;
  const rows = [...sortedItems('diagram').reverse(), ...sortedItems('design').reverse()];
  $('objList').innerHTML = rows.length ? rows.map((it) => `<div class="obj" data-obj="${esc(it.id)}" aria-selected="${sel.includes(it.id)}" role="option" tabindex="0">
    <span class="chip">${iconSVG(it.type, view.style, it.sp)}</span><span class="on">${esc(nameOf(it))}</span>
    <button type="button" class="ob${it.locked ? ' on1' : ''}" data-olock="${esc(it.id)}" aria-label="${it.locked ? 'Unlock' : 'Lock'}">${it.locked ? LOCK : UNLOCK}</button>
    <button type="button" class="ob" data-ohide="${esc(it.id)}" aria-label="${it.hidden ? 'Show' : 'Hide'}">${it.hidden ? EYE_OFF : EYE}</button></div>`).join('')
    : '<p class="muted" style="padding:12px">Nothing placed yet.</p>';
}
$('objList').addEventListener('click', (e) => {
  const lk = e.target.closest('[data-olock]'), hd = e.target.closest('[data-ohide]'), row = e.target.closest('[data-obj]');
  if (lk) { const it = byId(lk.dataset.olock); if (it.locked) delete it.locked; else it.locked = true; renderPlan(); renderObjects(); renderProps(); commit(it.locked ? 'Lock' : 'Unlock'); return; }
  if (hd) { const it = byId(hd.dataset.ohide); if (it.hidden) delete it.hidden; else it.hidden = true; renderPlan(); renderObjects(); commit(it.hidden ? 'Hide' : 'Show'); return; }
  if (row) {
    const id = row.dataset.obj;
    if (e.shiftKey) setSel(sel.includes(id) ? sel.filter((x) => x !== id) : sel.concat(id)); else select(id);
    const it = byId(id);
    if (it && !it.hidden) centerOn(itemCenter(it));
  }
});
$('objList').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.obj) e.target.click(); });
function renderHist() {
  if (!tabOpen('pHist')) return;
  $('histList').innerHTML = hist.map((h, i) => `<button type="button" class="hist${i === hIdx ? ' cur' : ''}${i > hIdx ? ' future' : ''}" data-hist="${i}"><span class="hn">${i + 1}</span>${esc(i === 0 ? 'Open' : h.label)}</button>`).reverse().join('');
}
$('histList').addEventListener('click', (e) => { const b = e.target.closest('[data-hist]'); if (b) { jumpTo(+b.dataset.hist); renderHist(); } });

/* ------------------------------------------------------------------ side refresh */
function renderSide(light) {
  if (!light) { if (tabOpen('pSched')) renderSched(); renderObjects(); renderHist(); }
  if (checkRun) runCheck();
  $('bUndo').disabled = hIdx <= 0;
  $('bRedo').disabled = hIdx >= hist.length - 1;
  $('bUndo').title = hIdx > 0 ? `Undo ${hist[hIdx].label} (Ctrl+Z)` : 'Undo (Ctrl+Z)';
  $('sbCount').textContent = `${state.items.length} item${state.items.length === 1 ? '' : 's'}`;
  const wl = wantList();
  $('wantsBadge').textContent = wl.length ? `${wl.filter((w) => w.d).length}/${wl.length}` : '';
}

/* ------------------------------------------------------------------ layers, style, meta, client list */
const TOGGLES = { tSite: 'site', tUtil: 'util', tGrid: 'grid', tDiagram: 'diagram', tDesign: 'design', tTypes: 'tags', tBase: 'base', tFloor: 'floor', tImg: 'img' };
for (const [id, key] of Object.entries(TOGGLES)) {
  $(id).addEventListener('change', (e) => {
    view[key] = e.target.checked;
    if (key === 'design' || key === 'diagram') setSel(sel.filter((s) => { const it = byId(s); return it && (layerOf(it) === 'design' ? view.design : view.diagram); }));
    renderPlan(); saveView();
  });
}
function toggleView(id) { $(id).checked = !$(id).checked; $(id).dispatchEvent(new Event('change')); }
function setStyle(s) {
  view.style = s;
  $('styleSeg').querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.style === s));
  renderPlan(); renderRail(); setTool(tool); renderProps(); renderSide(); saveView();
}
$('styleSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-style]'); if (b) setStyle(b.dataset.style); });
$('optSnap').addEventListener('change', (e) => { view.snap = e.target.checked; $('hint').textContent = hintFor(tool); saveView(); toast(view.snap ? 'Snap on' : 'Snap off'); });
const META = { fName: 'name', fSection: 'section', fDate: 'date' };
function syncMeta() { for (const [id, k] of Object.entries(META)) $(id).value = state.meta[k] || ''; renderClient(); }
for (const [id, k] of Object.entries(META)) {
  $(id).setAttribute('maxlength', 80);
  $(id).addEventListener('input', (e) => { state.meta[k] = e.target.value.slice(0, 80); commitSoon('Edit title block'); });
}
/* client checklist: an editable list on every design (the Scott lab starts with the brief's seven) */
const IC = {
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', del: '<path d="M6 6l12 12M18 6 6 18"/>',
};
let editingWant = -1;
function renderClient() {
  const wl = wantList(), last = wl.length - 1;
  const btn = (act, i, label, dis) => `<button type="button" class="iconbtn" data-wact="${act}" data-wi="${i}" aria-label="${label}" title="${label}"${dis ? ' disabled style="visibility:hidden"' : ''}><svg viewBox="0 0 24 24">${IC[act]}</svg></button>`;
  let h = wl.map((w, i) => editingWant === i
    ? `<div class="want"><input class="wedit" id="wantEdit" value="${esc(w.t)}" maxlength="120" aria-label="Edit wish"><button type="button" class="btn" data-wact="save" data-wi="${i}">Save</button></div>`
    : `<div class="want"><label class="check"><input type="checkbox" data-want="${i}" ${w.d ? 'checked' : ''}> <span data-wedit="${i}" title="Double-click to edit">${esc(w.t)}</span></label>
       <span class="wb">${btn('up', i, 'Move up', i === 0)}${btn('down', i, 'Move down', i === last)}${btn('edit', i, 'Edit')}${btn('del', i, 'Remove')}</span></div>`).join('');
  if (!wl.length) h += `<p class="muted" style="margin:4px 0 8px">${isScott() ? 'The list is empty.' : 'List what the owner wants from the yard.'} Add each wish below, then check it off when it is on the plan.</p>`;
  h += `<div class="want" style="margin-top:6px"><input class="wedit" id="wantNew" placeholder="${isScott() ? 'Add a wish, e.g. Apple trees' : 'e.g. Shade for the patio'}" maxlength="120" aria-label="New wish"><button type="button" class="btn" id="wantAdd">Add</button></div>`;
  const changed = isScott() && (wl.length !== WANTS.length || wl.some((w, i) => w.t !== WANTS[i]));
  if (changed) h += `<button type="button" class="btn" id="wantReset" style="margin-top:8px">Reset to the Scott family's list</button>`;
  $('clientList').innerHTML = h;
  const add = () => { const v = $('wantNew').value.trim(); if (!v) return; wl.push({ t: v.slice(0, 120), d: false }); renderClient(); commit('Add client want'); $('wantNew').focus(); };
  $('wantAdd').addEventListener('click', add);
  $('wantNew').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  if ($('wantReset')) $('wantReset').addEventListener('click', () => {
    const done = new Set(wl.filter((w) => w.d).map((w) => w.t));
    state.wants = WANTS.map((t) => ({ t, d: done.has(t) })); renderClient(); commit('Reset client list');
  });
  const ed = $('wantEdit');
  if (ed) {
    ed.focus(); ed.select();
    ed.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveWant(); if (e.key === 'Escape') { e.stopPropagation(); editingWant = -1; renderClient(); } });
    ed.addEventListener('blur', () => setTimeout(() => { if (editingWant !== -1) saveWant(); }, 0));
  }
}
function saveWant() {
  const ed = $('wantEdit'), i = editingWant;
  editingWant = -1;
  if (!ed || i < 0) { renderClient(); return; }
  const v = ed.value.trim();
  if (v && v !== state.wants[i].t) { state.wants[i].t = v.slice(0, 120); renderClient(); commit('Edit client want'); } else renderClient();
}
$('clientList').addEventListener('change', (e) => {
  const i = e.target.dataset.want;
  if (i === undefined) return;
  wantList()[+i].d = e.target.checked;
  commit(e.target.checked ? 'Check off client want' : 'Uncheck client want');
});
$('clientList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-wact]');
  if (!b) return;
  e.preventDefault();
  const i = +b.dataset.wi, wl = wantList();
  if (b.dataset.wact === 'save') { saveWant(); return; }
  if (b.dataset.wact === 'edit') { editingWant = i; renderClient(); return; }
  if (b.dataset.wact === 'del') { wl.splice(i, 1); renderClient(); commit('Remove client want'); return; }
  const j = b.dataset.wact === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= wl.length) return;
  [wl[i], wl[j]] = [wl[j], wl[i]]; renderClient(); commit('Reorder client wants');
  const again = $('clientList').querySelector(`[data-wact="${b.dataset.wact}"][data-wi="${j}"]`); if (again && !again.disabled) again.focus();
});
$('clientList').addEventListener('dblclick', (e) => {
  const t = e.target.closest('[data-wedit]');
  if (!t) return;
  e.preventDefault(); editingWant = +t.dataset.wedit; renderClient();
});


/* ------------------------------------------------------------------ dialog, toast */
const dlg = $('dlg');
function openDialog(html) {
  closeMenus();
  $('dlgBody').innerHTML = html;
  if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } }
  const first = $('dlgBody').querySelector('[autofocus]') || $('dlgBody').querySelector('button');
  if (first) first.focus();
}
function closeDialog() { try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); } }
dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(); });
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
function showKeys() {
  const rows = [['Select / move', 'V'], ['Hand (pan)', 'H or hold Space'], ['Text label', 'T'], ['Measure', 'M'], ['Trees and shrubs', '1 2 3 4'], ['Beds', '5 6 7, B to draw'],
    ['Lawn', 'L, N to draw'], ['Patio / paving', 'P, O to draw'], ['Deck · walk · fence', 'K · W · F'], ['Veg garden · wood · bird bath', 'G · S · Y'], ['Bubble · arrow', 'U · A'],
    ['Undo / redo', 'Ctrl+Z / Ctrl+Y'], ['Cut / copy / paste', 'Ctrl+X / C / V'], ['Duplicate', 'Ctrl+D or Alt-drag'], ['Select all', 'Ctrl+A'], ['Lock', 'Ctrl+L'],
    ['Front / back', 'Ctrl+] / Ctrl+['], ['Nudge', 'Arrows (Shift 5 ft, Alt 0.1 ft)'], ['Constrain drag', 'Shift while dragging'], ['Finish a line or shape', 'Enter or double-click'],
    ['Zoom', 'Wheel, Ctrl + / −'], ['Fit / print size', 'Ctrl+0 / Ctrl+1'], ['Save / open / export', 'Ctrl+S / O / E']];
  openDialog(`<h3>Keyboard shortcuts</h3><div class="keys">${rows.map(([a, b]) => `<div><span>${a}</span><kbd>${b}</kbd></div>`).join('')}</div><div class="btnrow"><button type="button" class="btn" data-close autofocus>Close</button></div>`);
}
function showBrief() {
  if (!isScott()) {
    const st = state.site;
    openDialog(`<h3>${esc(projName())}</h3><table><tr><td><b>Client</b></td><td>${esc(st.client || '—')}</td></tr><tr><td><b>Lot</b></td><td>${n(st.w)} × ${n(st.h)} ft (${Math.round(st.w * st.h).toLocaleString()} sq ft)</td></tr>
      <tr><td><b>Street side</b></td><td>${STREETS[st.street]}</td></tr><tr><td><b>North points</b></td><td>${NORTHS[st.north]}</td></tr></table>
      <div class="btnrow"><button type="button" class="btn" id="bBriefEdit">Change settings…</button><button type="button" class="btn" data-close autofocus>Close</button></div>`);
    $('bBriefEdit').addEventListener('click', showSiteSettings);
    return;
  }
  openDialog(`<h3>The Scott family</h3>
    <table><tr><td><b>Husband, 40</b></td><td>Gardens; likes fruit trees, especially apple; plays with the kids in the yard; cookouts.</td></tr>
    <tr><td><b>Wife, 40</b></td><td>Vegetable and flower gardening; loves to cook and host small dinners.</td></tr>
    <tr><td><b>Twin boys 15, daughter 13</b></td><td>Sports and an open lawn; love nature, especially birdwatching.</td></tr></table>
    <p style="margin-top:12px"><b>Site:</b> two-story traditional house. Busy street on the west side. Cold winds from the north, hot winds from the south. Overhead electric along the back (east) line at 15 ft with a 12 ft service drop. Underground line from the southwest corner of the house to the street, 2 ft deep. Russellville, USDA zone 7b.</p>
    <div class="btnrow"><button type="button" class="btn" data-close autofocus>Close</button></div>`);
}
function showAbout() {
  openDialog(`<h3>Scott Residence Landscape Designer</h3><p>For AGPS 1024 Principles of Plant Science, Arkansas Tech University. Design the Scott family's yard on the real base plan at true scale, then export an 11×17 design plan to turn in.</p>
    <p class="muted">${PLANTS.length} plants in the library, chosen for central Arkansas. Your work saves in this browser automatically; use Save to keep a file.</p><div class="btnrow"><button type="button" class="btn" data-close autofocus>Close</button></div>`);
}

/* ------------------------------------------------------------------ files */
function slug() { const s = (state.meta.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); return 'scott-design' + (s ? '-' + s : ''); }
let dlCap;
async function downloadsCap() {
  if (dlCap !== undefined) return dlCap;
  dlCap = null;
  try { if (window.claude && window.claude.use) dlCap = (await window.claude.use('downloads')) || null; } catch (e) { dlCap = null; }
  return dlCap;
}
async function saveBlob(filename, blob) {
  const dl = await downloadsCap();
  if (dl) {
    try { await dl.save({ filename, data: blob }); return 'saved'; } catch (e) { return e && e.code === 'declined' ? 'declined' : 'fallback'; }
  }
  if (window.claude) return 'fallback';
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  try {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return framed ? 'framed' : 'saved';
  } catch (e) { return 'fallback'; }
}
const designJSON = () => JSON.stringify(state, null, 1);
function jsonFallback(note) {
  openDialog(`<h3>Copy your design file</h3><p>${note || "Your browser didn't let this page save a file."} Copy the text below into a new file named <b>${esc(slug())}.json</b>. To reopen it, use Open and paste it back in.</p>
    <textarea id="jsonOut" readonly aria-label="Design file text">${esc(designJSON())}</textarea>
    <div class="btnrow"><button type="button" class="btn gold" id="bCopy">Copy</button><button type="button" class="btn" data-close>Close</button></div>`);
  $('bCopy').addEventListener('click', () => copyText($('jsonOut')));
}
async function copyText(ta) {
  try { await navigator.clipboard.writeText(ta.value); toast('Copied'); return; } catch (e) { /* fall through */ }
  ta.focus(); ta.select();
  try { document.execCommand('copy'); toast('Copied'); } catch (e) { toast('Select the text and copy it'); }
}
async function saveDesign() {
  flush();
  const r = await saveBlob(slug() + '.json', new Blob([designJSON()], { type: 'application/json' }));
  if (r === 'saved') toast('Design file saved'); else if (r === 'declined') toast('Save canceled'); else jsonFallback(r === 'framed' ? FRAMED_NOTE : undefined);
}
const FRAMED_NOTE = "If the download didn't start, the page you opened this from (like Blackboard) may be blocking it. Download the HTML file and open it from your computer or USB drive, or use this instead.";
$('bSave').addEventListener('click', saveDesign);
function loadState(st, msg) { switchTo(st, msg); }
function openFromText(text) {
  let raw;
  try { raw = JSON.parse(text); } catch (e) { throw new Error("This doesn't look like a design file. Design files end in .json and come from Save."); }
  return cleanState(raw);
}
function showOpen(err) {
  openDialog(`<h3>Open a design file</h3>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}
    <p>Choose a <b>.json</b> design file you saved earlier. It replaces the plan on screen (you can undo).</p>
    <div class="btnrow" style="margin-bottom:12px"><button type="button" class="btn gold" id="bPick" autofocus>Choose file…</button></div>
    <p class="muted">Or paste the design file text here:</p><textarea id="jsonIn" aria-label="Paste design file text"></textarea>
    <div class="btnrow"><button type="button" class="btn" id="bPaste">Open pasted text</button><button type="button" class="btn" data-close>Cancel</button></div>`);
  $('bPick').addEventListener('click', () => { $('fileIn').value = ''; $('fileIn').click(); });
  $('bPaste').addEventListener('click', () => {
    const v = $('jsonIn').value.trim();
    if (!v) { showOpen('Paste the design file text first.'); return; }
    try { const st = openFromText(v); closeDialog(); loadState(st, 'Design opened'); } catch (e) { showOpen(e.message); }
  });
}
$('bOpen').addEventListener('click', () => showOpen());
$('fileIn').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 5e6) throw new Error('That file is too big to be a design file.');
    const st = openFromText(await f.text());
    closeDialog(); loadState(st, `Opened ${f.name}`);
  } catch (err) { showOpen(err.message); }
});
$('bClear').addEventListener('click', () => {
  openDialog(`<h3>Start over?</h3><p>This removes everything you placed and clears the client checklist. Your name, section and date stay. You can undo it.</p>
    <div class="btnrow"><button type="button" class="btn" data-close autofocus>Keep my design</button><button type="button" class="btn danger" id="bClearYes">Clear the plan</button></div>`);
  $('bClearYes').addEventListener('click', () => {
    closeDialog();
    state.items = []; wantList().forEach((w) => { w.d = false; }); sel = []; draft = null;
    renderAll(); commit('Start over'); toast('Plan cleared. Undo brings it back.');
  });
});
$('bUndo').addEventListener('click', undo);
$('bRedo').addEventListener('click', redo);

/* ------------------------------------------------------------------ export sheet (11x17 at 96 px/in) */
/* where the plan goes on the 11x17 sheet: the lab plan is fixed at 1 in = 10 ft; a custom lot gets the
 * largest standard engineering scale that fits the plan area */
function sheetFrame() {
  if (isScott()) return { s: PX, ox: X0, oy: Y0, scale: 10 };
  const F = fitRect(), AW = 960, AH = 1210;
  const scale = [10, 20, 30, 40, 50, 60, 80, 100, 200, 400].find((sc) => F.w * 96 / sc <= AW && F.h * 96 / sc <= AH) || 400;
  const k = 96 / scale;
  return { s: k, ox: 48 + (AW - F.w * k) / 2 - F.x * k, oy: 84 + (AH - F.h * k) / 2 - F.y * k, scale };
}
function sheetSVG() {
  const fr = sheetFrame(), o = drawOpts({ u: 0.125 * PX / fr.s });
  const SW = 1056, SH = 1632;
  const fontCss = ($('fontFaces') || {}).textContent || '';
  let s = `<svg xmlns="${NS}" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}"><style>${fontCss}</style>${DEFS}<rect width="${SW}" height="${SH}" fill="#fff"/>`;
  s += `<defs><clipPath id="planClip"><rect x="40" y="78" width="976" height="1222"/></clipPath><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>`;
  const client = clientName();
  s += `<text x="48" y="66" font-family="${FONT}" font-weight="700" font-size="26" fill="${GREEN}"${projName().length > 34 ? ' textLength="620" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(projName().toUpperCase())} — DESIGN PLAN${client ? `<tspan dx="14" font-weight="500" font-size="14" fill="#4A4A4A" letter-spacing="0.08em">· CLIENT: ${esc(client.toUpperCase())}</tspan>` : ''}</text>`;
  s += `<g clip-path="url(#planClip)"><g transform="translate(${n(fr.ox)} ${n(fr.oy)}) scale(${n(fr.s * 1000) / 1000})">`;
  if (view.img) s += imageMarkup();
  if (view.base) s += `<g${view.style === 'bw' ? ' filter="url(#gray)"' : ''}>${baseMarkup(o)}</g>`;
  if (view.grid) s += gridMarkup();
  if (view.design) s += sortedItems('design').map((it) => drawItem(it, o)).join('');
  s += siteMarkup();
  if (view.diagram) s += sortedItems('diagram').map((it) => drawItem(it, o)).join('');
  s += '</g></g>';
  s += sheetSchedule(1312) + titleBlock(1476, fr.scale);
  return s + '</svg>';
}
function sheetSchedule(KY) {
  const { plants, mats } = view.design ? takeoff() : { plants: [], mats: [] };
  const tx = (x, y, str, size, extra) => `<text x="${n(x)}" y="${n(y)}" font-family="${FONT}" font-size="${n(size)}" ${extra || ''}>${esc(str)}</text>`;
  const body = (x, y, str, size, extra) => `<text x="${n(x)}" y="${n(y)}" font-family="'Source Sans 3', Arial, sans-serif" font-size="${n(size)}" ${extra || ''}>${esc(str)}</text>`;
  let s = tx(48, KY, 'PLANT SCHEDULE', 14, `font-weight="600" letter-spacing="0.1em" fill="${INK}"`) + `<line x1="48" y1="${KY + 10}" x2="652" y2="${KY + 10}" stroke="${INK}"/>`;
  s += tx(688, KY, 'MATERIALS & SYMBOLS', 14, `font-weight="600" letter-spacing="0.1em" fill="${INK}"`) + `<line x1="688" y1="${KY + 10}" x2="1008" y2="${KY + 10}" stroke="${INK}"/>`;
  const avail = 1462 - (KY + 34);
  if (!plants.length) s += body(48, KY + 32, 'No plants placed yet.', 11, 'fill="#4A4A4A"');
  else {
    const twoCol = plants.length > 9;
    const perCol = twoCol ? Math.ceil(plants.length / 2) : plants.length;
    const rh = Math.min(15, avail / perCol), fs = Math.min(10.5, rh * 0.72);
    const head = (x, y, str) => tx(x, y, str, 8.5, 'fill="#4A4A4A" letter-spacing="0.08em"');
    (twoCol ? [[48, 0], [356, 1]] : [[48, 0]]).forEach(([cx, ci]) => {
      const y0 = KY + 26;
      s += head(cx, y0, 'KEY') + head(cx + 34, y0, 'QTY') + head(cx + (twoCol ? 96 : 84), y0, twoCol ? 'PLANT' : 'COMMON NAME');
      if (!twoCol) s += head(cx + 250, y0, 'BOTANICAL NAME') + head(cx + 470, y0, 'SIZE (W × H)') + head(cx + 555, y0, 'LIGHT');
      plants.slice(ci * perCol, (ci + 1) * perCol).forEach((r, i) => {
        const y = KY + 34 + i * rh + rh * 0.7, sp = r.sp;
        s += `<rect x="${cx}" y="${n(y - fs * 0.95)}" width="26" height="${n(fs * 1.3)}" rx="2" fill="#fff" stroke="${INK}" stroke-width="0.8"/>` + tx(cx + 13, y, PLANT_CODE[sp.id], fs * 0.92, `font-weight="600" text-anchor="middle" fill="${INK}"`);
        s += body(cx + 34, y, fmtQty(r), fs, `font-weight="700" fill="${INK}"`);
        if (twoCol) {
          const fit = (str, w, f) => (str.length * f * 0.5 > w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : '');
          s += body(cx + 96, y, sp.cn, fs, `fill="${INK}"${fit(sp.cn, 98, fs)}`) + body(cx + 200, y, sp.bn, fs * 0.88, `font-style="italic" fill="#4A4A4A"${fit(sp.bn, 94, fs * 0.88)}`);
        } else {
          s += body(cx + 84, y, sp.cn, fs, `fill="${INK}"`) + body(cx + 250, y, sp.bn, fs, `font-style="italic" fill="${INK}"${sp.bn.length > 34 ? ' textLength="210" lengthAdjust="spacingAndGlyphs"' : ''}`);
          s += body(cx + 470, y, sp.t === 'turf' ? 'Lawn' : `${sp.w}′ × ${sp.h}′`, fs, `fill="${INK}"`) + body(cx + 555, y, sp.sun.split('/').map((x) => ({ F: 'Sun', P: 'Part', S: 'Shade' }[x])).join('/'), fs, `fill="${INK}"`);
        }
      });
    });
  }
  const extras = mats.map((m) => ({ type: m.type, name: m.name, q: fmtMat(m) }));
  const types = new Set(state.items.filter((i) => !i.hidden && (layerOf(i) === 'design' ? view.design : view.diagram)).map((i) => i.type));
  if (types.has('bubble')) extras.push({ type: 'bubble', name: 'Use area (functional diagram)', q: '' });
  if (types.has('arrow')) extras.push({ type: 'arrow', name: 'Circulation', q: '' });
  if (!extras.length) s += body(688, KY + 32, 'No hardscape placed yet.', 11, 'fill="#4A4A4A"');
  const mrh = Math.min(22, (avail + 8) / Math.max(1, extras.length));
  extras.forEach((m, i) => {
    const y = KY + 20 + i * mrh, fs = Math.min(10.5, mrh * 0.55);
    s += iconAt(m.type, 700, y + mrh / 2, 24, Math.min(18, mrh - 3), view.style);
    s += body(720, y + mrh / 2 + fs * 0.35, m.name, fs, `fill="${INK}"`) + body(1008, y + mrh / 2 + fs * 0.35, m.q, fs, `font-weight="700" text-anchor="end" fill="${INK}"`);
  });
  return s;
}
function titleBlock(TY, scale) {
  scale = scale || 10;
  const TH = 108;
  const tx = (x, y, str, size, extra) => `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" ${extra || ''}>${esc(str)}</text>`;
  let s = `<rect x="48" y="${TY}" width="960" height="${TH}" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="48" y="${TY}" width="320" height="${TH}" fill="${GREEN}"/>`;
  const title = projName().toUpperCase();
  s += tx(68, TY + 42, title, 30, `font-weight="700" fill="#fff"${title.length > 15 ? ' textLength="282" lengthAdjust="spacingAndGlyphs"' : ''}`) + tx(68, TY + 64, 'DESIGN PLAN', 14, 'font-weight="600" fill="#FFCE00" letter-spacing="0.12em"');
  const sub = isScott() ? 'AGPS 1024 · ARKANSAS TECH UNIVERSITY' : (clientName() ? 'CLIENT: ' + clientName().toUpperCase() : 'RESIDENTIAL LANDSCAPE PLAN');
  s += `<rect x="68" y="${TY + 74}" width="56" height="3" fill="#FFCE00"/>` + tx(68, TY + 96, sub, 11, `fill="#fff" letter-spacing="0.06em"${sub.length > 40 ? ' textLength="282" lengthAdjust="spacingAndGlyphs"' : ''}`);
  const FX2 = 648, half = (FX2 - 388 - 20) / 2;
  const lab = (x, y, str) => tx(x, y, str, 11, 'fill="#4A4A4A" letter-spacing="0.08em"');
  const val = (x, y, str, max) => `<text x="${x}" y="${y}" font-family="'Source Sans 3', Arial, sans-serif" font-size="17" font-weight="600" fill="${INK}"${String(str).length > max ? ` textLength="${Math.round(max * 8.2)}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(str)}</text>`;
  s += lab(388, TY + 22, 'DESIGNER') + `<line x1="388" y1="${TY + 48}" x2="${FX2}" y2="${TY + 48}" stroke="${INK}"/>`;
  s += lab(388, TY + 70, 'LAB SECTION') + `<line x1="388" y1="${TY + 96}" x2="${388 + half}" y2="${TY + 96}" stroke="${INK}"/>`;
  s += lab(408 + half, TY + 70, 'DATE') + `<line x1="${408 + half}" y1="${TY + 96}" x2="${FX2}" y2="${TY + 96}" stroke="${INK}"/>`;
  if (state.meta.name) s += val(392, TY + 43, state.meta.name, 30);
  if (state.meta.section) s += val(392, TY + 91, state.meta.section, 13);
  if (state.meta.date) s += val(412 + half, TY + 91, state.meta.date, 13);
  s += `<line x1="668" y1="${TY}" x2="668" y2="${TY + TH}" stroke="${INK}" stroke-width="1.2"/><line x1="888" y1="${TY}" x2="888" y2="${TY + TH}" stroke="${INK}" stroke-width="1.2"/>`;
  const gx = 688;
  s += lab(gx, TY + 22, 'SCALE IN FEET');
  for (const [a, b, fl] of [[0, 0.5, 1], [0.5, 1, 0], [1, 2, 1]]) s += `<rect x="${n(gx + a * 96)}" y="${TY + 46}" width="${n((b - a) * 96)}" height="8" fill="${fl ? INK : '#fff'}" stroke="${INK}"/>`;
  for (const v of [0, 0.5, 1, 2]) s += tx(n(gx + v * 96), TY + 40, String(v * scale), 11, `text-anchor="middle" fill="${INK}"`);
  s += tx(gx, TY + 78, `1 IN = ${scale} FT`, 13, `font-weight="600" fill="${INK}"`) + tx(gx, TY + 96, 'WHEN PRINTED ON 11×17', 11, 'fill="#4A4A4A"');
  const nx = 948, ny = TY + 62;
  s += tx(nx, TY + 22, 'NORTH', 11, 'text-anchor="middle" fill="#4A4A4A" letter-spacing="0.08em"');
  const rot = isScott() ? 0 : ({ left: 0, up: 90, right: 180, down: 270 }[state.site.north] || 0);
  s += `<circle cx="${nx}" cy="${ny}" r="30" fill="none" stroke="${INK}" stroke-width="1.2"/><g transform="rotate(${rot} ${nx} ${ny})"><path d="M${nx - 26},${ny} L${nx + 20},${ny - 10} L${nx + 11},${ny} Z" fill="${INK}"/><path d="M${nx - 26},${ny} L${nx + 20},${ny + 10} L${nx + 11},${ny} Z" fill="#fff" stroke="${INK}"/></g>`;
  return s;
}
const SHEET_SCALE = 3;  // 3168 x 4896 px (~288 dpi); stays under the iOS canvas pixel limit
async function sheetCanvas() {
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sheetSVG());
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('The sheet could not be drawn.')); img.src = src; });
  const c = document.createElement('canvas');
  c.width = 1056 * SHEET_SCALE; c.height = 1632 * SHEET_SCALE;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
const canvasBlob = (c, type, q) => new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('The image could not be made.'))), type, q));
let jspdfP;
function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (!jspdfP) {
    jspdfP = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';  // only if the bundled copy is missing
      sc.onload = () => (window.jspdf && window.jspdf.jsPDF ? res(window.jspdf.jsPDF) : rej(new Error('PDF maker did not load')));
      sc.onerror = () => { jspdfP = null; rej(new Error('PDF maker did not load')); };
      document.head.appendChild(sc);
    });
  }
  return jspdfP;
}
function pngFallback(dataUrl, note) {
  openDialog(`<h3>Save your sheet</h3><p>${esc(note || "This page isn't allowed to save files here.")} Right-click the sheet and choose <b>Save image as</b> (on a phone or tablet, press and hold it).</p>
    <img src="${dataUrl}" alt="Your design plan sheet"><div class="btnrow"><button type="button" class="btn" id="bJsonFb">Copy design file instead</button><button type="button" class="btn" data-close>Close</button></div>`);
  $('bJsonFb').addEventListener('click', () => jsonFallback());
}
async function doExport(fmt, btn) {
  flush();
  const old = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Working…'; }
  try {
    if (fmt === 'json') { await saveDesign(); return; }
    const c = await sheetCanvas();
    if (fmt === 'png') {
      const r = await saveBlob(slug() + '.png', await canvasBlob(c, 'image/png'));
      if (r === 'saved') toast('PNG saved'); else if (r === 'declined') toast('Save canceled'); else pngFallback(c.toDataURL('image/png'), r === 'framed' ? FRAMED_NOTE : undefined);
      return;
    }
    let jsPDF;
    try { jsPDF = await loadJsPDF(); } catch (e) { pngFallback(c.toDataURL('image/png'), "The PDF maker couldn't load (are you offline?). You can turn in the PNG instead."); return; }
    const pdf = new jsPDF({ unit: 'in', format: [11, 17], orientation: 'portrait', compress: true });
    pdf.setProperties({ title: projName() + ' — Design Plan', subject: isScott() ? 'AGPS 1024 design project' : 'Landscape design plan', author: state.meta.name || '' });
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 11, 17, undefined, 'FAST');
    const r = await saveBlob(slug() + '.pdf', pdf.output('blob'));
    if (r === 'saved') toast('PDF saved'); else if (r === 'declined') toast('Save canceled'); else pngFallback(c.toDataURL('image/png'), r === 'framed' ? FRAMED_NOTE : "This page can't save a PDF here.");
  } catch (e) {
    openDialog(`<h3>Export didn't work</h3><p class="err">${esc(e.message || 'Something went wrong.')}</p><p>Try again, or save the design file and ask your instructor.</p><div class="btnrow"><button type="button" class="btn" data-close>Close</button></div>`);
  } finally {
    if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = old; }
  }
}
$('bExport').addEventListener('click', () => {
  flush();
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sheetSVG());
  const warn = [];
  if (!state.meta.name.trim()) warn.push('your name');
  if (!state.meta.section.trim()) warn.push('your lab section');
  if (!state.meta.date.trim()) warn.push('the date');
  const open = wantList().filter((w) => !w.d).length;
  openDialog(`<h3>Export to turn in</h3>
    ${warn.length ? `<p class="warn">Add ${warn.join(', ').replace(/, ([^,]*)$/, ' and $1')} in the header so they print in the title block.</p>` : ''}
    ${open ? `<p class="warn">${open} client want${open > 1 ? 's are' : ' is'} not checked off yet. Run the design check before you turn it in.</p>` : ''}
    <div class="preview"><img src="${src}" alt="Preview of your 11 by 17 design plan sheet"></div>
    <p class="muted">Prints at 1 in = ${sheetFrame().scale} ft on 11×17 with the plant schedule and material takeoff. Uses the plan style and layers you have on now.</p>
    <div class="fmt"><button type="button" class="btn gold" data-fmt="pdf" autofocus>PDF<small>11×17 sheet to turn in</small></button>
      <button type="button" class="btn" data-fmt="png">PNG image<small>3168×4896 px</small></button>
      <button type="button" class="btn" data-fmt="json">Design file<small>.json to reopen later</small></button></div>
    <div class="btnrow"><button type="button" class="btn" data-close>Close</button></div>`);
  $('dlgBody').querySelectorAll('[data-fmt]').forEach((b) => b.addEventListener('click', () => doExport(b.dataset.fmt, b)));
});

/* ------------------------------------------------------------------ boot */
function renderAll() {
  renderClient(); renderProps(); renderPlan(); renderSide();
  $('hint').textContent = hintFor(tool);
}



/* ------------------------------------------------------------------ projects: new design, my designs, own-yard settings */
function switchTo(st, msg) {
  flush(); autosave(snapshot());
  state = st; sel = []; draft = null; measure = null; checkRun = false; baseKey = '';
  registerCustom(state.customPlants); renderLib();
  $('issues').innerHTML = ''; $('checkBadge').textContent = '';
  hist = [{ s: snapshot(), label: 'Open' }]; hIdx = 0;
  syncMeta(); setTool('select'); renderAll(); fit(); autosave(snapshot());
  if (msg) toast(msg);
}
function siteFields(st) {
  st = st || { name: 'My yard', client: '', w: 75, h: 120, street: 'bottom', north: 'up', streetName: '' };
  const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('');
  return `<div class="row2">${fld('Project name', `<input id="nfName" value="${esc(st.name)}" maxlength="60">`)}${fld('Client / owner', `<input id="nfClient" value="${esc(st.client)}" maxlength="60" placeholder="Optional">`)}</div>
    <div class="row2">${fld('Lot width (ft)', `<input id="nfW" type="number" min="10" max="2000" step="0.5" value="${n(st.w)}">`)}${fld('Lot depth (ft)', `<input id="nfH" type="number" min="10" max="2000" step="0.5" value="${n(st.h)}">`)}</div>
    <div class="row3">${fld('Street side', `<select id="nfStreet">${opt(STREETS, st.street)}</select>`)}${fld('North points', `<select id="nfNorth">${opt(NORTHS, st.north)}</select>`)}${fld('Street name', `<input id="nfStreetName" value="${esc(st.streetName || '')}" maxlength="40" placeholder="Optional">`)}</div>`;
}
function readSiteFields() {
  const w = parseFloat($('nfW').value), h = parseFloat($('nfH').value);
  if (!(w >= 10 && w <= 2000 && h >= 10 && h <= 2000)) throw new Error('Enter a lot width and depth between 10 and 2,000 ft.');
  return { kind: 'custom', name: $('nfName').value.trim().slice(0, 60) || 'My yard', client: $('nfClient').value.trim().slice(0, 60), w, h, street: $('nfStreet').value, north: $('nfNorth').value, streetName: $('nfStreetName').value.trim().slice(0, 40) };
}
function showNew(err) {
  openDialog(`<h3>New design</h3>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}
    <p class="muted">Your current design is kept in this browser. Find it again under File → My designs.</p>
    <div class="fmt" style="grid-template-columns:1fr 1fr"><button type="button" class="btn" data-new="scott">Scott Residence lab<small>The AGPS 1024 project on the real base plan</small></button>
      <button type="button" class="btn gold" data-new="custom" autofocus>My own yard<small>Your lot, your house, a photo to trace</small></button></div>
    <div id="newForm" hidden>${siteFields()}
      <label class="check" style="margin:2px 0 8px"><input type="checkbox" id="nfHouse" checked> Start with a house outline (you can reshape it, or draw more buildings with the Building tool)</label>
      <div class="row2" id="nfHouseBox">${fld('House width along the street (ft)', '<input id="nfHW" type="number" min="5" max="500" value="40">')}${fld('House depth (ft)', '<input id="nfHD" type="number" min="5" max="500" value="30">')}
        ${fld('Setback from the street (ft)', '<input id="nfHS" type="number" min="0" max="1000" value="25">')}${fld('From the side lot line (ft)', '<input id="nfHX" type="number" min="0" max="1000" value="15">')}</div>
      <label class="check" style="margin:2px 0 8px"><input type="checkbox" id="nfFence"> Fence the property line (not the street side) with a
        <select id="nfFenceStyle" style="height:24px;margin-left:4px;background:var(--well);color:var(--text);border:1px solid var(--line-2);border-radius:2px">${Object.entries(FENCE_STYLES).map(([k, z]) => `<option value="${k}">${z.replace(' fence', '').toLowerCase()}</option>`).join('')}</select> fence</label>
      ${fld('Photo or plat to trace (optional)', '<input id="nfImg" type="file" accept="image/png,image/jpeg,image/webp" style="height:auto;padding:5px">')}
      <p class="muted">A screenshot of your yard from Google Maps or a copy of your property survey works well. You set its scale after it loads.</p>
      <div class="btnrow"><button type="button" class="btn gold" id="nfCreate">Create design</button><button type="button" class="btn" data-close>Cancel</button></div></div>`);
  $('dlgBody').querySelector('[data-new="scott"]').addEventListener('click', () => {
    const st = blankState(); st.meta = Object.assign({}, state.meta); st.customPlants = clone(state.customPlants || []);
    closeDialog(); switchTo(st, 'New Scott Residence design');
  });
  $('dlgBody').querySelector('[data-new="custom"]').addEventListener('click', () => { $('newForm').hidden = false; $('nfName').focus(); $('nfName').select(); });
  $('nfHouse').addEventListener('change', (e) => { $('nfHouseBox').hidden = !e.target.checked; });
  $('nfCreate').addEventListener('click', () => {
    let site;
    try { site = readSiteFields(); } catch (e) { toast(e.message); return; }
    const st = blankState(); st.meta = Object.assign({}, state.meta); st.site = site; st.wants = []; st.customPlants = clone(state.customPlants || []);
    if ($('nfHouse').checked) {
      const hw = +$('nfHW').value || 40, hd = +$('nfHD').value || 30, sb = +$('nfHS').value || 0, sx = +$('nfHX').value || 0;
      const box = { bottom: [sx, site.h - sb - hd, sx + hw, site.h - sb], top: [sx, sb, sx + hw, sb + hd], left: [sb, sx, sb + hd, sx + hw], right: [site.w - sb - hd, sx, site.w - sb, sx + hw], none: [sx, sb, sx + hw, sb + hd] }[site.street];
      const [x1, y1, x2, y2] = box.map(r1);
      st.items.push({ id: uid(), type: 'building', pts: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], smooth: false, label: 'HOUSE' });
    }
    if ($('nfFence').checked) {
      const fs = $('nfFenceStyle').value;
      st.items.push({ id: uid(), type: 'fence', pts: fenceLotPts(site.street, site).map((p) => [r1(p[0]), r1(p[1])]), style: fs, height: FENCE_HEIGHT[fs] });
    }
    const file = $('nfImg').files && $('nfImg').files[0];
    closeDialog(); switchTo(st, `New design: ${site.name}`);
    if (file) loadImageFile(file);
  });
}
function showSiteSettings() {
  if (isScott()) return;
  openDialog(`<h3>Lot and project settings</h3>${siteFields(state.site)}<div class="btnrow"><button type="button" class="btn gold" id="nfSave" autofocus>Save settings</button><button type="button" class="btn" data-close>Cancel</button></div>`);
  $('nfSave').addEventListener('click', () => {
    let site;
    try { site = readSiteFields(); } catch (e) { toast(e.message); return; }
    if (state.site.img) site.img = state.site.img;
    state.site = site; closeDialog(); baseKey = ''; renderPlan(); fit(); commit('Change lot settings');
  });
}
function showMine() {
  const idx = readIndex(), rows = Object.entries(idx).sort((a, b) => b[1].t - a[1].t);
  const when = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  openDialog(`<h3>My designs</h3><p class="muted">Designs are kept in this browser on this computer. Use Save to keep a file you can move to another computer.</p>
    <table>${rows.map(([id, r]) => `<tr><td><b>${esc(r.name)}</b>${id === state.pid ? ' <span class="muted">(open now)</span>' : ''}<br><span class="muted">${r.kind === 'scott' ? 'Scott Residence lab' : 'Own yard'} · ${r.n} item${r.n === 1 ? '' : 's'} · ${when(r.t)}</span></td>
      <td style="text-align:right;white-space:nowrap">${id === state.pid ? '' : `<button type="button" class="btn" data-open="${esc(id)}">Open</button> <button type="button" class="btn danger" data-del="${esc(id)}">Delete</button>`}</td></tr>`).join('')}</table>
    <div class="btnrow"><button type="button" class="btn gold" id="mineNew">New design…</button><button type="button" class="btn" data-close autofocus>Close</button></div>`);
  $('mineNew').addEventListener('click', () => showNew());
  $('dlgBody').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    let st;
    try { st = cleanState(JSON.parse(localStorage.getItem(PROJ_KEY(b.dataset.open)))); st.pid = b.dataset.open; } catch (e) { toast("That design couldn't be read."); return; }
    closeDialog(); switchTo(st, `Opened ${projNameOf(st)}`);
  }));
  $('dlgBody').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Really delete?'; return; }
    try { localStorage.removeItem(PROJ_KEY(b.dataset.del)); const i2 = readIndex(); delete i2[b.dataset.del]; localStorage.setItem(INDEX_KEY, JSON.stringify(i2)); } catch (e) { /* ignore */ }
    showMine();
  }));
}
const projNameOf = (st) => (st.site ? st.site.name : 'Scott Residence');

/* ------------------------------------------------------------------ trace image */
function pickImage() {
  if (isScott()) return;
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp';
  inp.addEventListener('change', () => { if (inp.files && inp.files[0]) loadImageFile(inp.files[0]); });
  inp.click();
}
function loadImageFile(file) {
  if (!/^image\//.test(file.type)) { toast('Choose a PNG or JPG image'); return; }
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const max = 1800, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const L = lot();
    state.site.img = { src: c.toDataURL('image/jpeg', 0.82), x: 0, y: 0, w: L.w, h: r1(L.w * c.height / c.width), op: 0.6 };
    view.img = true; $('tImg').checked = true;
    baseKey = ''; renderPlan(); renderProps(); commit('Import trace image');
    openDialog(`<h3>Set the image scale</h3><p>The image is placed across your lot, but not at true scale yet.</p>
      <ol><li>Click <b>Set scale</b>.</li><li>Drag along something in the image whose length you know: a lot line from your survey, or a house wall you measured.</li><li>Type its real length in feet.</li></ol>
      <p class="muted">Then drag the X and Y boxes under Properties to line the image up with your lot. Turn the image off under Layers before you export, if you like.</p>
      <div class="btnrow"><button type="button" class="btn gold" id="goScale" autofocus>Set scale</button><button type="button" class="btn" data-close>Later</button></div>`);
    $('goScale').addEventListener('click', () => { closeDialog(); select(null); setTool('imgscale'); });
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast("That image couldn't be opened"); };
  img.src = url;
}
function askScale() {
  const { a, b } = measure, dd = dist(a, b);
  if (dd < 0.5) { toast('Drag a longer line'); return; }
  openDialog(`<h3>How long is that line?</h3><p>The line you drew is ${dd.toFixed(1)} ft on the plan right now.</p>
    ${fld('Real length (ft)', `<input id="scaleLen" type="number" min="0.5" step="0.1" value="${n(dd)}" autofocus>`)}
    <div class="btnrow"><button type="button" class="btn gold" id="scaleOk">Apply</button><button type="button" class="btn" data-close>Cancel</button></div>`);
  $('scaleLen').select();
  const apply = () => {
    const L = parseFloat($('scaleLen').value), im = state.site.img;
    if (!(L > 0) || !im) return;
    const f = L / dd;
    im.x = r1(a[0] + (im.x - a[0]) * f); im.y = r1(a[1] + (im.y - a[1]) * f); im.w = r1(im.w * f); im.h = r1(im.h * f);
    closeDialog(); measure = null; setTool('select'); baseKey = ''; renderPlan(); renderProps(); commit('Set image scale');
    toast('Image scaled. Line it up with the X and Y boxes under Properties.');
  };
  $('scaleOk').addEventListener('click', apply);
  $('scaleLen').addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
}
function imageCard() {
  const im = !isScott() && state.site.img;
  if (!im) return isScott() ? '' : `<div class="spcard" style="margin-top:12px;display:block"><b>Trace image</b><p class="muted" style="margin:4px 0 8px">Trace your own yard from a Google Maps screenshot or a property survey.</p><button type="button" class="btn" data-img-act="add">Import image…</button></div>`;
  return `<div class="spcard" style="margin-top:12px;display:block"><b>Trace image</b>
    <div class="field" style="margin-top:6px"><label>Opacity</label><input type="range" data-img="op" min="0.1" max="1" step="0.05" value="${im.op}" aria-label="Image opacity" style="height:auto;padding:0"></div>
    <div class="row3">${fld('X ft', `<input type="number" data-img="x" step="0.5" value="${n(im.x)}">`)}${fld('Y ft', `<input type="number" data-img="y" step="0.5" value="${n(im.y)}">`)}${fld('Width ft', `<input type="number" data-img="w" min="1" step="0.5" value="${n(im.w)}">`)}</div>
    <div class="btnrow"><button type="button" class="btn" data-img-act="scale">Set scale…</button><button type="button" class="btn" data-img-act="replace">Replace…</button><button type="button" class="btn danger" data-img-act="remove">Remove</button></div></div>`;
}
$('props').addEventListener('input', (e) => {
  const f = e.target.dataset.img, im = !isScott() && state.site.img;
  if (!f || !im) return;
  const v = parseFloat(e.target.value);
  if (!Number.isFinite(v)) return;
  if (f === 'op') im.op = clamp(v, 0.1, 1);
  if (f === 'x') im.x = v;
  if (f === 'y') im.y = v;
  if (f === 'w' && v >= 1) { im.h = r1(im.h * v / im.w); im.w = v; }
  baseKey = ''; renderBase(); commitSoon('Adjust trace image');
});
$('props').addEventListener('click', (e) => {
  const b = e.target.closest('[data-img-act]');
  if (!b) return;
  const act = b.dataset.imgAct;
  if (act === 'add' || act === 'replace') pickImage();
  if (act === 'scale') setTool('imgscale');
  if (act === 'remove') { delete state.site.img; baseKey = ''; renderPlan(); renderProps(); commit('Remove trace image'); }
});
$('bNew').addEventListener('click', () => showNew());

(function boot() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null');
    if (v) for (const k of ['site', 'grid', 'diagram', 'design', 'tags', 'base', 'snap', 'lib', 'floor', 'img', 'util']) if (typeof v[k] === 'boolean') view[k] = v[k];
    if (v && ['render', 'color', 'bw'].includes(v.style)) view.style = v.style;
  } catch (e) { /* ignore */ }
  if (innerWidth <= 1000) view.lib = false;
  for (const [id, key] of Object.entries(TOGGLES)) $(id).checked = view[key];
  $('optSnap').checked = view.snap;
  $('styleSeg').querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.style === view.style));
  let restored = false;
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) { state = cleanState(JSON.parse(s)); restored = state.items.length > 0 || !!state.site; }
  } catch (e) { state = blankState(); }
  if (!state.meta.date) { const d = new Date(); state.meta.date = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; }
  renderMenubar(); renderRail(); renderLibControls(); renderLib();
  syncMeta();
  setTool('select');
  registerCustom(state.customPlants); renderLib();
  hist = [{ s: snapshot(), label: 'Open' }]; hIdx = 0;
  renderAll();
  requestAnimationFrame(fit);
  if (restored) toast(`Your last design was restored: ${projName()}`);
  autosave(snapshot());
})();

/* a fence along every lot line except the street side; students can reshape it afterward */
function fenceLotPts(street, L) {
  const W = L.w, H = L.h;
  return { bottom: [[0, H], [0, 0], [W, 0], [W, H]], top: [[0, 0], [0, H], [W, H], [W, 0]], left: [[0, 0], [W, 0], [W, H], [0, H]],
    right: [[W, 0], [0, 0], [0, H], [W, H]] }[street] || [[0, 0], [W, 0], [W, H], [0, H], [0, 0]];
}
function fenceLot(style) {
  const scott = isScott();
  const pts = scott ? [[0, 107], [0, 0], [82, 0], [82, 107]] : fenceLotPts(state.site.street, lot());
  const it = Object.assign({ id: uid(), type: 'fence', pts: pts.map((p) => [r1(p[0]), r1(p[1])]) }, lastFence, style ? { style, height: FENCE_HEIGHT[style] } : {});
  if (!view.design) { view.design = true; $('tDesign').checked = true; }
  state.items.push(it); sel = [it.id];
  setTool('select'); renderPlan(); renderProps(); showTab('pProps'); commit('Fence the property line');
  toast('Fence added along the property line. Pick its style under Properties.');
}

/* ------------------------------------------------------------------ mixed beds and freeform conversion */
function mixOf(it) { return bedMix(it).map((m) => ({ sp: m.sp.id, w: Math.round(m.w * 100) })); }
/* keep shares adding up to 100%: the share at index keep stays, the others scale to fill the rest */
function balance(mix, keep) {
  if (mix.length < 2) { mix.forEach((m) => { m.w = 100; }); return mix; }
  const fixed = keep === undefined ? 0 : clamp(Math.round(mix[keep].w), 1, 100 - (mix.length - 1));
  const others = mix.map((m, i) => i).filter((i) => i !== keep);
  const rest = 100 - fixed, sum = others.reduce((a, i) => a + Math.max(1, mix[i].w), 0) || 1;
  let left = rest;
  others.forEach((i, k) => { const v = k === others.length - 1 ? left : Math.max(1, Math.round(Math.max(1, mix[i].w) * rest / sum)); mix[i].w = Math.max(1, v); left -= mix[i].w; });
  if (keep !== undefined) mix[keep].w = fixed;
  return mix;
}
function setMix(it, mix) {
  mix = mix.filter((m) => PLANT_BY_ID[m.sp]);
  if (mix.length > 1) { it.mix = mix; it.sp = mix[0].sp; }
  else { delete it.mix; if (mix.length) it.sp = mix[0].sp; else if (it.type === 'bedShape') delete it.sp; }
}
function mixAdd() {
  const it = single();
  if (!it || it.locked) return;
  const mix = mixOf(it), have = new Set(mix.map((m) => m.sp));
  const pick = ['ecpu', 'ruhi', 'hesd', 'limu', 'caro', 'peat', 'cove', 'phpa'].find((id) => !have.has(id)) || PLANTS.find((p) => ['perennial', 'annual', 'groundcover'].includes(p.t) && !have.has(p.id)).id;
  mix.push({ sp: pick, w: mix.length ? Math.round(100 / (mix.length + 1)) : 100 });
  balance(mix, mix.length - 1); setMix(it, mix); renderItems([it.id]); renderProps(); commit('Add plant to bed');
  const s2 = $('props').querySelector(`[data-mix="${mix.length - 1}"]`); if (s2) s2.focus();
}
const FREEFORM = { perennial: 'bedShape', annual: 'bedShape', groundcover: 'bedShape', lawn: 'lawnShape', patio: 'paveShape' };
function makeFreeform() {
  const it = single();
  if (!it || it.locked || !FREEFORM[it.type]) return;
  const out = isBedType(it.type) ? bedOutlinePts(it) : (it.type === 'lawn'
    ? (() => { const rx = it.w / 2, ry = it.h / 2, r = Math.min(3, it.w / 4, it.h / 4); return { pts: [[-rx + r, -ry], [rx - r, -ry], [rx, -ry + r], [rx, ry - r], [rx - r, ry], [-rx + r, ry], [-rx, ry - r], [-rx, -ry + r]], smooth: false }; })()
    : { pts: [[-it.w / 2, -it.h / 2], [it.w / 2, -it.h / 2], [it.w / 2, it.h / 2], [-it.w / 2, it.h / 2]], smooth: false });
  const nu = { id: it.id, type: FREEFORM[it.type], pts: out.pts.map((p) => toWorldPt(it, p).map(r1)), smooth: out.smooth };
  for (const k of ['sp', 'mix', 'label', 'finish', 'locked']) if (it[k] !== undefined) nu[k] = clone(it[k]);
  if (nu.type === 'paveShape' && !nu.finish) nu.finish = 'stone';
  state.items[state.items.indexOf(it)] = nu;
  renderPlan(); renderProps(); commit('Make freeform');
  toast('Now drag the white corner dots to reshape it. Drag a blue dot to add a corner.');
}

/* ------------------------------------------------------------------ your own plants (saved with the design) */
const PLANT_FORMS = { dtree: 'maple', etree: 'column', bshrub: 'shrub', dshrub: 'shrub' };
function cleanCustomPlants(list) {
  if (!Array.isArray(list)) return [];
  const hex = (v, d) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d);
  const str = (v, n2) => (typeof v === 'string' ? v.trim().slice(0, n2) : '');
  return list.slice(0, 60).filter((c) => c && typeof c === 'object' && typeof c.id === 'string' && /^u[\w-]{1,40}$/.test(c.id) && str(c.cn, 60) && CATS.some((k) => k[0] === c.t && c.t !== 'turf')).map((c) => {
    const sun = typeof c.sun === 'string' ? c.sun.split('/').filter((x) => SUN_NAMES[x]).join('/') : '';
    const num = (v, a, b, d) => { const x = parseFloat(v); return Number.isFinite(x) ? clamp(x, a, b) : d; };
    const out = { id: c.id, t: c.t, cn: str(c.cn, 60), bn: str(c.bn, 80), w: num(c.w, 0.25, 120, 3), h: num(c.h, 0.1, 200, 3), sun: sun || 'F', z: str(c.z, 20), c: hex(c.c, '#5E8C3E'), note: str(c.note, 200) };
    const fl = hex(c.fl, ''); if (fl) out.fl = fl;
    if (['perennial', 'annual', 'groundcover'].includes(c.t)) out.spc = num(c.spc, 0.25, 10, 1.5);
    return out;
  });
}
function registerCustom(list) {
  for (let i = PLANTS.length - 1; i >= 0; i--) if (PLANTS[i].custom) { delete PLANT_BY_ID[PLANTS[i].id]; delete PLANT_CODE[PLANTS[i].id]; PLANTS.splice(i, 1); }
  const used = new Set(Object.values(PLANT_CODE));
  for (const c0 of list || []) {
    const c = Object.assign({}, c0, { custom: true, f: c0.f || PLANT_FORMS[c0.t] });
    PLANTS.push(c); PLANT_BY_ID[c.id] = c;
    const words = (c.bn || c.cn).replace(/[×'"]/g, '').split(/\s+/).filter(Boolean);
    let code = ((words[0] || 'X')[0] + ((words[1] || words[0] || 'X')[words[1] ? 0 : 1] || 'X')).toUpperCase(), k = 2;
    while (used.has(code)) code = ((words[0] || 'X')[0] + (words[1] || words[0] || 'X').slice(0, k++)).toUpperCase() + (k > 6 ? k : '');
    used.add(code); PLANT_CODE[c.id] = code;
  }
}
function showPlantForm(editId) {
  const cur = editId ? (state.customPlants || []).find((c) => c.id === editId) : null;
  const c = cur || { t: libCat !== 'all' && libCat !== 'turf' ? libCat : 'perennial', cn: '', bn: '', w: 2, h: 2, sun: 'F', z: '', c: '#5E8C3E', fl: '#D9558F', spc: 1.5, note: '' };
  const types = CATS.filter((k) => k[0] !== 'turf');
  openDialog(`<h3>${cur ? 'Edit your plant' : 'Add your own plant'}</h3>
    <p class="muted">Add a plant that isn't in the library. It is saved with this design, shows up in the library marked YOURS, and is listed in the plant schedule.</p>
    <div class="row2">${fld('Common name', `<input id="cpCn" value="${esc(c.cn)}" maxlength="60" placeholder="e.g. Coral bells" autofocus>`)}${fld('Botanical name', `<input id="cpBn" value="${esc(c.bn)}" maxlength="80" placeholder="e.g. Heuchera villosa">`)}</div>
    <div class="row2">${fld('Type', `<select id="cpT">${types.map(([k, l]) => `<option value="${k}" ${c.t === k ? 'selected' : ''}>${l.replace(/s$/, '').replace(/ses$/, 's')}</option>`).join('')}</select>`)}${fld('Hardiness zones', `<input id="cpZ" value="${esc(c.z)}" maxlength="20" placeholder="e.g. 4–9">`)}</div>
    <div class="row3">${fld('Mature spread (ft)', `<input id="cpW" type="number" min="0.25" max="120" step="0.25" value="${c.w}">`)}${fld('Mature height (ft)', `<input id="cpH" type="number" min="0.1" max="200" step="0.25" value="${c.h}">`)}${fld('Spacing in beds (ft)', `<input id="cpSpc" type="number" min="0.25" max="10" step="0.25" value="${c.spc || 1.5}">`)}</div>
    <div class="field"><label>Light</label><div class="sunpick">${Object.entries(SUN_NAMES).map(([k, l]) => `<label><input type="checkbox" data-cpsun="${k}" ${c.sun.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
    <div class="row3">${fld('Leaf color', `<input id="cpC" type="color" value="${c.c}">`)}${fld('Flower or berry color', `<input id="cpFl" type="color" value="${c.fl || '#D9558F'}">`)}<div class="field"><label>&nbsp;</label><label class="check"><input type="checkbox" id="cpNoFl" ${cur && !c.fl ? 'checked' : ''}> No flowers</label></div></div>
    ${fld('Note (why you chose it)', `<input id="cpNote" value="${esc(c.note)}" maxlength="200" placeholder="e.g. Shade-tolerant color under the maple">`)}
    <div class="btnrow"><button type="button" class="btn gold" id="cpSave">${cur ? 'Save changes' : 'Add plant'}</button><button type="button" class="btn" data-close>Cancel</button></div>`);
  $('cpSave').addEventListener('click', () => {
    const cn = $('cpCn').value.trim();
    if (!cn) { toast('Give the plant a common name'); $('cpCn').focus(); return; }
    const sun = [...$('dlgBody').querySelectorAll('[data-cpsun]')].filter((x) => x.checked).map((x) => x.dataset.cpsun).join('/') || 'F';
    const raw = { id: cur ? cur.id : 'u' + uid(), t: $('cpT').value, cn, bn: $('cpBn').value, w: $('cpW').value, h: $('cpH').value, sun, z: $('cpZ').value, c: $('cpC').value, fl: $('cpNoFl').checked ? '' : $('cpFl').value, spc: $('cpSpc').value, note: $('cpNote').value };
    const [plant] = cleanCustomPlants([raw]);
    if (!plant) { toast("That plant couldn't be saved"); return; }
    state.customPlants = (state.customPlants || []).filter((x) => x.id !== plant.id).concat(plant);
    registerCustom(state.customPlants);
    closeDialog();
    if (cur) { state.items.forEach((it) => { if (it.sp === plant.id && T[it.type].kind === 'circle' && T[it.type].plant) it.r = Math.max(0.5, plant.w / 2); }); }
    libSp = plant.id; libCat = 'all'; libQ = ''; $('libSearch').value = '';
    renderLib(); renderPlan(); renderProps(); commit(cur ? 'Edit your plant' : 'Add your own plant');
    const lb = $('libList').querySelector(`[data-sp="${plant.id}"]`); if (lb) lb.scrollIntoView({ block: 'nearest' });
    toast(cur ? 'Plant updated' : `${plant.cn} added to the library. Click it, then click the plan to place it.`);
  });
}
function deleteCustomPlant(id) {
  const n2 = state.items.filter((it) => it.sp === id || (it.mix || []).some((m) => m.sp === id)).length;
  if (n2) { toast(`Remove it from the plan first: it is used ${n2} time${n2 > 1 ? 's' : ''}`); return; }
  state.customPlants = (state.customPlants || []).filter((c) => c.id !== id);
  registerCustom(state.customPlants);
  if (libSp === id) libSp = SP_DEFAULT.dtree;
  renderLib(); commit('Delete your plant'); toast('Plant deleted');
}
