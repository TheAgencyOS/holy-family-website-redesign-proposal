# HFU Proposal Site: Agent Briefing

> **Read this before starting any task on this project.** This is the shared contract every agent works from. Updates to this file are authoritative.

## Project

We are `[Agency Name]`, an agency responding to **Holy Family University's Website Redesign RFP**. The proposal is being delivered as an interactive single-page website (this project) that will also export to a ≤40 page PDF for formal submission by **5:00 PM EDT, April 17, 2026** to `rmitchell2@holyfamily.edu`.

The site is the primary artifact. The PDF is a printout of the site via Paged.js. Same content, two presentations.

The agency name, team bios, case studies, and references are all still placeholders (`[TODO: ...]`). Do not invent them.

---

## Hard Rules: Non-Negotiable

### 1. No em dashes

The character `—` (U+2014) is **banned** from all output, HTML, CSS comments, prose, and return messages. Use instead:

| Instead of em dash | Use |
|---|---|
| "X, a concept, is Y" (parenthetical) | commas |
| "One thing is clear: we need X" | colon |
| "The site (1,601 pages) is huge" | parentheses |
| "This matters. Here is why." | split sentence |
| "The site is aging; Drupal is ending" | semicolon |
| "2021–2026" (numeric range) | en dash (U+2013), still OK |

**Before returning, grep your output for `—` and replace every instance.** This is the single most common rule violation.

### 2. No fabrication

Never invent facts, agency case studies, team bios, references, or client quotes. For agency-specific unknowns, use explicit placeholders:

- `[TODO: Agency Name]`
- `[TODO: Project Lead, Title, X years experience]`
- `[TODO: Case Study, Institution, scope, outcomes]`
- `[TODO: Reference, Name, Title, Institution, Email, Phone]`

Flag all TODOs in your return message.

### 3. Use design tokens

All colors, fonts, spacing, shadows, and radii come from `site/tokens.css`. Reference via:

- Colors: `color: hsl(var(--text-primary));`, `background: hsl(var(--teal) / 0.08);`
- Fonts: `font-family: var(--font-body);` (body), `var(--font-display);` (headings), `var(--font-mono);` (labels, data)
- Spacing: `padding: var(--space-6);`, `gap: var(--space-4);`
- Radius: `border-radius: var(--radius);`
- Shadows: `box-shadow: var(--shadow-md);`
- Motion: `transition: transform var(--duration-fast) var(--zen);`

Never invent hex colors, px values, or font names.

### 4. Plain HTML + CSS only

No build step. No React, Vue, Tailwind, Sass, bundler, or dependency. Vanilla JS only for progressive enhancement (scroll spy, mobile nav toggle, accordion behavior). All assets loaded directly.

### 5. Semantic HTML5 + WCAG 2.2 AA

- One `<h1>` (on the cover), then `<h2>` per RFP section, `<h3>` for subsections
- Alt text on every image (descriptive, not decorative labels on decorative images use `alt=""`)
- Labeled form controls (`<label for="">`)
- Landmarks: `<header>`, `<aside>`, `<main>`, `<footer>`, `<nav>`
- Skip link as first focusable element
- Visible focus ring on every interactive element (use `--focus-ring`)
- Keyboard navigable
- Minimum 44x44px touch targets
- Color contrast 4.5:1 body, 3:1 UI
- Respect `prefers-reduced-motion`

**This site is itself a WCAG 2.2 AA exhibit. It must pass the audit it is pitching.**

### 6. Voice

Confident, specific, editorial, restrained. Every sentence earns its place.

Rick Mitchell (Director of Digital Experience, Cornell UX cert, writes code himself) will evaluate technical claims and can spot hand-waving. Katherine Primus (VP Marketing, Wharton MBA, budget authority) wants measurable outcomes. Your voice must satisfy both.

**Banned phrases:** "cutting-edge", "best-in-class", "world-class", "leverage", "synergy", "robust solution", "holistic approach", "seamless experience", "thought leadership", "game changer", "next-generation".

