/* Rendering: shared helpers, item types, presentation (rendered) and drafting symbols.
 * Everything here draws in world FEET and returns SVG markup strings. */

/* ------------------------------------------------------------------ helpers */
const INK = '#1A1A1A';
const GREEN = '#1B5633';
const FONT = "Oswald, 'Arial Narrow', Arial, sans-serif";
const n = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
function rngFor(id) {
  let h = 2166136261;
  for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shade(hex, amt) {
  const v = parseInt(hex.slice(1), 16);
  let r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = dx * dx + dy * dy;
  const t = clamp(L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0, 0, 1);
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function inPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyDist(p, poly) {
  if (inPoly(p, poly)) return 0;
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(p, poly[i], poly[(i + 1) % poly.length]));
  return d;
}
function polyArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
}
function polyLen(pts, closed) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 2) L += dist(pts[pts.length - 1], pts[0]);
  return L;
}
function pointAlong(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const s = dist(pts[i - 1], pts[i]);
    if (d <= s || i === pts.length - 1) {
      const t = s ? clamp(d / s, 0, 1) : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
    d -= s;
  }
  return pts[0];
}
function ftIn(v) { const tot = Math.round(v * 12); return `${Math.floor(tot / 12)}'-${tot % 12}"`; }
const ptsD = (pts) => 'M' + pts.map((p) => `${n(p[0])},${n(p[1])}`).join('L');
/* closed outline: straight polygon or smooth Catmull-Rom curve through the points */
function shapeD(pts, smooth) {
  if (!smooth || pts.length < 3) return ptsD(pts) + 'Z';
  const N = pts.length, P = (i) => pts[(i + N) % N];
  let d = `M${n(pts[0][0])},${n(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`;
  }
  return d + 'Z';
}
/* the shape flattened to a polygon (for hit tests, areas and checks) */
function shapePoly(pts, smooth) {
  if (!smooth || pts.length < 3) return pts.map((p) => p.slice());
  const N = pts.length, P = (i) => pts[(i + N) % N], out = [];
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < 8; s++) {
      const t = s / 8, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return out;
}
const toLocal = (it, p) => {
  const a = -(it.rot || 0) * Math.PI / 180, dx = p[0] - it.x, dy = p[1] - it.y;
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
};
const toWorldPt = (it, l) => {
  const a = (it.rot || 0) * Math.PI / 180;
  return [it.x + l[0] * Math.cos(a) - l[1] * Math.sin(a), it.y + l[0] * Math.sin(a) + l[1] * Math.cos(a)];
};

/* ------------------------------------------------------------------ item types */
const ZONES = {
  public: { name: 'Public', tint: '#F1D9A6' },
  private: { name: 'Private', tint: '#C9DEF0' },
  service: { name: 'Service', tint: '#DCDCD6' },
  recreation: { name: 'Recreation', tint: '#CBE6BD' },
  garden: { name: 'Garden', tint: '#F2CBDB' },
};
const FINISHES = { flagstone: 'Flagstone', stone: 'Cut stone', pavers: 'Concrete pavers', brick: 'Brick', concrete: 'Concrete', gravel: 'Gravel' };
const FENCE_STYLES = { privacy: 'Wood privacy fence', picket: 'White picket fence', split: 'Split-rail fence', chain: 'Chain-link fence', iron: 'Metal (wrought iron) fence' };
const FENCE_HEIGHT = { privacy: 6, picket: 4, split: 4, chain: 4, iron: 4 };
const PATH_FINISHES = { concrete: 'Concrete', pavers: 'Concrete pavers', brick: 'Brick', flagstone: 'Flagstone', gravel: 'Gravel', mulch: 'Mulch' };
/* kind: circle (x,y,r) | box (x,y,w,h,rot) | line (pts, open) | shape (pts, closed) | text
 * band: drawing order inside a layer so a lawn never hides the trees on it. */
const T = {
  dtree:     { name: 'Deciduous tree', short: 'DECID. TREE', kind: 'circle', d: { r: 15 }, band: 5, tint: '#9CC386', op: 0.35, tree: true, plant: true, stay: true },
  etree:     { name: 'Evergreen tree', short: 'EVERGREEN TREE', kind: 'circle', d: { r: 10 }, band: 5, tint: '#3F7F55', op: 0.4, tree: true, plant: true, stay: true },
  bshrub:    { name: 'Broadleaf evergreen shrub', short: 'BROADLEAF EVG. SHRUB', kind: 'circle', d: { r: 3 }, band: 4, tint: '#5E9C6B', op: 0.5, plant: true, stay: true },
  dshrub:    { name: 'Deciduous shrub', short: 'DECID. SHRUB', kind: 'circle', d: { r: 3 }, band: 4, tint: '#B5D394', op: 0.6, plant: true, stay: true },
  perennial: { name: 'Herbaceous perennial bed', short: 'PERENNIALS', kind: 'box', d: { w: 10, h: 6 }, band: 2, tint: '#EDB9CF', op: 0.7, plant: true, bed: true },
  annual:    { name: 'Annual bed', short: 'ANNUALS', kind: 'box', d: { w: 8, h: 4 }, band: 2, tint: '#F6D57E', op: 0.75, plant: true, bed: true },
  groundcover: { name: 'Ground cover', short: 'GROUND COVER', kind: 'box', d: { w: 10, h: 6 }, band: 2, tint: '#A8CFA0', op: 0.7, plant: true, bed: true },
  bedShape:  { name: 'Planting bed (draw)', short: 'PLANTING BED', kind: 'shape', d: { smooth: true }, band: 1, tint: '#C9A27E', op: 0.6 },
  lawnShape: { name: 'Lawn (draw)', short: 'LAWN', kind: 'shape', d: { smooth: true, sp: 'cyda' }, band: 0, tint: '#E1F0D5', op: 1 },
  paveShape: { name: 'Paving (draw)', short: 'PAVING', kind: 'shape', d: { smooth: false, finish: 'flagstone' }, band: 1, tint: '#DCD6CA', op: 1 },
  patio:     { name: 'Patio', kind: 'box', d: { w: 16, h: 14, finish: 'stone' }, band: 1, tint: '#DCD6CA', op: 1 },
  deck:      { name: 'Deck', kind: 'box', d: { w: 12, h: 12 }, band: 2, tint: '#DDBF93', op: 1 },
  path:      { name: 'Walk / path', kind: 'line', d: { width: 4, finish: 'concrete' }, band: 3, tint: '#E6DECE', op: 1 },
  fence:     { name: 'Fence / screen', kind: 'line', d: { style: 'privacy', height: 6 }, band: 6 },
  veg:       { name: 'Vegetable garden', kind: 'box', d: { w: 12, h: 10 }, band: 2, tint: '#D3E5B5', op: 1 },
  wood:      { name: 'Wood stockpile', kind: 'box', d: { w: 8, h: 4 }, band: 2, tint: '#CDAA7D', op: 1 },
  lawn:      { name: 'Lawn / recreation area', kind: 'box', d: { w: 30, h: 20, sp: 'cyda' }, band: 0, tint: '#E1F0D5', op: 1 },
  birdbath:  { name: 'Bird bath / feeder', kind: 'circle', d: { r: 1.5 }, band: 4, tint: '#BCDDEE', op: 1 },
  bubble:    { name: 'Use-area bubble', kind: 'box', d: { w: 20, h: 14, zone: 'private' }, band: 0, layer: 'diagram' },
  arrow:     { name: 'Circulation arrow', kind: 'line', d: {}, band: 1, layer: 'diagram' },
  building:  { name: 'Building (draw)', short: 'BUILDING', kind: 'shape', d: { smooth: false }, band: 0.5, tint: '#E4E1DA', op: 1 },
  label:     { name: 'Label', kind: 'text', d: { size: 2 }, band: 7 },
};
for (const [k, t] of Object.entries(T)) { t.id = k; if (t.plant || k === 'lawn' || k === 'lawnShape') t.d.sp = t.d.sp || SP_DEFAULT[k]; }
/* species categories a type can take */
function spCats(type) {
  if (type === 'lawn' || type === 'lawnShape') return ['turf'];
  if (isBedType(type)) return ['perennial', 'annual', 'groundcover'];
  return T[type] && T[type].plant ? [type] : [];
}
const isBedType = (type) => type === 'bedShape' || type === 'perennial' || type === 'annual' || type === 'groundcover';
function spOf(it) { return PLANT_BY_ID[it.sp] || null; }
/* the plants in a bed: [{sp, w}] with weights that add up to 1; empty = mulch only */
function bedMix(it) {
  let list = Array.isArray(it.mix) && it.mix.length ? it.mix.map((m) => ({ sp: PLANT_BY_ID[m.sp], w: m.w > 0 ? m.w : 1 })).filter((m) => m.sp) : [];
  if (!list.length) { const sp = spOf(it) || (it.type !== 'bedShape' ? PLANT_BY_ID[SP_DEFAULT[it.type]] : null); if (sp) list = [{ sp, w: 1 }]; }
  const tot = list.reduce((a, m) => a + m.w, 0) || 1;
  return list.map((m) => ({ sp: m.sp, w: m.w / tot }));
}
const layerOf = (it) => (T[it.type].layer === 'diagram' ? 'diagram' : 'design');

