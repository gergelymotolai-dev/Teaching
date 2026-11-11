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
function toHsl(hex) {
  const v = parseInt(hex.slice(1), 16), r = (v >> 16) / 255, g = ((v >> 8) & 255) / 255, b = (v & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const q = (t) => Math.round(clamp(t + m, 0, 1) * 255);
  return '#' + ((1 << 24) + (q(r) << 16) + (q(g) << 8) + q(b)).toString(16).slice(1);
}
/* a richer / deeper / brighter version of a color: saturation times (1 + ds), lightness plus dl, hue plus dh degrees.
 * Sunlit foliage is lighter AND a little yellower; shade is darker and a little bluer, and both stay saturated. */
function tone(hex, ds, dl, dh) {
  const [h, s, l] = toHsl(hex);
  return hslHex((h + (dh || 0) + 360) % 360, clamp(s * (1 + ds), 0, 1), clamp(l + dl, 0.02, 0.97));
}
const isGreen = (hex) => { const [h, s] = toHsl(hex); return s > 0.12 && h > 55 && h < 175; };
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
const WALL_STYLES = { block: 'Block retaining wall', stone: 'Fieldstone wall, dry-stacked', seat: 'Stone seat wall with cap', brick: 'Brick garden wall', timber: 'Timber retaining wall' };
const WALL_HEIGHT = { block: 3, stone: 2, seat: 1.5, brick: 3, timber: 2 };
const WALL_W = { block: 1, stone: 1.5, seat: 1.5, brick: 0.75, timber: 0.5 };
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
  pondShape: { name: 'Pond (draw any shape)', short: 'POND', kind: 'shape', d: { smooth: true }, band: 1.5 },
  stream:    { name: 'Stream', kind: 'line', d: { width: 3, smooth: true }, band: 1.6 },
  lights:    { name: 'String lights', kind: 'line', d: { style: 'bistro', smooth: false }, band: 4.8 },
  wall:      { name: 'Garden wall', kind: 'line', d: { style: 'seat', height: 1.5, width: 1.5, smooth: false }, band: 3.2 },
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
/* ------------------------------------------------------------------ outdoor living: furniture, cooking and fire, pools, play
 * Box items drawn in local feet around (0,0). Each works in the rendered style (o.render) and the drafting styles. */
const FURN_T = {
  table_round: { name: 'Round dining table', group: 'Furniture', d: { w: 7, h: 7 }, band: 3.5 },
  table_rect:  { name: 'Dining table, 6 chairs', group: 'Furniture', d: { w: 9, h: 6.5 }, band: 3.5 },
  sofa:        { name: 'Outdoor sofa', group: 'Furniture', d: { w: 7, h: 3 }, band: 3.5 },
  sectional:   { name: 'L-shaped sectional', group: 'Furniture', d: { w: 9, h: 9 }, band: 3.5 },
  chair:       { name: 'Lounge chair', group: 'Furniture', d: { w: 3, h: 3 }, band: 3.5 },
  lounge:      { name: 'Chaise lounge', group: 'Furniture', d: { w: 2.5, h: 6.5 }, band: 3.5 },
  bench:       { name: 'Garden bench', group: 'Furniture', d: { w: 6, h: 2 }, band: 3.5 },
  umbrella:    { name: 'Patio umbrella', group: 'Shade', d: { w: 9, h: 9 }, band: 4.6, overhead: true },
  pergola:     { name: 'Pergola', group: 'Shade', d: { w: 12, h: 12 }, band: 4.7, overhead: true },
  grill:       { name: 'Grill', group: 'Cooking & fire', d: { w: 5, h: 2.5 }, band: 3.5 },
  kitchen:     { name: 'Outdoor kitchen', group: 'Cooking & fire', d: { w: 10, h: 3 }, band: 3.5 },
  firepit:     { name: 'Fire pit, round', group: 'Cooking & fire', d: { w: 5, h: 5 }, band: 3 },
  firetable:   { name: 'Fire table, square', group: 'Cooking & fire', d: { w: 5, h: 5 }, band: 3 },
  pool:        { name: 'Pool, rectangle', group: 'Pools & spas', d: { w: 16, h: 32 }, band: 1.5 },
  pool_kidney: { name: 'Pool, kidney', group: 'Pools & spas', d: { w: 16, h: 30 }, band: 1.5 },
  hottub:      { name: 'Hot tub', group: 'Pools & spas', d: { w: 7.5, h: 7.5 }, band: 2.5 },
  playset:     { name: 'Play set with slide', group: 'Play', d: { w: 12, h: 10 }, band: 3.5 },
  swing:       { name: 'Swing set', group: 'Play', d: { w: 14, h: 6 }, band: 3.5 },
  sandbox:     { name: 'Sandbox', group: 'Play', d: { w: 6, h: 6 }, band: 2.5 },
  trampoline:  { name: 'Trampoline', group: 'Play', d: { w: 12, h: 12 }, band: 3.5 },
};
const poolT = { name: 'Pool (draw any shape)', group: 'Pools & spas', band: 1.5 };

/* colors: rendered look, or drafting (white with a light tint when Color is on) */
const pc = (o, rendered, tint) => (o.render ? rendered : (o.color && tint ? tint : '#fff'));
const ink = (o, rendered) => (o.render ? rendered : INK);
const sw = (o, k) => n(o.u * k);
const rr = (x, y, w, h, r, fill, stroke, wd, extra) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${wd}"` : ''}${extra || ''}/>`;
const shadowBox = (o, w, h, r) => (o.render && !o.icon ? rr(-w / 2 - 0.25, -h / 2 + 0.25, w, h, r || 0.2, '#0E1408', '', '', ' fill-opacity="0.3" filter="url(#ld-soft)"') : '');
function seat(o, x, y, w, h, rot) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot || 0)})">${rr(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.22, pc(o, '#3F4A52', '#E9EDF0'), ink(o, '#22292E'), sw(o, 0.8))}` +
    `${rr(-w / 2 + w * 0.12, -h / 2 + h * 0.22, w * 0.76, h * 0.66, Math.min(w, h) * 0.15, pc(o, '#D9CBB0', '#fff'), ink(o, '#A99A7E'), sw(o, 0.5))}</g>`;
}
function poolWater(d, o, rng, bb) {
  if (!o.render) return `<path d="${d}" fill="${o.color ? '#D7ECF6' : '#fff'}"/>` + `<path d="${d}" fill="url(#dd-water)"/>`;
  let s = `<path d="${d}" fill="url(#ld-pool)"/>`;
  for (let i = 0, k = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 18); i < k; i++) {
    const x = bb[0] + rng() * (bb[2] - bb[0]), y = bb[1] + rng() * (bb[3] - bb[1]), L = 0.8 + rng() * 1.6;
    s += `<path d="M${n(x)},${n(y)}q${n(L / 2)},${n(-0.35)} ${n(L)},0" stroke="#fff" stroke-opacity="0.45" stroke-width="0.1" fill="none" clip-path="none"/>`;
  }
  return s;
}
const KIDNEY = (w, h) => {
  const P = (x, y) => `${n(x * w)},${n(y * h)}`;
  return `M${P(-0.05, -0.5)}C${P(0.32, -0.5)} ${P(0.5, -0.36)} ${P(0.5, -0.12)}C${P(0.5, 0.06)} ${P(0.3, 0.1)} ${P(0.32, 0.22)}C${P(0.36, 0.42)} ${P(0.2, 0.5)} ${P(0.0, 0.5)}C${P(-0.32, 0.5)} ${P(-0.5, 0.34)} ${P(-0.5, 0.1)}C${P(-0.5, -0.06)} ${P(-0.3, -0.12)} ${P(-0.36, -0.28)}C${P(-0.42, -0.46)} ${P(-0.28, -0.5)} ${P(-0.05, -0.5)}Z`;
};
const FURN = {
  table_round(it, o) {
    const R = Math.min(it.w, it.h) / 2, tr = R * 0.5, k = clamp(Math.round(2 * Math.PI * (tr + 1) / 2.4), 4, 10);
    let s = '';
    for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k, d = tr + 0.95; s += seat(o, d * Math.cos(a), d * Math.sin(a), 1.7, 1.7, a * 180 / Math.PI + 90); }
    return s + (o.render && !o.icon ? `<circle cx="-0.2" cy="0.2" r="${n(tr)}" fill="#0E1408" fill-opacity="0.3" filter="url(#ld-soft)"/>` : '') +
      `<circle r="${n(tr)}" fill="${pc(o, '#B98A5A', '#F1E6D6')}" stroke="${ink(o, '#5E4129')}" stroke-width="${sw(o, 1)}"/>` + (o.render ? `<circle r="${n(tr * 0.75)}" fill="none" stroke="#C99C69" stroke-width="0.06"/>` : '');
  },
  table_rect(it, o) {
    const tw = Math.max(2, it.w - 3.4), th = Math.max(2, it.h - 3.4), per = Math.max(1, Math.floor(tw / 2.4));
    let s = '';
    for (let i = 0; i < per; i++) { const x = -tw / 2 + tw * (i + 0.5) / per; s += seat(o, x, -th / 2 - 0.95, 1.7, 1.7, 180) + seat(o, x, th / 2 + 0.95, 1.7, 1.7, 0); }
    if (it.w >= 7.5) s += seat(o, -tw / 2 - 0.95, 0, 1.7, 1.7, 90) + seat(o, tw / 2 + 0.95, 0, 1.7, 1.7, -90);
    let slats = '';
    if (o.render) for (let x = -tw / 2 + 0.5; x < tw / 2; x += 0.5) slats += `M${n(x)},${n(-th / 2)}V${n(th / 2)}`;
    return s + shadowBox(o, tw, th) + rr(-tw / 2, -th / 2, tw, th, 0.15, pc(o, '#B98A5A', '#F1E6D6'), ink(o, '#5E4129'), sw(o, 1)) + (slats ? `<path d="${slats}" stroke="#8E6640" stroke-width="0.05"/>` : '');
  },
  sofa(it, o) {
    const w = it.w, h = it.h, arm = Math.min(0.7, w * 0.1), back = h * 0.3, n3 = Math.max(1, Math.round((w - 2 * arm) / 2.2));
    let s = shadowBox(o, w, h, 0.3) + rr(-w / 2, -h / 2, w, h, 0.3, pc(o, '#3F4A52', '#E9EDF0'), ink(o, '#22292E'), sw(o, 1));
    s += rr(-w / 2 + arm, -h / 2 + 0.1, w - 2 * arm, back, 0.2, pc(o, '#C9BBA0', '#fff'), ink(o, '#A99A7E'), sw(o, 0.5));
    for (let i = 0; i < n3; i++) { const cw = (w - 2 * arm) / n3; s += rr(-w / 2 + arm + i * cw + 0.05, -h / 2 + back + 0.15, cw - 0.1, h - back - 0.3, 0.2, pc(o, '#D9CBB0', '#fff'), ink(o, '#A99A7E'), sw(o, 0.5)); }
    return s;
  },
  sectional(it, o) {
    const w = it.w, h = it.h, d = Math.min(3, w * 0.35, h * 0.35);
    const L = `M${n(-w / 2)},${n(-h / 2)}H${n(w / 2)}V${n(-h / 2 + d)}H${n(-w / 2 + d)}V${n(h / 2)}H${n(-w / 2)}Z`;
    let s = (o.render && !o.icon ? `<path d="${L}" transform="translate(-0.25 0.25)" fill="#0E1408" fill-opacity="0.3" filter="url(#ld-soft)"/>` : '') + `<path d="${L}" fill="${pc(o, '#3F4A52', '#E9EDF0')}" stroke="${ink(o, '#22292E')}" stroke-width="${sw(o, 1)}"/>`;
    const cush = (x, y, cw, ch) => rr(x, y, cw, ch, 0.2, pc(o, '#D9CBB0', '#fff'), ink(o, '#A99A7E'), sw(o, 0.5));
    const nx = Math.max(1, Math.round((w - d) / 2.3)), ny = Math.max(1, Math.round((h - d) / 2.3));
    for (let i = 0; i < nx; i++) { const cw = (w - d - 0.3) / nx; s += cush(-w / 2 + d + 0.1 + i * cw, -h / 2 + d * 0.32, cw - 0.1, d * 0.6); }
    for (let i = 0; i < ny; i++) { const ch = (h - d - 0.3) / ny; s += cush(-w / 2 + d * 0.32, -h / 2 + d + 0.1 + i * ch, d * 0.6, ch - 0.1); }
    return s + cush(-w / 2 + d * 0.32, -h / 2 + d * 0.32, d * 0.6, d * 0.6);
  },
  chair(it, o) { return shadowBox(o, it.w, it.h, 0.3) + seat(o, 0, 0, it.w, it.h, 0); },
  lounge(it, o) {
    const w = it.w, h = it.h;
    return shadowBox(o, w, h, 0.3) + rr(-w / 2, -h / 2, w, h, 0.3, pc(o, '#E8E4DC', '#F3F3F3'), ink(o, '#8A8478'), sw(o, 0.9)) +
      rr(-w / 2 + 0.2, -h / 2 + 0.2, w - 0.4, h * 0.3, 0.2, pc(o, '#5B8FB0', '#fff'), ink(o, '#3F6E8C'), sw(o, 0.5)) +
      rr(-w / 2 + 0.2, -h / 2 + h * 0.3 + 0.3, w - 0.4, h * 0.7 - 0.5, 0.2, pc(o, '#6FA3C4', '#fff'), ink(o, '#3F6E8C'), sw(o, 0.5));
  },
  bench(it, o) {
    const w = it.w, h = it.h;
    let sl = '';
    for (let y = -h / 2 + h / 4; y < h / 2 - 0.05; y += h / 4) sl += `M${n(-w / 2 + 0.1)},${n(y)}H${n(w / 2 - 0.1)}`;
    return shadowBox(o, w, h) + rr(-w / 2, -h / 2, w, h, 0.1, pc(o, '#A97B4D', '#F1E6D6'), ink(o, '#4E3622'), sw(o, 0.9)) + `<path d="${sl}" stroke="${ink(o, '#6E4E30')}" stroke-width="${sw(o, 0.5)}"/>`;
  },
  umbrella(it, o) {
    const R = Math.min(it.w, it.h) / 2, k = 8;
    let s = o.render && !o.icon ? `<circle cx="-0.8" cy="0.8" r="${n(R)}" fill="#0E1408" fill-opacity="0.22" filter="url(#ld-soft)"/>` : '';
    for (let i = 0; i < k; i++) {
      const a0 = 2 * Math.PI * i / k, a1 = 2 * Math.PI * (i + 1) / k;
      s += `<path d="M0,0L${n(R * Math.cos(a0))},${n(R * Math.sin(a0))}L${n(R * Math.cos(a1))},${n(R * Math.sin(a1))}Z" fill="${pc(o, i % 2 ? '#E7DCC6' : '#D6C8AC', '#FBF8F2')}" stroke="${ink(o, '#9C8C70')}" stroke-width="${sw(o, 0.6)}" stroke-linejoin="round"/>`;
    }
    return s + `<circle r="${n(Math.max(0.2, R * 0.06))}" fill="${ink(o, '#5E5240')}"/>`;
  },
  pergola(it, o) {
    const w = it.w, h = it.h, ps = 0.55;
    let s = '';
    let raft = '';
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1) raft += `M${n(x)},${n(-h / 2 - 0.6)}V${n(h / 2 + 0.6)}`;
    s += `<path d="${raft}" stroke="${ink(o, '#8E6640')}" stroke-width="${o.render ? 0.28 : sw(o, 0.7)}"${o.render ? ' stroke-opacity="0.92"' : ''}/>`;
    s += `<path d="M${n(-w / 2 - 0.9)},${n(-h / 2 + 0.3)}H${n(w / 2 + 0.9)}M${n(-w / 2 - 0.9)},${n(h / 2 - 0.3)}H${n(w / 2 + 0.9)}" stroke="${ink(o, '#6E4E30')}" stroke-width="${o.render ? 0.45 : sw(o, 1.2)}"/>`;
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s += rr(x * (w / 2 - 0.3) - ps / 2, y * (h / 2 - 0.3) - ps / 2, ps, ps, 0, ink(o, '#4E3622'));
    return s;
  },
  grill(it, o) {
    const w = it.w, h = it.h, bw = w * 0.55;
    let gr = '';
    for (let x = -bw / 2 + 0.25; x < bw / 2; x += 0.25) gr += `M${n(x)},${n(-h / 2 + 0.35)}V${n(h / 2 - 0.35)}`;
    return shadowBox(o, w, h) + rr(-w / 2, -h / 2 + 0.3, w, h - 0.6, 0.1, pc(o, '#9AA0A5', '#F3F3F3'), ink(o, '#5F666B'), sw(o, 0.8)) +
      rr(-bw / 2, -h / 2, bw, h, 0.4, pc(o, '#2E2F31', '#fff'), ink(o, '#111'), sw(o, 1)) + `<path d="${gr}" stroke="${o.render ? '#6E6F72' : INK}" stroke-width="${sw(o, 0.4)}"/>`;
  },
  kitchen(it, o) {
    const w = it.w, h = it.h;
    let s = shadowBox(o, w, h) + rr(-w / 2, -h / 2, w, h, 0.1, pc(o, '#CFC6B4', '#F3F1EC'), ink(o, '#6E655A'), sw(o, 1));
    s += rr(-w * 0.32, -h / 2 + 0.35, w * 0.3, h - 0.7, 0.3, pc(o, '#2E2F31', '#fff'), ink(o, '#111'), sw(o, 0.8));
    let gr = '';
    for (let x = -w * 0.32 + 0.25; x < -w * 0.02; x += 0.25) gr += `M${n(x)},${n(-h / 2 + 0.55)}V${n(h / 2 - 0.55)}`;
    s += `<path d="${gr}" stroke="${o.render ? '#6E6F72' : INK}" stroke-width="${sw(o, 0.4)}"/>`;
    s += rr(w * 0.12, -h / 2 + 0.45, w * 0.18, h - 0.9, 0.3, pc(o, '#B9C2C8', '#fff'), ink(o, '#5F666B'), sw(o, 0.7)) + `<circle cx="${n(w * 0.21)}" cy="0" r="0.1" fill="${ink(o, '#5F666B')}"/>`;
    return s;
  },
  firepit(it, o) {
    const R = Math.min(it.w, it.h) / 2;
    let s = o.render && !o.icon ? `<circle cx="-0.3" cy="0.3" r="${n(R)}" fill="#0E1408" fill-opacity="0.35" filter="url(#ld-soft)"/>` : '';
    s += `<circle r="${n(R)}" fill="${o.render ? 'url(#ld-flagstone)' : pc(o, '', '#EDE6DA')}" stroke="${ink(o, '#5E564C')}" stroke-width="${sw(o, 1)}"/>`;
    s += `<circle r="${n(R * 0.62)}" fill="${o.render ? 'url(#ld-fire)' : '#fff'}" stroke="${ink(o, '#3A332B')}" stroke-width="${sw(o, 0.8)}"/>`;
    if (!o.render) s += `<path d="M${n(-R * 0.25)},${n(R * 0.2)}q${n(R * 0.1)},${n(-R * 0.45)} ${n(R * 0.25)},${n(-R * 0.5)}q${n(R * 0.15)},${n(R * 0.3)} ${n(R * 0.25)},${n(R * 0.5)}" fill="none" stroke="${INK}" stroke-width="${sw(o, 0.7)}"/>`;
    return s;
  },
  firetable(it, o) {
    const w = it.w, h = it.h;
    return shadowBox(o, w, h) + rr(-w / 2, -h / 2, w, h, 0.2, pc(o, '#8C8984', '#EDEDEA'), ink(o, '#3E3C39'), sw(o, 1)) +
      rr(-w * 0.32, -h * 0.32, w * 0.64, h * 0.64, 0.2, o.render ? 'url(#ld-fire)' : '#fff', ink(o, '#3A332B'), sw(o, 0.7));
  },
  pool(it, o, rng) {
    const w = it.w, h = it.h, c = 1.2, d = `M${n(-w / 2 + c)},${n(-h / 2 + c)}H${n(w / 2 - c)}V${n(h / 2 - c)}H${n(-w / 2 + c)}Z`;
    let s = rr(-w / 2, -h / 2, w, h, 0.4, o.render ? '#D8D0BF' : pc(o, '', '#F1EFEA'), ink(o, '#8E8676'), sw(o, 1));
    s += poolWater(d, o, rng, [-w / 2 + c, -h / 2 + c, w / 2 - c, h / 2 - c]) + `<path d="${d}" fill="none" stroke="${ink(o, '#3C82AE')}" stroke-width="${sw(o, 1)}"/>`;
    let st = '';
    for (let i = 1; i <= 3; i++) st += `M${n(-w / 2 + c)},${n(-h / 2 + c + i * 1)}H${n(-w / 2 + c + Math.min(6, w * 0.4))}`;
    return s + `<path d="${st}" stroke="${o.render ? '#fff' : INK}" stroke-opacity="${o.render ? 0.8 : 1}" stroke-width="${sw(o, 0.7)}"/>`;
  },
  pool_kidney(it, o, rng) {
    const w = it.w, h = it.h, outer = KIDNEY(w, h), inner = KIDNEY(w - 2.4, h - 2.4);
    return `<path d="${outer}" fill="${o.render ? '#D8D0BF' : pc(o, '', '#F1EFEA')}" stroke="${ink(o, '#8E8676')}" stroke-width="${sw(o, 1)}"/>` +
      poolWater(inner, o, rng, [-w / 2 + 1.2, -h / 2 + 1.2, w / 2 - 1.2, h / 2 - 1.2]) + `<path d="${inner}" fill="none" stroke="${ink(o, '#3C82AE')}" stroke-width="${sw(o, 1)}"/>`;
  },
  hottub(it, o, rng) {
    const w = it.w, h = it.h, c = 0.8;
    let s = shadowBox(o, w, h, 1) + rr(-w / 2, -h / 2, w, h, 1, pc(o, '#7A5B3C', '#EFE8DE'), ink(o, '#4E3622'), sw(o, 1));
    const d = `M${n(-w / 2 + c + 0.6)},${n(-h / 2 + c)}H${n(w / 2 - c - 0.6)}Q${n(w / 2 - c)},${n(-h / 2 + c)} ${n(w / 2 - c)},${n(-h / 2 + c + 0.6)}V${n(h / 2 - c - 0.6)}Q${n(w / 2 - c)},${n(h / 2 - c)} ${n(w / 2 - c - 0.6)},${n(h / 2 - c)}H${n(-w / 2 + c + 0.6)}Q${n(-w / 2 + c)},${n(h / 2 - c)} ${n(-w / 2 + c)},${n(h / 2 - c - 0.6)}V${n(-h / 2 + c + 0.6)}Q${n(-w / 2 + c)},${n(-h / 2 + c)} ${n(-w / 2 + c + 0.6)},${n(-h / 2 + c)}Z`;
    s += poolWater(d, o, rng, [-w / 2 + c, -h / 2 + c, w / 2 - c, h / 2 - c]) + `<path d="${d}" fill="none" stroke="${ink(o, '#3C82AE')}" stroke-width="${sw(o, 0.8)}"/>`;
    s += `<circle r="${n(Math.min(w, h) * 0.22)}" fill="none" stroke="${o.render ? '#fff' : INK}" stroke-opacity="${o.render ? 0.6 : 1}" stroke-width="${sw(o, 0.6)}"/>`;
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s += `<circle cx="${n(x * (w / 2 - c - 0.7))}" cy="${n(y * (h / 2 - c - 0.7))}" r="0.15" fill="${o.render ? '#fff' : INK}"/>`;
    return s;
  },
  playset(it, o) {
    const w = it.w, h = it.h, dk = Math.min(w * 0.4, h * 0.55);
    const x0 = -w / 2, y0 = -h / 2;
    let s = shadowBox(o, dk, dk);
    // slide running out from the deck
    s += rr(x0 + dk - 0.2, y0 + dk * 0.3, w - dk + 0.2, 1.8, 0.9, pc(o, '#2F8F4E', '#E6F2E9'), ink(o, '#1D5F33'), sw(o, 0.9)) + `<path d="M${n(x0 + dk)},${n(y0 + dk * 0.3 + 0.9)}H${n(w / 2 - 0.9)}" stroke="${o.render ? '#7FC796' : INK}" stroke-width="${sw(o, 0.5)}"/>`;
    // climbing wall / ladder below the deck
    s += rr(x0 + dk * 0.2, y0 + dk - 0.1, dk * 0.6, h - dk + 0.1, 0.1, pc(o, '#B98A5A', '#F1E6D6'), ink(o, '#5E4129'), sw(o, 0.8));
    for (let y = y0 + dk + 0.6; y < h / 2 - 0.2; y += 0.8) s += `<circle cx="${n(x0 + dk * 0.35)}" cy="${n(y)}" r="0.14" fill="${pc(o, '#E2552F', INK)}"/><circle cx="${n(x0 + dk * 0.65)}" cy="${n(y + 0.4)}" r="0.14" fill="${pc(o, '#F2B705', INK)}"/>`;
    // deck with a striped roof
    s += rr(x0, y0, dk, dk, 0.1, pc(o, '#A97B4D', '#F1E6D6'), ink(o, '#4E3622'), sw(o, 1));
    if (o.render) for (let i = 0; i < 6; i++) s += `<path d="M${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + (i < 3 ? dk * i / 2 : dk))},${n(y0 + (i < 3 ? 0 : dk * (i - 3) / 2))}" stroke="none"/>`;
    s += `<path d="M${n(x0)},${n(y0)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk)},${n(y0)}M${n(x0)},${n(y0 + dk)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk)},${n(y0 + dk)}" stroke="${ink(o, '#4E3622')}" stroke-width="${sw(o, 0.7)}" fill="none"/>`;
    if (o.render) s += `<path d="M${n(x0)},${n(y0)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk)},${n(y0)}Z" fill="#2F7DB8" fill-opacity="0.85"/><path d="M${n(x0)},${n(y0 + dk)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk)},${n(y0 + dk)}Z" fill="#2F7DB8" fill-opacity="0.7"/>`;
    return s;
  },
  swing(it, o) {
    const w = it.w, h = it.h, n2 = Math.max(1, Math.round((w - 2) / 3.2));
    let s = `<path d="M${n(-w / 2)},${n(-h / 2)}L${n(-w / 2 + 1)},0L${n(-w / 2)},${n(h / 2)}M${n(w / 2)},${n(-h / 2)}L${n(w / 2 - 1)},0L${n(w / 2)},${n(h / 2)}" stroke="${ink(o, '#5E4129')}" stroke-width="${o.render ? 0.4 : sw(o, 1.2)}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${n(-w / 2 + 1)},0H${n(w / 2 - 1)}" stroke="${ink(o, '#6E4E30')}" stroke-width="${o.render ? 0.5 : sw(o, 1.4)}"/>`;
    for (let i = 0; i < n2; i++) { const x = -w / 2 + 1 + (w - 2) * (i + 0.5) / n2; s += rr(x - 0.8, -0.35, 1.6, 0.7, 0.2, pc(o, ['#E2552F', '#2F7DB8', '#F2B705'][i % 3], '#fff'), ink(o, '#222'), sw(o, 0.6)); }
    return s;
  },
  sandbox(it, o) {
    const w = it.w, h = it.h;
    return shadowBox(o, w, h) + rr(-w / 2, -h / 2, w, h, 0.1, pc(o, '#A97B4D', '#F1E6D6'), ink(o, '#4E3622'), sw(o, 1)) +
      rr(-w / 2 + 0.4, -h / 2 + 0.4, w - 0.8, h - 0.8, 0.05, o.render ? 'url(#ld-sand)' : '#fff', o.render ? '' : INK, sw(o, 0.5)) + (o.render ? '' : rr(-w / 2 + 0.4, -h / 2 + 0.4, w - 0.8, h - 0.8, 0.05, 'url(#dd-dots)'));
  },
  trampoline(it, o) {
    const R = Math.min(it.w, it.h) / 2;
    return (o.render && !o.icon ? `<circle cx="-0.5" cy="0.5" r="${n(R)}" fill="#0E1408" fill-opacity="0.28" filter="url(#ld-soft)"/>` : '') +
      `<circle r="${n(R)}" fill="${pc(o, '#2F7DB8', '#E6F0F8')}" stroke="${ink(o, '#1F5A86')}" stroke-width="${sw(o, 1)}"/>` +
      `<circle r="${n(R * 0.82)}" fill="${pc(o, '#232527', '#fff')}" stroke="${ink(o, '#111')}" stroke-width="${sw(o, 0.6)}"/>` +
      `<circle r="${n(R * 0.95)}" fill="none" stroke="${o.render ? '#fff' : INK}" stroke-opacity="${o.render ? 0.5 : 1}" stroke-width="${sw(o, 0.5)}" stroke-dasharray="${n(R * 0.08)} ${n(R * 0.08)}"/>`;
  },
};

