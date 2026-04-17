import { chromium } from 'playwright';

const PORT = process.env.PORT || 3111;
const OUT  = './HFU-Proposal-full.pdf';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

await page.pdf({
  path: OUT,
  format: 'Letter',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});

console.log(`Wrote ${OUT}`);
await browser.close();
