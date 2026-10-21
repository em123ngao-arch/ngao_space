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
  // CORS headers
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
  
  let filePath = path.join(process.cwd(), target);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, target);
  }

  // Security: prevent directory traversal
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(process.cwd()) && !normalized.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If file exists, serve it
  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
    const ext = path.extname(normalized).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=86400'
    });
    return fs.createReadStream(normalized).pipe(res);
  }

  // Fallback to index.html for SPA routing
  let indexPath = path.join(process.cwd(), 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, 'index.html');
  }
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
};

// Start server if executed directly (e.g. node server.js locally)
if (require.main === module) {
  const PORT = process.env.PORT || 7823;
  const server = http.createServer(serverHandler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NgaOS] Server running at http://localhost:${PORT}`);
  });
}

// Export handler for Vercel Serverless Function
module.exports = serverHandler;
