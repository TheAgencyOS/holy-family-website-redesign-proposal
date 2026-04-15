#!/usr/bin/env node
// HFU proposal PDF builder.
//
// Problem with plain `chrome --print-to-pdf`: Chrome paginates at the
// raw Letter width (~710 CSS px), so any desktop-authored layout that
// expects a 1000-1400 px canvas clips horizontally — the user sees
// right-side content cut off. Fix: render each page at a wide virtual
// viewport (1280 px), then shrink the whole layout to fit Letter via
// the pdf() `scale` option. That preserves design fidelity, stops
// width clipping, and keeps text/images from splitting across pages.
//
// Output: HFU-Proposal-compliant.pdf (main body + every deep-dive
// appendix merged with pypdf via build-pdf.sh).

const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = Number(process.env.HFU_PORT || 8782);
const ROOT = __dirname;
const OUT_DIR = process.env.HFU_TMP || fs.mkdtempSync(path.join(require('os').tmpdir(), 'hfu-pdf-'));

const PAGES = [
  { id: '00-main',           url: 'index.html'          },
  { id: '01-enrollment',     url: 'enrollment.html'     },
  { id: '02-ai-lab',         url: 'ai-lab.html'         },
  { id: '03-peers',          url: 'peers.html'          },
  { id: '04-sitemap-atlas',  url: 'sitemap-atlas.html'  },
  { id: '05-personas',       url: 'personas.html'       },
  { id: '06-runway',         url: 'runway.html'         },
  { id: '07-mission',        url: 'mission.html'        },
  { id: '08-what-ai-can-do', url: 'what-ai-can-do.html' },
  { id: '09-mockups-portal', url: 'mockups-portal.html' },
  { id: '10-components',     url: 'components.html'     },
  { id: '11-discovery',      url: 'discovery.html'      },
];

// Simple static server so fetch/CORS and relative asset paths resolve
function startServer() {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.otf':  'font/otf',
    '.pdf':  'application/pdf',
    '.ico':  'image/x-icon',
    '.mp4':  'video/mp4',
  };
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const abs = path.join(ROOT, p);
      fs.readFile(abs, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(abs).toLowerCase();
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

async function renderPage(browser, url, outPath) {
  const page = await browser.newPage();
  // Wide desktop viewport so layouts that expect 1100-1280 px render
  // at their designed width. pdf(scale) then shrinks to Letter.
  await page.setViewport({ width: 1280, height: 1800, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}/${url}`, {
    waitUntil: ['load', 'networkidle0'],
    timeout: 90000,
  });
  // Print CSS should already handle reveal visibility, but force any
  // IntersectionObserver-driven class now, in case a deep-dive page
  // has its own observers that haven't fired yet.
  await page.evaluate(() => {
    document.querySelectorAll('.reveal, [data-reveal], [data-animate]').forEach(el => {
      el.classList.add('is-in', 'is-visible', 'in-view');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await page.emulateMediaType('print');
  // Give fonts a beat to finish swapping
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 400));
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    // Scale < 1 shrinks the 1280-px layout so its full width fits the
    // 8.5" Letter paper without horizontal clipping. 0.62 ≈ 710/1144
    // (Letter content width ÷ desktop canvas after margins).
    scale: 0.62,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.55in', right: '0.55in' },
    preferCSSPageSize: false,
  });
  await page.close();
}

function mergeWithPyPdf(files, outPath) {
  // Uses the system `python3` and pypdf which is already installed.
  const script = `
import sys
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
main_pages = 0
total = 0
for arg in sys.argv[1:-1]:
    r = PdfReader(arg)
    n = len(r.pages)
    label = arg.split('/')[-1]
    if label.startswith('00-'):
        main_pages = n
    print(f'  · {label}: {n} pages', flush=True)
    for p in r.pages:
        w.add_page(p)
    total += n
with open(sys.argv[-1], 'wb') as fh:
    w.write(fh)
print(f'» main body: {main_pages} pages')
print(f'» total PDF: {total} pages')
if main_pages > 40:
    print(f'!! main body exceeds 40-page envelope by {main_pages-40} pages')
`;
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', script, ...files, outPath], { stdio: 'inherit' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('merge failed')));
  });
}

(async () => {
  console.log(`» Starting local server on :${PORT}`);
  const srv = await startServer();

  console.log(`» Launching puppeteer (wide-viewport render, print scale 0.62)`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=medium'],
  });

  const produced = [];
  for (const pg of PAGES) {
    const src = path.join(ROOT, pg.url);
    if (!fs.existsSync(src)) {
      console.log(`  · skip ${pg.url} (not found)`);
      continue;
    }
    const out = path.join(OUT_DIR, `${pg.id}.pdf`);
    console.log(`» Rendering ${pg.id} · ${pg.url}`);
    await renderPage(browser, pg.url, out);
    produced.push(out);
  }
  await browser.close();
  srv.close();

  const finalOut = path.join(ROOT, 'HFU-Proposal-compliant.pdf');
  console.log('» Merging into HFU-Proposal-compliant.pdf');
  await mergeWithPyPdf(produced, finalOut);
  const bytes = fs.statSync(finalOut).size;
  console.log(`» Done · HFU-Proposal-compliant.pdf · ${bytes.toLocaleString()} bytes`);
})().catch(err => { console.error(err); process.exit(1); });
