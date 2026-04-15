#!/usr/bin/env node
/**
 * build-context.js
 * Extracts visible text from the key proposal pages and briefing docs
 * into a single JSON file the chat API uses as grounded context.
 *
 * Run: node chat/build-context.js   (from the site/ directory)
 */
const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '..');
const RESEARCH_DIR = path.resolve(SITE_DIR, '..');

// Sources, in priority order. Highest-signal content first — if the budget
// tightens, tail items get truncated.
const HTML_PAGES = [
  'index.html',
  'what-ai-can-do.html',
  'opportunities-we-see.html',
  'discovery.html',
  'mission.html',
  'enrollment.html',
  'personas.html',
  'ai-lab.html',
  'runway.html',
  'peers.html',
  'research.html',
  'sitemap-atlas.html',
];

// The action-items doc is the authoritative source for pricing, timeline,
// team, and partnership — per CLAUDE.md it wins over any older draft. Keep
// it first so it's never truncated if the budget is hit.
const MD_DOCS = [
  '../2026-04-14 scc-strategy-call-action-items.md',
  '../Executive-Summary.md',
  '../2026-04-11 hfu-rfp-what-they-actually-want.md',
  '../COMPLETE-PROPOSAL.md',
  'BRIEFING.md',
];

function stripHtml(html) {
  return html
    // Drop script/style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    // Drop HTML comments
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Turn block elements into newlines to preserve structure
    .replace(/<\/(h[1-6]|p|li|section|div|tr|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode a few common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/^ +/gm, '')
    .trim();
}

function stripMd(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function safeRead(rel) {
  try {
    return fs.readFileSync(path.resolve(SITE_DIR, rel), 'utf8');
  } catch (e) {
    return null;
  }
}

const sections = [];

for (const page of HTML_PAGES) {
  const raw = safeRead(page);
  if (!raw) continue;
  const text = stripHtml(raw);
  if (text) sections.push({ source: page, text });
}

// Small College Consulting public site — captured HTML snapshots so the
// concierge knows the agency's public positioning, services, team, and
// specialities as HFU's evaluators would see it. These are high-priority
// grounding sources; they're inserted before the long-form MD docs so the
// char-budget tail-trim never drops them.
const SCC_PAGES_DIR = path.resolve(__dirname, 'scc-site');
try {
  for (const file of fs.readdirSync(SCC_PAGES_DIR).sort()) {
    if (!file.endsWith('.html')) continue;
    const raw = fs.readFileSync(path.resolve(SCC_PAGES_DIR, file), 'utf8');
    const text = stripHtml(raw);
    if (text) sections.push({ source: `smallcollegeconsulting.com/${file.replace(/\.html$/, '').replace(/^home$/, '')}`, text });
  }
} catch (e) {
  // Directory absent — SCC site context simply won't be included.
}

for (const doc of MD_DOCS) {
  const raw = safeRead(doc);
  if (!raw) continue;
  const text = stripMd(raw);
  if (text) sections.push({ source: path.basename(doc), text });
}

// Budget: ~320k chars ≈ 80k tokens. gpt-4o-mini handles 128k tokens, which
// still leaves headroom for the system prompt (~4k), 20 turns of history,
// and a 700-token response. Bumped from 220k so the authoritative docs and
// all proposal pages fit without tail-truncation.
const CHAR_BUDGET = 380_000;
let used = 0;
const trimmed = [];
for (const s of sections) {
  const remaining = CHAR_BUDGET - used;
  if (remaining <= 500) break;
  const take = s.text.length > remaining ? s.text.slice(0, remaining) + '\n[…truncated]' : s.text;
  trimmed.push({ source: s.source, text: take });
  used += take.length;
}

const payload = {
  generatedAt: new Date().toISOString(),
  charCount: used,
  sectionCount: trimmed.length,
  sections: trimmed,
};

const outPath = path.resolve(__dirname, 'context.json');
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

console.log(`[chat] context built → ${outPath}`);
console.log(`[chat] ${trimmed.length} sections, ${used.toLocaleString()} chars`);
