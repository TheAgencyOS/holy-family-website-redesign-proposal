---
title: "Holy Family University — WordPress Build Architecture & Content Creation System"
tags: [hightide, research, rfp, higher-ed, wordpress, theme, plugins, content-authoring]
created: 2026-04-11
---

# WordPress Build Architecture & Content Creation System

**Goal:** Build a WordPress site that Rick Mitchell's 2-person team can operate, extend, and publish on daily — without calling an agency, writing code, or fighting the CMS.

---

## 1. Theme Architecture

### Custom Block Theme (Full Site Editing)

We build a **custom block theme** — not a child theme of a commercial theme, not a page builder theme. A purpose-built theme where every component is designed for Holy Family's content types, brand system, and editorial workflow.

**Why a block theme (not classic):**
- Full Site Editing (FSE) means headers, footers, and template parts are editable in the block editor — no PHP file editing for layout changes
- Block patterns (pre-built page sections) let editors assemble pages from approved components
- Template editing lets Rick's team create new page layouts without touching code
- This is the WordPress core direction — Classic themes are legacy

**Theme structure:**

```
hfu-theme/
├── assets/
│   ├── css/               # Compiled design tokens + utility styles
│   ├── fonts/             # Self-hosted brand fonts (performance)
│   ├── images/            # Theme assets (icons, logos, patterns)
│   └── js/                # Minimal — progressive enhancement only
├── parts/
│   ├── header.html        # Site header (editable in FSE)
│   ├── footer.html        # Site footer (editable in FSE)
│   ├── sidebar.html       # Optional sidebar
│   └── navigation.html    # Mega menu component
├── patterns/
│   ├── hero-program.php         # Program page hero
│   ├── hero-landing.php         # Campaign landing page hero
│   ├── cta-apply.php            # Apply Now call-to-action
│   ├── cta-request-info.php     # Request Info call-to-action
│   ├── stats-row.php            # Statistics display (93% employment, etc.)
│   ├── testimonial-card.php     # Student/alumni testimonial
│   ├── faculty-grid.php         # Faculty listing by department
│   ├── program-cards.php        # Program listing cards
│   ├── accordion-faq.php        # FAQ accordion (Schema-ready)
│   ├── event-listing.php        # Upcoming events feed
│   ├── news-feed.php            # Latest news cards
│   ├── video-embed.php          # Wistia/YouTube responsive embed
│   ├── image-gallery.php        # Accessible image gallery
│   ├── two-column-text.php      # Two-column content layout
│   ├── full-width-image.php     # Full-bleed image with caption
│   └── contact-form.php         # Gravity Form embed pattern
├── templates/
│   ├── index.html               # Default archive
│   ├── single.html              # Default single post
│   ├── single-program.html      # Program detail page
│   ├── single-faculty.html      # Faculty profile page
│   ├── single-event.html        # Event detail page
│   ├── page.html                # Default page
│   ├── page-admissions.html     # Admissions landing
│   ├── page-landing.html        # Campaign landing page
│   ├── archive.html             # News/blog archive
│   ├── archive-program.html     # Program directory
│   ├── archive-faculty.html     # Faculty directory
│   ├── archive-event.html       # Events listing
│   ├── search.html              # Search results
│   ├── 404.html                 # 404 page
│   └── home.html                # Homepage
├── functions.php          # CPT registration, ACF config, enqueues
├── theme.json             # Design tokens (colors, fonts, spacing, sizes)
└── style.css              # Theme metadata
```

### theme.json — The Design System in One File

`theme.json` is the single source of truth for every visual decision. When an editor opens the block editor, they can only choose from approved options:

