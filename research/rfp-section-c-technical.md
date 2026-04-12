---
title: "Holy Family University RFP — Section C: Technical Approach"
tags: [hightide, rfp, higher-ed, holy-family, proposal]
created: 2026-04-10
---

# Section C: Technical Approach

**Prepared for:** Holy Family University — Website Redesign RFP
**Prepared by:** [TODO: Company Name]
**Date:** April 10, 2026

---

## C.1 CMS Recommendation: WordPress

We recommend WordPress as the content management system for Holy Family University's redesigned website. Not headless WordPress. Not a decoupled architecture. Traditional, full-stack WordPress -- the same platform that powers 43% of the web and the majority of higher education institutions that have migrated away from Drupal in the past five years.

This recommendation is grounded in three factors specific to Holy Family's situation.

### Why WordPress Is the Right Fit for a 3,700-Student University

**1. Editorial usability for a small team.**
Rick Mitchell's team maintains the current site with one to two staff members. WordPress's native editing experience -- Gutenberg block editor, real-time preview, in-context editing, media library management -- is purpose-built for teams that need to publish and update content without developer intervention. Drupal's editorial tools have improved, but WordPress remains the benchmark for content author experience. When your web team is measured in single digits, the CMS must work for them, not against them.

**2. The plugin and developer ecosystem is unmatched.**
WordPress has the largest active developer community of any CMS. This matters for a practical reason: when Holy Family needs to hire a developer, find a freelancer for a specific integration, or troubleshoot an issue, WordPress talent is abundant and competitively priced. Drupal's talent pool is smaller and more expensive. Over a five-year ownership horizon, this difference compounds.

**3. Lower total cost of ownership.**
WordPress core is free. The premium tools required for this project -- ACF Pro, Gravity Forms, a managed hosting plan on Pantheon -- total under $1,000 per year in licensing costs. Drupal's module ecosystem is also free, but the development and maintenance labor required to achieve equivalent functionality is consistently higher. For a university operating with fiscal discipline, WordPress delivers more capability per dollar spent.

### Why Not Headless WordPress

Headless architecture -- where WordPress serves only as a content API and a separate JavaScript application (React, Next.js) renders the front end -- is a legitimate approach for some institutions. It is not the right approach here.

**Editorial workflow degrades.** In a headless setup, the content preview, in-context editing, and WYSIWYG experience that makes WordPress intuitive all require custom re-engineering. Your team would lose the ability to see what a page looks like before publishing it unless we build that capability from scratch.

**The plugin ecosystem breaks.** Gravity Forms, Yoast SEO, accessibility checking tools, Google Tag Manager integration -- all of these work out of the box in traditional WordPress. In a headless architecture, each one requires front-end reimplementation or replacement.

**It creates a permanent skills gap.** A headless front end requires React or Next.js expertise for ongoing maintenance. If your internal team's strengths are in WordPress theming, PHP, and content management, headless introduces a technology your team cannot maintain independently.

**Two codebases instead of one.** Headless means maintaining the WordPress backend and a separate front-end application. For a site that needs to be stable and maintainable for five or more years, this doubles the surface area for bugs, security updates, and technical debt.

### Future-Proofing Without Headless

We will architect the content model using Advanced Custom Fields (ACF) Pro with full REST API exposure. Every custom post type, every field group, every taxonomy will be accessible via the WordPress REST API from day one. If Holy Family ever needs to serve content to a mobile app, a digital signage system, or a future front-end framework, the content layer is ready. You get the editorial experience of traditional WordPress today and the API flexibility of headless architecture if you ever need it.

---

## C.2 Technical Architecture

### Proposed Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **CMS** | WordPress 6.x | Content management, editorial workflow, user administration |
| **Content Modeling** | Advanced Custom Fields (ACF) Pro | Custom post types, field groups, flexible content layouts, relationship fields |
| **Forms** | Gravity Forms + Webhooks Add-On | Native form builder, Slate CRM integration via webhook, conditional logic |
| **SEO** | Rank Math Pro or Yoast SEO Premium | Structured data (Schema.org), meta management, XML sitemaps, breadcrumbs |
| **Hosting** | Pantheon | Managed WordPress hosting with dev/test/live environments |
| **Version Control** | Git (via Pantheon) | All theme and plugin code tracked, auditable, reversible |
| **Front-End** | Custom WordPress theme (PHP, HTML, CSS, JavaScript) | Responsive, accessible, component-based |
| **Caching/CDN** | Pantheon Global CDN (Fastly) | Edge caching, HTTPS, DDoS protection |

