---
title: "Holy Family University RFP — Bulletproof Research (All Gaps Filled)"
tags: [hightide, research, rfp, higher-ed, proposal, competitive-intel]
created: 2026-04-11
---

# Holy Family University RFP — Bulletproof Research

**Compiled:** 2026-04-11 from 6 parallel research agents
**Related docs:**
- `Research/2026-04-10 holy-family-rfp-drupal-wp-ai-migration.md` — Drupal → WP technical deep-dive
- `Research/2026-04-11 holy-family-prospect-intelligence.md` — Institutional + decision-maker intel
- `Research/2026-04-11 holy-family-sitemap.md` — 1,601-URL site scrape + IA analysis

---

## 1. Slate CRM + WordPress Integration

### Bottom Line
No official WordPress plugin exists. Integration requires either Slate's script-tag embed or the Gravity Forms webhook pattern. The Gravity Forms approach is cleaner and WordPress-native.

### Two Integration Patterns

**Option A: Slate Native Embed (script tag)**
- Paste `<script>` embed code from Slate's form builder into a WordPress page
- Form injects into the host DOM and inherits CSS automatically
- Requires a custom Gutenberg block or shortcode handler to avoid WordPress sanitizing the script tag (NC State's documented solution: custom "Slate Form Embed Block" where authors paste only the form UUID)
- Limitation: one Slate form per page; CSS class collisions possible (`.header`, `.dialog`)

**Option B: Gravity Forms Webhook (recommended)**
- Build native Gravity Form in WordPress, styled to match the theme
- Activate Gravity Forms Webhooks Add-On
- POST form data as JSON to Slate Source Format endpoint
- Fully designed form, no CSS conflicts, no per-page limits
- Real-time delivery (not batch) when configured to POST on submission
- NC State documented this approach end-to-end including all field key mappings

### Slate Ping Tracking (required on every page)
```html
<script async="async" src="https://[instance].technolutions.net/ping">/**/</script>
```
Add via theme header.php, code injection plugin, or Google Tag Manager. Drops first-party cookie, tracks page visits, links anonymous browsing to known Slate records nightly when visitor performs authenticated event (email click, portal login). This is the behavioral tracking foundation for enrollment attribution.

### Data Flows

| Direction | Data | Method |
|---|---|---|
| Website → Slate | RFI/inquiry form submissions | Gravity Forms webhook or Slate embed |
| Website → Slate | Anonymous browsing behavior | Ping script (every page) |
| Slate → Website | Program listings, event data | Query Builder web service (JSON) |
| Slate → Website | Application status portal | Embedded iframe/portal (requires SSO config with IT) |

### Key Technical Risks
- WordPress code sanitization breaks raw script embeds — must use custom block or shortcode
- Slate Knowledge Base is gated — need client's Slate admin access for implementation
- Portal embedding requires cross-domain SSO (SAML/CAS/LDAP) — an IT dependency, not web agency scope
- Slate's Open API launched read-only in 2023; write endpoints may have been added but unconfirmed publicly

### Proposal Language
"We will implement Slate forms using the Gravity Forms webhook pattern — fully branded forms that match your WordPress theme, with zero CSS conflicts, real-time lead delivery to Slate, and no per-page form limits. Slate Ping tracking will be implemented site-wide on day one."

---

## 2. Higher Ed Chatbot Platforms

### Bottom Line
**Gravyty (Ivy & Ocelot)** is the market leader after merging with Ivy.ai and Ocelot in March 2025. For a 3,700-student school using Slate, it's the default recommendation. **Mainstay** is the alternative if SMS enrollment campaigns are in scope.

### Platform Comparison

| Platform | Annual Cost (est.) | Setup | Slate Integration | FERPA | Conversational AI | WordPress |
|---|---|---|---|---|---|---|
| **Gravyty (Ivy & Ocelot)** | $15K-$40K | $5K-$15K | Yes (native) | Yes (SOC 2, BAA) | Yes | JS embed |
| **Mainstay** | $12K-$30K | $3K-$8K | Yes (native) | Yes | Yes | JS embed |
| **Element451 Bolt** | $14K-$40K | Included | Yes (alongside Slate) | Yes (SOC 2, BAA) | Yes | WP plugin |
| **EAB AI Chat Agent** | $20K-$50K | Minimal | Likely | Yes | Yes | JS embed |
| **Tidio** (budget) | $4,800-$9K | $2K-$5K | No (API only) | Not FERPA-native | Basic | WP plugin |

### FERPA Compliance Architecture (Critical)
- Public FAQ bot must be completely separate from authenticated student-record bot
- Never load grades, financials, transcripts, or student IDs into a general chatbot
- BAA with vendor required; data ownership stays with university
- RAG-based architecture: LLM retrieves from approved institutional sources only
- General platforms (Tidio, Intercom) cannot pass a FERPA audit for anything beyond public FAQ

### Realistic Performance Benchmarks
- 60-80% of routine inquiries handled without human intervention
- Chatbot-initiated conversations convert at 5-20% to captured lead (vs ~1.5% for static forms)
- 30-50% reduction in emails/calls/walk-ins
- 3-5% improvement in yield (summer melt reduction)

### What to Propose (Pricing)

**Add-on line item for Holy Family:**
- Your setup/integration fee: **$8K-$15K** one-time (knowledge base build, WordPress integration, Slate config, staff training)
- Platform subscription: **$15K-$25K/year** (Gravyty or Mainstay, passed through or marked up)
- Scope: public-facing FAQ widget + admissions lead capture; NOT authenticated student records (simpler FERPA posture)

---

## 3. AI Search Platforms

### Bottom Line
**Algolia Grow Plus** ($70-335/mo) is best for a budget-conscious add-on with AI-enhanced relevance. For true conversational search (direct answers), step up to **SearchStax Premium** ($500-800+/mo). Skip Elasticsearch — it's an infrastructure tool requiring 40-80+ dev hours, not a search product.

**Critical Pantheon note:** Pantheon includes Apache Solr for free. The baseline is always "what Solr can do" vs. the AI add-on cost. Frame accordingly.

### Platform Comparison

| Platform | Monthly Cost (est.) | Conversational AI | WordPress/Pantheon | Higher Ed Fit | Implementation |
|---|---|---|---|---|---|
| **Algolia Grow Plus** | $70-335 | No (AI ranking only) | Community WP plugin | Good | Easy (4-8 hrs) |
| **Algolia Elevate** | $4,000+ ($50K+/yr) | Yes (NeuralSearch + RAG) | Community WP plugin | Good | Moderate |
| **SearchStax Premium** | $500-800+ | Yes (Smart Answers) | Crawler-based | Excellent | Easy (8-16 hrs) |
| **SearchStax Advanced** | $499+ | No | Crawler-based | Excellent | Easy |
| **Cludo** | $500-1,500 | Yes (AI Chat) | Crawler-based | Very Good | Easy |
| **Swiftype Pro** | $199 | No | VIP-approved plugin | Good | Very easy (2-4 hrs) |
| **Elasticsearch + ElasticPress** | $95-175 | DIY only | ElasticPress plugin | Moderate | Hard (40-80+ hrs) |
| **Pantheon Solr** | $0 (included) | No | Native to Pantheon | Baseline | Already there |

### Two Tiers of "AI Search"
- **Tier 1 (AI-enhanced ranking):** Better relevance, synonyms, intent — search returns smarter results list. Algolia Grow Plus, SearchStax Advanced, Swiftype.
- **Tier 2 (Conversational/generative):** Direct answers synthesized from your content. "What is the FAFSA deadline?" → "March 1, 2026." SearchStax Premium Smart Answers, Algolia Elevate, Cludo AI Chat.

### Proposal Pricing Tiers

| Tier | Platform | Monthly Platform Cost | Your Setup Fee | Total Yr 1 |
|---|---|---|---|---|
| Good | Algolia Grow Plus | $70-335 | $3K-5K | $5K-9K |
| Better | SearchStax Advanced or Cludo | $500-800 | $5K-8K | $11K-18K |
| Best | SearchStax Premium or Algolia Elevate | $800-4,000+ | $8K-15K | $18K-63K |

---

## 4. Enrollment Conversion Benchmarks

### What a Well-Executed Redesign Delivers
- **25-35% improvement in conversion rates** (RFI submissions, application starts) from well-executed redesigns with ongoing CRO
- **Standout cases:** CityU of Seattle +171% RFI in month 1; Corlears School +30% applications immediately; Harper College +962% applications with funnel-stage personalization
- **Engagement:** Bounce rate target post-redesign: 20-30% (down from HE average ~55%)
- **Traffic:** Organic search grows 25-30% within 1 year of relaunch

### Baseline Benchmarks ("What Good Looks Like")

| Metric | Typical | Good | Top Performer |
|---|---|---|---|
| Landing page conversion | 6.3% | 8.4% | 12%+ |
| RFI form completion | 1-2% of visitors | 3-5% | 5%+ |
| Inquiry-to-application | 15-25% | 30-50% | 50%+ |
| Application-to-admission | 50-70% | 60-70% | 70%+ |
| Yield (admit-to-enroll) | 20-30% | 30-40% | 40%+ |
| Bounce rate | 55% | 40-50% | 26-40% |
| Pages/session | 2.3 | 2.5-2.6 | 3.0+ |

### Key Nuance
A one-time redesign without ongoing CRO produces much smaller/temporary gains. Pair the redesign with a post-launch optimization roadmap to lock in the 25-35% lift.

---

## 5. Website Personalization (Tiered Add-On)

### Three Tiers for Holy Family

**Basic (Year 1, include in base scope)**
- Geo-targeting: in-state vs. out-of-state tuition/aid messaging
- UTM/referral targeting: different hero for paid search vs. organic vs. email
- Device-aware CTAs: mobile-optimized vs. desktop
- Conditional CTAs: "Apply Now" for 3+ program page visits, "Request Info" for first-timers
- Tools: If-So Dynamic Content ($139-199/yr) or Logic Hop ($199/yr) — WP plugins
- **Ferris State result:** Geo-targeting alone moved homepage CTR from 1.6% to 14%

**Intermediate (Add-on, $15K-25K implementation + $10K-15K/yr tooling)**
- Funnel-stage personalization: different content for leads vs. inquiries vs. applicants vs. admitted
- Program-interest targeting: "You were looking at Nursing" blocks on return visits
- Exit-intent interventions: targeted offers on leaving behavior
- Requires: CRM integration (Slate webhook) or cookie-based journey tracking
- Tool: Halda (higher ed-specific, $15K-40K/yr)
- **Harper College result:** 962% more applications; 47% of Halda leads enrolled

**Advanced (Year 2+, $40K-100K+ implementation)**
- ML-driven individual-level recommendations
- Real-time behavioral scoring
- Cross-channel (web + email + SMS)
- Requires: dedicated martech staff, clean CRM data, large content library
- Tool: Optimizely ($36K+/yr), Salesforce MC Personalization ($100K+/yr)
- Not recommended for Year 1 at Holy Family's budget level

### Compliance
- **GDPR:** Opt-in consent before tracking cookies. Geo-targeting via IP (no storage) is generally permissible.
- **CCPA:** Opt-out model. Needs "Do Not Sell" link if behavioral data shared with 3rd parties.
- **FERPA:** Protects enrolled students only. Prospective student browsing is NOT covered.
- Cookie consent platform (OneTrust, Cookiebot) required for EU visitors.

---

## 6. AEO/GEO Strategy (AI Search Optimization)

### Why This Matters for Holy Family
Half of prospective students use AI tools weekly to research programs. 93% of AI search sessions end without a click — the content AI surfaces IS the first impression. AI visitors convert at **4.4x the rate of organic visitors** when they do click through.

### What Gets Cited by AI (Concrete Data)
- Domain traffic strongest predictor (sites with more traffic get 3x more citations)
- Pages updated within 2 months get 5.0 citations vs. 3.9 for older content
- Content with statistics, citations, quotes: 30-40% higher AI visibility
- Grade 6-8 reading level earns more citations than advanced text
- Citation rates: Perplexity 13.05%, Google AI Mode 9.09%, ChatGPT 0.59% (but ChatGPT drives 87.4% of AI referral traffic)

### Tactical Implementation for WordPress

**Structured Data (Schema)**
- `EducationalOrganization` on homepage
- `EducationalOccupationalProgram` or `Course` on program pages (name, cost, duration, outcomes)
- `FAQPage` on admissions, financial aid, student life pages (highest citation probability)
- `Event` for open houses, info sessions
- `Article/BlogPosting` on news content
- WordPress plugins: Rank Math or Yoast SEO Pro handle auto-generation

**Content Architecture**
- Each program page must be "the ultimate answer" — include: enrollment numbers, graduation/retention rates with specific percentages, employment outcomes with avg. salaries, tuition per credit hour, student-faculty ratio, rankings/accreditations, named student testimonials with career outcomes
- FAQ sections on every key page mirroring actual prospective student questions
- Internal linking with descriptive anchor text
- Canonical fact pages for tuition, deadlines, requirements (reduces conflicting AI responses)

**llms.txt Protocol**
- Place `/llms.txt` (Markdown) at domain root listing key institutional pages
- Low-effort, signals technical sophistication
- Adoption is minimal (~951 domains as of mid-2025), no LLM company has officially confirmed they honor it
- Still worth implementing: 1-2 hours of work, demonstrates forward-thinking
- Holy Family file would list: program pages, admissions, financial aid facts, tuition, deadlines

**Monitoring**
- Profound (enterprise, $96M Series C, $1B valuation) tracks AI visibility across 9 platforms
- Otterly.ai or manual prompt testing as free alternatives
- Update high-priority pages monthly (recency boosts citations)

### ADA/Legal Urgency Play
**The ADA Title II WCAG 2.1 AA compliance deadline was April 24, 2026.** That deadline has passed. Any university that hasn't started compliance work is already exposed. Frame the website redesign as the compliance solution in the proposal.

---

## 7. WCAG 2.2 AA — What's New and How to Build It In

### 6 New Success Criteria vs. WCAG 2.1

**New AA criteria (what you must implement):**
1. **2.4.11 Focus Not Obscured:** Keyboard focus not hidden by sticky headers or modals
2. **2.5.7 Dragging Movements:** Any drag interaction must have a click/tap alternative
3. **2.5.8 Target Size Minimum:** Interactive elements must be at least 24×24 CSS pixels
4. **3.3.8 Accessible Authentication:** Login cannot require cognitive tests (CAPTCHA); allow password managers and copy-paste

**New A criteria (also required):**
5. **3.2.6 Consistent Help:** Help links appear in same location across pages
6. **3.3.7 Redundant Entry:** Auto-populate data already entered (don't make users retype)

**Removed from 2.2:**
- 4.1.1 Parsing (obsolete; modern browsers handle malformed HTML consistently)

### Most Commonly Failed on University Sites
- Missing alt text (1.1.1)
- Poor color contrast (1.4.3) — especially in branded color palettes
- Keyboard navigation failures (2.1.1) — especially in LMS, application forms, maps
- Missing video captions (1.2.2) — campus tour videos, lecture recordings, event streams
- Inaccessible PDFs (1.3.1) — years of legacy documents
- Form labeling failures (3.3.2) — admissions forms, financial aid calculators

### Testing Tool Stack

| Tool | WCAG 2.2 Support | Use For | Cost |
|---|---|---|---|
| **axe-core / axe DevTools** (Deque) | Yes, AA | Developer CI pipeline, zero false positives | Free (core) / $40+/mo |
| **WAVE** (WebAIM) | Yes, AA | Content editor training, visual overlay | Free |
| **Siteimprove** | Yes, AAA | HFU already uses this — continuous monitoring, issue assignment | Enterprise (they have it) |
| **Lighthouse** | Partial (2.1) | Quick spot checks in Chrome DevTools | Free |

**Critical:** No automated tool catches more than 30-40% of all WCAG violations. Manual keyboard navigation + screen reader testing (NVDA, JAWS, VoiceOver) is required for the rest.

### "Shift Left" Development Process (Proposal Differentiator)
- **Design phase:** Accessible color palettes (4.5:1 contrast), 24px touch targets in wireframes, focus states designed for every interactive element, logical heading hierarchy in content models
- **Development phase:** Accessible component library with ARIA built in, semantic HTML by default, automated axe-core linting in IDE and CI pipeline
- **Content phase:** WYSIWYG editor guardrails — alt text required, heading level enforcement, accessible PDF templates
- **QA phase:** Automated CI testing + manual screen reader testing on key user flows
- **Post-launch:** Continuous monitoring via Siteimprove (they already use it), quarterly audits

### Accessibility Audit Deliverable Structure
1. Executive Summary (conformance level, critical count, risk)
2. Scope & Methodology (pages tested, tools, standards)
3. Conformance Matrix (pass/fail/partial by criterion)
4. Detailed Findings (per issue: WCAG reference, severity, screenshot, remediation)
5. Severity/Impact Matrix
6. Remediation Roadmap (quick wins vs. structural changes)
7. VPAT/ACR (required by many university procurement processes)
8. Accessibility Statement Template

### Legal Context
- **ADA Title II Final Rule (April 2024):** Public universities must comply with WCAG 2.1 AA by April 24, 2026 (just passed)
- **Section 504 + Section 508:** Apply to Holy Family as a federal-funds recipient; covers all public-facing digital content
- **Building to WCAG 2.2 AA** exceeds the legal floor, provides compliance margin, and is backward-compatible with 2.1
- PDF legacy remediation is a separate, ongoing project — scope it as a post-launch phase

---

## 8. Competitor Intel: Pricing + Proposal Patterns

### Competitive Pricing Landscape

| Agency | Hourly Rate | Deal Range for HFU | CMS Strength | Key Vulnerability |
|---|---|---|---|---|
| **OHO Interactive** | $150-199/hr | $250K-$450K+ | CMS-agnostic (leans Drupal) | Overpriced for a 3,700-student school; built for Ivy League budgets |
| **Promet Source** | $100-149/hr | $175K-$350K | Drupal only (Provus EDU) | **Will fight the WordPress decision** |
| **Kanopi Studios** | $150-199/hr | $200K-$400K | WordPress + Drupal | Continuous improvement model = lock-in; spread across too many verticals |
| **Electric Citizen** | $101-150/hr | $150K-$275K | Drupal only | Small team, Drupal shop, no Catholic HE experience, Minneapolis |
| **Your shop** | TBD | $225K-$350K | WordPress | — |

**Deal range estimate for this project: $225K-$375K** (1,300-page Drupal → WP migration + full redesign + migration + training + 90-day support)

### Your Structural Advantages

1. **Promet and Electric Citizen are Drupal agencies.** If the RFP specifies WordPress (it does: "We have a preference for WordPress"), these two will either push back on CMS or be working outside their expertise. This is a hard structural disadvantage for them — use it.

2. **OHO is built for the Ivy League.** A ~3,700-student private Catholic university may feel like a mid-tier account at a 100+ person shop. Smaller clients get junior teams.

3. **Kanopi sells dependency.** Their "continuous improvement" model is designed for indefinite retainers. Pitch self-sufficiency and knowledge transfer as the counter.

4. **Catholic university positioning is unclaimed.** None of the four competitors appear to have meaningful private Catholic higher ed experience. Mission integration, campus ministry content, faith-based messaging coexisting with academic rigor — frame this explicitly.

### Competitive Positioning Lines

**Against Promet:** "Your RFP specifies WordPress. We're WordPress specialists. Other respondents may try to redirect you to a different platform. We'll build what you asked for and train your team to own it independently."

**Against OHO:** "You don't need a 100-person agency built for the Ivy League. Your project will be a priority for us, not a mid-tier account subsidizing larger engagements."

**Against Kanopi:** "Kanopi's continuous improvement model is designed to keep you dependent on an agency. Our knowledge transfer plan ensures your team runs the site without calling us for routine changes. You'll own this."

**Against Electric Citizen:** "A 1,300-page migration requires a team with real capacity and deep private Catholic university experience. We bring both."

### What Winning Proposals Include

Based on cross-referencing OHO, Kanopi, Opus Design, Carnegie, iFactory — these are the differentiators between winning and losing proposals:

1. **Content governance plan** — Who owns what content, approval workflows, how to prevent 1,300 pages from becoming 2,600 pages. This is the #1 cited differentiator.
2. **Transparent line-item pricing** — Phases with clear deliverables per phase. Lump sums lose.
3. **Knowledge transfer curriculum** — Not "we'll train your team." Name the sessions, attendees, outcomes, and what they can do independently post-launch.
4. **Content migration decision tree** — What gets migrated as-is, rewritten, archived, consolidated. Show the methodology.
5. **Post-launch roadmap** — 6-12 month optimization plan based on real user data. Not just "we offer retainers."
6. **Success metrics tied to enrollment goals** — Application starts, RFI conversion, program page engagement. Not vanity metrics.
7. **Stakeholder management plan** — Name how input is gathered from 20+ content owners, conflicts resolved, decisions made.
8. **Accessibility compliance plan** — WCAG 2.2 AA specifics, not just a checkbox.

---

## Quick Reference: Add-On Pricing for Proposal Section E

| Add-On | Your Setup Fee | Annual Platform Cost | Total Yr 1 |
|---|---|---|---|
| **AI Chatbot (Gravyty)** | $8K-$15K | $15K-$25K/yr | $23K-$40K |
| **AI Search – Good (Algolia)** | $3K-$5K | $840-$4,020/yr | $4K-$9K |
| **AI Search – Better (SearchStax)** | $5K-$8K | $6K-$10K/yr | $11K-$18K |
| **Personalization – Basic** | Included in base | $139-$199/yr (plugin) | ~$0 add-on |
| **Personalization – Intermediate (Halda)** | $15K-$25K | $15K-$40K/yr | $30K-$65K |
| **Extended Post-Launch Support** | — | $2K-$4K/mo retainer | $24K-$48K/yr |
| **Content Writing Services** | — | $150-$250/page | Varies by scope |

---

## Summary: What Makes This Proposal Bulletproof

1. **CMS choice defended:** Traditional WordPress (not headless) with ACF + REST API for future-proofing. Drupal competitors can't match this on WordPress.

2. **Migration methodology is concrete:** FG Drupal Premium + WP All Import + AI-assisted content QA + semantic redirect mapping. Not vague.

3. **Slate integration is specific:** Gravity Forms webhook pattern, Ping script site-wide, web service for dynamic content — NC State has done this, it works.

4. **Content consolidation play:** Reduce 1,601 pages to ~1,200 active pages through audit + archival. Saves migration cost, improves UX, shows strategic thinking.

5. **Legal urgency is live:** ADA Title II WCAG 2.1 AA deadline just passed April 24. Holy Family is exposed. The website redesign resolves this.

6. **All add-ons are priced with ranges:** Chatbot, AI search (3 tiers), personalization (3 tiers), extended support. Rick Mitchell will appreciate the specificity.

7. **Competitor vulnerabilities identified:** Promet and Electric Citizen are Drupal shops, structurally disadvantaged on a WordPress RFP. Use it.

8. **Catholic institution positioning is unclaimed:** Mission-aligned, ministry-aware, private Catholic university experience = differentiation none of the named competitors can match.

9. **Knowledge transfer is the winning bet:** Rick Mitchell's team of 1-2 people will maintain this site for 5 years. Every other agency sells ongoing dependency. You sell self-sufficiency.