```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "hfu-purple", "color": "#4B0082", "name": "HFU Purple" },
        { "slug": "hfu-gold", "color": "#FFD700", "name": "HFU Gold" },
        { "slug": "hfu-dark", "color": "#1A1A2E", "name": "Dark" },
        { "slug": "hfu-light", "color": "#F8F8F8", "name": "Light" },
        { "slug": "hfu-white", "color": "#FFFFFF", "name": "White" },
        { "slug": "hfu-accent", "color": "#2D6A4F", "name": "Accent Green" }
      ],
      "custom": false,
      "defaultPalette": false
    },
    "typography": {
      "fontFamilies": [
        { "slug": "heading", "fontFamily": "...brand heading font..." },
        { "slug": "body", "fontFamily": "...brand body font..." }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem", "name": "Small" },
        { "slug": "medium", "size": "1rem", "name": "Body" },
        { "slug": "large", "size": "1.25rem", "name": "Large" },
        { "slug": "x-large", "size": "1.5rem", "name": "X-Large" },
        { "slug": "xx-large", "size": "2.25rem", "name": "Heading" }
      ],
      "customFontSize": false
    },
    "spacing": {
      "spacingSizes": [
        { "slug": "10", "size": "0.5rem", "name": "XS" },
        { "slug": "20", "size": "1rem", "name": "S" },
        { "slug": "30", "size": "1.5rem", "name": "M" },
        { "slug": "40", "size": "2rem", "name": "L" },
        { "slug": "50", "size": "3rem", "name": "XL" },
        { "slug": "60", "size": "4rem", "name": "XXL" }
      ],
      "customSpacingSize": false
    },
    "layout": {
      "contentSize": "800px",
      "wideSize": "1200px"
    }
  }
}
```

**What this does for editors:** They cannot pick random colors, fonts, or spacing. Every choice in the editor toolbar maps to the approved brand system. The site stays consistent even when 15 different department content owners are publishing.

---

## 2. Plugin Stack

Every plugin earns its place. No bloat, no redundancy, no "nice to have."

### Core Plugins (Required)

| Plugin | Purpose | Why This One | Annual Cost |
|---|---|---|---|
| **Advanced Custom Fields (ACF) Pro** | Content modeling — custom fields for Programs, Faculty, Events | Industry standard, REST API support, huge community, Rick likely already knows it | ~$49/yr |
| **Gravity Forms + Webhooks Add-On** | Forms + Slate CRM integration | Best WordPress form builder, webhook pattern for Slate is proven (NC State), conditional logic, WCAG compliant | ~$259/yr |
| **Rank Math Pro** | SEO + structured data (Schema.org) | Auto-generates EducationalOrganization, FAQ, Event, Article schema; better UX than Yoast; built-in redirect manager | ~$59/yr |
| **Safe SVG** | Allow SVG uploads (icons, logos) | WordPress blocks SVGs by default; this sanitizes them securely | Free |
| **Redirection** | 301 redirect manager | Manages the 1,601-URL redirect map; logs 404s for monitoring; import/export CSV | Free |
| **WP Migrate DB Pro** | Database migration between environments | Pantheon Dev/Test/Live workflow; find-and-replace URLs on migration | ~$249/yr |

### Content Authoring Plugins (Editor Experience)

| Plugin | Purpose | Why This One | Annual Cost |
|---|---|---|---|
| **Block Visibility** | Show/hide blocks by user role, device, date, URL parameter | Powers basic personalization (show different content to mobile vs desktop, show seasonal CTAs) | Free |
| **If-So Dynamic Content** | Geo-targeting, UTM-based content, returning visitor logic | In-state vs out-of-state messaging, campaign-specific heroes; no code required | ~$139-199/yr |
| **Icon Block** | Insert SVG icons from the block editor | Editors can add icons to buttons, cards, lists without uploading files | Free |
| **Table of Contents Block** | Auto-generate anchor-linked TOC | For long program pages, policy pages, FAQ pages — accessibility + UX | Free |

### Performance & Security Plugins

| Plugin | Purpose | Why This One | Annual Cost |
|---|---|---|---|
| **Pantheon Advanced Page Cache** | Granular cache purging on Pantheon | Pantheon-native; auto-purges only changed content, not entire cache | Free (Pantheon) |
| **Pantheon HUD** | Shows cache status in admin bar | Developers can see if pages are cached, diagnose performance issues | Free (Pantheon) |
| **WP Crontrol** | View and manage WP-Cron events | Debug scheduled tasks, form webhooks, cache jobs | Free |
| **Wordfence** or **Pantheon Security** | Firewall, login protection, malware scanning | Defense in depth on top of Pantheon's read-only filesystem | Free tier sufficient |

