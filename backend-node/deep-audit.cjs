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
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025' });
  });
}

(async () => {
  const B = '~/domains/pulsewritexsolutions.com';

  console.log('=== 1. PUBLIC_HTML .htaccess ===');
  console.log(await sshCmd(`cat ${B}/public_html/.htaccess`));

  console.log('\n=== 2. PUBLIC_HTML FILES ===');
  console.log(await sshCmd(`ls -la ${B}/public_html/`));

  console.log('\n=== 3. NODEJS DIR ===');
  console.log(await sshCmd(`ls -la ${B}/nodejs/`));

  console.log('\n=== 4. NODEJS server.js ===');
  console.log(await sshCmd(`cat ${B}/nodejs/server.js`));

  console.log('\n=== 5. BACKENDNODE .htaccess ===');
  console.log(await sshCmd(`cat ${B}/backendnode/.htaccess`));

  console.log('\n=== 6. BACKENDNODE dist ===');
  console.log(await sshCmd(`ls -la ${B}/backendnode/dist/ | head -15`));

  console.log('\n=== 7. .BUILDS preload ===');
  console.log(await sshCmd(`cat ${B}/public_html/.builds/config/preload-timestamp.js 2>/dev/null || echo "NOT FOUND"`));

  console.log('\n=== 8. STDERR (last 20) ===');
  console.log(await sshCmd(`tail -20 ${B}/nodejs/stderr.log 2>/dev/null || echo "NONE"`));

  console.log('\n=== 9. DISK USAGE ===');
  console.log(await sshCmd(`du -sh ${B}/*/`));

  console.log('\n=== 10. HTTP CHECK ===');
  console.log(await sshCmd(`curl -s -o /dev/null -w "Frontend:%{http_code} " https://pulsewritexsolutions.com && curl -s -o /dev/null -w "API:%{http_code}" https://api.pulsewritexsolutions.com/health`));
})();
