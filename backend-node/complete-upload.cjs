const { Client } = require('ssh2');

function runSSH(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve('ERR: ' + err.message); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { resolve(out.trim()); conn.end(); });
      });
    });
    conn.on('error', (e) => resolve('CONN_ERR: ' + e.message));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

(async () => {
  // Check what's currently in public_html
  console.log('=== Current public_html ===');
  let r = await runSSH('ls -la ~/domains/pulsewritexsolutions.com/public_html/ && ls -la ~/domains/pulsewritexsolutions.com/public_html/assets/ 2>/dev/null || echo "NO ASSETS DIR"');
  console.log(r);

  // Upload ALL frontend files via SFTP
  console.log('\n=== Uploading ALL frontend files ===');
  const path = require('path');
  const fs = require('fs');
  const conn = new Client();
  
  await new Promise((resolve) => {
    conn.on('ready', () => {
      // First create assets dir
      conn.exec('mkdir -p ~/domains/pulsewritexsolutions.com/public_html/assets', (err, stream) => {
        stream.on('data', () => {});
        stream.on('close', () => {
          conn.sftp(async (err, sftp) => {
            if (err) { console.error('SFTP error:', err); conn.end(); resolve(); return; }
            
            const distDir = path.join(__dirname, '..', 'dist');
            const remoteBase = '/home/u655334071/domains/pulsewritexsolutions.com/public_html';
            
            // Walk all files in dist
            function walk(dir, fileList = []) {
              for (const f of fs.readdirSync(dir)) {
                const full = path.join(dir, f);
                if (fs.statSync(full).isDirectory()) walk(full, fileList);
                else fileList.push(full);
              }
              return fileList;
            }

            const files = walk(distDir);
            console.log(`Found ${files.length} files to upload`);

            for (const file of files) {
              const remotePath = file.replace(distDir, remoteBase).replace(/\\/g, '/');
              try {
                await uploadFile(sftp, file, remotePath);
                console.log('✓', path.basename(file));
              } catch(e) {
                console.log('✗', path.basename(file), e.message);
              }
            }

            // Now fix .htaccess - remove the NODE_OPTIONS line that crashes Node
            console.log('\n=== Fixing .htaccess ===');
            conn.exec("sed -i '/SetEnv NODE_OPTIONS/d' ~/domains/pulsewritexsolutions.com/public_html/.htaccess && sed -i '/\\.builds/d' ~/domains/pulsewritexsolutions.com/public_html/.htaccess && echo HTACCESS_FIXED", (err, stream2) => {
              let o = '';
              stream2.on('data', d => o += d);
              stream2.on('close', () => {
                console.log(o.trim());
                
                // Restart Passenger
                conn.exec('touch ~/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt && touch ~/domains/pulsewritexsolutions.com/tmp/restart.txt && echo RESTARTED', (err, stream3) => {
                  let o2 = '';
                  stream3.on('data', d => o2 += d);
                  stream3.on('close', () => {
                    console.log(o2.trim());
                    console.log('\n✅ ALL DONE');
                    conn.end();
                    resolve();
                  });
                });
              });
            });
          });
        });
      });
    });
    conn.on('error', (e) => { console.error('SSH Error:', e.message); resolve(); });
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
})();
