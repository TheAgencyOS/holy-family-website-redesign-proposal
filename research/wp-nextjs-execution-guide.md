---
title: "WordPress to Next.js Migration — Execution Playbook"
tags: [hightide, research, wordpress, nextjs, migration, execution, client]
created: 2026-04-10
---

# WordPress-to-Next.js Migration: Execution Playbook

## Bottom Line
**3-week MVP, 5-week production-ready.** 5-phase pipeline: Extract → Transform → Scaffold → Test → Deploy. Hard parts: malformed HTML, 10k image deduplication, 2000-page link rewriting, SEO metadata. Don't build from scratch — fork `wordpress-export-to-markdown` for WXR parsing, wrap REST API with raw fetch, scaffold from `9d8dev/next-wp`.

---

## Phase 1: Content Extraction (3–4 days)

### REST API Mode (live site, preferred)

**CLI entry:**
```bash
npx wp-migrate extract --url https://client.example.com --mode rest --output ./content
```

**Dependencies:**
```bash
npm install p-limit dotenv fast-xml-parser
```

**Pseudocode:**
```javascript
// Extract REST API → normalized JSON
async function extractRest(wpUrl) {
  const baseUrl = `${wpUrl}/wp-json/wp/v2`;
  const pages = [];
  let pageNum = 1;

  while (true) {
    const res = await fetch(`${baseUrl}/posts?per_page=100&page=${pageNum}`);
    const posts = await res.json();
    if (posts.length === 0) break;

    pages.push(...posts.map(post => ({
      slug: new URL(post.link).pathname.split('/').filter(Boolean).pop(),
      title: post.title.rendered,
      html: post.content.rendered,
      meta: { date: post.date, author: post.author, featured_image: post.featured_media },
      images: extractImages(post.content.rendered)
    })));

    pageNum++;
  }

  return pages;
}
```

**Rate limiting:**
```javascript
// Respect server limits
const queue = pLimit(10); // max 10 concurrent requests
const posts = await Promise.all(
  postIds.map(id => queue(() => fetch(`${baseUrl}/${id}`)))
);
```

### WXR Mode (offline export)

**Fork `wordpress-export-to-markdown`** ([lonekorean/wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown)):
```bash
npm install wordpress-export-to-markdown
```

**Usage:**
```javascript
const { parseExport } = require('wordpress-export-to-markdown');
const content = await parseExport('export.xml');
// Returns: [ { title, slug, html, date, ... }, ... ]
```

---

## Phase 2: Content Transformation (4–5 days)

### HTML → MDX Pipeline

**Dependencies:**
```bash
npm install turndown html-react-parser sanitize-html sharp p-queue
```

**Transform function:**
```javascript
async function transformContent(pages) {
  const transformed = [];

  for (const page of pages) {
    // Sanitize HTML
    const clean = sanitizeHtml(page.html, {
      allowedTags: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 'strong', 'img', 'a'],
    });

    // Convert to Markdown
    const md = turndown.turndown(clean);

    // Rewrite image URLs
    const localized = md.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (match, alt, url) => {
      const filename = url.split('/').pop();
      return `![${alt}](/images/${filename})`;
    });

    // Extract SEO metadata
    const yoastMeta = page.meta.yoast_head_json || {};

    // Build frontmatter
    const frontmatter = `---
title: "${page.title}"
slug: "${page.slug}"
date: "${page.meta.date}"
description: "${yoastMeta.description || ''}"
canonical: "${yoastMeta.canonical || ''}"
---

`;

    transformed.push({
      slug: page.slug,
      content: frontmatter + localized,
      images: page.images
    });
  }

  return transformed;
}
```

### Image Download & Deduplication

**Dependencies:**
```bash
npm install p-queue crypto
```

**Code:**
```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function downloadImages(pages, outputDir) {
  const queue = new PQueue({ concurrency: 5 });
  const downloaded = new Map(); // URL hash → local path

  for (const page of pages) {
    for (const imgUrl of page.images) {
      if (downloaded.has(imgUrl)) continue;

      queue.add(async () => {
        try {
          const res = await fetch(imgUrl, { timeout: 5000 });
          const buffer = await res.buffer();

          // Dedupe by content hash
          const hash = crypto.createHash('sha256').update(buffer).digest('hex');
          const filename = `${hash}.${imgUrl.split('.').pop()}`;
          const filepath = path.join(outputDir, 'public/images', filename);

          fs.writeFileSync(filepath, buffer);
          downloaded.set(imgUrl, `/images/${filename}`);
        } catch (err) {
          console.warn(`Failed to download ${imgUrl}:`, err.message);
        }
      });
    }
  }

  await queue.onIdle();
  return downloaded;
}
```

