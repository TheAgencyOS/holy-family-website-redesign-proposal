/**
 * lib/inspect-token.js · hover-to-reveal design tokens in a mockup.
 *
 * Loaded at the bottom of each mockup page:
 *   <script type="module" src="../lib/inspect-token.js"></script>
 *
 * Controlled from the parent portal via postMessage:
 *   window.postMessage({ type: 'hfm:inspect', on: true }, '*')
 *
 * Behavior when on:
 *   - Cursor becomes crosshair.
 *   - Hovering any element outlines it and shows a HUD card at the pointer
 *     that maps computed color, typography, radius, spacing, and shadow
 *     back to the token names declared in this page's :root block.
 *   - Click to pin the HUD. Click again (or Esc) to unpin. Esc also exits.
 *
 * All UI is prefixed .hfm-inspect-* and sits on z-index 2147483600 so it
 * never collides with the comment pins or the chat FAB.
 */

(function () {
  'use strict';

  if (window.__hfmInspectLoaded) return;
  window.__hfmInspectLoaded = true;

  // ═════════════════════════════════════════════════════════════════════
  // Token registry: parse :root custom properties from all same-origin
  // stylesheets, classify, and build reverse lookup indices.
  // ═════════════════════════════════════════════════════════════════════

  const tokens = {};            // name -> { raw, kind, rgb?, px?, font? }
  const colorIndex = new Map(); // "r,g,b"   -> [names]
  const fontIndex  = new Map(); // "primary" -> [names]
  const lengthIndex = new Map();// "Npx"     -> [names]

  const pushIndex = (map, key, name) => {
    if (!map.has(key)) map.set(key, []);
    const arr = map.get(key);
    if (!arr.includes(name)) arr.push(name);
  };

  function hslTripleToRgb(str) {
    const m = str.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/);
    if (!m) return null;
    const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      return [parseInt(clean[0] + clean[0], 16), parseInt(clean[1] + clean[1], 16), parseInt(clean[2] + clean[2], 16)];
    }
    if (clean.length === 6) {
      return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
    }
    return null;
  }

  function parseLengthPx(str) {
    const s = str.trim();
    const m = s.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)$/);
    if (!m) return null;
    const n = +m[1];
    const unit = m[2];
    if (unit === 'px') return n;
    if (unit === 'rem' || unit === 'em') return n * 16;
    return null;
  }

  function parsePrimaryFont(str) {
    // e.g. "'Source Serif 4', 'Times New Roman', serif" → "source serif 4"
    const first = str.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    if (!first) return null;
    return first.toLowerCase();
  }

  function classifyToken(name, raw) {
    const v = raw.trim();

    // Color: HSL triple
    const rgbFromHsl = hslTripleToRgb(v);
    if (rgbFromHsl) {
      const key = rgbFromHsl.join(',');
      tokens[name] = { raw: v, kind: 'color-hsl', rgb: rgbFromHsl };
      pushIndex(colorIndex, key, name);
      return;
    }

    // Color: hex
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      const rgb = hexToRgb(v);
      if (rgb) {
        tokens[name] = { raw: v, kind: 'color-hex', rgb };
        pushIndex(colorIndex, rgb.join(','), name);
        return;
      }
    }

    // Length
    const px = parseLengthPx(v);
    if (px !== null) {
      tokens[name] = { raw: v, kind: 'length', px };
      pushIndex(lengthIndex, px + 'px', name);
      return;
    }

    // Font stack
    if (/['",]|serif|sans-serif|monospace/i.test(v) && !/\d+(px|rem|em|%)/.test(v)) {
      const primary = parsePrimaryFont(v);
      if (primary) {
        tokens[name] = { raw: v, kind: 'font', font: primary };
        pushIndex(fontIndex, primary, name);
        return;
      }
    }

    tokens[name] = { raw: v, kind: 'other' };
  }

  function harvestTokens() {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!rule.style || rule.selectorText !== ':root') continue;
        for (let i = 0; i < rule.style.length; i++) {
          const name = rule.style[i];
          if (!name.startsWith('--')) continue;
          const val = rule.style.getPropertyValue(name);
          if (val != null && val !== '') classifyToken(name, val);
        }
      }
    }
  }

  harvestTokens();

  // ═════════════════════════════════════════════════════════════════════
  // Lookup helpers
  // ═════════════════════════════════════════════════════════════════════

  function parseComputedColor(str) {
    const m = str.match(/^rgba?\(\s*(\d+)[, ]\s*(\d+)[, ]\s*(\d+)(?:\s*[,/]\s*(-?\d*\.?\d+))?\s*\)$/);
    if (!m) return null;
    return { rgb: [+m[1], +m[2], +m[3]], a: m[4] !== undefined ? +m[4] : 1 };
  }

  function matchColor(computed) {
    const p = parseComputedColor(computed);
    if (!p) return null;
    const key = p.rgb.join(',');
    const names = colorIndex.get(key);
    if (!names || !names.length) return null;
    return { names, alpha: p.a };
  }

  function matchFont(computed) {
    const primary = parsePrimaryFont(computed);
    if (!primary) return null;
    const names = fontIndex.get(primary);
    if (!names || !names.length) return null;
    return { names, primary };
  }

  function matchLength(computed) {
    const px = parseLengthPx(computed);
    if (px === null || px === 0) return null;
    const names = lengthIndex.get(px + 'px');
    if (!names || !names.length) return null;
    return { names, px };
  }

  // ═════════════════════════════════════════════════════════════════════
  // UI
  // ═════════════════════════════════════════════════════════════════════

  const css = `
    .hfm-inspect-on, .hfm-inspect-on * { cursor: crosshair !important; }
    .hfm-inspect-on a, .hfm-inspect-on button { pointer-events: none !important; }
    .hfm-inspect-outline {
      position: fixed; pointer-events: none; z-index: 2147483600;
      outline: 2px solid #1B7A86; outline-offset: 0;
      background: rgba(27, 122, 134, 0.08);
      transition: top 60ms ease, left 60ms ease, width 60ms ease, height 60ms ease;
    }
    .hfm-inspect-hud {
      position: fixed; z-index: 2147483601; pointer-events: none;
      max-width: 340px; min-width: 240px;
      background: #0b0e13; color: #fff;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 12px 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25);
      font: 11.5px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing: 0.01em;
    }
    .hfm-inspect-hud.is-pinned { pointer-events: auto; }
    .hfm-inspect-hud__tag {
      font-family: inherit; font-size: 10.5px; letter-spacing: 0.08em;
      text-transform: uppercase; color: #61d3c5;
      margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;
    }
    .hfm-inspect-hud__pin {
      font-size: 9.5px; opacity: 0.55; letter-spacing: 0.12em;
    }
    .hfm-inspect-hud__row {
      display: grid; grid-template-columns: 58px 1fr;
      gap: 6px 10px; padding: 3px 0;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .hfm-inspect-hud__row:first-of-type { border-top: 0; padding-top: 4px; }
    .hfm-inspect-hud__label { color: rgba(255,255,255,0.45); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding-top: 2px; }
    .hfm-inspect-hud__val { color: #fff; word-break: break-word; }
    .hfm-inspect-hud__token { color: #FFCC15; }
    .hfm-inspect-hud__raw { color: rgba(255,255,255,0.55); }
    .hfm-inspect-hud__swatch {
      display: inline-block; width: 10px; height: 10px; border-radius: 2px;
      vertical-align: -1px; margin-right: 6px;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .hfm-inspect-hud__none { color: rgba(255,255,255,0.4); }
    .hfm-inspect-empty {
      font-family: inherit; color: rgba(255,255,255,0.5);
      padding: 2px 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .hfm-inspect-outline { transition: none; }
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-hfm-inspect', '');
  style.textContent = css;
  document.head.appendChild(style);

  const outline = document.createElement('div');
  outline.className = 'hfm-inspect-outline';
  outline.style.display = 'none';

  const hud = document.createElement('div');
  hud.className = 'hfm-inspect-hud';
  hud.style.display = 'none';

  document.body.appendChild(outline);
  document.body.appendChild(hud);

  // ═════════════════════════════════════════════════════════════════════
  // Build HUD content for an element
  // ═════════════════════════════════════════════════════════════════════

  function elementLabel(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList && el.classList.length) {
      s += '.' + Array.from(el.classList).slice(0, 2).join('.');
    }
    if (el.getAttribute('role')) s += ' [role=' + el.getAttribute('role') + ']';
    return s;
  }

  function renderTokenPill(names, alpha) {
    const label = names.map(n => 'var(' + n + ')').join(' | ');
    const suffix = (alpha !== undefined && alpha < 0.999) ? ' · α ' + (Math.round(alpha * 100)) + '%' : '';
    return '<span class="hfm-inspect-hud__token">' + label + '</span>' + suffix;
  }

  function rowColor(label, computed) {
    const p = parseComputedColor(computed);
    if (!p || (p.a === 0)) return '';
    const swatch = `<span class="hfm-inspect-hud__swatch" style="background:${computed}"></span>`;
    const matched = matchColor(computed);
    const body = matched
      ? renderTokenPill(matched.names, matched.alpha)
      : '<span class="hfm-inspect-hud__none">' + computed + '</span>';
    return `<div class="hfm-inspect-hud__row">
      <div class="hfm-inspect-hud__label">${label}</div>
      <div class="hfm-inspect-hud__val">${swatch}${body}</div>
    </div>`;
  }

  function rowFont(computed, size, weight, lh) {
    const matched = matchFont(computed);
    const primary = matched ? renderTokenPill(matched.names) : '<span class="hfm-inspect-hud__none">' + parsePrimaryFont(computed) + '</span>';
    const meta = `<span class="hfm-inspect-hud__raw">${size} / ${lh} · ${weight}</span>`;
    return `<div class="hfm-inspect-hud__row">
      <div class="hfm-inspect-hud__label">Font</div>
      <div class="hfm-inspect-hud__val">${primary}<br>${meta}</div>
    </div>`;
  }

  function rowLength(label, computed) {
    const m = matchLength(computed);
    if (!computed || computed === '0px') return '';
    const body = m
      ? renderTokenPill(m.names) + ' <span class="hfm-inspect-hud__raw">(' + m.px + 'px)</span>'
      : '<span class="hfm-inspect-hud__none">' + computed + '</span>';
    return `<div class="hfm-inspect-hud__row">
      <div class="hfm-inspect-hud__label">${label}</div>
      <div class="hfm-inspect-hud__val">${body}</div>
    </div>`;
  }

  function rowSpacing(label, top, right, bottom, left) {
    const vals = [top, right, bottom, left];
    const allZero = vals.every(v => v === '0px');
    if (allZero) return '';
    const parts = vals.map(v => {
      const m = matchLength(v);
      if (m) return '<span class="hfm-inspect-hud__token">' + m.names[0] + '</span>';
      return '<span class="hfm-inspect-hud__raw">' + v + '</span>';
    });
    const body = parts.join(' · ');
    return `<div class="hfm-inspect-hud__row">
      <div class="hfm-inspect-hud__label">${label}</div>
      <div class="hfm-inspect-hud__val" style="font-size:10.5px">${body}</div>
    </div>`;
  }

  function buildHud(el) {
    const cs = getComputedStyle(el);
    const label = elementLabel(el);
    const parts = [];
    parts.push(`<div class="hfm-inspect-hud__tag"><span>&lt;${label}&gt;</span><span class="hfm-inspect-hud__pin">click to pin</span></div>`);

    parts.push(rowColor('BG', cs.backgroundColor));
    parts.push(rowColor('Color', cs.color));
    parts.push(rowColor('Border', cs.borderTopColor));

    parts.push(rowFont(cs.fontFamily, cs.fontSize, cs.fontWeight, cs.lineHeight));
    parts.push(rowLength('Radius', cs.borderTopLeftRadius));
    parts.push(rowSpacing('Padding', cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft));
    parts.push(rowSpacing('Margin',  cs.marginTop,  cs.marginRight,  cs.marginBottom,  cs.marginLeft));

    const filled = parts.filter(Boolean);
    if (filled.length <= 1) {
      filled.push('<div class="hfm-inspect-empty">No token matches on this element. Try a child.</div>');
    }
    hud.innerHTML = filled.join('');
  }

  // ═════════════════════════════════════════════════════════════════════
  // Interaction
  // ═════════════════════════════════════════════════════════════════════

  let isOn = false;
  let pinned = false;
  let lastTarget = null;

  function placeHud(x, y) {
    const pad = 14;
    const hw = hud.offsetWidth || 280;
    const hh = hud.offsetHeight || 200;
    let hx = x + pad;
    let hy = y + pad;
    if (hx + hw > window.innerWidth - 8)  hx = x - hw - pad;
    if (hy + hh > window.innerHeight - 8) hy = y - hh - pad;
    if (hx < 8) hx = 8;
    if (hy < 8) hy = 8;
    hud.style.left = hx + 'px';
    hud.style.top  = hy + 'px';
  }

  function placeOutline(el) {
    const r = el.getBoundingClientRect();
    outline.style.display = 'block';
    outline.style.left   = r.left + 'px';
    outline.style.top    = r.top + 'px';
    outline.style.width  = r.width + 'px';
    outline.style.height = r.height + 'px';
  }

  function onMove(e) {
    if (!isOn || pinned) return;
    const el = e.target;
    if (!el || el === lastTarget) {
      placeHud(e.clientX, e.clientY);
      return;
    }
    if (el.closest && (el.closest('.hfm-inspect-hud') || el.closest('.hfm-inspect-outline'))) return;
    lastTarget = el;
    buildHud(el);
    placeOutline(el);
    hud.style.display = 'block';
    placeHud(e.clientX, e.clientY);
  }

  function onClick(e) {
    if (!isOn) return;
    if (e.target && e.target.closest && e.target.closest('.hfm-inspect-hud')) return;
    e.preventDefault();
    e.stopPropagation();
    pinned = !pinned;
    hud.classList.toggle('is-pinned', pinned);
    const pinEl = hud.querySelector('.hfm-inspect-hud__pin');
    if (pinEl) pinEl.textContent = pinned ? 'pinned · click to unpin' : 'click to pin';
  }

  function onKey(e) {
    if (e.key === 'Escape' && isOn) {
      if (pinned) {
        pinned = false;
        hud.classList.remove('is-pinned');
      } else {
        setOn(false);
        window.parent && window.parent.postMessage({ type: 'hfm:inspect-ack', on: false }, '*');
      }
    }
  }

  function setOn(on) {
    isOn = !!on;
    pinned = false;
    lastTarget = null;
    document.documentElement.classList.toggle('hfm-inspect-on', isOn);
    if (!isOn) {
      outline.style.display = 'none';
      hud.style.display = 'none';
      hud.classList.remove('is-pinned');
    }
  }

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'hfm:inspect') setOn(!!data.on);
  });

  // Announce readiness so the parent toolbar can enable the toggle.
  try {
    window.parent && window.parent.postMessage({ type: 'hfm:inspect-ready' }, '*');
  } catch (err) { /* ignore */ }
})();
