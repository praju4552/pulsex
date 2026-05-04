const { Client } = require('ssh2');

function sshCmd(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve('ERR:' + err.message); conn.end(); return; }
        let o = '';
        stream.on('data', d => o += d);
        stream.stderr.on('data', d => o += d);
        stream.on('close', () => { resolve(o.trim()); conn.end(); });
      });
    });
    conn.on('error', e => resolve('CONN_ERR:' + e.message));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 30000 });
  });
}

(async () => {
  const file = await sshCmd(`cat ~/domains/pulsewritexsolutions.com/nodejs/server.js`);
  console.log("SERVER JS LIVE FILE:");
  console.log(file);
})();