---

## Phase 3: Next.js Scaffolding (2–3 days)

### Generate App Router Project

**CLI:**
```bash
npx wp-migrate scaffold --source ./content --target ./next-site
```

**Scaffolding logic:**
```javascript
async function scaffold(contentDir, targetDir) {
  // Create Next.js App Router skeleton
  const files = {
    'next.config.js': `/** @type {import('next').NextConfig} */
const config = {
  images: { unoptimized: true },
  redirects: async () => ${JSON.stringify(buildRedirects())},
};
module.exports = config;
`,

    'app/layout.tsx': `
export const metadata = { title: 'Site', };
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}
`,

    'app/blog/[slug]/page.tsx': `
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), 'content/posts');
  const files = fs.readdirSync(contentDir);
  return files.map(file => ({
    slug: file.replace('.mdx', '')
  }));
}

export default async function Page({ params }) {
  const { slug } = params;
  const filepath = path.join(process.cwd(), 'content/posts', \`\${slug}.mdx\`);

  if (!fs.existsSync(filepath)) notFound();

  const content = fs.readFileSync(filepath, 'utf-8');
  const [, body] = content.split('---').slice(1);

  return <article>{body}</article>;
}
`,

    'scripts/sitemap.ts': buildSitemapScript(),
    'scripts/redirects.ts': buildRedirectsScript(),
  };

  // Write files
  for (const [filepath, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, content);
  }
}
```

### Redirect Mapping (old WP URLs → new Next.js URLs)

**Key insight:** Get the old URL structure from REST API `link` field, map to new paths.

```javascript
function buildRedirects() {
  return [
    { source: '/2024/:year/:month/:slug/', destination: '/blog/:slug' },
    { source: '/category/:category/:slug/', destination: '/blog/:slug' },
    { source: '/:slug/', destination: '/pages/:slug' },
  ];
}
```

---

## Phase 4: Testing & Validation (2–3 days)

### Link Validation

```javascript
const brokenLinks = [];

for (const page of pages) {
  const links = page.content.match(/\[([^\]]*)\]\(([^\)]*)\)/g) || [];

  for (const link of links) {
    const url = link.match(/\]\(([^\)]*)\)/)[1];
    if (url.startsWith('http')) {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status >= 400) {
        brokenLinks.push({ page: page.slug, url, status: res.status });
      }
    }
  }
}

