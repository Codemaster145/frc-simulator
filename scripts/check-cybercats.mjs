import {testServer} from './test-server.mjs';
const {base,close:closeServer}=await testServer();
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out = 'test-results/cybercats'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const errors = [], checks = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const check = (name, value) => { checks.push({ name, passed: !!value }); console.log(`${value ? 'PASS' : 'FAIL'} ${name}`); assert.ok(value, name); };
try {
  await page.addInitScript(() => localStorage.setItem('chuck-norris-settings-v2', JSON.stringify({ quality: 'battery', autoSpin: false, idleReset: false })));
  await page.goto(base);
  await page.waitForFunction(() => window.__viewer?.state.ready, null, { timeout: 180000 });
  await page.evaluate(() => { const a = window.__viewer; a.state.autoSpin = false; a.state.idleReset = false; a.viewer.spinning = false; a.viewer.settle(); });
  const stats = await page.evaluate(() => window.__viewer.stats());
  check('Actual CyberCats CAD loads with all 2269 parts', stats.source === 'model' && stats.parts === 2269);
  check('CyberCats title', await page.locator('.title h1').textContent() === 'CyberCats');
  await page.waitForFunction(() => window.__viewer.viewer.pickingReady, null, { timeout: 240000 });
  await page.screenshot({ path: `${out}/overview.png`, timeout: 120000 });
  // Use the existing input controls, then inspect the existing application state.
  const before = await page.evaluate(() => window.__viewer.viewer.camera.position.toArray());
  await page.mouse.move(640, 470); await page.mouse.down(); await page.mouse.move(790, 500, { steps: 3 }); await page.mouse.up();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.__viewer.viewer.camera.position.toArray());
  check('Orbit camera responds to drag', Math.hypot(...after.map((v,i) => v-before[i])) > 0.01);
  await page.mouse.wheel(0, -250); await page.waitForTimeout(600);
  const zoom = await page.evaluate(() => window.__viewer.viewer.camera.position.toArray());
  check('Camera responds to wheel zoom', Math.hypot(...zoom.map((v,i) => v-after[i])) > 0.01);
  for (const button of await page.locator('.chip').all()) {
    const label = await button.getAttribute('aria-label'); await button.click();
    check(`Subsystem selection: ${label}`, await page.evaluate(() => window.__viewer.state.sel?.kind === 'sub'));
  }
  await page.locator('.panel .back').click();
  await page.getByRole('button', { name: 'Search parts', exact: true }).click();
  await page.getByRole('searchbox').fill('Kraken');
  check('Search finds actual named CAD parts', await page.locator('.result').count() > 0);
  await page.locator('.result').first().click();
  check('Part selection from search', await page.evaluate(() => window.__viewer.state.sel?.kind === 'node'));
  await page.screenshot({ path: `${out}/part-selection.png`, timeout: 120000 });
  await page.evaluate(() => window.__viewer.api.overview());
  await page.getByRole('button', { name: 'Explode view', exact: true }).click();
  check('Exploded view toggles on', await page.evaluate(() => window.__viewer.state.exploded));
  await page.evaluate(() => window.__viewer.viewer.settle());
  await page.screenshot({ path: `${out}/exploded.png`, timeout: 120000 });
  await page.locator('.dock .tool').filter({ hasText: 'Collapse' }).click();
  check('Exploded view collapses', !(await page.evaluate(() => window.__viewer.state.exploded)));
  await page.getByRole('button', { name: 'Move mechanisms', exact: true }).click();
  check('Mechanism calibration status is explicit', (await page.locator('.tray').innerText()).includes('74 degrees is an adjustable simulation estimate'));
  await page.getByRole('button', { name: 'Close mechanisms' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__viewer.api.overview()); await page.waitForTimeout(500);
  check('Mobile controls remain accessible without horizontal page overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${out}/mobile.png`, timeout: 120000 });
  check('No browser runtime/console errors', errors.length === 0);
  fs.writeFileSync(`${out}/viewer-results.json`, JSON.stringify({ checks, errors, stats }, null, 2));
} catch (e) {
  fs.writeFileSync(`${out}/viewer-results.json`, JSON.stringify({ checks, errors, failure: String(e) }, null, 2));
  throw e;
} finally { await browser.close();await closeServer(); }
