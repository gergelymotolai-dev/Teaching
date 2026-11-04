/* End-to-end check of the editable client checklist.
 *   node scripts/e2e_client.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, offline: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[client] ok: ' : '[client] FAIL: ') + m); };
  await p.goto('file://' + path.resolve(__dirname, '../dist/verdant-studio.html')); await p.waitForTimeout(500);
  const wants = async () => (await p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')))).wants;
  await p.click('[data-pane="pWants"]');
  ok((await p.$$('[data-want]')).length === 7, 'Scott lab starts with the seven wishes from the brief');
  // add
  await p.fill('#wantNew', 'Apple trees for the husband'); await p.press('#wantNew', 'Enter');
  let w = await wants();
  ok(w.length === 8 && w[7].t === 'Apple trees for the husband', 'add a wish with Enter');
  // edit by double-click
  await p.dblclick('[data-wedit="0"]'); await p.fill('#wantEdit', 'Wide sidewalk to the front door'); await p.press('#wantEdit', 'Enter');
  w = await wants();
  ok(w[0].t === 'Wide sidewalk to the front door', 'edit a wish by double-clicking it');
  // Esc cancels an edit
  await p.dblclick('[data-wedit="1"]'); await p.fill('#wantEdit', 'nope'); await p.press('#wantEdit', 'Escape');
  ok((await wants())[1].t === 'Recreation area', 'Esc cancels an edit');
  // reorder: move the new last wish up
  await p.hover('.want:nth-child(8)'); await p.click('[data-wact="up"][data-wi="7"]');
  w = await wants();
  ok(w[6].t === 'Apple trees for the husband', 'move a wish up');
  // remove
  await p.hover('.want:nth-child(2)'); await p.click('[data-wact="del"][data-wi="1"]');
  w = await wants();
  ok(w.length === 7 && !w.some((x) => x.t === 'Recreation area'), 'remove a wish');
  // check off, and the design check uses the edited list
  await p.check('[data-want="0"]');
  await p.click('[data-pane="pCheck"]'); await p.click('#bCheck');
  const txt = await p.textContent('#issues');
  ok(/Apple trees for the husband/.test(txt) && !/Wide sidewalk/.test(txt) && !/Recreation area/.test(txt), 'design check follows the edited list');
  ok(/\d\/7/.test(await p.textContent('#wantsBadge')), 'badge counts the edited list: ' + await p.textContent('#wantsBadge'));
  // undo brings a removed wish back
  await p.keyboard.press('Escape'); await p.click('#plan', { position: { x: 5, y: 5 } }).catch(() => {});
  await p.click('#bUndo'); await p.click('#bUndo');
  ok((await wants()).some((x) => x.t === 'Recreation area'), 'undo restores a removed wish');
  // reset to the brief's list, keeping what was checked
  await p.click('[data-pane="pWants"]'); await p.click('#wantReset');
  w = await wants();
  ok(w.length === 7 && w[1].t === 'Recreation area', 'reset to the Scott family list');
  // an older design file with the fixed seven checkboxes still opens
  const old = D + 'old-format.json';
  fs.writeFileSync(old, JSON.stringify({ version: 1, meta: { name: 'Old' }, checklist: [true, false, true, false, false, false, false], items: [] }));
  await p.click('#bOpen'); await p.setInputFiles('#fileIn', old); await p.waitForTimeout(300);
  w = await wants();
  ok(w.length === 7 && w[0].d && !w[1].d && w[2].d, 'older files keep their checked wishes');
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
