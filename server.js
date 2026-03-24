/**
 * server.js — Hostinger root entry point
 * Hostinger's Express framework detector requires this file at root.
 * It delegates directly to the pre-compiled backend at backend-node/dist/app.js
 */
const path = require('path');

// Resolve to pre-compiled backend entry on Hostinger (backendnode) and locally (backend-node)
const distEntryHostinger = path.join(__dirname, 'backendnode', 'dist', 'app.js');
const distEntryLocal = path.join(__dirname, 'backend-node', 'dist', 'app.js');

// Boot the backend
try {
  require(distEntryHostinger);
} catch (err) {
  require(distEntryLocal);
}
