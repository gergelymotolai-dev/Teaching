const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '../dist/landscape-designer.html');
const OUT = process.argv[2] || path.resolve(__dirname, '../test-output');
fs.mkdirSync(OUT, { recursive: true });

async function run(w, h, tag) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: true, hasTouch: w < 500 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(FILE);
  await page.waitForTimeout(400);
  const ok = (c, m) => { if (!c) { console.log(`[${tag}] FAIL: ${m}`); process.exitCode = 1; } else console.log(`[${tag}] ok: ${m}`); };
  const scr = async (x, y) => page.evaluate(([x, y]) => {
    const s = document.getElementById('plan'); const r = s.getBoundingClientRect();
    const vb = s.getAttribute('viewBox').split(' ').map(Number);
    return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height];
  }, [x, y]);
  const click = async (x, y) => { await page.locator('#plan').scrollIntoViewIfNeeded(); const [a, b] = await scr(x, y); await page.mouse.click(a, b); };
  const tool = async (t) => { await page.click(`[data-tool="${t}"]`); };
  const count = () => page.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')).items.length);
  const items = () => page.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')).items);

  // place one of every type
  const spots = {
    dtree: [20, 25], etree: [10, 95], bshrub: [40, 80], dshrub: [46, 80], perennial: [60, 85], annual: [45, 95],
    groundcover: [70, 95], patio: [62, 30], deck: [44, 30], veg: [15, 30], wood: [8, 45], lawn: [30, 15], birdbath: [76, 20],
    bubble: [62, 22], label: [55, 100],
  };
  for (const [t, p] of Object.entries(spots)) {
    await tool(t); await click(...p);
    if (['dtree', 'etree', 'bshrub', 'dshrub'].includes(t)) await page.keyboard.press('Escape');
    if (t === 'label') { await page.fill('[data-f="text"]', 'ENTRY'); await page.keyboard.press('Escape'); }
  }
  for (const [t, pts] of Object.entries({ path: [[51, 75], [51, 90], [40, 104]], fence: [[1, 60], [1, 100], [12, 108]], arrow: [[24, 100], [40, 60], [60, 40]] })) {
    await tool(t);
    for (const p of pts.slice(0, -1)) { await click(...p); await page.waitForTimeout(450); }
    const [a, b] = await scr(...pts[pts.length - 1]);
    await page.mouse.dblclick(a, b);
  }
  await page.waitForTimeout(600);
  const its = await items();
  const types = new Set(its.map((i) => i.type));
  ok(types.size === 18, `placed all 18 types (${types.size}, ${its.length} items)`);
  await page.screenshot({ path: `${OUT}/${tag}-placed.png`, fullPage: tag === 'phone' });

  // move the deck by dragging
  await tool('select');
  await page.locator('#plan').scrollIntoViewIfNeeded();
  let [a, b] = await scr(44, 30);
  await page.mouse.move(a, b); await page.mouse.down(); const [a2, b2] = await scr(44, 36); await page.mouse.move(a2, b2, { steps: 5 }); await page.mouse.up();
  let deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.y - 36) < 0.6, `moved deck to y=${deck.y}`);
  // resize via size handle
  const hs = await page.$('[data-h="size"]');
  const hb = await hs.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
  const [c1, c2] = await scr(44 + 8, 36 + 8); await page.mouse.move(c1, c2, { steps: 5 }); await page.mouse.up();
  deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.w - 16) < 0.6 && Math.abs(deck.h - 16) < 0.6, `resized deck ${deck.w}x${deck.h}`);
  // rotate
  const hr = await (await page.$('[data-h="rot"]')).boundingBox();
  await page.mouse.move(hr.x + hr.width / 2, hr.y + hr.height / 2); await page.mouse.down();
  const [d1, d2] = await scr(44 + 20, 36); await page.mouse.move(d1, d2, { steps: 5 }); await page.mouse.up();
  deck = (await items()).find((i) => i.type === 'deck');
  ok(Math.abs(deck.rot - 90) < 3, `rotated deck ${deck.rot}`);
  // delete then undo / redo
  const before = await count();
  await page.keyboard.press('Delete');
  ok((await count()) === before - 1, 'deleted deck');
  await page.click('#bUndo'); ok((await count()) === before, 'undo restores deck');
  await page.click('#bRedo'); ok((await count()) === before - 1, 'redo deletes again');
  await page.keyboard.press('Control+z'); ok((await count()) === before, 'ctrl+z');

  // design check: start over, then test cases
  await page.click('#bClear'); await page.click('#bClearYes');
  ok((await count()) === 0, 'cleared');
  await tool('dtree'); await click(40, 40); await page.keyboard.press('Escape');   // against house wall
  await page.click('#bCheck');
  let txt = await page.textContent('#issues');
  ok(/roof/.test(txt) && /trunk is only/.test(txt), 'tree against house flagged');
  await page.click('#bClear'); await page.click('#bClearYes');
  await tool('etree'); await click(20, 6); await page.keyboard.press('Escape');      // under power line
  await page.click('#bCheck');
  txt = await page.textContent('#issues');
  ok(/overhead power line/.test(txt), 'tree under power line flagged');
  await page.click('#bClear'); await page.click('#bClearYes');
  await tool('dtree'); await click(20, 24); await page.keyboard.press('Escape');
  await tool('patio'); await click(64, 30);
  for (const cb of await page.$$('[data-want]')) await cb.check();
  await page.click('#bCheck');
  txt = await page.textContent('#issues');
  ok(/No problems found/.test(txt), 'clean design passes: ' + txt.slice(0, 80));

  // name + JSON round trip
  await page.fill('#fName', 'Pat Student'); await page.fill('#fSection', '02');
  await page.waitForTimeout(600);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bSave')]);
  const jp = `${OUT}/${tag}.json`; await dl.saveAs(jp);
  const saved = JSON.parse(fs.readFileSync(jp, 'utf8'));
  ok(saved.items.length === 2 && saved.meta.name === 'Pat Student', 'json saved');
  await page.click('#bClear'); await page.click('#bClearYes');
  await page.click('#bOpen');
  await page.setInputFiles('#fileIn', jp);
  await page.waitForTimeout(300);
  ok((await count()) === 2, 'json reopened');
  // bad file
  const bad = `${OUT}/bad.json`; fs.writeFileSync(bad, '{"items":[{"type":"spaceship"}]}');
  await page.click('#bOpen'); await page.setInputFiles('#fileIn', bad); await page.waitForTimeout(200);
  ok(/doesn't know/.test(await page.textContent('#dlgBody')), 'bad file friendly error');
  await page.keyboard.press('Escape');

  // export PNG
  await page.click('#bExport');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${tag}-exportdlg.png` });
  const [dp] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('[data-fmt="png"]')]);
  await dp.saveAs(`${OUT}/${tag}-sheet.png`);
  ok(fs.statSync(`${OUT}/${tag}-sheet.png`).size > 50000, 'png exported');
  ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
  await browser.close();
}
(async () => {
  await run(1440, 900, 'desk');
  await run(390, 844, 'phone');
})();
