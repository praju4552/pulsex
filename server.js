/**
 * server.js — Hostinger root entry point
 * Hostinger's Express framework detector requires this file at root.
 * It delegates directly to the pre-compiled backend.
 *
 * Hostinger runtime path: nodejs/backend-node/dist/app.js
 * Local dev path:         backend-node/dist/app.js
 */
const path = require('path');
const fs = require('fs');

// All possible locations where the compiled backend might live
const candidates = [
  path.join(__dirname, 'nodejs', 'backend-node', 'dist', 'app.js'),  // Hostinger production
  path.join(__dirname, 'backendnode', 'dist', 'app.js'),              // Old Hostinger deploy
  path.join(__dirname, 'backend-node', 'dist', 'app.js'),             // Local development
];

let loaded = false;
for (const entry of candidates) {
  if (fs.existsSync(entry)) {
    console.log('[server.js] Booting from:', entry);
    try {
      require(entry);
      loaded = true;
      break;
    } catch (err) {
      console.error(`[server.js] FATAL BOOT EXCEPTION for ${entry}:`, err);
      try {
        fs.writeFileSync(path.join(__dirname, 'server-crash.log'), err.stack || String(err));
      } catch (logErr) {} // Ignore log permission issues
      throw err; // Re-throw to inform Hostinger process monitor
    }
  }
}

if (!loaded) {
  console.error('[server.js] FATAL: Could not find app.js in any known location.');
  console.error('[server.js] Searched:', candidates);
  process.exit(1);
}
