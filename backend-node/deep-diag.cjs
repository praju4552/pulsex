const { Client } = require('ssh2');

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
    conn.on('error', (e) => resolve('CONN_ERR: ' + e.message));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  // Check stderr.log - the REAL crash log
  console.log('=== STDERR LOG (last 50 lines) ===');
  let r = await runSSH('tail -50 ~/domains/pulsewritexsolutions.com/nodejs/stderr.log 2>/dev/null || echo "NO STDERR"');
  console.log(r);

  // Check error_log in tmp
  console.log('\n=== TMP ERROR LOG ===');
  r = await runSSH('cat ~/domains/pulsewritexsolutions.com/nodejs/tmp/error_log.txt 2>/dev/null || echo "NO TMP LOG"');
  console.log(r);

  // Check if the server.js is the correct one (the static file server, not the backend bootloader)
  console.log('\n=== FULL server.js ===');
  r = await runSSH('cat ~/domains/pulsewritexsolutions.com/nodejs/server.js');
  console.log(r);

  // Check nodejs/ directory
  console.log('\n=== nodejs/ contents ===');
  r = await runSSH('ls -la ~/domains/pulsewritexsolutions.com/nodejs/');
  console.log(r);

  // Check if node processes are running
  console.log('\n=== Running node processes ===');
  r = await runSSH('ps aux | grep node | head -10');
  console.log(r);
})();
