const { Client } = require('ssh2');

function runSSH(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve({ ok: false, out: 'EXEC_ERR: ' + err.message }); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { resolve({ ok: true, out: out.trim() }); conn.end(); });
      });
    });
    conn.on('error', (e) => resolve({ ok: false, out: 'CONN_ERR: ' + e.message }));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  console.log('=== Checking public_html ===');
  let r = await runSSH('ls -la ~/domains/pulsewritexsolutions.com/public_html/');
  console.log(r.out);
})();
