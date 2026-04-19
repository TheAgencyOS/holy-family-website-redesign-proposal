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

  // ── tokens ──────────────────────────────────────────────
  // Canonical values from tokens.css. HFU navy is kept for the FAB itself
  // (brand mark), every other surface aligns with the proposal's palette.
  const HFU_NAVY = '#0B2D5B';
  const HFU_NAVY_DEEP = '#061C3B';
  const TEAL = '#1B7A86';        // --teal  hsl(174 62% 27%)
  const TEAL_BRIGHT = '#3AA6B0'; // --teal-bright  hsl(174 55% 45%)
  const INK = '#1C1E24';         // --fg    hsl(220 13% 13%)

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
    'How can AI help us increase enrollment?',
    'How is a September 1st completion date possible?',
    'How will Small College Consulting provide support?',
  ];

  // ── styles ────────────────────────────────────────────────
  const css = `
  .aos-chat, .aos-chat * { box-sizing: border-box; }
  .aos-chat {
    /* Canonical palette mirrored from tokens.css (.hsl values inlined
       so the widget doesn't require tokens.css to be loaded). */
    --aos-navy: ${HFU_NAVY};
    --aos-navy-deep: ${HFU_NAVY_DEEP};
    --aos-teal: ${TEAL};
    --aos-teal-bright: ${TEAL_BRIGHT};
    --aos-ink: ${INK};
    --aos-bg: hsl(0 0% 100%);
    --aos-bg-warm: hsl(0 0% 98%);
    --aos-border: hsl(220 9% 90%);
    --aos-border-strong: hsl(220 9% 82%);
    --aos-text-2: hsl(220 9% 28%);
    --aos-text-3: hsl(220 8% 42%);
    --aos-text-4: hsl(220 7% 58%);
    --aos-bubble-user: ${HFU_NAVY};
    --aos-bubble-assist: hsl(220 20% 97%);
    /* Raycast-inspired shadow ladder (tokens.css --shadow-lg / --shadow-xl) */
    --aos-shadow-lg: 0 8px 32px rgba(28,30,36,0.06), 0 2px 8px rgba(28,30,36,0.03);
    --aos-shadow-xl: 0 24px 60px -12px rgba(28,30,36,0.18), 0 8px 20px -6px rgba(28,30,36,0.08), 0 0 0 1px rgba(28,30,36,0.04);
    --aos-shadow-fab: 0 1px 0 rgba(255,255,255,0.14) inset, 0 18px 40px -14px rgba(11,45,91,0.45), 0 6px 16px -6px rgba(6,28,59,0.35), 0 0 0 1px rgba(255,255,255,0.06);
    /* House easing (tokens.css --zen) */
    --aos-zen: cubic-bezier(0.22, 1, 0.36, 1);
    --aos-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
    color: var(--aos-ink);
    position: fixed;
    inset: auto 0 0 auto;
    z-index: 2147483000;
    pointer-events: none;
    font-feature-settings: 'ss01', 'ss02', 'cv11';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .aos-chat * { pointer-events: auto; }

  /* ── Launcher (FAB) ─────────────────────────────────── */
  .aos-fab {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    border: 0;
    cursor: pointer;
    padding: 0;
    background:
      radial-gradient(130% 130% at 28% 18%, #1E4F8E 0%, var(--aos-navy) 55%, var(--aos-navy-deep) 100%);
    color: #fff;
    box-shadow: var(--aos-shadow-fab);
    display: grid;
    place-items: center;
    transition:
      transform 260ms var(--aos-ease-spring),
      box-shadow 260ms var(--aos-zen),
      background 260ms var(--aos-zen);
  }
  .aos-fab:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.18) inset,
      0 26px 56px -18px rgba(11,45,91,0.55),
      0 10px 22px -8px rgba(6,28,59,0.42),
      0 0 0 1px rgba(255,255,255,0.08);
  }
  .aos-fab:active { transform: translateY(0) scale(.96); }
  .aos-fab:focus-visible {
    outline: none;
    box-shadow:
      var(--aos-shadow-fab),
      0 0 0 3px var(--aos-bg),
      0 0 0 5px var(--aos-teal);
  }
  .aos-fab svg { width: 32px; height: 32px; display: block; fill: #fff; color: #fff; }
  .aos-fab svg path { fill: #fff; }
  .aos-fab__mark { display: block; }
  .aos-fab__close { display: none; }
  .aos-chat[data-open="true"] .aos-fab__mark { display: none; }
  .aos-chat[data-open="true"] .aos-fab__close { display: block; }
  .aos-chat[data-open="true"] .aos-fab {
    transform: rotate(90deg) scale(.92);
  }

  /* ── First-visit nudge ──────────────────────────────── */
  .aos-nudge {
    position: fixed;
    right: 24px;
    bottom: 96px;
    width: 320px;
    max-width: calc(100vw - 32px);
    background: var(--aos-bg);
    border: 1px solid var(--aos-border);
    border-radius: 20px;
    padding: 18px 20px 16px;
    box-shadow: var(--aos-shadow-xl);
    opacity: 0;
    transform: translateY(10px) scale(.985);
    transform-origin: 92% 100%;
    transition:
      opacity 320ms var(--aos-zen),
      transform 360ms var(--aos-zen),
      visibility 320ms;
    visibility: hidden;
    pointer-events: none;
  }
  .aos-chat[data-nudge="true"] .aos-nudge {
    opacity: 1;
    transform: translateY(0) scale(1);
    visibility: visible;
    pointer-events: auto;
  }
  .aos-chat[data-open="true"] .aos-nudge {
    opacity: 0;
    transform: translateY(8px) scale(.98);
    visibility: hidden;
    pointer-events: none;
  }
  .aos-nudge::after {
    content: '';
    position: absolute;
    bottom: -7px;
    right: 20px;
    width: 14px;
    height: 14px;
    background: var(--aos-bg);
    transform: rotate(45deg);
    border-right: 1px solid var(--aos-border);
    border-bottom: 1px solid var(--aos-border);
  }
  .aos-nudge__head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .aos-nudge__mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(180deg, var(--aos-navy) 0%, var(--aos-navy-deep) 100%);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    box-shadow: 0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px -2px rgba(11,45,91,0.38);
  }
  .aos-nudge__mark svg { width: 18px; height: 18px; }
  .aos-nudge__mark svg path { fill: #fff; }
  .aos-nudge__eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--aos-teal);
    flex: 1;
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 500;
  }
  .aos-nudge__eyebrow i {
    width: 5px; height: 5px; border-radius: 9999px;
    background: var(--aos-teal);
    box-shadow: 0 0 0 3px rgba(27,122,134,0.20);
    animation: aosDot 2.2s ease-in-out infinite;
  }
  .aos-nudge__close {
    width: 24px; height: 24px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    color: var(--aos-text-4);
    cursor: pointer;
    display: grid; place-items: center;
    transition: background 160ms var(--aos-zen), color 160ms var(--aos-zen);
  }
  .aos-nudge__close:hover { background: var(--aos-bubble-assist); color: var(--aos-ink); }
  .aos-nudge__close svg { width: 12px; height: 12px; }
  .aos-nudge__title {
    font-family: 'Instrument Serif', 'New York', Georgia, 'Times New Roman', serif;
    font-size: 20px;
    line-height: 1.2;
    color: var(--aos-ink);
    margin: 0 0 8px;
    letter-spacing: -0.015em;
    font-weight: 400;
  }
  .aos-nudge__body {
    font-size: 13px;
    line-height: 1.55;
    color: var(--aos-text-3);
    margin: 0 0 14px;
    letter-spacing: -0.005em;
  }
  .aos-nudge__chips {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .aos-nudge__chip {
    text-align: left;
    background: var(--aos-bg);
    border: 1px solid var(--aos-border);
    color: var(--aos-ink);
    padding: 10px 12px;
    border-radius: 10px;
    font: inherit;
    font-size: 12.5px;
    line-height: 1.4;
    cursor: pointer;
    transition:
      border-color 180ms var(--aos-zen),
      background 180ms var(--aos-zen),
      transform 180ms var(--aos-zen),
      box-shadow 180ms var(--aos-zen);
    display: flex;
    align-items: center;
    gap: 9px;
    letter-spacing: -0.005em;
  }
  .aos-nudge__chip::before {
    content: '';
    width: 5px; height: 5px; border-radius: 9999px;
    background: var(--aos-teal);
    flex-shrink: 0;
    opacity: .85;
    transition: transform 180ms var(--aos-zen);
  }
  .aos-nudge__chip:hover {
    border-color: var(--aos-border-strong);
    background: var(--aos-bg-warm);
    transform: translateX(2px);
    box-shadow: 0 1px 3px rgba(28,30,36,0.04);
  }
  .aos-nudge__chip:hover::before { transform: scale(1.25); }

  /* Subtle pulse ring on the FAB while the nudge is visible */
  .aos-chat[data-nudge="true"] .aos-fab::before {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 9999px;
    border: 2px solid var(--aos-teal);
    opacity: 0;
    animation: aosPulse 2.6s var(--aos-ease-spring) infinite;
    pointer-events: none;
  }
  @keyframes aosPulse {
    0%   { opacity: .50; transform: scale(1); }
    70%  { opacity: 0;   transform: scale(1.4); }
    100% { opacity: 0;   transform: scale(1.4); }
  }

  @media (prefers-reduced-motion: reduce) {
    .aos-nudge { transition: opacity 160ms ease, visibility 160ms; transform: none !important; }
    .aos-chat[data-nudge="true"] .aos-fab::before { animation: none; }
  }

  /* ── Panel ──────────────────────────────────────────── */
  .aos-panel {
    position: fixed;
    right: 24px;
    bottom: 96px;
    width: 416px;
    max-width: calc(100vw - 32px);
    height: min(640px, calc(100vh - 140px));
    background: var(--aos-bg);
    border-radius: 20px;
    border: 1px solid var(--aos-border);
    box-shadow: var(--aos-shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px) scale(.985);
    transform-origin: 100% 100%;
    transition:
      opacity 220ms var(--aos-zen),
      transform 280ms var(--aos-zen),
      visibility 220ms;
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
    padding: 20px 20px 16px;
    background:
      radial-gradient(120% 140% at 8% -10%, rgba(27,122,134,0.28) 0%, rgba(27,122,134,0) 50%),
      linear-gradient(180deg, var(--aos-navy) 0%, var(--aos-navy-deep) 100%);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .aos-header::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%);
  }
  .aos-header__mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255,255,255,0.08);
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .aos-header__mark svg { width: 24px; height: 24px; color: #fff; fill: #fff; }
  .aos-header__mark svg path { fill: #fff; }
  .aos-header__title {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    flex: 1;
    min-width: 0;
  }
  .aos-header__title b {
    font-weight: 500;
    font-size: 15px;
    letter-spacing: -0.01em;
    color: #fff;
  }
  .aos-header__title span {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.60);
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 500;
  }
  .aos-live {
    width: 6px; height: 6px; border-radius: 9999px;
    background: #4ADE80;
    box-shadow: 0 0 0 3px rgba(74,222,128,0.22);
    animation: aosDot 2.2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes aosDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.9); } }
  .aos-header__close {
    width: 30px; height: 30px;
    border-radius: 8px;
    border: 0;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    display: grid; place-items: center;
    transition: background 160ms var(--aos-zen), color 160ms var(--aos-zen), transform 160ms var(--aos-zen);
    flex-shrink: 0;
  }
  .aos-header__close:hover { background: rgba(255,255,255,0.14); color: #fff; transform: scale(1.04); }
  .aos-header__close:active { transform: scale(.96); }
  .aos-header__close svg { width: 14px; height: 14px; }

  /* ── Scroll area ────────────────────────────────────── */
  .aos-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px 8px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: hsl(220 9% 82%) transparent;
  }
  .aos-scroll::-webkit-scrollbar { width: 8px; }
  .aos-scroll::-webkit-scrollbar-thumb { background: hsl(220 9% 85%); border-radius: 9999px; border: 2px solid var(--aos-bg); }
  .aos-scroll::-webkit-scrollbar-thumb:hover { background: hsl(220 9% 75%); }

  /* ── Empty state ────────────────────────────────────── */
  .aos-empty {
    padding: 4px 2px 0;
  }
  .aos-empty__eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--aos-teal);
    margin-bottom: 12px;
    font-weight: 500;
  }
  .aos-empty__title {
    font-family: 'Instrument Serif', 'New York', Georgia, 'Times New Roman', serif;
    font-size: 24px;
    line-height: 1.2;
    color: var(--aos-ink);
    margin: 0 0 10px;
    letter-spacing: -0.015em;
    font-weight: 400;
  }
  .aos-empty__body {
    font-size: 14px;
    line-height: 1.55;
    color: var(--aos-text-3);
    margin: 0 0 20px;
    letter-spacing: -0.005em;
  }
  .aos-chips {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .aos-chip {
    text-align: left;
    background: var(--aos-bg);
    border: 1px solid var(--aos-border);
    color: var(--aos-ink);
    padding: 12px 14px;
    border-radius: 12px;
    font: inherit;
    font-size: 13px;
    line-height: 1.4;
    cursor: pointer;
    transition:
      border-color 180ms var(--aos-zen),
      background 180ms var(--aos-zen),
      transform 180ms var(--aos-zen),
      box-shadow 180ms var(--aos-zen);
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.005em;
  }
  .aos-chip::before {
    content: '';
    width: 5px; height: 5px; border-radius: 9999px;
    background: var(--aos-teal);
    flex-shrink: 0;
    opacity: .85;
    transition: transform 180ms var(--aos-zen), opacity 180ms var(--aos-zen);
  }
  .aos-chip:hover {
    border-color: var(--aos-border-strong);
    background: var(--aos-bg-warm);
    transform: translateX(2px);
    box-shadow: 0 1px 3px rgba(28,30,36,0.04), 0 1px 2px rgba(28,30,36,0.02);
  }
  .aos-chip:hover::before { opacity: 1; transform: scale(1.2); }
  .aos-chip:active { transform: translateX(2px) scale(.99); }
  .aos-chip:focus-visible {
    outline: none;
    border-color: var(--aos-teal);
    box-shadow: 0 0 0 3px rgba(27,122,134,0.15);
  }

  /* ── Messages ───────────────────────────────────────── */
  .aos-msg {
    display: flex;
    margin-bottom: 12px;
    animation: aosIn 280ms var(--aos-zen) both;
  }
  @keyframes aosIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .aos-msg--user { justify-content: flex-end; }
  .aos-msg__bubble {
    max-width: 86%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.55;
    word-wrap: break-word;
    white-space: pre-wrap;
    letter-spacing: -0.005em;
  }
  .aos-msg--user .aos-msg__bubble {
    background: var(--aos-bubble-user);
    color: #fff;
    border-bottom-right-radius: 6px;
    box-shadow: 0 1px 2px rgba(11,45,91,0.12);
  }
  .aos-msg--assist .aos-msg__bubble {
    background: var(--aos-bubble-assist);
    color: var(--aos-ink);
    border-bottom-left-radius: 6px;
  }
  .aos-msg__bubble strong { font-weight: 600; color: var(--aos-ink); }
  .aos-msg--user .aos-msg__bubble strong { color: #fff; }
  .aos-msg__bubble em { font-style: italic; }
  .aos-msg__bubble code {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 12.5px;
    background: rgba(28,30,36,0.06);
    padding: 1px 6px;
    border-radius: 4px;
    letter-spacing: 0;
  }
  .aos-msg--user .aos-msg__bubble code {
    background: rgba(255,255,255,0.18);
    color: #fff;
  }
  .aos-msg__bubble ul, .aos-msg__bubble ol {
    margin: 8px 0 4px; padding-left: 20px;
  }
  .aos-msg__bubble li { margin-bottom: 4px; }
  .aos-msg__bubble p { margin: 0 0 8px; }
  .aos-msg__bubble p:last-child { margin-bottom: 0; }
  .aos-msg__bubble h1, .aos-msg__bubble h2, .aos-msg__bubble h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 12px 0 4px;
    letter-spacing: -0.01em;
  }
  .aos-cursor {
    display: inline-block;
    width: 6px; height: 14px;
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
    background: hsl(0 78% 98%);
    border: 1px solid hsl(0 70% 90%);
    color: hsl(0 68% 38%);
    border-radius: 12px;
    font-size: 12.5px;
    line-height: 1.5;
    letter-spacing: -0.003em;
  }

  /* ── Composer ───────────────────────────────────────── */
  .aos-composer {
    padding: 12px 16px 14px;
    border-top: 1px solid var(--aos-border);
    background: var(--aos-bg);
  }
  .aos-input-wrap {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--aos-bubble-assist);
    border: 1px solid var(--aos-border);
    border-radius: 14px;
    padding: 8px 8px 8px 14px;
    transition:
      border-color 180ms var(--aos-zen),
      background 180ms var(--aos-zen),
      box-shadow 180ms var(--aos-zen);
  }
  .aos-input-wrap:focus-within {
    border-color: var(--aos-teal);
    background: var(--aos-bg);
    box-shadow: 0 0 0 3px rgba(27,122,134,0.14);
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
    padding: 6px 0;
    letter-spacing: -0.005em;
  }
  .aos-input::placeholder { color: var(--aos-text-4); }
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
    box-shadow: 0 1px 2px rgba(11,45,91,0.18);
    transition:
      background 180ms var(--aos-zen),
      transform 180ms var(--aos-zen),
      opacity 180ms var(--aos-zen),
      box-shadow 180ms var(--aos-zen);
  }
  .aos-send:hover:not(:disabled) {
    background: var(--aos-navy-deep);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px -2px rgba(11,45,91,0.32), 0 2px 4px rgba(11,45,91,0.18);
  }
  .aos-send:active:not(:disabled) { transform: translateY(0); }
  .aos-send:disabled { opacity: .30; cursor: not-allowed; box-shadow: none; }
  .aos-send svg { width: 15px; height: 15px; }
  .aos-foot {
    margin-top: 10px;
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--aos-text-4);
    text-align: center;
    font-weight: 500;
  }
  .aos-foot b { color: var(--aos-text-3); font-weight: 500; }
  .aos-foot kbd {
    font-family: inherit;
    font-size: 8.5px;
    background: var(--aos-bubble-assist);
    border: 1px solid var(--aos-border);
    border-radius: 4px;
    padding: 2px 5px;
    margin: 0 2px;
    color: var(--aos-text-3);
  }

  /* ── Mobile bottom sheet ────────────────────────────── */
  @media (max-width: 560px) {
    .aos-fab { right: 16px; bottom: 16px; width: 56px; height: 56px; }
    .aos-fab svg { width: 32px; height: 32px; }
    .aos-panel {
      right: 0; left: 0; bottom: 0;
      width: 100%; max-width: 100%;
      height: 88vh;
      border-radius: 20px 20px 0 0;
      border-bottom: 0;
    }
    .aos-chat[data-open="true"] .aos-fab { display: none; }
    .aos-nudge {
      right: 14px;
      bottom: 86px;
      width: auto;
      left: 14px;
      max-width: none;
    }
    .aos-nudge::after { right: 26px; }
  }

  /* ── Dark mode (when host page is dark) ─────────────── */
  @media (prefers-color-scheme: dark) {
    .aos-chat {
      --aos-bg: hsl(220 15% 10%);
      --aos-bg-warm: hsl(220 15% 13%);
      --aos-ink: hsl(220 15% 93%);
      --aos-border: hsl(220 10% 20%);
      --aos-border-strong: hsl(220 10% 26%);
      --aos-text-2: hsl(220 10% 72%);
      --aos-text-3: hsl(220 8% 58%);
      --aos-text-4: hsl(220 8% 42%);
      --aos-bubble-assist: hsl(220 15% 14%);
      --aos-shadow-xl:
        0 24px 60px -12px rgba(0,0,0,0.60),
        0 8px 20px -6px rgba(0,0,0,0.40),
        0 0 0 1px rgba(255,255,255,0.04);
    }
    .aos-panel {
      background: var(--aos-bg);
      border-color: var(--aos-border);
    }
    .aos-composer { background: var(--aos-bg); }
    .aos-input-wrap { background: var(--aos-bg-warm); }
    .aos-input-wrap:focus-within { background: var(--aos-bg-warm); }
    .aos-chip { background: var(--aos-bg-warm); }
    .aos-chip:hover { background: hsl(220 15% 16%); }
    .aos-foot kbd { background: var(--aos-bg-warm); }
    .aos-nudge { background: var(--aos-bg); }
    .aos-nudge::after { background: var(--aos-bg); }
    .aos-nudge__chip { background: var(--aos-bg-warm); }
    .aos-nudge__chip:hover { background: hsl(220 15% 16%); }
    .aos-nudge__close:hover { background: var(--aos-bg-warm); color: var(--aos-ink); }
    .aos-msg__bubble code { background: rgba(255,255,255,0.07); }
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
    <aside class="aos-nudge" role="region" aria-label="Proposal concierge introduction">
      <div class="aos-nudge__head">
        <div class="aos-nudge__mark">${MARK_SVG}</div>
        <div class="aos-nudge__eyebrow"><i></i> New · Proposal concierge</div>
        <button class="aos-nudge__close" type="button" aria-label="Dismiss">${CLOSE_SVG}</button>
      </div>
      <h3 class="aos-nudge__title">Ask anything about this proposal.</h3>
      <p class="aos-nudge__body">Timeline, budget, the three pillars, how Phase 1 ships — grounded in every page of the response. Try one:</p>
      <div class="aos-nudge__chips">
        ${SUGGESTED.map((q) => `<button class="aos-nudge__chip" type="button">${escapeHtml(q)}</button>`).join('')}
      </div>
    </aside>
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
  const nudge = root.querySelector('.aos-nudge');
  const nudgeClose = root.querySelector('.aos-nudge__close');
  const nudgeChips = root.querySelectorAll('.aos-nudge__chip');

  // ── state ─────────────────────────────────────────────────
  const history = [];
  let streaming = false;

  // ── first-visit nudge ─────────────────────────────────────
  const NUDGE_KEY = 'aos-hfu-nudge-v1';
  const NUDGE_DELAY = 2500;
  let nudgeDismissed = false;

  function hideNudge() {
    if (nudgeDismissed) return;
    nudgeDismissed = true;
    root.setAttribute('data-nudge', 'false');
    try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {}
  }
  function showNudge() {
    if (nudgeDismissed) return;
    if (root.getAttribute('data-open') === 'true') return;
    root.setAttribute('data-nudge', 'true');
  }
  try {
    if (localStorage.getItem(NUDGE_KEY) === '1') nudgeDismissed = true;
  } catch (e) {}
  if (!nudgeDismissed) {
    setTimeout(showNudge, NUDGE_DELAY);
  }

  nudgeClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hideNudge();
  });
  nudgeChips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const q = chip.textContent.trim();
      hideNudge();
      window.hfuChat.ask(q);
    });
  });
  document.addEventListener('click', (e) => {
    if (nudgeDismissed) return;
    if (root.getAttribute('data-nudge') !== 'true') return;
    if (nudge.contains(e.target) || fab.contains(e.target)) return;
    hideNudge();
  });

  // ── behavior ──────────────────────────────────────────────
  function openPanel() {
    hideNudge();
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
      return;
    }
    if (e.key === 'Escape' && root.getAttribute('data-nudge') === 'true') {
      e.preventDefault();
      hideNudge();
      return;
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

  // ── public API ───────────────────────────────────────────
  // Lets page-level buttons trigger the concierge with a seeded prompt.
  //   window.hfuChat.open()
  //   window.hfuChat.ask('How do you help us capture a lead?')
  window.hfuChat = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    ask(prompt) {
      if (!prompt) return;
      openPanel();
      // If a prior message is streaming, wait briefly.
      const fire = () => {
        if (streaming) { setTimeout(fire, 120); return; }
        input.value = prompt;
        autoGrow();
        submit();
      };
      // Let the panel open animation settle before injecting.
      setTimeout(fire, 240);
    },
  };
})();