### Component-Based Theme Architecture

The theme will be built using a component-based approach. Rather than designing pages as monolithic templates, we will build a library of reusable components -- hero sections, program cards, faculty profiles, call-to-action blocks, testimonial modules, statistics displays, event listings -- that content editors can assemble into pages using the block editor.

Each component will be:

- **Self-contained.** Its own markup, styles, and behavior. No dependency on what else is on the page.
- **Responsive.** Designed mobile-first, tested across breakpoints.
- **Accessible.** ARIA attributes, keyboard navigation, and screen reader compatibility built in from the start -- not added after the fact.
- **Documented.** A living pattern library will ship with the theme, showing each component's variants, usage guidelines, and content requirements.

This approach directly addresses the inconsistency problem described in the RFP. When every department page is assembled from the same component library, visual and structural consistency is enforced by the system, not by editorial discipline alone.

### Custom Post Types

Based on our analysis of the current site's 1,601 URLs, we propose the following content architecture:

| Content Type | WordPress Implementation | Key Fields |
|---|---|---|
| **Academic Programs** | Custom post type `program` | Degree level, school, department, format (on-campus/online/hybrid), credit hours, accreditation, outcomes data, related faculty |
| **Faculty Profiles** | Custom post type `faculty` | Title, department, school, research areas, publications, office hours, headshot, program relationships |
| **Events** | Custom post type `event` | Date/time, location, event type, registration link, audience (prospective/current/alumni) |
| **News/Blog** | Native `post` type | Categories by department and topic, featured image, author |
| **Pages** | Native `page` type with block patterns | Hierarchical parent-child structure for information architecture |
| **Landing Pages** | Native `page` type with ACF Flexible Content | Modular layouts for campaign and program marketing pages |

Shared taxonomies -- `department`, `school`, `program-type`, `audience` -- will link content across types, enabling features like "show all nursing faculty on the nursing program page" without manual curation.

---

## C.3 Hosting and Infrastructure

### Pantheon: Dev/Test/Live Workflow

We recommend Pantheon as the hosting platform. Pantheon provides a managed WordPress hosting environment built around a three-environment workflow that enforces development best practices:

**Development (Dev)**
The working environment where code changes are made. Developers write and test theme and plugin updates here. The Dev environment connects directly to a Git repository -- every code change is committed, tracked, and reversible.

**Test**
A staging environment that mirrors the Live site's content and database. Code is promoted from Dev to Test for review. This is where the Holy Family team will preview changes, run accessibility audits, and approve updates before they reach the public site.

**Live**
The production environment serving holyfamily.edu. Code is promoted from Test to Live only after approval. The Live environment sits behind Pantheon's Global CDN (powered by Fastly), providing edge caching, automatic HTTPS, and DDoS protection.

### How Content and Code Move

Pantheon enforces a deliberate separation:

- **Code moves up:** Dev to Test to Live. Every promotion is a Git-based deployment with a full audit trail.
- **Content moves down:** Database and files can be cloned from Live to Dev or Test for local development and testing. This means developers always work against real content, not placeholder data.

This workflow eliminates the most common source of deployment failures in WordPress: ad hoc code changes made directly on production. On Pantheon, the Live filesystem is read-only. Code changes can only reach production through the Dev-to-Test-to-Live pipeline.

### Version Control and Deployment Process

All custom theme code, custom plugin code, and configuration files are stored in a Git repository hosted on Pantheon. The deployment process:

1. Developer creates a feature branch (or uses a Multidev environment -- see Section C.6)
2. Code is written, tested locally, and pushed to the branch
3. Changes are reviewed (code review by a second developer when team size permits)
4. Branch is merged to the Dev environment's main branch
5. Code is promoted to Test, where it is reviewed against the production database
6. After approval, code is promoted to Live
7. Pantheon executes cache clears automatically on deployment

This process is fully auditable. Every change to the codebase has a commit message, a timestamp, and an author. If a deployment introduces a problem, Pantheon supports one-click rollback to any previous commit.

### Uptime and Performance

Pantheon's infrastructure delivers:

- **99.9% uptime SLA** on Performance plans and above
- **Global CDN** with edge nodes across North America, Europe, and Asia-Pacific
- **Automated HTTPS** via Let's Encrypt, including certificate renewal
- **Container-based architecture** that scales automatically during traffic spikes (enrollment season, admissions deadlines, event announcements)
- **Daily automated backups** with one-click restore

