/* End-to-end check of garden walls, string lights, ponds and streams.
 *   node scripts/e2e_walls.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '../dist/verdant-studio.html');
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[walls] ok: ' : '[walls] FAIL: ') + m); };
  {   // the extra wall tool still fits on a laptop screen
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, offline: true })).newPage();
    await p.goto(FILE); await p.waitForTimeout(400);
    ok(await p.evaluate(() => { const rail = document.getElementById('rail').getBoundingClientRect(); return [...document.querySelectorAll('#rail .tool')].every((t) => t.getBoundingClientRect().bottom <= rail.bottom); }), 'at 1280×720 every tool, including the wall tool, is on screen');
    await p.context().close();
  }
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, offline: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE); await p.waitForTimeout(500);
  const scr = (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number); return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height]; }, [x, y]);
  const click = async (x, y) => { const [a, c] = await scr(x, y); await p.mouse.click(a, c); await p.waitForTimeout(420); };
  const items = async () => (await p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')))).items;
  const newest = async (before) => (await items()).find((i) => !before.includes(i.id));
  const get = async (id) => (await items()).find((i) => i.id === id);
  let ids;

  // walls from the Build tab
  await p.click('[data-libtab="build"]');
  for (const k of ['block', 'stone', 'seat', 'brick', 'timber', 'seat-curve']) ok(await p.isVisible(`[data-el="wall-${k}"]`), `Build tab lists wall-${k}`);
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="wall-seat"]');
  for (const [x, y] of [[10, 10], [30, 10], [30, 20]]) await click(x, y);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const wall = await newest(ids);
  ok(wall && wall.type === 'wall' && wall.style === 'seat' && wall.height === 1.5 && wall.width === 1.5 && !wall.smooth, 'straight stone seat wall drawn (18 in tall, 18 in thick)');
  await p.click('#optCtx [data-setwall="block"]');
  let w = await get(wall.id);
  ok(w.style === 'block' && w.height === 3 && w.width === 1, 'top bar turns it into a 3 ft block retaining wall');
  await p.selectOption('#optCtx [data-wheight]', '4');
  ok((await get(wall.id)).height === 4, 'wall height set to 4 ft');
  await p.click('#optCtx [data-setsmooth="curved"]');
  ok((await get(wall.id)).smooth === true, 'wall made curved');
  await p.keyboard.press('Escape');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="wall-stone-curve"]');
  for (const [x, y] of [[10, 30], [20, 26], [30, 30]]) await click(x, y);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const cw = await newest(ids);
  ok(cw && cw.style === 'stone' && cw.smooth === true, 'curved fieldstone wall from the library');

  // string lights, pond and stream from the Outdoor tab
  await p.keyboard.press('Escape');
  await p.click('[data-libtab="living"]');
  for (const k of ['lights-bistro', 'lights-drape', 'lights-fairy', 'pondShape', 'stream-3', 'stream-1']) ok(await p.isVisible(`[data-el="${k}"]`), `Outdoor tab lists ${k}`);
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="lights-bistro"]');
  for (const [x, y] of [[40, 8], [60, 8]]) await click(x, y);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const lt = await newest(ids);
  ok(lt && lt.type === 'lights' && lt.style === 'bistro', 'bistro string lights strung between two poles');
  await p.click('#optCtx [data-setlights="fairy"]');
  ok((await get(lt.id)).style === 'fairy', 'top bar switches them to fairy lights');
  ok(await p.evaluate((id) => document.querySelector(`[data-id="${id}"]`).closest('#gDesign') !== null, lt.id), 'lights draw on the plan');
  await p.keyboard.press('Escape');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="pondShape"]');
  for (const [x, y] of [[42, 20], [56, 18], [60, 28], [50, 34], [42, 30]]) await click(x, y);
  await click(42, 20);
  const pond = await newest(ids);
  ok(pond && pond.type === 'pondShape' && pond.pts.length === 5 && pond.smooth, 'natural pond drawn with a curved edge');
  await p.keyboard.press('Escape');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="stream-3"]');
  for (const [x, y] of [[66, 6], [62, 14], [60, 22]]) await click(x, y);
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const stream = await newest(ids);
  ok(stream && stream.type === 'stream' && stream.width === 3 && stream.smooth, '3 ft curved stream drawn');
  const join = await p.evaluate(([sid, pid]) => { const g = document.querySelector(`#gDesign [data-id="${sid}"]`); return { mask: !!g.querySelector('mask'), rings: !!g.querySelector('clipPath'), anim: g.querySelectorAll('animate').length, inlet: !!document.querySelector(`#gDesign [data-id="${pid}"] mask`) }; }, [stream.id, pond.id]);
  ok(join.mask && join.rings && join.inlet, 'the stream runs into the pond: water blends in, the pond edge opens, ripples at the mouth');
  ok(join.anim > 0, 'the stream water moves (animated current and ripples)');
  await p.click('[data-pane="pLayers"]'); await p.click('label:has(#tFlow)'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#gDesign animate').length === 0), 'Show → Moving water off stops the motion');
  await p.click('label:has(#tFlow)'); await p.click('[data-pane="pProps"]');
  await p.click(`#gDesign [data-id="${stream.id}"]`, { force: true }).catch(() => {});
  await p.evaluate((id) => { /* select through the layers list */ const row = document.querySelector(`#objList [data-id="${id}"], [data-row="${id}"]`); if (row) row.click(); }, stream.id);
  await p.waitForTimeout(200);
  const widthIn = await p.$('#props [data-f="width"]');
  if (widthIn) { await widthIn.fill('5'); await widthIn.dispatchEvent('input'); await p.waitForTimeout(700); ok((await get(stream.id)).width === 5, 'stream widened to 5 ft under Properties'); }
  else ok(false, 'stream width field under Properties');

  // takeoff, drafting style, export
  await p.click('[data-pane="pSched"]');
  const sched = await p.textContent('#sched');
  ok(/retaining wall/i.test(sched) && /Fieldstone wall/.test(sched) && /Fairy lights/.test(sched) && /Natural pond/.test(sched) && /Stream bed/.test(sched), 'takeoff lists walls, lights, pond and stream');
  await p.screenshot({ path: D + 'walls-render.png' });
  await p.click('[data-style="bw"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: D + 'walls-bw.png' });
  ok(await p.evaluate(() => document.querySelectorAll('#gDesign [data-id]').length >= 5), 'drafting style draws them all');
  await p.click('[data-style="render"]');
  // round trip through the saved file format
  const back = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('scottDesign.v1')); return s.items.filter((i) => ['wall', 'lights', 'pondShape', 'stream'].includes(i.type)).length; });
  ok(back === 5, 'walls, lights, pond and stream saved with the design');
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
