const { Client } = require('ssh2');

const testJson = JSON.stringify({
  filePath: '/home/u655334071/domains/pulsewritexsolutions.com/backendnode/uploads/3dmodels/modelFile-1776443457107-963320528.stl',
  fileType: '.stl'
});

const cmd = `echo '${testJson}' | /opt/alt/alt-nodejs24/root/usr/bin/node /home/u655334071/domains/pulsewritexsolutions.com/backendnode/dist/services/threeDWorker.js 2>&1`;

const conn = new Client();
conn.on('ready', () => {
  console.log('Running worker test on server...');
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('EXEC ERR:', err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.on('close', (code) => {
      console.log('EXIT CODE:', code);
      console.log('OUTPUT:', out);
      conn.end();
    });
  });
});
conn.on('error', e => console.error('SSH ERR:', e.message));
conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025' });
