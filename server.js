/**
 * NGAOS — PRODUCTION & DEV UNIVERSAL SERVER
 * Compatible with both Vercel Serverless Function and local Node.js server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const serverHandler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawUrl = req.headers['x-forwarded-url'] || req.url || '/';
  const urlPath = rawUrl.split('?')[0];
  let target = (urlPath === '/' || urlPath === '/guide') ? 'index.html' : urlPath.replace(/^\//, '');

  try {
    target = decodeURIComponent(target);
  } catch (e) {}

  let filePath = path.resolve(__dirname, target);
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(process.cwd(), target);
  }

  // Security check: ensure path stays within root
  const rootDir = __dirname;
  const cwdDir = process.cwd();
  if (!filePath.startsWith(rootDir) && !filePath.startsWith(cwdDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // If static file exists, serve it immediately with fs.readFileSync
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=86400'
    });
    res.end(content);
    return;
  }

  // SPA fallback only for HTML navigation requests (not for missing .css, .js, .png)
  const isAssetRequest = path.extname(target) !== '';
  if (!isAssetRequest) {
    let indexPath = path.resolve(__dirname, 'index.html');
    if (!fs.existsSync(indexPath)) {
      indexPath = path.resolve(process.cwd(), 'index.html');
    }
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': content.length,
        'Cache-Control': 'public, max-age=0, must-revalidate'
      });
      res.end(content);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
};

if (require.main === module) {
  const PORT = process.env.PORT || 7823;
  const server = http.createServer(serverHandler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NgaOS] Server running at http://localhost:${PORT}`);
  });
}

module.exports = serverHandler;
