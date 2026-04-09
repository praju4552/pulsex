/**
 * server.js — Hostinger root entry point
 * Boots the compiled backend from the primary location.
 */
const path = require('path');
const fs = require('fs');

const entry = path.join(__dirname, 'backendnode', 'dist', 'app.js');

if (fs.existsSync(entry)) {
  console.log('[server.js] Booting from:', entry);
  try {
    require(entry);
  } catch (err) {
    console.error('[server.js] CRASH loading', entry, ':', err.stack || err);
    process.exit(1);
  }
} else {
  console.error('[server.js] FATAL: app.js not found at:', entry);
  process.exit(1);
}
