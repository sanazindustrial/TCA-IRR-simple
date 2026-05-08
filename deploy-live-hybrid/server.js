const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const next = require('next');
const { URL, parse } = require('url');

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.HOSTNAME || '0.0.0.0';
const backendBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const nextConfigPath = path.join(__dirname, '.next', 'required-server-files.json');
const enableNextUi = process.env.ENABLE_NEXT_UI !== 'false';
const nextOwnedApiPrefixes = [
  '/api/analysis/comprehensive',
  '/api/external-data',
  '/api/ssd/connection-test',
  '/api/test-backend',
  '/api/users/invite'
];

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendHtml(res, html, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function buildDocsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TCA IRR API Docs</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #0b1220; color: #e5eefb; }
    .wrap { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
    .card { background: #111a2b; border: 1px solid #24324a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    a { color: #60a5fa; }
    code, pre { background: #08101d; border-radius: 8px; padding: 2px 6px; }
    pre { padding: 12px; overflow: auto; white-space: pre-wrap; }
    .ok { color: #4ade80; }
    .warn { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>TCA IRR API Access</h1>
      <p class="warn">Backend Swagger is disabled upstream, so this route provides the verified production API reference.</p>
      <p><strong>Backend:</strong> ${backendBase}</p>
      <p><strong>API prefix:</strong> /api/v1</p>
    </div>
    <div class="card">
      <h2>Working endpoints</h2>
      <pre>GET  /api/v1/health
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/reports/
GET  /api/v1/reports/{id}
GET  /api/v1/users/   (auth required)
GET  /api/v1/companies/   (auth required)</pre>
    </div>
    <div class="card">
      <h2>Quick tests</h2>
      <pre>curl -s ${backendBase}/api/v1/health
curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@tca.com","password":"admin123"}' ${backendBase}/api/v1/auth/login</pre>
    </div>
  </div>
</body>
</html>`;
}

function buildRecoveryPage(reason = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TCA IRR Platform</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #0b1220; color: #e5eefb; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
    .card { background: #111a2b; border: 1px solid #24324a; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    h1, h2 { margin: 0 0 12px; }
    input, button, a.btn { padding: 10px 12px; border-radius: 8px; border: 1px solid #35507a; text-decoration: none; display: inline-block; }
    input { background: #0f1726; color: #fff; width: 240px; margin-right: 8px; }
    button, a.btn { background: #2563eb; color: #fff; cursor: pointer; }
    button:hover, a.btn:hover { background: #1d4ed8; }
    pre { background: #08101d; padding: 12px; border-radius: 8px; overflow: auto; white-space: pre-wrap; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .ok { color: #4ade80; }
    .warn { color: #fbbf24; }
    .muted { color: #9fb0c7; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>TCA IRR Platform</h1>
      <p class="ok">Production recovery mode is live with the correct backend API prefix and no mock fallback data.</p>
      <p><strong>Backend target:</strong> ${backendBase}/api/v1</p>
      ${reason ? `<p class="warn"><strong>UI bundle note:</strong> ${reason}</p>` : ''}
      <div class="row">
        <a class="btn" href="/docs">Open API Docs</a>
        <a class="btn" href="/dashboard">Try Dashboard Route</a>
        <a class="btn" href="/analysis/result">Try Analysis Route</a>
      </div>
    </div>

    <div class="card">
      <h2>Health Check</h2>
      <div class="row">
        <button onclick="checkHealth()">Check API Health</button>
      </div>
      <pre id="healthOutput">Waiting...</pre>
    </div>

    <div class="card">
      <h2>Login</h2>
      <div class="row">
        <input id="email" value="admin@tca.com" placeholder="Email" />
        <input id="password" type="password" value="admin123" placeholder="Password" />
        <button onclick="login()">Login</button>
      </div>
      <pre id="loginOutput">Not logged in</pre>
    </div>

    <div class="card">
      <h2>Reports</h2>
      <div class="row">
        <button onclick="loadReports()">Load Reports</button>
      </div>
      <pre id="reportsOutput">No data loaded</pre>
    </div>
  </div>

  <script>
    let authToken = '';

    async function apiFetch(path, options = {}) {
      const res = await fetch(path, {
        ...options,
        headers: {
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}),
          ...(options.headers || {}),
          ...(options.body ? { 'Content-Type': 'application/json' } : {})
        }
      });
      const text = await res.text();
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + text);
      try { return JSON.parse(text); } catch { return text; }
    }

    async function checkHealth() {
      const out = document.getElementById('healthOutput');
      out.textContent = 'Loading...';
      try {
        const data = await apiFetch('/api/health');
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = e.message;
      }
    }

    async function login() {
      const out = document.getElementById('loginOutput');
      out.textContent = 'Signing in...';
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          })
        });
        authToken = data.access_token || data.token || '';
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = e.message;
      }
    }

    async function loadReports() {
      const out = document.getElementById('reportsOutput');
      out.textContent = 'Loading reports...';
      try {
        const data = await apiFetch('/api/reports/');
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = e.message;
      }
    }

    checkHealth();
  </script>
</body>
</html>`;
}

async function proxyApi(req, res) {
  const incomingUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let upstreamPath = incomingUrl.pathname;

  const isNextOwnedApi = nextOwnedApiPrefixes.some(prefix => upstreamPath === prefix || upstreamPath.startsWith(prefix + '/'));
  if (isNextOwnedApi) {
    return false;
  }

  if (upstreamPath === '/api') {
    upstreamPath = '/api/v1';
  } else if (upstreamPath.startsWith('/api/') && !upstreamPath.startsWith('/api/v1/')) {
    upstreamPath = '/api/v1/' + upstreamPath.slice('/api/'.length);
  }

  const targetUrl = new URL(upstreamPath + incomingUrl.search, backendBase);
  const body = await readBody(req);
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  headers.accept = headers.accept || 'application/json';

  if (body.length) {
    headers['content-length'] = String(body.length);
  } else {
    delete headers['content-length'];
  }

  await new Promise((resolve) => {
    const proxyReq = https.request(targetUrl, {
      method: req.method,
      headers
    }, proxyRes => {
      const responseChunks = [];
      proxyRes.on('data', chunk => responseChunks.push(chunk));
      proxyRes.on('end', () => {
        const responseBody = Buffer.concat(responseChunks);
        const responseHeaders = { ...proxyRes.headers };
        delete responseHeaders['content-encoding'];
        delete responseHeaders['transfer-encoding'];
        responseHeaders['content-length'] = String(responseBody.length);
        responseHeaders['access-control-allow-origin'] = '*';
        res.writeHead(proxyRes.statusCode || 502, responseHeaders);
        res.end(responseBody);
        resolve();
      });
    });

    proxyReq.on('error', error => {
      sendJson(res, 502, {
        success: false,
        message: 'Backend proxy error',
        details: error.message
      });
      resolve();
    });

    if (body.length) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });

  return true;
}

function startFallbackServer(reason) {
  const fallbackServer = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        return sendJson(res, 400, { success: false, message: 'Missing request URL' });
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
      }

      const incomingUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

      if (incomingUrl.pathname === '/health') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'tca-irr-frontend-recovery',
          backendBase,
          apiPrefix: '/api/v1'
        });
      }

      if (incomingUrl.pathname === '/docs' || incomingUrl.pathname === '/redoc') {
        return sendHtml(res, buildDocsPage());
      }

      if (incomingUrl.pathname.startsWith('/api/')) {
        await proxyApi(req, res);
        return;
      }

      return sendHtml(res, buildRecoveryPage(reason), 200);
    } catch (error) {
      console.error('Fallback server error:', error);
      if (!res.headersSent) {
        return sendHtml(res, buildRecoveryPage(error.message), 500);
      }
    }
  });

  fallbackServer.listen(port, host, () => {
    console.log(`TCA IRR fallback server listening on http://${host}:${port}`);
  });
}

