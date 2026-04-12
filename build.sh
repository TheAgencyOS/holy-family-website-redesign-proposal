#!/usr/bin/env bash
# Vercel build script — copies static assets into public/ so Vercel's Node
# framework preset serves them. Excludes dev-only and api-serverless files.
set -euo pipefail

rm -rf public
mkdir -p public

# Copy everything at root except the excluded entries.
for entry in * .[!.]*; do
  case "$entry" in
    public|node_modules|.vercel|.git|api|chat|vercel.json|package.json|package-lock.json|server.js|build.sh|.env|.env.example|.gitignore|.DS_Store)
      continue
      ;;
    *)
      cp -R "$entry" public/ 2>/dev/null || true
      ;;
  esac
done

echo "Build complete. public/ contents:"
ls public/ | head -20
