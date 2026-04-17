import { chromium } from 'playwright';

const PORT = process.env.PORT || 3111;
const OUT  = './HFU-Proposal-3pages.pdf';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000); // let fonts fully load

await page.pdf({
  path: OUT,
  format: 'Letter',           // 8.5 × 11 in
  printBackground: true,
  preferCSSPageSize: true,     // honour @page { size: Letter } from the CSS
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  pageRanges: '1-3',
});

console.log(`Wrote ${OUT}`);
await browser.close();