---

## C.4 Accessibility Compliance: WCAG 2.2 AA

### The Compliance Landscape

The ADA Title II Final Rule (published April 2024) required public universities to meet WCAG 2.1 AA by April 24, 2026. That deadline has passed. As a recipient of federal funds, Holy Family University is subject to Section 504 and Section 508 requirements that impose the same standard.

We will build to WCAG 2.2 AA -- one version ahead of the current legal floor. WCAG 2.2 is backward-compatible with 2.1, so meeting 2.2 automatically satisfies the legal requirement while providing a compliance margin against future regulatory updates.

### What WCAG 2.2 AA Adds

WCAG 2.2 introduces six new success criteria beyond 2.1. Four are directly relevant to a university website:

| Criterion | Requirement | How We Address It |
|---|---|---|
| **2.4.11 Focus Not Obscured** | Keyboard focus indicator must not be hidden behind sticky headers, modals, or other overlapping elements | Focus management designed into every component; sticky header accounts for focus offset |
| **2.5.7 Dragging Movements** | Any drag interaction must have a click or tap alternative | No drag-only interactions in the design; all interactive elements have standard click/tap paths |
| **2.5.8 Target Size Minimum** | Interactive targets must be at least 24x24 CSS pixels | Minimum touch target of 44x44px in our component library (exceeds the 24px floor) |
| **3.3.8 Accessible Authentication** | Login cannot require cognitive function tests (e.g., CAPTCHA puzzles); must allow password managers and paste | All forms support autofill and paste; CAPTCHA alternatives (honeypot, reCAPTCHA v3 score-based) used where spam protection is needed |

### "Shift Left" Accessibility Methodology

Most agencies treat accessibility as a QA checkpoint -- build the site first, then audit and fix. This is expensive, slow, and produces inconsistent results. Our approach shifts accessibility left into every phase of the project:

**Design Phase**
- Color palettes validated for 4.5:1 contrast ratio (body text) and 3:1 (large text and interactive elements) before a single pixel is designed
- Touch targets sized at 44x44px minimum in wireframes, not retrofitted later
- Focus states designed as a first-class visual element for every interactive component
- Heading hierarchy defined in content models, enforcing logical structure before content is written

**Development Phase**
- Component library built with semantic HTML and ARIA attributes from the first line of code
- Automated accessibility linting integrated into the development environment (axe-core) -- developers see violations as they write code, not weeks later in a QA report
- axe-core integrated into the CI/CD pipeline -- code that introduces accessibility regressions cannot be deployed

**Content Phase**
- WordPress editor configured with guardrails: alt text required before image insertion, heading level enforcement (no skipping from H2 to H4), accessible PDF templates provided for document uploads
- Content author training includes hands-on accessibility exercises, not just a policy document

**QA Phase**
- Automated testing via axe-core catches approximately 30-40% of WCAG violations
- Manual testing covers the rest: keyboard-only navigation through all critical user flows, screen reader testing with VoiceOver and NVDA on key pages (homepage, program pages, admissions application, financial aid)
- Accessibility testing is not a separate phase -- it runs in parallel with functional QA throughout development

**Post-Launch**
- Holy Family already uses Siteimprove for accessibility monitoring. We will configure Siteimprove dashboards for ongoing WCAG 2.2 AA tracking, providing the internal team with continuous visibility into compliance status
- Quarterly audit cadence recommended for the first year post-launch

### Common University Website Failures We Will Prevent

Based on industry data, the most frequently failed WCAG criteria on university websites are:

- Missing image alt text (1.1.1) -- enforced at the editor level
- Insufficient color contrast (1.4.3) -- validated in the design system
- Keyboard navigation failures (2.1.1) -- tested for every interactive component
- Missing video captions (1.2.2) -- captioning requirements documented in content guidelines; Wistia (already in your stack) supports captions natively
- Inaccessible PDFs (1.3.1) -- accessible PDF templates provided; legacy PDF remediation scoped as a post-launch phase
- Form labeling failures (3.3.2) -- all Gravity Forms fields include programmatic labels, error messages, and instructions

---

## C.5 Integration Capabilities

### Slate CRM Integration

Slate is Holy Family's enrollment CRM. A successful website redesign must integrate cleanly with Slate at three levels: form submissions, behavioral tracking, and content syndication.

