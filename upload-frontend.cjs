const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();
const distDir = path.join(__dirname, 'dist'); // root/dist

const walk = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
};

conn.on('ready', () => {
  console.log('SSH Ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP Ready');
    
    conn.exec('mkdir -p /home/u655334071/domains/pulsewritexsolutions.com/public_html/assets', (err, stream) => {
        stream.on('data', () => {}); 
        stream.stderr.on('data', () => {});
        stream.on('close', async () => {
            const files = walk(distDir);
            console.log(`Uploading ${files.length} files...`);
            
            for (const file of files) {
              const remotePath = file.replace(distDir, '/home/u655334071/domains/pulsewritexsolutions.com/public_html').replace(/\\/g, '/');
              
              const doUpload = () => new Promise((resolve, reject) => {
                  sftp.fastPut(file, remotePath, (err) => {
                      if (err) return reject(err);
                      console.log('✓', path.basename(file));
                      resolve();
                  });
              });

              try { await doUpload(); } 
              catch (e) { console.error('✗ Failed:', file, e.message); }
            }

            console.log('\n✅ Done uploading frontend');
            conn.end();
            process.exit(0);
        });
    });
  });
});

conn.on('error', e => console.error('SSH Error:', e.message));
conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', keepaliveInterval: 10000 });