/* ------------------------------------------------------------------ shared defs (patterns, filters) */
function makeDefs() {
  const R = rngFor('defs');
  const pat = (id, w, h, body, extra) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"${extra || ''}>${body}</pattern>`;
  const specks = (w, h, count, colors, rmin, rmax) => {
    let s = '';
    for (let i = 0; i < count; i++) s += `<circle cx="${n(R() * w)}" cy="${n(R() * h)}" r="${n(rmin + R() * (rmax - rmin))}" fill="${colors[i % colors.length]}"/>`;
    return s;
  };
  let d = '';
  // lawns: mowing stripes per turf species
  for (const p of PLANTS.filter((x) => x.t === 'turf')) {
    const a = p.c, b = shade(p.c, 0.1);
    d += pat('ld-lawn-' + p.id, 10, 10, `<rect width="5" height="10" fill="${a}"/><rect x="5" width="5" height="10" fill="${b}"/>` +
      specks(10, 10, 140, [shade(a, -0.18), shade(a, 0.2), shade(a, -0.08)], 0.04, 0.09));
  }
  d += pat('ld-mulch', 3, 3, `<rect width="3" height="3" fill="#6B4A32"/>` + specks(3, 3, 70, ['#4E3322', '#87603F', '#5C3D28', '#9A7150'], 0.05, 0.12));
  d += pat('ld-soil', 2, 2, `<rect width="2" height="2" fill="#5D4330"/>` + specks(2, 2, 30, ['#4A3424', '#715239'], 0.04, 0.09));
  d += pat('ld-gravel', 2, 2, `<rect width="2" height="2" fill="#D8D1C2"/>` + specks(2, 2, 60, ['#B9AF9C', '#EDE7DA', '#A39985', '#CFC6B4'], 0.05, 0.13));
  d += pat('ld-leafy', 1.2, 1.2, specks(1.2, 1.2, 26, ['rgba(0,0,0,.22)', 'rgba(255,255,255,.18)', 'rgba(0,0,0,.12)'], 0.06, 0.16));
  d += pat('ld-concrete', 5, 5, `<rect width="5" height="5" fill="#D9D6CE"/>` + specks(5, 5, 50, ['#CBC7BD', '#E4E1DA'], 0.04, 0.1) +
    `<path d="M0,0H5M0,0V5" stroke="#A9A498" stroke-width="0.07"/>`);
  d += pat('ld-brick', 1.333, 0.667, `<rect width="1.333" height="0.667" fill="#8A3F2B"/>` +
    `<rect x="0.02" y="0.02" width="0.627" height="0.293" fill="#A64B32"/><rect x="0.687" y="0.02" width="0.627" height="0.293" fill="#9B4530"/>` +
    `<rect x="-0.313" y="0.353" width="0.627" height="0.293" fill="#B0573B"/><rect x="0.353" y="0.353" width="0.627" height="0.293" fill="#A1492F"/><rect x="1.02" y="0.353" width="0.627" height="0.293" fill="#B0573B"/>`);
  let pv = '<rect width="2" height="2" fill="#8F877A"/>';
  ['#C9C1B2', '#BDB4A3', '#D3CCBE', '#C3BAA8'].forEach((c, i) => { pv += `<rect x="${(i % 2) + 0.04}" y="${Math.floor(i / 2) + 0.04}" width="0.92" height="0.92" rx="0.06" fill="${c}"/>`; });
  d += pat('ld-pavers', 2, 2, pv);
  // flagstone: jittered grid, edges kept straight so the tile repeats
  {
    const S = 6, G = 3, c = S / G, pts = [];
    for (let i = 0; i <= G; i++) { pts.push([]); for (let j = 0; j <= G; j++) { const edge = i === 0 || j === 0 || i === G || j === G; pts[i].push([j * c + (edge ? 0 : (R() - 0.5) * c * 0.6), i * c + (edge ? 0 : (R() - 0.5) * c * 0.6)]); } }
    const tones = ['#C7B79C', '#B9A88B', '#D2C4AA', '#AE9D82', '#C2B08F', '#D9CCB4'];
    let body = `<rect width="${S}" height="${S}" fill="#7E7466"/>`;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const q = [pts[i][j], pts[i][j + 1], pts[i + 1][j + 1], pts[i + 1][j]];
      const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4;
      const sh = q.map((p) => [cx + (p[0] - cx) * 0.93, cy + (p[1] - cy) * 0.93]);
      body += `<path d="${ptsD(sh)}Z" fill="${tones[(i * 3 + j * 5) % tones.length]}"/>`;
    }
    d += pat('ld-flagstone', S, S, body);
  }
  // cut stone (ashlar)
  {
    let body = '<rect width="8" height="6" fill="#8C8273"/>';
    const tones = ['#CFC6B4', '#BDB29C', '#D8D0BF', '#C6BBA5', '#B4A994'];
    let k = 0;
    for (let y = 0; y < 6; y += 2) {
      let x = 0;
      const cuts = [0];
      while (x < 8) { x += 1.5 + R() * 2; cuts.push(Math.min(8, x)); }
      if (8 - cuts[cuts.length - 2] < 1) cuts.splice(cuts.length - 2, 1);
      for (let i = 0; i < cuts.length - 1; i++) body += `<rect x="${n(cuts[i] + 0.05)}" y="${y + 0.05}" width="${n(cuts[i + 1] - cuts[i] - 0.1)}" height="1.9" fill="${tones[k++ % tones.length]}"/>`;
    }
    d += pat('ld-stone', 8, 6, body);
  }
  // deck boards with staggered end joints
  {
    let body = '<rect width="12" height="1.5" fill="#5E4129"/>';
    const tones = ['#B98A5A', '#A97B4D', '#C29462'];
    [[0, 5], [0, 9], [0, 3]].forEach(([, j], r) => {
      const y = r * 0.5;
      body += `<rect x="0" y="${y + 0.03}" width="${j - 0.03}" height="0.44" fill="${tones[r]}"/><rect x="${j + 0.03}" y="${y + 0.03}" width="${12 - j - 0.03}" height="0.44" fill="${tones[(r + 1) % 3]}"/>`;
    });
    body += specks(12, 1.5, 40, ['rgba(70,40,15,.25)'], 0.02, 0.05);
    d += pat('ld-deck', 12, 1.5, body);
  }
  d += pat('ld-roof', 1.5, 0.75, '<rect width="1.5" height="0.75" fill="#CDC7BD"/><path d="M0,0.72H1.5M0.4,0V0.36M1.15,0.36V0.75" stroke="#B2AB9F" stroke-width="0.05"/>');
  // drafting hatches (black ink)
  d += pat('dd-dots', 1.2, 1.2, `<circle cx="0.3" cy="0.4" r="0.06" fill="${INK}"/><circle cx="0.9" cy="1" r="0.05" fill="${INK}"/>`);
  d += pat('dd-sparse', 3, 3, `<circle cx="0.6" cy="0.8" r="0.07" fill="${INK}" fill-opacity="0.6"/><circle cx="2.2" cy="2.3" r="0.07" fill="${INK}" fill-opacity="0.6"/><circle cx="2.4" cy="0.7" r="0.06" fill="${INK}" fill-opacity="0.6"/>`);
  d += pat('dd-grid', 4, 4, `<path d="M0,0H4M0,0V4" stroke="${INK}" stroke-width="0.07"/>`);
  d += pat('dd-brick', 1.333, 0.667, `<path d="M0,0H1.333M0,0.333H1.333M0.667,0V0.333M0,0.333V0.667M1.333,0.333V0.667" stroke="${INK}" stroke-width="0.05"/>`);
  d += pat('dd-flag', 6, 6, `<path d="M0,0H6M0,0V6M2.1,0L1.8,2.2L0,2.4M1.8,2.2L4.2,2.6L4,0M4.2,2.6L6,2.2M1.8,2.2L2.3,4.3L0,4.1M2.3,4.3L4.4,4L4.2,2.6M4.4,4L6,4.2M2.3,4.3L2,6M4.4,4L4.1,6" stroke="${INK}" stroke-width="0.07" fill="none"/>`);
  d += pat('dd-stone', 8, 6, `<path d="M0,0H8M0,2H8M0,4H8M0,0V2M3,0V2M5.4,0V2M1.6,2V4M4.4,2V4M6.8,2V4M0,4V6M2.5,4V6M5.8,4V6" stroke="${INK}" stroke-width="0.07" fill="none"/>`);
  d += pat('dd-pavers', 2, 2, `<path d="M0,0H2M0,1H2M0,0V2M1,0V2" stroke="${INK}" stroke-width="0.05"/>`);
  d += pat('dd-gravel', 1.6, 1.6, `<circle cx="0.4" cy="0.4" r="0.12" fill="none" stroke="${INK}" stroke-width="0.04"/><circle cx="1.2" cy="1.1" r="0.08" fill="none" stroke="${INK}" stroke-width="0.04"/><circle cx="1.1" cy="0.3" r="0.04" fill="${INK}"/>`);
  d += pat('dd-hatch', 0.5, 1, `<path d="M0.25,0V1" stroke="${INK}" stroke-width="0.05"/>`);
  // filters and gradients
  d += '<filter id="ld-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.45"/></filter>';
  d += '<radialGradient id="ld-dome" cx="0.62" cy="0.4" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></radialGradient>';
  d += '<radialGradient id="ld-water" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#BFE3F5"/><stop offset="0.6" stop-color="#6FB3D8"/><stop offset="1" stop-color="#3C82AE"/></radialGradient>';
  return `<defs>${d}</defs>`;
}
const DEFS = makeDefs();
function finishFill(f, o) {
  if (o.render) return `url(#ld-${f === 'mulch' ? 'mulch' : f})`;
  if (!o.color) return '#fff';
  return { flagstone: '#E3DACB', stone: '#DCD6CA', pavers: '#DCD6CA', brick: '#E7C2B4', concrete: '#E4E2DC', gravel: '#ECE6D8', mulch: '#D9C2A6' }[f] || '#E6DECE';
}
const DRAFT_HATCH = { flagstone: 'dd-flag', stone: 'dd-stone', pavers: 'dd-pavers', brick: 'dd-brick', concrete: 'dd-grid', gravel: 'dd-gravel', mulch: 'dd-dots' };

/* ------------------------------------------------------------------ rendered (presentation) symbols */
function lobed(r, k, rng, jit) {
  const rs = [];
  for (let i = 0; i < k; i++) rs.push(r * (1 - jit * rng()));
  let d = '';
  for (let i = 0; i < k; i++) {
    const a0 = 2 * Math.PI * i / k, a1 = 2 * Math.PI * (i + 1) / k, am = (a0 + a1) / 2;
    const r0 = rs[i], r2 = rs[(i + 1) % k], rc = Math.max(r0, r2) * (1.1 + 0.06 * rng());
    if (!i) d += `M${n(r0 * Math.cos(a0))},${n(r0 * Math.sin(a0))}`;
    d += `Q${n(rc * Math.cos(am))},${n(rc * Math.sin(am))} ${n(r2 * Math.cos(a1))},${n(r2 * Math.sin(a1))}`;
  }
  return d + 'Z';
}
const shadowOf = (d, r, o, op) => (o.icon ? '' : `<path d="${d}" transform="translate(${n(-0.2 * r - 0.25)} ${n(0.12 * r + 0.15)})" fill="#0E1A08" fill-opacity="${op || 0.32}" filter="url(#ld-soft)"/>`);
function foliage(r, c, rng, count, size) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rng() * 2 * Math.PI, dd = Math.sqrt(rng()) * r * 0.68, cr = r * (size + rng() * size * 0.8);
    const light = Math.cos(a) * 0.5 - Math.sin(a) * 0.3 + (rng() - 0.5) > 0;
    s += `<path d="${lobed(cr, 6, rng, 0.25)}" transform="translate(${n(dd * Math.cos(a))} ${n(dd * Math.sin(a))})" fill="${shade(c, light ? 0.16 : -0.2)}" fill-opacity="0.6"/>`;
  }
  return s;
}
function blooms(r, fl, rng, count, size, spread) {
  if (!fl) return '';
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rng() * 2 * Math.PI, dd = Math.sqrt(rng()) * r * (spread || 0.8);
    s += `<circle cx="${n(dd * Math.cos(a))}" cy="${n(dd * Math.sin(a))}" r="${n(size * (0.7 + rng() * 0.6))}" fill="${fl}"/>`;
  }
  return `<g fill-opacity="0.92">${s}</g>`;
}
/* ------------------------------------------------------------------ species canopy forms
 * Each plant in plants.js names a form (f). A form draws the plan view of that kind of
 * plant so species read differently on the plan: maple vs oak vs ginkgo vs pine. */
