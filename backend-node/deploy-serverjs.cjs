const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();
const localServerJs = path.join(__dirname, '..', 'server.js');

conn.on('ready', () => {
  console.log('SSH Ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const remotePath = '/home/u655334071/domains/pulsewritexsolutions.com/nodejs/server.js';
    sftp.fastPut(localServerJs, remotePath, (err) => {
      if (err) { console.error('Upload failed:', err); conn.end(); return; }
      console.log('✅ server.js uploaded to nodejs/');
      
      // Touch restart.txt to make Passenger pick up the new server.js
      conn.exec('touch ~/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt', (err, stream) => {
        stream.on('data', () => {});
        stream.stderr.on('data', () => {});
        stream.on('close', () => {
          console.log('✅ Passenger restart triggered');
          conn.end();
          process.exit(0);
        });
      });
    });
  });
});

conn.on('error', e => console.error('SSH Error:', e.message));
conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', keepaliveInterval: 10000 });
