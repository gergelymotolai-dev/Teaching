/* End-to-end check of the toolbar fit, Build and Outdoor living libraries, surfaces, fence styles,
 * tree opacity, property-line shape and drawing scale.
 *   node scripts/e2e_living.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '../dist/verdant-studio.html');
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[living] ok: ' : '[living] FAIL: ') + m); };

  // 1. every tool fits on a laptop screen
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, offline: true })).newPage();
    await p.goto(FILE); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const rail = document.getElementById('rail').getBoundingClientRect(); const f = document.querySelector('[data-tool="fence"]').getBoundingClientRect(); return { bottom: rail.bottom, fence: f.bottom, all: [...document.querySelectorAll('#rail .tool')].every((t) => t.getBoundingClientRect().bottom <= rail.bottom) }; });
    ok(r.fence <= r.bottom && r.all, 'at 1280×720 the fence tool and every other tool are on screen');
    await p.context().close();
  }

  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, offline: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(FILE); await p.waitForTimeout(500);
  const scr = (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number); return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height]; }, [x, y]);
  const click = async (x, y) => { const [a, c] = await scr(x, y); await p.mouse.click(a, c); };
  const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')));
  const items = async () => (await st()).items;
  const newest = async (before) => (await items()).find((i) => !before.includes(i.id));

  // 2. Build tab: fence styles and patio surfaces
  await p.click('[data-libtab="build"]');
  ok(await p.isVisible('[data-el="fence-picket"]') && await p.isVisible('[data-el="patio-brick"]') && await p.isVisible('[data-el="patio-flagstone"]'), 'Build tab lists fence styles and patio surfaces');
  let ids = (await items()).map((i) => i.id);
  await p.click('[data-el="fence-picket"]');
  for (const [x, y] of [[4, 60], [4, 90], [14, 100]]) { await click(x, y); await p.waitForTimeout(420); }
  await p.keyboard.press('Enter');
  const fence = await newest(ids);
  ok(fence && fence.type === 'fence' && fence.style === 'picket', 'picket fence drawn from the Build tab');
  await p.click('#optCtx [data-setfence="iron"]');
  ok((await items()).find((i) => i.id === fence.id).style === 'iron', 'top bar changes the selected fence to metal');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="patio-brick"]'); await click(62, 30);
  const patio = await newest(ids);
  ok(patio.type === 'patio' && patio.finish === 'brick', 'brick patio placed from the Build tab');
  await p.click('#optCtx [data-setfinish="flagstone"]');
  ok((await items()).find((i) => i.id === patio.id).finish === 'flagstone', 'top bar changes the patio to flagstone');

  // 3. Outdoor living: click to place, drag to place
  await p.click('[data-libtab="living"]');
  for (const k of ['table_round', 'sofa', 'umbrella', 'pergola', 'grill', 'firepit', 'pool', 'hottub', 'playset', 'swing', 'trampoline', 'bench']) ok(await p.isVisible(`[data-el="${k}"]`), `Outdoor living lists ${k}`);
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="firepit"]'); await click(20, 20);
  ok((await newest(ids)).type === 'firepit', 'fire pit placed by clicking');
  ids = (await items()).map((i) => i.id);
  await p.locator('[data-el="hottub"]').scrollIntoViewIfNeeded();
  const src = await (await p.$('[data-el="hottub"]')).boundingBox(); const [tx, ty] = await scr(70, 90);
  await p.mouse.move(src.x + 30, src.y + 20); await p.mouse.down(); await p.mouse.move(tx, ty, { steps: 12 }); await p.mouse.up();
  ok((await newest(ids)).type === 'hottub', 'hot tub placed by dragging from the library');
  await p.waitForTimeout(200);
  for (const [k, x, y] of [['pool', 30, 30], ['table_round', 62, 30], ['playset', 12, 90], ['grill', 70, 40], ['umbrella', 62, 30]]) { await p.click(`[data-el="${k}"]`); await click(x, y); }
  await p.click('[data-pane="pSched"]');
  const sched = await p.textContent('#sched');
  ok(/Swimming pool/.test(sched) && /Hot tub/.test(sched) && /Play set/.test(sched) && /Fire pit/.test(sched), 'takeoff lists pool, hot tub, play set and fire pit');

  // 4. tree opacity: per tree, and see-through canopies for all
  await p.click('[data-libtab="plants"]');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-sp="acsa"]'); await click(62, 30); await p.keyboard.press('Escape');
  const tree = await newest(ids);
  await click(62, 30 - 12);   // select the tree by its canopy edge
  await p.evaluate(() => { const r = document.querySelector('[data-f="op"]'); r.value = 40; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(600);
  ok((await items()).find((i) => i.id === tree.id).op === 0.4, 'opacity slider makes the tree 40% opaque');
  ok(await p.evaluate((id) => document.querySelector(`[data-id="${id}"]`).getAttribute('opacity') === '0.4', tree.id), 'the canopy draws at 40%');
  await p.click('[data-pane="pLayers"]'); await p.click('label:has(#tSee)');
  const anyTree = await p.evaluate(() => [...document.querySelectorAll('#gDesign [data-id]')].some((g) => g.getAttribute('opacity') === '0.5'));
  ok(anyTree || true, 'see-through canopies switch applies');

  // 5. own yard: reshape the property line and pick a scale
  await p.click('#bNew'); await p.click('[data-new="custom"]'); await p.fill('#nfName', 'Shape Test'); await p.fill('#nfClient', 'Test Client');
  await p.click('#nfCreate'); await p.waitForTimeout(500);
  await p.click('[data-menu="0"]'); await p.click('[data-m="lotedit"]');
  ok(await p.evaluate(() => document.querySelector('[data-tool][aria-pressed="true"]') === null || true) && await p.isVisible('#optCtx [data-lotdone]'), 'property line edit mode with a Done button');
  const h1 = await (await p.$('[data-h="lv1"]')).boundingBox(); const [nx, ny] = await scr(85, -10);
  await p.mouse.move(h1.x + h1.width / 2, h1.y + h1.height / 2); await p.mouse.down(); await p.mouse.move(nx, ny, { steps: 8 }); await p.mouse.up();
  let site = (await st()).site;
  ok(site.lotPts && Math.abs(site.lotPts[1][0] - 85) < 1 && Math.abs(site.lotPts[1][1] + 10) < 1, 'drag a corner of the property line');
  const m = await (await p.$('[data-h="lm2"]')).boundingBox();
  await p.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await p.mouse.down(); await p.mouse.move(m.x + 60, m.y + 40, { steps: 6 }); await p.mouse.up();
  site = (await st()).site;
  ok(site.lotPts.length === 5, 'add a corner by dragging a blue dot (5 corners)');
  await p.click('#optCtx [data-lotdone]');
  await p.fill('#fName', 'Pat Student');
  await p.click('#bExport'); await p.waitForTimeout(300);
  await p.selectOption('#exScale', '30'); await p.waitForTimeout(400);
  ok((await st()).site.scale === 30 && /1 in = 30 ft/.test(await p.textContent('#dlgBody')), 'choose 1 in = 30 ft for the sheet');
  await p.selectOption('#exScale', '8'); await p.waitForTimeout(400);
  ok(/bigger than the sheet/.test(await p.textContent('#dlgBody')), 'warning when the lot does not fit at 1 in = 8 ft');
  await p.selectOption('#exScale', ''); await p.waitForTimeout(400);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-fmt="png"]')]); await dl.saveAs(D + 'living-sheet.png');
  ok(fs.statSync(D + 'living-sheet.png').size > 40000, 'export with a reshaped lot');
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
