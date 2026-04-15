/**
 * server.js — Hostinger root entry point (Passenger boots this via nodejs/server.js)
 *
 * IMPORTANT: On Hostinger, Passenger runs THIS file from the nodejs/ directory.
 * __dirname = ~/domains/pulsewritexsolutions.com/nodejs/
 * The backend lives at ~/domains/pulsewritexsolutions.com/backendnode/dist/app.js
 *
 * This bootloader:
 *  1. Tries both possible backend paths (backendnode/ and backend-node/)
 *  2. Logs to tmp/error_log.txt (NOT public_html/ which gets wiped by CI/CD)
 *  3. Does NOT call process.exit() — keeps the process alive so Passenger
 *     returns a 500 with a message instead of a bare 503
 */
const path = require('path');
const fs   = require('fs');
const http = require('http');

// ── Crash log goes into tmp/ which is never wiped ────────────────────────────
const domainRoot = path.resolve(__dirname, '..');
const logPath    = path.join(__dirname, 'tmp', 'error_log.txt');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.mkdirSync(path.dirname(logPath), { recursive: true }); } catch {}
  try { fs.appendFileSync(logPath, line); } catch {}
  console.log(line.trim());
}

// ── Global crash handlers (keep process alive) ──────────────────────────────
process.on('uncaughtException', (err) => {
  log(`[UNCAUGHT EXCEPTION] ${err.message}\n${err.stack}`);
  // Do NOT exit — let Passenger keep serving the fallback response
});
process.on('unhandledRejection', (reason) => {
  log(`[UNHANDLED REJECTION] ${reason}`);
});

// ── Find the backend entry point ─────────────────────────────────────────────
const candidates = [
  path.join(domainRoot, 'backendnode', 'dist', 'app.js'),   // CI/CD uploads here
  path.join(domainRoot, 'backend-node', 'dist', 'app.js'),  // fallback name
  path.join(__dirname,   'backendnode', 'dist', 'app.js'),   // nested inside nodejs/
  path.join(__dirname,   'backend-node', 'dist', 'app.js'),  // nested fallback
];

log(`--- Boot started ---`);
log(`__dirname  = ${__dirname}`);
log(`domainRoot = ${domainRoot}`);

let loaded = false;
for (const entry of candidates) {
  log(`Trying: ${entry}`);
  if (fs.existsSync(entry)) {
    try {
      require(entry);
      log(`✅ Successfully loaded: ${entry}`);
      loaded = true;
      break;
    } catch (err) {
      log(`❌ CRASH loading ${entry}:\n${err.stack || err}`);
      // Don't exit — continue to fallback server below
    }
  } else {
    log(`   ↳ not found`);
  }
}

// ── Fallback: if backend failed to load, serve a maintenance page ────────────
// This prevents Passenger from returning a bare 503.
if (!loaded) {
  log('⚠️  No backend loaded — starting fallback maintenance server');
  const PORT = process.env.PORT || 3000;
  http.createServer((_req, res) => {
    // Try to serve the frontend index.html if it exists
    const indexPath = path.join(domainRoot, 'public_html', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h1>🔧 PulseX is starting up</h1>
          <p>The backend is loading. Please refresh in 10 seconds.</p>
          <p style="color:#888;font-size:12px">If this persists, check tmp/error_log.txt on the server.</p>
        </body></html>
      `);
    }
  }).listen(PORT, () => log(`Fallback server on port ${PORT}`));
}
