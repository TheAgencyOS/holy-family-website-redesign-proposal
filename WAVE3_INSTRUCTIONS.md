# Wave 3 Shared Instructions

> Every Wave 3 content agent reads this plus BRIEFING.md plus their section-specific task. This file is the authoritative Wave 3 contract.

## Hard Rules (repeat, non-negotiable)

1. **No em dashes.** The character `—` (U+2014) is banned from content, HTML attributes, comments, and return messages. Use commas, colons, parentheses, semicolons, or split sentences. En dashes (`–`, U+2013) are allowed only for numeric ranges (2021–2026).

2. **No fabrication.** For agency-specific unknowns use these exact placeholders:
   - `[TODO: Agency Name]`
   - `[TODO: Agency City, State]`
   - `[TODO: Agency founded YYYY]`
   - `[TODO: Team Lead, Name, Title]`
   - `[TODO: Team Lead bio, 3 sentences]`
   - `[TODO: Case Study, Institution, year, scope, 3 outcomes]`
   - `[TODO: Reference, Name, Title, Institution, email, phone]`
   - `[TODO: Agency hourly rate]`
   - `[TODO: Total fixed-fee amount]`

3. **Use design tokens.** Reference tokens from `site/tokens.css` via CSS variables: `hsl(var(--token))` for colors, `var(--space-N)` for spacing, `var(--font-body|display|mono)` for fonts. Never invent values.

4. **Semantic HTML5 and WCAG 2.2 AA.** Heading hierarchy: one `<h1>` (cover only), then `<h2>` per RFP section, `<h3>` for subsections. Alt text on every image. Labeled controls. Visible focus. Keyboard navigable. 44x44 touch targets.

5. **Voice.** Confident, specific, editorial, restrained. Banned phrases: cutting-edge, best-in-class, world-class, leverage, synergy, robust, holistic, seamless, thought leadership, game changer, next-generation, revolutionary, unlock, empower. Every claim traces to a number or a proper noun.

## Wave 1 Intelligence (supersedes original HFU Facts in BRIEFING.md)

### Institution (corrected)

- **Enrollment:** "more than 3,600 students at undergraduate, graduate, and doctoral levels" (HFU About page). Do NOT write 3,700. Fall 2022 Fast Facts reports 2,955 total. If you need a specific number, use the About page language.
- **Employment rate:** "approximately 92 percent of recent graduates are working or attending graduate school within one year of graduation" (HFU Fast Facts, verbatim). Do NOT write 93 percent within six months.
- **4 schools:** Arts and Sciences, Business and Technology, Education, Nursing and Health Sciences (exact names).
- **Founding:** 1954 by the Sisters of the Holy Family of Nazareth.
- **Credit rating:** S and P A minus, stable outlook, first assigned 2022. Do NOT claim 2026 affirmation.
- **Strategic plan:** 2021 to 2026, full title "Advancing Knowledge and Transforming Lives".
- **Newtown West Campus:** opening in phases in 2026.

### Leadership (titles confirmed)

- **Anne M. Prisco, Ph.D.**, President, since July 2021. First lay president. Spoke at the UN March 2026.
- **Rick Mitchell**, Director of Digital Experience Design, since April 2024. Villanova BA, Drexel MS, Cornell UX Certificate 2025. Writes code himself.
- **Katherine Primus**, VP for Marketing and Communications, since March 2025. Wharton background.
- **Mark Green, Ed.D.**, VP for Institutional Effectiveness, Technology and Innovation (no Oxford comma between Technology and Innovation), since 2019.
- **Edward P. Wright, Ed.D.**, VP for Enrollment Management, joined August 2022.
- **Eric Nelson, MBA**, VP for Finance and Administration, since May 2019, also CFO.

### Current Site (confirmed 2026-04-10)

- **CMS:** Drupal 10 on Pantheon (Varnish plus Fastly CDN)
- **JSON:API:** returns 404, not exposed
- **Total URLs:** 1,601 (exact)
- **News articles:** 654, which is 41 percent of the sitemap (NOT 670 or 42 percent)
- **Duplicate request-for-information forms:** 23 exact (NOT "20 plus")
- **Magazine URLs:** 54 split across two conflicting prefixes, `/magazine/` (32) and `/magazines/` (22)
- **Stale content:** 910 URLs (57 percent) not updated since 2024 or earlier
- **Year-tagged legacy URLs:** 113
- **`/llms.txt`:** not present (404). Concrete AEO quick win.
- **IA oddity:** `/nursing` silently redirects to `/grad-nursing`.
- **Most recent site update:** 2026-04-10.
- **Incumbent agency signal:** OHO Interactive cache tags (`oho_banner`) visible in HFU response headers. Strongly suggests OHO built or maintains the current site. Frame the rebuild as "the current site has reached the end of its useful life after roughly five years." Do NOT name OHO as the culprit.

