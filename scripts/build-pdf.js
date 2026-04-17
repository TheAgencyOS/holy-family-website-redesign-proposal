const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const REPO = '/Users/scootervineburgh/Downloads/holy-family-update-4-15';
const OUT_DIR = '/tmp/hfu-pdf-build';
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── appendix pages in portal order ───────────────────────────────────────
const APPENDICES = [
  { file: 'opportunities-we-see.html', title: 'Opportunities we see' },
  { file: 'mockups-portal.html',       title: 'Mockups portal' },
  { file: 'design-concepts.html',      title: 'Design concepts' },
  { file: 'design-directions.html',    title: 'Design directions' },
  { file: 'design-system.html',        title: 'Design system' },
  { file: 'discovery.html',            title: 'Discovery process' },
  { file: 'enrollment.html',           title: 'Enrollment intelligence' },
  { file: 'personas.html',             title: 'Student personas' },
  { file: 'mission.html',              title: 'Whole-person thesis' },
  { file: 'peers.html',                title: 'Peer landscape' },
  { file: 'sitemap-atlas.html',        title: 'Sitemap atlas' },
  { file: 'runway.html',               title: '3-month runway' },
  { file: 'ai-lab.html',               title: 'AI migration lab' },
  { file: 'what-ai-can-do.html',       title: 'What AI can do' },
];

const MAIN_BODY_ORDER = [
  { rfp: 'Executive Summary', ids: ['letter'] },
  { rfp: 'A. Agency Information',        ids: ['team'] },
  { rfp: 'B. Approach and Methodology',  ids: ['thesis', 'valuepack', 'commitments', 'tactics', 'evidence'] },
  { rfp: 'C. Technical Approach',        ids: ['ai-arch'] },
  { rfp: 'D. Timeline and Project Management', ids: ['timeline'] },
  { rfp: 'E. Budget and Pricing',        ids: ['budget'] },
  { rfp: 'F. Post-Launch Support',       ids: ['stewardship'] },
  { rfp: 'G. Innovation and Differentiation', ids: ['differentiators'] },
];

async function renderMainBody(browser) {
  const page = await browser.newPage();
  const htmlPath = 'file://' + path.resolve(REPO, 'index.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 180000 });

  await page.evaluate((order) => {
    // kill sidebar and any fixed chrome
    document.querySelectorAll('.site-nav, #site-nav-region, .portal-tab, #related, .hero__cta, .letter__sign, .closing__cta').forEach(n => n.remove());

    const main = document.getElementById('main-content') || document.body;
    const hero = document.getElementById('hero');

    // Build TOC page
    const toc = document.createElement('section');
    toc.className = 'pdf-toc';
    toc.innerHTML = '<h2>Table of Contents</h2><ol>' +
      ['<li>Cover</li>', '<li>Executive Summary</li>']
        .concat(order.slice(1).map(s => `<li>${s.rfp}</li>`))
        .concat(['<li>Appendices</li>']).join('') +
      '</ol><p class="pdf-toc__note">Main body organized per RFP Section 9, pages 1–40. Appendices contain the complete interactive proposal site: opportunities, mockups, design system, discovery, enrollment intelligence, personas, whole-person thesis, peer landscape, sitemap atlas, 3-month runway, AI migration lab, and research notes.</p>';

    // Collect sections in RFP order
    const collected = [];
    order.forEach(group => {
      const divider = document.createElement('section');
      divider.className = 'pdf-divider';
      divider.innerHTML = `<div class="pdf-divider__kicker">RFP Section</div><h1 class="pdf-divider__title">${group.rfp}</h1>`;
      collected.push(divider);
      group.ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) collected.push(el);
      });
    });

    // Clear main, rebuild in RFP order: hero (cover) → TOC → sections
    while (main.firstChild) main.removeChild(main.firstChild);
    if (hero) main.appendChild(hero);
    main.appendChild(toc);
    collected.forEach(n => main.appendChild(n));

    // Inject print CSS
    const style = document.createElement('style');
    style.textContent = `
      @page { size: Letter; margin: 0.6in 0.55in; }
      html, body { background: #faf9f6 !important; }
      body { font-size: 10.5pt; }
      .portal-shell, .portal-main { display: block !important; margin-left: 0 !important; }
      .site-nav, .portal-sidebar, .portal-tabs, nav, .reveal { opacity: 1 !important; transform: none !important; }
      .hero { min-height: auto !important; padding: 60pt 0 !important; page-break-after: always; break-after: page; }
      .pdf-toc { page-break-before: always; break-before: page; page-break-after: always; break-after: page; padding: 40pt 0; }
      .pdf-toc h2 { font-size: 28pt; margin-bottom: 20pt; }
      .pdf-toc ol { font-size: 13pt; line-height: 2; }
      .pdf-toc__note { font-size: 10pt; color: #555; margin-top: 24pt; max-width: 60ch; }
      .pdf-divider { page-break-before: always; break-before: page; padding: 18pt 0 14pt; border-bottom: 2pt solid #002d5a; margin-bottom: 18pt; }
      .pdf-divider__kicker { font-size: 9pt; letter-spacing: 0.2em; text-transform: uppercase; color: #002d5a; margin-bottom: 6pt; }
      .pdf-divider__title { font-size: 22pt; margin: 0; color: #002d5a; }
      section.section { page-break-before: auto; break-before: auto; }
      section.section + section.section { page-break-before: always; break-before: page; }
      .pdf-divider + section.section { page-break-before: auto; break-before: auto; }
      img { max-width: 100% !important; height: auto !important; page-break-inside: avoid; break-inside: avoid; }
      h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
      p, li { page-break-inside: avoid; break-inside: avoid; orphans: 3; widows: 3; }
    `;
    document.head.appendChild(style);
  }, MAIN_BODY_ORDER);

  await page.emulateMediaType('print');
  const outPath = path.join(OUT_DIR, 'main-body.pdf');
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', right: '0.55in', bottom: '0.6in', left: '0.55in' },
  });
  await page.close();
  return outPath;
}