### Accessibility Plugins

| Plugin | Purpose | Annual Cost |
|---|---|---|
| **WP Accessibility** | Adds skip links, fixes common a11y issues, toolbar for font sizing | Free |
| **Flavor** (or Flavored) | Alt text enforcement — blocks image publish without alt text | Free |

### NOT Using (And Why)

| Plugin/Tool | Why We Skip It |
|---|---|
| **Elementor / Divi / WPBakery** | Page builders add 500KB+ of CSS/JS, create vendor lock-in, produce div-soup HTML that fails accessibility audits. Block editor does everything we need natively. |
| **Yoast SEO** | Rank Math Pro has better UX, more features at lower price, built-in schema types for education |
| **WooCommerce** | No e-commerce on this site |
| **WPML/Polylang** | English-only site per RFP; Google Translate widget handles translation need |
| **Custom CAPTCHA plugins** | WCAG 2.2 prohibits cognitive tests; we use honeypot + reCAPTCHA v3 (score-based, invisible) |
| **Slider/carousel plugins** | Carousels hurt conversion and accessibility; we use static heroes with clear CTAs |

**Total annual plugin cost: ~$755-955/yr** — less than a single hour of agency time.

---

## 3. Custom Post Types & Content Models

### Program (CPT: `program`)

The most important content type on the site. Every program page is the "definitive answer" for that program.

