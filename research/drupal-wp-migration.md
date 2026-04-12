---
title: "Holy Family University RFP — Drupal → WordPress AI Migration Research"
tags: [hightide, research, rfp, higher-ed, wordpress, migration, ai]
created: 2026-04-10
---

# Holy Family University RFP — Drupal → WordPress AI Migration Research

**RFP:** Holy Family University Website Redesign | Due April 17, 2026
**Scope:** 1,300-page Drupal → WordPress migration + full redesign | 6–12 months

---

## Migration Tooling: What Actually Works

**Primary stack:**
1. **FG Drupal to WordPress Premium (~$100–200)** — reads Drupal DB directly, does not touch source. Handles articles, pages, categories, media, URLs. Required add-ons for a university site: CCK, Entity Reference, Paragraphs, Meta tags, Webform. One reviewer migrated 12 Drupal 7 sites with 5,000+ nodes with complex entity references.
2. **WP All Import ($99+)** — drag-and-drop field mapping into any CPT from CSV/XML. Use for refinement passes after FG handles bulk migration.
3. **Custom scripts (Python/PHP)** — reserve for the 5–10% of content that resists FG + WP All Import (e.g., deeply nested Paragraphs).

**Command-line pairing:** Drush on Drupal side + WP-CLI on WordPress side for pre/post-processing.

**Memory/scaling tip:** Set `WP_MEMORY_LIMIT = 512M` and PHP `memory_limit = 1G`. FG resumes where it stopped on timeout.

---

## AI as Migration Accelerator (Not Engine)

AI adds 30–50% speed at 5 specific stages:

| Stage | What AI Does | Tooling |
|---|---|---|
| Content audit | Classifies pages, finds duplicates, suggests consolidation, flags outdated content | LLM batch API (~$20–50 for 1,300 pages) |
| Schema mapping | Analyzes Drupal field config, generates WordPress CPT/ACF JSON definitions as first draft | LLM + human validation |
| Content transformation | Cleans legacy HTML, splits monolithic body fields, generates missing meta descriptions + alt text, normalizes formatting | LLM batch API |
| Redirect mapping | Semantic URL matching via embeddings (NOT generative AI) — Screaming Frog export → Python + sentence-transformers + FAISS | `all-MiniLM-L6-v2` + FAISS |
| Post-migration QA | Compares source vs. destination, flags empty fields, broken references, formatting drift | LLM + output as spreadsheet |

**The framework:** AI drafts, humans decide, code executes, tests verify.

**Redirect mapping detail:** Crawl both sites with Screaming Frog, generate embeddings, auto-accept matches above 0.98 similarity, human review below. Daniel Emery's "Automated Redirect Matchmaker" on Google Colab is a ready-made implementation.

---

## Content Type Mapping for a University Site

| Drupal Content Type | WordPress Target | Notes |
|---|---|---|
| Article / News | `post` (native) | Category taxonomy by dept/topic |
| Basic Page | `page` (native) | Hierarchical parent-child for IA |
| Program / Degree | CPT `program` | ACF field groups for level, dept, format, requirements |
| Faculty Profile | CPT `faculty` | ACF for title, dept, research areas, publications, headshot |
| Event | CPT `event` | ACF or The Events Calendar plugin |
| Landing Page | `page` + Gutenberg blocks | Block patterns or ACF Flexible Content |
| Webform | Gravity Forms or WS Form | FG has Webform add-on; complex forms need manual rebuild |
| Entity References | ACF Relationship fields | ACF Pro required (~$50/yr) |
| Paragraphs | Gutenberg blocks OR ACF Flexible Content | Closest match — nested Paragraphs need flattening strategy |

**Critical pre-migration decisions:**
- Run content audit first — 1,300 pages likely reducible to 900–1,000 active pages
- Drupal Paragraphs are the single biggest technical risk — decide Gutenberg vs. ACF Flexible Content before migration
- Taxonomy: `department` and `program-type` shared across CPTs

---

## Pantheon for WordPress

Same Dev/Test/Live architecture as Drupal. Key features relevant to this project:

- **Code moves up, content moves down** — standard WebOps workflow
- **Multidev** — unlimited on-demand environments for parallel content-type testing
- **Terminus CLI** — pairs with WP-CLI for scripted migration workflows
- **Autopilot** — automated plugin/core updates with visual regression before promotion
- **Upstreams** — enforce approved plugin/theme baselines across any department sub-sites

**Limitation:** Filesystem is read-only in Test/Live (code deploys via Git only). Surprises WordPress devs but is actually a security benefit.

---

## Headless vs. Traditional WordPress: Recommendation

**Traditional WordPress is the right call.** Headless is a trap for this context.

**Why NOT headless:**
- Editorial workflow degrades — WYSIWYG, real-time preview, in-context editing all require re-engineering
- Plugin ecosystem breaks — Yoast, Gravity Forms, GTM, accessibility checkers all need frontend reimplementation
- Requires dedicated React/Next.js frontend engineers — if their internal team is PHP/WordPress, headless creates a permanent skills gap
- Two codebases to maintain (WP backend + frontend app) for a site that needs stability over 5+ years
- "Headless is not automatically faster" — performance depends on managing API latency, hydration, caching; a well-optimized traditional WP on Pantheon's CDN matches a poorly implemented headless setup

**When headless makes sense (not here):** Multi-platform content (web + native apps + digital signage), 3+ dedicated frontend engineers, millions of pageviews/month, or existing headless institutional knowledge.

**The right answer to their headless question in the proposal:** Recommend traditional WordPress, but architect the content model with ACF + REST API to be "headless-ready" so the option exists later without rebuilding the content layer.

---

## Key Open Questions for Discovery Phase

These should go into the RFP proposal as questions to confirm:

1. **Drupal version?** D7 (EOL January 2025) vs. D9/10/11 significantly changes migration complexity
2. **Paragraphs usage?** The single biggest technical risk factor
3. **Current Pantheon contract?** If already on Pantheon, WordPress migration is simpler
4. **Multilingual?** WPML/Polylang adds complexity and cost
5. **URL structure target?** Preserving `/node/123` vs. adopting `/program-name/` slugs determines redirect scope

---

## Competitive Angle for the Proposal

- Drupal is higher ed's stronghold ("80% of top 100 universities use Drupal") — frame the WordPress recommendation around editorial usability, developer availability, plugin ecosystem, and lower TCO for their specific team size
- Acknowledge Drupal CMS 2.0 (Starshot) as an alternative they may have considered — then make the case for WordPress anyway
- AI-accelerated migration is differentiating: most agencies hand-migrate at $X/hour; frame the AI layer as a way to deliver higher quality (more content cleaned/optimized) faster without passing cost to the client
- Position redirect mapping automation as a concrete deliverable: "We will deliver a validated 301 redirect map for every active URL on launch day"

---

## Sources

- [FG Drupal to WordPress - WordPress.org](https://wordpress.org/plugins/fg-drupal-to-wp/)
- [WP All Import](https://www.wpallimport.com/)
- [Search Engine Land - AI-Powered Redirect Mapping](https://searchengineland.com/site-migrations-ai-powered-redirect-mapping-437793)
- [Enonic - Migrating CMS with AI](https://www.enonic.com/blog/migrating-between-cms-with-ai-is-it-possible)
- [Brimit - How AI Is Transforming Digital Replatforming](https://www.brimit.com/blog/content-migration-doesnt-have-to-take-months-how-ai-is-transforming-digital-replatforming)
- [WordPress VIP - Headless WordPress Tradeoffs](https://wpvip.com/blog/headless-wordpress-tradeoffs/)
- [Pantheon WebOps Workflow Docs](https://docs.pantheon.io/pantheon-workflow)
- [Pantheon - Drupal vs WordPress for Universities](https://pantheon.io/learning-center/cms/drupal-vs-wordpress-universities)
- [migratecontent.com - Drupal to WordPress Guide](https://migratecontent.com/guides/drupal-to-wordpress-migrations/content-migration/)
- [Multidots - Content Structure During Drupal to WordPress Migration](https://www.multidots.com/blog/maintain-content-structure-during-drupal-to-wordpress-migration/)
- [Zebedee Creations - WordPress in 2026](https://www.zebedeecreations.com/blog/wordpress-in-2026-traditional-headless-static-or-hybrid/)
