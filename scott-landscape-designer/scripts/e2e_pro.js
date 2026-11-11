/* End-to-end check of the rendering and performance overhaul: generated textures, GPU pan/zoom with a sharp
 * redraw, keyed plan updates, the schematic navigator, Fill the yard with lawn, edge and alignment snapping,
 * and the stability guards (photo kept once in undo, unreadable saved data, export).
 *   node scripts/e2e_pro.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '../dist/verdant-studio.html');
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[pro] ok: ' : '[pro] FAIL: ') + m); };
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, offline: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE); await p.waitForTimeout(600);
  const scr = (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number); return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height]; }, [x, y]);
  const click = async (x, y) => { const [a, c] = await scr(x, y); await p.mouse.click(a, c); await p.waitForTimeout(430); };
  const store = () => p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')));
  const items = async () => (await store()).items;
  const plan = () => p.evaluate(() => { const s = document.getElementById('plan'); return { vb: s.getAttribute('viewBox'), tr: s.style.transform, w: s.style.width, h: s.style.height }; });

  // 1. textures and mowing stripes
  const tx = await p.evaluate(() => ({ turf: (document.querySelector('#plan image#tx-turf') || { getAttribute: () => '' }).getAttribute('href').slice(0, 22), n: document.querySelectorAll('#plan defs image').length, stripes: document.querySelectorAll('#ld-lawn-cyda rect').length }));
  ok(tx.turf === 'data:image/png;base64,' && tx.n >= 8, `surfaces use generated textures (${tx.n} tiles, no downloads)`);
  ok(tx.stripes >= 3, 'lawns keep their mowing stripes over the turf texture');

  // 2. the plan has a fixed pixel size; a zoom gesture slides it on the GPU, then redraws sharp
  let v0 = await plan();
  ok(/px$/.test(v0.w) && /px$/.test(v0.h) && !v0.tr, 'the plan has a fixed pixel size and no pending transform');
  const box = await (await p.$('.canvas')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.keyboard.down('Control'); await p.mouse.wheel(0, -200); await p.keyboard.up('Control');
  const live = await plan();
  ok(/scale\(/.test(live.tr) && live.vb === v0.vb, 'zooming moves the drawn plan with a transform (no redraw mid-gesture)');
  await p.waitForTimeout(400);
  let v1 = await plan();
  ok(!v1.tr && v1.vb !== v0.vb, 'the plan is redrawn sharp when the gesture pauses');
  await p.keyboard.press('h');
  await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 4 });
  const panning = await plan();
  ok(/translate\(/.test(panning.tr) && panning.vb === v1.vb, 'panning slides the drawn plan');
  await p.mouse.up(); await p.waitForTimeout(100);
  const panned = await plan();
  ok(!panned.tr && panned.vb !== v1.vb, 'and settles as soon as the mouse is released');
  await p.keyboard.press('v'); await p.click('#zFit'); await p.waitForTimeout(300);

  // 3. placing a second plant leaves the first plant's drawing untouched
  await p.click('[data-tool="dtree"]'); await click(20, 20); await p.keyboard.press('Escape');
  const first = (await items())[0].id;
  await p.evaluate((id) => { document.querySelector(`#gDesign [data-id="${id}"]`).__kept = true; }, first);
  await p.click('[data-tool="bshrub"]'); await click(60, 20); await p.keyboard.press('Escape');
  ok(await p.evaluate((id) => document.querySelector(`#gDesign [data-id="${id}"]`).__kept === true, first) && (await items()).length === 2, 'adding an item does not rebuild the others');
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  ok(await p.evaluate((id) => document.querySelector(`#gDesign [data-id="${id}"]`).__kept === true && document.querySelectorAll('#gDesign > [data-id]').length === 1, first), 'undo removes only what changed');

  // 4. navigator: a light schematic, not a copy of the drawing
  await p.waitForTimeout(350);
  const nav = await p.evaluate(() => ({ uses: document.querySelectorAll('#nav use[href="#gDesign"]').length, shapes: document.querySelectorAll('#navItems > *').length, rect: !!document.getElementById('navRect').style.transform }));
  ok(nav.uses === 0 && nav.shapes === 1 && nav.rect, 'the navigator draws a schematic with its own view box');

  // 5. fill the yard with lawn
  const menus = await p.evaluate(() => [...document.querySelectorAll('[data-menu]')].map((m) => m.textContent.trim()));
  await p.click(`[data-menu="${menus.indexOf('Arrange')}"]`); await p.click('[data-m="filllawn"]'); await p.waitForTimeout(300);
  let its = await items();
  ok(its[0].type === 'lawnShape' && JSON.stringify(its[0].pts) === '[[0,0],[82,0],[82,107],[0,107]]' && its.length === 2, 'Fill the yard with lawn puts one lawn under everything');
  ok(await p.evaluate((id) => !!document.querySelector(`#gDesign [data-id="${id}"] > g[clip-path="url(#turfClip)"]`), its[0].id), 'the lawn is kept off the house, garage, driveway and sidewalk');
  await p.keyboard.press('Escape');
  await p.click('[data-tool="perennial"]'); await click(60, 92); await p.keyboard.press('Escape');
  await p.click('[data-pane="pSched"]'); await p.waitForTimeout(200);
  const sod = +(((await p.textContent('#sched')).match(/Bermudagrass[^0-9]*([\d,]+) sq ft/) || [])[1] || '0').replace(/,/g, '');
  ok(sod > 5800 && sod < 6900, `the takeoff counts only the grass that shows (${sod} sq ft of an 8,774 sq ft outline)`);
  await p.click('[data-libtab="build"]'); await p.click('[data-el="lawnfill"]'); await p.waitForTimeout(250);
  ok((await items()).filter((i) => i.type === 'lawnShape').length === 1, 'filling again does not stack a second lawn');
  await p.click('[data-pane="pCheck"]').catch(() => {}); await p.click('#bCheck'); await p.waitForTimeout(200);
  ok(!/Lawn[^.]*sits on/i.test(await p.textContent('#issues')), 'the design check accepts a lawn that runs under the house and driveway');
  await p.keyboard.press('Escape');

  // 6. snapping: onto the house wall, with a guide line, and in line with a corner
  await p.click('[data-tool="path"]');
  await click(44.3, 90.2);
  let [hx, hy] = await scr(44.6, 74.45); await p.mouse.move(hx, hy, { steps: 4 }); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelectorAll('#gOver line[stroke="#E08A00"]:not([stroke-dasharray])').length === 1), 'an orange guide marks the wall a point is snapping to');
  await p.mouse.click(hx, hy); await p.waitForTimeout(430);
  [hx, hy] = await scr(34.3, 96.4); await p.mouse.move(hx, hy, { steps: 4 }); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelectorAll('#gOver line[stroke="#E08A00"][stroke-dasharray]').length >= 1), 'a dashed guide shows a point lining up with a corner');
  await p.mouse.click(hx, hy); await p.waitForTimeout(430); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const walk = (await items()).find((i) => i.type === 'path');
  ok(walk && walk.pts[1][1] === 74 && Math.abs(walk.pts[1][0] - 44.6) < 0.2, `the point landed exactly on the house wall (${walk && walk.pts[1]})`);
  ok(walk && walk.pts[2][0] === 34, `the next point lined up with the house corner at x = 34 (${walk && walk.pts[2]})`);
  await p.keyboard.press('Escape');

  // 6b. gates set into a fence, and steps
  await p.click('[data-libtab="build"]');
  ok(await p.isVisible('[data-el="gate-walk"]') && await p.isVisible('[data-el="gate-double"]') && await p.isVisible('[data-el="stairs-stone"]') && await p.isVisible('[data-el="stairs-timber"]'), 'Build tab lists gates and steps');
  await p.click('[data-el="fence-picket"]');
  for (const [x, y] of [[4, 20], [30, 20]]) await click(x, y);
  await p.keyboard.press('Enter'); await p.waitForTimeout(250); await p.keyboard.press('Escape');
  const fenceId = (await items()).find((i) => i.type === 'fence').id;
  await p.click('[data-el="gate-walk"]'); await click(15.4, 21.6); await p.keyboard.press('Escape');
  let gate = (await items()).find((i) => i.type === 'gate');
  ok(gate && gate.y === 20 && Math.abs(gate.x - 15.4) < 0.3 && (gate.rot || 0) === 0 && gate.style === 'picket' && gate.w === 4, `a gate dropped near the fence sets into its line and takes its style (${gate && [gate.x, gate.y, gate.style]})`);
  ok(await p.evaluate((id) => document.querySelectorAll(`#gDesign [data-id="${id}"] rect[fill="#FFFFFF"][stroke="#8F8B82"]`).length >= 4, fenceId), 'the fence opens for the gate, with a post on each side');
  await p.click('[data-pane="pSched"]'); await p.waitForTimeout(200);
  let sch = await p.textContent('#sched');
  ok(/22 lin ft/.test(sch.replace(/\s+/g, ' ')) && /4 ft single gate, white picket/.test(sch), 'the takeoff counts the gate and 22 ft of fence (26 ft less the 4 ft opening)');
  await p.click(`#gDesign [data-id="${gate.id}"]`, { force: true }).catch(() => {});
  await p.evaluate((id) => { const r = document.querySelector(`[data-obj="${id}"]`); if (r) r.click(); }, gate.id);
  await p.click('[data-pane="pObjects"]'); await p.click(`[data-obj="${gate.id}"]`); await p.waitForTimeout(200);
  await p.click('#optCtx [data-setgate="2"]'); await p.waitForTimeout(200);
  gate = (await items()).find((i) => i.type === 'gate');
  ok(gate.leaves === 2 && gate.w === 10, 'the bar above the plan turns it into a 10 ft double gate');
  await p.click(`[data-obj="${fenceId}"]`); await p.waitForTimeout(200);
  await p.click('#optCtx [data-setfence="iron"]'); await p.waitForTimeout(250);
  ok((await items()).find((i) => i.type === 'gate').style === 'iron', 'changing the fence style changes its gate to match');
  await p.keyboard.press('Escape');
  await p.click('[data-el="stairs-stone"]'); await click(40, 22); await p.keyboard.press('Escape');
  let steps = (await items()).find((i) => i.type === 'stairs');
  ok(steps && steps.style === 'stone' && steps.w === 4 && steps.h === 7, 'stone steps placed from the Build tab');
  await p.click(`[data-obj="${steps.id}"]`); await p.waitForTimeout(200);
  await p.click('#optCtx [data-setstairs="brick"]'); await p.waitForTimeout(200);
  ok((await items()).find((i) => i.type === 'stairs').style === 'brick' && /6 steps/.test(await p.textContent('#optCtx')), 'the bar changes them to brick and shows 6 steps');
  await p.click('[data-pane="pSched"]'); await p.waitForTimeout(200);
  ok(/Brick steps, 4 ft wide/.test(await p.textContent('#sched')), 'the takeoff lists the steps');
  await p.keyboard.press('Escape');

  // 7. export still works with the textures
  await p.fill('#fName', 'Pat Student');
  await p.click('#bExport'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-fmt="png"]')]); await dl.saveAs(D + 'pro-sheet.png');
  ok(fs.statSync(D + 'pro-sheet.png').size > 1500000, 'the exported sheet carries the textures');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // 8. a design with a traced photo: undo and redo keep the photo, and it is saved whole
  const photo = 'data:image/jpeg;base64,' + 'A'.repeat(300000);
  await p.evaluate((src) => {
    localStorage.setItem('scottDesign.v1', JSON.stringify({ version: 3, pid: 'photo1', meta: {}, wants: [], site: { kind: 'custom', name: 'Photo Yard', client: 'Me', w: 80, h: 100, street: 'bottom', north: 0, img: { src, x: 0, y: 0, w: 80, h: 60, op: 0.6 } }, items: [] }));
  }, photo);
  await p.reload(); await p.waitForTimeout(700);
  await p.click('[data-tool="bshrub"]');
  for (let i = 0; i < 6; i++) await click(10 + i * 8, 80);
  await p.keyboard.press('Escape');
  for (let i = 0; i < 3; i++) { await p.keyboard.press('Control+z'); await p.waitForTimeout(120); }
  await p.keyboard.press('Control+y'); await p.waitForTimeout(200);
  const ph = await store();
  ok(ph.items.length === 4 && ph.site.img.src.length === photo.length, 'undo and redo keep the traced photo, and the saved design holds it whole');
  ok(await p.evaluate(() => !/\\u0001img:/.test(localStorage.getItem('scottDesign.v1'))), 'no placeholder leaks into the saved design');

  // 9. saved data that cannot be read is set aside, and the app still starts
  await p.evaluate(() => localStorage.setItem('scottDesign.v1', '{"version":3,"items":[{"type":"dtree","x":'));
  await p.reload(); await p.waitForTimeout(700);
  const rec = await p.evaluate(() => ({ kept: (localStorage.getItem('scottDesign.recovery') || '').startsWith('{"version":3'), toast: document.getElementById('toast').textContent, tools: document.querySelectorAll('#rail .tool').length }));
  ok(rec.kept && /could not be read/.test(rec.toast) && rec.tools > 10, 'unreadable saved data is set aside with a notice and the app opens a new plan');

  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
