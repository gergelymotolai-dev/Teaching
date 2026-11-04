/* End-to-end check of dist/verdant-studio.html at desktop and phone sizes.
 *   node scripts/e2e_test.js [output-dir]
 * Needs Playwright with Chromium. Writes screenshots, a saved design and the exported sheet. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../dist/verdant-studio.html');
const OUT = process.argv[2] || path.resolve(__dirname, '../test-output');
fs.mkdirSync(OUT, { recursive: true });

async function run(w, h, tag) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true, hasTouch: w < 500, offline: true });  // like a USB drive: no network
  let netReqs = 0;
  ctx.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) netReqs++; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && true) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(FILE);
  await page.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.log(`[${tag}] FAIL: ${m}`); process.exitCode = 1; } else console.log(`[${tag}] ok: ${m}`); };
  const scr = (x, y) => page.evaluate(([x, y]) => {
    const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number);
    return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height];
  }, [x, y]);
  const toPlan = () => page.locator('#plan').scrollIntoViewIfNeeded();
  const click = async (x, y, opts) => { await toPlan(); const [a, b] = await scr(x, y); await page.mouse.click(a, b, opts); };
  /* vegetable garden, firewood and bird bath live in the Build library tab */
  const tool = async (t) => {
    if (['veg', 'wood', 'birdbath', 'deck'].includes(t)) {
      if (w < 1000) { await page.click('[data-openlib="build"]'); await page.click(`[data-el="${t}"]`); await page.click('[data-openlib="build"]'); }
      else { await page.click('[data-libtab="build"]'); await page.click(`[data-el="${t}"]`); }
      return;
    }
    await page.click(`[data-tool="${t}"]`);
  };
  const items = () => page.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')).items);
  const count = async () => (await items()).length;
  const tab = (p) => page.click(`[data-pane="${p}"]`);
  const press = (k) => page.keyboard.press(k);

  // 1. place one of every type
  const spots = { dtree: [20, 25], etree: [10, 95], bshrub: [40, 80], dshrub: [46, 80], perennial: [60, 85], annual: [45, 95],
    groundcover: [70, 95], patio: [62, 30], deck: [44, 30], veg: [15, 30], wood: [8, 45], lawn: [30, 15], birdbath: [76, 20], bubble: [62, 22], label: [55, 100] };
  for (const [t, p] of Object.entries(spots)) {
    await tool(t); await click(...p);
    if (['dtree', 'etree', 'bshrub', 'dshrub'].includes(t)) await press('Escape');
    if (t === 'label') { await page.fill('[data-f="text"]', 'ENTRY'); await press('Escape'); }
  }
  const lines = { path: [[51, 75], [51, 90], [40, 104]], fence: [[1, 60], [1, 100], [12, 108]], arrow: [[24, 100], [40, 60], [60, 40]],
    bedShape: [[60, 50], [70, 48], [74, 60], [62, 62]], lawnShape: [[30, 60], [40, 58], [44, 70], [32, 72]], paveShape: [[66, 66], [74, 66], [74, 72], [66, 72]] };
  for (const [t, pts] of Object.entries(lines)) {
    await tool(t);
    for (const p of pts) { await click(...p); await page.waitForTimeout(420); }
    await press('Enter');
  }
  await page.waitForTimeout(500);
  const all = await items();
  ok(new Set(all.map((i) => i.type)).size === 21, `placed all 21 types (${all.length} items)`);
  ok(all.find((i) => i.type === 'bedShape').pts.length === 4, 'freeform bed has 4 points');
  await page.screenshot({ path: `${OUT}/${tag}-placed.png`, fullPage: tag === 'phone' });

  // 2. plant library: pick a species and plant it
  if (tag === 'desk') {
    await page.click('[data-libtab="plants"]');
    await page.fill('#libSearch', 'redbud');
    await page.click('[data-sp="ceca"]');
    await click(30, 50); await press('Escape');
    const rb = (await items()).find((i) => i.sp === 'ceca');
    ok(rb && rb.r === 12.5, 'library places Eastern redbud at 25 ft spread');
    await page.fill('#libSearch', '');
  }

  // 3. move, resize, rotate, delete, undo, redo
  await tool('select'); await toPlan();
  let [a, b] = await scr(44, 30);
  await page.mouse.move(a, b); await page.mouse.down();
  let [a2, b2] = await scr(44, 36); await page.mouse.move(a2, b2, { steps: 6 }); await page.mouse.up();
  let deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.y - 36) < 0.6, `moved deck to y=${deck.y}`);
  const hb = await (await page.$('[data-h="size"]')).boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
  [a2, b2] = await scr(52, 44); await page.mouse.move(a2, b2, { steps: 6 }); await page.mouse.up();
  deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.w - 16) < 0.6 && Math.abs(deck.h - 16) < 0.6, `resized deck ${deck.w}x${deck.h}`);
  const hr = await (await page.$('[data-h="rot"]')).boundingBox();
  await page.mouse.move(hr.x + hr.width / 2, hr.y + hr.height / 2); await page.mouse.down();
  [a2, b2] = await scr(64, 36); await page.mouse.move(a2, b2, { steps: 6 }); await page.mouse.up();
  deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.rot - 90) < 3, `rotated deck ${deck.rot}`);
  const before = await count();
  await press('Delete'); ok((await count()) === before - 1, 'deleted deck');
  await page.click('#bUndo'); ok((await count()) === before, 'undo restores deck');
  await page.click('#bRedo'); ok((await count()) === before - 1, 'redo deletes again');
  await press('Control+z'); ok((await count()) === before, 'ctrl+z');

  // 4. freeform shape: drag a midpoint handle to add a point
  await click(65, 55);
  const bed = (await items()).find((i) => i.type === 'bedShape');
  const mh = await page.$('[data-h="m0"]');
  if (mh) {
    const mb = await mh.boundingBox();
    await page.mouse.move(mb.x + mb.width / 2, mb.y + mb.height / 2); await page.mouse.down();
    [a2, b2] = await scr(65, 44); await page.mouse.move(a2, b2, { steps: 5 }); await page.mouse.up();
  }
  ok((await items()).find((i) => i.id === bed.id).pts.length === 5, 'midpoint handle adds a point to the bed');

  if (tag === 'desk') {
    // 5. marquee select, copy/paste, align, lock, context menu, history
    await press('Escape');
    [a, b] = await scr(-4, 40); [a2, b2] = await scr(14, 104);
    await page.mouse.move(a, b); await page.mouse.down(); await page.mouse.move(a2, b2, { steps: 8 }); await page.mouse.up();
    const selN = await page.evaluate(() => document.getElementById('sbSel').textContent);
    ok(/items selected/.test(selN), 'marquee selects several: ' + selN);
    const n0 = await count();
    await press('Control+c'); await press('Control+v');
    ok((await count()) > n0, 'copy and paste');
    await page.click('[data-align="left"]');
    ok(true, 'align left ran');
    await press('Control+z'); await press('Control+z');
    await click(46, 80);
    await press('Control+l');
    const locked = (await items()).find((i) => i.type === 'dshrub');
    ok(locked.locked === true, 'lock with Ctrl+L');
    await press('Control+l');
    const [cx, cy] = await scr(62, 30);
    await page.mouse.click(cx, cy, { button: 'right' });
    ok(await page.isVisible('#ctx.open'), 'right-click menu opens');
    await press('Escape');
    await page.click('[data-menu="1"]'); ok(await page.isVisible('#menu1.open'), 'Edit menu opens'); await press('Escape');
    await tab('pHist');
    const histN = await page.$$eval('[data-hist]', (x) => x.length);
    ok(histN > 10, `history panel lists ${histN} steps`);
    await tab('pProps');
    await tab('pObjects'); ok((await page.$$('[data-obj]')).length === await count(), 'objects list matches items'); await tab('pLayers');
    // style switch
    for (const st of ['color', 'bw', 'render']) await page.click(`[data-style="${st}"]`);
    ok(true, 'style switches');
  }

  // 6. design check
  const check = async () => { await tab('pCheck'); await page.click('#bCheck'); return page.textContent('#issues'); };
  await page.click('#bClear'); await page.click('#bClearYes');
  ok((await count()) === 0, 'cleared');
  await tool('dtree'); await click(40, 40); await press('Escape');
  let txt = await check();
  ok(/roof/.test(txt) && /trunk is only/.test(txt), 'tree against house flagged');
  await page.click('#bClear'); await page.click('#bClearYes');
  await tool('etree'); await click(20, 6); await press('Escape');
  txt = await check();
  ok(/overhead power line/.test(txt), 'tree under power line flagged');
  await page.click('#bClear'); await page.click('#bClearYes');
  await tool('dtree'); await click(20, 24); await press('Escape');
  await tool('patio'); await click(64, 30);
  await tab('pWants');
  for (const cb of await page.$$('[data-want]')) await cb.check();
  txt = await check();
  ok(/No problems found/.test(txt), 'clean design passes');

  // 7. JSON round trip, bad file, PNG export
  await page.fill('#fName', 'Pat Student'); await page.fill('#fSection', '02');
  await page.waitForTimeout(600);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bSave')]);
  const jp = `${OUT}/${tag}.json`; await dl.saveAs(jp);
  const saved = JSON.parse(fs.readFileSync(jp, 'utf8'));
  ok(saved.items.length === 2 && saved.meta.name === 'Pat Student', 'json saved');
  await page.click('#bClear'); await page.click('#bClearYes');
  await page.click('#bOpen'); await page.setInputFiles('#fileIn', jp); await page.waitForTimeout(300);
  ok((await count()) === 2, 'json reopened');
  const bad = `${OUT}/bad.json`; fs.writeFileSync(bad, '{"items":[{"type":"spaceship"}]}');
  await page.click('#bOpen'); await page.setInputFiles('#fileIn', bad); await page.waitForTimeout(200);
  ok(/doesn't know/.test(await page.textContent('#dlgBody')), 'bad file gives a friendly error');
  await press('Escape');
  await page.click('#bExport'); await page.waitForTimeout(300);
  const [dp] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('[data-fmt="png"]')]);
  await dp.saveAs(`${OUT}/${tag}-sheet.png`);
  ok(fs.statSync(`${OUT}/${tag}-sheet.png`).size > 50000, 'png exported');
  ok(await page.evaluate(() => document.fonts.check('600 16px Oswald') && document.fonts.check('16px "Source Sans 3"')), 'bundled fonts loaded offline');
  await press('Escape'); await page.click('#bExport'); await page.waitForTimeout(300);
  const [dpdf] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('[data-fmt="pdf"]')]);
  await dpdf.saveAs(`${OUT}/${tag}-sheet.pdf`);
  const head = fs.readFileSync(`${OUT}/${tag}-sheet.pdf`).subarray(0, 5).toString();
  ok(head === '%PDF-' && fs.statSync(`${OUT}/${tag}-sheet.pdf`).size > 50000, 'PDF exported offline');
  ok(netReqs === 0, `no network requests (${netReqs})`);
  ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
  await browser.close();
}
(async () => { await run(1440, 900, 'desk'); await run(390, 844, 'phone'); })();
