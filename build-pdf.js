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

// Two-pass main render: first pass finds the page numbers where each
// `#anchor` lands, second pass re-renders with those numbers injected
// into the TOC via ?toc=… query string JSON.
async function findSectionPages(browser) {
  const anchors = [
    'letter','valuepack','team','case-studies','evidence',
    'commitments','tactics','mockups','sitemap',
    'state','ai-arch','differentiators',
    'timeline','budget','stewardship',
    'peers','mission','closing'
  ];
  const tmp = path.join(OUT_DIR, 'probe-main.pdf');
  await renderPage(browser, 'index.html', tmp, { forTocProbe: true });
  const out = require('child_process').spawnSync('python3', ['-c', `
import sys, json
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
pages = [p.extract_text() or '' for p in r.pages]
found = { 'main-body-pages': len(pages) }
for anchor in sys.argv[2:]:
    needle = 'TOCMK' + anchor + 'TOCMK'
    for i, t in enumerate(pages):
        if needle in t:
            found[anchor] = i + 1
            break
print(json.dumps(found))
`, tmp, ...anchors], { encoding: 'utf-8' });
  if (out.status !== 0) { console.error(out.stderr); return {}; }
  try {
    const found = JSON.parse(out.stdout.trim());
    // appendix-start = first page after the main body finishes
    found['appendix-start'] = (found['main-body-pages'] || 0) + 1;
    return found;
  } catch { return {}; }
}

async function renderPage(browser, url, outPath, opts = {}) {
  const page = await browser.newPage();
  page.on('console', m => { if (String(m.text()).startsWith('PROBE')) console.log('   · ' + m.text()); });
  // Wide desktop viewport so layouts that expect 1100-1280 px render
  // at their designed width. pdf(scale) then shrinks to Letter.
  // Render at 960 CSS px with scale 0.78 and 0.35" margins:
  //   content printed width = 960 × 0.78 = 748.8 px
  //   Letter content area   = (8.5 - 0.7) × 96 = 748.8 px
  // Exact fit, with larger text than the previous 1040 × 0.72.
  await page.setViewport({ width: 960, height: 1400, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}/${url}`, {
    waitUntil: ['load', 'networkidle0'],
    timeout: 90000,
  });
  // Print CSS should already handle reveal visibility, but force any
  // IntersectionObserver-driven class now, in case a deep-dive page
  // has its own observers that haven't fired yet.
  await page.evaluate((opts) => {
    document.querySelectorAll('.reveal, [data-reveal], [data-animate]').forEach(el => {
      el.classList.add('is-in', 'is-visible', 'in-view');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    // First-pass probe: inject an invisible-but-extractable marker
    // next to each id so the second pass can find which printed PDF
    // page each anchor lands on via text extraction. The marker must
    // be (a) small enough not to shift pagination, (b) visible-enough
    // for Chrome to include it in the PDF text layer. White 6pt text
    // on the white paper satisfies both.
    if (opts.forTocProbe) {
      const ids = ['letter','valuepack','team','case-studies','evidence',
        'commitments','tactics','mockups','sitemap',
        'state','ai-arch','differentiators',
        'timeline','budget','stewardship',
        'peers','mission','closing'];
      let added = 0;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) { console.log('PROBE-MISS', id); continue; }
        // Marker is a visible-but-small fingerprint. Use 5pt in a
        // near-cream color so it lands in the text layer cleanly.
        const mk = document.createElement('div');
        mk.textContent = 'TOCMK' + id + 'TOCMK';
        mk.setAttribute('style',
          'font-size:5pt;line-height:1;color:#FAF9F6;' +
          'background:transparent;font-family:monospace;' +
          'margin:0;padding:0;');
        el.insertBefore(mk, el.firstChild);
        added++;
      }
      console.log('PROBE-ADDED', added, 'markers');
    }
    // Second-pass: inject real page numbers into the TOC.
    if (opts.tocPages) {
      document.querySelectorAll('[data-toc-page]').forEach(el => {
        const key = el.getAttribute('data-toc-page');
        if (opts.tocPages[key]) el.textContent = String(opts.tocPages[key]);
      });
    }
  }, opts);
  await page.emulateMediaType('print');
  // Force every lazy image to load eagerly and scroll through the
  // document so IntersectionObserver-driven lazy loads fire. The
  // team section's .member__avatar <img loading="lazy"> elements
  // are below the fold and would otherwise never load before print.
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.loading = 'eager';
      if (!img.complete && img.dataset.src) img.src = img.dataset.src;
    });
    // Trigger lazy loaders by scrolling through the document
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y <= h; y += 500) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
    // Wait for every <img> to finish (or fail) loading
    await Promise.all(Array.from(document.images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
        setTimeout(res, 4000);
      });
    }));
  });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 600));
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    // Scale < 1 shrinks the 1280-px layout so its full width fits the
    // 8.5" Letter paper without horizontal clipping. 0.62 ≈ 710/1144
    // (Letter content width ÷ desktop canvas after margins).
    scale: 0.78,
    margin: { top: '0.4in', bottom: '0.4in', left: '0.35in', right: '0.35in' },
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

  // --- First pass: render main with toc probe markers to locate sections
  console.log('» First pass · probing section page numbers');
  const tocPages = await findSectionPages(browser);
  console.log('  · TOC page map:', JSON.stringify(tocPages));

  const produced = [];
  for (const pg of PAGES) {
    const src = path.join(ROOT, pg.url);
    if (!fs.existsSync(src)) {
      console.log(`  · skip ${pg.url} (not found)`);
      continue;
    }
    const out = path.join(OUT_DIR, `${pg.id}.pdf`);
    console.log(`» Rendering ${pg.id} · ${pg.url}`);
    // Second pass for index.html uses the probed page numbers so the
    // TOC ships with real numbers. Deep-dive pages render normally.
    const opts = pg.id === '00-main' ? { tocPages } : {};
    await renderPage(browser, pg.url, out, opts);
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
