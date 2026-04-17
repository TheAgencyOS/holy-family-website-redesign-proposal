#!/usr/bin/env bash
# Build the full HFU proposal PDF:
#   main body (index.html → 40 pages)
#   + appendices (every deep-dive page merged after)
#
# Output: HFU-Proposal-compliant.pdf at the repo root.
set -euo pipefail

cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT="${HFU_PORT:-8781}"
OUT="HFU-Proposal-compliant.pdf"
TMPDIR="$(mktemp -d -t hfu-pdf-XXXXXX)"
trap 'rm -rf "$TMPDIR"; [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null || true' EXIT

# Deep-dive pages that follow the main body as appendix chapters,
# in the order they appear in the sidebar.
APPENDIX_PAGES=(
  "enrollment.html"
  "ai-lab.html"
  "peers.html"
  "sitemap-atlas.html"
  "personas.html"
  "runway.html"
  "mission.html"
  "what-ai-can-do.html"
  "mockups-portal.html"
  "design-system.html"
  "discovery.html"
)

echo "» Starting local server on :$PORT"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV_PID=$!
sleep 1

render() {
  local url="$1" out="$2"
  "$CHROME" --headless=new --disable-gpu \
    --no-pdf-header-footer \
    --virtual-time-budget=25000 \
    --print-to-pdf="$out" \
    "http://localhost:$PORT/$url" 2>/dev/null
}

echo "» Rendering main body (index.html)"
render "index.html" "$TMPDIR/00-main.pdf"

i=1
for page in "${APPENDIX_PAGES[@]}"; do
  if [ ! -f "$page" ]; then
    echo "  · skip $page (not found)"
    continue
  fi
  printf -v n '%02d' "$i"
  echo "» Rendering appendix $n · $page"
  render "$page" "$TMPDIR/$n-$(basename "$page" .html).pdf"
  i=$((i + 1))
done

echo "» Merging into $OUT"
python3 - <<PY
import os, glob, re
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
tmpdir = "$TMPDIR"
files = sorted(glob.glob(os.path.join(tmpdir, "*.pdf")))
total = 0
main_pages = 0
for f in files:
    r = PdfReader(f)
    n = len(r.pages)
    label = os.path.basename(f)
    if label.startswith("00-"):
        main_pages = n
    print(f"  · {label}: {n} pages")
    for p in r.pages:
        w.add_page(p)
    total += n
with open("$OUT", "wb") as fh:
    w.write(fh)
print(f"» main body: {main_pages} pages")
print(f"» total PDF: {total} pages · {os.path.getsize('$OUT'):,} bytes")
if main_pages > 40:
    print(f"!! main body exceeds 40-page RFP envelope by {main_pages - 40} pages")
PY

echo "» Done · $OUT"
