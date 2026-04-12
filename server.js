#!/usr/bin/env node
/**
 * server.js — local dev server for the HFU proposal site.
 * Serves the static site and mounts /api/chat for the concierge widget.
 *
 * Run:  OPENAI_API_KEY=sk-... node server.js
 * Or:   npm start           (uses dotenv if a .env is present)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Optional dotenv — don't hard-require so npm install isn't needed if the
// key is already in the environment.
try {
  const dotenv = require('dotenv');
  const localEnv = path.resolve(__dirname, '.env');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv });
} catch {
  /* dotenv not installed — that's fine */
}

const handleChat = require('./api/chat.js');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.normalize(path.join(root, decoded));
  if (!target.startsWith(root)) return null;
  return target;
}

const server = http.createServer(async (req, res) => {
  try {
    // API routes
    if (req.url === '/api/chat' || req.url.startsWith('/api/chat?')) {
      return handleChat(req, res);
    }

    // Static files
    let filePath = safeJoin(ROOT, req.url === '/' ? '/index.html' : req.url);
    if (!filePath) {
      res.statusCode = 400;
      return res.end('bad request');
    }

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('404 not found');
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      try {
        stat = fs.statSync(filePath);
      } catch {
        res.statusCode = 404;
        return res.end('404 not found');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('500 ' + String(e));
  }
});

server.listen(PORT, () => {
  const key = process.env.OPENAI_API_KEY;
  console.log(`\n  HFU proposal site → http://localhost:${PORT}`);
  console.log(`  Chat API         → POST /api/chat`);
  console.log(
    `  OpenAI key       → ${key ? key.slice(0, 12) + '…' : 'MISSING (set OPENAI_API_KEY)'}`
  );
  console.log('');
});