**Examples:**

❌ "We leverage cutting-edge methodologies to deliver best-in-class enrollment outcomes."

✅ "We will consolidate the current 1,601 URLs to approximately 1,200, retire 670 news articles older than two years, and replace 20 duplicate request-information forms with one smart form that routes to Slate by program."

---

## Research Sources

Read whichever are relevant to your task. All paths relative to the Holy Family project folder unless noted.

**The RFP and top-priority research:**

- `Copy of Website-Redesign-RFP-031826.pdf`: the RFP itself. Section 9 defines what Proposal Sections A through G must address.
- `2026-04-11 holy-family-bulletproof-research.md`: Slate integration, chatbots, AI search, WCAG 2.2, AEO, competitor positioning
- `2026-04-11 holy-family-prospect-intelligence.md`: institutional profile, decision-making unit, budget estimates
- `2026-04-11 holy-family-sitemap.md`: actual scrape of 1,601 URLs with IA analysis
- `2026-04-11 holy-family-competitive-positioning-brief.md`: OHO, Promet, Kanopi, Electric Citizen positioning
- `2026-04-11 wordpress-build-architecture.md`: proposed WordPress theme, CPTs, plugins, block patterns, editorial experience
- `2026-04-10 holy-family-rfp-drupal-wp-ai-migration.md`: AI-accelerated migration methodology

**Prior section drafts (reference for points to cover, do not copy verbatim, the site is a rewrite):**

- `2026-04-10 holy-family-rfp-section-a-agency-information.md`
- `2026-04-10 holy-family-rfp-section-b-approach-methodology.md`
- `2026-04-10 holy-family-rfp-section-c-technical-approach.md`
- `2026-04-10 holy-family-rfp-section-d-timeline-project-management.md`
- `2026-04-10 holy-family-rfp-section-e-budget-pricing.md`
- `2026-04-10 holy-family-rfp-section-f-post-launch-support.md`
- `2026-04-10 holy-family-rfp-section-g-innovation-differentiation.md`
- `2026-04-10 holy-family-rfp-appendix-faq.md`
- `2026-04-10 holy-family-rfp-optional-add-ons-pricing.md`
- `Executive-Summary.md`
- `Section-B-Approach-Methodology.md` (newer, more detailed Section B draft)
- `COMPLETE-PROPOSAL.md` (consolidated draft, partially dated)

**Design system:**

- `site/tokens.css`: design tokens (already written, do not modify)
- `/Users/ericyerke/Desktop/websites/AOS LANDING/BRAND.md`: brand and typography source
- `/Users/ericyerke/Desktop/websites/AOS LANDING/CLAUDE.md`: design philosophy, spacing, motion patterns
- `/Users/ericyerke/Desktop/websites/AOS LANDING/src/globals.css`: reference implementation (lines 200+ for base styles)

**Wave 1 outputs (available to later waves):**

- `site/assets/screenshots/*.png`: holyfamily.edu and peer institutions
- `site/assets/lighthouse-hfu.json`: real Lighthouse scores
- `site/assets/sitemap-hfu.xml`: confirmed sitemap
- Wave 1 findings are also posted back in the main conversation for Wave 3 to consume

---

## HFU Facts: Use These Verbatim

### Institution

- **Holy Family University**, private Catholic
- Northeast Philadelphia campus, Newtown (Bucks County) campus
- Founded 1954 by the Sisters of the Holy Family of Nazareth
- ~3,700 total students (~3,251 undergrad, ~600 graduate)
- 30 plus undergraduate majors, 20 plus graduate programs
- 4 schools: Arts and Sciences, Business and Technology, Education, Nursing and Health Sciences
- Nursing is 40 percent of student body
- 93 percent employment within six months of graduation
- Credit rating: S and P A minus (stable outlook)
- Annual revenue approximately $96.4M, endowment approximately $30M
- Strategic Plan 2021 to 2026 "Advancing Knowledge" expires June 2026

