const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise((resolve) => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, s) => {
        if (err) { resolve('ERR:' + err.message); c.end(); return; }
        let o = '';
        s.on('data', d => o += d.toString());
        s.stderr.on('data', d => o += d.toString());
        s.on('close', () => { resolve(o.trim()); c.end(); });
      });
    });
    c.on('error', e => resolve('CONN:' + e.message));
    c.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  const D = '~/domains/pulsewritexsolutions.com';

  // Kill ALL node/lsnode processes to force LiteSpeed to spawn fresh ones
  console.log('STEP 1: Killing ALL node processes ...');
  console.log(await ssh(`pkill -9 -u $(whoami) -f "node|lsnode" 2>/dev/null; echo KILLED`));

  // Wait for processes to die
  await new Promise(r => setTimeout(r, 3000));

  // Modify server.js timestamp to force LiteSpeed to re-evaluate
  console.log('\nSTEP 2: Touching server.js to force re-evaluation ...');
  console.log(await ssh(`
    touch ${D}/nodejs/server.js
    touch ${D}/nodejs/tmp/restart.txt
    touch ${D}/tmp/restart.txt
    # Also try the LiteSpeed-specific restart mechanism
    touch ${D}/nodejs/.restart_required 2>/dev/null
    # Modify .htaccess timestamp (LiteSpeed watches this)
    touch ${D}/public_html/.htaccess
    echo RESTART_SIGNALS_SENT
  `));

  // Wait for LiteSpeed to notice and spawn new processes
  console.log('\nWaiting 15 seconds for LiteSpeed to respawn ...');
  await new Promise(r => setTimeout(r, 15000));

  // Check what processes exist now
  console.log('\n=== Node processes after respawn ===');
  console.log(await ssh(`ps aux | grep -i "node\\|lsnode" | grep -v grep`));

  // Check stderr
  console.log('\n=== stderr.log ===');
  console.log(await ssh(`cat ${D}/nodejs/stderr.log`));

  // Test externally
  const https = require('https');
  https.get('https://pulsewritexsolutions.com', (res) => {
    console.log(`\n=== EXTERNAL STATUS: ${res.statusCode} ===`);
    if (res.statusCode === 200) console.log('🎉 FINALLY LIVE!');
    else console.log('❌ Still 503 — user needs to restart Node.js app from Hostinger hPanel');
    process.exit(0);
  }).on('error', e => { console.log('Error:', e.message); process.exit(1); });
})();