| Field | Type | Required | Notes |
|---|---|---|---|
| Title | Native WP title | Yes | e.g., "Bachelor of Science in Nursing" |
| Slug | Native WP slug | Yes | e.g., `nursing-bsn` |
| Program Description | WYSIWYG (block editor) | Yes | Main content area |
| Degree Level | Select (Undergraduate, Master's, Doctorate, Certificate) | Yes | Taxonomy: `degree_level` |
| School | Select (Arts & Sciences, Business, Education, Nursing) | Yes | Taxonomy: `school` |
| Department | Text or taxonomy | Yes | |
| Delivery Format | Checkbox (On-campus, Online, Hybrid, Accelerated) | Yes | |
| Credit Hours | Number | Yes | |
| Tuition Per Credit | Number | No | For AI citation |
| Duration | Text | No | e.g., "4 years full-time" |
| Student-Faculty Ratio | Text | No | |
| Employment Rate | Text | No | e.g., "93% within 6 months" |
| Average Salary | Text | No | Post-graduation |
| Accreditation | Textarea | No | |
| Admission Requirements | WYSIWYG | Yes | |
| Curriculum/Course List | Repeater field | No | Course name + credits |
| Related Faculty | Relationship (→ Faculty CPT) | No | Auto-displays on page |
| Featured Image | Image | Yes | Hero/OG image |
| CTA Button Text | Text | No | Default: "Request Info" |
| CTA Button URL | URL | No | Default: `/admissions/request-info/?program={slug}` |
| Testimonial | Relationship (→ Testimonial or inline) | No | Named student + outcome |
| FAQ | Repeater (Question + Answer) | No | Auto-generates FAQPage schema |
| SEO Override | Rank Math fields | No | Auto-generated if blank |

**What the editor sees:** A clean form with labeled fields. Fill in the fields, hit publish. The template handles layout, schema markup, related faculty, CTAs — everything. No design decisions required.

### Faculty (CPT: `faculty`)

| Field | Type | Required |
|---|---|---|
| Name | Title | Yes |
| Title/Position | Text | Yes |
| Department | Taxonomy | Yes |
| School | Taxonomy | Yes |
| Bio | WYSIWYG | Yes |
| Headshot | Image | Yes |
| Email | Email | Yes |
| Phone | Text | No |
| Office Location | Text | No |
| Office Hours | Text | No |
| Research Areas | Textarea | No |
| Publications | Repeater | No |
| Related Programs | Relationship (→ Program) | No |
| Degree/Education | Repeater | No |

### Event (CPT: `event`)

| Field | Type | Required |
|---|---|---|
| Title | Title | Yes |
| Date/Time Start | DateTime | Yes |
| Date/Time End | DateTime | No |
| Location | Text | Yes |
| Event Type | Select (Open House, Info Session, Campus Visit, General) | Yes |
| Audience | Checkbox (Prospective, Current, Alumni, Community) | Yes |
| Description | WYSIWYG | Yes |
| Registration URL | URL | No |
| Featured Image | Image | No |

### News (Native `post` type)

Uses standard WordPress posts with enhanced categories:

| Taxonomy | Values |
|---|---|
| `news_category` | Student Stories, Research, Announcements, Athletics, Campus Life, Awards |
| `department` | Shared with Programs and Faculty |
| `school` | Shared with Programs and Faculty |

### Page (Native `page` type)

General pages use the block editor with pre-built patterns. No custom fields needed — the block pattern library handles all layout needs.

---

## 4. Block Patterns — The Content Creation Toolkit

Block patterns are the key to making content creation dead simple. They are pre-built page sections that editors insert with one click, then fill with their content.

### Pattern Library (40-50 patterns organized by category)

**Heroes (5 patterns)**
| Pattern | Use Case |
|---|---|
| Hero — Full Width Image + Text Overlay | Homepage, major landing pages |
| Hero — Split (Image Left, Text Right) | Program pages, about pages |
| Hero — Gradient + Headline | Campaign landing pages |
| Hero — Video Background | Admissions, campus life |
| Hero — Minimal (Text Only) | Policy pages, simple content |

**Calls to Action (6 patterns)**
| Pattern | Use Case |
|---|---|
| CTA — Apply Now (Purple) | Bottom of program pages |
| CTA — Request Info (Gold) | Sidebar or inline on program pages |
| CTA — Visit Campus | Admissions pages |
| CTA — Two Button (Apply + Request Info) | Program pages, homepage |
| CTA — Newsletter Signup | News pages, blog |
| CTA — Banner (Full Width) | Between content sections |

**Content Blocks (12 patterns)**
| Pattern | Use Case |
|---|---|
| Text + Image (Left) | General content |
| Text + Image (Right) | General content |
| Stats Row (3-4 statistics) | Program outcomes, about page |
| Testimonial — Single Quote | Program pages |
| Testimonial — Carousel (3 cards) | Homepage, admissions |
| FAQ Accordion | Admissions, financial aid, programs |
| Two Column Text | Comparison content, side-by-side info |
| Three Column Cards | Feature highlights, program tracks |
| Icon + Text Grid (4-6 items) | "Why Holy Family" sections |
| Timeline / Steps | Application process, program milestones |
| Tabbed Content | Program tracks (BS/MS/PhD on one page) |
| Alert / Notice Banner | Deadlines, urgent announcements |

**Media (5 patterns)**
| Pattern | Use Case |
|---|---|
| Video Embed (Wistia/YouTube) | Campus tours, program spotlights |
| Image Gallery (Grid) | Campus life, events |
| Full-Width Image + Caption | Visual storytelling |
| Photo + Pull Quote | Feature stories |
| Embedded Map | Campus locations |

**Listings (6 patterns)**
| Pattern | Use Case |
|---|---|
| Program Cards (Filterable Grid) | Program directory |
| Faculty Grid | Department pages |
| Event Listing (Upcoming) | Homepage, events page |
| News Feed (Latest 3-6) | Homepage, department pages |
| Related Programs | Sidebar or bottom of program pages |
| Staff Directory Row | Administrative pages |

**Forms (3 patterns)**
| Pattern | Use Case |
|---|---|
| Gravity Form — Full Width | Standalone form pages |
| Gravity Form — Sidebar | Contact forms within content |
| Gravity Form — Modal (Button Trigger) | "Request Info" popup on program pages |

**Layout (5 patterns)**
| Pattern | Use Case |
|---|---|
| Page Header (Title + Breadcrumb) | All interior pages |
| Section Divider (with optional heading) | Between content sections |
| Sidebar Layout (Content + Sidebar) | News articles, policies |
| Full-Width Section (Colored Background) | Breaking up long pages |
| Footer CTA Strip | Pre-footer conversion zone |

### How an Editor Creates a New Program Page

1. Go to **Programs → Add New** in WordPress admin
2. Fill in the structured fields (title, school, degree level, credits, etc.)
3. In the main content area, click the **"+"** button
4. Choose from pattern categories: **"HFU Heroes"** → select **"Hero — Split"**
5. Replace placeholder image and text with program content
6. Add more patterns: **Stats Row**, **FAQ Accordion**, **Testimonial**, **CTA — Apply Now**
7. Hit **Publish**

The page automatically:
- Generates the correct URL (`/programs/nursing-bsn/`)
- Applies the `single-program.html` template
- Pulls in related faculty from the Relationship field
- Generates Schema.org `EducationalOccupationalProgram` markup
- Creates the meta title and description via Rank Math
- Displays the program in the filterable Program Directory

**Time to create a new program page: 15-20 minutes.** No design decisions. No code. No agency call.

---

## 5. Editorial Guardrails — Preventing Drift

The biggest risk to a university website isn't the launch — it's year 3, when 15 different departments have published 400 new pages with no consistency. We prevent that structurally:

### What Editors CAN Do
- Create/edit content using approved block patterns
- Upload images (with required alt text)
- Choose from the approved color palette
- Select from approved font sizes
- Insert forms from the Gravity Forms library
- Schedule content for future publication
- Submit content for review (if role = Author/Contributor)

### What Editors CANNOT Do
- Pick arbitrary colors (theme.json locks the palette)
- Use arbitrary fonts or sizes (theme.json locks typography)
- Add arbitrary spacing (theme.json locks spacing scale)
- Skip alt text on images (plugin enforces)
- Skip heading levels (H2 → H4 blocked)
- Install plugins (role-based permissions)
- Edit theme files (Pantheon read-only filesystem in production)
- Add raw HTML/CSS/JS blocks (disabled for Editor role)

### Content Workflow

| Role | Can Do | Cannot Do |
|---|---|---|
| **Administrator** (Rick + IT) | Everything | — |
| **Editor** (Marketing team) | Create, edit, publish all content; manage media; manage categories | Install plugins, edit theme, manage users |
| **Author** (Department liaisons) | Create and publish own posts/pages | Edit others' content, delete published content |
| **Contributor** (Occasional contributors) | Draft content, submit for review | Publish, upload media |

### Content Lifecycle Rules (Enforced in Training + Governance Doc)

| Content Type | Review Cadence | Archive Trigger |
|---|---|---|
| Program pages | Every semester | Program discontinued or merged |
| Faculty profiles | Annually | Faculty departs |
| News articles | — | Auto-archive from sitemap after 2 years |
| Events | — | Auto-expire after event date passes |
| Policies | Annually | Policy superseded |
| Landing pages | Quarterly | Campaign ends |

---

## 6. Template Hierarchy — What Renders What

| URL Pattern | Template | Content Source |
|---|---|---|
| `/` | `home.html` | Block patterns + dynamic queries |
| `/programs/` | `archive-program.html` | All published Programs, filterable by school/level |
| `/programs/nursing-bsn/` | `single-program.html` | Program CPT fields + block content |
| `/directory/` | `archive-faculty.html` | All Faculty, filterable by school/department |
| `/directory/jane-smith/` | `single-faculty.html` | Faculty CPT fields |
| `/events/` | `archive-event.html` | Upcoming events, sorted by date |
| `/events/open-house-fall-2026/` | `single-event.html` | Event CPT fields |
| `/news/` | `archive.html` | Latest posts, paginated |
| `/news/article-slug/` | `single.html` | Post content |
| `/admissions/` | `page-admissions.html` | Block patterns |
| `/admissions/request-info/` | `page.html` | Gravity Form pattern |
| `/about/*` | `page.html` | Block patterns |
| `/search/` | `search.html` | Search results |
| `/*` (404) | `404.html` | Helpful links + search |

---

## 7. Performance Budget

Every architectural decision serves this budget:

| Metric | Target | How We Hit It |
|---|---|---|
| **Total page weight** | < 1.5 MB | No page builder bloat, WebP images, lazy loading |
| **LCP** | < 2.5s | Critical CSS inlined, hero image preloaded, Pantheon CDN |
| **CLS** | < 0.1 | Explicit image dimensions, font-display swap, stable layouts |
| **FID/INP** | < 100ms | Minimal JS, deferred non-critical scripts, no render-blocking |
| **TTFB** | < 600ms | Pantheon edge cache, Redis object cache |
| **Lighthouse Performance** | > 90 | Enforced in CI — PRs that drop below threshold cannot merge |
| **Lighthouse Accessibility** | > 95 | axe-core in CI pipeline |

**What we don't ship:**
- jQuery (not needed with block theme)
- Font Awesome (use inline SVGs)
- Animate.css or heavy animation libraries
- Third-party scripts outside GTM (everything goes through Tag Manager)
- Unused CSS from page builders we're not using

---

## 8. The Editor Experience — Day in the Life

### Scenario: Marketing needs a new landing page for a Spring Open House campaign

**Time: 20 minutes. No developer needed.**

1. **New Page** → Title: "Spring Open House 2027"
2. **Insert Pattern** → "Hero — Full Width Image" → upload event photo, write headline
3. **Insert Pattern** → "Stats Row" → fill in: "30+ Programs | 93% Employment Rate | $X Tuition"
4. **Insert Pattern** → "Two Column Text" → left: event details, right: campus map embed
5. **Insert Pattern** → "Gravity Form — Full Width" → select "Event Registration" form
6. **Insert Pattern** → "Testimonial — Single Quote" → select existing student testimonial
7. **Insert Pattern** → "CTA — Two Button" → "Apply Now" + "Request Info"
8. **SEO sidebar** → Rank Math auto-generated title/description, tweak if needed
9. **If-So block** → Show different hero text for visitors from paid search vs organic
10. **Publish** → page goes live at `/events/spring-open-house-2027/`

### Scenario: Rick needs to add a new academic program

**Time: 15 minutes.**

1. **Programs → Add New** → Title: "Master of Science in Cybersecurity"
2. Fill structured fields: School = Business & Technology, Level = Master's, Format = Hybrid, Credits = 36
3. Add admission requirements, curriculum, outcomes data in the field groups
4. Select related faculty from the Faculty CPT relationship field
5. Add FAQ items (auto-generates Schema)
6. **Publish** → page appears at `/programs/cybersecurity-ms/`, auto-listed in Program Directory, Schema markup generated, Rank Math handles SEO

### Scenario: Department liaison needs to update a faculty profile

**Time: 5 minutes.**

1. **Faculty → Edit** → find the profile
2. Update bio, add new publication to repeater field
3. **Update** → changes live immediately

---

## 9. What This Means for the Proposal

### Key Messages for Rick Mitchell (Technical)
- Block theme, not page builder — clean HTML, fast, accessible, no vendor lock-in
- ACF Pro for structured content — he likely already knows it
- Component library in code mirrors Figma — what designers design is what editors get
- theme.json enforces brand consistency without policing
- Git-based workflow on Pantheon — he can review every commit

### Key Messages for Katherine Primus (Marketing)
- 20-minute page creation for campaigns — no developer bottleneck
- Personalization built in (geo-targeting, UTM-aware content) at no extra cost
- Every program page is an enrollment machine (structured data, CTAs, outcomes)
- Analytics baked in — every form, CTA, and page view tracked

### Key Messages for Mark Green (IT/Technology)
- < $1,000/yr in plugin licensing
- Pantheon handles infrastructure, security, backups, SSL
- Read-only production filesystem — entire class of attacks eliminated
- WordPress Coding Standards enforced in CI pipeline
- No custom frameworks to maintain — all standard WordPress patterns

---

## 10. Plugin + Theme Cost Summary

| Item | Annual Cost |
|---|---|
| ACF Pro | $49 |
| Gravity Forms (Elite) | $259 |
| Rank Math Pro | $59 |
| If-So Dynamic Content | $139-199 |
| WP Migrate DB Pro | $249 |
| Safe SVG | Free |
| Redirection | Free |
| Block Visibility | Free |
| WP Accessibility | Free |
| Pantheon plugins | Free |
| **Total** | **$755-815/yr** |

Custom theme: included in project scope, owned by HFU forever.

No recurring agency dependency. No page builder license. No vendor lock-in.