### Decision-Making Unit

| Name | Role | Notes |
|---|---|---|
| **Anne M. Prisco, Ph.D.** | President | First lay president, economist, since 2021. Growth agenda: athletics, cybersecurity and biotech master's programs, Newtown innovation center. |
| **Rick Mitchell** | Director of Digital Experience Design | Project lead, since April 2024. EY, Apple Leisure Group, Urban Outfitters background. Villanova BA English, Drexel MS, Cornell UX Design Certificate 2025. Writes Drupal and React code himself, maintains internal design system. Direct reports: 1 (Senior Web Strategist). |
| **Katherine Primus** | VP for Marketing and Communications | Budget authority, since March 2025. Wharton, $1B fundraising campaign, Philadelphia Education Fund background. |
| **Mark Green, Ed.D.** | VP for Institutional Effectiveness, Technology, and Innovation | Since 2019. Data governance, AI, IT infrastructure. |
| **Edward Wright, Ed.D.** | VP for Enrollment Management | Selection committee. Focus on conversion, program discoverability. |
| **Eric Nelson, MBA** | VP for Finance and Administration | Budget gatekeeper. |

### Current Site

- **CMS:** Drupal on Pantheon
- **URLs:** 1,601 (actual scrape on 2026-04-11). The RFP says "approximately 1,300" but the real count is 1,601.
- **News articles:** 670 (42 percent of sitemap, many dated 2021 or older)
- **Top level sections:** 180 plus distinct URL sections (symptom of ungoverned growth)
- **Request for information forms:** 20 plus duplicative forms scattered across program pages
- **Analytics stack:** GA4 (GTM-5FPBQK3), Crazy Egg, Hotjar, SEMRush, SiteImprove
- **Video:** Wistia
- **CRM:** Technolutions Slate
- **Existing design system:** Rick Mitchell maintains one internally

### RFP Requirements

- **Preferred CMS:** WordPress (alternative allowed with strong justification)
- **Hosting:** Pantheon (continuing)
- **Accessibility:** WCAG 2.2 AA mandatory, built in not retrofitted
- **Budget:** not stated, estimated range $150K to $350K
- **Timeline:** 6 to 12 months from June 2026 kickoff
- **Mandatory integrations:** Slate CRM, GA4, GTM
- **Optional enhancements:** AI chatbot, AI search, personalization, extended support
- **Collaborative model:** shared repository and code review with HFU internal team
- **Submission:** single PDF, max 40 pages, email to `rmitchell2@holyfamily.edu`
- **Due:** April 17, 2026 at 5:00 PM EDT
- **Evaluation weights:** Experience 25 percent, Approach 25 percent, Collaboration 15 percent, Technical 15 percent, Timeline 10 percent, Budget 10 percent

---

## Section Structure

| DOM ID | Sidebar Label | RFP Section | Page Budget |
|---|---|---|---|
| `cover` | Cover | Cover page | 1 |
| `executive-summary` | Executive Summary | Executive Summary | 2 |
| `agency` | A. Agency Information | Section A | 6 |
| `approach` | B. Approach and Methodology | Section B | 8 |
| `technical` | C. Technical Approach | Section C | 7 |
| `timeline` | D. Timeline and Project Management | Section D | 6 |
| `budget` | E. Budget and Pricing | Section E | 4 |
| `post-launch` | F. Post-Launch Support | Section F | 3 |
| `differentiation` | G. Innovation and Differentiation | Section G | 2 |
| | | **Printed total** | **39 (buffer of 1)** |

Approximately 10,000 words of prose across 40 pages, accounting for visuals, tables, and headings.

---

## Component API Contract

Both Wave 2 (CSS implementation) and Wave 3 (HTML content) consume this contract. This is the source of truth. Wave 2 implements every class listed here. Wave 3 references these classes and does not invent new ones without flagging.

### Layout primitives (in `styles.css`)

