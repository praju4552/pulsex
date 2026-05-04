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
  console.log("=== Checking package.json ===");
  console.log(await ssh("find ~/domains/pulsewritexsolutions.com -name package.json 2>/dev/null"));
  console.log("=== Reading domain root package.json if exists ===");
  console.log(await ssh("cat ~/domains/pulsewritexsolutions.com/public_html/.builds/config/package.json 2>/dev/null || echo 'not there'"));
  process.exit(0);
})();