### Lighthouse Scores (homepage, 2026-04-10, run via Lighthouse 12.8.2)

| Category | Desktop | Mobile |
|---|---|---|
| Performance | 59 | 51 |
| Accessibility | 96 | 96 |
| Best Practices | 56 | 57 |
| SEO | 85 | 85 |

- **Desktop LCP:** 11.42 seconds (poor, threshold 2.5 seconds good, 4.0 seconds poor)
- **Mobile LCP:** 21.19 seconds (severely poor)
- **CLS:** 0.003 (good)
- **Mobile Total Blocking Time:** 436 ms (poor, proxy for INP)
- **Homepage payload:** approximately 4 MB of unoptimized legacy-format imagery
- **Top perf opportunities:** next-gen image formats save about 3 seconds of mobile LCP, eliminate render-blocking resources save 1.1 to 1.4 seconds, reduce unused JavaScript save about 1 second and 878 KB

**Important framing:** the Accessibility 96 score is misleading. Lighthouse uses axe-core automated rules, which catch only roughly 30 to 57 percent of WCAG failures. Manual testing categories (focus order, landmarks, managed focus, reading order, labels for custom controls, live regions) are listed by Lighthouse as "requires human review." The real WCAG 2.2 AA gap is larger than 96 suggests. The homepage scan does not exercise program pages, the 23 RFI forms, Slate integration, or the 654 news articles.

### Competitive Context

**Cabrini University** closed after spring 2024. Villanova bought the campus. About 1,500 students were redistributed across regional Catholic institutions. Saint Joseph's transfer enrollment rose 113 percent after absorbing Cabrini students. This tightens enrollment competition for HFU's small-private-Catholic undergraduate pool.

**Peer institutions for comparison:**
- **La Salle University** (peer-lasalle.png): direct peer, 7 out of 10 modernity, has a hero program finder
- **Chestnut Hill College** (peer-chestnut-hill.png): scale peer, 4 out of 10, similar "nice hero thin body" pattern to HFU
- **Creighton University** (peer-creighton.png): gold standard, 9 out of 10, most modern Catholic university site in the sample, editorial grid with a smart contact card
- Neumann, Immaculata, Villanova screenshots also available if needed

**Likely competing agencies (for Section G differentiation):**
- **OHO Interactive** (Boston, 100 plus employees, Drupal-leaning, prices $250K to $450K plus, built for Ivy League budgets)
- **Promet Source** (Chicago, Drupal-first with Provus EDU, will likely push back on WordPress)
- **Kanopi Studios** (continuous-improvement retainer model, optimized for long-term dependency)
- **Electric Citizen** (Minneapolis, small Drupal shop, accessibility-forward, no visible private Catholic experience)

### Recent HFU News (cite freely)

- **April 8, 2026:** "Holy Family University Welcomes New Dean to the School of Business and Technology" (source: HFU News)
- **March 10, 2026:** "Holy Family University's President Speaks at the United Nations" (source: Vista.today)
- **March 6, 2026:** "Announcing Holy Family's Bold Ideas Expert Hub" (source: HFU News)
- **December 22, 2025:** "Pennsylvania Grant Will Create State-of-the-Art Addition to Holy Family Hall" (capital projects angle)

### Wave 2 CSS Additions Beyond the Briefing Contract

These classes are defined in the updated `components.css` and free to use:

- `.card--featured` (teal-tinted variant)
- `.cta-button--lg`, `.cta-button--sm` size modifiers
- `.details-card__body` for accordion body
- `.timeline-phase__label`, `.timeline-phase__title`
- `.process-step__content`, `.subsection-eyebrow`
- Sidebar sub-classes: `.sidebar-nav__title`, `.sidebar-nav__subtitle`, `.sidebar-nav__item`, `.sidebar-nav__link-label`, `.sidebar-nav__link-pages`
- Section modifiers: `.section--cover`, `.section--executive-summary`, `.section--agency`, `.section--approach`, `.section--technical`, `.section--timeline`, `.section--budget`, `.section--post-launch`, `.section--differentiation`

## Output Format

Write a single HTML fragment (no `<html>`, `<head>`, or `<body>`) to the file specified in your task.

**Wrapper template:**

```html
<section id="[section-id]" class="section section--[section-id]" aria-labelledby="[section-id]-heading">
  <div class="section-inner">
    <div class="section-eyebrow">[Label, e.g. "Section B"]</div>
    <h2 id="[section-id]-heading" class="section-title">[Title]</h2>
    <p class="section-lede">[One paragraph thesis]</p>
    <!-- subsections and content -->
  </div>
</section>
```

