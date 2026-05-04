const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 };
const REMOTE_DIST = '/home/u655334071/domains/pulsewritexsolutions.com/backendnode/dist';
const LOCAL_DIST = path.join(__dirname, 'dist');

async function uploadDir(sftp, localDir, remoteDir) {
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = `${remoteDir}/${item}`;
    const stats = fs.statSync(localPath);

    if (stats.isDirectory()) {
      await new Promise(r => sftp.mkdir(remotePath, () => r())); // Ignore error if exists
      await uploadDir(sftp, localPath, remotePath);
    } else if (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.ts')) {
      await new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) { console.error(`Error uploading ${item}: ${err}`); reject(err); }
          else { resolve(); }
        });
      });
    }
  }
}

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP Ready - Uploading backend dist/...');
    sftp.mkdir(REMOTE_DIST, async () => {
      try {
        await uploadDir(sftp, LOCAL_DIST, REMOTE_DIST);
        console.log('✅ Upload Successful');
        
        // Touch restart.txt to trigger Passenger restart
        conn.exec('touch /home/u655334071/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt', () => {
             console.log('✅ Sent restart signal to Passenger');
             conn.end();
        });
      } catch(e) {
         console.error('Upload Failed', e);
         conn.end();
      }
    });
  });
}).connect(SSH_CONFIG);
