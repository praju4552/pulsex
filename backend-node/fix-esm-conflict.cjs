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
  console.log("=== Removing nodejs/package.json and touching server ===");
  console.log(await ssh(`
    rm -f ~/domains/pulsewritexsolutions.com/nodejs/package.json
    rm -f ~/domains/pulsewritexsolutions.com/package.json
    rm -f ~/domains/pulsewritexsolutions.com/public_html/.builds/config/package.json
    rm -f ~/domains/pulsewritexsolutions.com/backendnode/package.json
    
    # We only need the backend-node inner one to be correct. Let's make sure it's commonjs.
    echo '{"type":"commonjs"}' > ~/domains/pulsewritexsolutions.com/nodejs/package.json

    touch ~/domains/pulsewritexsolutions.com/nodejs/server.js
    touch ~/domains/pulsewritexsolutions.com/server.js
    touch ~/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt
    touch ~/domains/pulsewritexsolutions.com/tmp/restart.txt
    pkill -9 -u $(whoami) -f "node|lsnode" 2>/dev/null || true
    echo "Done"
  `));
  process.exit(0);
})();
