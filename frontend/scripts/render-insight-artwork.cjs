// Render the authored HTML artwork as deterministic, local PNG assets.
const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const sharp = require('sharp');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../design/insight-artwork.html')).href);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => { document.documentElement.className = theme; }, theme);
      for (const [id, name] of [['deal', 'deal'], ['report', 'kpi']]) {
        const file = path.resolve(__dirname, '../png', `insights-${name}-minimal${theme === 'light' ? '-light' : ''}`);
        await page.locator(`#${id}`).screenshot({ path: `${file}.png` });
        await sharp(`${file}.png`).webp({ quality: 90 }).toFile(`${file}.webp`);
        console.log(`Rendered ${name} in ${theme} at 1200 × 800`);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
