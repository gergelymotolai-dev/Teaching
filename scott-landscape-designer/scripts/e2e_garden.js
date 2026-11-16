/* End-to-end check of the garden features: vegetables and row beds, yields, pollinator plants and the bloom
 * calendar, the Garden library tab (ready-made plots, giant pumpkin patch, trellises, structures, teaching items)
 * and garden briefs for new designs.
 *   node scripts/e2e_garden.js [output-dir] */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const D = (process.argv[2] || path.resolve(__dirname, '../test-output')) + '/';
fs.mkdirSync(D, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '../dist/verdant-studio.html');
(async () => {
  const b = await chromium.launch();
  const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? '[garden] ok: ' : '[garden] FAIL: ') + m); };
  {   // the extra library button still fits on a laptop screen, and the four tabs fit the library
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, offline: true })).newPage();
    await p.goto(FILE); await p.waitForTimeout(400);
    ok(await p.evaluate(() => { const rail = document.getElementById('rail').getBoundingClientRect(); return [...document.querySelectorAll('#rail .tool')].every((t) => t.getBoundingClientRect().bottom <= rail.bottom); }), 'at 1280×720 every tool, including the Garden library button, fits on the toolbar');
    ok(await p.evaluate(() => [...document.querySelectorAll('[data-libtab]')].every((t) => t.scrollWidth <= t.clientWidth + 1)), 'Plants / Build / Outdoor / Garden tab labels fit their boxes');
    await p.context().close();
  }
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, offline: true });
  const p = await ctx.newPage(); const errs = [], reqs = [];
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
  await p.goto(FILE); await p.waitForTimeout(500);
  const scr = (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('plan'), r = s.getBoundingClientRect(), vb = s.getAttribute('viewBox').split(' ').map(Number); return [r.left + (x - vb[0]) / vb[2] * r.width, r.top + (y - vb[1]) / vb[3] * r.height]; }, [x, y]);
  const click = async (x, y) => { const [a, c] = await scr(x, y); await p.mouse.click(a, c); await p.waitForTimeout(420); };
  const saved = () => p.evaluate(() => JSON.parse(localStorage.getItem('scottDesign.v1')));
  const items = async () => (await saved()).items;
  const newest = async (before) => (await items()).find((i) => !before.includes(i.id));
  const get = async (id) => (await items()).find((i) => i.id === id);
  let ids;

  // a new design for a teaching garden: no house, a starting checklist
  await p.click('#bNew'); await p.click('[data-new="custom"]');
  ok(await p.locator('#nfKind option').count() === 5, 'New design asks what the site is for (home, teaching, vegetable, pollinator, community)');
  await p.selectOption('#nfKind', 'teach');
  ok(await p.inputValue('#nfName') === 'Demonstration garden' && !(await p.isChecked('#nfHouse')), 'choosing a teaching garden names the project and drops the house outline');
  await p.fill('#nfW', '120'); await p.fill('#nfH', '90');
  await p.click('#nfCreate'); await p.waitForTimeout(900);
  let s = await saved();
  ok(s.site && s.site.w === 120 && s.items.length === 0 && s.wants.length >= 8 && s.wants.some((w) => /tour stations/.test(w.t)) && s.wants.every((w) => w.d === false), 'teaching garden starts empty with an editable checklist of ' + s.wants.length + ' goals');
  await p.click('[data-pane="pWants"]');
  ok(/Compost area/.test(await p.textContent('#clientList')), 'the checklist shows in the Client tab');

  // the Garden tab
  await p.click('[data-libtab="garden"]'); await p.waitForTimeout(200);
  const cats = await p.$$eval('#libList .libcat', (els) => els.map((e) => e.textContent));
  ok(['Vegetable beds and plots', 'Giant pumpkins', 'Trellises and vines', 'Pollinators', 'Growing structures', 'Teaching'].every((c) => cats.includes(c)), 'Garden tab groups: ' + cats.join(', '));
  for (const k of ['bed-raised', 'bed-rows', 'bed-salsa', 'bed-sisters', 'gpumpkin', 'bed-pumpkin', 'trellis-grape', 'trellis-muscadine', 'trellis-berry', 'bed-pollinator', 'bed-monarch', 'beehive', 'beehotel', 'hoophouse', 'compost', 'rainbarrel', 'classroom', 'sign', 'marker']) ok(await p.isVisible(`[data-el="${k}"]`), `Garden tab lists ${k}`);
  ok(await p.evaluate(() => [...document.querySelectorAll('#libList [data-el]')].every((b) => b.scrollWidth <= b.clientWidth + 1 && b.querySelector('svg'))), 'every Garden entry has a picture and its text fits');

  // a ready-made raised bed: planted in rows, with a timber frame
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="bed-raised"]'); await click(20, 14);
  const rb = await newest(ids);
  ok(rb && rb.type === 'annual' && rb.w === 8 && rb.h === 4 && rb.edge === 'wood' && rb.rows === true && rb.mix.length === 3 && rb.mix[0].sp === 'soly', 'raised bed 4 × 8 placed with tomatoes, peppers and basil in rows');
  ok(await p.isChecked('#props [data-f="rows"]'), 'Properties shows Plant in rows ticked');
  // the bed tool is plain again afterwards
  ids = (await items()).map((i) => i.id);
  await p.keyboard.press('Escape'); await p.click('#rail [data-tool="annual"]'); await click(20, 26);
  const plain = await newest(ids);
  ok(plain && plain.type === 'annual' && !plain.mix && !plain.edge, 'the Annual bed tool is back to a plain bed after a ready-made plot');
  // row-crop plot and a single crop from the plant library
  ids = (await items()).map((i) => i.id);
  await p.click('[data-libtab="garden"]'); await p.click('[data-el="bed-rows"]'); await click(45, 22);
  const plot = await newest(ids);
  ok(plot && plot.w === 30 && plot.h === 20 && plot.mix.length === 7 && plot.rows === true, 'row-crop plot 20 × 30 with seven crops');
  await p.click('[data-el="crops"]'); await p.waitForTimeout(200);
  ok(await p.inputValue('#libCat') === 'veg' && await p.locator('#libList [data-sp]').count() === 43, 'Browse vegetables opens the plant library on its 43 crops');
  ids = (await items()).map((i) => i.id);
  await p.click('#libList [data-sp="zema"]'); await click(75, 14);
  const corn = await newest(ids);
  ok(corn && corn.sp === 'zema' && !corn.mix, 'sweet corn picked from the library plants as a bed');
  ok(await p.evaluate((id) => { const g = document.querySelector(`#gDesign [data-id="${id}"]`); return g && g.querySelectorAll('*').length > 20; }, corn.id), 'the corn bed draws its rows');
  const card = (await p.textContent('#libInfo')).replace(/\s+/g, ' ');
  ok(/Sweet corn/.test(card) && /rows? /i.test(card) && /lb/.test(card) && await p.inputValue('#libCat') === 'veg', 'the crop card gives row spacing and yield, and the library stays on vegetables');

  // giant pumpkin patch
  await p.keyboard.press('Escape');
  await p.click('[data-libtab="garden"]');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="gpumpkin"]'); await click(100, 22);
  const gp = await newest(ids);
  ok(gp && gp.type === 'gpumpkin' && gp.w === 25 && gp.h === 30, 'giant pumpkin patch placed at 25 × 30 ft');
  ok(/Atlantic Giant/.test(await p.textContent('#props')) && /750 sq ft/.test(await p.textContent('#props')), 'Properties explains the patch and gives its area');
  await p.check('#props [data-f="gcover"]'); await p.waitForTimeout(200);
  ok((await get(gp.id)).cover === true, 'shade tent over the fruit turned on');

  // grape trellis: drawn as a line, style chips, counts
  await p.keyboard.press('Escape');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="trellis-grape"]');
  ok(await p.locator('#optCtx [data-settrellis]').count() === 6, 'top bar offers six trellis kinds while drawing');
  await click(10, 50); await click(58, 50); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const tr = await newest(ids);
  ok(tr && tr.type === 'trellis' && tr.style === 'grape' && tr.pts.length === 2, 'grape trellis drawn end post to end post');
  const ptxt = await p.textContent('#props');
  ok(/\d+ posts and \d+ grape/i.test(ptxt), 'Properties counts posts and vines: ' + (ptxt.match(/This run:[^.]*\./) || [''])[0]);
  await p.click('#optCtx [data-settrellis="muscadine"]'); await p.waitForTimeout(200);
  ok((await get(tr.id)).style === 'muscadine', 'top bar switches it to a muscadine trellis');
  await p.selectOption('#props [data-f="tstyle"]', 'berry'); await p.waitForTimeout(200);
  ok((await get(tr.id)).style === 'berry', 'Properties switches it to a blackberry trellis');
  await p.keyboard.press('Control+z'); await p.waitForTimeout(250);
  ok((await get(tr.id)).style === 'muscadine', 'undo brings the muscadine trellis back');

  // pollinator bed, bee houses, teaching items
  await p.keyboard.press('Escape');
  ids = (await items()).map((i) => i.id);
  await p.click('[data-el="bed-pollinator"]'); await click(30, 70);
  const pb = await newest(ids);
  ok(pb && pb.type === 'perennial' && pb.mix.length === 8 && pb.w === 20 && !pb.rows, 'pollinator bed placed with eight native perennials in drifts');
  const place = async (el, x, y) => { await p.keyboard.press('Escape'); const before = (await items()).map((i) => i.id); await p.click(`[data-el="${el}"]`); await click(x, y); return newest(before); };
  for (const [el, x, y] of [['beehive', 50, 66], ['beehotel', 56, 66], ['puddler', 62, 66], ['hoophouse', 104, 62], ['coldframe', 70, 80], ['compost', 84, 84], ['rainbarrel', 62, 80], ['classroom', 78, 62], ['sign', 30, 78], ['sqfoot', 10, 14], ['keyhole', 10, 30], ['herbspiral', 10, 42], ['arbor', 66, 40]]) { const it = await place(el, x, y); ok(it && it.type === el, `${el} placed`); }
  const m1 = await place('marker', 18, 60), m2 = await place('marker', 40, 60);
  ok(m1.num === 1 && m2.num === 2, 'tour station markers number themselves 1, 2');
  await p.fill('#props [data-f="num"]', '7'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  ok((await get(m2.id)).num === 7, 'station number changed to 7');
  await p.click('[data-el="polplants"]'); await p.waitForTimeout(200);
  ok(await p.getAttribute('#libTags [data-pol]', 'aria-pressed') === 'true' && await p.locator('#libList [data-sp]').count() >= 40, 'Browse pollinator plants filters the plant library');
  await p.click('#libTags [data-pol]');

  // schedule: counts, harvest, bloom calendar, trellis takeoff, no mulch for row beds
  await p.keyboard.press('Escape');
  await p.click('[data-pane="pSched"]'); await p.waitForTimeout(300);
  const sched = (await p.textContent('#sched')).replace(/\s+/g, ' ');
  ok(/Tomato/.test(sched) && /Sweet corn/.test(sched) && /about [\d,]+ lb/.test(sched) && /Harvest estimate/.test(sched), 'schedule counts the crops and estimates the harvest');
  ok(/Bloom calendar/.test(sched), 'schedule shows the bloom calendar for pollinators');
  ok(/Muscadine/i.test(sched) && /Trellis posts/.test(sched) && /Giant pumpkin patch/.test(sched) && /Honey bee hive/.test(sched) && /Compost bins/.test(sched), 'takeoff lists the trellis with posts and vines, the pumpkin patch, hive and compost bins');
  const mulch = (sched.match(/Hardwood mulch, 3 in\. deep([\d,]+) sq ft/) || [])[1];
  ok(mulch && +mulch.replace(/,/g, '') < 300, 'mulch is counted for the flower beds only, not the vegetable rows (' + mulch + ' sq ft)');
  await p.click('[data-pane="pCheck"]'); await p.click('#bCheck'); await p.waitForTimeout(250);
  ok(!/outside the property/i.test(await p.textContent('#issues')), 'design check runs on the garden');

  // both drawing styles, the exported file and a reload
  await p.click('#zFit'); await p.waitForTimeout(500);
  await p.screenshot({ path: D + 'garden-render.png' });
  ok(await p.evaluate(() => !document.querySelector('#gDesign [data-id] .broken') && document.querySelectorAll('#gDesign > [data-id]').length === 22), 'all 22 items drawn in the Rendered style');
  await p.click('[data-style="bw"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: D + 'garden-bw.png' });
  ok(await p.evaluate(() => document.querySelectorAll('#gDesign > [data-id]').length === 22), 'all 22 items drawn in the B&W drafting style');
  await p.click('[data-style="render"]');
  const n0 = (await items()).length;
  await p.reload(); await p.waitForTimeout(900);
  s = await saved();
  const t2 = s.items.find((i) => i.type === 'trellis'), g2 = s.items.find((i) => i.type === 'gpumpkin');
  ok(s.items.length === n0 && t2.style === 'muscadine' && g2.cover === true && s.items.find((i) => i.id === rb.id).rows === true && s.items.filter((i) => i.type === 'marker').map((i) => i.num).join() === '1,7', 'the garden survives a reload: trellis kind, shade tent, row beds and station numbers');
  ok(reqs.length === 0, 'no network requests');
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '));
  await b.close();
})();