for (const [k, v] of Object.entries(FURN_T)) T[k] = Object.assign({ id: k, kind: 'box', furn: true }, v, { d: Object.assign({}, v.d) });
T.poolShape = Object.assign({ id: 'poolShape', kind: 'shape', furn: true, d: { smooth: true } }, poolT);


/* ------------------------------------------------------------------ generated textures
 * Realistic surfaces (turf, mulch, gravel, concrete, foliage, stone grain) are small bitmap tiles painted once at
 * start-up and used by the SVG patterns below. They are seeded, so every run and every export looks the same, each
 * tile wraps seamlessly, and nothing is downloaded. If a canvas is not available the vector fallbacks are used. */
function mixHex(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t);
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}
const rgbOf = (hex) => { const v = parseInt(hex.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
/* smooth noise in 0..1 that repeats every `size` pixels (so a tile made from it has no seams) */
function tileNoise(size, cells, rng) {
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  const out = new Float32Array(size * size), k = cells / size;
  const xi = new Int32Array(size), xj = new Int32Array(size), xt = new Float32Array(size);
  for (let x = 0; x < size; x++) { const f = x * k, i = Math.floor(f), t = f - i; xi[x] = i % cells; xj[x] = (i + 1) % cells; xt[x] = t * t * (3 - 2 * t); }
  for (let y = 0; y < size; y++) {
    const r0 = xi[y] * cells, r1 = xj[y] * cells, ty = xt[y], row = y * size;
    for (let x = 0; x < size; x++) {
      const a = g[r0 + xi[x]], b = g[r0 + xj[x]], c = g[r1 + xi[x]], d = g[r1 + xj[x]], tx = xt[x];
      out[row + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  }
  return out;
}
/* run draw(x, y) for the point and for its wrapped copies, so shapes that cross an edge continue on the other side */
function wrapped(S, x, y, pad, draw) {
  for (const ox of x < pad ? [0, S] : x > S - pad ? [0, -S] : [0]) for (const oy of y < pad ? [0, S] : y > S - pad ? [0, -S] : [0]) draw(x + ox, y + oy);
}
/* a grass's library color, pulled toward the deeper, less yellow green real turf has from above */
const turfColor = (c) => tone(c, 0.24, -0.055, 4);
function makeTextures() {
  if (typeof document === 'undefined') return null;
  try {
    const R = rngFor('textures'), out = {};
    const canvas = (S) => { const c = document.createElement('canvas'); c.width = c.height = S; return [c, c.getContext('2d')]; };
    /* a light/dark overlay: v > 0 paints `hi` and v < 0 paints `lo`, each as strong as |v| */
    const overlay = (S, fn, hi, lo, aHi, aLo) => {
      const [c, g] = canvas(S), im = g.createImageData(S, S), px = im.data;
      for (let i = 0; i < S * S; i++) {
        const v = fn(i), col = v > 0 ? hi : lo, a = Math.min(1, Math.abs(v)) * (v > 0 ? aHi : aLo);
        px[i * 4] = col[0]; px[i * 4 + 1] = col[1]; px[i * 4 + 2] = col[2]; px[i * 4 + 3] = Math.round(a * 255);
      }
      g.putImageData(im, 0, 0);
      return [c, g];
    };
    /* an opaque tile: base color pushed lighter or darker by v */
    const solid = (S, base, fn, amt) => {
      const [c, g] = canvas(S), im = g.createImageData(S, S), px = im.data, b = rgbOf(base);
      for (let i = 0; i < S * S; i++) { const v = 1 + fn(i) * amt; px[i * 4] = Math.min(255, b[0] * v); px[i * 4 + 1] = Math.min(255, b[1] * v); px[i * 4 + 2] = Math.min(255, b[2] * v); px[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0);
      return [c, g];
    };

    /* turf: mottled tone, fine grain and thousands of short blades; laid over each grass's own color */
    {
      const S = 384, a = tileNoise(S, 5, R), b = tileNoise(S, 16, R), c2 = tileNoise(S, 56, R);
      const [c, g] = overlay(S, (i) => (a[i] - 0.5) * 0.2 + (b[i] - 0.5) * 0.85 + (c2[i] - 0.5) * 0.95 + (R() - 0.5) * 0.7, [204, 232, 104], [0, 70, 20], 0.26, 0.36);
      g.lineCap = 'round';
      for (let i = 0; i < 9000; i++) {
        const x = R() * S, y = R() * S, ang = -Math.PI / 2 + (R() - 0.5) * 1.5, L = 2 + R() * 4.5, lit = R() < 0.5;
        g.strokeStyle = lit ? `rgba(214,244,104,${0.12 + R() * 0.2})` : `rgba(0,62,14,${0.12 + R() * 0.2})`;
        g.lineWidth = 0.8 + R() * 0.6;
        wrapped(S, x, y, 8, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(ang) * L, py + Math.sin(ang) * L); g.stroke(); });
      }
      out.turf = c.toDataURL('image/png');
    }
    /* large, soft tone changes for big lawns: a 37 ft tile, so it never lines up with the 10 ft turf tile */
    {
      const S = 128, a = tileNoise(S, 4, R), b = tileNoise(S, 9, R);
      out.mottle = overlay(S, (i) => (a[i] - 0.5) * 1.5 + (b[i] - 0.5) * 0.9, [222, 244, 110], [0, 66, 20], 0.15, 0.17)[0].toDataURL('image/png');
    }
    /* foliage: leaf clusters, each lit on its sunny side with a dark gap behind it; laid over each canopy's own color */
    const foliageTile = (hi, lo) => {
      const S = 256, a = tileNoise(S, 6, R), b = tileNoise(S, 24, R);
      const [c, g] = overlay(S, (i) => (a[i] - 0.5) * 0.9 + (b[i] - 0.5) * 0.8 + (R() - 0.5) * 0.5, hi, lo, 0.2, 0.3);
      const rgba = (col, al) => `rgba(${col[0]},${col[1]},${col[2]},${al})`;
      for (let i = 0; i < 1500; i++) {
        const x = R() * S, y = R() * S, r = 2.2 + R() * 6;
        wrapped(S, x, y, 12, (px, py) => {
          let gr = g.createRadialGradient(px - r * 0.3, py + r * 0.3, 0, px - r * 0.3, py + r * 0.3, r);   // the dark gap on the side away from the sun
          gr.addColorStop(0, rgba(lo, 0.42)); gr.addColorStop(0.6, rgba(lo, 0.16)); gr.addColorStop(1, rgba(lo, 0));
          g.fillStyle = gr; g.beginPath(); g.arc(px - r * 0.3, py + r * 0.3, r, 0, 6.3); g.fill();
          gr = g.createRadialGradient(px + r * 0.3, py - r * 0.3, 0, px + r * 0.3, py - r * 0.3, r * 0.7);      // the sunlit leaf faces
          gr.addColorStop(0, rgba(hi, 0.42)); gr.addColorStop(1, rgba(hi, 0));
          g.fillStyle = gr; g.beginPath(); g.arc(px + r * 0.3, py - r * 0.3, r * 0.7, 0, 6.3); g.fill();
        });
      }
      return c.toDataURL('image/png');
    };
    out.leaf = foliageTile([206, 240, 96], [0, 46, 14]);
    out.leafN = foliageTile([255, 244, 206], [26, 12, 10]);
    /* grain: fine light/dark speckle that takes the flatness out of stone, brick, wood and concrete */
    {
      const S = 256, b = tileNoise(S, 20, R), a = tileNoise(S, 5, R);
      const [c] = overlay(S, (i) => (a[i] - 0.5) * 0.12 + (b[i] - 0.5) * 0.45 + (R() - 0.5) * 1.3, [255, 248, 230], [20, 12, 4], 0.13, 0.26);
      out.grain = c.toDataURL('image/png');
    }
    /* mulch: shredded bark chips with their own small shadows */
    {
      const S = 256, a = tileNoise(S, 6, R);
      const [c, g] = solid(S, '#5E3A22', (i) => (a[i] - 0.5) * 1.2 + (R() - 0.5), 0.22);
      const chips = ['#7C4A2A', '#5A331C', '#8E5730', '#4A2A17', '#9C6538', '#6C3F24', '#A9703E', '#55301B'];
      for (let i = 0; i < 2600; i++) {
        const x = R() * S, y = R() * S, ang = R() * Math.PI, L = 4 + R() * 8, w = 1.4 + R() * 2.2, col = chips[Math.floor(R() * chips.length)];
        wrapped(S, x, y, 12, (px, py) => {
          g.save(); g.translate(px, py); g.rotate(ang);
          g.fillStyle = 'rgba(16,6,2,0.45)'; g.fillRect(-L / 2 - 0.6, -w / 2 + 0.9, L, w);
          g.fillStyle = col; g.fillRect(-L / 2, -w / 2, L, w);
          g.fillStyle = 'rgba(255,230,190,0.13)'; g.fillRect(-L / 2, -w / 2, L, w * 0.35);
          g.restore();
        });
      }
      out.mulch = c.toDataURL('image/jpeg', 0.86);
    }
    /* soil, concrete, sand: mottled, speckled flats */
    {
      const S = 128, a = tileNoise(S, 5, R), b = tileNoise(S, 20, R);
      out.soil = solid(S, '#4B3828', (i) => (a[i] - 0.5) * 1.1 + (b[i] - 0.5) * 0.8 + (R() - 0.5) * 1.2, 0.26)[0].toDataURL('image/jpeg', 0.86);
      out.sand = solid(S, '#E2D2A4', (i) => (a[i] - 0.5) * 0.7 + (R() - 0.5) * 0.9, 0.09)[0].toDataURL('image/jpeg', 0.88);
    }
    {
      const S = 256, a = tileNoise(S, 4, R), b = tileNoise(S, 14, R);
      const [c, g] = solid(S, '#CFCCC4', (i) => (a[i] - 0.5) * 0.9 + (b[i] - 0.5) * 0.5 + (R() - 0.5) * 0.7, 0.085);
      for (let i = 0; i < 500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(90,86,78,0.28)' : 'rgba(255,255,255,0.3)'; g.fillRect(R() * S, R() * S, 1 + R(), 1 + R()); }
      out.concrete = c.toDataURL('image/jpeg', 0.88);
    }
    /* gravel: packed pebbles, each with a shadow and a highlight */
    {
      const S = 256;
      const [c, g] = solid(S, '#8E867A', () => R() - 0.5, 0.2);
      const peb = ['#CFC8BA', '#B5AC9C', '#E2DCD0', '#9C9383', '#C4B9A5', '#8C8476', '#D8CFC0', '#A89F8F', '#BDB5A8'];
      for (let i = 0; i < 2300; i++) {
        const x = R() * S, y = R() * S, rx = 1.8 + R() * 3.4, ry = rx * (0.6 + R() * 0.35), ang = R() * Math.PI, col = peb[Math.floor(R() * peb.length)];
        wrapped(S, x, y, 8, (px, py) => {
          g.fillStyle = 'rgba(30,26,20,0.5)'; g.beginPath(); g.ellipse(px - 0.7, py + 0.8, rx, ry, ang, 0, 6.3); g.fill();
          g.fillStyle = col; g.beginPath(); g.ellipse(px, py, rx, ry, ang, 0, 6.3); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(px + rx * 0.25, py - ry * 0.25, rx * 0.45, ry * 0.4, ang, 0, 6.3); g.fill();
        });
      }
      out.gravel = c.toDataURL('image/jpeg', 0.86);
    }
    for (const k of Object.keys(out)) if (!/^data:image\//.test(out[k]) || out[k].length < 200) return null;
    return out;
  } catch (e) { return null; }
}
const TX = makeTextures();

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
  const img = (id, key, size) => `<image id="${id}" width="${size}" height="${size}" preserveAspectRatio="none" href="${TX[key]}"/>`;
  /* fine grain laid straight over a tile (4 ft image, repeated to cover larger tiles); a nested pattern here leaves gaps on stroked paths */
  const grain = (w, h) => { if (!TX) return ''; let g = ''; for (let x = 0; x < w; x += 4) for (let y = 0; y < h; y += 4) g += `<use href="#tx-grain" x="${x}" y="${y}"/>`; return g; };
  if (TX) {
    d += img('tx-turf', 'turf', 10) + img('tx-mottle', 'mottle', 37) + img('tx-leaf', 'leaf', 7) + img('tx-leafN', 'leafN', 7) + img('tx-grain', 'grain', 4) + img('tx-mulch', 'mulch', 4) + img('tx-soil', 'soil', 2) + img('tx-gravel', 'gravel', 3) + img('tx-concrete', 'concrete', 6) + img('tx-sand', 'sand', 2);
    // lawns: each grass keeps its own (muted, natural) color under the shared turf texture; mowing stripes are only a hint
    for (const p of PLANTS.filter((x) => x.t === 'turf')) d += pat('ld-lawn-' + p.id, 10, 10, `<rect width="10" height="10" fill="${turfColor(p.c)}"/><use href="#tx-turf"/><rect width="5" height="10" fill="#0A2A0A" fill-opacity="0.055"/><rect x="5" width="5" height="10" fill="#F4FFD0" fill-opacity="0.11"/>`);
    d += pat('ld-mottle', 37, 37, '<use href="#tx-mottle"/>');
    d += pat('ld-mulch', 4, 4, '<use href="#tx-mulch"/>') + pat('ld-soil', 2, 2, '<use href="#tx-soil"/>') + pat('ld-gravel', 3, 3, '<use href="#tx-gravel"/>');
    d += pat('ld-grain', 4, 4, '<use href="#tx-grain"/>') + pat('ld-leafA', 7, 7, '<use href="#tx-leaf"/>') + pat('ld-leafB', 3, 3, '<use href="#tx-leaf" transform="scale(0.42857)"/>');
    d += pat('ld-leafy', 3, 3, '<use href="#tx-leaf" transform="scale(0.42857)"/>');
    d += pat('ld-leafNA', 7, 7, '<use href="#tx-leafN"/>') + pat('ld-leafNB', 3, 3, '<use href="#tx-leafN" transform="scale(0.42857)"/>');
  } else {
    for (const p of PLANTS.filter((x) => x.t === 'turf')) {
      const a = turfColor(p.c), b = shade(a, 0.06);
      d += pat('ld-lawn-' + p.id, 10, 10, `<rect width="5" height="10" fill="${a}"/><rect x="5" width="5" height="10" fill="${b}"/>` + specks(10, 10, 140, [shade(a, -0.18), shade(a, 0.2), shade(a, -0.08)], 0.04, 0.09));
    }
    d += pat('ld-mulch', 3, 3, `<rect width="3" height="3" fill="#6B4A32"/>` + specks(3, 3, 70, ['#4E3322', '#87603F', '#5C3D28', '#9A7150'], 0.05, 0.12));
    d += pat('ld-soil', 2, 2, `<rect width="2" height="2" fill="#5D4330"/>` + specks(2, 2, 30, ['#4A3424', '#715239'], 0.04, 0.09));
    d += pat('ld-gravel', 2, 2, `<rect width="2" height="2" fill="#D8D1C2"/>` + specks(2, 2, 60, ['#B9AF9C', '#EDE7DA', '#A39985', '#CFC6B4'], 0.05, 0.13));
    d += pat('ld-leafy', 1.2, 1.2, specks(1.2, 1.2, 26, ['rgba(0,0,0,.22)', 'rgba(255,255,255,.18)', 'rgba(0,0,0,.12)'], 0.06, 0.16));
    d += pat('ld-grain', 4, 4, '') + pat('ld-leafA', 7, 7, '') + pat('ld-leafB', 3, 3, '') + pat('ld-leafNA', 7, 7, '') + pat('ld-leafNB', 3, 3, '') + pat('ld-mottle', 37, 37, '');
  }
  d += pat('ld-concrete', 5, 5, (TX ? '<use href="#tx-concrete"/>' : `<rect width="5" height="5" fill="#D9D6CE"/>` + specks(5, 5, 50, ['#CBC7BD', '#E4E1DA'], 0.04, 0.1)) +
    `<path d="M0,0H5M0,0V5" stroke="#8F8A7E" stroke-width="0.09"/><path d="M0.07,0.07H5M0.07,0.07V5" stroke="#fff" stroke-opacity="0.35" stroke-width="0.05"/>`);
  {
    const tones = ['#A64B32', '#9B4530', '#B0573B', '#A1492F', '#8E3F2B', '#B5603F', '#964431'];
    let body = '<rect width="4" height="4" fill="#7A3625"/>';
    for (let r = 0; r < 12; r++) for (let c = -1; c < 6; c++) {
      const x = c * 0.6667 + (r % 2 ? 0.3333 : 0) + 0.02, y = r * 0.3333 + 0.02, key = ((c + 6) % 6) * 7 + r * 13;
      body += `<rect x="${n(x)}" y="${n(y)}" width="0.627" height="0.293" fill="${tones[(key * 31 + (key >> 2)) % tones.length]}"/>`;
    }
    d += pat('ld-brick', 4, 4, body + grain(4, 4));
  }
  let pv = '<rect width="2" height="2" fill="#8F877A"/>';
  pv = '<rect width="4" height="4" fill="#8F877A"/>';
  ['#C9C1B2', '#BDB4A3', '#D3CCBE', '#C3BAA8', '#CEC6B6', '#B8AF9E', '#D6CFC2', '#C0B7A6'].forEach((c, i, all) => { for (let k = 0; k < 2; k++) { const j = i + k * 8, x = j % 4, y = Math.floor(j / 4); pv += `<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.06" fill="${all[(i * 3 + k * 5 + y) % all.length]}"/>`; } });
  d += pat('ld-pavers', 4, 4, pv + grain(4, 4));
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
    d += pat('ld-flagstone', S, S, body + grain(S, S));
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
    d += pat('ld-stone', 8, 6, body + grain(8, 6));
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
    d += pat('ld-deck', 12, 1.5, body + grain(12, 1.5));
  }
  d += pat('ld-asphalt', 4, 4, grain(4, 4));
  d += pat('ld-shingle2', 4, 4, grain(4, 4) + '<path d="M0,0.4H4M0,1.2H4M0,2H4M0,2.8H4M0,3.6H4" stroke="#000" stroke-opacity="0.09" stroke-width="0.05"/>');
  d += pat('ld-roof', 3, 3, '<rect width="3" height="3" fill="#C9C3B8"/>' + grain(3, 3) + '<path d="M0,0.72H3M0,1.47H3M0,2.22H3M0,2.97H3M0.4,0V0.72M1.9,0V0.72M1.15,0.72V1.47M2.65,0.72V1.47M0.4,1.47V2.22M1.9,1.47V2.22M1.15,2.22V2.97M2.65,2.22V2.97" stroke="#A8A195" stroke-width="0.045"/>');
  d += '<linearGradient id="ld-pool" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FD3EE"/><stop offset="0.55" stop-color="#4FB0DA"/><stop offset="1" stop-color="#2E86B8"/></linearGradient>';
  d += '<radialGradient id="ld-fire"><stop offset="0" stop-color="#FFE08A"/><stop offset="0.35" stop-color="#F59A2A"/><stop offset="0.7" stop-color="#C2411B"/><stop offset="1" stop-color="#2B201A"/></radialGradient>';
  d += TX ? pat('ld-sand', 2, 2, '<use href="#tx-sand"/>') : pat('ld-sand', 1.5, 1.5, '<rect width="1.5" height="1.5" fill="#E8D7A8"/>' + specks(1.5, 1.5, 24, ['#D6C28E', '#F2E6C4', '#CBB57D'], 0.03, 0.07));
  d += pat('dd-water', 3, 1.5, `<path d="M0,0.75q0.75,-0.35 1.5,0t1.5,0" stroke="${INK}" stroke-width="0.05" fill="none"/>`);
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
  d += '<filter id="ld-softw" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="0.35"/></filter>';
  d += '<radialGradient id="ld-dome" cx="0.66" cy="0.32" r="0.86"><stop offset="0" stop-color="#FFF3A8" stop-opacity="0.26"/><stop offset="0.38" stop-color="#FFF3A8" stop-opacity="0.04"/><stop offset="0.62" stop-color="#021208" stop-opacity="0.1"/><stop offset="1" stop-color="#021208" stop-opacity="0.52"/></radialGradient>';
  d += '<radialGradient id="ld-water" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#BFE3F5"/><stop offset="0.6" stop-color="#6FB3D8"/><stop offset="1" stop-color="#3C82AE"/></radialGradient>';
  d += furnDefs(pat, specks, R);
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
/* the shadow a building throws */
const castShadow = (d, dx, dy, op) => `<path d="${d}" transform="translate(${n(-dx)} ${n(dy)})" fill="#06100A" fill-opacity="${n(Math.min(0.6, op * 1.35))}" filter="url(#ld-soft)"/>`;
/* plant shadows: the few big crowns get a true blur; the many small plants get stacked copies, which fade the edge
 * almost as well at that size and cost a fraction of a filter to draw */
const shadowOf = (d, r, o, op) => {
  if (o.icon) return '';
  const tr = `translate(${n(-0.2 * r - 0.25)} ${n(0.12 * r + 0.15)})`;
  if (r >= 4) return `<path d="${d}" transform="${tr}" fill="#06120A" fill-opacity="${n(Math.min(0.6, (op || 0.32) * 1.4))}" filter="url(#ld-soft)"/>`;
  return `<g transform="${tr}" fill="#06120A" fill-opacity="${n((op || 0.32) * 0.46)}"><path d="${d}" transform="scale(1.1)"/><path d="${d}" transform="scale(1.03)"/><path d="${d}" transform="scale(0.95)"/><path d="${d}" transform="scale(0.86)"/></g>`;
};
function foliage(r, c, rng, count, size) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rng() * 2 * Math.PI, dd = Math.sqrt(rng()) * r * 0.68, cr = r * (size + rng() * size * 0.8);
    const light = Math.cos(a) * 0.5 - Math.sin(a) * 0.3 + (rng() - 0.5) > 0;
    s += `<path d="${lobed(cr, 6, rng, 0.25)}" transform="translate(${n(dd * Math.cos(a))} ${n(dd * Math.sin(a))})" fill="${light ? tone(c, 0.14, 0.1, -6) : tone(c, 0.1, -0.15, 8)}" fill-opacity="0.45"/>`;
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
/* Leaf masses. At plan scale a canopy reads as clusters of sunlit and shaded foliage, not single leaves, so each
 * call paints soft clumps (lit toward the sun, upper right) whose outline hints at the leaf: sharp for maples and
 * hollies, rounded for the rest. The fine leaf detail comes from the foliage texture laid over the crown. */
function leaves(shape, R, count, size, rng, c, spread, op) {
  const k = clamp(Math.round(count * 0.42), 6, 30), cr0 = Math.max(size * 1.5, R * 0.11), sharp = shape === 'palm' || shape === 'star';
  let lit = '', dark = '';
  for (let i = 0; i < k; i++) {
    const cr = cr0 * (0.7 + rng() * 0.8), a = rng() * 2 * Math.PI, d = Math.sqrt(rng()) * Math.max(0, R * (spread || 0.85) - cr * 0.7);
    const light = Math.cos(a) * 0.6 - Math.sin(a) * 0.3 + (rng() - 0.5) * 0.9;
    const p = `<path d="${sharp ? pointy(cr, 7, rng, 0.22) : lobed(cr, 6, rng, 0.3)}" transform="translate(${n(d * Math.cos(a))} ${n(d * Math.sin(a))})"/>`;
    if (light > 0) lit += p; else dark += p;
  }
  const f = Math.min(1, (op || 0.85) + 0.1);
  return `<g fill="${tone(c, 0.1, -0.17, 8)}" fill-opacity="${n(0.5 * f)}">${dark}</g><g fill="${tone(c, 0.14, 0.1, -6)}" fill-opacity="${n(0.44 * f)}">${lit}</g>`;
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
/* a crown: its own color with a thin, soft edge (a heavy dark outline is what makes a symbol look like a cartoon) */
const outlineFill = (D, c, o, extra) => `<path d="${D}" fill="${c}" stroke="${shade(c, -0.55)}" stroke-opacity="0.9" stroke-width="${n(o.u * 0.75)}"${extra || ''}/>`;
let leafTex = 'ld-leafA';   // foliage texture for the plant being drawn: coarser for trees, finer for shrubs
const dome = (D) => `<path d="${D}" fill="url(#${leafTex})"/><path d="${D}" fill="url(#ld-dome)"/>`;
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
    if (sp.ac) for (let i = 0, k = Math.round(5 + r * 0.7); i < k; i++) { const a = rng() * 6.283, d = Math.sqrt(rng()) * r * 0.8; s += `<path d="${pointy(Math.max(0.35, r * 0.055) * (0.7 + rng() * 0.7), 6, rng, 0.3)}" transform="translate(${n(d * Math.cos(a))} ${n(d * Math.sin(a))})" fill="${shade(sp.ac, (rng() - 0.5) * 0.2)}" fill-opacity="0.85"/>`; }
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
        const t = j / 3.2, x = L * t * Math.cos(a), y = L * t * Math.sin(a), cr = r * (0.11 + 0.03 * j);
        let fan = '';
        fan += `<path d="${lobed(cr * 1.05, 7, rng, 0.25)}" transform="translate(${n(x)} ${n(y)})" fill="${shade(c, -0.2)}" fill-opacity="0.7"/><path d="${lobed(cr * 0.8, 6, rng, 0.3)}" transform="translate(${n(x + cr * 0.15)} ${n(y - cr * 0.15)})" fill="${shade(c, 0.12)}" fill-opacity="0.8"/>`;
        for (let m = 0, cnt = 3 + j; m < cnt; m++) {
          const b = rng() * 6.283, dd = Math.sqrt(rng()) * cr;
          fan += `<path d="${LEAF.fan}" transform="${at(x + dd * Math.cos(b), y + dd * Math.sin(b), b * 180 / Math.PI + 90, Math.max(0.35, r * 0.06))}" fill="${shade(c, (rng() - 0.3) * 0.36)}"/>`;
        }
        cl += fan;
      }
    }
    return s + `<path d="${lim}" stroke="#5A4632" stroke-width="${n(Math.max(0.12, r * 0.022))}" stroke-linecap="round" fill="none"/><g fill-opacity="0.92">${cl}</g><path d="${D}" fill="url(#${leafTex})" fill-opacity="0.7"/>` + trunks(r, 1);
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
    [0.72, 0.45].forEach((f, i) => { s += `<path d="${lobed(r * f, 9, rng, 0.12)}" fill="${shade(c, 0.1 + i * 0.08)}" fill-opacity="0.8"/>`; });
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
    [0.78, 0.56, 0.34].forEach((f, i) => { s += `<path d="${lobed(r * f, clamp(Math.round(r * 3 * f), 8, 30), rng, 0.15)}" fill="${shade(c, 0.07 * (i + 1))}" stroke="${shade(c, -0.35)}" stroke-opacity="0.45" stroke-width="${n(o.u * 0.4)}"/>`; });
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
        s += `<g transform="${at(R * Math.cos(a), R * Math.sin(a), a * 180 / Math.PI + 90, r * 0.2)}"><path d="${LEAF.oval}" fill="${shade(c, 0.05 + ring * 0.07)}" stroke="${shade(c, -0.35)}" stroke-opacity="0.6" stroke-width="0.03"/><path d="M0,-0.9V0.9" stroke="${shade(c, 0.4)}" stroke-opacity="0.7" stroke-width="0.04"/></g>`;
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
    const s = shadowOf(D, r, o, 0.35) + outlineFill(D, c, o) + foliage(r, c, rng, clamp(Math.round(5 + r * 1.5), 5, 12), 0.16);
    return s + dome(D) + blooms(r, sp.fl, rng, Math.round(3 + r * 2), Math.max(0.1, r * 0.05));
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
  const sp0 = spOf(it) || PLANT_BY_ID[def];
  const sp = Object.assign({}, sp0, { c: tone(sp0.c, 0.32, -0.045) }, sp0.fl ? { fl: tone(sp0.fl, 0.2, 0) } : {}, sp0.ac ? { ac: tone(sp0.ac, 0.25, 0) } : {});
  leafTex = (isGreen(sp0.c) ? 'ld-leaf' : 'ld-leafN') + (it.r < 5 ? 'B' : 'A');
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
    const R = `x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}"`;
    return `<rect ${R} fill="url(#ld-lawn-${sp.id})" stroke="#2C4A1E" stroke-opacity="0.5" stroke-width="${n(o.u * 0.6)}"/>` + (o.icon ? '' : `<rect ${R} fill="url(#ld-mottle)"/>`);
  },
  path(it, o) {   // a filled outline, not a textured stroke: browsers drop part of a texture on a single straight stroked line
    const w = it.width || 4, f = it.finish || 'concrete', d = ribbonD(it.pts, w);
    const fill = f === 'mulch' ? 'url(#ld-mulch)' : finishFill(f, o);
    return `<path d="${d}" fill="${fill}" stroke="#5F574C" stroke-opacity="0.85" stroke-width="${n(o.u * 0.9)}" stroke-linejoin="round"/>`;
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
/* the outline of a line of constant width, with mitered corners (capped so sharp turns don't spike) */
function ribbonD(pts, w) {
  const P = pts.filter((p, i) => !i || dist(p, pts[i - 1]) > 0.01), h = w / 2;
  if (P.length < 2) return '';
  const side = (sg) => P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const d1 = i ? [p[0] - a[0], p[1] - a[1]] : [b[0] - p[0], b[1] - p[1]], d2 = i < P.length - 1 ? [b[0] - p[0], b[1] - p[1]] : d1;
    const l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1;
    const n1 = [-d1[1] / l1, d1[0] / l1], n2 = [-d2[1] / l2, d2[0] / l2];
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.2, mx * n1[0] + my * n1[1]));
    return [p[0] + mx * h * k * sg, p[1] + my * h * k * sg];
  });
  return ptsD(side(1).concat(side(-1).reverse())) + 'Z';
}
function fencePosts(pts, gap) {
  gap = gap || 8;
  const L = polyLen(pts), posts = [];
  for (let k = 0; k <= Math.floor(L / gap); k++) posts.push(pointAlong(pts, k * gap));
  return posts.concat(pts);
}
/* plant clumps on a jittered hex grid inside a test function */
/* one plant clump (rendered) */
function clump(sp, px, py, rng, o, spc) {
  const kind = sp.t, rr = spc * (kind === 'annual' ? 0.5 : kind === 'groundcover' ? 0.55 : 0.46), c = tone(sp.c, 0.3, -0.04);
  let s = `<g transform="translate(${n(px)} ${n(py)})"><path d="${lobed(rr, kind === 'groundcover' ? 9 : 6, rng, 0.2)}" fill="${shade(c, (rng() - 0.5) * 0.18)}" stroke="${shade(c, -0.4)}" stroke-opacity="0.6" stroke-width="${n(o.u * 0.4)}"/><path d="${lobed(rr * 0.55, 5, rng, 0.3)}" transform="translate(${n(rr * 0.16)} ${n(-rr * 0.16)})" fill="${tone(c, 0.15, 0.13, -8)}" fill-opacity="0.55"/>`;
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
    let s = `<path d="${d}" fill="${tone(sp.c, 0.3, -0.05)}" stroke="${shade(sp.c, -0.5)}" stroke-opacity="0.8" stroke-width="${n(o.u * 0.6)}"/><path d="${d}" fill="url(#ld-leafy)"/>`;
    if (sp.fl) { const ins = insideF(0.3); for (let i = 0, cnt = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 3); i < cnt; i++) { const x = bb[0] + rng() * (bb[2] - bb[0]), y = bb[1] + rng() * (bb[3] - bb[1]); if (ins(x, y)) s += `<circle cx="${n(x)}" cy="${n(y)}" r="0.14" fill="${sp.fl}"/>`; } }
    return s;
  }
  let s = `<path d="${d}" fill="none" stroke="#1A120A" stroke-opacity="0.22" stroke-width="0.4" stroke-linejoin="round"/><path d="${d}" fill="url(#ld-mulch)" stroke="#2A1C12" stroke-opacity="0.8" stroke-width="${n(o.u * 0.7)}"/>`;
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
  if (it.type === 'pondShape') return pondRender(it, o, rng);
  if (it.type === 'poolShape') {
    const poly = shapePoly(it.pts, it.smooth), xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
    if (o.render) return (o.icon ? '' : `<path d="${d}" transform="translate(-0.3 0.3)" fill="none" stroke="#0E1408" stroke-opacity="0.3" stroke-width="2.6" stroke-linejoin="round" filter="url(#ld-softw)"/>`) +
      `<path d="${d}" fill="none" stroke="#8E8676" stroke-width="2.62" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#ld-coping)" stroke-width="2.48" stroke-linejoin="round"/>` +
      poolCore(d, null, o, rng, (Math.max(...xs) - Math.min(...xs)) > (Math.max(...ys) - Math.min(...ys)) ? 'x' : 'y');
    return `<path d="${d}" fill="none" stroke="${o.render ? '#D8D0BF' : INK}" stroke-width="${o.render ? 2.4 : n(o.u * 1.2)}" stroke-linejoin="round"/>` +
      (o.render ? `<path d="${d}" fill="none" stroke="#8E8676" stroke-width="2.5" stroke-opacity="0.35" stroke-linejoin="round" transform="translate(0 0)"/>` : '') +
      poolWater(d, o, rngFor(it.id), [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]) + `<path d="${d}" fill="none" stroke="${o.render ? '#3C82AE' : INK}" stroke-width="${n(o.u)}"/>`;
  }
  if (it.type === 'building') {
    if (!o.render) return `<path d="${d}" fill="${o.color ? '#EFEEE9' : '#fff'}" stroke="${INK}" stroke-width="${n(Math.max(0.3, o.u * 2.6))}" stroke-linejoin="miter"/>`;
    return (o.icon ? '' : castShadow(d, 1.6, 0.9, 0.3)) +
      `<path d="${d}" fill="url(#ld-roof)" stroke="#2B2824" stroke-width="${n(Math.max(0.22, o.u * 1.8))}" stroke-linejoin="miter"/>`;
  }
  if (it.type === 'lawnShape') {
    const sp = spOf(it) || PLANT_BY_ID.cyda;
    if (!o.render) return `<path d="${d}" fill="${o.color ? T.lawnShape.tint : '#fff'}" stroke="${INK}" stroke-width="${n(o.u * 1.1)}"/><path d="${d}" fill="url(#dd-sparse)"/>`;
    return `<path d="${d}" fill="url(#ld-lawn-${sp.id})" stroke="#2C4A1E" stroke-opacity="0.5" stroke-width="${n(o.u * 0.6)}"/>` + (o.icon ? '' : `<path d="${d}" fill="url(#ld-mottle)"/>`);
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

/* ------------------------------------------------------------------ detailed rendered outdoor living items
 * Rendered style only; drafting styles keep the clean line symbols in FURN_D. Local feet around (0,0); sun from the south (page right), so shadows fall left. */
const DSH = (o, d, k) => (o.icon ? '' : `<path d="${d}" transform="translate(${n(-0.45 * (k || 1))} ${n(0.45 * (k || 1))})" fill="#0E1408" fill-opacity="0.3" filter="url(#ld-softw)"/>`);
const RR = (x, y, w, h, r) => roundRectD(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
const P = (d, fill, stroke, wd, extra) => `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${wd}"` : ''}${extra || ''}/>`;
const SHEEN = (d) => `<path d="${d}" fill="url(#ld-sheen)"/>`;
const PUFF = (d) => `<path d="${d}" fill="url(#ld-puff)"/>`;
/* a cushion: soft fill, puffed light, a piping seam */
function cushion(x, y, w, h, color, r) {
  const d = RR(x, y, w, h, r === undefined ? Math.min(w, h) * 0.22 : r);
  return P(d, color, shade(color, -0.35), 0.05) + PUFF(d) + P(RR(x + 0.12, y + 0.12, w - 0.24, h - 0.24, Math.min(w, h) * 0.18), 'none', shade(color, -0.18), 0.03, ' stroke-dasharray="0.12 0.08"');
}
/* dining chair seen from above: woven frame, seat cushion, back rail */
function chairR(x, y, w, h, rot, cush) {
  const fr = RR(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.18);
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot || 0)})">${P(fr, 'url(#ld-wicker)', '#2E2219', 0.06)}${SHEEN(fr)}` +
    cushion(-w / 2 + w * 0.13, -h / 2 + h * 0.26, w * 0.74, h * 0.62, cush || '#E6DCC6') +
    P(RR(-w / 2 + 0.05, -h / 2 + 0.05, w - 0.1, h * 0.2, 0.08), '#3B2C20', '', '') + '</g>';
}
function teakTop(d, o) { return P(d, 'url(#ld-teak)', '#5E4129', 0.07) + SHEEN(d); }
function poolCore(waterD, bb, o, rng, deepAxis) {
  let s = P(waterD, `url(#ld-poolw${deepAxis === 'x' ? 'x' : ''})`, '', '') + P(waterD, '#fff', '', '', ' filter="url(#ld-caus)"');
  s += P(waterD, 'none', 'url(#ld-tile)', 0.75, ' stroke-linejoin="round"');                     // mosaic tile at the waterline
  s += P(waterD, 'none', '#1E5F86', 0.06);
  return s;
}
const FURN_R = {
  table_round(it, o) {
    const R = Math.min(it.w, it.h) / 2, tr = R * 0.5, k = clamp(Math.round(2 * Math.PI * (tr + 1) / 2.4), 4, 10);
    const top = `M${n(-tr)},0A${n(tr)},${n(tr)} 0 1,0 ${n(tr)},0A${n(tr)},${n(tr)} 0 1,0 ${n(-tr)},0Z`;
    let s = DSH(o, top);
    for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k, d = tr + 1; s += DSH(o, RR(d * Math.cos(a) - 0.85, d * Math.sin(a) - 0.85, 1.7, 1.7, 0.3), 0.6) + chairR(d * Math.cos(a), d * Math.sin(a), 1.75, 1.75, a * 180 / Math.PI + 90); }
    return s + teakTop(top, o) + `<circle r="${n(tr * 0.82)}" fill="none" stroke="#C99C69" stroke-opacity="0.5" stroke-width="0.05"/><circle r="0.18" fill="#2B2420"/><circle r="0.08" fill="#6B5D4E"/>`;
  },
  table_rect(it, o) {
    const tw = Math.max(2, it.w - 3.4), th = Math.max(2, it.h - 3.4), per = Math.max(1, Math.floor(tw / 2.4));
    const top = RR(-tw / 2, -th / 2, tw, th, 0.15);
    let s = '';
    const seats = [];
    for (let i = 0; i < per; i++) { const x = -tw / 2 + tw * (i + 0.5) / per; seats.push([x, -th / 2 - 1, 180], [x, th / 2 + 1, 0]); }
    if (it.w >= 7.5) seats.push([-tw / 2 - 1, 0, 90], [tw / 2 + 1, 0, -90]);
    for (const [x, y, r] of seats) s += DSH(o, RR(x - 0.85, y - 0.85, 1.7, 1.7, 0.3), 0.6) + chairR(x, y, 1.75, 1.75, r);
    let slats = '';
    for (let y = -th / 2 + 0.38; y < th / 2 - 0.1; y += 0.38) slats += `M${n(-tw / 2 + 0.1)},${n(y)}H${n(tw / 2 - 0.1)}`;
    return s + DSH(o, top) + teakTop(top, o) + `<path d="${slats}" stroke="#4A321E" stroke-width="0.035" stroke-opacity="0.7"/>`;
  },
  sofa(it, o, rng) {
    const w = it.w, h = it.h, arm = Math.min(0.75, w * 0.11), back = h * 0.32, nC = Math.max(1, Math.round((w - 2 * arm) / 2.2));
    const fr = RR(-w / 2, -h / 2, w, h, 0.35);
    let s = DSH(o, fr) + P(fr, 'url(#ld-wicker)', '#2E2219', 0.07) + SHEEN(fr);
    const cw = (w - 2 * arm) / nC;
    for (let i = 0; i < nC; i++) s += cushion(-w / 2 + arm + i * cw + 0.04, -h / 2 + 0.12, cw - 0.08, back - 0.1, '#D9CBB0');
    for (let i = 0; i < nC; i++) s += cushion(-w / 2 + arm + i * cw + 0.04, -h / 2 + back + 0.08, cw - 0.08, h - back - 0.25, '#E6DCC6');
    const pill = ['#2F6F8F', '#C9783A', '#2F6F8F'];
    for (let i = 0; i < Math.min(2, nC); i++) { const x = i ? w / 2 - arm - 0.9 : -w / 2 + arm + 0.1; s += `<g transform="translate(${n(x + 0.4)} ${n(-h / 2 + back + 0.3)}) rotate(${i ? 12 : -12})">${cushion(-0.42, -0.35, 0.84, 0.7, pill[i], 0.18)}</g>`; }
    return s;
  },
  sectional(it, o) {
    const w = it.w, h = it.h, d = Math.min(3, w * 0.35, h * 0.35);
    const L = `M${n(-w / 2)},${n(-h / 2)}H${n(w / 2)}V${n(-h / 2 + d)}H${n(-w / 2 + d)}V${n(h / 2)}H${n(-w / 2)}Z`;
    let s = DSH(o, L) + P(L, 'url(#ld-wicker)', '#2E2219', 0.07) + SHEEN(L);
    const nx = Math.max(1, Math.round((w - d) / 2.3)), ny = Math.max(1, Math.round((h - d) / 2.3)), bk = d * 0.34;
    s += cushion(-w / 2 + 0.12, -h / 2 + 0.12, d - 0.2, bk, '#D9CBB0') + cushion(-w / 2 + 0.12, -h / 2 + 0.12, bk, d - 0.2, '#D9CBB0');
    for (let i = 0; i < nx; i++) { const cw = (w - d - 0.2) / nx; s += cushion(-w / 2 + d + i * cw, -h / 2 + 0.12, cw - 0.08, bk, '#D9CBB0') + cushion(-w / 2 + d + i * cw, -h / 2 + bk + 0.18, cw - 0.08, d - bk - 0.35, '#E6DCC6'); }
    for (let i = 0; i < ny; i++) { const ch = (h - d - 0.2) / ny; s += cushion(-w / 2 + 0.12, -h / 2 + d + i * ch, bk, ch - 0.08, '#D9CBB0') + cushion(-w / 2 + bk + 0.18, -h / 2 + d + i * ch, d - bk - 0.35, ch - 0.08, '#E6DCC6'); }
    s += cushion(-w / 2 + bk + 0.18, -h / 2 + bk + 0.18, d - bk - 0.35, d - bk - 0.35, '#E6DCC6');
    s += `<g transform="translate(${n(-w / 2 + d * 0.62)} ${n(-h / 2 + d * 0.62)}) rotate(45)">${cushion(-0.45, -0.4, 0.9, 0.8, '#2F6F8F', 0.2)}</g>`;
    s += `<g transform="translate(${n(w / 2 - 1.1)} ${n(-h / 2 + bk + 0.55)}) rotate(-10)">${cushion(-0.42, -0.36, 0.84, 0.72, '#C9783A', 0.18)}</g>`;
    return s;
  },
  chair(it, o) {
    const w = it.w, h = it.h, fr = RR(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.22);
    return DSH(o, fr) + P(fr, 'url(#ld-wicker)', '#2E2219', 0.06) + SHEEN(fr) + cushion(-w / 2 + w * 0.16, -h / 2 + h * 0.08, w * 0.68, h * 0.26, '#D9CBB0') +
      cushion(-w / 2 + w * 0.16, -h / 2 + h * 0.36, w * 0.68, h * 0.54, '#E6DCC6') + `<g transform="translate(0 ${n(-h * 0.12)}) rotate(-8)">${cushion(-w * 0.18, -h * 0.1, w * 0.36, h * 0.24, '#2F6F8F', 0.12)}</g>`;
  },
  lounge(it, o) {
    const w = it.w, h = it.h, fr = RR(-w / 2, -h / 2, w, h, 0.3);
    let slats = '';
    for (let y = -h / 2 + 0.2; y < h / 2; y += 0.28) slats += `M${n(-w / 2 + 0.12)},${n(y)}H${n(w / 2 - 0.12)}`;
    return DSH(o, fr) + P(fr, '#C9CED1', '#7E868B', 0.06) + `<path d="${slats}" stroke="#9AA1A6" stroke-width="0.06"/>` + SHEEN(fr) +
      cushion(-w / 2 + 0.14, -h / 2 + 0.16, w - 0.28, h * 0.32, '#3F7FA8', 0.25) + cushion(-w / 2 + 0.14, -h / 2 + h * 0.34 + 0.12, w - 0.28, h * 0.62 - 0.3, '#4F92BC', 0.25) +
      cushion(-w * 0.3, -h / 2 + 0.25, w * 0.6, h * 0.12, '#F3EEE2', 0.15);
  },
  bench(it, o, rng) {
    const w = it.w, h = it.h, fr = RR(-w / 2, -h / 2, w, h, 0.08);
    let s = DSH(o, fr) + P(fr, '#3B2C20', '', '');
    const n3 = Math.max(3, Math.round(h / 0.45)), sh = (h - 0.16) / n3;
    for (let i = 0; i < n3; i++) { const d = RR(-w / 2 + 0.06, -h / 2 + 0.08 + i * sh, w - 0.12, sh - 0.06, 0.04); s += P(d, 'url(#ld-teak)', '', '') + SHEEN(d); }
    return s + P(RR(-w / 2 + 0.3, -h / 2, 0.22, h, 0.03), '#2B2017', '', '', ' fill-opacity="0.55"') + P(RR(w / 2 - 0.52, -h / 2, 0.22, h, 0.03), '#2B2017', '', '', ' fill-opacity="0.55"');
  },
  umbrella(it, o) {
    const R = Math.min(it.w, it.h) / 2, k = 8;
    let s = o.icon ? '' : `<circle cx="-1.1" cy="1.1" r="${n(R)}" fill="#0E1408" fill-opacity="0.25" filter="url(#ld-softw)"/>`;
    const cols = ['#E9DFC9', '#DCCFB2'];
    for (let i = 0; i < k; i++) {
      const a0 = 2 * Math.PI * i / k, a1 = 2 * Math.PI * (i + 1) / k, am = (a0 + a1) / 2;
      const p0 = [R * Math.cos(a0), R * Math.sin(a0)], p1 = [R * Math.cos(a1), R * Math.sin(a1)], c = [R * 0.86 * Math.cos(am), R * 0.86 * Math.sin(am)];
      const d = `M0,0L${n(p0[0])},${n(p0[1])}Q${n(c[0])},${n(c[1])} ${n(p1[0])},${n(p1[1])}Z`;
      const lit = Math.cos(am) * 0.5 - Math.sin(am) * 0.25;
      s += P(d, shade(cols[i % 2], lit * 0.12), '#A8987A', 0.05, ' stroke-linejoin="round"') + P(d, 'url(#ld-panel)', '', '');
    }
    for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k; s += `<path d="M0,0L${n(R * Math.cos(a))},${n(R * Math.sin(a))}" stroke="#8C7C60" stroke-width="0.06" stroke-opacity="0.8"/>`; }
    return s + `<circle r="${n(R * 0.1)}" fill="#E9DFC9" stroke="#8C7C60" stroke-width="0.05"/><circle r="${n(R * 0.045)}" fill="#5E5240"/>`;
  },
  pergola(it, o) {
    const w = it.w, h = it.h, ps = 0.55;
    let s = '';
    if (!o.icon) {   // the slatted shadow it throws on the ground
      let sh = '';
      for (let x = -w / 2 + 0.6; x < w / 2; x += 1) sh += `M${n(x - 0.9)},${n(-h / 2 + 0.6)}v${n(h)}`;
      s += `<path d="${sh}" stroke="#0E1408" stroke-opacity="0.22" stroke-width="0.38" filter="url(#ld-softw)"/>`;
    }
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s += P(RR(x * (w / 2 - 0.3) - ps / 2, y * (h / 2 - 0.3) - ps / 2, ps, ps, 0.04), '#5E4129', '#3B2A1A', 0.05);
    for (const y of [-h / 2 + 0.3, h / 2 - 0.3]) { const d = RR(-w / 2 - 0.9, y - 0.24, w + 1.8, 0.48, 0.05); s += DSH(o, d, 0.6) + P(d, 'url(#ld-teakv)', '#3B2A1A', 0.05) + SHEEN(d); }
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1) { const d = RR(x - 0.13, -h / 2 - 0.6, 0.26, h + 1.2, 0.04); s += DSH(o, d, 0.4) + P(d, '#A97B4D', '#5E4129', 0.04) + `<path d="M${n(x + 0.08)},${n(-h / 2 - 0.55)}V${n(h / 2 + 0.55)}" stroke="#C99C69" stroke-width="0.05"/>`; }
    return s;
  },
  grill(it, o) {
    const w = it.w, h = it.h, bw = w * 0.56, body = RR(-w / 2, -h / 2 + 0.25, w, h - 0.5, 0.12), lid = RR(-bw / 2, -h / 2, bw, h, 0.45);
    let s = DSH(o, body) + P(body, 'url(#ld-steel)', '#6B7378', 0.05);
    let gr = '';
    for (let x = -w / 2 + 0.25; x < -bw / 2 - 0.15; x += 0.18) gr += `M${n(x)},${n(-h / 2 + 0.45)}V${n(h / 2 - 0.45)}`;
    s += `<path d="${gr}" stroke="#7E868B" stroke-width="0.04"/>`;
    s += `<circle cx="${n(w / 2 - (w / 2 - bw / 2) / 2)}" cy="0" r="${n(Math.min(0.5, h * 0.18))}" fill="#2B2D2F" stroke="#111" stroke-width="0.04"/><circle cx="${n(w / 2 - (w / 2 - bw / 2) / 2)}" cy="0" r="${n(Math.min(0.3, h * 0.1))}" fill="none" stroke="#5F666B" stroke-width="0.04"/>`;
    s += DSH(o, lid, 0.5) + P(lid, 'url(#ld-lid)', '#0E0F10', 0.06) + `<path d="M${n(-bw / 2 + 0.3)},${n(-h / 2 + 0.35)}Q0,${n(-h / 2 + 0.1)} ${n(bw / 2 - 0.3)},${n(-h / 2 + 0.35)}" stroke="#fff" stroke-opacity="0.35" stroke-width="0.07" fill="none"/>`;
    s += P(RR(-bw * 0.32, h / 2 - 0.22, bw * 0.64, 0.14, 0.06), '#C9CED1', '#6B7378', 0.03);
    for (let i = 0; i < 4; i++) s += `<circle cx="${n(-bw / 2 + bw * (i + 0.5) / 4)}" cy="${n(h / 2 - 0.05)}" r="0.09" fill="#1C1D1F"/>`;
    return s;
  },
  kitchen(it, o) {
    const w = it.w, h = it.h, top = RR(-w / 2, -h / 2, w, h, 0.1);
    let s = DSH(o, top) + P(top, 'url(#ld-granite)', '#4E4A45', 0.06) + SHEEN(top);
    const gx = -w * 0.34, gw = w * 0.32, hood = RR(gx, -h / 2 + 0.28, gw, h - 0.56, 0.3);
    s += P(hood, 'url(#ld-lid)', '#0E0F10', 0.05);
    let gr = '';
    for (let x = gx + 0.25; x < gx + gw - 0.15; x += 0.2) gr += `M${n(x)},${n(-h / 2 + 0.5)}V${n(h / 2 - 0.5)}`;
    s += `<path d="${gr}" stroke="#55585C" stroke-width="0.045"/>` + `<path d="M${n(gx + 0.3)},${n(-h / 2 + 0.4)}H${n(gx + gw - 0.3)}" stroke="#fff" stroke-opacity="0.3" stroke-width="0.06"/>`;
    const sx = w * 0.1, sink = RR(sx, -h / 2 + 0.45, w * 0.2, h - 0.9, 0.25);
    s += P(sink, 'url(#ld-steel)', '#6B7378', 0.05) + P(RR(sx + 0.12, -h / 2 + 0.57, w * 0.2 - 0.24, h - 1.14, 0.18), '#8E969B', '', '') + `<circle cx="${n(sx + w * 0.1)}" cy="0" r="0.08" fill="#4E555A"/>`;
    s += `<path d="M${n(sx + w * 0.1)},${n(-h / 2 + 0.25)}v0.5" stroke="#C9CED1" stroke-width="0.12" stroke-linecap="round"/>`;
    return s;
  },
  firepit(it, o, rng) {
    const R = Math.min(it.w, it.h) / 2;
    let s = o.icon ? '' : `<circle r="${n(R * 1.9)}" fill="url(#ld-glow)"/><circle cx="-0.35" cy="0.35" r="${n(R)}" fill="#0E1408" fill-opacity="0.35" filter="url(#ld-softw)"/>`;
    const k = clamp(Math.round(R * 4), 10, 24);
    s += `<circle r="${n(R)}" fill="#6E665C"/>`;
    for (let i = 0; i < k; i++) {
      const a0 = 2 * Math.PI * i / k + 0.02, a1 = 2 * Math.PI * (i + 1) / k - 0.02, r0 = R * 0.66, r1 = R * 0.98;
      const d = `M${n(r0 * Math.cos(a0))},${n(r0 * Math.sin(a0))}L${n(r1 * Math.cos(a0))},${n(r1 * Math.sin(a0))}A${n(r1)},${n(r1)} 0 0 1 ${n(r1 * Math.cos(a1))},${n(r1 * Math.sin(a1))}L${n(r0 * Math.cos(a1))},${n(r0 * Math.sin(a1))}A${n(r0)},${n(r0)} 0 0 0 ${n(r0 * Math.cos(a0))},${n(r0 * Math.sin(a0))}Z`;
      s += P(d, shade('#B5A892', (rng() - 0.5) * 0.18), '', '') + P(d, 'url(#ld-puff)', '', '', ' fill-opacity="0.6"');
    }
    s += `<circle r="${n(R * 0.64)}" fill="#1E1714"/><circle r="${n(R * 0.6)}" fill="url(#ld-fire)"/>`;
    for (let i = 0; i < 3; i++) { const a = i * 60 + 15; s += `<g transform="rotate(${a})"><rect x="${n(-R * 0.5)}" y="-0.13" width="${n(R)}" height="0.26" rx="0.12" fill="#5A3A22" stroke="#2B1A0E" stroke-width="0.04"/><circle cx="${n(-R * 0.5)}" cy="0" r="0.12" fill="#C9A06A"/></g>`; }
    for (let i = 0; i < 9; i++) { const a = rng() * 6.28, d = Math.sqrt(rng()) * R * 0.38; s += `<path d="M${n(d * Math.cos(a))},${n(d * Math.sin(a) + 0.2)}q0.12,-0.3 0,-0.55q-0.12,0.25 0,0.55z" fill="#FFD25A" fill-opacity="0.9"/>`; }
    return s;
  },
  firetable(it, o, rng) {
    const w = it.w, h = it.h, top = RR(-w / 2, -h / 2, w, h, 0.25);
    let s = (o.icon ? '' : `<circle r="${n(Math.max(w, h) * 0.9)}" fill="url(#ld-glow)"/>`) + DSH(o, top) + P(top, '#9A968F', '#4E4A45', 0.06) + P(top, 'url(#ld-granite)', '', '', ' fill-opacity="0.5"') + SHEEN(top);
    const gw = w * 0.62, gh = h * 0.62, glass = RR(-gw / 2, -gh / 2, gw, gh, 0.1);
    s += P(glass, '#1E2A33', '#BFD6E3', 0.08);
    for (let i = 0; i < 40; i++) s += `<circle cx="${n((rng() - 0.5) * (gw - 0.4))}" cy="${n((rng() - 0.5) * (gh - 0.4))}" r="0.07" fill="${['#4FA3C8', '#7FC1DE', '#2E6F95'][i % 3]}"/>`;
    s += `<rect x="${n(-gw * 0.32)}" y="${n(-gh * 0.12)}" width="${n(gw * 0.64)}" height="${n(gh * 0.24)}" rx="0.1" fill="url(#ld-fire)"/>`;
    return s;
  },
  pool(it, o, rng) {
    const w = it.w, h = it.h, c = 1.2, outer = RR(-w / 2, -h / 2, w, h, 0.3), water = RR(-w / 2 + c, -h / 2 + c, w - 2 * c, h - 2 * c, 0.2);
    let s = DSH(o, outer, 0.5) + P(outer, 'url(#ld-coping)', '#8E8676', 0.07) + SHEEN(outer);
    s += poolCore(water, null, o, rng, w > h ? 'x' : 'y');
    const sw2 = Math.min(6, (w - 2 * c) * 0.45);
    for (let i = 0; i < 3; i++) s += P(RR(-w / 2 + c + 0.35, -h / 2 + c + 0.35 + i * 0.9, sw2 - 0.4, 0.9, 0.15), i === 0 ? '#CDEBF5' : shade('#9FD6EC', -i * 0.08), '#fff', 0.05, ' fill-opacity="0.85"');
    const lx = w / 2 - c - 1.6, ly = h / 2 - c;
    s += `<path d="M${n(lx)},${n(ly + 0.6)}V${n(ly - 0.9)}M${n(lx + 0.9)},${n(ly + 0.6)}V${n(ly - 0.9)}" stroke="#E3E6E8" stroke-width="0.12" stroke-linecap="round"/><path d="M${n(lx)},${n(ly - 0.3)}H${n(lx + 0.9)}" stroke="#E3E6E8" stroke-width="0.08"/>`;
    s += `<rect x="-0.5" y="${n(h / 2 - c - 3.2)}" width="1" height="0.5" rx="0.1" fill="#1E5F86" fill-opacity="0.5"/>`;
    return s;
  },
  pool_kidney(it, o, rng) {
    const w = it.w, h = it.h, outer = KIDNEY(w, h), inner = KIDNEY(w - 2.4, h - 2.4);
    return DSH(o, outer, 0.5) + P(outer, 'url(#ld-coping)', '#8E8676', 0.07) + SHEEN(outer) + poolCore(inner, null, o, rng, 'y') +
      `<path d="M${n(-w * 0.12)},${n(-h / 2 + 1.5)}q${n(w * 0.12)},0.7 ${n(w * 0.24)},0" stroke="#fff" stroke-opacity="0.75" stroke-width="0.08" fill="none"/><path d="M${n(-w * 0.1)},${n(-h / 2 + 2.3)}q${n(w * 0.1)},0.6 ${n(w * 0.2)},0" stroke="#fff" stroke-opacity="0.6" stroke-width="0.08" fill="none"/>`;
  },
  hottub(it, o, rng) {
    const w = it.w, h = it.h, cab = RR(-w / 2, -h / 2, w, h, 0.9);
    let s = DSH(o, cab, 0.6) + P(cab, 'url(#ld-teakv)', '#3B2A1A', 0.07) + SHEEN(cab);
    const shell = RR(-w / 2 + 0.45, -h / 2 + 0.45, w - 0.9, h - 0.9, 0.7);
    s += P(shell, '#EEF2F4', '#B9C2C8', 0.05);
    const water = RR(-w / 2 + 0.9, -h / 2 + 0.9, w - 1.8, h - 1.8, 0.55);
    s += P(water, 'url(#ld-poolw)', '', '') + P(water, '#fff', '', '', ' filter="url(#ld-caus)" opacity="0.8"');
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = x * (w / 2 - 1.75), cy = y * (h / 2 - 1.75);
      s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w, h) * 0.13)}" fill="#BFE3F5" fill-opacity="0.55" stroke="#fff" stroke-opacity="0.6" stroke-width="0.04"/>`;
      for (let i = 0; i < 6; i++) { const a = rng() * 6.28, d = rng() * 0.35; s += `<circle cx="${n(cx + d * Math.cos(a))}" cy="${n(cy + d * Math.sin(a))}" r="${n(0.04 + rng() * 0.06)}" fill="#fff" fill-opacity="0.85"/>`; }
    }
    s += `<circle r="${n(Math.min(w, h) * 0.14)}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.05"/>`;
    return s;
  },
  playset(it, o, rng) {
    const w = it.w, h = it.h, dk = Math.min(w * 0.4, h * 0.55), x0 = -w / 2, y0 = -h / 2;
    const slide = RR(x0 + dk - 0.2, y0 + dk * 0.3, w - dk + 0.2, 1.9, 0.95);
    let s = DSH(o, slide, 0.6) + P(slide, 'url(#ld-slide)', '#B8860B', 0.06) + P(RR(x0 + dk, y0 + dk * 0.3 + 0.35, w - dk - 0.6, 1.2, 0.6), '#FFE07A', '', '', ' fill-opacity="0.55"');
    const wall = RR(x0 + dk * 0.15, y0 + dk - 0.1, dk * 0.7, h - dk + 0.1, 0.08);
    s += DSH(o, wall, 0.6) + P(wall, 'url(#ld-teakv)', '#4E3622', 0.06);
    for (let y = y0 + dk + 0.45; y < h / 2 - 0.2; y += 0.7) for (const [fx, c] of [[0.32, '#E2552F'], [0.62, '#F2B705'], [0.47, '#2F7DB8']]) s += `<path d="M${n(x0 + dk * fx)},${n(y + (fx === 0.47 ? 0.35 : 0))}l0.16,-0.08 0.06,0.17 -0.17,0.08z" fill="${c}" stroke="#222" stroke-width="0.02"/>`;
    const deck = RR(x0, y0, dk, dk, 0.08);
    s += DSH(o, deck, 1.2) + P(deck, 'url(#ld-teakv)', '#3B2A1A', 0.07);
    const roofS = `M${n(x0 - 0.3)},${n(y0 - 0.3)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk + 0.3)},${n(y0 - 0.3)}Z`, roofN = `M${n(x0 - 0.3)},${n(y0 + dk + 0.3)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk + 0.3)},${n(y0 + dk + 0.3)}Z`;
    const roofW = `M${n(x0 - 0.3)},${n(y0 - 0.3)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 - 0.3)},${n(y0 + dk + 0.3)}Z`, roofE = `M${n(x0 + dk + 0.3)},${n(y0 - 0.3)}L${n(x0 + dk / 2)},${n(y0 + dk / 2)}L${n(x0 + dk + 0.3)},${n(y0 + dk + 0.3)}Z`;
    s += P(roofS, '#2E8B57', '#1D5F3A', 0.05) + P(roofN, '#267A4B', '#1D5F3A', 0.05) + P(roofW, '#1F6B40', '#1D5F3A', 0.05) + P(roofE, '#36A066', '#1D5F3A', 0.05);
    for (const d of [roofS, roofN, roofW, roofE]) s += P(d, 'url(#ld-shingle)', '', '', ' fill-opacity="0.5"');
    return s + `<circle cx="${n(x0 + dk / 2)}" cy="${n(y0 + dk / 2)}" r="0.18" fill="#F2B705"/>`;
  },
  swing(it, o) {
    const w = it.w, h = it.h, n2 = Math.max(1, Math.round((w - 2) / 3.2));
    const leg = (x1, y1, x2, y2) => `<path d="M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}" stroke="#3B2A1A" stroke-width="0.46" stroke-linecap="round"/><path d="M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}" stroke="#A97B4D" stroke-width="0.32" stroke-linecap="round"/>`;
    let s = o.icon ? '' : `<rect x="${n(-w / 2 + 0.4)}" y="0.3" width="${n(w - 0.8)}" height="0.6" rx="0.3" fill="#0E1408" fill-opacity="0.25" filter="url(#ld-softw)"/>`;
    s += leg(-w / 2, -h / 2, -w / 2 + 1, 0) + leg(-w / 2, h / 2, -w / 2 + 1, 0) + leg(w / 2, -h / 2, w / 2 - 1, 0) + leg(w / 2, h / 2, w / 2 - 1, 0);
    s += `<path d="M${n(-w / 2 + 0.8)},0H${n(w / 2 - 0.8)}" stroke="#3B2A1A" stroke-width="0.6" stroke-linecap="round"/><path d="M${n(-w / 2 + 0.8)},-0.08H${n(w / 2 - 0.8)}" stroke="#B98A5A" stroke-width="0.36" stroke-linecap="round"/>`;
    const seatCol = ['#E2552F', '#2F7DB8', '#F2B705'];
    for (let i = 0; i < n2; i++) {
      const x = -w / 2 + 1 + (w - 2) * (i + 0.5) / n2;
      s += `<path d="M${n(x - 0.7)},0.2V0.9M${n(x + 0.7)},0.2V0.9" stroke="#8E969B" stroke-width="0.06" stroke-dasharray="0.08 0.05"/>`;
      const seat = RR(x - 0.85, 0.75, 1.7, 0.6, 0.25);
      s += DSH(o, seat, 0.4) + P(seat, seatCol[i % 3], shade(seatCol[i % 3], -0.4), 0.05) + SHEEN(seat);
    }
    return s;
  },
  sandbox(it, o, rng) {
    const w = it.w, h = it.h, fr = RR(-w / 2, -h / 2, w, h, 0.05), sand = RR(-w / 2 + 0.45, -h / 2 + 0.45, w - 0.9, h - 0.9, 0.05);
    let s = DSH(o, fr, 0.6) + P(fr, 'url(#ld-teakv)', '#3B2A1A', 0.06) + SHEEN(fr) + P(sand, 'url(#ld-sand)', '#B8A06B', 0.04);
    s += `<path d="M${n(-w / 2)},${n(-h / 2)}l0.45,0.45M${n(w / 2)},${n(-h / 2)}l-0.45,0.45M${n(w / 2)},${n(h / 2)}l-0.45,-0.45M${n(-w / 2)},${n(h / 2)}l0.45,-0.45" stroke="#3B2A1A" stroke-width="0.04"/>`;
    for (let i = 0; i < 5; i++) { const x = (rng() - 0.5) * (w - 2), y = (rng() - 0.5) * (h - 2); s += `<path d="M${n(x)},${n(y)}q0.3,-0.25 0.6,0" stroke="#C9B37D" stroke-width="0.06" fill="none"/>`; }
    s += `<circle cx="${n(w * 0.18)}" cy="${n(-h * 0.12)}" r="0.42" fill="#E2552F" stroke="#9E3517" stroke-width="0.05"/><circle cx="${n(w * 0.18)}" cy="${n(-h * 0.12)}" r="0.28" fill="#B8401F"/>`;
    s += `<g transform="translate(${n(-w * 0.15)} ${n(h * 0.15)}) rotate(-30)"><rect x="-0.08" y="-0.6" width="0.16" height="0.8" fill="#2F7DB8"/><path d="M-0.28,0.2h0.56l-0.1,0.4h-0.36z" fill="#2F7DB8"/></g>`;
    return s;
  },
  trampoline(it, o) {
    const R = Math.min(it.w, it.h) / 2;
    let s = o.icon ? '' : `<circle cx="-0.7" cy="0.7" r="${n(R)}" fill="#0E1408" fill-opacity="0.3" filter="url(#ld-softw)"/>`;
    s += `<circle r="${n(R)}" fill="#2F7DB8" stroke="#1F5A86" stroke-width="0.07"/>`;
    const k = 16;
    for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k; s += `<path d="M${n(R * 0.86 * Math.cos(a))},${n(R * 0.86 * Math.sin(a))}L${n(R * Math.cos(a))},${n(R * Math.sin(a))}" stroke="#1F5A86" stroke-width="0.05"/>`; }
    s += `<circle r="${n(R)}" fill="url(#ld-puff)"/>`;
    let springs = '';
    for (let i = 0; i < 48; i++) { const a = 2 * Math.PI * i / 48; springs += `M${n(R * 0.74 * Math.cos(a))},${n(R * 0.74 * Math.sin(a))}L${n(R * 0.84 * Math.cos(a))},${n(R * 0.84 * Math.sin(a))}`; }
    s += `<path d="${springs}" stroke="#C9CED1" stroke-width="0.06"/>`;
    s += `<circle r="${n(R * 0.74)}" fill="url(#ld-mat)" stroke="#111" stroke-width="0.05"/><circle r="${n(R * 0.74)}" fill="url(#ld-puff)" fill-opacity="0.5"/>`;
    s += `<circle r="${n(R * 0.94)}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.05" stroke-dasharray="0.15 0.12"/>`;
    for (let i = 0; i < 8; i++) { const a = 2 * Math.PI * i / 8 + 0.2; s += `<circle cx="${n(R * 0.95 * Math.cos(a))}" cy="${n(R * 0.95 * Math.sin(a))}" r="0.16" fill="#222" stroke="#888" stroke-width="0.03"/>`; }
    return s;
  },
};
/* rendered materials used above (added to the shared defs) */
function furnDefs(pat, specks, R) {
  let d = '';
  d += '<linearGradient id="ld-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.42" stop-color="#fff" stop-opacity="0"/><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.24"/></linearGradient>';
  d += '<radialGradient id="ld-puff" cx="0.45" cy="0.4" r="0.72"><stop offset="0" stop-color="#fff" stop-opacity="0.38"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></radialGradient>';
  d += '<radialGradient id="ld-panel" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></radialGradient>';
  d += '<linearGradient id="ld-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF1F3"/><stop offset="0.5" stop-color="#A9B0B5"/><stop offset="1" stop-color="#D3D8DB"/></linearGradient>';
  d += '<radialGradient id="ld-lid" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#5A5E62"/><stop offset="0.6" stop-color="#2A2C2F"/><stop offset="1" stop-color="#141516"/></radialGradient>';
  d += '<linearGradient id="ld-poolw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8E1F3"/><stop offset="0.45" stop-color="#55B4DC"/><stop offset="1" stop-color="#1F73A6"/></linearGradient>';
  d += '<linearGradient id="ld-poolwx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A8E1F3"/><stop offset="0.45" stop-color="#55B4DC"/><stop offset="1" stop-color="#1F73A6"/></linearGradient>';
  d += '<radialGradient id="ld-glow"><stop offset="0" stop-color="#FFB347" stop-opacity="0.45"/><stop offset="0.5" stop-color="#FF8C2A" stop-opacity="0.12"/><stop offset="1" stop-color="#FF8C2A" stop-opacity="0"/></radialGradient>';
  d += '<filter id="ld-mouth" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.45"/></filter>';
  d += '<radialGradient id="ld-pond" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#1B4549"/><stop offset="0.55" stop-color="#2C6563"/><stop offset="0.9" stop-color="#4F806A"/><stop offset="1" stop-color="#6B8A62"/></radialGradient>';
  d += '<radialGradient id="ld-bulbglow"><stop offset="0" stop-color="#FFE7A3" stop-opacity="0.8"/><stop offset="0.3" stop-color="#FFD27A" stop-opacity="0.35"/><stop offset="1" stop-color="#FFC861" stop-opacity="0"/></radialGradient>';
  d += '<linearGradient id="ld-slide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD54A"/><stop offset="0.5" stop-color="#F2B705"/><stop offset="1" stop-color="#C98F00"/></linearGradient>';
  let wk = '<rect width="0.4" height="0.4" fill="#6B4A2E"/>';
  wk += '<path d="M0,0.1H0.4M0,0.3H0.4" stroke="#8C6640" stroke-width="0.09"/><path d="M0.1,0V0.4M0.3,0V0.4" stroke="#4A321E" stroke-width="0.05" stroke-opacity="0.8"/>';
  d += pat('ld-wicker', 0.4, 0.4, wk);
  let tk = '<rect width="4" height="0.5" fill="#B07F4F"/><rect y="0.25" width="4" height="0.25" fill="#A57446"/>';
  tk += '<path d="M0,0.12Q1,0.08 2,0.13T4,0.12M0,0.37Q1,0.33 2,0.38T4,0.37" stroke="#8C6038" stroke-width="0.025" fill="none"/><path d="M0,0.25H4M0,0H4" stroke="#6B4A2E" stroke-width="0.03"/>';
  d += pat('ld-teak', 4, 0.5, tk);
  d += pat('ld-teakv', 0.5, 4, '<rect width="0.5" height="4" fill="#A97B4D"/><rect x="0.25" width="0.25" height="4" fill="#9C6F43"/><path d="M0.12,0Q0.08,1 0.13,2T0.12,4M0.37,0Q0.33,1 0.38,2T0.37,4" stroke="#7E5632" stroke-width="0.025" fill="none"/><path d="M0.25,0V4M0,0V4" stroke="#5E4129" stroke-width="0.03"/>');
  d += pat('ld-granite', 1.2, 1.2, '<rect width="1.2" height="1.2" fill="#5D5954"/>' + specks(1.2, 1.2, 40, ['#8C8780', '#3E3B37', '#A9A39A', '#2B2926'], 0.02, 0.06));
  d += pat('ld-coping', 2, 2, '<rect width="2" height="2" fill="#9C9384"/><rect x="0.04" y="0.04" width="0.92" height="0.92" fill="#D8D0BF"/><rect x="1.04" y="0.04" width="0.92" height="0.92" fill="#CFC6B4"/><rect x="0.04" y="1.04" width="0.92" height="0.92" fill="#D2C9B8"/><rect x="1.04" y="1.04" width="0.92" height="0.92" fill="#DCD5C5"/>');
  d += pat('ld-tile', 0.5, 0.5, '<rect width="0.5" height="0.5" fill="#E8F1F4"/><rect x="0.02" y="0.02" width="0.21" height="0.21" fill="#1F6FA0"/><rect x="0.27" y="0.02" width="0.21" height="0.21" fill="#3D8CBB"/><rect x="0.02" y="0.27" width="0.21" height="0.21" fill="#3D8CBB"/><rect x="0.27" y="0.27" width="0.21" height="0.21" fill="#1F6FA0"/>');
  // sunlight caustics on the pool floor: contour bands of a noise field, kept inside the water shape
  d += '<filter id="ld-caus" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="7" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0" result="a"/><feComponentTransfer in="a" result="b"><feFuncA type="table" tableValues="0 0 0.05 0.4 0.05 0 0.03 0.32 0.03 0 0.05 0.42 0.05 0 0.03 0.3 0.03 0 0"/></feComponentTransfer><feComposite in="b" in2="SourceAlpha" operator="in"/></filter>';
  d += pat('ld-mat', 0.3, 0.3, '<rect width="0.3" height="0.3" fill="#1E2022"/><path d="M0,0.15H0.3M0.15,0V0.3" stroke="#25282A" stroke-width="0.03"/>');
  d += pat('ld-shingle', 0.6, 0.4, '<path d="M0,0.2H0.6M0.3,0.2V0.4M0,0V0.2M0.6,0V0.2" stroke="#0E3A21" stroke-width="0.04"/>');
  d += pat('ld-chain', 0.36, 0.36, '<path d="M0,0.18L0.18,0L0.36,0.18L0.18,0.36Z" fill="none" stroke="#9AA1A6" stroke-width="0.035"/>');
  d += pat('ld-boards', 0.55, 0.55, '<rect width="0.55" height="0.55" fill="#8C6640"/><rect width="0.5" height="0.55" fill="#A97B4D"/><path d="M0.15,0V0.55M0.32,0V0.55" stroke="#7E5632" stroke-width="0.02" stroke-opacity="0.6"/>');
  return d;
}
/* a soft drop shadow for a line item; the clear box gives the blur a real area even for a perfectly straight run */
function lineShadow(line, w, off, op) {
  const xs = line.map((p) => p[0]), ys = line.map((p) => p[1]), m = w + Math.abs(off) + 2;
  return `<g filter="url(#ld-softw)" opacity="${op}"><rect x="${n(Math.min(...xs) - m)}" y="${n(Math.min(...ys) - m)}" width="${n(Math.max(...xs) - Math.min(...xs) + 2 * m)}" height="${n(Math.max(...ys) - Math.min(...ys) + 2 * m)}" fill="none"/><path d="${ptsD(line)}" transform="translate(${n(-off)} ${n(off)})" fill="none" stroke="#0E1408" stroke-width="${n(w)}" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
/* detailed rendered fence: each run drawn in its own local frame so boards and pickets sit across it */
function fenceDetailed(it, o) {
  const st = it.style || 'privacy', pts = it.pts;
  const d = ptsD(pts);
  let s = o.icon ? '' : lineShadow(pts, st === 'privacy' ? 0.7 : 0.4, st === 'privacy' ? 0.6 : 0.35, st === 'chain' || st === 'iron' ? 0.18 : 0.32);
  const seg = (fn) => { let out = ''; for (let i = 1; i < pts.length; i++) { const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], L = Math.hypot(x2 - x1, y2 - y1); if (L < 0.05) continue; out += `<g transform="translate(${n(x1)} ${n(y1)}) rotate(${n(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI)})">${fn(L)}</g>`; } return out; };
  const post = (p, size, fill, stroke, cap) => `<rect x="${n(p[0] - size / 2)}" y="${n(p[1] - size / 2)}" width="${n(size)}" height="${n(size)}" rx="${n(size * 0.12)}" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>` + (cap ? `<rect x="${n(p[0] - size * 0.3)}" y="${n(p[1] - size * 0.3)}" width="${n(size * 0.6)}" height="${n(size * 0.6)}" fill="${cap}"/>` : '');
  const rpost = (p, r, fill, stroke, hi) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(r)}" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>` + (hi ? `<circle cx="${n(p[0] + r * 0.25)}" cy="${n(p[1] - r * 0.25)}" r="${n(r * 0.4)}" fill="${hi}"/>` : '');
  if (st === 'picket') {
    s += seg((L) => {
      let b = `<rect x="0" y="-0.07" width="${n(L)}" height="0.14" fill="#B8B2A6"/>`;
      for (let x = 0.15; x < L - 0.1; x += 0.5) b += `<rect x="${n(x)}" y="-0.2" width="0.3" height="0.12" fill="#FFFFFF" stroke="#9A958B" stroke-width="0.025"/><path d="M${n(x)},-0.08h0.3" stroke="#D8D3C9" stroke-width="0.02"/>`;
      return b;
    });
    return s + fencePosts(pts, 8).map((p) => post(p, 0.42, '#FFFFFF', '#8F8B82', '#ECE8E0')).join('');
  }
  if (st === 'split') {
    s += seg((L) => `<path d="M0,-0.12H${n(L)}" stroke="#5E4430" stroke-width="0.26" stroke-linecap="round"/><path d="M0,-0.16H${n(L)}" stroke="#A7835B" stroke-width="0.1"/><path d="M0,0.14H${n(L)}" stroke="#5E4430" stroke-width="0.24" stroke-linecap="round"/><path d="M0,0.1H${n(L)}" stroke="#9A774F" stroke-width="0.08"/>`);
    return s + fencePosts(pts, 10).map((p) => rpost(p, 0.32, '#6E5038', '#3B2A1A', '#8C6A48') + `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="0.17" fill="none" stroke="#4E3622" stroke-width="0.03"/>`).join('');
  }
  if (st === 'chain') {
    s += seg((L) => `<rect x="0" y="-0.16" width="${n(L)}" height="0.32" fill="url(#ld-chain)"/><path d="M0,0H${n(L)}" stroke="#7E868B" stroke-width="0.09"/><path d="M0,-0.02H${n(L)}" stroke="#D7DCDF" stroke-width="0.03"/>`);
    return s + fencePosts(pts, 10).map((p) => rpost(p, 0.22, '#C9CED1', '#5F666B', '#EEF1F3')).join('');
  }
  if (st === 'iron') {
    s += seg((L) => {
      let b = `<path d="M0,0H${n(L)}" stroke="#151515" stroke-width="0.1"/><path d="M0,-0.03H${n(L)}" stroke="#5A5A5A" stroke-width="0.025"/>`;
      for (let x = 0.2; x < L - 0.1; x += 0.42) b += `<path d="M${n(x)},-0.11l0.07,0.11 -0.07,0.11 -0.07,-0.11z" fill="#151515"/>`;
      return b;
    });
    return s + fencePosts(pts, 6).map((p) => post(p, 0.36, '#1C1C1C', '#000', '#4A4A4A')).join('');
  }
  // wood privacy, board-on-board
  s += seg((L) => `<rect x="0" y="-0.24" width="${n(L)}" height="0.48" fill="url(#ld-boards)" stroke="#4E3622" stroke-width="0.04"/><rect x="0" y="-0.24" width="${n(L)}" height="0.12" fill="#C99C69" fill-opacity="0.55"/><path d="M0,0.16H${n(L)}" stroke="#5E4129" stroke-width="0.07" stroke-opacity="0.7"/>`);
  return s + fencePosts(pts, 8).map((p) => post(p, 0.62, '#5E4129', '#2E2016', '#7E5A3A')).join('');
}

