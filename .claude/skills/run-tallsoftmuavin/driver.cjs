// Headless Playwright driver for the Muavin web app.
// Usage: node .claude/skills/run-tallsoftmuavin/driver.cjs [login|shot] [path]
//   shot  -> open URL (default "/"), screenshot (no login)
//   login -> log in through the UI with MUAVIN_USER / MUAVIN_PASS (default demo/demo1234),
//            then optionally navigate to [path], screenshot.
// Screenshots -> $SHOT_DIR (default /tmp/muavin-shots). Prints page errors + failed requests.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.MUAVIN_URL || 'http://localhost:3000';
const OUT = process.env.SHOT_DIR || '/tmp/muavin-shots';
const [mode = 'login', target] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('response', r => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  p.on('requestfailed', r => errs.push(`FAILED ${r.failure()?.errorText} ${r.url()}`));
  await p.goto(BASE + (mode === 'shot' && target ? target : '/'), { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (mode === 'login') {
    await p.getByPlaceholder('Kullanıcı adınız veya e-posta adresiniz').fill(process.env.MUAVIN_USER || 'demo');
    await p.locator('input[type="password"]').fill(process.env.MUAVIN_PASS || 'demo1234');
    await p.getByRole('button', { name: /Giriş Yap/ }).last().click();
    await p.waitForFunction(() => !document.querySelector('input[type="password"]'), null, { timeout: 30000 });
    if (target) await p.goto(BASE + target, { waitUntil: 'domcontentloaded' });
  }
  await p.waitForTimeout(3000);
  const file = `${OUT}/${mode}-${Date.now()}.png`;
  await p.screenshot({ path: file });
  console.log('screenshot:', file);
  console.log('title:', await p.title());
  console.log('text:', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));
  console.log('errors:\n  ' + [...new Set(errs)].slice(0, 25).join('\n  '));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