const at = (x, y, rot, s) => `translate(${n(x)} ${n(y)})${rot ? ` rotate(${n(rot)})` : ''}${s ? ` scale(${n(s)})` : ''}`;
/* outline with sharp lobes, like a maple leaf edge */
function pointy(r, k, rng, depth) {
  let d = '';
  for (let i = 0; i < k; i++) {
    const a = 2 * Math.PI * i / k, h = Math.PI / k, rr = r * (1 - 0.07 * rng());
    const pts = [[r * (1 - depth), a - h], [rr * 0.95, a - h * 0.45], [rr, a], [rr * 0.95, a + h * 0.45]];
    pts.forEach(([q, b], j) => { d += `${i || j ? 'L' : 'M'}${n(q * Math.cos(b))},${n(q * Math.sin(b))}`; });
  }
  return d + 'Z';
}
const LEAF = {
  fan: 'M0,0L0.55,-0.85A1,1 0 0 0 -0.55,-0.85Z',
  heart: 'M0,0.35C-1,-0.25 -0.35,-1 0,-0.45C0.35,-1 1,-0.25 0,0.35Z',
  star: 'M0,-1L0.22,-0.3L0.95,-0.31L0.36,0.12L0.59,0.81L0,0.38L-0.59,0.81L-0.36,0.12L-0.95,-0.31L-0.22,-0.3Z',
  oval: 'M0,-1C0.5,-0.6 0.5,0.6 0,1C-0.5,0.6 -0.5,-0.6 0,-1Z',
  palm: 'M0,-1L0.2,-0.45L0.75,-0.6L0.45,-0.1L0.95,0.2L0.35,0.25L0.3,0.8L0,0.4L-0.3,0.8L-0.35,0.25L-0.95,0.2L-0.45,-0.1L-0.75,-0.6L-0.2,-0.45Z',
};
/* scatter leaf shapes inside radius R; facing outward like real foliage */
function leaves(shape, R, count, size, rng, c, spread, op) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rng() * 2 * Math.PI, d = Math.sqrt(rng()) * R * (spread || 0.85);
    const light = Math.cos(a) * 0.6 - Math.sin(a) * 0.3 + (rng() - 0.5) * 0.8;
    s += `<path d="${LEAF[shape]}" transform="${at(d * Math.cos(a), d * Math.sin(a), a * 180 / Math.PI + 90 + (rng() - 0.5) * 50, size * (0.75 + rng() * 0.5))}" fill="${shade(c, light > 0 ? 0.12 + light * 0.12 : -0.15 + light * 0.1)}"/>`;
  }
  return `<g fill-opacity="${op || 0.85}">${s}</g>`;
}
function limbs(r, k, rng, c, len, w) {
  let d = '';
  const a0 = rng() * 360;
  for (let i = 0; i < k; i++) {
    const a = (a0 + i * 360 / k + (rng() - 0.5) * 20) * Math.PI / 180, L = r * (len || 0.7) * (0.85 + rng() * 0.3), bend = (rng() - 0.5) * 0.5;
    d += `M0,0Q${n(L * 0.5 * Math.cos(a + bend))},${n(L * 0.5 * Math.sin(a + bend))} ${n(L * Math.cos(a))},${n(L * Math.sin(a))}`;
  }
  return `<path d="${d}" stroke="${c}" stroke-width="${n(w || Math.max(0.12, r * 0.025))}" stroke-linecap="round" fill="none"/>`;
}
const trunks = (r, k, c) => {
  let s = '';
  for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k + 0.4; s += `<circle cx="${n(k > 1 ? r * 0.12 * Math.cos(a) : 0)}" cy="${n(k > 1 ? r * 0.12 * Math.sin(a) : 0)}" r="${n(Math.max(0.18, r * 0.03))}" fill="${c || '#4A3526'}"/>`; }
  return s;
};
const outlineFill = (D, c, o, extra) => `<path d="${D}" fill="${c}" stroke="${shade(c, -0.5)}" stroke-width="${n(o.u * 0.9)}"${extra || ''}/>`;
const dome = (D) => `<path d="${D}" fill="url(#ld-dome)"/>`;
function flowers4(r, fl, rng, count, size) {   // dogwood-style four-bract flowers
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.85, rot = rng() * 90;
    s += `<g transform="${at(d * Math.cos(a), d * Math.sin(a), rot, size)}"><ellipse cy="-0.55" rx="0.32" ry="0.5"/><ellipse cy="0.55" rx="0.32" ry="0.5"/><ellipse cx="-0.55" rx="0.5" ry="0.32"/><ellipse cx="0.55" rx="0.5" ry="0.32"/></g>`;
  }
  return `<g fill="${fl}" stroke="${shade(fl, -0.25)}" stroke-width="0.06">${s}</g>`;
}
const FORMS = {
  /* maples: dense round crown, sharp lobed edge, palmate leaves */
  maple(r, sp, o, rng) {
    const c = sp.c, D = pointy(r, clamp(Math.round(10 + r * 0.6), 10, 26), rng, 0.13);
    let s = shadowOf(D, r, o) + outlineFill(D, c, o);
    s += leaves('palm', r, clamp(Math.round(18 + r * 2.2), 18, 70), Math.max(0.5, r * 0.11), rng, c, 0.85, 0.75);
    if (sp.ac) s += leaves('palm', r, Math.round(4 + r * 0.4), Math.max(0.5, r * 0.1), rng, sp.ac, 0.9, 0.8);
    s += limbs(r, 5, rng, shade(c, -0.55), 0.55, Math.max(0.1, r * 0.018)).replace('fill="none"', 'fill="none" stroke-opacity="0.35"');
    return s + dome(D) + trunks(r, 1);
  },
  /* oaks: broad, coarse irregular crown with big leaf masses and deep shadows */
  oak(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, clamp(Math.round(6 + r * 0.15), 6, 10), rng, 0.24);
    let s = shadowOf(D, r, o, 0.38) + outlineFill(D, c, o);
    for (let i = 0, k = clamp(Math.round(5 + r * 0.3), 5, 12); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.55, cr = r * (0.26 + rng() * 0.14);
      const light = Math.cos(a) * 0.6 - Math.sin(a) * 0.3 > 0;
      s += `<path d="${lobed(cr, 7, rng, 0.3)}" transform="${at(d * Math.cos(a), d * Math.sin(a))}" fill="${shade(c, light ? 0.18 : -0.28)}" fill-opacity="0.7"/>`;
    }
    if (sp.fine) s += leaves('oval', r, clamp(Math.round(40 + r * 3), 40, 120), Math.max(0.35, r * 0.035), rng, c, 0.88, 0.8);
    else s += leaves('oval', r, clamp(Math.round(10 + r), 10, 40), Math.max(0.5, r * 0.07), rng, c, 0.85, 0.55);
    return s + dome(D) + trunks(r, 1, '#3E2C1F');
  },
  /* ginkgo: open, irregular crown; fan-leaf clusters on visible limbs, gaps between */
  ginkgo(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 9, rng, 0.3);
    let s = shadowOf(D, r, o, 0.3) + `<path d="${D}" fill="${shade(c, -0.1)}" fill-opacity="0.22" stroke="${shade(c, -0.4)}" stroke-opacity="0.6" stroke-width="${n(o.u * 0.7)}"/>`;
    const k = 6, a0 = rng() * 60;
    let lim = '', cl = '';
    for (let i = 0; i < k; i++) {
      const a = (a0 + i * 60 + (rng() - 0.5) * 25) * Math.PI / 180, L = r * (0.7 + rng() * 0.25);
      lim += `M0,0L${n(L * Math.cos(a))},${n(L * Math.sin(a))}`;
      for (let j = 1; j <= 3; j++) {
        const t = j / 3.2, x = L * t * Math.cos(a), y = L * t * Math.sin(a), cr = r * (0.12 + 0.04 * j);
        let fan = '';
        fan += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(cr * 0.75)}" fill="${shade(c, -0.25)}" fill-opacity="0.55"/>`;
        for (let m = 0, cnt = 9 + j * 3; m < cnt; m++) {
          const b = rng() * 6.283, dd = Math.sqrt(rng()) * cr;
          fan += `<path d="${LEAF.fan}" transform="${at(x + dd * Math.cos(b), y + dd * Math.sin(b), b * 180 / Math.PI + 90, Math.max(0.5, r * 0.1))}" fill="${shade(c, (rng() - 0.35) * 0.4)}" stroke="${shade(c, -0.45)}" stroke-width="0.03"/>`;
        }
        cl += fan;
      }
    }
    return s + `<path d="${lim}" stroke="#5A4632" stroke-width="${n(Math.max(0.12, r * 0.022))}" stroke-linecap="round" fill="none"/><g fill-opacity="0.92">${cl}</g>` + trunks(r, 1);
  },
  /* river birch: airy, light and fine-textured; clump of 3 trunks */
  birch(r, sp, o, rng) {
    const c = sp.c, D = pointy(r, clamp(Math.round(18 + r), 18, 44), rng, 0.06);
    let s = shadowOf(D, r, o, 0.2) + outlineFill(D, c, o, ' fill-opacity="0.7"');
    s += leaves('oval', r, clamp(Math.round(40 + r * 3), 40, 130), Math.max(0.3, r * 0.04), rng, c, 0.92, 0.85);
    s += limbs(r, 7, rng, '#E9E4D8', 0.6, Math.max(0.08, r * 0.012));
    return s + dome(D) + trunks(r, 3, '#D9D2C2');
  },
  /* redbud: wide, flat crown of heart-shaped leaves; pink spring flowers */
  redbud(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 13, rng, 0.08);
    let s = shadowOf(D, r, o, 0.28) + outlineFill(D, c, o);
    s += leaves('heart', r, clamp(Math.round(22 + r * 2.4), 22, 80), Math.max(0.5, r * 0.09), rng, c, 0.88, 0.85);
    return s + dome(D) + blooms(r, sp.fl, rng, Math.round(18 + r * 2.5), Math.max(0.16, r * 0.025), 0.9) + trunks(r, 2);
  },
  /* dogwood: tiered layers with white four-bract flowers */
  dogwood(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 11, rng, 0.1);
    let s = shadowOf(D, r, o, 0.28) + outlineFill(D, c, o);
    [0.72, 0.45].forEach((f, i) => { s += `<path d="${lobed(r * f, 9, rng, 0.12)}" fill="${shade(c, 0.1 + i * 0.08)}" stroke="${shade(c, -0.35)}" stroke-width="${n(o.u * 0.6)}"/>`; });
    s += leaves('oval', r, Math.round(14 + r * 1.2), Math.max(0.45, r * 0.07), rng, c, 0.9, 0.5);
    return s + dome(D) + flowers4(r, sp.fl || '#F4F1E6', rng, Math.round(10 + r * 1.4), Math.max(0.35, r * 0.06)) + trunks(r, 1);
  },
  /* crape myrtle: multi-trunk vase with cone-shaped flower clusters */
  crape(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 10, rng, 0.14);
    let s = shadowOf(D, r, o, 0.28) + outlineFill(D, c, o);
    s += leaves('oval', r, Math.round(16 + r * 1.6), Math.max(0.4, r * 0.06), rng, c, 0.85, 0.7) + dome(D);
    let fl = '';
    for (let i = 0, k = Math.round(9 + r * 1.2); i < k; i++) {
      const a = rng() * 6.283, d = (0.3 + 0.6 * Math.sqrt(rng())) * r * 0.85;
      fl += `<ellipse transform="${at(d * Math.cos(a), d * Math.sin(a), a * 180 / Math.PI)}" rx="${n(r * 0.11)}" ry="${n(r * 0.055)}" fill="${shade(sp.fl, (rng() - 0.5) * 0.2)}"/>`;
    }
    return s + fl + limbs(r, 5, rng, '#8C6E58', 0.25, Math.max(0.1, r * 0.02)) + trunks(r, 5, '#7A5F4B');
  },
  /* Japanese maple: layered, finely cut star leaves in red */
  jmaple(r, sp, o, rng) {
    const c = sp.c, D = pointy(r, clamp(Math.round(14 + r), 14, 30), rng, 0.1);
    let s = shadowOf(D, r, o, 0.3) + outlineFill(D, c, o);
    [0.7, 0.42].forEach((f) => { s += `<path d="${pointy(r * f, 12, rng, 0.12)}" fill="${shade(c, 0.12)}" fill-opacity="0.8"/>`; });
    s += leaves('star', r, clamp(Math.round(26 + r * 3), 26, 80), Math.max(0.35, r * 0.075), rng, c, 0.9, 0.85);
    return s + dome(D) + trunks(r, 1);
  },
  /* fruit trees: open-center pruning, visible scaffold limbs, fruit */
  fruit(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 11, rng, 0.12);
    let s = shadowOf(D, r, o, 0.3) + outlineFill(D, c, o);
    s += `<circle r="${n(r * 0.32)}" fill="${shade(c, 0.35)}" fill-opacity="0.75"/>` + limbs(r, 4, rng, '#5A4430', 0.62, Math.max(0.15, r * 0.03));
    s += leaves('oval', r, Math.round(18 + r * 1.8), Math.max(0.45, r * 0.07), rng, c, 0.9, 0.75);
    let fr = '';
    for (let i = 0, k = Math.round(10 + r * 1.4); i < k; i++) {
      const a = rng() * 6.283, d = (0.38 + 0.55 * Math.sqrt(rng())) * r;
      fr += `<circle cx="${n(d * Math.cos(a))}" cy="${n(d * Math.sin(a))}" r="${n(Math.max(0.22, r * 0.045))}"/>`;
    }
    return s + dome(D) + `<g fill="${sp.fr || '#C8322B'}" stroke="${shade(sp.fr || '#C8322B', -0.4)}" stroke-width="0.05">${fr}</g>` + trunks(r, 1);
  },
  /* serviceberry: multi-stem, open, small white flowers */
  multistem(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 12, rng, 0.16);
    let s = shadowOf(D, r, o, 0.25) + outlineFill(D, c, o, ' fill-opacity="0.85"');
    s += leaves('oval', r, Math.round(20 + r * 2), Math.max(0.4, r * 0.06), rng, c, 0.9, 0.75) + limbs(r, 6, rng, '#6E5A48', 0.55, Math.max(0.08, r * 0.015));
    return s + dome(D) + blooms(r, sp.fl, rng, Math.round(16 + r * 2), Math.max(0.14, r * 0.03), 0.9) + trunks(r, 4, '#6E5A48');
  },
  /* pines: open crown of needle tufts on radiating limbs */
  pine(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 12, rng, 0.18);
    let s = shadowOf(D, r, o, 0.3) + `<path d="${D}" fill="${c}" fill-opacity="0.35"/>` + limbs(r, 7, rng, '#5A4430', 0.8, Math.max(0.12, r * 0.02));
    for (let i = 0, k = clamp(Math.round(10 + r * 0.9), 10, 40); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.78, tr = r * (0.14 + rng() * 0.08), m = 16;
      let nd = '';
      for (let j = 0; j < m; j++) { const b = 2 * Math.PI * j / m + rng() * 0.2, L = tr * (0.75 + rng() * 0.25); nd += `M0,0L${n(L * Math.cos(b))},${n(L * Math.sin(b))}`; }
      const tone = shade(c, (Math.cos(a) * 0.5 - Math.sin(a) * 0.3) * 0.3 + (rng() - 0.5) * 0.15);
      s += `<g transform="${at(d * Math.cos(a), d * Math.sin(a))}"><circle r="${n(tr * 0.55)}" fill="${shade(tone, -0.2)}"/><path d="${nd}" stroke="${tone}" stroke-width="${n(Math.max(0.05, tr * 0.06))}" stroke-linecap="round"/></g>`;
    }
    return s + trunks(r, 1, '#4E3A28');
  },
  /* columnar evergreens (cedar, arborvitae, cypress): tight, dense scale foliage */
  column(r, sp, o, rng) {
    const c = sp.c, k = clamp(Math.round(r * 5), 24, 64);
    let D = '';
    for (let i = 0; i < k * 2; i++) { const a = Math.PI * i / k, rr = (i % 2 ? 0.9 : 1) * r * (1 - 0.04 * rng()); D += `${i ? 'L' : 'M'}${n(rr * Math.cos(a))},${n(rr * Math.sin(a))}`; }
    D += 'Z';
    let s = shadowOf(D, r, o, 0.42) + outlineFill(D, c, o);
    [0.78, 0.56, 0.34].forEach((f, i) => { s += `<path d="${lobed(r * f, clamp(Math.round(r * 3 * f), 8, 30), rng, 0.15)}" fill="${shade(c, 0.07 * (i + 1))}" stroke="${shade(c, -0.4)}" stroke-width="${n(o.u * 0.5)}"/>`; });
    s += leaves('oval', r, Math.round(20 + r * 3), Math.max(0.2, r * 0.07), rng, shade(c, 0.1), 0.9, 0.55);
    return s + dome(D) + `<circle r="${n(Math.max(0.15, r * 0.06))}" fill="#2A1E14"/>`;
  },
  /* deodar cedar: soft, drooping tiers of blue-green branches */
  deodar(r, sp, o, rng) {
    const c = sp.c, k = 10, D = lobed(r, 20, rng, 0.12);
    let s = shadowOf(D, r, o, 0.3) + `<path d="${D}" fill="${shade(c, -0.15)}" fill-opacity="0.55"/>`;
    for (let i = 0; i < k; i++) {
      const a = 2 * Math.PI * i / k + rng() * 0.3, L = r * (0.85 + rng() * 0.15), bend = 0.35;
      const tip = [L * Math.cos(a + bend * 0.5), L * Math.sin(a + bend * 0.5)], mid = [L * 0.55 * Math.cos(a), L * 0.55 * Math.sin(a)];
      let tufts = '';
      for (let j = 2; j <= 8; j++) { const t = j / 8, x = mid[0] * t * 1.6, y = mid[1] * t * 1.6, tr = r * 0.12 * (1.2 - t * 0.5); tufts += `<ellipse transform="${at(x, y, a * 180 / Math.PI + 90)}" rx="${n(tr)}" ry="${n(tr * 0.45)}"/>`; }
      s += `<path d="M0,0Q${n(mid[0])},${n(mid[1])} ${n(tip[0])},${n(tip[1])}" stroke="#5E5040" stroke-width="${n(Math.max(0.1, r * 0.015))}" fill="none"/><g fill="${shade(c, (rng() - 0.3) * 0.25)}" fill-opacity="0.85">${tufts}</g>`;
    }
    return s + dome(D) + trunks(r, 1, '#4E3A28');
  },
  /* southern magnolia: big glossy leaves arranged in whorls, large white flowers */
  magnolia(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, 12, rng, 0.12);
    let s = shadowOf(D, r, o, 0.4) + outlineFill(D, c, o);
    for (let ring = 0; ring < 3; ring++) {
      const R = r * (0.82 - ring * 0.27), k = Math.round(10 - ring * 2);
      for (let i = 0; i < k; i++) {
        const a = 2 * Math.PI * (i + ring * 0.5) / k + rng() * 0.2;
        s += `<g transform="${at(R * Math.cos(a), R * Math.sin(a), a * 180 / Math.PI + 90, r * 0.2)}"><path d="${LEAF.oval}" fill="${shade(c, 0.05 + ring * 0.07)}" stroke="${shade(c, -0.4)}" stroke-width="0.04"/><path d="M0,-0.9V0.9" stroke="${shade(c, 0.45)}" stroke-width="0.05"/></g>`;
      }
    }
    s += dome(D);
    for (let i = 0, k = Math.round(3 + r * 0.4); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.75, fr = Math.max(0.5, r * 0.11);
      s += `<g transform="${at(d * Math.cos(a), d * Math.sin(a), rng() * 60)}">${[0, 60, 120, 180, 240, 300].map((q) => `<ellipse transform="rotate(${q}) translate(0 ${n(-fr * 0.5)})" rx="${n(fr * 0.3)}" ry="${n(fr * 0.5)}" fill="#FBF8EE" stroke="#D8D0BC" stroke-width="0.04"/>`).join('')}<circle r="${n(fr * 0.18)}" fill="#E6C77A"/></g>`;
    }
    return s;
  },
  /* shrubs */
  shrub(r, sp, o, rng) {
    const c = sp.c, D = lobed(r, clamp(Math.round(7 + r), 7, 14), rng, 0.14);
    return shadowOf(D, r, o, 0.3) + outlineFill(D, c, o) + foliage(r, c, rng, clamp(Math.round(4 + r * 1.2), 4, 12), 0.22) + dome(D) + blooms(r, sp.fl, rng, Math.round(4 + r * 3), Math.max(0.12, r * 0.07));
  },
  fine(r, sp, o, rng) {   // boxwood, yaupon: tight, small-leaved, clipped look
    const c = sp.c, D = lobed(r, clamp(Math.round(12 + r * 2), 12, 30), rng, 0.05);
    let s = shadowOf(D, r, o, 0.35) + outlineFill(D, c, o), dots = '';
    for (let i = 0, k = Math.round(30 + r * r * 6); i < Math.min(k, 260); i++) { const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.92; dots += `<circle cx="${n(d * Math.cos(a))}" cy="${n(d * Math.sin(a))}" r="${n(Math.max(0.05, r * 0.035))}" fill="${shade(c, Math.cos(a) * 0.15 + (rng() - 0.5) * 0.25)}"/>`; }
    return s + dots + dome(D) + blooms(r, sp.fl, rng, Math.round(3 + r * 2), Math.max(0.1, r * 0.05));
  },
  spiky(r, sp, o, rng) {  // hollies: spiny, glossy, red berries
    const c = sp.c, D = pointy(r, clamp(Math.round(10 + r * 1.5), 10, 30), rng, 0.16);
    let s = shadowOf(D, r, o, 0.35) + outlineFill(D, c, o) + leaves('star', r, Math.round(10 + r * 3), Math.max(0.25, r * 0.12), rng, c, 0.8, 0.6) + dome(D);
    if (sp.fl) for (let i = 0, k = Math.round(5 + r * 2.5); i < k; i++) { const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.8, br = Math.max(0.09, r * 0.035); s += `<circle cx="${n(d * Math.cos(a))}" cy="${n(d * Math.sin(a))}" r="${n(br)}" fill="${sp.fl}"/><circle cx="${n(d * Math.cos(a) + br * 1.6)}" cy="${n(d * Math.sin(a) + br * 0.5)}" r="${n(br)}" fill="${sp.fl}"/>`; }
    return s;
  },
  mophead(r, sp, o, rng) { // hydrangeas: big leaves, large round flower heads
    const c = sp.c, D = lobed(r, 9, rng, 0.14);
    let s = shadowOf(D, r, o, 0.3) + outlineFill(D, c, o) + leaves('oval', r, Math.round(8 + r * 2), Math.max(0.35, r * 0.18), rng, c, 0.85, 0.7) + dome(D);
    for (let i = 0, k = clamp(Math.round(2 + r * 0.9), 2, 9); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.6, hr = r * (0.18 + rng() * 0.06);
      let pet = '';
      for (let j = 0; j < 9; j++) { const b = rng() * 6.283, e = Math.sqrt(rng()) * hr * 0.7; pet += `<circle cx="${n(e * Math.cos(b))}" cy="${n(e * Math.sin(b))}" r="${n(hr * 0.3)}" fill="${shade(sp.fl, (rng() - 0.5) * 0.2)}"/>`; }
      s += `<g transform="${at(d * Math.cos(a), d * Math.sin(a))}"><circle r="${n(hr)}" fill="${shade(sp.fl, -0.12)}"/>${pet}</g>`;
    }
    return s;
  },
  rose(r, sp, o, rng) {   // roses and azaleas: compact mound covered in open blooms
    const c = sp.c, D = lobed(r, 10, rng, 0.12);
    let s = shadowOf(D, r, o, 0.3) + outlineFill(D, c, o) + leaves('oval', r, Math.round(10 + r * 3), Math.max(0.2, r * 0.1), rng, c, 0.85, 0.7) + dome(D);
    for (let i = 0, k = Math.round(5 + r * 3); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.8, br = Math.max(0.15, r * 0.09);
      s += `<g transform="${at(d * Math.cos(a), d * Math.sin(a))}"><circle r="${n(br)}" fill="${sp.fl}"/><circle r="${n(br * 0.5)}" fill="${shade(sp.fl, -0.25)}"/></g>`;
    }
    return s;
  },
  berry(r, sp, o, rng) {  // beautyberry, blueberry: loose leaves with berry clusters
    const c = sp.c, D = lobed(r, 11, rng, 0.18);
    let s = shadowOf(D, r, o, 0.28) + outlineFill(D, c, o, ' fill-opacity="0.9"') + leaves('oval', r, Math.round(12 + r * 3), Math.max(0.25, r * 0.12), rng, c, 0.9, 0.75) + dome(D);
    for (let i = 0, k = Math.round(4 + r * 1.5); i < k; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.75, br = Math.max(0.07, r * 0.03);
      for (let j = 0; j < 5; j++) s += `<circle cx="${n(d * Math.cos(a) + (rng() - 0.5) * br * 4)}" cy="${n(d * Math.sin(a) + (rng() - 0.5) * br * 4)}" r="${n(br)}" fill="${shade(sp.fl, (rng() - 0.5) * 0.2)}"/>`;
    }
    return s;
  },
};
function plantForm(it, o, rng, def, defForm) {
  const sp = spOf(it) || PLANT_BY_ID[def];
  return (FORMS[sp.f] || FORMS[defForm])(it.r, sp, o, rng);
}
const RDRAW = {
  dtree(it, o, rng) { return plantForm(it, o, rng, 'acru', 'maple'); },
  etree(it, o, rng) { return plantForm(it, o, rng, 'juvi', 'column'); },
  bshrub(it, o, rng) { return plantForm(it, o, rng, 'ilvn', 'fine'); },
  dshrub(it, o, rng) { return plantForm(it, o, rng, 'hyqu', 'shrub'); },
  birdbath(it, o) {
    const r = it.r;
    return shadowOf(`M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`, r * 2, o, 0.35) +
      `<circle r="${n(r)}" fill="#C9C2B4" stroke="#7E776A" stroke-width="${n(o.u)}"/><circle r="${n(r * 0.74)}" fill="url(#ld-water)" stroke="#9A9385" stroke-width="${n(o.u * 0.6)}"/>` +
      `<path d="M${n(-r * 0.3)},${n(-r * 0.1)}q${n(r * 0.15)},${n(-r * 0.12)} ${n(r * 0.3)},0q${n(r * 0.15)},${n(-r * 0.12)} ${n(r * 0.3)},0" stroke="#fff" stroke-opacity="0.7" stroke-width="${n(r * 0.05)}" fill="none"/>`;
  },
  perennial(it, o, rng) { return bedRender(it, o, rng); },
  annual(it, o, rng) { return bedRender(it, o, rng); },
  groundcover(it, o, rng) { return bedRender(it, o, rng); },
  patio(it, o) {
    const w = it.w, h = it.h, f = it.finish || 'stone';
    const edge = f === 'pavers' || f === 'brick' ? `<rect x="${n(-w / 2 + 0.25)}" y="${n(-h / 2 + 0.25)}" width="${n(w - 0.5)}" height="${n(h - 0.5)}" fill="none" stroke="${f === 'brick' ? '#6E3021' : '#8E8676'}" stroke-width="0.5"/>` : '';
    return `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" fill="${finishFill(f, o)}" stroke="#5F574C" stroke-width="${n(o.u * 1.1)}"/>${edge}`;
  },
  deck(it, o) {
    const w = it.w, h = it.h, R = `x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}"`;
    return (o.icon ? '' : `<rect ${R} transform="translate(-0.5 0.5)" fill="#000" fill-opacity="0.35" filter="url(#ld-soft)"/>`) +
      `<rect ${R} fill="url(#ld-deck)" stroke="#4A321E" stroke-width="${n(o.u * 1.4)}"/><rect x="${n(-w / 2 + 0.2)}" y="${n(-h / 2 + 0.2)}" width="${n(w - 0.4)}" height="${n(h - 0.4)}" fill="none" stroke="#C99C69" stroke-opacity="0.5" stroke-width="0.15"/>`;
  },
  veg(it, o, rng) {
    const w = it.w, h = it.h, x0 = -w / 2, y0 = -h / 2;
    let s = (o.icon ? '' : `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" transform="translate(-0.3 0.3)" fill="#000" fill-opacity="0.3" filter="url(#ld-soft)"/>`) +
      `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" fill="#8B6A45" stroke="#4E3822" stroke-width="${n(o.u)}"/>` +
      `<rect x="${n(x0 + 0.5)}" y="${n(y0 + 0.5)}" width="${n(Math.max(0, w - 1))}" height="${n(Math.max(0, h - 1))}" fill="url(#ld-soil)"/>`;
    const rows = Math.max(1, Math.floor((h - 1) / 1.5)), gap = (h - 1) / rows;
    const crops = [['#5E9A3E', null], ['#7DB24F', null], ['#4E8436', '#D2402F'], ['#86A84A', '#F2C14E'], ['#3E7A3A', null]];
    for (let k = 0; k < rows; k++) {
      const y = y0 + 0.5 + gap * (k + 0.5), [c, fr] = crops[k % crops.length];
      for (let x = x0 + 1.1; x < -x0 - 0.7; x += 1.1) {
        const rr = 0.42 + rng() * 0.12;
        s += `<path d="${lobed(rr, 6, rng, 0.25)}" transform="translate(${n(x)} ${n(y)})" fill="${shade(c, (rng() - 0.5) * 0.2)}" stroke="${shade(c, -0.45)}" stroke-width="0.04"/>`;
        if (fr && rng() < 0.6) s += `<circle cx="${n(x + 0.15)}" cy="${n(y - 0.1)}" r="0.12" fill="${fr}"/>`;
      }
    }
    return s;
  },
  wood(it, o) {
    const w = it.w, h = it.h, x0 = -w / 2, y0 = -h / 2;
    let s = o.icon ? '' : `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" transform="translate(-0.35 0.35)" fill="#000" fill-opacity="0.35" filter="url(#ld-soft)"/>`;
    s += `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" fill="#3B2A1C"/>`;
    let row = 0;
    for (let y = y0 + 0.45; y <= -y0 - 0.4; y += 0.74, row++) {
      for (let x = x0 + 0.45 + (row % 2) * 0.42; x <= -x0 - 0.4; x += 0.85) {
        s += `<circle cx="${n(x)}" cy="${n(y)}" r="0.4" fill="#8E5E36"/><circle cx="${n(x)}" cy="${n(y)}" r="0.3" fill="#D5B07F"/><circle cx="${n(x)}" cy="${n(y)}" r="0.14" fill="none" stroke="#A97E4C" stroke-width="0.04"/>`;
      }
    }
    return s;
  },
  lawn(it, o) {
    const w = it.w, h = it.h, rr = Math.min(3, w / 4, h / 4), sp = spOf(it) || PLANT_BY_ID.cyda;
    return `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}" fill="url(#ld-lawn-${sp.id})" stroke="${shade(sp.c, -0.35)}" stroke-width="${n(o.u * 0.9)}"/>`;
  },
  path(it, o) {
    const d = ptsD(it.pts), w = it.width || 4, f = it.finish || 'concrete';
    const fill = f === 'mulch' ? 'url(#ld-mulch)' : finishFill(f, o);
    return `<path d="${d}" fill="none" stroke="#5F574C" stroke-width="${n(w + o.u * 2)}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${n(w)}" stroke-linejoin="round"/>`;
  },
  fence(it, o) {
    const d = ptsD(it.pts), st = it.style || 'privacy';
    const shadow = (w) => (o.icon ? '' : `<path d="${d}" transform="translate(-0.3 0.3)" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="${w}" filter="url(#ld-soft)"/>`);
    const posts = (gap, shape, size, fill, stroke) => `<g fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="0.05"` : ''}>${fencePosts(it.pts, gap).map((p) => (shape === 'c' ? `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(size / 2)}"/>` : `<rect x="${n(p[0] - size / 2)}" y="${n(p[1] - size / 2)}" width="${n(size)}" height="${n(size)}"/>`)).join('')}</g>`;
    const line = (c, w, extra) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"${extra || ''}/>`;
    if (st === 'picket') return shadow(0.35) + line('#8F8B82', 0.34) + line('#FFFFFF', 0.26, ' stroke-dasharray="0.22 0.12"') + posts(8, 's', 0.45, '#FFFFFF', '#8F8B82');
    if (st === 'split') return shadow(0.25) + line('#7A5B3C', 0.22) + line('#B08A60', 0.08) + posts(10, 'c', 0.55, '#5E4430');
    if (st === 'chain') return line('#9CA3A8', 0.28, ' stroke-opacity="0.55" stroke-dasharray="0.12 0.1"') + line('#6F767C', 0.06) + posts(10, 'c', 0.4, '#BFC5C9', '#5F666B');
    if (st === 'iron') return shadow(0.2) + line('#1E1E1E', 0.08) + line('#1E1E1E', 0.3, ' stroke-dasharray="0.05 0.4"') + posts(6, 's', 0.35, '#1E1E1E');
    return shadow(0.5) + line('#7A5634', 0.42) + line('#B08458', 0.14) + posts(8, 's', 0.6, '#4E3622');
  },
  bedShape(it, o, rng) { return shapeRender(it, o, rng); },
  lawnShape(it, o, rng) { return shapeRender(it, o, rng); },
  paveShape(it, o, rng) { return shapeRender(it, o, rng); },
  building(it, o, rng) { return shapeRender(it, o, rng); },
};
function fencePosts(pts, gap) {
  gap = gap || 8;
  const L = polyLen(pts), posts = [];
  for (let k = 0; k <= Math.floor(L / gap); k++) posts.push(pointAlong(pts, k * gap));
  return posts.concat(pts);
}
/* plant clumps on a jittered hex grid inside a test function */
/* one plant clump (rendered) */
function clump(sp, px, py, rng, o, spc) {
  const kind = sp.t, rr = spc * (kind === 'annual' ? 0.5 : kind === 'groundcover' ? 0.55 : 0.46), c = sp.c;
  let s = `<g transform="translate(${n(px)} ${n(py)})"><path d="${lobed(rr, kind === 'groundcover' ? 9 : 6, rng, 0.2)}" fill="${shade(c, (rng() - 0.5) * 0.18)}" stroke="${shade(c, -0.5)}" stroke-width="${n(o.u * 0.5)}"/>`;
  if (sp.fl) {
    const cnt = kind === 'annual' ? 6 : kind === 'groundcover' ? 3 : 4;
    for (let i = 0; i < cnt; i++) { const a = rng() * 6.283, d = rng() * rr * 0.75; s += `<circle cx="${n(d * Math.cos(a))}" cy="${n(d * Math.sin(a))}" r="${n(rr * (kind === 'annual' ? 0.24 : 0.18))}" fill="${shade(sp.fl, (rng() - 0.5) * 0.15)}"/>`; }
  }
  return s + '</g>';
}
/* planting positions on a jittered hex grid, split between the plants in drifts (natural groups, not confetti) */
function bedSpots(mix, insideF, bb, rng) {
  const spc = mix.reduce((a, m) => a + (m.sp.spc || 1.5) * m.w, 0) || 1.5;
  const inside = insideF(spc * 0.4), pts = [];
  for (let y = bb[1] + spc / 2, row = 0; y < bb[3]; y += spc * 0.87, row++) {
    for (let x = bb[0] + spc / 2 + (row % 2) * spc / 2; x < bb[2]; x += spc) {
      const px = x + (rng() - 0.5) * spc * 0.25, py = y + (rng() - 0.5) * spc * 0.25;
      if (inside(px, py)) pts.push([px, py]);
    }
  }
  if (mix.length > 1) {
    const s1 = rng() * 6, s2 = rng() * 6, s3 = rng() * 6, f = 0.9 / Math.max(3, Math.sqrt((bb[2] - bb[0]) * (bb[3] - bb[1])) / 3);
    const val = pts.map((p, i) => [Math.sin(p[0] * f * 3 + s1) + Math.sin(p[1] * f * 2.6 + s2) + 0.6 * Math.sin((p[0] - p[1]) * f * 1.7 + s3) + p[0] * 0.02, i]).sort((a, c) => a[0] - c[0]);
    const who = [];
    let k = 0, acc = mix[0].w * val.length;
    val.forEach(([, i], rank) => { while (rank >= acc && k < mix.length - 1) { k++; acc += mix[k].w * val.length; } who[i] = mix[k].sp; });
    return { spc, pts: pts.map((p, i) => [p[0], p[1], who[i]]) };
  }
  return { spc, pts: pts.map((p) => [p[0], p[1], mix[0] && mix[0].sp]) };
}
/* bed edges: raised walls (with a shadow) or flat steel edging */
const EDGES = { wood: 'Raised: wood timbers', stone: 'Raised: stone wall', brick: 'Raised: brick', steel: 'Steel edging (flat)' };
function edgeUnder(d, edge, o) {
  if (!EDGES[edge] || edge === 'steel' || o.icon || !o.render) return '';
  return `<path d="${d}" transform="translate(-0.5 0.5)" fill="#0E1408" fill-opacity="0.35" stroke="#0E1408" stroke-opacity="0.35" stroke-width="0.9" filter="url(#ld-soft)"/>`;
}
function edgeOver(d, edge, o) {
  if (!EDGES[edge]) return '';
  const P = (stroke, w, extra) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"${extra || ''}/>`;
  if (!o.render) return edge === 'steel' ? P(INK, n(o.u * 2.2)) : P(INK, 0.8) + P(o.color ? '#F4F1EA' : '#fff', 0.55);
  if (edge === 'wood') return P('#4E3622', 0.9) + P('#A57A4E', 0.62, ' stroke-dasharray="4 0.14"') + P('#C79B69', 0.12, ' stroke-opacity="0.6"');
  if (edge === 'stone') return P('#5E564C', 1) + P('url(#ld-flagstone)', 0.8);
  if (edge === 'brick') return P('#4A1F14', 0.82) + P('url(#ld-brick)', 0.64);
  return P('#6B3F25', 0.24);
}
/* a planted bed of any outline d (local coords), with an optional raised edge */
function plantedBed(d, insideF, bb, mix, o, rng, type, edge) {
  return edgeUnder(d, edge, o) + plantedBedInner(d, insideF, bb, mix, o, rng, type) + edgeOver(d, edge, o);
}
function plantedBedInner(d, insideF, bb, mix, o, rng, type) {
  const carpet = mix.length === 1 && mix[0].sp.t === 'groundcover';
  if (!o.render) {
    const tint = o.color ? (mix.length ? T[mix[0].sp.t].tint : T.bedShape.tint) : '#fff';
    let s = `<path d="${d}" fill="${tint}" fill-opacity="${o.color ? 0.55 : 1}" stroke="${INK}" stroke-width="${n(o.u * 1.2)}"/>`;
    if (!mix.length) return s + `<path d="${d}" fill="url(#dd-dots)"/>`;
    if (carpet) return s + `<path d="${d}" fill="url(#dd-hatch)"/>`;
    const { spc, pts } = bedSpots(mix, insideF, bb, rng);
    return s + pts.map(([x, y, sp]) => (sp.t === 'annual' ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(Math.max(0.08, o.u * 0.7))}" fill="${INK}"/>`
      : sp.t === 'groundcover' ? `<path d="M${n(x - spc * 0.25)},${n(y)}h${n(spc * 0.5)}M${n(x)},${n(y - spc * 0.25)}v${n(spc * 0.5)}" stroke="${INK}" stroke-width="${n(o.u * 0.6)}"/>`
      : `<circle cx="${n(x)}" cy="${n(y)}" r="${n((sp.spc || spc) * 0.32)}" fill="none" stroke="${INK}" stroke-width="${n(o.u * 0.6)}"/>`)).join('');
  }
  if (carpet) {
    const sp = mix[0].sp;
    let s = `<path d="${d}" fill="${sp.c}" stroke="${shade(sp.c, -0.5)}" stroke-width="${n(o.u)}"/><path d="${d}" fill="url(#ld-leafy)"/>`;
    if (sp.fl) { const ins = insideF(0.3); for (let i = 0, cnt = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 3); i < cnt; i++) { const x = bb[0] + rng() * (bb[2] - bb[0]), y = bb[1] + rng() * (bb[3] - bb[1]); if (ins(x, y)) s += `<circle cx="${n(x)}" cy="${n(y)}" r="0.14" fill="${sp.fl}"/>`; } }
    return s;
  }
  let s = `<path d="${d}" fill="url(#ld-mulch)" stroke="#2E2016" stroke-width="${n(o.u * 1.3)}"/>`;
  if (!mix.length) return s;
  const { spc, pts } = bedSpots(mix, insideF, bb, rng);
  return s + pts.map(([x, y, sp]) => clump(sp, x, y, rng, o, sp.spc || spc)).join('');
}
/* box beds: oval, rectangle or rounded rectangle */
const bedForm = (it) => it.form || (it.type === 'groundcover' ? 'round' : 'oval');
function roundRectD(x, y, w, h, r) {
  if (r <= 0) return `M${n(x)},${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
  return `M${n(x + r)},${n(y)}H${n(x + w - r)}A${n(r)},${n(r)} 0 0 1 ${n(x + w)},${n(y + r)}V${n(y + h - r)}A${n(r)},${n(r)} 0 0 1 ${n(x + w - r)},${n(y + h)}H${n(x + r)}A${n(r)},${n(r)} 0 0 1 ${n(x)},${n(y + h - r)}V${n(y + r)}A${n(r)},${n(r)} 0 0 1 ${n(x + r)},${n(y)}Z`;
}
function bedPathD(it) {
  const rx = it.w / 2, ry = it.h / 2, f = bedForm(it);
  if (f === 'oval') return `M${n(-rx)},0A${n(rx)},${n(ry)} 0 1,0 ${n(rx)},0A${n(rx)},${n(ry)} 0 1,0 ${n(-rx)},0Z`;
  return roundRectD(-rx, -ry, it.w, it.h, f === 'rect' ? 0 : Math.min(1.5, it.w / 4, it.h / 4));
}
/* outline points of a box bed, used to turn it into a freeform shape */
function bedOutlinePts(it) {
  const rx = it.w / 2, ry = it.h / 2, f = bedForm(it);
  if (f === 'oval') { const out = []; for (let i = 0; i < 8; i++) { const a = 2 * Math.PI * i / 8; out.push([rx * Math.cos(a), ry * Math.sin(a)]); } return { pts: out, smooth: true }; }
  return { pts: [[-rx, -ry], [rx, -ry], [rx, ry], [-rx, ry]], smooth: false };
}
function bedRender(it, o, rng) {
  const rx = it.w / 2, ry = it.h / 2, oval = bedForm(it) === 'oval';
  const insideF = (pad) => (oval ? (x, y) => (x / Math.max(0.1, rx - pad)) ** 2 + (y / Math.max(0.1, ry - pad)) ** 2 < 1 : (x, y) => Math.abs(x) < rx - pad && Math.abs(y) < ry - pad);
  return plantedBed(bedPathD(it), insideF, [-rx, -ry, rx, ry], bedMix(it), o, rng, it.type, it.edge);
}
function shapeRender(it, o, rng) {
  const d = shapeD(it.pts, it.smooth);
  if (it.type === 'building') {
    if (!o.render) return `<path d="${d}" fill="${o.color ? '#EFEEE9' : '#fff'}" stroke="${INK}" stroke-width="${n(Math.max(0.3, o.u * 2.6))}" stroke-linejoin="miter"/>`;
    return (o.icon ? '' : `<path d="${d}" transform="translate(-1.6 0.9)" fill="#0E1408" fill-opacity="0.3" filter="url(#ld-soft)"/>`) +
      `<path d="${d}" fill="url(#ld-roof)" stroke="#262626" stroke-width="${n(Math.max(0.28, o.u * 2.4))}" stroke-linejoin="miter"/>`;
  }
  if (it.type === 'lawnShape') {
    const sp = spOf(it) || PLANT_BY_ID.cyda;
    if (!o.render) return `<path d="${d}" fill="${o.color ? T.lawnShape.tint : '#fff'}" stroke="${INK}" stroke-width="${n(o.u * 1.1)}"/><path d="${d}" fill="url(#dd-sparse)"/>`;
    return `<path d="${d}" fill="url(#ld-lawn-${sp.id})" stroke="${shade(sp.c, -0.35)}" stroke-width="${n(o.u * 0.9)}"/>`;
  }
  if (it.type === 'paveShape') {
    const f = it.finish || 'flagstone';
    if (!o.render) return `<path d="${d}" fill="${finishFill(f, o)}"/><path d="${d}" fill="url(#${DRAFT_HATCH[f]})" stroke="${INK}" stroke-width="${n(o.u * 1.3)}"/>`;
    return `<path d="${d}" fill="${finishFill(f, o)}" stroke="#5F574C" stroke-width="${n(o.u * 1.2)}"/>`;
  }
  // planting bed
  const poly = shapePoly(it.pts, it.smooth);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return plantedBed(d, (pad) => (x, y) => inPoly([x, y], poly) && segMin([x, y], poly) > pad, bb, bedMix(it), o, rng, it.type, it.edge);
}
function segMin(p, poly) { let d = Infinity; for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(p, poly[i], poly[(i + 1) % poly.length])); return d; }

/* ------------------------------------------------------------------ drafting symbols (the lab's paper symbols) */
function fillOf(type, o, fallback) {
  const t = T[type];
  if (o.color && t.tint) return `fill="${t.tint}" fill-opacity="${t.op}"`;
  return `fill="${fallback}"`;
}
function scallop(r, k, u, fill) {
  const pts = [];
  for (let i = 0; i < k; i++) pts.push([r * Math.cos(2 * Math.PI * i / k), r * Math.sin(2 * Math.PI * i / k)]);
  let d = `M${n(pts[0][0])},${n(pts[0][1])}`;
  for (let i = 0; i < k; i++) {
    const p2 = pts[(i + 1) % k], am = 2 * Math.PI * (i + 0.5) / k;
    d += `Q${n(r * 1.22 * Math.cos(am))},${n(r * 1.22 * Math.sin(am))} ${n(p2[0])},${n(p2[1])}`;
  }
  return `<path d="${d}Z" ${fill} stroke="${INK}" stroke-width="${n(u * 1.1)}" stroke-linejoin="round"/>`;
}
const DDRAW = {
  dtree(it, o, rng) {
    const r = it.r, u = o.u, a0 = -80 + rng() * 72;
    let s = `<circle r="${n(r)}" ${fillOf('dtree', o, 'transparent')} stroke="${INK}" stroke-width="${n(u * 1.15)}"/>`;
    for (let k = 0; k < 5; k++) {
      const a = (a0 + k * 72 + (rng() - 0.5) * 18) * Math.PI / 180;
      s += `<line x2="${n(r * 0.92 * Math.cos(a))}" y2="${n(r * 0.92 * Math.sin(a))}" stroke="${INK}" stroke-width="${n(u * 0.7)}"/>`;
    }
    return s + `<circle r="${n(Math.max(u * 1.6, r * 0.04))}" fill="${INK}"/>`;
  },
  etree(it, o) {
    const r = it.r, u = o.u, k = clamp(Math.round(r * 2.6), 20, 56);
    let s = `<circle r="${n(r)}" fill="transparent"/><circle r="${n(r * 0.82)}" ${fillOf('etree', o, 'transparent')} stroke="${INK}" stroke-width="${n(u)}"/><path d="`;
    for (let i = 0; i < k; i++) {
      const a = 2 * Math.PI * i / k, c = Math.cos(a), sn = Math.sin(a);
      s += `M${n(r * 0.82 * c)},${n(r * 0.82 * sn)}L${n(r * c)},${n(r * sn)}`;
    }
    return s + `" stroke="${INK}" stroke-width="${n(u * 0.85)}" fill="none"/><circle r="${n(Math.max(u * 1.6, r * 0.04))}" fill="${INK}"/>`;
  },
  bshrub(it, o) {
    const k = clamp(Math.round(it.r * 2.6), 8, 24);
    return scallop(it.r * 0.9, k, o.u, fillOf('bshrub', o, o.icon ? 'none' : 'transparent')) + `<circle r="${n(o.u * 1.5)}" fill="${INK}"/>`;
  },
  dshrub(it, o) {
    return `<circle r="${n(it.r)}" ${fillOf('dshrub', o, o.icon ? 'none' : 'transparent')} stroke="${INK}" stroke-width="${n(o.u * 1.1)}"/>` +
      `<circle r="${n(it.r * 0.55)}" fill="none" stroke="${INK}" stroke-width="${n(o.u * 0.65)}"/><circle r="${n(o.u * 1.5)}" fill="${INK}"/>`;
  },
  birdbath(it, o) {
    const r = it.r, u = o.u;
    return `<circle r="${n(r)}" ${fillOf('birdbath', o, '#fff')} stroke="${INK}" stroke-width="${n(u * 1.2)}"/>` +
      `<circle r="${n(r * 0.66)}" fill="none" stroke="${INK}" stroke-width="${n(u * 0.6)}"/>` +
      `<circle r="${n(r * 0.33)}" fill="none" stroke="${INK}" stroke-width="${n(u * 0.6)}" stroke-dasharray="${n(u * 2)} ${n(u * 1.5)}"/>`;
  },
  perennial(it, o, rng) { return bedRender(it, o, rng); },
  annual(it, o, rng) { return bedRender(it, o, rng); },
  groundcover(it, o, rng) { return bedRender(it, o, rng); },
  patio(it, o) {
    const w = it.w, h = it.h, f = it.finish || 'stone', R = `x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}"`;
    return `<rect ${R} fill="${finishFill(f, o)}"/><rect ${R} fill="url(#${DRAFT_HATCH[f]})" stroke="${INK}" stroke-width="${n(o.u * 1.3)}"/>`;
  },
  deck(it, o) {
    const w = it.w, h = it.h, x0 = -w / 2, y0 = -h / 2, u = o.u;
    let s = `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" ${fillOf('deck', o, '#fff')}/><path d="`;
    for (let y = y0 + 0.6; y < -y0 - 0.2; y += 0.6) s += `M${n(x0)},${n(y)}H${n(-x0)}`;
    return s + `" stroke="${INK}" stroke-width="${n(u * 0.5)}" fill="none"/><rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${INK}" stroke-width="${n(u * 1.3)}"/>`;
  },
  veg(it, o) {
    const w = it.w, h = it.h, u = o.u, x0 = -w / 2, y0 = -h / 2;
    let s = `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" ${fillOf('veg', o, '#fff')} stroke="${INK}" stroke-width="${n(u * 1.2)}"/>`;
    let lines = '', dots = '';
    const rows = Math.max(1, Math.floor(h / 2)), gap = h / rows;
    for (let k = 0; k < rows; k++) {
      const y = y0 + gap * (k + 0.5);
      lines += `M${n(x0 + 0.6)},${n(y)}H${n(-x0 - 0.6)}`;
      for (let x = x0 + 1.1; x < -x0 - 0.7; x += 1.2) dots += `<circle cx="${n(x)}" cy="${n(y)}" r="0.36"/>`;
    }
    return s + `<path d="${lines}" stroke="${INK}" stroke-width="${n(u * 0.5)}" fill="none"/><g fill="${o.color ? '#8DBA62' : '#fff'}" stroke="${INK}" stroke-width="${n(u * 0.55)}">${dots}</g>`;
  },
  wood(it, o) {
    const w = it.w, h = it.h, u = o.u, x0 = -w / 2, y0 = -h / 2;
    let s = `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" ${fillOf('wood', o, '#fff')} stroke="${INK}" stroke-width="${n(u * 1.2)}"/><g fill="${o.color ? '#E9D2AE' : '#fff'}" stroke="${INK}" stroke-width="${n(u * 0.6)}">`;
    let row = 0, dots = '';
    for (let y = y0 + 0.5; y <= -y0 - 0.45; y += 0.74, row++) {
      for (let x = x0 + 0.5 + (row % 2) * 0.42; x <= -x0 - 0.45; x += 0.85) { s += `<circle cx="${n(x)}" cy="${n(y)}" r="0.38"/>`; dots += `M${n(x - 0.07)},${n(y)}h0.14`; }
    }
    return s + `</g><path d="${dots}" stroke="${INK}" stroke-width="${n(u * 1.1)}"/>`;
  },
  lawn(it, o) {
    const w = it.w, h = it.h, rr = Math.min(3, w / 4, h / 4), R = `x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}"`;
    return `<rect ${R} ${fillOf('lawn', o, '#fff')} stroke="${INK}" stroke-width="${n(o.u * 1.1)}"/><rect ${R} fill="url(#dd-sparse)"/>`;
  },
  path(it, o) {
    const d = ptsD(it.pts), w = it.width || 4, f = it.finish || 'concrete';
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(w + o.u * 2.4)}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${finishFill(f, o)}" stroke-width="${n(w)}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="url(#${DRAFT_HATCH[f]})" stroke-width="${n(w)}" stroke-linejoin="round"/>`;
  },
  fence(it, o) {
    const d = ptsD(it.pts), u = o.u, ps = Math.max(0.5, u * 4), st = it.style || 'privacy', col = o.color ? '#5B4630' : INK;
    const base = `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(u * 1.6)}" stroke-linejoin="round"/>`;
    if (st === 'picket') return base + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(ps * 0.9)}" stroke-dasharray="${n(u * 0.8)} ${n(ps * 0.7)}"/>`;
    if (st === 'split') return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(u * 1.2)}" stroke-dasharray="${n(ps * 2)} ${n(ps * 0.6)}"/><g fill="#fff" stroke="${col}" stroke-width="${n(u)}">` + fencePosts(it.pts, 10).map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(ps * 0.5)}"/>`).join('') + '</g>';
    if (st === 'chain') return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(u)}"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${n(ps * 0.8)}" stroke-dasharray="${n(u)} ${n(ps * 0.5)}" transform="rotate(0)"/>` + `<g fill="${col}">` + fencePosts(it.pts, 10).map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(ps * 0.4)}"/>`).join('') + '</g>';
    if (st === 'iron') return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(u)}"/><g fill="${col}">` + fencePosts(it.pts, 6).map((p) => `<rect x="${n(p[0] - ps * 0.35)}" y="${n(p[1] - ps * 0.35)}" width="${n(ps * 0.7)}" height="${n(ps * 0.7)}"/>`).join('') + '</g>';
    return base + `<g fill="${INK}">` + fencePosts(it.pts).map((p) => `<rect x="${n(p[0] - ps / 2)}" y="${n(p[1] - ps / 2)}" width="${n(ps)}" height="${n(ps)}"/>`).join('') + '</g>';
  },
  bubble(it, o) {
    const z = ZONES[it.zone] || ZONES.private, u = o.u;
    const fill = o.color ? `fill="${z.tint}" fill-opacity="0.55"` : 'fill="transparent"';
    let s = `<ellipse rx="${n(it.w / 2)}" ry="${n(it.h / 2)}" ${fill} stroke="${INK}" stroke-width="${n(u * 1.4)}" stroke-dasharray="${n(u * 7)} ${n(u * 4)}"/>`;
    if (!o.icon) {
      const fs = clamp(Math.min(it.w, it.h) * 0.12, 1.2, 2.6);
      s += `<g transform="rotate(${n(-(it.rot || 0))})"><text text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="600" font-size="${n(fs)}" letter-spacing="0.06em" fill="${INK}">${esc((it.label || z.name).toUpperCase())}</text>`;
      if (it.label) s += `<text y="${n(fs * 1.05)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="500" font-size="${n(fs * 0.6)}" letter-spacing="0.08em" fill="#4A4A4A">${esc(z.name.toUpperCase())} ZONE</text>`;
      s += '</g>';
    }
    return s;
  },
  arrow(it, o) {
    const pts = it.pts.map((p) => p.slice()), u = o.u;
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const L = Math.max(1.4, u * 10), W = L * 0.42, len = dist(a, b) || 1;
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, base = [b[0] - ux * L, b[1] - uy * L];
    pts[pts.length - 1] = [b[0] - ux * L * 0.7, b[1] - uy * L * 0.7];
    const col = o.color ? '#0E3A21' : INK;
    return `<path d="${ptsD(pts)}" fill="none" stroke="${col}" stroke-width="${n(u * 2)}" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M${n(b[0])},${n(b[1])}L${n(base[0] - uy * W)},${n(base[1] + ux * W)}L${n(base[0] + uy * W)},${n(base[1] - ux * W)}Z" fill="${col}"/>`;
  },
  label(it) {
    return `<text text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="600" font-size="${n(it.size)}" letter-spacing="0.04em" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="${n(it.size * 0.28)}" stroke-linejoin="round">${esc(it.text || '')}</text>`;
  },
  bedShape(it, o, rng) { return shapeRender(it, o, rng); },
  lawnShape(it, o, rng) { return shapeRender(it, o, rng); },
  paveShape(it, o, rng) { return shapeRender(it, o, rng); },
  building(it, o, rng) { return shapeRender(it, o, rng); },
};