for (const k of Object.keys(FURN)) { RDRAW[k] = FURN_R[k] || FURN[k]; DDRAW[k] = FURN[k]; }
/* ------------------------------------------------------------------ garden walls: retaining, stone, seat, brick, timber
 * A line item; `width` is the wall thickness (set by the style), `height` its height, `smooth` makes the run a curve. */
function openSpline(pts, step) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const k = Math.max(2, Math.ceil(dist(p1, p2) / (step || 0.5)));
    for (let j = 1; j <= k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  return out;
}
const wallLine = (it) => (it.smooth ? openSpline(it.pts, 0.4) : it.pts);
/* walk each run and hand back unit slots {x,y,a,len} (a in degrees); straight walls restart at every corner */
function wallUnits(it, lenFn) {
  const runs = it.smooth ? [wallLine(it)] : it.pts.slice(1).map((p, i) => [it.pts[i], p]), out = [];
  for (const run of runs) {
    const L = polyLen(run);
    for (let d = 0, i = 0; d < L - 0.05; i++) {
      const len = Math.min(lenFn(i), L - d), m = d + len / 2;
      const a = pointAlong(run, Math.max(0, m - 0.1)), b = pointAlong(run, Math.min(L, m + 0.1)), c = pointAlong(run, m);
      out.push({ x: c[0], y: c[1], a: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, len });
      d += len;
    }
  }
  return out;
}
const WALL_COL = {
  block: ['#B9B2A6', '#AFA89B', '#C4BDB1', '#A69F92'],
  stone: ['#A59C8C', '#8F8676', '#B8AE9B', '#9C9180', '#C2B8A3', '#7F776A', '#AFA28A'],
  seat: ['#CDBB9C', '#C2AD8C', '#D4C4A8', '#B9A383', '#C8B494'],
  brick: ['#A8503A', '#9C4632', '#B35E44', '#8E3F2D', '#B8654B', '#A24A36'],
  timber: ['#7E6146', '#866850', '#755A40'],
};
function wallDraw(it, o, rng) {
  const st = WALL_STYLES[it.style] ? it.style : 'seat', t = it.width || WALL_W[st], line = wallLine(it), d = ptsD(line);
  const U = (fn, lenFn) => wallUnits(it, lenFn).map((u, i) => `<g transform="translate(${n(u.x)} ${n(u.y)}) rotate(${n(u.a)})">${fn(u.len, i)}</g>`).join('');
  if (!o.render) {   // drafting: double line with joints across
    const col = o.color ? { block: '#E4E0D8', stone: '#E3DCCF', seat: '#EADFCB', brick: '#EBC9BC', timber: '#E3D2BE' }[st] : '#fff';
    const step = { block: () => 1.5, stone: (i) => 0.7 + ((i * 7) % 5) * 0.15, seat: () => 2.5, brick: () => 0.75, timber: () => 8 }[st];
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(t)}" stroke-linejoin="miter"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${n(Math.max(0.05, t - o.u * 2.4))}" stroke-linejoin="miter"/>` +
      `<g stroke="${INK}" stroke-width="${n(o.u * 0.6)}">${wallUnits(it, step).map((u) => { const r = u.a * Math.PI / 180, ex = u.len / 2 * Math.cos(r), ey = u.len / 2 * Math.sin(r), nx = -Math.sin(r) * t / 2, ny = Math.cos(r) * t / 2; return `<path d="M${n(u.x + ex - nx)},${n(u.y + ey - ny)}L${n(u.x + ex + nx)},${n(u.y + ey + ny)}"/>`; }).join('')}</g>`;
  }
  const hk = clamp((it.height || WALL_HEIGHT[st]) * 0.2, 0.25, 1.4);
  let s = o.icon ? '' : lineShadow(line, t + 0.2, hk, 0.4);
  const C = WALL_COL[st], pick = () => C[Math.floor(rng() * C.length)];
  const joint = { block: '#6E685E', stone: '#4A443B', seat: '#6B5E4C', brick: '#CFC6B8', timber: '#3E2E1F' }[st];
  s += `<path d="${d}" fill="none" stroke="${joint}" stroke-width="${n(t)}" stroke-linejoin="round"/>`;
  if (st === 'block') {
    s += U((len) => { const w = len - 0.06, h = t - 0.08; return `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="0.04" fill="${pick()}"/><rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h * 0.28)}" fill="#fff" fill-opacity="0.22"/><rect x="${n(-w / 2)}" y="${n(h / 2 - h * 0.2)}" width="${n(w)}" height="${n(h * 0.2)}" fill="#000" fill-opacity="0.13"/>` + specksIn(w, h, rng, 5); }, () => 1.5);
  } else if (st === 'stone') {
    s += U((len) => {
      const two = rng() < 0.55, rows = two ? [[-t / 2, t * (0.42 + rng() * 0.16)], null] : [[-t / 2, t]];
      if (two) rows[1] = [-t / 2 + rows[0][1], t - rows[0][1]];
      return rows.map(([y0, h]) => stoneShape(-len / 2 + 0.04, y0 + 0.04, len - 0.08, h - 0.08, pick(), rng)).join('');
    }, () => 0.55 + rng() * 0.8);
  } else if (st === 'seat') {
    s += U((len) => { const w = len - 0.05, h = t - 0.02; return `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="0.06" fill="${pick()}"/><rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="0.06" fill="url(#ld-puff)" fill-opacity="0.5"/><path d="M${n(-w / 2 + 0.06)},${n(-h / 2 + 0.07)}H${n(w / 2 - 0.06)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.05"/><path d="M${n(-w / 2 + 0.06)},${n(h / 2 - 0.06)}H${n(w / 2 - 0.06)}" stroke="#5E5040" stroke-opacity="0.35" stroke-width="0.05"/>` + specksIn(w, h, rng, 6); }, () => 2 + rng() * 1.2);
  } else if (st === 'brick') {
    s += U((len) => { const w = len - 0.035, h = t - 0.06; return `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" fill="${pick()}"/><rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h * 0.25)}" fill="#fff" fill-opacity="0.12"/>`; }, () => 0.24);
  } else {
    s += U((len) => { const w = len - 0.04, h = t - 0.04; let g = `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" fill="${pick()}"/>`; for (let k = 0; k < 4; k++) { const y = -h / 2 + h * (k + 0.5) / 4 + (rng() - 0.5) * 0.04; g += `<path d="M${n(-w / 2)},${n(y)}Q0,${n(y + (rng() - 0.5) * 0.08)} ${n(w / 2)},${n(y)}" stroke="#4E3A26" stroke-opacity="0.45" stroke-width="0.02" fill="none"/>`; } return g + `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h * 0.3)}" fill="#fff" fill-opacity="0.15"/><circle cx="${n(-w / 2 + 0.4)}" cy="0" r="0.05" fill="#2B2B2B"/><circle cx="${n(w / 2 - 0.4)}" cy="0" r="0.05" fill="#2B2B2B"/>`; }, () => 8);
  }
  return s;
}
function specksIn(w, h, rng, k) { let s = ''; for (let i = 0; i < k; i++) s += `<circle cx="${n((rng() - 0.5) * w * 0.9)}" cy="${n((rng() - 0.5) * h * 0.8)}" r="${n(0.02 + rng() * 0.03)}" fill="#000" fill-opacity="0.18"/>`; return s; }
/* an irregular, softly rounded stone in the box (x,y,w,h) */
function stoneShape(x, y, w, h, col, rng) {
  if (w < 0.08 || h < 0.08) return '';
  const j = () => (rng() - 0.5) * Math.min(w, h) * 0.22;
  const p = [[x + j() * 0.5 + w * 0.12, y + j() * 0.3], [x + w * 0.55 + j(), y + j() * 0.3], [x + w - j() * 0.4, y + h * 0.3 + j()], [x + w + j() * 0.3, y + h * 0.8], [x + w * 0.6 + j(), y + h - j() * 0.3], [x + w * 0.15 + j(), y + h + j() * 0.3], [x + j() * 0.3, y + h * 0.5 + j()]];
  const d = p.map((q, i) => { const r = p[(i + 1) % p.length], m = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]; return (i ? '' : `M${n((p[p.length - 1][0] + q[0]) / 2)},${n((p[p.length - 1][1] + q[1]) / 2)}`) + `Q${n(q[0])},${n(q[1])} ${n(m[0])},${n(m[1])}`; }).join('') + 'Z';
  return `<path d="${d}" fill="${col}"/><path d="${d}" fill="url(#ld-puff)"/>`;
}

