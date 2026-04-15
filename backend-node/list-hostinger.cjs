const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Ready');
  conn.exec(`ls -la ~/domains/pulsewritexsolutions.com/public_html/`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out+=d);
    stream.on('close', () => {
      console.log('--- public_html contents ---');
      console.log(out);
      conn.end();
    });
  });
});

conn.on('error', e => console.error('SSH Error:', e.message));
conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', keepaliveInterval: 10000 });