/* draw one item. o: {u: ink width (ft), render, color, tags, hit, icon} */
function drawItem(it, o) {
  const t = T[it.type], rng = rngFor(it.id);
  const fn = (o.render && RDRAW[it.type]) || DDRAW[it.type];
  const inner = fn(it, o, rng);
  let g;
  if (t.kind === 'circle' || t.kind === 'text') g = `<g transform="translate(${n(it.x)} ${n(it.y)})">${inner}</g>`;
  else if (t.kind === 'box') g = `<g transform="translate(${n(it.x)} ${n(it.y)}) rotate(${n(it.rot || 0)})">${inner}</g>`;
  else {
    g = inner;
    if (o.hit && t.kind === 'line') g += `<path d="${ptsD(it.pts)}" fill="none" stroke="transparent" stroke-width="${n(Math.max(2, (it.width || 0) + 1))}" stroke-linejoin="round"/>`;
  }
  if (!o.icon) g += itemLabel(it, o);
  return `<g${o.hit ? ` data-id="${esc(it.id)}"` : ''}${it.hidden ? ' display="none"' : ''}>${g}</g>`;
}
function itemCenter(it) {
  const k = T[it.type].kind;
  if (k === 'line') return pointAlong(it.pts, polyLen(it.pts) / 2);
  if (k === 'shape') { const p = shapePoly(it.pts, it.smooth); return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; }
  return [it.x, it.y];
}
function itemLabel(it, o) {
  const t = T[it.type];
  if (t.kind === 'text' || it.type === 'bubble') return '';
  let s = '';
  const sp = spOf(it);
  // plant tag: key code in a white tag, like a professional planting plan
  const tagSp = isBedType(it.type) ? bedMix(it).map((m) => m.sp) : (sp ? [sp] : []);
  if (o.tags && tagSp.length && tagSp[0].t !== 'turf') {
    const code = tagSp.map((q) => PLANT_CODE[q.id]).join(' · ');
    let x, y;
    if (t.kind === 'circle') { x = it.x + it.r * 0.62; y = it.y + it.r * 0.62; } else [x, y] = itemCenter(it);
    const fs = 1.15, w = code.length * fs * 0.62 + 0.7;
    s += `<g><rect x="${n(x - w / 2)}" y="${n(y - fs * 0.62)}" width="${n(w)}" height="${n(fs * 1.24)}" rx="0.25" fill="#fff" stroke="${INK}" stroke-width="0.08"/>` +
      `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="600" font-size="${fs}" fill="${INK}">${code}</text></g>`;
  }
  if (it.label) {
    const fs = 1.45;
    let x, y;
    if (t.kind === 'circle') { x = it.x; y = it.y + it.r + fs * 0.9; } else if (t.kind === 'line') { [x, y] = itemCenter(it); y -= (it.width || 0) / 2 + fs * 1.1; } else { [x, y] = itemCenter(it); if (o.tags && sp) y -= fs * 1.4; }
    s += `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="600" font-size="${fs}" letter-spacing="0.05em" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="${n(fs * 0.3)}" stroke-linejoin="round">${esc(it.label)}</text>`;
  }
  return s;
}

