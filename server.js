/**
 * server.js — Hostinger root entry point
 * Tries multiple paths to find the compiled backend.
 */
const path = require('path');
const fs = require('fs');

const candidates = [
  path.join(__dirname, 'backendnode', 'dist', 'app.js'),
  path.join(__dirname, 'nodejs', 'backend-node', 'dist', 'app.js'),
  path.join(__dirname, 'backend-node', 'dist', 'app.js'),
];

let booted = false;
for (const entry of candidates) {
  if (fs.existsSync(entry)) {
    console.log('[server.js] Booting from:', entry);
    try {
      require(entry);
      booted = true;
      break;
    } catch (err) {
      console.error('[server.js] CRASH loading', entry, ':', err.stack || err);
      fs.writeFileSync(
        path.join(__dirname, 'server-crash.log'),
        new Date().toISOString() + '\n' + (err.stack || String(err))
      );
    }
  }
}

if (!booted) {
  console.error('[server.js] FATAL: No app.js found. Searched:', candidates);
  process.exit(1);
}