console.log(`Found ${brokenLinks.length} broken links`);
```

### SEO Audit

```javascript
function auditSEO(pages) {
  const issues = [];

  for (const page of pages) {
    const fm = parseFrontmatter(page.content);
    if (!fm.description || fm.description.length < 50) {
      issues.push({ slug: page.slug, issue: 'Missing or short meta description' });
    }
    if (!fm.title || fm.title.length > 60) {
      issues.push({ slug: page.slug, issue: 'Title missing or too long' });
    }
  }

  return issues;
}
```

### Visual Regression (optional, advanced)

```bash
npm install playwright pixelmatch
```

```javascript
async function visualDiff(wpUrl, nextUrl) {
  const browser = await chromium.launch();

  const wpPage = await browser.newPage();
  await wpPage.goto(`${wpUrl}/sample-post`);
  const wpScreenshot = await wpPage.screenshot();

  const nextPage = await browser.newPage();
  await nextPage.goto(`${nextUrl}/blog/sample-post`);
  const nextScreenshot = await nextPage.screenshot();

  const diff = pixelmatch(wpScreenshot, nextScreenshot, null, 1024, 768);
  console.log(`Visual diff: ${diff} pixels changed`);
}
```

---

## Phase 5: Deployment

### Build & Deploy to Vercel

```bash
npm run build
vercel --prod
```

**Build time estimate for 2000 pages:**
- Static generation: 15–30 min on Vercel free tier
- **Alternative: Use ISR instead of full static**
  ```javascript
  export const revalidate = 3600; // Revalidate every hour
  ```

---

## Timeline Estimate

| Phase | Time | Notes |
|---|---|---|
| Phase 1: Extraction | 3–4 days | REST API pagination + error handling + rate limiting |
| Phase 2: Transform | 4–5 days | HTML sanitization, image download, link rewriting |
| Phase 3: Scaffolding | 2–3 days | Next.js project generation + redirects |
| Phase 4: Testing | 2–3 days | Link validation, SEO audit, edge cases |
| Phase 5: Deploy | 1 day | Build optimization, Vercel setup |
| **MVP Total** | **3 weeks** | Covers basic migration, no bells |
| Add: Image optimization (sharp) | +3 days | |
| Add: Yoast/RankMath metadata | +2 days | |
| Add: ACF field handling | +3–5 days | |
| **Production-Ready Total** | **5 weeks** | |

---

## Client Diagnostic Checklist (Before You Start)

Ask the client:
- [ ] How many posts/pages total? (you know: 2000)
- [ ] Any custom post types? (custom, if not standard)
- [ ] WooCommerce or other major plugins? (flag scope)
- [ ] What plugins are active? (`wp-admin/plugins.php`)
- [ ] Is Yoast, RankMath, or other SEO plugin active? (metadata)
- [ ] Are drafts/private content needed? (requires auth)
- [ ] What is the permalink structure? (`wp-admin/options-permalink.php`)
- [ ] How many media files? (rough estimate)
- [ ] Any form plugins (Gravity Forms, WPForms)? (cannot auto-migrate)
- [ ] Can they export WXR? Or is REST API enabled? (choose extraction mode)
- [ ] Target timeline? (drives scope)

---

## Pricing for 2000-Page Migration

**Based on effort:**
- **MVP (2000 pages, basic content, static):** $10–15K
  - Timeline: 3 weeks
  - Includes: REST API extraction, Markdown transform, Next.js scaffold, basic SEO
  - Excludes: plugin feature porting, advanced form handling, WooCommerce checkout

- **Production (2000 pages, optimized images, full metadata):** $15–25K
  - Timeline: 5 weeks
  - Adds: Image optimization, Yoast metadata extraction, extensive testing, Vercel setup

- **Add-ons:**
  - WooCommerce catalog (read-only): +$5K
  - Form rebuilds (Gravity Forms → Formspree): +$2–5K per form
  - Plugin feature replication (custom logic): +$100/hr

**Positioning:** "We migrate your 2000-page WordPress site to a modern, fast Next.js stack in 3–5 weeks. Content is fully extracted, images optimized, and 301 redirects preserve your SEO. No plugins to maintain, 10x faster site speed."

---

## Exact CLI Flow (for user)

```bash
# Step 1: Extract
npx wp-migrate extract \
  --url https://client.example.com \
  --mode rest \
  --output ./client-content

# Step 2: Transform
npx wp-migrate transform \
  --input ./client-content \
  --output ./client-transformed

# Step 3: Scaffold
npx wp-migrate scaffold \
  --source ./client-transformed \
  --target ./client-nextjs

# Step 4: Test
npx wp-migrate validate \
  --source https://client.example.com \
  --target ./client-nextjs

# Step 5: Deploy
cd client-nextjs && npm run build && vercel --prod
```

---

## Key Files & Dependencies (full stack)

```json
{
  "dependencies": {
    "p-limit": "^4.0.0",
    "p-queue": "^7.4.0",
    "turndown": "^7.1.1",
    "sanitize-html": "^2.11.0",
    "fast-xml-parser": "^4.3.2",
    "sharp": "^0.32.0",
    "dotenv": "^16.3.1",
    "node-fetch": "^2.7.0"
  },
  "devDependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "typescript": "^5.3.3"
  }
}
```

---

## Don't Forget

1. **Rate limit:** WP servers will throttle you at 10-20 req/s. Add exponential backoff.
2. **Error recovery:** Store state to disk so you can resume interrupted runs.
3. **Image dedup:** Use SHA-256 hash to avoid storing the same image twice.
4. **Link rewriting:** The hardest part. Walk every single file and test every link post-migration.
5. **SEO metadata:** If client uses Yoast, that data is in REST API. Preserve it.
6. **Shortcodes:** You will encounter custom shortcodes. Strip them and generate a report.
7. **Build time:** 2000 static pages on Vercel takes 20-30 min. Use ISR for faster deploys.

---

## Next Step

Create a GitHub repo with this structure, write Phase 1 extraction logic this week, and run it against the client's site to confirm the pipeline works before committing to the full 5-week timeline.

---

Sources:
- [lonekorean/wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown)
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Turndown docs](https://github.com/mixmark-io/turndown)
- [p-queue docs](https://github.com/sindresorhus/p-queue)