/* icons for tools, library, schedule and the sheet key */
const ICON = {
  dtree: { r: 5 }, etree: { r: 5 }, bshrub: { r: 5 }, dshrub: { r: 5 }, birdbath: { r: 5 },
  perennial: { w: 10, h: 6.5, vb: [-5.6, -4.8, 11.2, 9.6] },
  annual: { w: 10, h: 6.5, vb: [-5.6, -4.8, 11.2, 9.6] },
  groundcover: { w: 8, h: 5.5, vb: [-4.5, -3.8, 9, 7.6] },
  bedShape: { pts: [[-4.5, -1], [-1, -3.4], [3.8, -2.2], [4.4, 2.2], [0, 3.4], [-3.6, 2.6]], smooth: true, sp: 'ecpu', vb: [-5.6, -4.8, 11.2, 9.6] },
  lawnShape: { pts: [[-4.8, -2], [-1.5, -3.8], [4, -3], [4.8, 2.4], [-1, 3.8], [-4.4, 2]], smooth: true, sp: 'cyda', vb: [-5.6, -4.8, 11.2, 9.6] },
  paveShape: { pts: [[-4.6, -3.6], [2.4, -3.6], [4.6, -0.6], [4.6, 3.6], [-4.6, 3.6]], smooth: false, finish: 'flagstone', vb: [-5.6, -4.8, 11.2, 9.6] },
  patio: { w: 9, h: 7, finish: 'stone', vb: [-5, -4.2, 10, 8.4] },
  building: { pts: [[-4.6, -3.6], [1, -3.6], [1, -1], [4.6, -1], [4.6, 3.6], [-4.6, 3.6]], smooth: false, vb: [-5.6, -4.8, 11.2, 9.6] },
  deck: { w: 6, h: 5, vb: [-3.4, -2.9, 6.8, 5.8] },
  veg: { w: 6, h: 5, vb: [-3.4, -2.9, 6.8, 5.8] },
  wood: { w: 5, h: 3.6, vb: [-2.8, -2.4, 5.6, 4.8] },
  lawn: { w: 12, h: 9, vb: [-6.6, -5.6, 13.2, 11.2] },
  bubble: { w: 11, h: 7.4, zone: 'private', vb: [-6, -5, 12, 10] },
  path: { pts: [[-4, 3], [-1, -0.5], [4, -2]], width: 2.4, finish: 'pavers', vb: [-5.6, -4.8, 11.2, 9.6] },
  fence: { pts: [[-5, 3], [-1, 3], [4, -3]], vb: [-5.6, -4.8, 11.2, 9.6] },
  arrow: { pts: [[-4.5, 3], [0, -1], [4.5, -1]], vb: [-5.6, -4.8, 11.2, 9.6] },
};
const CIRCLE_VB = [-5.6, -5.6, 11.2, 11.2];
function iconItem(type, sp) {
  const spec = ICON[type] || {};
  const it = Object.assign({ id: 'icon-' + type + (sp || ''), type, x: 0, y: 0, rot: 0 }, clone(spec));
  delete it.vb;
  if (sp) it.sp = sp; else if (T[type].d.sp && !it.sp) it.sp = T[type].d.sp;
  return { it, vb: spec.vb || CIRCLE_VB };
}
/* standalone <svg> icon (uses the page's shared defs) */
function iconSVG(type, style, sp) {
  const { it, vb } = iconItem(type, sp);
  const o = { u: vb[2] / 40 * 1.1, render: style === 'render', color: style !== 'bw', icon: true };
  return `<svg viewBox="${vb.join(' ')}" aria-hidden="true" focusable="false">${drawItem(it, o)}</svg>`;
}
/* icon placed into an SVG sheet at (cx,cy) inside a bw x bh box */
function iconAt(type, cx, cy, bw, bh, style, sp) {
  const { it, vb } = iconItem(type, sp);
  const sc = Math.min(bw / vb[2], bh / vb[3]);
  const o = { u: 1.1 / sc, render: style === 'render', color: style !== 'bw', icon: true };
  return `<g transform="translate(${n(cx - (vb[0] + vb[2] / 2) * sc)} ${n(cy - (vb[1] + vb[3] / 2) * sc)}) scale(${n(sc * 1000) / 1000})">${drawItem(it, o)}</g>`;
}
