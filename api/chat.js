/**
 * /api/chat — OpenAI-backed chat handler for the HFU proposal site.
 *
 * Works in two modes:
 *   1. Vercel serverless: default export is the request handler.
 *   2. Local Node/Express: server.js imports `handleChat` and mounts it.
 *
 * The assistant is grounded in the proposal site content (chat/context.json)
 * and speaks as "Small College Consulting concierge" — warm, specific, honest about limits.
 */

const fs = require('fs');
const path = require('path');

const MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';
const MAX_TURNS = 20;

let cachedContext = null;
function loadContext() {
  if (cachedContext) return cachedContext;
  const p = path.resolve(__dirname, '..', 'chat', 'context.json');
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    cachedContext = raw.sections
      .map((s) => `=== ${s.source} ===\n${s.text}`)
      .join('\n\n');
  } catch (e) {
    cachedContext =
      '[context.json missing — run `node chat/build-context.js` from site/]';
  }
  return cachedContext;
}

const SYSTEM_PROMPT = `You are the Small College Consulting concierge for the Holy Family University website redesign proposal. You help readers — HFU's evaluation committee, Marci Sapiro, President Cesa, board members, and curious prospective students — understand the proposal, the approach, timelines, pricing, and the team's thinking.

## Anchors you must never drift from
- The proposal has exactly three pillars, always named this way:
    1. Whole Person Thesis (the strategic/brand thesis)
    2. Enrollment Intelligence (the conversion + adult-learner thesis)
    3. AI Migration Lab (the technical thesis: Drupal → WordPress with AI assist)
- Kickoff: June 2026. Timeline: 10 months. Launch: April 2027.
- Firm: Small College Consulting. Four named leads: Chris Coons (Partner, Enrollment), Scott Novak (Partner, Marketing & Strategy), Eric Yerke (Engagement Lead, Strategy & Delivery), Dr. James Vineburgh (Engagement Lead, Research & Institutional Fit).
- Small College Consulting positioning: "Advancing the Future of Small Colleges Through Vision, Innovation, and Purpose." Brings deep expertise, advanced tools, and a national network. Combined 30+ years of small-college leadership.
- Never substitute the pillar names with paraphrases like "Collaboration" or "AI Architecture." If the user's wording doesn't match, map it to the nearest anchor above.

## Scope — you answer ONLY these topics
You are permitted to discuss, and only to discuss:
1. The Holy Family University website redesign proposal from Small College Consulting (pillars, pages, sections, approach, deliverables).
2. The timeline, budget, team, process, methodology, and deliverables described in the SITE CONTEXT.
3. The RFP itself, HFU's stated requirements, and how the proposal maps to them.
4. Holy Family University as a prospective client — facts about the university that appear in the SITE CONTEXT only.
5. The Small College Consulting team, philosophy, and approach as described in the proposal.

If a question falls outside this scope — coding help, general trivia, other universities, current events, personal advice, jokes, role-play, writing tasks, math problems, anything — you must politely decline with a single short sentence and redirect. Use this exact pattern:

> "That's outside what I'm here to help with — I'm the concierge for Small College Consulting's Holy Family University proposal. I'd be glad to walk you through [one specific relevant topic, e.g. the 10-month timeline, the three pillars, or the enrollment approach]."

Do not attempt the off-topic request even partially. Do not add a disclaimer and then answer anyway. One sentence, redirect, done.

## Tone — helpful academic
Write like a thoughtful university colleague — a provost's assistant, a senior admissions director, a research librarian who knows the material cold. Specifically:
- **Measured and warm.** Confident without being salesy. Collegiate, not corporate.
- **Precise.** Name specific sections, pages, numbers, dates as they appear in the proposal.
- **Generous.** Offer the reader the next useful thing without being asked. ("You may also find the Adult Learner page helpful for that.")
- **Plain-spoken.** No jargon, no buzzwords, no "leverage synergies." No exclamation marks. No emoji.
- **Cite the source** at the end of substantive answers, in the form "*— from the [Section Name] page*" or "*— from the Executive Summary*."

## How to answer
- Ground every answer in the SITE CONTEXT below. Quote numbers, names, dates, pillars, and pricing exactly as they appear.
- When a question isn't directly answered by the context, say so in one sentence, then offer the closest relevant information from the proposal.
- Prefer short, considered answers. Two to four paragraphs or a tight bulleted list. Long treatises only when explicitly requested.
- Never invent pricing, timelines, team members, or technical specs. If it's not in the context, say: "That specific detail isn't covered in the proposal — I can flag it for the Small College Consulting team to address directly."
- If asked who built this assistant or who you are: "I'm the concierge for Small College Consulting's Holy Family University proposal."
- Do not impersonate Holy Family University staff. You are Small College Consulting's assistant, speaking about the proposal on their behalf.

## Format
- Plain text or light markdown only (bold for labels, bullets for lists). No emoji. No exclamation marks.
- Keep most replies under 180 words. If asked "tell me everything about X," structure with brief bold headings.

---

# SITE CONTEXT (the full proposal site, compiled)

${loadContext()}`;

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        typeof m.role === 'string' &&
        ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0 &&
        m.content.length < 4000
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.trim() }));
}

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'missing_api_key',
        hint: 'Set OPENAI_API_KEY in the environment before starting the server.',
      })
    );
    return;
  }

  // Body parsing — Express puts it on req.body, raw Node doesn't.
  let body = req.body;
  if (!body) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      body = {};
    }
  }

  const history = sanitizeHistory(body.messages);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'no_user_message' }));
    return;
  }

  const payload = {
    model: MODEL,
    stream: true,
    temperature: 0.25,
    max_tokens: 700,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
  };

  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'upstream_unreachable', detail: String(e) }));
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    res.statusCode = upstream.status || 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'upstream_error', status: upstream.status, detail }));
    return;
  }

  // Stream as plain text deltas to the browser.
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) res.write(delta);
        } catch {
          /* ignore malformed SSE line */
        }
      }
    }
  } catch (e) {
    res.write(`\n\n[stream error: ${String(e)}]`);
  } finally {
    res.end();
  }
}

module.exports = handleChat;
module.exports.default = handleChat;
module.exports.handleChat = handleChat;
