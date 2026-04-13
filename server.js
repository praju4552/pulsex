/**
 * server.js — Hostinger root entry point
 * Boots the compiled backend and logs errors to public_html/error_log.txt if it crashes.
 */
const path = require('path');
const fs = require('fs');

// [BUILD_SIGNATURE_INJECT]
const BUILD_ID = 'LOCAL_DEV';
const DEPLOY_DATE = '2024-04-13T11:30:00Z';

console.log(`[BOOT] PulseX Bootloader v2 | ID: ${BUILD_ID} | Date: ${DEPLOY_DATE}`);

const entry = path.join(__dirname, 'backendnode', 'dist', 'app.js');
const logPath = path.join(__dirname, 'public_html', 'error_log.txt');

function logError(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, fullMessage);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Clear old log at startup to avoid confusion
try {
  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, `--- New Boot Attempt at ${new Date().toISOString()} ---\n`);
  }
} catch (e) {}

logError(`Starting boot from: ${entry} (Build: ${BUILD_ID})`);

if (fs.existsSync(entry)) {
  try {
    require(entry);
    logError('Successfully required entry point.');
  } catch (err) {
    const errorDetail = err.stack || err.toString();
    logError(`CRASH loading ${entry}:\n${errorDetail}`);
    console.error('[server.js] CRASH:', errorDetail);
    process.exit(1);
  }
} else {
  logError(`FATAL: app.js not found at ${entry}`);
  console.error('[server.js] FATAL: app.js not found');
  process.exit(1);
}
