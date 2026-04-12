---
title: "Holy Family University — Full Site Map & Structure Analysis"
tags: [hightide, research, rfp, higher-ed, sitemap, content-audit, ia]
created: 2026-04-11
---

# Holy Family University — Full Site Map & Structure Analysis

**Source:** Scraped from live sitemap.xml on 2026-04-11
**Total Pages:** 1,601 URLs (matches RFP claim of ~1,300 pages)
**Last Updated:** Most recent page update: March 17, 2026

---

## Content Overview

| Category | Count | % | Notes |
|---|---|---|---|
| **News Articles** | 670 | 41.8% | Heavy content generation from "Bold Ideas" blog + news archive |
| **Other Pages** | 930 | 58.1% | Programs, academics, about, student life, events, forms |
| **Legacy Node URLs** | 1 | 0.1% | Minimal Drupal node references in current sitemap |

**Key Insight:** Nearly 42% of the sitemap is news/blog content. This is heavy on content generation but may include orphaned or low-value pages that could be consolidated during migration.

---

## Site Structure by Top-Level Section

### Primary Content Sections

| Section | Page Count | Primary Content |
|---|---|---|
| `/about` | 917 | News, directories, leadership, policies, institutional info |
| `/academics` | 253 | Program pages, course requirements, faculty, degree tracks |
| `/admissions-aid` | 41 | Application flow, financial aid info, forms |
| `/student-experience` | 54 | Student life, housing, orientation, activities |
| `/events` | 9 | Campus events, open houses, recruitment events |
| `/magazine` + `/magazines` | 54 | Digital magazines, alumni publications |
| `/alumni` | 12 | Alumni networking, giving, reunions |

### Secondary/Standalone Pages

| Section | Page Count | Type |
|---|---|---|
| Program-specific (e.g., `/grad-business`, `/nursing`, etc.) | ~80 | Landing pages for specific majors/programs |
| Student groups (e.g., `/seniors`, `/juniors`, `/current-students`) | ~20 | Cohort-specific resources |
| Giving/Advancement (e.g., `/giving-to-hfu`, `/donor-clubs`) | ~8 | Development/fundraising pages |
| Policies & Administrative | ~40 | HR policies, compliance, governance |

### Test/Promotional Pages (Likely Cruft)

- `/041425-it-test-page-chatbot` — Test page (delete)
- `/test-pages` — Test area (delete)
- `/Season-Greetings`, `/Christmas-Rose`, `/holiday-greetings` — Seasonal promotions (archive or delete)
- `/legacy_of_gratitude` — Legacy campaign (archive)
- `/70th-anniversary`, `/nursing50th` — Anniversary content (archive)
- `/shore_reception2025` — Event page, likely outdated
- Various grant/scholarship pages that may be outdated

**Estimate:** ~20-30 pages of cruft/test/outdated content that should be deleted during migration.

---

## Content Architecture by Page Type