async function start() {
  if (!enableNextUi) {
    throw new Error('Compiled Next UI is temporarily disabled until a clean frontend build is available.');
  }

  const config = fs.existsSync(nextConfigPath)
    ? (JSON.parse(fs.readFileSync(nextConfigPath, 'utf8')).config || {})
    : {};

  const app = next({ dev: false, dir: __dirname, conf: config });
  await app.prepare();
  const handle = app.getRequestHandler();

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        return sendJson(res, 400, { success: false, message: 'Missing request URL' });
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
      }

      const incomingUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

      if (incomingUrl.pathname === '/health') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'tca-irr-frontend',
          backendBase,
          apiPrefix: '/api/v1'
        });
      }

      if (incomingUrl.pathname === '/docs' || incomingUrl.pathname === '/redoc') {
        return sendHtml(res, buildDocsPage());
      }

      if (incomingUrl.pathname.startsWith('/api/')) {
        const proxied = await proxyApi(req, res);
        if (proxied) {
          return;
        }
      }

      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (nextError) {
        console.error('Next render failed; returning safe recovery UI.', nextError);
        if (!res.headersSent) {
          return sendHtml(res, buildRecoveryPage(nextError.message));
        }
      }
    } catch (error) {
      console.error('Frontend server error:', error);
      if (!res.headersSent) {
        return sendHtml(res, buildRecoveryPage(error.message), 500);
      }
    }
  });

  server.listen(port, host, () => {
    console.log(`TCA IRR frontend listening on http://${host}:${port}`);
    console.log(`Using backend API target ${backendBase}`);
  });
}

start().catch((error) => {
  console.error('Startup error:', error);
  startFallbackServer(error.message);
});