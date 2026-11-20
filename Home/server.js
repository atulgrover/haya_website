#!/usr/bin/env node
/**
 * Agentic Professionals Root Gateway (Home)
 * Sovereign Dual-Tract Launchpad on Port 3000
 * Runtime: Pure Node.js (Zero external dependencies)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Reliable check for listening ports via lsof
function isPortListening(port) {
  try {
    const out = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf-8', timeout: 500 }).trim();
    return out.length > 0;
  } catch (e) {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // API Route: Live Health Status of all subdomains
  if (urlPath === '/api/status') {
    const ias = isPortListening(3001);
    const ibc = isPortListening(3002);
    const bns = isPortListening(3003);
    const hackstay = isPortListening(3004);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    });
    res.end(
      JSON.stringify({
        home: true,
        ias: ias,
        ibc: ibc,
        bns: bns,
        hackstay: hackstay,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Serve static files
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🌐 Agentic Professionals Root Gateway (Home)`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`   Sovereign Dual-Tract Launchpad (IAS / IBC / BNS)`);
  console.log(`=======================================================`);
});
