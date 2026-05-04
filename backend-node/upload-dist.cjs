const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function uploadDir(sftp, localDir, remoteDir) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(remoteDir, err => {
      // Ignore err if dir exists
      fs.readdir(localDir, (err, files) => {
        if (err) return reject(err);
        
        let pending = files.length;
        if (pending === 0) return resolve();
        
        for (const file of files) {
          const localFile = path.join(localDir, file);
          const remoteFile = `${remoteDir}/${file}`;
          
          fs.stat(localFile, (err, stats) => {
            if (stats.isDirectory()) {
              uploadDir(sftp, localFile, remoteFile)
                .then(() => { if (--pending === 0) resolve(); })
                .catch(reject);
            } else {
              sftp.fastPut(localFile, remoteFile, err => {
                if (err) return reject(err);
                if (--pending === 0) resolve();
              });
            }
          });
        }
      });
    });
  });
}

const c = new Client();
c.on('ready', () => {
  console.log('Connected.');
  c.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP started.');
    const local = path.join(__dirname, '..', 'dist');
    const remote = '/home/u655334071/domains/pulsewritexsolutions.com/public_html';
    
    uploadDir(sftp, local, remote).then(() => {
      console.log('Upload complete');
      c.end();
    }).catch(err => {
      console.error(err);
      c.end();
    });
  });
}).connect({
  host: '82.198.227.43',
  port: 65002,
  username: 'u655334071',
  password: 'EdmalaB@2025'
});