RDRAW.fence = fenceDetailed;
RDRAW.wall = DDRAW.wall = wallDraw;
/* string lights: a wire between anchor points with bulbs along it (bistro = big bulbs every 2 ft, fairy = tiny bulbs every 6 in) */
const LIGHT_STYLES = { bistro: 'Bistro string lights', fairy: 'Fairy lights' };
function lightsDraw(it, o) {
  const st = it.style === 'fairy' ? 'fairy' : 'bistro', line = wallLine(it), d = ptsD(line), L = polyLen(line), gap = st === 'fairy' ? 0.5 : 2, bulbs = [];
  for (let x = gap / 2; x < L; x += gap) bulbs.push(pointAlong(line, x));
  if (!o.render) {
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(o.u * 0.6)}" stroke-dasharray="${n(o.u * 4)} ${n(o.u * 2)}"/>` +
      `<g fill="${o.color ? '#F6D57E' : '#fff'}" stroke="${INK}" stroke-width="${n(o.u * 0.5)}">${bulbs.map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${st === 'fairy' ? 0.1 : 0.25}"/>`).join('')}</g>` +
      `<g fill="${INK}">${it.pts.map((p) => `<rect x="${n(p[0] - 0.25)}" y="${n(p[1] - 0.25)}" width="0.5" height="0.5"/>`).join('')}</g>`;
  }
  const gr = st === 'fairy' ? 0.55 : 1.5;
  let s = o.icon ? '' : `<g>${bulbs.map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${gr}" fill="url(#ld-bulbglow)"/>`).join('')}</g>`;
  s += `<path d="${d}" fill="none" stroke="#1E1E1E" stroke-width="${o.icon ? 0.12 : 0.06}" stroke-linejoin="round"/>`;
  s += st === 'fairy'
    ? bulbs.map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="0.07" fill="#FFF1C2"/>`).join('')
    : bulbs.map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="0.22" fill="#FFE29A" stroke="#B88E3A" stroke-width="0.03"/><circle cx="${n(p[0] + 0.04)}" cy="${n(p[1] - 0.05)}" r="0.09" fill="#FFFBEA"/>`).join('');
  return s + it.pts.map((p) => `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="0.26" fill="#2E2E2E" stroke="#0A0A0A" stroke-width="0.04"/><circle cx="${n(p[0] + 0.06)}" cy="${n(p[1] - 0.06)}" r="0.09" fill="#6A6A6A"/>`).join('');
}
RDRAW.lights = DDRAW.lights = lightsDraw;
/* ------------------------------------------------------------------ natural water: ponds (closed shape) and streams (line with a width) */
const ROCK = ['#9A9384', '#8A8374', '#ADA595', '#7E776A', '#B5AD9C', '#938A78'];
function boulder(x, y, r, rng) {
  const k = 7, pts = [];
  for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k + rng() * 0.4, rr = r * (0.78 + rng() * 0.3); pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a) * (0.8 + rng() * 0.25)]); }
  const d = shapeD(pts, true), c = ROCK[Math.floor(rng() * ROCK.length)];
  return `<path d="${d}" transform="translate(-0.12 0.12)" fill="#1E1A14" fill-opacity="0.35"/><path d="${d}" fill="${c}" stroke="${shade(c, -0.35)}" stroke-width="0.04"/><path d="${d}" fill="url(#ld-puff)"/>`;
}
function lilyPad(x, y, r, rng) {
  const a = rng() * 360, f = rng() < 0.35;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})"><path d="M0,0L${n(r)},${n(-r * 0.18)}A${n(r)},${n(r)} 0 1,1 ${n(r)},${n(r * 0.18)}Z" fill="${['#4E8B3A', '#5C9944', '#447D33'][Math.floor(rng() * 3)]}" stroke="#2F5E22" stroke-width="0.04"/><path d="M0,0L${n(-r * 0.7)},${n(r * 0.3)}M0,0L${n(-r * 0.5)},${n(-r * 0.55)}M0,0L${n(r * 0.1)},${n(-r * 0.75)}" stroke="#36692A" stroke-width="0.03"/>` +
    (f ? `<circle cx="${n(-r * 0.2)}" cy="${n(r * 0.1)}" r="${n(r * 0.32)}" fill="${rng() < 0.5 ? '#F4B8CF' : '#FBF6EA'}" stroke="#C97A98" stroke-width="0.03"/><circle cx="${n(-r * 0.2)}" cy="${n(r * 0.1)}" r="${n(r * 0.1)}" fill="#F2C94C"/>` : '') + '</g>';
}
function rushes(x, y, rng) {
  let s = `<g transform="translate(${n(x)} ${n(y)})">`;
  for (let i = 0; i < 9; i++) { const a = rng() * 6.283, L = 0.5 + rng() * 0.6; s += `<path d="M0,0L${n(L * Math.cos(a))},${n(L * Math.sin(a))}" stroke="${['#5E8C3A', '#4E7B30', '#7FA24C'][i % 3]}" stroke-width="0.07" stroke-linecap="round"/>`; }
  return s + `<circle r="0.14" fill="#3F6A2A"/></g>`;
}
function pondRender(it, o, rng) {
  const poly = shapePoly(it.pts, it.smooth), d = shapeD(it.pts, it.smooth), ring = poly.concat([poly[0]]), L = polyLen(ring);
  const inlets = o.icon ? [] : pondInlets({ id: it.id }, o), atInlet = (p) => inlets.some((m) => dist(p, m.p) < m.w / 2 + 0.45);
  const xs0 = poly.map((q) => q[0]), ys0 = poly.map((q) => q[1]), mid = `pm-${String(it.id).replace(/[^\w-]/g, '')}`;
  const mbox = `x="${n(Math.min(...xs0) - 4)}" y="${n(Math.min(...ys0) - 4)}" width="${n(Math.max(...xs0) - Math.min(...xs0) + 8)}" height="${n(Math.max(...ys0) - Math.min(...ys0) + 8)}"`;
  const edgeMask = inlets.length ? `<defs><mask id="${mid}" maskUnits="userSpaceOnUse" ${mbox}><rect ${mbox} fill="#fff"/>${inlets.map((m) => `<circle cx="${n(m.p[0])}" cy="${n(m.p[1])}" r="${n(m.w / 2 + 0.15)}" fill="#000"/>`).join('')}</mask></defs>` : '';
  const edge = (svg) => (inlets.length ? `<g mask="url(#${mid})">${svg}</g>` : svg);
  if (!o.render) {
    let s = edgeMask + `<path d="${d}" fill="${o.color ? '#D3E9EC' : '#fff'}"/><path d="${d}" fill="url(#dd-water)"/>` + edge(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(o.u * 2)}" stroke-linejoin="round"/>`);
    for (let x = 0; x < L; x += 1.6) { const p = pointAlong(ring, x); if (atInlet(p)) continue; s += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(0.35 + rng() * 0.25)}" fill="#fff" stroke="${INK}" stroke-width="${n(o.u * 0.6)}"/>`; }
    return s;
  }
  let s = edgeMask + edge(`<path d="${d}" fill="none" stroke="#7D735F" stroke-width="1.5" stroke-linejoin="round"/>`);
  s += inlets.map((m) => `<circle cx="${n(m.p[0])}" cy="${n(m.p[1])}" r="${n(m.w / 2 + 0.2)}" fill="#3F7468"/>`).join('');
  s += `<path d="${d}" fill="url(#ld-pond)"/><path d="${d}" fill="#fff" filter="url(#ld-caus)" opacity="0.35"/>`;
  s += edge(`<path d="${d}" fill="none" stroke="#14302C" stroke-opacity="0.45" stroke-width="0.9" stroke-linejoin="round"/>`);
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]), bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const area = polyArea(poly);
  if (!o.icon) s += `<ellipse cx="${n(bb[0] + (bb[2] - bb[0]) * 0.38)}" cy="${n(bb[1] + (bb[3] - bb[1]) * 0.35)}" rx="${n((bb[2] - bb[0]) * 0.22)}" ry="${n((bb[3] - bb[1]) * 0.12)}" fill="#fff" fill-opacity="0.1" filter="url(#ld-softw)"/>`;
  // lily pads in loose groups, kept off the edge
  const pads = clamp(Math.round(area / 30), 2, 40);
  for (let i = 0, tries = 0; i < pads && tries < 400; tries++) {
    const p = [bb[0] + rng() * (bb[2] - bb[0]), bb[1] + rng() * (bb[3] - bb[1])];
    if (!inPoly(p, poly) || poly.some((q) => dist(q, p) < 1.8)) continue;
    s += lilyPad(p[0], p[1], 0.35 + rng() * 0.45, rng); i++;
  }
  // boulder edge with a few clumps of rushes
  let x = 0, k = 0;
  while (x < L) { const r = 0.35 + rng() * 0.45, p = pointAlong(ring, x); if (!atInlet(p)) s += (k % 7 === 3 ? rushes(p[0], p[1], rng) : boulder(p[0], p[1], r, rng)); x += r * 1.5 + rng() * 0.3; k++; }
  return s;
}
/* ------------------------------------------------------------------ where a stream meets a pond
 * The end of a stream that touches (or comes within ~2 ft of) a pond is its mouth: the water flows that way,
 * the course reaches into the pond, and the pond opens its edge there. o.water lists the ponds and streams. */
