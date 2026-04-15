/**
 * portal-chat.js — HFU proposal concierge widget
 * ---------------------------------------------------------------
 * A single-file, dependency-free chat FAB. Inject with one tag:
 *    <script src="chat/portal-chat.js" defer></script>
 *
 * Honors the HFU logo mark on the launcher, streams responses from
 * /api/chat, and matches the Small College Consulting editorial brand language:
 * Roobert, ink + teal, generous whitespace.
 *
 * Keybindings:
 *   ⌘/Ctrl + K    toggle the panel
 *   Esc           close the panel
 *   Enter         send  (Shift+Enter = newline)
 */
(function () {
  'use strict';
  if (window.__sccHfuChatMounted) return;
  window.__sccHfuChatMounted = true;

  // ── tokens ────────────────────────────────────────────────
  const HFU_NAVY = '#0B2D5B';
  const HFU_NAVY_DEEP = '#061C3B';
  const TEAL = '#2E9E9E';
  const INK = '#0F1117';

  // ── markup helpers ────────────────────────────────────────
  const MARK_SVG = `
    <svg viewBox="40 38 105 120" aria-hidden="true" focusable="false">
      <path d="m47.3 88.7c4.2 14.2 11 27.4 20.4 39.5 6.4-8.2 13.8-15.4 22.1-21.6-17.4-11.9-34.3-16.4-42.5-17.9z"/>
      <path d="m94.3 106.5c8.3 6.1 15.8 13.4 22.1 21.6 9.4-12 16.2-25.3 20.4-39.5-8.3 1.6-25.2 6.1-42.5 17.9z"/>
      <path d="m92 108.1c-7.8 5.6-15.7 12.8-22.8 22 10.3 12.7 20.4 20 22.8 21.7 2.4-1.7 12.5-8.9 22.8-21.7-7.1-9.1-14.9-16.3-22.8-22z"/>
      <path d="m104.2 43.9-12.2 60.7-12.2-60.7z"/>
      <path d="m138.3 43.9-46.3 60.7 21.9-60.7z"/>
      <path d="m45.7 43.9 46.3 60.7-21.8-60.7z"/>
      <path d="m116.3 90c-15.3 7.7-24.3 14.6-24.3 14.6l46.3-48.7-.7 24.7s-7.5 2.5-21.3 9.4"/>
      <path d="m67.8 90c15.2 7.7 24.2 14.6 24.2 14.6l-46.3-48.7.7 24.7s7.6 2.5 21.4 9.4"/>
    </svg>`;

  const CLOSE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>`;
  const SEND_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.6 21.5 12 3.4 3.4l-.1 6.7L15 12 3.3 13.9z"/></svg>`;

  const SUGGESTED = [
    'What are the three pillars of the proposal?',
    'Walk me through the June to September 2026 timeline.',
    'How is the $145,000 base scope structured?',
    'Who are the four student personas?',
  ];

  // ── styles ────────────────────────────────────────────────
  const css = `
  .aos-chat, .aos-chat * { box-sizing: border-box; }
  .aos-chat {
    --aos-navy: ${HFU_NAVY};
    --aos-navy-deep: ${HFU_NAVY_DEEP};
    --aos-teal: ${TEAL};
    --aos-ink: ${INK};
    --aos-bg: #ffffff;
    --aos-border: #E6E8EC;
    --aos-muted: #6B7079;
    --aos-subtle: #9499A1;
    --aos-bubble-user: #0B2D5B;
    --aos-bubble-assist: #F4F5F7;
    font-family: 'Roobert', 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--aos-ink);
    position: fixed;
    inset: auto 0 0 auto;
    z-index: 2147483000;
    pointer-events: none;
    font-feature-settings: 'ss01', 'cv11';
  }
  .aos-chat * { pointer-events: auto; }

  /* ── Launcher (FAB) ─────────────────────────────────── */
  .aos-fab {
    position: fixed;
    right: 28px;
    bottom: 28px;
    width: 62px;
    height: 62px;
    border-radius: 999px;
    border: 0;
    cursor: pointer;
    padding: 0;
    background: radial-gradient(130% 130% at 30% 20%, #1A4B8A 0%, var(--aos-navy) 55%, var(--aos-navy-deep) 100%);
    color: #fff;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.15) inset,
      0 20px 40px -12px rgba(11,45,91,0.45),
      0 6px 18px -6px rgba(6,28,59,0.35),
      0 0 0 1px rgba(255,255,255,0.06);
    display: grid;
    place-items: center;
    transition: transform 240ms cubic-bezier(.2,.9,.3,1.4), box-shadow 240ms ease, background 240ms ease;
  }
  .aos-fab:hover { transform: translateY(-2px) scale(1.02); }
  .aos-fab:active { transform: translateY(0) scale(.98); }
  .aos-fab:focus-visible {
    outline: 2px solid var(--aos-teal);
    outline-offset: 4px;
  }
  .aos-fab svg { width: 40px; height: 40px; display: block; fill: #fff; color: #fff; }
  .aos-fab svg path { fill: #fff; }
  .aos-fab__mark { display: block; }
  .aos-fab__close { display: none; }
  .aos-chat[data-open="true"] .aos-fab__mark { display: none; }
  .aos-chat[data-open="true"] .aos-fab__close { display: block; }
  .aos-chat[data-open="true"] .aos-fab {
    transform: rotate(90deg) scale(.92);
  }

  /* ── Panel ──────────────────────────────────────────── */
  .aos-panel {
    position: fixed;
    right: 28px;
    bottom: 108px;
    width: 420px;
    max-width: calc(100vw - 32px);
    height: min(640px, calc(100vh - 140px));
    background: var(--aos-bg);
    border-radius: 22px;
    border: 1px solid var(--aos-border);
    box-shadow:
      0 40px 90px -28px rgba(11,45,91,0.30),
      0 18px 40px -16px rgba(6,28,59,0.22),
      0 0 0 1px rgba(11,45,91,0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateY(14px) scale(.98);
    transform-origin: 100% 100%;
    transition: opacity 220ms ease, transform 260ms cubic-bezier(.2,.9,.3,1.1), visibility 220ms;
    visibility: hidden;
  }
  .aos-chat[data-open="true"] .aos-panel {
    opacity: 1;
    transform: translateY(0) scale(1);
    visibility: visible;
  }

  /* ── Header ─────────────────────────────────────────── */
  .aos-header {
    position: relative;
    padding: 18px 20px 16px;
    background:
      radial-gradient(120% 120% at 10% 0%, rgba(27,122,134,0.22) 0%, rgba(27,122,134,0) 45%),
      linear-gradient(180deg, var(--aos-navy) 0%, var(--aos-navy-deep) 100%);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .aos-header::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  }
  .aos-header__mark {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255,255,255,0.08);
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .aos-header__mark svg { width: 26px; height: 26px; color: #fff; fill: #fff; }
  .aos-header__mark svg path { fill: #fff; }
  .aos-header__title {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    flex: 1;
    min-width: 0;
  }
  .aos-header__title b {
    font-weight: 600;
    font-size: 14.5px;
    letter-spacing: -0.005em;
  }
  .aos-header__title span {
    font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.58);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .aos-live {
    width: 6px; height: 6px; border-radius: 999px;
    background: #4ADE80;
    box-shadow: 0 0 0 3px rgba(74,222,128,0.22);
    animation: aosDot 2.2s ease-in-out infinite;
  }
  @keyframes aosDot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
  .aos-header__close {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 0;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    display: grid; place-items: center;
    transition: background 160ms ease, color 160ms ease;
  }
  .aos-header__close:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .aos-header__close svg { width: 16px; height: 16px; }

  /* ── Scroll area ────────────────────────────────────── */
  .aos-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 22px 20px 8px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(11,45,91,.18) transparent;
  }
  .aos-scroll::-webkit-scrollbar { width: 8px; }
  .aos-scroll::-webkit-scrollbar-thumb { background: rgba(11,45,91,.14); border-radius: 999px; }

  /* ── Empty state ────────────────────────────────────── */
  .aos-empty {
    padding: 6px 2px 0;
  }
  .aos-empty__eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--aos-teal);
    margin-bottom: 10px;
  }
  .aos-empty__title {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 22px;
    line-height: 1.25;
    color: var(--aos-ink);
    margin: 0 0 10px;
    letter-spacing: -0.01em;
  }
  .aos-empty__body {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--aos-muted);
    margin: 0 0 18px;
  }
  .aos-chips {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .aos-chip {
    text-align: left;
    background: #fff;
    border: 1px solid var(--aos-border);
    color: var(--aos-ink);
    padding: 11px 13px;
    border-radius: 12px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .aos-chip::before {
    content: '';
    width: 6px; height: 6px; border-radius: 999px;
    background: var(--aos-teal);
    flex-shrink: 0;
    opacity: .7;
  }
  .aos-chip:hover {
    border-color: rgba(11,45,91,0.3);
    background: #FAFBFC;
    transform: translateX(2px);
  }

  /* ── Messages ───────────────────────────────────────── */
  .aos-msg {
    display: flex;
    margin-bottom: 14px;
    animation: aosIn 260ms ease both;
  }
  @keyframes aosIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .aos-msg--user { justify-content: flex-end; }
  .aos-msg__bubble {
    max-width: 86%;
    padding: 11px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.55;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  .aos-msg--user .aos-msg__bubble {
    background: var(--aos-bubble-user);
    color: #fff;
    border-bottom-right-radius: 6px;
  }
  .aos-msg--assist .aos-msg__bubble {
    background: var(--aos-bubble-assist);
    color: var(--aos-ink);
    border-bottom-left-radius: 6px;
  }
  .aos-msg__bubble strong { font-weight: 600; }
  .aos-msg__bubble em { font-style: italic; }
  .aos-msg__bubble code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12.5px;
    background: rgba(11,45,91,0.08);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .aos-msg--user .aos-msg__bubble code {
    background: rgba(255,255,255,0.18);
    color: #fff;
  }
  .aos-msg__bubble ul, .aos-msg__bubble ol {
    margin: 6px 0 2px; padding-left: 20px;
  }
  .aos-msg__bubble li { margin-bottom: 3px; }
  .aos-msg__bubble p { margin: 0 0 8px; }
  .aos-msg__bubble p:last-child { margin-bottom: 0; }
  .aos-msg__bubble h1, .aos-msg__bubble h2, .aos-msg__bubble h3 {
    font-size: 14.5px;
    font-weight: 600;
    margin: 10px 0 4px;
  }
  .aos-cursor {
    display: inline-block;
    width: 7px; height: 14px;
    background: var(--aos-teal);
    vertical-align: -2px;
    margin-left: 2px;
    animation: aosBlink 1s steps(2) infinite;
    border-radius: 1px;
  }
  @keyframes aosBlink { 50% { opacity: 0; } }

  /* ── Error row ──────────────────────────────────────── */
  .aos-error {
    margin: 8px 0 14px;
    padding: 10px 12px;
    background: #FFF4F4;
    border: 1px solid #F5CDCD;
    color: #9A1F1F;
    border-radius: 10px;
    font-size: 12.5px;
    line-height: 1.5;
  }

  /* ── Composer ───────────────────────────────────────── */
  .aos-composer {
    padding: 14px 16px 14px;
    border-top: 1px solid var(--aos-border);
    background: #fff;
  }
  .aos-input-wrap {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: #F7F8FA;
    border: 1px solid var(--aos-border);
    border-radius: 14px;
    padding: 9px 9px 9px 14px;
    transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  }
  .aos-input-wrap:focus-within {
    border-color: var(--aos-navy);
    background: #fff;
    box-shadow: 0 0 0 4px rgba(11,45,91,0.07);
  }
  .aos-input {
    flex: 1;
    resize: none;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 14px;
    line-height: 1.5;
    color: var(--aos-ink);
    max-height: 140px;
    min-height: 22px;
    padding: 4px 0;
  }
  .aos-input::placeholder { color: var(--aos-subtle); }
  .aos-send {
    width: 34px; height: 34px;
    border-radius: 10px;
    border: 0;
    background: var(--aos-navy);
    color: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: background 160ms ease, transform 160ms ease, opacity 160ms ease;
  }
  .aos-send:hover:not(:disabled) { background: var(--aos-navy-deep); transform: translateY(-1px); }
  .aos-send:disabled { opacity: .35; cursor: not-allowed; }
  .aos-send svg { width: 16px; height: 16px; }
  .aos-foot {
    margin-top: 9px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 8.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--aos-subtle);
    text-align: center;
  }
  .aos-foot b { color: var(--aos-muted); font-weight: 500; }
  .aos-foot kbd {
    font-family: inherit;
    font-size: 8px;
    background: #F0F1F4;
    border: 1px solid var(--aos-border);
    border-radius: 3px;
    padding: 1px 4px;
    margin: 0 1px;
  }

  /* ── Mobile bottom sheet ────────────────────────────── */
  @media (max-width: 560px) {
    .aos-fab { right: 18px; bottom: 18px; width: 56px; height: 56px; }
    .aos-fab svg { width: 34px; height: 34px; }
    .aos-panel {
      right: 0; left: 0; bottom: 0;
      width: 100%; max-width: 100%;
      height: 88vh;
      border-radius: 20px 20px 0 0;
      border-bottom: 0;
    }
    .aos-chat[data-open="true"] .aos-fab { display: none; }
  }

  /* ── Dark mode (when host page is dark) ─────────────── */
  @media (prefers-color-scheme: dark) {
    .aos-panel {
      background: #11131A;
      border-color: rgba(255,255,255,0.08);
    }
    .aos-chat {
      --aos-bg: #11131A;
      --aos-ink: #ECEEF2;
      --aos-border: rgba(255,255,255,0.08);
      --aos-muted: #A2A8B2;
      --aos-subtle: #6B7079;
      --aos-bubble-assist: #1A1E28;
    }
    .aos-composer { background: #11131A; }
    .aos-input-wrap { background: #1A1E28; }
    .aos-input-wrap:focus-within { background: #1A1E28; }
    .aos-chip { background: #1A1E28; }
    .aos-chip:hover { background: #20242F; }
    .aos-foot kbd { background: #1A1E28; }
  }
  `;

  // ── minimal safe markdown renderer ────────────────────────
  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function renderMd(src) {
    let s = escapeHtml(src);
    // inline code first so ** inside code doesn't get bolded
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    // bold + italic
    s = s.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>');
    // simple bulleted lists: lines starting with "- " or "* "
    const lines = s.split('\n');
    const out = [];
    let inList = false;
    for (const ln of lines) {
      const m = ln.match(/^\s*[-*]\s+(.*)$/);
      if (m) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + m[1] + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push(ln);
      }
    }
    if (inList) out.push('</ul>');
    s = out.join('\n');
    // paragraphs — collapse double newlines
    s = s
      .split(/\n{2,}/)
      .map((p) => (/^<(ul|h\d|pre|blockquote)/.test(p.trim()) ? p : '<p>' + p.replace(/\n/g, '<br>') + '</p>'))
      .join('');
    return s;
  }

  // ── build DOM ────────────────────────────────────────────
  const root = document.createElement('div');
  root.className = 'aos-chat';
  root.setAttribute('data-open', 'false');
  root.innerHTML = `
    <div class="aos-panel" role="dialog" aria-modal="false" aria-label="Holy Family proposal concierge">
      <header class="aos-header">
        <div class="aos-header__mark">${MARK_SVG}</div>
        <div class="aos-header__title">
          <b>Ask the Proposal</b>
          <span><i class="aos-live"></i> Live · Small College Consulting concierge</span>
        </div>
        <button class="aos-header__close" type="button" aria-label="Close">${CLOSE_SVG}</button>
      </header>
      <div class="aos-scroll" aria-live="polite">
        <div class="aos-empty">
          <div class="aos-empty__eyebrow">Holy Family · RFP Concierge</div>
          <h2 class="aos-empty__title">Every answer, grounded in the proposal.</h2>
          <p class="aos-empty__body">Ask about the pillars, the timeline, the budget, the team, or anything in the 28-page response. I'll cite which section I'm pulling from.</p>
          <div class="aos-chips">
            ${SUGGESTED.map((q) => `<button class="aos-chip" type="button">${escapeHtml(q)}</button>`).join('')}
          </div>
        </div>
        <div class="aos-list"></div>
      </div>
      <div class="aos-composer">
        <form class="aos-input-wrap" novalidate>
          <textarea class="aos-input" rows="1" placeholder="Ask anything about the proposal…" aria-label="Message"></textarea>
          <button class="aos-send" type="submit" aria-label="Send" disabled>${SEND_SVG}</button>
        </form>
        <div class="aos-foot"><b>Enter</b> to send · <kbd>⌘K</kbd> to toggle · answers grounded in the site</div>
      </div>
    </div>
    <button class="aos-fab" type="button" aria-label="Open proposal concierge" aria-expanded="false">
      <span class="aos-fab__mark">${MARK_SVG}</span>
      <span class="aos-fab__close">${CLOSE_SVG}</span>
    </button>
  `;

  // inject styles + root
  const style = document.createElement('style');
  style.id = 'aos-chat-styles';
  style.textContent = css;
  document.head.appendChild(style);
  document.body.appendChild(root);

  // ── refs ──────────────────────────────────────────────────
  const panel = root.querySelector('.aos-panel');
  const fab = root.querySelector('.aos-fab');
  const closeBtn = root.querySelector('.aos-header__close');
  const scroll = root.querySelector('.aos-scroll');
  const empty = root.querySelector('.aos-empty');
  const list = root.querySelector('.aos-list');
  const form = root.querySelector('.aos-input-wrap');
  const input = root.querySelector('.aos-input');
  const sendBtn = root.querySelector('.aos-send');
  const chips = root.querySelectorAll('.aos-chip');

  // ── state ─────────────────────────────────────────────────
  const history = [];
  let streaming = false;

  // ── behavior ──────────────────────────────────────────────
  function openPanel() {
    root.setAttribute('data-open', 'true');
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus({ preventScroll: true }), 220);
  }
  function closePanel() {
    root.setAttribute('data-open', 'false');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus({ preventScroll: true });
  }
  function togglePanel() {
    root.getAttribute('data-open') === 'true' ? closePanel() : openPanel();
  }

  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.getAttribute('data-open') === 'true') {
      e.preventDefault();
      closePanel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePanel();
    }
  });

  // auto-grow textarea
  function autoGrow() {
    input.style.height = '22px';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    sendBtn.disabled = streaming || input.value.trim().length === 0;
  }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent.trim();
      autoGrow();
      submit();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  // ── message rendering ─────────────────────────────────────
  function addMessage(role, text) {
    if (empty.style.display !== 'none') empty.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = 'aos-msg aos-msg--' + (role === 'user' ? 'user' : 'assist');
    const bubble = document.createElement('div');
    bubble.className = 'aos-msg__bubble';
    bubble.innerHTML = role === 'user' ? escapeHtml(text) : renderMd(text);
    msg.appendChild(bubble);
    list.appendChild(msg);
    scroll.scrollTop = scroll.scrollHeight;
    return bubble;
  }

  function showError(text) {
    const row = document.createElement('div');
    row.className = 'aos-error';
    row.textContent = text;
    list.appendChild(row);
    scroll.scrollTop = scroll.scrollHeight;
  }

  // ── network ───────────────────────────────────────────────
  async function submit() {
    const text = input.value.trim();
    if (!text || streaming) return;

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    autoGrow();

    streaming = true;
    sendBtn.disabled = true;

    const bubble = addMessage('assistant', '');
    bubble.innerHTML = '<span class="aos-cursor"></span>';

    let acc = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        let detail = '';
        try { detail = (await res.json()).error || ''; } catch {}
        throw new Error(
          res.status === 500
            ? 'The concierge is offline. ' + (detail || 'Check the server logs.')
            : 'Network hiccup (' + res.status + '). Try again.'
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        bubble.innerHTML = renderMd(acc) + '<span class="aos-cursor"></span>';
        scroll.scrollTop = scroll.scrollHeight;
      }
      bubble.innerHTML = renderMd(acc);
      history.push({ role: 'assistant', content: acc });
    } catch (e) {
      bubble.remove();
      showError(String(e.message || e));
    } finally {
      streaming = false;
      autoGrow();
      input.focus({ preventScroll: true });
    }
  }
})();
