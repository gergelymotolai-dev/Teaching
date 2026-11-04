/* End-to-end check of bed shapes, mixed planting beds, freeform beds and your own plants.
 *   node scripts/e2e_beds.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, offline: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[beds] ok: ' : '[beds] FAIL: ') + m); };
  await p.goto('file://' + path.resolve(__dirname, '../dist/landscape-designer.html')); await p.waitForTimeout(500);
  const scr = (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number); return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height]; }, [x, y]);
  const click = async (x, y) => { const [a, c] = await scr(x, y); await p.mouse.click(a, c); };
  const items = async () => (await p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')))).items;
  const st = async () => p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')));

  // 1. a square bed: pick Rectangle in the top bar before placing, and switch a placed bed back and forth
  await p.click('[data-tool="perennial"]');
  ok(await p.isVisible('#optCtx [data-prefform="rect"]'), 'bed shape buttons show in the top bar');
  await p.click('#optCtx [data-prefform="rect"]'); await click(20, 30);
  let bed = (await items())[0];
  ok(bed.form === 'rect', 'new bed is a rectangle');
  await p.click('#optCtx [data-setform="oval"]');
  ok((await items())[0].form === undefined || (await items())[0].form === 'oval', 'top bar changes the selected bed to an oval');
  await p.click('#optCtx [data-setform="rect"]');
  ok((await items())[0].form === 'rect', 'and back to a rectangle');
  // 2. mix plants: drag a plant from the library onto the bed, + button adds another, shares are editable
  await p.fill('#libSearch', 'coneflower');
  const src = await (await p.$('[data-sp="ecpu"]')).boundingBox(); const [bx0, by0] = await scr(20, 30);
  await p.mouse.move(src.x + 30, src.y + 20); await p.mouse.down(); await p.mouse.move(bx0, by0, { steps: 12 }); await p.mouse.up();
  await p.fill('#libSearch', '');
  await p.click('[data-act="mixadd"]');
  bed = (await items())[0];
  ok(bed.mix && bed.mix.length === 3, 'drag onto the bed adds the plant; bed holds: ' + (bed.mix || []).map((m) => m.sp).join(', '));
  await p.fill('[data-mixw="0"]', '60'); await p.press('[data-mixw="0"]', 'Tab');
  await p.selectOption('[data-mix="2"]', 'limu');
  bed = (await items())[0];
  ok(bed.mix[0].w === 60 && bed.mix[2].sp === 'limu', 'share and plant changed in the bed editor');
  await p.click('[data-mixdel="1"]');
  ok((await items())[0].mix.length === 2, 'remove a plant from the bed');
  // 3. misshapen: make it freeform and drag a corner
  await p.click('[data-act="freeform"]');
  bed = (await items())[0];
  ok(bed.type === 'bedShape' && bed.pts.length === 4 && bed.mix.length === 2, 'freeform keeps the plants and gives 4 corners');
  const h0 = await p.$('[data-h="v1"]'); const bx = await h0.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down();
  const [tx, ty] = await scr(bed.pts[1][0] + 6, bed.pts[1][1] - 5); await p.mouse.move(tx, ty, { steps: 6 }); await p.mouse.up();
  const moved = (await items())[0].pts[1];
  ok(Math.abs(moved[0] - (bed.pts[1][0] + 6)) < 1.1, 'drag a corner to reshape the bed');
  // 4. your own plants
  await p.keyboard.press('Escape');
  await p.click('#libAddPlant');
  await p.fill('#cpCn', 'Coral bells'); await p.fill('#cpBn', 'Heuchera villosa'); await p.selectOption('#cpT', 'perennial');
  await p.fill('#cpW', '1.5'); await p.fill('#cpH', '1.5'); await p.fill('#cpSpc', '1.25'); await p.check('[data-cpsun="S"]');
  await p.evaluate(() => { const c = document.getElementById('cpC'); c.value = '#7A2F4F'; });
  await p.click('#cpSave');
  let s = await st();
  const coral = s.customPlants && s.customPlants.find((c) => c.cn === 'Coral bells');
  ok(coral && coral.t === 'perennial' && coral.c === '#7a2f4f', 'add your own perennial');
  ok(await p.isVisible(`[data-sp="${coral.id}"] .yours`), 'library marks it YOURS');
  await p.click('#libAddPlant');
  await p.fill('#cpCn', 'Pawpaw'); await p.fill('#cpBn', 'Asimina triloba'); await p.selectOption('#cpT', 'dtree'); await p.fill('#cpW', '20'); await p.fill('#cpH', '25');
  await p.click('#cpSave');
  s = await st();
  const pawpaw = s.customPlants.find((c) => c.cn === 'Pawpaw');
  // plant the pawpaw, and add coral bells to the bed
  await p.click(`[data-sp="${pawpaw.id}"]`); await click(60, 25); await p.keyboard.press('Escape');
  const tree = (await items()).find((i) => i.sp === pawpaw.id);
  ok(tree && tree.type === 'dtree' && tree.r === 10, 'your own tree is planted at its 20 ft spread');
  await click(18, 30);
  await p.hover(`[data-sp="${coral.id}"]`); await p.click('#libInfo [data-lib-act="bed"]');
  bed = (await items()).find((i) => i.type === 'bedShape');
  ok(bed.mix.some((m) => m.sp === coral.id), 'your own plant goes into the selected bed');
  // clicking a plant with a tree selected starts planting; it does not swap the selected tree
  await click(60, 25);
  await p.click('[data-sp="acsa"]');
  ok((await items()).find((i) => i.id === tree.id).sp === pawpaw.id && await p.evaluate(() => document.querySelector('[data-tool="dtree"]').getAttribute('aria-pressed') === 'true'), 'clicking a plant starts planting and leaves the selected tree alone');
  // 5. draw a misshapen bed directly
  await p.keyboard.press('Escape'); await p.click('[data-tool="annual"]'); await p.click('#optCtx [data-drawbed]');
  ok(await p.evaluate(() => document.querySelector('[data-tool="bedShape"]').getAttribute('aria-pressed') === 'true'), '"Draw any shape" switches to the draw-a-bed tool');
  for (const [x, y] of [[40, 85], [52, 84], [56, 92], [47, 97], [41, 93]]) { await click(x, y); await p.waitForTimeout(420); }
  await p.keyboard.press('Enter');
  const drawn = (await items()).find((i) => i.type === 'bedShape' && i.pts.length === 5);
  ok(!!drawn, 'draw a five-sided bed');
  // 6. schedule lists every plant, including your own
  await p.click('[data-pane="pSched"]');
  const sched = await p.textContent('#sched');
  ok(/Coral bells/.test(sched) && /Pawpaw/.test(sched) && /Black-eyed Susan/.test(sched) && /Liriope/.test(sched), 'schedule lists mixed and custom plants');
  await p.click('#zFit'); await p.click('label:has(#tTypes)');
  await p.screenshot({ path: D + 'beds-ui.png' });
  // 7. save and reopen: custom plants and mixed beds come back
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bSave')]);
  const jp = D + 'beds.json'; await dl.saveAs(jp);
  await p.click('#bClear'); await p.click('#bClearYes');
  await p.click('#bOpen'); await p.setInputFiles('#fileIn', jp); await p.waitForTimeout(300);
  s = await st();
  ok(s.customPlants.length === 2 && s.items.find((i) => i.type === 'bedShape' && i.mix && i.mix.some((m) => m.sp === coral.id)), 'save and reopen keeps your plants and mixed beds');
  await p.click('#bExport'); await p.waitForTimeout(400);
  const [dp] = await Promise.all([p.waitForEvent('download'), p.click('[data-fmt="png"]')]); await dp.saveAs(D + 'beds-sheet.png');
  ok(fs.statSync(D + 'beds-sheet.png').size > 50000, 'export with mixed beds');
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