- `.container` max width 1080px, horizontal padding via `--container-padding`, centered
- `.container-narrow` max width 720px (text-heavy)
- `.container-wide` max width 1200px
- `.stack` flex column with gap `--space-4`. Modifiers `.stack-sm` (space-2), `.stack-lg` (space-8)
- `.cluster` flex row, wraps, gap `--space-3`
- `.grid-2`, `.grid-3`, `.grid-4` responsive CSS grid via auto-fit minmax
- `.sr-only` screen reader only
- `.skip-link` hidden until focused, positioned top-left
- `.text-balance`, `.text-pretty` utility classes

### Page chrome (in `components.css`)

- `.site-header` minimal top bar, 64px tall, glass backdrop, sticky
- `.sidebar-nav` sticky left rail, 280px wide, full viewport height, internal scroll
- `.sidebar-nav__brand` top area with wordmark
- `.sidebar-nav__list` ol of section links
- `.sidebar-nav__link` block link, `--space-2` padding
- `.sidebar-nav__link--active` teal border-left, stronger weight
- `.sidebar-nav__meta` footer with download PDF button
- `.site-footer` bottom colophon

### Section primitives

- `.section` full width, top-level wrapper with `py-32` (128px desktop, 64px mobile)
- `.section-inner` inner max-width 720px, vertical stack
- `.section-eyebrow` uppercase label, `--font-mono`, tracking-label, text-tertiary, 11px
- `.section-title` `--font-display`, `--text-hero`, `--tracking-display`, `--leading-hero`
- `.section-lede` `--text-h3`, `--leading-heading`, text-secondary, max 48ch
- `.subsection` vertical rhythm container
- `.subsection-title` `--font-display`, `--text-h2`, `--tracking-heading`

### Content primitives

- `.prose` line-height 1.65, max-width 65ch, proper paragraph spacing
- `.lede` larger intro paragraph
- `.pull-quote` large italic serif, teal left border, space-6 padding
- `.callout` tinted box with left border. Variants: `.callout--teal`, `.callout--neutral`, `.callout--warning`
- `.stat` huge display number + small label
- `.stat-grid` 2/3/4 column responsive grid of stats
- `.pill` small rounded tag. Variants: `.pill--teal`, `.pill--neutral`
- `.caption` small mono metadata text

### Cards and lists

- `.card` white bg, border, `--radius-lg`, padding-6, subtle shadow, hover lift
- `.card-grid` auto-fit minmax grid of cards
- `.card__eyebrow`, `.card__title`, `.card__body`, `.card__footer`
- `.feature-list` ul with custom bullet
- `.check-list` ul with check icon

### Tables

- `.data-table` border-collapse, subtle borders, row hover, mono for numbers
- `.cost-table` pricing table with totals row

### Processes and timelines

- `.process-steps` numbered steps with connecting line
- `.process-step` individual step, relative positioning
- `.process-step__number` circled number badge
- `.process-step__title`, `.process-step__body`
- `.timeline` horizontal multi-phase bar visualization
- `.timeline-phase` individual phase

### Interactive primitives

- `.details-card` styled `<details>` and `<summary>` pair
- `.tabs` tablist with bottom-border indicator

---

## Voice Examples

**Confident:** state claims directly. "We will reduce the page count from 1,601 to approximately 1,200." Not "We aim to consider reducing."

**Specific:** cite numbers, dates, proper nouns. "Rick Mitchell's team" not "the internal team."

**Editorial:** start each section with a one-line thesis. End each subsection with a clear takeaway.

**Restrained:** no marketing speak, no exclamation points, no em dashes. Every claim is defensible.

**Quiet authority:** the voice of someone who has shipped this before and does not need to shout.

---

## Final Check Before Returning

- [ ] No em dashes in output
- [ ] No hallucinated facts or case studies
- [ ] Design tokens used throughout, no hardcoded values
- [ ] Semantic HTML and WCAG 2.2 AA
- [ ] Voice is confident, specific, restrained
- [ ] File paths in return message are absolute
- [ ] TODOs flagged in return message
