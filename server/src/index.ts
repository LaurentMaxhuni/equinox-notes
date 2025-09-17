// @ts-nocheck
import { createServer } from 'node:http';
import { parse } from 'node:url';
import { handleAuth } from './auth.js';

const PORT = Number((process.env && process.env.PORT) ?? 5174);
const CLIENT_ORIGIN = (process.env && process.env.CLIENT_ORIGIN) ?? 'http://localhost:5173';
const ALLOWED_HEADERS = 'Content-Type, Authorization';

const sendJson = (res, status, data, extraHeaders = {}) => {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      res.setHeader(key, value);
    }
  });
  res.end(body);
};

const withCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
};

const applySecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'geolocation=(self)');
};

const readJsonBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    let bytes = 0;
    req.on('data', (chunk) => {
      chunks.push(chunk);
      bytes += chunk.length;
      if (bytes > 32 * 1024) {
        resolve({ ok: false, status: 413, body: { error: 'Payload too large' } });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!chunks.length) {
        resolve({ ok: true, data: {} });
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const data = raw.length ? JSON.parse(raw) : {};
        resolve({ ok: true, data });
      } catch {
        resolve({ ok: false, status: 400, body: { error: 'Invalid JSON body' } });
      }
    });

    req.on('error', () => {
      resolve({ ok: false, status: 400, body: { error: 'Unable to read request body' } });
    });
  });

const server = createServer(async (req, res) => {
  const start = Date.now();
  const method = (req.method || 'GET').toUpperCase();
  const url = req.url || '/';
  const parsedUrl = parse(url, true);

  withCors(res);
  applySecurityHeaders(res);

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (method === 'GET' && parsedUrl.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    console.log(`${method} ${url} -> 200 (${Date.now() - start}ms)`);
    return;
  }

  if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/auth')) {
    let bodyResult = { ok: true, data: {} };
    if (method === 'POST') {
      bodyResult = await readJsonBody(req);
      if (!bodyResult.ok) {
        sendJson(res, bodyResult.status, bodyResult.body);
        console.log(`${method} ${url} -> ${bodyResult.status} (${Date.now() - start}ms)`);
        return;
      }
    }

    const response = handleAuth({
      method,
      path: parsedUrl.pathname,
      body: bodyResult.data,
      headers: req.headers || {},
    });

    sendJson(res, response.status, response.body, response.headers);
    console.log(`${method} ${url} -> ${response.status} (${Date.now() - start}ms)`);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
  console.log(`${method} ${url} -> 404 (${Date.now() - start}ms)`);
});

server.listen(PORT, () => {
  console.log(`Equinox Notes server listening on http://localhost:${PORT}`);
});
