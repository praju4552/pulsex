const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`find ~/domains/pulsewritexsolutions.com -name ".htaccess"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025' });
