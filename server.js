/**
 * NGAOS — LOCAL REAL-TIME SYNC & HTTP SERVER
 * Provides:
 * 1. Static file serving with MIME types
 * 2. Shared state persistence in data/app-state.json
 * 3. Real-time multi-browser sync via Server-Sent Events (SSE)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 7823;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory clients connected to SSE
const sseClients = new Set();

// Load or initialize state
function getSharedState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Server] Lỗi đọc app-state.json:', err.message);
  }
  return null;
}

function saveSharedState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Lỗi ghi app-state.json:', err.message);
  }
}

// Broadcast SSE event to all connected clients
function broadcastEvent(eventType, payload, excludeClient = null) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    if (client !== excludeClient) {
      try {
        client.write(message);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }
}

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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Server-Sent Events (SSE)
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(':\n\n'); // SSE comment / initial handshake

    sseClients.add(res);

    // Heartbeat every 15s
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
    return;
  }

  // 2. API: Get Current State
  if (pathname === '/api/state' && req.method === 'GET') {
    const state = getSharedState();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, state }));
    return;
  }

  // 3. API: Sync State Update (from Edge or Chrome)
  if (pathname === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data && data.state) {
          saveSharedState(data.state);
          // Broadcast to all other browsers
          broadcastEvent('sync', {
            state: data.state,
            sender: data.sender || null,
            action: data.action || 'update',
            timestamp: Date.now()
          });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (err) {
        console.error('[Server] Lỗi xử lý /api/sync:', err.message);
      }
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Invalid state' }));
    });
    return;
  }

  // 4. Static File Serving
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Normalize and prevent directory traversal
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NgaOS Sync Server] Sẵn sàng tại http://localhost:${PORT}`);
  console.log(`[NgaOS Sync Server] Hỗ trợ đồng bộ thời gian thực đa trình duyệt qua SSE.`);
});
