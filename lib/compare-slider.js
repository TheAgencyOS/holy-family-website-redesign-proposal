/**
 * lib/compare-slider.js · before/after modal for mockup pages.
 *
 * Loaded by mockups-portal.html. Exposes a single function on window:
 *   window.HfmCompare.open(slug)
 *   window.HfmCompare.has(slug)  -> bool
 *
 * Shows a fullscreen modal with two pinned screenshots (current vs proposed)
 * separated by a draggable divider. Pointer drag, keyboard left/right, and
 * tap on either half all reposition the divider. Esc closes.
 *
 * Screenshots are matched in TOP-ALIGNED / COVER fashion so a tall current
 * capture and a 1440x900 proposed capture compare above-fold consistently.
 */

(function () {
  'use strict';

  const MAP = {
    'home': {
      before: 'assets/hfu-live/holyfamily-edu-home.png',
      after:  'assets/mockups-current/home.png',
      beforeLabel: 'holyfamily.edu today',
      afterLabel:  'Proposed home',
      note: 'Above-fold capture, 1440&thinsp;px desktop'
    },
    'programs': {
      before: 'assets/screenshots/hfu-academics.png',
      after:  'assets/mockups-current/programs.png',
      beforeLabel: 'Academics page today',
      afterLabel:  'Proposed programs finder',
      note: 'Current /academics vs proposed /programs. Top-aligned for hero comparison.'
    },
    'bsn': {
      before: 'assets/screenshots/hfu-nursing.png',
      after:  'assets/mockups-current/bsn.png',
      beforeLabel: 'Current nursing page',
      afterLabel:  'Proposed BSN template',
      note: 'Program-level page, current Drupal vs proposed.'
    },
    'admissions': {
      before: 'assets/screenshots/hfu-admissions.png',
      after:  'assets/mockups-current/admissions.png',
      beforeLabel: 'Current admissions',
      afterLabel:  'Proposed admissions',
      note: 'Top-of-funnel landing, current vs proposed.'
    }
  };

  const css = `
    .hfm-compare {
      position: fixed; inset: 0; z-index: 2147483500;
      background: rgba(6, 14, 22, 0.86);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center; justify-content: center;
      padding: 56px 40px 88px;
      animation: hfm-cmp-fade 180ms ease-out;
    }
    .hfm-compare.is-open { display: flex; }
    @keyframes hfm-cmp-fade { from { opacity: 0; } to { opacity: 1; } }

    .hfm-compare__shell {
      position: relative;
      width: 100%; max-width: 1440px;
      aspect-ratio: 1440 / 900;
      max-height: calc(100vh - 160px);
      background: #0b0e13;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4);
      user-select: none;
      touch-action: none;
    }

    .hfm-compare__img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; object-position: top center;
      display: block;
      pointer-events: none;
    }

    .hfm-compare__clip {
      position: absolute; top: 0; left: 0; bottom: 0;
      overflow: hidden;
      will-change: width;
    }
    .hfm-compare__clip .hfm-compare__img {
      width: var(--hfm-base-w, 100%);
      object-position: top left;
    }

    .hfm-compare__handle {
      position: absolute; top: 0; bottom: 0;
      width: 2px; background: #fff;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.4);
      transform: translateX(-50%);
      cursor: ew-resize;
      touch-action: none;
    }
    .hfm-compare__handle::before,
    .hfm-compare__handle::after {
      content: ''; position: absolute; top: 50%; width: 0; height: 0;
      border-top: 6px solid transparent; border-bottom: 6px solid transparent;
      transform: translateY(-50%);
    }
    .hfm-compare__handle::before { right: 14px; border-right: 8px solid #fff; }
    .hfm-compare__handle::after  { left: 14px;  border-left: 8px solid #fff; }
    .hfm-compare__knob {
      position: absolute; top: 50%; left: 50%;
      width: 44px; height: 44px;
      border-radius: 999px;
      background: #fff;
      transform: translate(-50%, -50%);
      box-shadow: 0 4px 16px rgba(0,0,0,0.45);
      display: grid; place-items: center;
      font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: 0.08em; color: #0b0e13;
      font-weight: 600;
    }

    .hfm-compare__label {
      position: absolute; top: 16px;
      font: 10.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #fff;
      padding: 7px 12px;
      background: rgba(11, 14, 19, 0.82);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 999px;
      backdrop-filter: blur(4px);
      pointer-events: none;
    }
    .hfm-compare__label--before { left: 16px; }
    .hfm-compare__label--after  { right: 16px; }

    .hfm-compare__toolbar {
      position: absolute; left: 0; right: 0; bottom: -72px;
      display: flex; gap: 18px; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.75);
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: 0.04em;
    }
    .hfm-compare__toolbar kbd {
      display: inline-block;
      padding: 3px 7px;
      border: 1px solid rgba(255,255,255,0.24);
      border-radius: 4px;
      background: rgba(255,255,255,0.05);
      color: #fff;
      font: inherit;
      margin: 0 2px;
    }

    .hfm-compare__note {
      position: absolute; left: 0; right: 0; top: -42px;
      text-align: center;
      color: rgba(255,255,255,0.66);
      font: 11.5px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: 0.04em;
    }

    .hfm-compare__close {
      position: fixed; top: 20px; right: 24px;
      width: 40px; height: 40px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      color: #fff;
      font: 18px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      cursor: pointer;
      display: grid; place-items: center;
    }
    .hfm-compare__close:hover { background: rgba(255,255,255,0.14); }
    .hfm-compare__close:focus-visible {
      outline: 2px solid #FFCC15; outline-offset: 2px;
    }

    @media (max-width: 820px) {
      .hfm-compare { padding: 24px 12px 80px; }
      .hfm-compare__label { top: 10px; font-size: 9.5px; padding: 6px 10px; }
      .hfm-compare__toolbar { bottom: -64px; font-size: 11px; }
      .hfm-compare__note { top: -34px; font-size: 10.5px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .hfm-compare { animation: none; }
    }
  `;

  function injectStyles() {
    if (document.querySelector('style[data-hfm-compare]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-hfm-compare', '');
    s.textContent = css;
    document.head.appendChild(s);
  }

  let modal = null;
  let shell = null;
  let handle = null;
  let clip = null;
  let baseImg = null;
  let clipImg = null;
  let pct = 50;

  function ensureModal() {
    if (modal) return;
    injectStyles();

    modal = document.createElement('div');
    modal.className = 'hfm-compare';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Before and after comparison');

    modal.innerHTML = `
      <button class="hfm-compare__close" aria-label="Close comparison">&times;</button>
      <div class="hfm-compare__shell" tabindex="0">
        <div class="hfm-compare__note" data-role="note"></div>
        <img class="hfm-compare__img" data-role="after" alt="">
        <div class="hfm-compare__clip" data-role="clip">
          <img class="hfm-compare__img" data-role="before" alt="">
        </div>
        <span class="hfm-compare__label hfm-compare__label--before" data-role="before-label">Before</span>
        <span class="hfm-compare__label hfm-compare__label--after"  data-role="after-label">After</span>
        <div class="hfm-compare__handle" data-role="handle" role="slider" tabindex="0"
             aria-label="Compare position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <div class="hfm-compare__knob">↔</div>
        </div>
        <div class="hfm-compare__toolbar">
          <span>Drag divider</span>
          <span><kbd>←</kbd><kbd>→</kbd> nudge</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    shell   = modal.querySelector('.hfm-compare__shell');
    handle  = modal.querySelector('[data-role=handle]');
    clip    = modal.querySelector('[data-role=clip]');
    baseImg = modal.querySelector('[data-role=after]');
    clipImg = modal.querySelector('[data-role=before]');

    modal.querySelector('.hfm-compare__close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    document.addEventListener('keydown', onKey);

    shell.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointerdown', onPointerDown);
  }

  function setPct(next) {
    pct = Math.max(0, Math.min(100, next));
    const rect = shell.getBoundingClientRect();
    const pxW = rect.width;
    clip.style.width = (pxW * pct / 100) + 'px';
    clip.style.setProperty('--hfm-base-w', pxW + 'px');
    handle.style.left = pct + '%';
    handle.setAttribute('aria-valuenow', Math.round(pct));
  }

  function onResize() {
    if (!modal || !modal.classList.contains('is-open')) return;
    setPct(pct);
  }

  function onPointerDown(e) {
    if (!modal.classList.contains('is-open')) return;
    e.preventDefault();
    shell.setPointerCapture && shell.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
    const onMove = (ev) => moveTo(ev.clientX);
    const onUp   = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function moveTo(clientX) {
    const rect = shell.getBoundingClientRect();
    const relX = clientX - rect.left;
    setPct((relX / rect.width) * 100);
  }

  function onKey(e) {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft')  { setPct(pct - (e.shiftKey ? 10 : 2)); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPct(pct + (e.shiftKey ? 10 : 2)); e.preventDefault(); }
  }

  function open(slug) {
    const entry = MAP[slug];
    if (!entry) return false;
    ensureModal();

    modal.querySelector('[data-role=before-label]').textContent = entry.beforeLabel;
    modal.querySelector('[data-role=after-label]').textContent  = entry.afterLabel;
    modal.querySelector('[data-role=note]').innerHTML = entry.note || '';

    baseImg.alt = entry.afterLabel;
    clipImg.alt = entry.beforeLabel;
    baseImg.src = entry.after;
    clipImg.src = entry.before;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', onResize);

    requestAnimationFrame(() => {
      setPct(50);
      shell.focus({ preventScroll: true });
    });
    return true;
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    window.removeEventListener('resize', onResize);
  }

  function has(slug) { return Object.prototype.hasOwnProperty.call(MAP, slug); }

  window.HfmCompare = { open, close, has };
})();
