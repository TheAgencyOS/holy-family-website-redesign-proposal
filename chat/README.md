# HFU Proposal Concierge

A grounded, streaming AI chat widget bolted onto the Holy Family University proposal site. Uses the HFU shield mark on the launcher and is trained on every page of the proposal via a compiled context file.

## Run it locally

```bash
cd site
npm install          # installs dotenv only
npm start            # serves http://localhost:3000
```

The server reads `site/.env` for `OPENAI_API_KEY`. If the key isn't set you'll see a friendly "missing_api_key" response from `/api/chat`.

## What's where

| Path                        | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `server.js`                 | Zero-framework HTTP server — serves the static site + `/api/chat`.     |
| `api/chat.js`               | OpenAI streaming handler. Also Vercel-compatible (`export default`).   |
| `chat/build-context.js`     | Extracts visible text from every proposal page + briefing docs.        |
| `chat/context.json`         | Generated content blob the system prompt grounds in. **Do not edit.**  |
| `chat/portal-chat.js`       | Self-contained widget: injects its own styles, FAB, panel, streaming.  |
| `chat/hfu-mark.svg`         | Cropped HFU shield mark (used by the launcher and header).             |
| `.env`                      | `OPENAI_API_KEY`, `CHAT_MODEL`, `PORT`. Already seeded locally.        |

## Regenerating the chat context

If you edit proposal pages and want the concierge to know:

```bash
npm run build:context
```

This rewrites `chat/context.json` from `index.html`, `mission.html`, `enrollment.html`, `adult-learner.html`, `ai-lab.html`, `peers.html`, `research.html`, `runway.html`, `sitemap-atlas.html`, and the research-folder briefing markdown. Budget is 120k chars (~30k tokens).

## Keybindings

- `⌘K` / `Ctrl+K` — toggle the panel
- `Esc` — close
- `Enter` — send, `Shift+Enter` — newline

## Design notes

- Launcher uses HFU navy `#0B2D5B → #061C3B` with a teal pulse ring (Agency OS brand accent).
- Panel: Roobert body, Newsreader display, JetBrains Mono for metadata rails — matching the rest of the site.
- Mobile (<560px): becomes a bottom sheet, FAB hides while open.
- Dark-mode aware via `prefers-color-scheme`.

## System prompt anchors

`api/chat.js` hard-pins the three pillars ("Whole Person Thesis", "Enrollment Intelligence", "AI Migration Lab"), the timeline (June 2026 → April 2027), and the agency identity so the model can't drift on the facts that matter most to the evaluation committee. Temperature is 0.25. Edit the SYSTEM_PROMPT block if you want to tune tone or add more anchors.

## Deploying to Vercel (optional)

`api/chat.js` exports a default handler compatible with Vercel's Node runtime. If you run `vercel` from `site/`, you'll get:

- static site on the CDN,
- `/api/chat` as a serverless function,
- the same `.env` semantics (set `OPENAI_API_KEY` in the Vercel project settings).

No additional config required.

## Injected on

`index.html`, `mission.html`, `enrollment.html`, `adult-learner.html`, `ai-lab.html`, `peers.html`, `research.html`, `runway.html`, `sitemap-atlas.html`. Add to more pages with one line before `</body>`:

```html
<script src="chat/portal-chat.js" defer></script>
```