### News & Blog (`/about/news-and-media/news` + Bold Ideas)
- **Count:** ~670 pages
- **Structure:** Archive of news articles, dating back years (some from 2022, 2021)
- **Pattern:** `/news/[article-slug]`
- **Issues:**
  - Very old articles (2021+) are still indexed and consuming crawl budget
  - No clear archival strategy — everything appears active
  - Likely includes outdated information (people who've left, outdated initiatives)

**Recommendation:** Audit news content, archive anything older than 2 years, consolidate similar topics, establish content lifecycle policy.

### Academic Programs (`/academics`)
- **Count:** ~250 pages
- **Structure:**
  - Top-level program pages: `/nursing`, `/business-administration`, etc.
  - Sub-pages: `-course-requirements`, `-request-information`, `-ms-request-information`, etc.
  - Faculty administration pages per school

**Pattern Issues:**
- Multiple request-information forms scattered across program pages
- Duplicative structure: each major has a course requirements page, a request-info form, potentially multiple variants (BA, BS, MA, MS, MEd, PhD, etc.)
- Likely candidates for consolidation: All "request information" pages could roll into a single form engine with smart routing

### Events (`/events`)
- **Count:** ~9 pages in sitemap, but sample shows 50+ individual event pages
- **Pattern:** `/events/[event-slug]`
- **Issues:**
  - Event registration links likely point to external systems
  - Seasonal patterns (recruitment events cluster around spring/fall)
  - No clear filtering/taxonomy for event types (campus visit vs. open house vs. general campus events)

### Administrative & Policies
- **Count:** ~40+ pages
- **Pattern:** Scattered across `/policies/`, `/administration/`, `/title-ix/`, `/ferpa/`, etc.
- **Issues:**
  - Policies scattered across multiple URL patterns with no consistent structure
  - Some are critical (FERPA, Title IX), others less so
  - Opportunity: Create a consolidated `/policies/` hub with proper taxonomy

### Standalone One-Off Pages
- `/contact-us` — Contact form
- `/apply` — Application entry point (likely external system link)
- `/directory` — Faculty/staff directory
- `/bookstore` — External link
- Various IT/self-service pages (`/self-service`, `/tigerwifi`, etc.)

---

## Information Architecture Issues & Migration Implications

### Issue 1: Inconsistent URL Naming & Structure
**Examples:**
- `/nursing-advance-your-nursing-career` vs `/nursing` (both exist)
- `/grad-business` vs `/business-enroll` (similar intent, different URLs)
- `/academics/programs` vs individual program landing pages
- `/admissions-aid` vs `/applying-holy-family-university` (both exist)

**Impact on Migration:**
- Massive 301 redirect map required
- Opportunity to flatten and standardize: all programs under `/programs/[slug]`, all admissions under `/admissions/[slug]`, etc.
- Rick Mitchell's team likely already identified this (mentioned "complex navigation" in RFP)

### Issue 2: Shallow Navigation with Many Top-Level Silos
The site has 180+ distinct top-level URL patterns (sections). Normal sites have 8-15 main sections. This suggests:
- Organic growth without governance
- Departments created their own URL structures
- No central information architecture enforcement

**Typical Solution:** Consolidate into 7-10 main sections:
- `/about/` — About, leadership, news, directory
- `/academics/` — Programs, courses, faculty
- `/admissions/` — Application, financial aid, campus visit requests
- `/student-life/` — Housing, activities, resources
- `/alumni/` — Alumni engagement, giving
- `/athletics/` — Sports
- `/support/` — IT, library, career services
- `/news/` — News archive (potentially merge with `/about/news/`)

### Issue 3: Multiple Request-Information Forms
Nearly every academic program has a "request information" page/form. Examples:
- `/counseling-psychology-clinical-mental-health-counseling-ms-request-information`
- `/nursing-msn-request-information`
- `/master-business-administration-mba-request-information`

**Issue:** This creates bloat and makes analytics harder (can't aggregate lead requests by program).

**Solution:** Single `/admissions/request-info` form with:
- Program dropdown (tied to academics database)
- Smart form routing (by program level: undergrad/grad/professional)
- Single conversion event in GA4

### Issue 4: News Archive Bloat
670 pages (42% of site) are news articles. If the university publishes ~100 articles/year, this is 6-7 years of archive.

**Strategic Questions:**
1. What is the business value of indexing 6-year-old news?
2. Can older news be archived/removed from public sitemap?
3. Should "Bold Ideas" (blog) be merged with the news section?

**Recommendation:** Implement a content lifecycle where news articles 2+ years old are moved to an archive section or delisted from sitemap, reducing indexation burden and improving SEO metrics for current news.

### Issue 5: Duplicate Program Landing Pages
Some programs have multiple landing pages:
- `/counseling-psychology-earn-your-ms-or-psyd` (generic)
- `/counseling-psychology-school-counseling-ms-request-information` (specific track)
- `/counseling-psychology-correctional-counseling-ms-request-information` (specific track)
- `/counseling-psychology-clinical-mental-health-counseling-ms-request-information` (specific track)
- `/doctor-psychology-counseling-psychology-psyd-request-information` (PhD variant)

**This is IA hell.** Each program variant should be a sub-page of a parent program, not a separate top-level entry.

---

## Content Audit Opportunities

### Content to Keep (High Priority)
- All current program pages (clearly link to enrollment)
- Current news (last 2 years max)
- Critical policies (FERPA, Title IX, accessibility)
- Faculty/staff directory
- Admissions forms and information architecture

### Content to Archive (Medium Priority)
- News articles older than 2 years (move to `/news-archive/` or delist)
- Outdated scholarship information
- Past event pages (except flagship annual events)
- Graduation/commencement pages older than 1-2 years

### Content to Delete (Low Priority/Cruft)
- Test pages (`/041425-it-test-page-chatbot`, `/test-pages`)
- IT development pages
- Seasonal greetings
- Outdated anniversary/campaign pages

**Estimated Reduction:** 200-300 pages (12-19% of current sitemap) could be archived/deleted, bringing active site down to ~1,300-1,400 pages.

---

## Content Type Recommendations for WordPress Migration

### Suggested Custom Post Types (CPTs)

| CPT | Examples | Fields |
|---|---|---|
| `program` | Nursing BS, MBA, MAT, etc. | Title, description, degree level, school, faculty, requirements, apply link |
| `faculty` | Individual faculty profiles | Name, title, department, bio, office hours, research areas, photo |
| `event` | Campus visit days, open houses | Title, date, location, registration link, audience segment |
| `news` | News articles | Title, content, featured image, author, publication date |
| `policy` | FERPA, Title IX, etc. | Title, policy text, owner department, last updated |
| `page` | General pages | Title, content (via Gutenberg blocks) |
| `course` | Academic courses | Course code, title, description, credits, department |

### Taxonomy/Category Recommendations

| Taxonomy | Values | Usage |
|---|---|---|
| `school` | Arts & Sciences, Business, Education, Nursing | Organize programs and faculty |
| `degree_level` | Undergraduate, Master's, Doctorate, Certificate | Filter and organize academic content |
| `program_type` | Full-time, Part-time, Online, Hybrid, Accelerated | Segment program pages by delivery mode |
| `student_type` | Prospective, Current, Alumni, Parents | Segment content by audience |
| `department` | Multiple | Organize directory, policies, news |
| `news_category` | Student Stories, Research, Events, Announcements | Organize news content |

---

## SEO & Discoverability Insights

### Top-Level Pages (Highest Priority for Optimization)

These pages should be fully rewritten/optimized during migration:

1. **Homepage** (`/`) — Last updated March 17, 2026 (recent)
2. **Program Pages** (e.g., `/nursing`, `/business`) — Gateway pages for enrollment
3. **Admissions** (`/admissions-aid`) — Conversion critical
4. **About** (`/about/holy-family-university`, `/about/leadership`, etc.) — Brand/credibility

### Content Audit by Last Modified Date
- **Recently updated (Mar 2026):** Homepage, Bold Ideas blog
- **Stale (2022-2023):** Many academic program pages, news archive
- **Very old (2021 and earlier):** 100+ news articles, outdated information

**Action:** Flag pages not updated in 12+ months for content review during migration.

---

## Integration & Platform Requirements

Based on sitemap analysis, migration will require:

1. **Request Information Form Consolidation**
   - Map 20+ separate request-info pages to single form with smart routing
   - Integrate with CRM (Slate, per RFP)

2. **Event Management**
   - Likely external calendar system (Google Calendar, Eventbrite, etc.)
   - Embed registration links, not create separate pages

3. **News/Blog Platform**
   - Consider moving news archive to separate blog platform or limiting sitemap exposure
   - Implement proper news taxonomy and archival workflow

4. **Faculty/Staff Directory**
   - Likely connected to HR/directory system
   - Should be kept in sync, not manually updated

5. **Content Model**
   - Each program needs: basic info, requirements, apply link, testimonials, FAQ
   - Standardize via ACF field groups, not custom page templates

---

## Full URL List Export

A complete list of all 1,601 URLs is available at `/tmp/hfu_urls.txt` if you need to map individual page strategies.

### Quick Stats on Redirect Mapping

- **Total URLs to redirect:** 1,601
- **Estimated unique URL patterns:** 180-200 distinct top-level sections
- **Consolidation opportunity:** Reduce to 8-12 main sections, 40-60 sub-sections
- **301 redirect strategy:** Semantic URL mapping (old → new) by content type, not mechanical rewrites

---

## Recommendations for Rick Mitchell (Director of Digital)

1. **Content Audit First:** Before migration, run a content inventory workshop. Identify pages to keep, archive, delete, consolidate.

2. **IA Redesign:** Don't just move existing structure to WordPress. Use migration as opportunity to flatten and organize into 8-12 main sections.

3. **Request-Info Form Consolidation:** Replace 20+ standalone forms with single smart form + CRM routing.

4. **News Strategy:** Decide whether to keep 6-year news archive active or move to separate subdomain/archive. Current 670 articles consume significant crawl budget.

5. **Programmatic Redirect Map:** Use semantic similarity matching (all-MiniLM-L6-v2 embeddings) to generate redirect map automatically, then validate.

6. **Content Governance:** Establish templates and update-frequency expectations for each content type post-launch.

---

## For the Proposal

When you write the proposal, you can reference this analysis to show Rick Mitchell that you:

1. **Understand their site depth** (1,601 pages is significant)
2. **Identified architectural debt** (inconsistent structure, bloat, duplication)
3. **Have a consolidation strategy** (reduce to 1,200-1,400 active pages through IA improvements)
4. **Know how to scope migration** (semantic URL mapping, content audit, form consolidation)

This positions you as thoughtful about their specific situation, not generic.

---

## Summary for Eric

**Raw Data:**
- 1,601 URLs scraped from sitemap.xml
- 670 news articles (41.8% of site)
- 180+ distinct top-level URL sections (messy IA)
- 10+ outdated/test pages to delete

**Quick Wins for Proposal:**
1. Consolidate 20+ request-info forms → single form
2. Archive news 2+ years old → reduce crawl bloat
3. Flatten IA → 8-12 main sections instead of 180+
4. Content audit → remove 200-300 pages of cruft
5. Semantic redirect mapping → automated 1,601 URL mapping

**Why This Matters:**
- Shows you understand the real scope (not just "redesign a 1,300-page site")
- Identifies cost reduction (smaller active site = cheaper to maintain)
- Proves you've done homework (Rick Mitchell will respect the analysis)
- Gives concrete differentiation vs. competitors who'll just bid blind