function nearestOnPoly(p, poly) {
  let best = null, bd = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2, 0, 1), q = [a[0] + dx * t, a[1] + dy * t], d = dist(p, q);
    if (d < bd) { bd = d; best = q; }
  }
  return { q: best, d: bd };
}
function segCross(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}
const pondGeo = (pd) => ({ id: pd.id, poly: shapePoly(pd.pts, pd.smooth), d: shapeD(pd.pts, pd.smooth) });
function streamCourse(it, o) {
  const w = it.width || 3;
  let line = it.smooth ? openSpline(it.pts, 0.4) : it.pts.map((p) => p.slice());
  const ponds = (o.water || []).filter((x) => x.type === 'pondShape' && !x.hidden).map(pondGeo);
  const touch = (p) => ponds.find((pd) => inPoly(p, pd.poly) || nearestOnPoly(p, pd.poly).d < 2 + w / 2);
  const t0 = touch(line[0]), t1 = touch(line[line.length - 1]);
  if (t0 && !t1) line = line.slice().reverse();
  const pond = t0 && !t1 ? t0 : t1;
  let mouth = null;
  if (pond) {
    let e = line[line.length - 1];
    if (!inPoly(e, pond.poly)) {   // stops short of the water: carry it over the edge
      const { q } = nearestOnPoly(e, pond.poly), L = dist(e, q) || 1, dir = [(q[0] - e[0]) / L, (q[1] - e[1]) / L];
      if (dist(e, q) > 0.05) line = line.concat([q]);
      e = [q[0] + dir[0] * (w * 0.5 + 0.8), q[1] + dir[1] * (w * 0.5 + 0.8)];
      line = line.concat([e]);
    }
    // the first place the course crosses into the pond
    let along = 0;
    for (let i = 1; i < line.length && !mouth; i++) {
      const a = line[i - 1], b = line[i];
      let tb = null;
      for (let k = 0; k < pond.poly.length; k++) { const t = segCross(a, b, pond.poly[k], pond.poly[(k + 1) % pond.poly.length]); if (t !== null && (tb === null || t < tb)) tb = t; }
      if (tb !== null || inPoly(b, pond.poly)) {
        const t = tb === null ? 1 : tb, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], L = dist(a, b) || 1;
        mouth = { pond, p, dir: [(b[0] - a[0]) / L, (b[1] - a[1]) / L], d: along + L * t, w };
      }
      along += dist(a, b);
    }
  }
  return { line, ponds, mouth, w };
}
/* the inlets other streams make in this pond */
function pondInlets(pd, o) {
  return (o.water || []).filter((x) => x.type === 'stream' && !x.hidden).map((s) => streamCourse(s, o).mouth).filter((m) => m && m.pond.id === pd.id);
}
/* a polyline shifted sideways by off */
function offsetLine(line, off) {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], L = dist(a, b) || 1;
    return [p[0] - (b[1] - a[1]) / L * off, p[1] + (b[0] - a[0]) / L * off];
  });
}
function streamDraw(it, o, rng) {
  const c = streamCourse(it, o), line = c.line, d = ptsD(line), w = c.w, L = polyLen(line), uid0 = String(it.id).replace(/[^\w-]/g, '');
  const inPond = (p, pad) => c.ponds.some((pd) => inPoly(p, pd.poly) || nearestOnPoly(p, pd.poly).d < (pad || 0));
  const xs = line.map((p) => p[0]), ys = line.map((p) => p[1]), m = w + 4;
  const box = `x="${n(Math.min(...xs) - m)}" y="${n(Math.min(...ys) - m)}" width="${n(Math.max(...xs) - Math.min(...xs) + 2 * m)}" height="${n(Math.max(...ys) - Math.min(...ys) + 2 * m)}"`;
  const wet = c.ponds.filter((pd) => line.some((p) => inPoly(p, pd.poly)));
  // a mask that lets the stream melt into the pond water (soft in Rendered, a clean cut in the drafting styles)
  const mid = `sm-${uid0}`, masked = wet.length && !o.icon;
  let s = masked ? `<defs><mask id="${mid}" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/>${wet.map((pd) => `<path d="${pd.d}" fill="#000"${o.render ? ' filter="url(#ld-mouth)"' : ''}/>`).join('')}</mask></defs>` : '';
  const at = (dd) => { const p = pointAlong(line, dd), a = pointAlong(line, Math.max(0, dd - 0.15)), b = pointAlong(line, Math.min(L, dd + 0.15)); return [p, Math.atan2(b[1] - a[1], b[0] - a[0])]; };
  const flowLen = c.mouth ? c.mouth.d : L;
  if (!o.render) {
    let g = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(w)}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${o.color ? '#D3E9EC' : '#fff'}" stroke-width="${n(Math.max(0.1, w - o.u * 2.4))}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#dd-water)" stroke-width="${n(Math.max(0.1, w - o.u * 2.4))}" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (let dd = Math.min(4, flowLen / 2); dd < flowLen - 1; dd += 7) {   // flow arrows, pointing downstream
      const [p, a] = at(dd), k = Math.min(0.9, w * 0.3);
      g += `<g transform="translate(${n(p[0])} ${n(p[1])}) rotate(${n(a * 180 / Math.PI)})"><path d="M${n(-k * 1.4)},0H${n(k * 0.6)}" stroke="${INK}" stroke-width="${n(o.u * 0.8)}"/><path d="M${n(k)},0L${n(-k * 0.2)},${n(-k * 0.55)}V${n(k * 0.55)}Z" fill="${INK}"/></g>`;
    }
    return masked ? `<g mask="url(#${mid})">${g}</g>` + s : g;
  }
  let g = `<path d="${d}" fill="none" stroke="#8A7F68" stroke-width="${n(w + 1.4)}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#A39880" stroke-width="${n(w + 0.9)}" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="0.3 0.25"/>`;
  g += `<path d="${d}" fill="none" stroke="#2B6268" stroke-width="${n(w)}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#3F8288" stroke-width="${n(w * 0.7)}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#66A8AA" stroke-opacity="0.75" stroke-width="${n(w * 0.32)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  // ripples (bowed downstream) and the odd riffle stone
  for (let dd = 0.8; dd < flowLen - 0.6; dd += 0.9 + rng() * 0.8) {
    const [p, a] = at(dd), off = (rng() - 0.5) * w * 0.5, cx = p[0] - Math.sin(a) * off, cy = p[1] + Math.cos(a) * off, deg = a * 180 / Math.PI;
    if (rng() < 0.22 && w > 1.5) g += `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(deg)})"><path d="M-0.45,-0.35Q-0.75,0 -0.45,0.35" stroke="#fff" stroke-opacity="0.75" stroke-width="0.06" fill="none"/></g>` + boulder(cx, cy, 0.22 + rng() * 0.15, rng);
    else g += `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(deg)})"><path d="M0,${n(-w * 0.12)}Q0.35,0 0,${n(w * 0.12)}" stroke="#fff" stroke-opacity="0.45" stroke-width="0.05" fill="none"/></g>`;
  }
  // current: three lanes of light streaks along the flow
  if (!o.icon) {
    [[-0.26, '0.5 1.9'], [0, '0.9 2.4'], [0.24, '0.4 1.5']].forEach(([f, dash], i) => {
      g += `<path d="${ptsD(offsetLine(line, f * w))}" fill="none" stroke="#fff" stroke-opacity="${[0.3, 0.42, 0.28][i]}" stroke-width="${n(Math.max(0.05, w * 0.035))}" stroke-linecap="round" stroke-dasharray="${dash}" stroke-dashoffset="${n(i * 0.7)}"/>`;
    });
  }
  s += masked ? `<g mask="url(#${mid})">${g}</g>` : g;
  // rocks along both banks, stopping at the pond edge
  for (const side of [-1, 1]) for (let dd = rng() * 0.6; dd < L; dd += 0.7 + rng() * 0.7) {
    const [p, a] = at(dd), r = 0.22 + rng() * 0.35, off = side * (w / 2 + 0.25 + rng() * 0.2), q = [p[0] - Math.sin(a) * off, p[1] + Math.cos(a) * off];
    if (!inPond(q, 0.9)) s += boulder(q[0], q[1], r, rng);
  }
  if (c.mouth && !o.icon) {   // where it pours in: two boulders frame the mouth, foam, and rings spreading over the pond
    const { p, dir } = c.mouth, nx = -dir[1], ny = dir[0];
    for (const sd of [-1, 1]) s += boulder(p[0] + nx * sd * (w / 2 + 0.55) - dir[0] * 0.2, p[1] + ny * sd * (w / 2 + 0.55) - dir[1] * 0.2, 0.55 + rng() * 0.2, rng);
    const fx = p[0] + dir[0] * 0.5, fy = p[1] + dir[1] * 0.5, deg = Math.atan2(dir[1], dir[0]) * 180 / Math.PI;
    let foam = `<g transform="translate(${n(fx)} ${n(fy)}) rotate(${n(deg)})"><path d="M-0.1,${n(-w * 0.42)}Q0.35,0 -0.1,${n(w * 0.42)}" stroke="#fff" stroke-opacity="0.85" stroke-width="0.12" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 10; i++) foam += `<circle cx="${n(0.2 + rng() * 0.9)}" cy="${n((rng() - 0.5) * w * 0.8)}" r="${n(0.04 + rng() * 0.07)}" fill="#fff" fill-opacity="0.8"/>`;
    s += foam + '</g>';
    const cid = `mc-${uid0}`, rc = [p[0] + dir[0] * 0.9, p[1] + dir[1] * 0.9], R = Math.max(2.5, w * 1.2);
    s += `<defs><clipPath id="${cid}"><path d="${c.mouth.pond.d}"/></clipPath></defs><g clip-path="url(#${cid})" fill="none" stroke="#fff">`;
    for (let i = 0; i < 3; i++) {
      s += `<circle cx="${n(rc[0])}" cy="${n(rc[1])}" r="${n(R * (i + 1) / 3.2)}" stroke-width="0.06" opacity="${n(0.6 - i * 0.18)}"/>`;
    }
    s += '</g>';
  }
  return s;
}
RDRAW.stream = DDRAW.stream = streamDraw;
RDRAW.pondShape = DDRAW.pondShape = (it, o, rng) => shapeRender(it, o, rng);
RDRAW.poolShape = DDRAW.poolShape = (it, o, rng) => shapeRender(it, o, rng);

/* draw one item. o: {u: ink width (ft), render, color, tags, hit, icon, seeTrees} */
function drawItem(it, o) {
  const t = T[it.type], rng = rngFor(it.id);
  const fn = (o.render && RDRAW[it.type]) || DDRAW[it.type];
  const inner = fn(it, o, rng);
  let g;
  if (t.kind === 'circle' || t.kind === 'text') g = `<g transform="translate(${n(it.x)} ${n(it.y)})">${inner}</g>`;
  else if (t.kind === 'box') g = `<g transform="translate(${n(it.x)} ${n(it.y)}) rotate(${n(it.rot || 0)})">${inner}</g>`;
  else {
    g = inner;
    if (o.hit && t.kind === 'line') g += `<path d="${ptsD(it.smooth ? wallLine(it) : it.pts)}" fill="none" stroke="transparent" stroke-width="${n(Math.max(2, (it.width || 0) + 1))}" stroke-linejoin="round"/>`;
  }
  if (o.turfClip && !o.icon && (it.type === 'lawn' || it.type === 'lawnShape')) {
    /* the house's shadow falls on the grass: drawn with the lawn, inside the lawn's own outline */
    let sh = '';
    if (o.turfShadow && o.render) {
      const cid = 'lc-' + String(it.id).replace(/[^\w-]/g, '');
      const own = it.type === 'lawn' ? `<rect x="${n(-it.w / 2)}" y="${n(-it.h / 2)}" width="${n(it.w)}" height="${n(it.h)}" transform="translate(${n(it.x)} ${n(it.y)}) rotate(${n(it.rot || 0)})"/>` : `<path d="${shapeD(it.pts, it.smooth)}"/>`;
      sh = `<defs><clipPath id="${cid}">${own}</clipPath></defs><g clip-path="url(#${cid})">${castShadow(o.turfShadow, 1.8, 1, 0.36)}</g>`;
    }
    g = `<g clip-path="url(#turfClip)">${g}${sh}</g>`;
  }
  if (!o.icon) g += itemLabel(it, o);
  const op = it.op !== undefined ? it.op : (o.seeTrees && t.tree && !o.icon ? 0.5 : null);
  return `<g${o.hit ? ` data-id="${esc(it.id)}"` : ''}${it.hidden ? ' display="none"' : ''}${op !== null && op < 1 ? ` opacity="${op}"` : ''}>${g}</g>`;
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
  wall: { pts: [[-4.6, 3], [-1, 3], [3.6, -2.6]], vb: [-5.8, -4.6, 11.6, 9.4] },
  lights: { pts: [[-5, -2.4], [0, 1.2], [5, -2.4]], vb: [-6, -4.4, 12, 8.8] },
  arrow: { pts: [[-4.5, 3], [0, -1], [4.5, -1]], vb: [-5.6, -4.8, 11.2, 9.6] },
};
const CIRCLE_VB = [-5.6, -5.6, 11.2, 11.2];
for (const [k, v] of Object.entries(FURN_T)) { const w = v.d.w, h = v.d.h, m = Math.max(w, h) * 0.08; ICON[k] = { w, h, vb: [-w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m] }; }
ICON.pondShape = { pts: [[-4.4, -2.6], [0.5, -3.8], [4.4, -1.6], [3.2, 3.2], [-1.6, 3.6], [-4.6, 0.8]], smooth: true, vb: [-6.2, -5.4, 12.4, 10.8] };
ICON.stream = { pts: [[-5.4, 3.4], [-2.2, 0.4], [1.8, 1.4], [5.4, -3.2]], smooth: true, width: 2, vb: [-6, -4.6, 12, 9.2] };
ICON.poolShape = { pts: [[-4.5, -3], [1, -4], [4.6, -1], [3.5, 3.6], [-2, 3.8], [-4.8, 1]], smooth: true, vb: [-6, -5.2, 12, 10.4] };
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
