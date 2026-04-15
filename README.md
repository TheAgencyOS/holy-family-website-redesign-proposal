# Holy Family proposal site — source of truth

> **The canonical proposal is `index.html`. Period. Edit nothing else.**

## What's what

| File | Role | Edit it? |
|---|---|---|
| **`index.html`** | **The proposal.** 30 paginated 8.5×11 pages with sidebar nav, all content, all design. This is what the live URL serves. | **Yes — only this.** |
| `HFU-Proposal.pdf` | **On hold.** Will be regenerated from `index.html` once the HTML reaches pixel perfection. Do not regenerate or commit until `index.html` is signed off. | No — frozen. |
| `api/chat.js` | Concierge chat API (OpenAI-backed). Reads `chat/context.json`. | Edit only the `SYSTEM_PROMPT` here. |
| `chat/context.json` | Compiled context for the concierge. Generated from proposal sources. | No — regenerate via `node chat/build-context.js`. |
| `chat/build-context.js` | The script that builds `chat/context.json`. | Yes if you want to change what context the concierge sees. |
| `mockups/*.html` | The clickable mockup pages linked from the sidebar. | Yes, these are content. |
| `assets/`, `tokens.css`, `components.css`, `portal.css`, `portal.js`, `styles.css`, `proposal.css` | Shared design system + assets used by `index.html` and mockups. | Yes when adjusting design tokens or shared components. |
| Other top-level `.html` (mission, enrollment, ai-lab, runway, peers, research, sitemap-atlas, opportunities-we-see, design-system, design-concepts, components) | Linked sub-pages from the portal sidebar. | Yes when editing those specific pages. |
| `_archive/old-html-versions/` | Superseded copies (`index.legacy-portal.html.backup`, `full.html`, `index-old-wrapper.html`, `index.v2.backup.html`, `index.v5.backup.html`). | **Do not.** Reference only. |

## Workflow

### Editing the proposal

1. Edit `index.html`.
2. Commit and push to `main`. Vercel auto-deploys to https://hfu-web-proposal.vercel.app/.

### PDF generation is on hold

The PDF stays frozen until `index.html` reaches pixel perfection. **Do not regenerate `HFU-Proposal.pdf`** during the design iteration phase — the PDF in the repo is intentionally not in sync with current `index.html` work.

When the HTML is signed off and ready for delivery, regenerate with:

```bash
cd site
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless --disable-gpu \
  --print-to-pdf=HFU-Proposal.pdf \
  --no-pdf-header-footer \
  "file://$(pwd)/index.html"
```

The print CSS in `index.html` enforces `height: 11in; overflow: hidden` per `.page` so each section maps to exactly one Letter sheet. Expect 30 PDF pages from 30 `<section class="page">` blocks. If the count differs, content is overflowing and needs trimming in HTML — do not "fix" it by changing the print CSS.

### Refreshing the concierge

After substantive content changes:

```bash
node chat/build-context.js
```

If you change the firm's anchors (pricing, timeline, team, three pillars), also update the `SYSTEM_PROMPT` in `api/chat.js`.

## Rules

- **There is one proposal source.** It is `index.html`. If anyone (human or AI) thinks they should edit a different file to change the proposal, they are wrong.
- **Backups go in `_archive/`.** Never leave a `.backup` file in the working directory.
- **The PDF is downstream and frozen.** Never edit the PDF directly. Do not regenerate it during HTML iteration. Only regenerate once `index.html` is signed off as pixel perfect.
- **No parallel "print" file.** There used to be a `print-proposal.html` that drifted from `index.html`. It is deleted on purpose and should not be recreated. The print CSS lives inside `index.html`.