async function renderSimple(browser, htmlFile, title) {
  const page = await browser.newPage();
  const htmlPath = 'file://' + path.resolve(REPO, htmlFile);
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 180000 });
  await page.evaluate((title) => {
    document.querySelectorAll('.site-nav, #site-nav-region, .portal-tab').forEach(n => n.remove());
    const divider = document.createElement('section');
    divider.style.cssText = 'page-break-before:always; break-before:page; padding:180pt 0; text-align:center;';
    divider.innerHTML = `<div style="font-size:10pt; letter-spacing:0.2em; text-transform:uppercase; color:#888;">Appendix</div><h1 style="font-size:36pt; margin:12pt 0;">${title}</h1>`;
    const body = document.body;
    body.insertBefore(divider, body.firstChild);
    const style = document.createElement('style');
    style.textContent = `
      @page { size: Letter; margin: 0.6in 0.55in; }
      html, body { background: #faf9f6 !important; }
      img { max-width: 100% !important; height: auto !important; }
    `;
    document.head.appendChild(style);
  }, title);
  await page.emulateMediaType('print');
  const outPath = path.join(OUT_DIR, htmlFile.replace('.html', '.pdf'));
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', right: '0.55in', bottom: '0.6in', left: '0.55in' },
  });
  await page.close();
  return outPath;
}

async function mergePdfs(paths, outPath) {
  const merged = await PDFDocument.create();
  for (const p of paths) {
    const bytes = fs.readFileSync(p);
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(pg => merged.addPage(pg));
  }
  const out = await merged.save();
  fs.writeFileSync(outPath, out);
  return outPath;
}

async function pageCount(p) {
  const bytes = fs.readFileSync(p);
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

(async () => {
  const browser = await puppeteer.launch();
  console.log('rendering main body…');
  const mainBody = await renderMainBody(browser);
  const mainCount = await pageCount(mainBody);
  console.log('main body pages:', mainCount);

  const appendixPaths = [];
  for (const a of APPENDICES) {
    console.log('rendering', a.file);
    try {
      const p = await renderSimple(browser, a.file, a.title);
      const c = await pageCount(p);
      console.log('  →', c, 'pages');
      appendixPaths.push(p);
    } catch (e) {
      console.log('  skipped:', e.message);
    }
  }

  await browser.close();

  const finalPath = '/tmp/HFU-Proposal-compliant.pdf';
  await mergePdfs([mainBody, ...appendixPaths], finalPath);
  const total = await pageCount(finalPath);
  console.log('FINAL', finalPath, 'total pages:', total, '· main body:', mainCount);
})();