#### Form Integration: Gravity Forms Webhook Pattern

We recommend the Gravity Forms webhook approach over Slate's native script-tag embed. Here is why.

**The Slate embed approach** requires pasting Slate's `<script>` tag into WordPress pages. This creates three problems: WordPress's content sanitizer can strip or break the script tag (requiring a custom block or shortcode workaround), the injected form inherits Slate's CSS which can conflict with the site's design system, and you are limited to one Slate form per page.

**The Gravity Forms webhook approach** solves all three:

1. **Build the form natively in WordPress.** Using Gravity Forms, we create inquiry forms (Request for Information, Schedule a Visit, Apply Now) that match the site's design system exactly. The forms use the same typography, colors, spacing, and validation patterns as every other component on the site.

2. **Map fields to Slate's Source Format.** Each Gravity Forms field is mapped to the corresponding Slate field key (first name, last name, email, phone, program of interest, etc.). This mapping is configured once per form.

3. **POST data to Slate on submission.** The Gravity Forms Webhooks Add-On sends form data as a JSON payload to Slate's Source Format endpoint in real time. When a prospective student submits an RFI form, the data arrives in Slate within seconds -- not in a batch overnight.

4. **Confirmation and tracking.** After submission, the student sees a WordPress-native confirmation page (or inline confirmation) while Slate simultaneously creates or updates their prospect record and triggers any configured Slate workflows (automated emails, counselor assignments, drip campaigns).

This pattern has been documented and validated at scale by NC State University, including complete field key mappings between Gravity Forms and Slate.

#### Behavioral Tracking: Slate Ping

Slate Ping is a lightweight JavaScript snippet that tracks page-level browsing behavior across the website. It will be implemented site-wide via the theme's header template (or via Google Tag Manager, which Holy Family already uses):

```html
<script async="async" src="https://[instance].technolutions.net/ping">/**/</script>
```

Slate Ping drops a first-party cookie and records every page a visitor views. When that anonymous visitor later performs an authenticated action -- clicking a link in a Slate email, logging into the applicant portal, submitting a form -- Slate links their browsing history to their prospect record retroactively. This provides the enrollment team with a complete picture of a student's research journey: which programs they explored, which financial aid pages they read, how many times they returned before converting.

This is the behavioral tracking foundation for enrollment attribution. It will be active on every page from launch day.

#### Content Syndication: Slate Web Services

For dynamic content that originates in Slate -- program listings, event calendars, deadline dates -- we will use Slate's Query Builder web service to pull structured JSON data into WordPress. This enables scenarios such as:

- Displaying upcoming admissions events on the website, sourced from Slate's event calendar
- Showing real-time application deadlines that update when the enrollment team changes them in Slate
- Populating "Programs of Interest" dropdowns on forms directly from Slate's program taxonomy

The web service approach ensures the website always reflects current enrollment data without manual content duplication.

#### Integration Architecture Summary

| Data Flow | Method | Timing |
|---|---|---|
| Form submissions (website to Slate) | Gravity Forms webhook to Slate Source Format endpoint | Real-time on submission |
| Browsing behavior (website to Slate) | Slate Ping JavaScript snippet on every page | Continuous; linked to records nightly |
| Dynamic content (Slate to website) | Slate Query Builder web service (JSON) | Cached with configurable refresh interval |
| Applicant portal (Slate-hosted) | Embedded iframe or linked portal page | Requires SSO configuration with IT (SAML/CAS) |

#### Technical Dependencies and Boundaries

- Slate Knowledge Base access is required for implementation. We will need credentials to Holy Family's Slate instance to configure Source Format endpoints and Query Builder web services.
- The applicant status portal requires cross-domain single sign-on (SAML, CAS, or LDAP). This is an IT infrastructure dependency, not a web development deliverable. We will coordinate with IT but scope SSO configuration as a separate workstream.
- Slate's Open API (launched read-only in 2023) may provide additional integration options. We will evaluate during discovery.

### Additional Integration Points

| System | Integration Method | Notes |
|---|---|---|
| **Google Analytics 4** | GTM container (already in place) | Preserved and enhanced; event tracking for form submissions, program page engagement, CTA clicks |
| **Google Tag Manager** | Existing container (GTM-5FPBQK3) | All third-party scripts managed through GTM, not hard-coded |
| **Crazy Egg / Hotjar** | Via GTM | Existing heatmap and session recording tools preserved |
| **Wistia** | Embed via Gutenberg block or shortcode | Video hosting for campus tours, program spotlights; caption support for accessibility |
| **Siteimprove** | JavaScript snippet via GTM | Existing accessibility and content quality monitoring preserved |

