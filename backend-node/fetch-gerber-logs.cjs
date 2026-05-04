/**
 * fetch-gerber-logs.cjs — Fetches the Gerber worker debug log from the server
 */
const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '82.198.227.43', port: 65002,
  username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000
};

function runSSH(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve('EXEC_ERR: ' + err.message); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { resolve(out.trim()); conn.end(); });
      });
    });
    conn.on('error', e => resolve('CONN_ERR: ' + e.message));
    conn.connect(SSH_CONFIG);
  });
}

(async () => {
  const DOMAIN = '/home/u655334071/domains/pulsewritexsolutions.com';
  
  console.log('=== Gerber Worker Debug Log (last 80 lines) ===');
  const gerberLog = await runSSH(`tail -80 ${DOMAIN}/nodejs/tmp/deep_debug.log 2>/dev/null || echo "Log not found"`);
  console.log(gerberLog);

  console.log('\n=== Passenger Error Log (last 30 lines) ===');
  const passLog = await runSSH(`tail -30 ${DOMAIN}/nodejs/stderr.log 2>/dev/null || echo "No stderr.log"`);
  console.log(passLog);

  console.log('\n=== Check Node binary paths ===');
  const nodeVersions = await runSSH(`
    echo "node18: $(ls /opt/alt/alt-nodejs18/root/usr/bin/node 2>/dev/null || echo MISSING)"
    echo "node24: $(ls /opt/alt/alt-nodejs24/root/usr/bin/node 2>/dev/null || echo MISSING)"
    echo "default node: $(which node) = $(node -v 2>/dev/null)"
    echo "PATH: $PATH"
  `);
  console.log(nodeVersions);

  console.log('\n=== Check gerberWorker.js exists on server ===');
  const workerCheck = await runSSH(`ls -la ${DOMAIN}/backendnode/dist/services/gerberWorker.js 2>/dev/null || echo "MISSING"`);
  console.log(workerCheck);

  console.log('\n=== Check pcb-stackup package exists ===');
  const pkgCheck = await runSSH(`ls ${DOMAIN}/backendnode/node_modules/pcb-stackup/index.js 2>/dev/null || echo "MISSING"`);
  console.log(pkgCheck);

  console.log('\n=== Check adm-zip package ===');
  const admCheck = await runSSH(`ls ${DOMAIN}/backendnode/node_modules/adm-zip/adm-zip.js 2>/dev/null || echo "MISSING"`);
  console.log(admCheck);

  console.log('\n=== Check @tracespace packages ===');
  const traceCheck = await runSSH(`ls ${DOMAIN}/backendnode/node_modules/@tracespace/ 2>/dev/null || echo "MISSING"`);
  console.log(traceCheck);
})();
