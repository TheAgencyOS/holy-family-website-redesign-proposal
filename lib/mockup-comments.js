/**
 * lib/mockup-comments.js · per-section comment pins for mockup pages.
 *
 * Loaded as a module: <script type="module" src="../lib/mockup-comments.js"></script>
 * The page must declare its mockup id in the head:
 *   <meta name="mockup-id" content="hfu-bsn">
 *
 * Behavior
 *   1. Finds every <section> in the document.
 *   2. Resolves each section's id (aria-labelledby > id > generated stable id) and
 *      a human-friendly label (heading text > id).
 *   3. Drops a small comment pin (top-right of the section) that opens a compact
 *      popover with section-scoped comments and an add-comment form.
 *   4. Polls every 30s for new comments to keep counts current.
 *
 * All DB writes proxy through /api/comments. Styling is scoped under
 * .hfm-pin-* and .hfm-pop-* prefixes to avoid clobbering host-page styles.
 *
 * Intentionally avoids the bottom-right corner so it does not collide with
 * the AI chat FAB injected by chat/portal-chat.js.
 */

(function () {
  const META = document.querySelector('meta[name="mockup-id"]');
  const MOCKUP_ID = META ? (META.getAttribute('content') || '').trim() : '';
  if (!MOCKUP_ID) {
    console.warn('[mockup-comments] no <meta name="mockup-id"> found; widget not mounted.');
    return;
  }

  // ── Local-storage helpers (remember the commenter on this device) ──
  const LS_NAME = 'hfm-user-name';
  const LS_EMAIL = 'hfm-user-email';
  const loadAuthor = () => {
    let name = '';
    let email = '';
    try { name = localStorage.getItem(LS_NAME) || ''; } catch { /* storage off */ }
    try { email = localStorage.getItem(LS_EMAIL) || ''; } catch { /* storage off */ }
    return { name, email };
  };
  const saveAuthor = (name, email) => {
    try { localStorage.setItem(LS_NAME, name || ''); } catch { /* storage off */ }
    try { localStorage.setItem(LS_EMAIL, email || ''); } catch { /* storage off */ }
  };

  // ── API helpers ──
  const API_BASE = (() => {
    // Always resolve relative to site root, regardless of nested URL depth.
    const a = document.createElement('a');
    a.href = '/api/';
    return a.href.replace(/\/$/, '');
  })();

  async function apiGet() {
    try {
      const r = await fetch(`${API_BASE}/comments?mockup_id=${encodeURIComponent(MOCKUP_ID)}`);
      return await r.json().catch(() => ({ data: null, error: 'bad_response' }));
    } catch (e) {
      return { data: null, error: String(e && e.message ? e.message : e) || 'network_error' };
    }
  }
  async function apiPost(payload) {
    try {
      const r = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await r.json().catch(() => ({ data: null, error: 'bad_response' }));
    } catch (e) {
      return { data: null, error: String(e && e.message ? e.message : e) || 'network_error' };
    }
  }

  // ── Style injection ──
  const STYLE_ID = 'hfm-pin-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
.hfm-pin-host {
  --hfm-cream: #FAF9F6;
  --hfm-cream-deep: #F3F0E8;
  --hfm-paper: #FFFFFF;
  --hfm-ink: #1C1E24;
  --hfm-ink-2: #3A3D46;
  --hfm-ink-3: #6B7079;
  --hfm-ink-4: #64686F;
  --hfm-rule: rgba(28, 30, 36, 0.10);
  --hfm-rule-strong: rgba(28, 30, 36, 0.18);
  --hfm-teal: #136B73;
  --hfm-teal-bright: #2BA5B3;
  --hfm-teal-soft: rgba(19, 107, 115, 0.08);
  --hfm-display: 'Roobert', 'Instrument Sans', -apple-system, system-ui, sans-serif;
  --hfm-body: 'Instrument Sans', -apple-system, system-ui, sans-serif;
  --hfm-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --hfm-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

/* ── Pin button ───────────────────────────────────────── */
.hfm-pin-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 100;
  height: 32px;
  padding: 0 14px 0 11px;
  border: 1px solid rgba(15, 17, 23, 0.14);
  background: rgba(255, 255, 255, 0.88);
  -webkit-backdrop-filter: blur(10px) saturate(1.4);
  backdrop-filter: blur(10px) saturate(1.4);
  color: var(--hfm-ink, #1C1E24);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(15, 17, 23, 0.08), 0 4px 12px rgba(15, 17, 23, 0.06);
  transition: background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  font-family: var(--hfm-mono, 'JetBrains Mono', ui-monospace, Menlo, monospace);
}
.hfm-pin-btn:hover,
.hfm-pin-btn:focus-visible {
  background: var(--hfm-ink, #1C1E24);
  color: var(--hfm-cream, #FAF9F6);
  border-color: var(--hfm-ink, #1C1E24);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(15, 17, 23, 0.18), 0 2px 4px rgba(15, 17, 23, 0.08);
  outline: none;
}
.hfm-pin-btn:focus-visible {
  outline: 2px solid var(--hfm-teal, #136B73);
  outline-offset: 3px;
}
.hfm-pin-btn--has {
  background: var(--hfm-teal, #136B73);
  color: #FFFFFF;
  border-color: var(--hfm-teal, #136B73);
  box-shadow: 0 1px 2px rgba(19, 107, 115, 0.18), 0 4px 12px rgba(19, 107, 115, 0.18);
}
.hfm-pin-btn--has:hover,
.hfm-pin-btn--has:focus-visible {
  background: var(--hfm-ink, #1C1E24);
  border-color: var(--hfm-ink, #1C1E24);
  color: #FFFFFF;
}
.hfm-pin-btn--open {
  background: var(--hfm-ink, #1C1E24);
  color: var(--hfm-cream, #FAF9F6);
  border-color: var(--hfm-ink, #1C1E24);
}
.hfm-pin-btn__icon {
  width: 15px;
  height: 15px;
  flex: none;
  display: block;
}
.hfm-pin-btn__label {
  font-family: var(--hfm-mono, 'JetBrains Mono', ui-monospace, Menlo, monospace);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
}

/* ── Popover ──────────────────────────────────────────── */
.hfm-pop {
  position: absolute;
  z-index: 2147483600;
  width: 360px;
  max-width: calc(100vw - 24px);
  max-height: 70vh;
  background: var(--hfm-cream);
  color: var(--hfm-ink);
  border: 1px solid var(--hfm-rule);
  border-radius: 10px;
  box-shadow: 0 24px 60px rgba(28, 30, 36, 0.18), 0 4px 12px rgba(28, 30, 36, 0.08);
  font-family: var(--hfm-body);
  font-size: 13.5px;
  line-height: 1.55;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity .15s ease, transform .15s ease;
  pointer-events: none;
}
.hfm-pop.is-open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.hfm-pop__head {
  flex: none;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--hfm-rule);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: var(--hfm-cream);
}
.hfm-pop__head-text { min-width: 0; flex: 1 1 auto; }
.hfm-pop__eyebrow {
  font-family: var(--hfm-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hfm-teal);
  margin-bottom: 4px;
}
.hfm-pop__title {
  font-family: var(--hfm-serif);
  font-size: 17px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--hfm-ink);
  word-wrap: break-word;
}
.hfm-pop__title em { font-style: italic; color: var(--hfm-teal); }
.hfm-pop__close {
  appearance: none;
  background: transparent;
  border: 1px solid var(--hfm-rule);
  color: var(--hfm-ink-2);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.hfm-pop__close:hover {
  background: var(--hfm-ink);
  color: var(--hfm-cream);
  border-color: var(--hfm-ink);
}
.hfm-pop__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px 16px 14px;
  scrollbar-width: thin;
  background: var(--hfm-cream);
}
.hfm-pop__loading,
.hfm-pop__error {
  padding: 12px 0;
  color: var(--hfm-ink-3);
  font-size: 12px;
}
.hfm-pop__error { color: #a3303a; }
.hfm-pop__empty {
  border: 1px dashed var(--hfm-rule-strong);
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  color: var(--hfm-ink-3);
}
.hfm-pop__empty-title {
  font-family: var(--hfm-serif);
  font-style: italic;
  font-size: 15px;
  color: var(--hfm-ink);
  margin-bottom: 4px;
}
.hfm-pop__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.hfm-pop__item {
  background: var(--hfm-paper);
  border: 1px solid var(--hfm-rule);
  border-radius: 8px;
  padding: 10px 12px 8px;
}
.hfm-pop__item-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.hfm-pop__item-author {
  font-weight: 600;
  font-size: 12px;
  color: var(--hfm-ink);
  word-break: break-word;
}
.hfm-pop__item-time {
  font-family: var(--hfm-mono);
  font-size: 9.5px;
  letter-spacing: 0.05em;
  color: var(--hfm-ink-4);
  text-transform: uppercase;
  flex: none;
}
.hfm-pop__item-body {
  font-size: 13px;
  color: var(--hfm-ink-2);
  white-space: pre-wrap;
  word-wrap: break-word;
}
.hfm-pop__replies {
  margin-top: 10px;
  padding-left: 10px;
  border-left: 2px solid var(--hfm-rule);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hfm-pop__reply {
  background: var(--hfm-cream-deep);
  border-radius: 6px;
  padding: 8px 10px;
}
.hfm-pop__reply-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}
.hfm-pop__reply-author {
  font-weight: 600;
  font-size: 11.5px;
  color: var(--hfm-ink);
}
.hfm-pop__reply-time {
  font-family: var(--hfm-mono);
  font-size: 9px;
  letter-spacing: 0.05em;
  color: var(--hfm-ink-4);
  text-transform: uppercase;
}
.hfm-pop__reply-body {
  font-size: 12px;
  color: var(--hfm-ink-2);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* ── Form ─────────────────────────────────────────────── */
.hfm-pop__form {
  flex: none;
  border-top: 1px solid var(--hfm-rule);
  background: var(--hfm-cream-deep);
  padding: 10px 12px 12px;
}
.hfm-pop__form-eyebrow {
  font-family: var(--hfm-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hfm-teal);
  margin-bottom: 8px;
  display: none;
}
.hfm-pop__form.is-expanded .hfm-pop__form-eyebrow { display: block; }
.hfm-pop__form-trigger {
  width: 100%;
  display: block;
  padding: 9px 12px;
  background: var(--hfm-paper);
  border: 1px solid var(--hfm-rule);
  border-radius: 6px;
  color: var(--hfm-ink-3);
  font-family: var(--hfm-body);
  font-size: 12.5px;
  text-align: left;
  cursor: text;
  transition: border-color .15s ease, color .15s ease;
}
.hfm-pop__form-trigger:hover { border-color: var(--hfm-rule-strong); color: var(--hfm-ink-2); }
.hfm-pop__form.is-expanded .hfm-pop__form-trigger { display: none; }
.hfm-pop__form-fields { display: none; flex-direction: column; gap: 8px; }
.hfm-pop__form.is-expanded .hfm-pop__form-fields { display: flex; }
.hfm-pop__form-row { display: flex; gap: 8px; }
.hfm-pop__form-row > * { flex: 1 1 0; min-width: 0; }
.hfm-pop__input,
.hfm-pop__textarea {
  font-family: inherit;
  font-size: 12.5px;
  color: var(--hfm-ink);
  background: var(--hfm-paper);
  border: 1px solid var(--hfm-rule);
  border-radius: 6px;
  padding: 8px 10px;
  width: 100%;
  line-height: 1.5;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.hfm-pop__input:focus,
.hfm-pop__textarea:focus {
  outline: none;
  border-color: var(--hfm-teal);
  box-shadow: 0 0 0 3px rgba(19, 107, 115, 0.15);
}
.hfm-pop__textarea { min-height: 64px; resize: vertical; }
.hfm-pop__form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
}
.hfm-pop__status {
  font-size: 11px;
  color: var(--hfm-ink-3);
  flex: 1;
  min-height: 14px;
}
.hfm-pop__status.is-error { color: #a3303a; }
.hfm-pop__form-buttons { display: inline-flex; gap: 6px; flex: none; }
.hfm-pop__cancel {
  appearance: none;
  background: transparent;
  border: 1px solid var(--hfm-rule);
  color: var(--hfm-ink-2);
  border-radius: 999px;
  padding: 7px 12px;
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.hfm-pop__cancel:hover {
  background: var(--hfm-cream);
  color: var(--hfm-ink);
  border-color: var(--hfm-rule-strong);
}
.hfm-pop__submit {
  appearance: none;
  background: var(--hfm-ink);
  color: var(--hfm-cream);
  border: 1px solid var(--hfm-ink);
  border-radius: 999px;
  padding: 7px 14px;
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background .15s ease, transform .15s ease, border-color .15s ease;
}
.hfm-pop__submit:hover {
  background: var(--hfm-teal);
  border-color: var(--hfm-teal);
  transform: translateY(-1px);
}
.hfm-pop__submit[disabled] {
  opacity: 0.6;
  cursor: progress;
  transform: none;
}

@media (max-width: 480px) {
  .hfm-pop { width: calc(100vw - 24px); }
  .hfm-pop__form-row { flex-direction: column; }
}
@media print {
  .hfm-pin-btn,
  .hfm-pop,
  .hfm-nudge { display: none !important; }
}

/* ── First-visit nudge ─────────────────────────────────── */
.hfm-nudge {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 2147483500;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px 9px 14px;
  background: var(--hfm-ink, #1C1E24);
  color: var(--hfm-cream, #FAF9F6);
  border-radius: 999px;
  font-family: var(--hfm-body, 'Instrument Sans', system-ui, sans-serif);
  font-size: 12.5px;
  line-height: 1;
  box-shadow:
    0 10px 30px -8px rgba(15, 17, 23, 0.35),
    0 4px 12px -4px rgba(15, 17, 23, 0.22);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity .28s ease, transform .32s cubic-bezier(.2,.9,.3,1.1), visibility .28s;
  visibility: hidden;
  pointer-events: none;
  max-width: calc(100vw - 40px);
}
.hfm-nudge.is-open {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
  pointer-events: auto;
}
.hfm-nudge__icon {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--hfm-teal-bright, #2BA5B3);
}
.hfm-nudge__text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hfm-nudge__text b {
  font-weight: 600;
  color: #fff;
}
.hfm-nudge__close {
  appearance: none;
  background: rgba(255,255,255,0.08);
  border: 0;
  color: rgba(255,255,255,0.7);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: 14px;
  line-height: 1;
  transition: background .15s ease, color .15s ease;
}
.hfm-nudge__close:hover { background: rgba(255,255,255,0.18); color: #fff; }

@media (max-width: 560px) {
  .hfm-nudge { left: 12px; bottom: 12px; font-size: 12px; padding: 8px 9px 8px 12px; }
  .hfm-nudge__text { white-space: normal; }
}
@media (prefers-reduced-motion: reduce) {
  .hfm-nudge { transition: opacity .18s ease, visibility .18s; transform: none !important; }
}
`;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── DOM helpers ──
  function el(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v != null) node.setAttribute(k, v);
    }
    kids.flat().forEach((k) => {
      if (k == null || k === false) return;
      node.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    });
    return node;
  }

  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const min = Math.round((Date.now() - d.getTime()) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day < 14) return `${day}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function commentBubbleSvg(extraClass) {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<svg class="hfm-pin-btn__icon' + (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8.5L4 22V6a2 2 0 0 1 2-2z"/>' +
      '</svg>';
    return wrap.firstChild;
  }

  // ── Section discovery ──
  function resolveSection(section, fallbackIndex) {
    // Section id resolution: aria-labelledby > section.id > generated id.
    const labelledById = section.getAttribute('aria-labelledby');
    let sectionId = '';
    let label = '';

    if (labelledById) {
      sectionId = labelledById.trim();
      const heading = document.getElementById(sectionId);
      if (heading) label = (heading.textContent || '').trim();
    }

    if (!sectionId && section.id) {
      sectionId = section.id;
    }

    if (!sectionId) {
      sectionId = `section-${fallbackIndex}`;
    }

    // Label fallback chain: heading text > aria-label > first h1/h2/h3 > sectionId.
    if (!label) {
      const ariaLabel = section.getAttribute('aria-label');
      if (ariaLabel) label = ariaLabel.trim();
    }
    if (!label) {
      const heading = section.querySelector('h1, h2, h3');
      if (heading) label = (heading.textContent || '').trim();
    }
    if (!label) label = sectionId;

    // Normalize whitespace and cap length — long labels look bad in the popover header.
    label = label.replace(/\s+/g, ' ').trim();
    if (label.length > 140) label = label.slice(0, 137) + '…';

    return { sectionId, label };
  }

  // ── State ──
  const state = {
    /** All comments for this mockup (top-level + replies, threaded). */
    threads: [],
    /** Map<sectionId, threads[]> — threads bucketed by section. */
    bySection: new Map(),
    /** Pin records: [{ sectionId, label, section, btn, badge }]. */
    pins: [],
    /** Currently open popover record + sectionId. */
    open: null,
  };

  function bucketBySection(threads) {
    const map = new Map();
    threads.forEach((t) => {
      const sid = t.section_id || '__none__';
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid).push(t);
    });
    return map;
  }

  function commentCountForSection(sid) {
    const threads = state.bySection.get(sid) || [];
    let count = 0;
    threads.forEach((t) => {
      count += 1;
      if (Array.isArray(t.replies)) count += t.replies.length;
    });
    return count;
  }

  function updatePinBadge(pin) {
    const count = commentCountForSection(pin.sectionId);
    pin.btn.classList.toggle('hfm-pin-btn--has', count > 0);
    pin.btn.setAttribute(
      'aria-label',
      count > 0
        ? `${count} comment${count === 1 ? '' : 's'} on ${pin.label}. Open thread.`
        : `Add a comment on ${pin.label}.`
    );
    if (pin.label_el) {
      pin.label_el.textContent = count > 0
        ? (count === 1 ? '1 comment' : `${count} comments`)
        : 'Comment';
    }
  }

  // ── Popover positioning ──
  function positionPopover(pop, anchor) {
    // Reset any prior coordinates so we measure naturally.
    pop.style.top = '0px';
    pop.style.left = '0px';

    const margin = 8;
    const popRect = pop.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: drop the popover just below the pin, right-aligned to the pin.
    let top = anchorRect.bottom + margin;
    let left = anchorRect.right - popRect.width;

    // If it would overflow the bottom and there's more room above, flip up.
    if (top + popRect.height > vh - margin && anchorRect.top - popRect.height - margin > 0) {
      top = anchorRect.top - popRect.height - margin;
    }

    // Clamp horizontally.
    if (left < margin) left = margin;
    if (left + popRect.width > vw - margin) left = vw - margin - popRect.width;

    // Convert from viewport coords → page coords.
    pop.style.top = `${top + window.scrollY}px`;
    pop.style.left = `${left + window.scrollX}px`;
  }

  // ── Popover rendering ──
  function buildPopover(pin) {
    const author = loadAuthor();
    const pop = el('div', {
      class: 'hfm-pin-host hfm-pop',
      role: 'dialog',
      'aria-label': `Comments on ${pin.label}`,
    });

    // Head
    const headText = el('div', { class: 'hfm-pop__head-text' });
    headText.appendChild(el('div', { class: 'hfm-pop__eyebrow' }, 'Section comments'));
    const titleNode = el('div', { class: 'hfm-pop__title' });
    titleNode.textContent = pin.label;
    headText.appendChild(titleNode);
    const sub = el('div', {
      class: 'hfm-pop__eyebrow',
      style: 'color: var(--hfm-ink-3); margin-top: 6px; letter-spacing: 0.06em;',
    });
    sub.textContent = '';
    headText.appendChild(sub);

    const closeBtn = el(
      'button',
      { class: 'hfm-pop__close', type: 'button', 'aria-label': 'Close' },
      '×'
    );
    closeBtn.addEventListener('click', () => closePopover());

    const head = el('div', { class: 'hfm-pop__head' });
    head.appendChild(headText);
    head.appendChild(closeBtn);
    pop.appendChild(head);

    // Body
    const body = el('div', { class: 'hfm-pop__body' });
    pop.appendChild(body);

    // Form
    const form = el('form', { class: 'hfm-pop__form', autocomplete: 'on' });
    const trigger = el(
      'button',
      { class: 'hfm-pop__form-trigger', type: 'button' },
      'Add a comment…'
    );
    form.appendChild(el('div', { class: 'hfm-pop__form-eyebrow' }, 'Add a comment'));
    form.appendChild(trigger);

    const fields = el('div', { class: 'hfm-pop__form-fields' });
    const row = el('div', { class: 'hfm-pop__form-row' });
    const nameInput = el('input', {
      class: 'hfm-pop__input',
      name: 'author_name',
      type: 'text',
      placeholder: 'Your name',
      required: 'required',
      maxlength: '120',
      value: author.name || '',
    });
    const emailInput = el('input', {
      class: 'hfm-pop__input',
      name: 'author_email',
      type: 'email',
      placeholder: 'Email (optional)',
      maxlength: '180',
      value: author.email || '',
    });
    row.appendChild(nameInput);
    row.appendChild(emailInput);
    fields.appendChild(row);

    const bodyInput = el('textarea', {
      class: 'hfm-pop__textarea',
      name: 'body',
      placeholder: 'Specific feedback works best — what to change, why.',
      required: 'required',
      maxlength: '4000',
      rows: '3',
    });
    fields.appendChild(bodyInput);

    const actions = el('div', { class: 'hfm-pop__form-actions' });
    const status = el('div', { class: 'hfm-pop__status' });
    const buttons = el('div', { class: 'hfm-pop__form-buttons' });
    const cancelBtn = el('button', { class: 'hfm-pop__cancel', type: 'button' }, 'Cancel');
    const submit = el('button', { class: 'hfm-pop__submit', type: 'submit' }, 'Send');
    buttons.appendChild(cancelBtn);
    buttons.appendChild(submit);
    actions.appendChild(status);
    actions.appendChild(buttons);
    fields.appendChild(actions);
    form.appendChild(fields);
    pop.appendChild(form);

    function expandForm() {
      form.classList.add('is-expanded');
      setTimeout(() => bodyInput.focus(), 30);
      // After expansion the popover is taller — re-position so it stays in view.
      requestAnimationFrame(() => positionPopover(pop, pin.btn));
    }
    function collapseForm() {
      form.classList.remove('is-expanded');
      bodyInput.value = '';
      status.classList.remove('is-error');
      status.textContent = '';
      requestAnimationFrame(() => positionPopover(pop, pin.btn));
    }

    trigger.addEventListener('click', expandForm);
    bodyInput.addEventListener('focus', () => form.classList.add('is-expanded'));
    cancelBtn.addEventListener('click', collapseForm);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const text = bodyInput.value.trim();
      if (!name || !text) {
        status.classList.add('is-error');
        status.textContent = 'Name and comment are required.';
        return;
      }
      submit.disabled = true;
      const prevSubmit = submit.textContent;
      submit.textContent = 'Sending…';
      status.classList.remove('is-error');
      status.textContent = '';
      const res = await apiPost({
        mockup_id: MOCKUP_ID,
        section_id: pin.sectionId,
        section_label: pin.label,
        author_name: name,
        author_email: email || null,
        body: text,
      });
      submit.disabled = false;
      submit.textContent = prevSubmit;
      if (res.error) {
        status.classList.add('is-error');
        status.textContent = `Could not send — ${res.error}`;
        return;
      }
      saveAuthor(name, email);
      bodyInput.value = '';
      status.textContent = 'Sent.';
      setTimeout(() => { if (status.textContent === 'Sent.') status.textContent = ''; }, 2000);
      await refreshComments();
      // Re-render this popover's list with the new data.
      renderPopoverBody(pin, body, sub);
      requestAnimationFrame(() => positionPopover(pop, pin.btn));
    });

    function renderBodyContent() {
      renderPopoverBody(pin, body, sub);
    }
    renderBodyContent();

    return { pop, headSub: sub, body, form, refreshBody: renderBodyContent };
  }

  function renderPopoverBody(pin, container, headSub) {
    const threads = state.bySection.get(pin.sectionId) || [];
    container.innerHTML = '';

    const total = threads.reduce(
      (n, t) => n + 1 + (Array.isArray(t.replies) ? t.replies.length : 0),
      0
    );
    if (headSub) {
      headSub.textContent = total === 0
        ? 'No comments yet'
        : `${total} comment${total === 1 ? '' : 's'}`;
    }

    if (!threads.length) {
      container.appendChild(
        el(
          'div',
          { class: 'hfm-pop__empty' },
          el('div', { class: 'hfm-pop__empty-title' }, 'No comments yet'),
          el('div', {}, 'Be the first.')
        )
      );
      return;
    }

    const list = el('ul', { class: 'hfm-pop__list' });
    threads.forEach((t) => list.appendChild(renderThread(t)));
    container.appendChild(list);
  }

  function renderThread(t) {
    const item = el('li', { class: 'hfm-pop__item', 'data-id': t.id });

    const head = el(
      'div',
      { class: 'hfm-pop__item-head' },
      el('div', { class: 'hfm-pop__item-author' }, t.author_name || 'Anonymous'),
      el('div', { class: 'hfm-pop__item-time' }, fmtTime(t.created_at))
    );
    item.appendChild(head);

    const bodyEl = el('div', { class: 'hfm-pop__item-body' });
    bodyEl.textContent = t.body || '';
    item.appendChild(bodyEl);

    if (Array.isArray(t.replies) && t.replies.length) {
      const replyWrap = el('div', { class: 'hfm-pop__replies' });
      t.replies.forEach((r) => {
        const reply = el('div', { class: 'hfm-pop__reply' });
        reply.appendChild(
          el(
            'div',
            { class: 'hfm-pop__reply-head' },
            el('div', { class: 'hfm-pop__reply-author' }, r.author_name || 'Anonymous'),
            el('div', { class: 'hfm-pop__reply-time' }, fmtTime(r.created_at))
          )
        );
        const rb = el('div', { class: 'hfm-pop__reply-body' });
        rb.textContent = r.body || '';
        reply.appendChild(rb);
        replyWrap.appendChild(reply);
      });
      item.appendChild(replyWrap);
    }

    return item;
  }

  // ── Open / close ──
  function closePopover() {
    if (!state.open) return;
    const { pop, pin } = state.open;
    pop.classList.remove('is-open');
    pin.btn.classList.remove('hfm-pin-btn--open');
    setTimeout(() => {
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    }, 160);
    state.open = null;
  }

  function openPopover(pin) {
    if (state.open && state.open.pin === pin) {
      closePopover();
      return;
    }
    if (state.open) closePopover();

    const built = buildPopover(pin);
    document.body.appendChild(built.pop);
    pin.btn.classList.add('hfm-pin-btn--open');

    // Position before showing, then animate in.
    positionPopover(built.pop, pin.btn);
    requestAnimationFrame(() => built.pop.classList.add('is-open'));

    state.open = {
      pop: built.pop,
      pin,
      refreshBody: built.refreshBody,
    };
  }

  // ── Pin mounting ──
  function mountPins() {
    const sections = Array.from(document.querySelectorAll('section'));
    sections.forEach((section, idx) => {
      // Only mount once per section.
      if (section.dataset.hfmPinned === '1') return;
      const { sectionId, label } = resolveSection(section, idx + 1);

      // Ensure the section can host an absolutely positioned child without breaking
      // its existing layout. If the section is already positioned (relative/absolute/
      // fixed/sticky) leave it; otherwise nudge it to relative.
      const computed = window.getComputedStyle(section);
      if (computed.position === 'static') {
        section.style.position = 'relative';
      }

      const btn = el('button', {
        class: 'hfm-pin-host hfm-pin-btn',
        type: 'button',
        'data-hfm-section': sectionId,
        title: `Comments · ${label}`,
        'aria-label': `Add a comment on ${label}.`,
      });
      btn.appendChild(commentBubbleSvg());
      const labelEl = el('span', { class: 'hfm-pin-btn__label' }, 'Comment');
      btn.appendChild(labelEl);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pin = state.pins.find((p) => p.btn === btn);
        if (pin) openPopover(pin);
      });

      section.appendChild(btn);
      section.dataset.hfmPinned = '1';

      const pin = { sectionId, label, section, btn, badge: null, label_el: labelEl };
      state.pins.push(pin);
      updatePinBadge(pin);
    });
  }

  // ── Data load + apply to pins ──
  async function refreshComments() {
    const res = await apiGet();
    if (res.error) {
      // Keep existing data; do not blow away pins on a transient failure.
      console.warn('[mockup-comments] could not fetch comments:', res.error);
      return false;
    }
    state.threads = Array.isArray(res.data) ? res.data : [];
    state.bySection = bucketBySection(state.threads);
    state.pins.forEach(updatePinBadge);
    if (state.open && typeof state.open.refreshBody === 'function') {
      state.open.refreshBody();
    }
    return true;
  }

  // ── First-visit nudge ──
  const NUDGE_KEY = 'hfm-comment-nudge-v1';
  const NUDGE_DELAY = 1500;
  let nudgeEl = null;
  let nudgeDismissed = false;

  function hideNudge() {
    if (nudgeDismissed) return;
    nudgeDismissed = true;
    try { localStorage.setItem(NUDGE_KEY, '1'); } catch { /* storage off */ }
    if (nudgeEl) nudgeEl.classList.remove('is-open');
  }

  function mountNudge() {
    try {
      if (localStorage.getItem(NUDGE_KEY) === '1') { nudgeDismissed = true; return; }
    } catch { /* storage off — show once per session */ }

    if (!state.pins.length) return;

    nudgeEl = el('div', {
      class: 'hfm-pin-host hfm-nudge',
      role: 'status',
      'aria-live': 'polite',
    });
    nudgeEl.innerHTML =
      '<svg class="hfm-nudge__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8.5L4 22V6a2 2 0 0 1 2-2z"/>' +
      '</svg>' +
      '<span class="hfm-nudge__text">Leave feedback — click any <b>Comment</b> pill</span>';

    const close = el(
      'button',
      { class: 'hfm-nudge__close', type: 'button', 'aria-label': 'Dismiss' },
      '×'
    );
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      hideNudge();
    });
    nudgeEl.appendChild(close);
    document.body.appendChild(nudgeEl);

    setTimeout(() => {
      if (!nudgeDismissed) nudgeEl.classList.add('is-open');
    }, NUDGE_DELAY);

    // First pin interaction = message received. Dismiss.
    document.addEventListener(
      'click',
      (e) => {
        if (nudgeDismissed) return;
        const pinBtn = e.target && e.target.closest && e.target.closest('.hfm-pin-btn');
        if (pinBtn) hideNudge();
      },
      true
    );
  }

  // ── Mount ──
  let mounted = false;
  function mount() {
    if (mounted) return;
    mounted = true;
    injectStyle();
    mountPins();
    mountNudge();
    refreshComments().catch(() => { /* logged in refreshComments */ });

    // Poll for new comments every 30s.
    setInterval(() => {
      refreshComments().catch(() => { /* logged */ });
    }, 30000);

    // Outside-click closes the popover.
    document.addEventListener('mousedown', (e) => {
      if (!state.open) return;
      const t = e.target;
      if (state.open.pop.contains(t)) return;
      if (state.open.pin.btn.contains(t)) return;
      closePopover();
    });

    // Esc closes the popover.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.open) closePopover();
    });

    // Reposition on resize / scroll while open.
    let rafId = null;
    const reposition = () => {
      if (!state.open) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        positionPopover(state.open.pop, state.open.pin.btn);
        rafId = null;
      });
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