**Cover only** uses `<h1 id="cover-heading">` and `class="section section--cover"`.

## Component Cheatsheet

| Need | Use |
|---|---|
| RFP sub-section with its own H3 | `.subsection` wraps, `.subsection-title` on the h3, optional `.subsection-eyebrow` above |
| Body text column | `.prose` (65ch max width, 1.65 line-height) |
| Key principle highlight | `.callout` with variant `.callout--teal`, `.callout--neutral`, or `.callout--warning` |
| Grid of related items | `.card-grid` with `.card` children |
| Individual card | `.card` with optional `.card--elevated` or `.card--featured`, and `.card__eyebrow`, `.card__title`, `.card__body`, `.card__footer` |
| Big numbers (stats) | `.stat-grid` wrapping `.stat` elements with `.stat__value` and `.stat__label` |
| Editorial quote | `.pull-quote` (italic serif, teal left border) |
| Structured data | `.data-table` with `<thead>`, `<tbody>`, and `.num` class on numeric `<td>` cells |
| Pricing table | `.cost-table` extends data-table with `.cost-table__total` emphasis row |
| Numbered phases | `.process-steps` with `.process-step`, `.process-step__number`, `.process-step__title`, `.process-step__body` |
| Horizontal timeline | `.timeline` with `.timeline-phase`, `.timeline-phase__label`, `.timeline-phase__title` |
| Bulleted list | `.feature-list` with custom bullets, or `.check-list` with check icons |
| Small label tags | `.pill` with `.pill--teal` or `.pill--neutral` |
| Expandable content | `<details class="details-card">` containing `<summary>` and `<div class="details-card__body">` |
| Tablist | `.tabs` with `.tabs__tab` buttons (use `aria-selected` and `role="tab"`) |
| Primary button | `.cta-button`. Variants: `.cta-button--ghost`, `.cta-button--lg`, `.cta-button--sm` |
| Figure with caption | `<figure>` with `<img>` and `<figcaption>` |
| Machine-readable date | `<time datetime="YYYY-MM-DDTHH:MM:SS">` |

## Research Sources

All paths relative to the Holy Family project folder.

**Primary research:**
- `Copy of Website-Redesign-RFP-031826.pdf` (RFP itself; Section 9 has proposal requirements)
- `2026-04-11 holy-family-bulletproof-research.md` (Slate, WCAG, AEO, competitors)
- `2026-04-11 holy-family-prospect-intelligence.md` (institution, DMU, budget)
- `2026-04-11 holy-family-sitemap.md` (scrape analysis)
- `2026-04-11 holy-family-competitive-positioning-brief.md`
- `2026-04-11 wordpress-build-architecture.md`
- `2026-04-10 holy-family-rfp-drupal-wp-ai-migration.md`

**Prior drafts (reference for points to cover, do not copy verbatim):**
- `2026-04-10 holy-family-rfp-section-[a-g]-*.md`
- `Executive-Summary.md`
- `Section-B-Approach-Methodology.md` (newer, more detailed Section B)
- `2026-04-10 holy-family-rfp-appendix-faq.md`
- `2026-04-10 holy-family-rfp-optional-add-ons-pricing.md`

**Wave 1 assets (reference in HTML via `assets/...` paths relative to index.html):**
- `site/assets/screenshots/hfu-home.png`, `hfu-nursing.png`, `hfu-admissions.png`, `hfu-academics.png`, `hfu-contact.png`, `hfu-home-mobile.png`
- `site/assets/screenshots/peer-lasalle.png`, `peer-chestnut-hill.png`, `peer-creighton.png`, `peer-neumann.png`, `peer-villanova.png`, `peer-immaculata.png`
- `site/assets/lighthouse-hfu.json`
- `site/assets/sitemap-hfu.xml`

When embedding images, the path is relative to `index.html` at `site/index.html`, so use `assets/screenshots/hfu-home.png` (no leading slash).

## Image Conventions

- Every `<img>` must have meaningful `alt` text (not the filename)
- Wrap in `<figure>` with a `<figcaption>` whenever the image carries meaning
- Use `loading="lazy"` on images below the fold
- Use `width` and `height` attributes to prevent layout shift

## Return Format

After writing your section file, return (under 300 words):

1. Absolute file path written
2. Brief outline of what the section contains (3 to 5 bullets)
3. List of TODOs you flagged, with line context or nearby heading
4. Requests for Wave 4 audit attention (specific components or claims to check)
5. Em-dash sweep confirmation ("grep returned 0 instances")
6. Approximate word count of prose (helps manage page budget)