---

## C.6 Pantheon-Specific Advantages

We are recommending Pantheon not as a generic hosting provider but as a platform whose specific features address Holy Family's operational needs. Here are the capabilities that matter most for this project.

### Multidev for Parallel Development and Testing

Multidev creates on-demand, isolated copies of the full website -- code, database, and files -- branched from any point in the development timeline. Each Multidev environment gets its own URL and runs independently.

**Why this matters for Holy Family:**

- During development, multiple features can be built and tested simultaneously without blocking each other. The program page template and the admissions form workflow do not have to wait in line.
- During content migration, individual content types can be imported and reviewed in their own Multidev environment before being merged into the main development branch.
- Post-launch, Multidev environments allow the internal team to test theme updates, plugin changes, or content experiments against a full copy of the production site before promoting anything to Live.

### Autopilot for Automated Updates

Pantheon Autopilot automates WordPress core, plugin, and theme updates with a safety net:

1. Autopilot detects available updates
2. It applies updates in a sandboxed environment
3. It runs visual regression testing -- automated screenshot comparisons across key pages to detect layout breakage
4. If no visual regressions are detected, updates are promoted to Test for human review
5. If regressions are detected, the update is flagged and held

For a small team maintaining a 1,000+ page site, Autopilot eliminates the most time-consuming and anxiety-producing part of WordPress maintenance: keeping everything up to date without breaking anything. Updates that would take hours of manual testing are handled automatically, with human review only where the system flags a potential issue.

### Terminus CLI Integration

Terminus is Pantheon's command-line interface. Combined with WP-CLI (WordPress's command-line tool), it enables scripted operations that would be tedious or error-prone through the WordPress admin interface:

- **Bulk content operations:** Import, update, or transform hundreds of posts and pages via script rather than manual editing
- **Database operations:** Search-and-replace across the database (e.g., updating URLs after domain migration) with a single command
- **Automated workflows:** Scheduled tasks like cache warming, database optimization, or content audits can be scripted and run via cron
- **Migration automation:** During the Drupal-to-WordPress migration, Terminus + WP-CLI will be the backbone for importing content, mapping redirects, and validating data integrity at scale

This is particularly relevant during the migration phase. Migrating 1,000+ pages is not a manual task -- it is a scripted, repeatable, testable process. Terminus and WP-CLI make that possible.

### New Relic Performance Monitoring

Pantheon includes New Relic APM integration, providing real-time visibility into application performance:

- Page load times broken down by component (database queries, PHP execution, external API calls)
- Slow query identification and optimization guidance
- Error tracking and alerting
- Traffic analysis during peak enrollment periods

This gives both our team during development and your team post-launch the diagnostic tools needed to identify and resolve performance issues before they affect visitors.

### Security and Compliance

Pantheon's infrastructure provides security measures relevant to a university handling prospective student data:

- **Automated HTTPS** across all environments
- **SOC 2 Type II certified** hosting infrastructure
- **Read-only filesystem** in production (prevents unauthorized code modifications and many classes of malware injection)
- **Automated daily backups** with point-in-time restore
- **IP-based access controls** available for staging environments containing sensitive data
- **Container isolation** -- each site runs in its own container, not shared with other customers

---

## C.7 Post-Launch Technical Ownership

Every technology choice in this section was made with a single question in mind: can Holy Family's team maintain this independently after we hand it over?

WordPress, not headless -- because your team knows WordPress. ACF Pro for content modeling, not a custom framework -- because ACF has documentation, community support, and does not require our involvement to extend. Gravity Forms for Slate integration, not custom API code -- because form changes can be made through a visual interface. Pantheon for hosting, not a bare server -- because infrastructure management is handled by the platform, not by your staff.

The goal is a site that Rick Mitchell's team can update, extend, and maintain for the next five years without calling us. We will still be available -- but you should not need us for routine operations.

Our knowledge transfer plan (detailed in Section [TODO: reference knowledge transfer section]) will include hands-on training sessions covering content editing workflows, component usage, Gravity Forms management, Pantheon deployment procedures, and accessibility monitoring with Siteimprove.
