const { Client } = require('ssh2');

function sshCmd(label, cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve(`${label}:\nERR: ${err.message}`); conn.end(); return; }
        let o = '';
        stream.on('data', d => o += d);
        stream.stderr.on('data', d => o += d);
        stream.on('close', () => { resolve(`\n${'='.repeat(60)}\n${label}\n${'='.repeat(60)}\n${o.trim() || '(empty)'}`); conn.end(); });
      });
    });
    conn.on('error', e => resolve(`${label}:\nCONN_ERR: ${e.message}`));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 20000 });
  });
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const B = '~/domains/pulsewritexsolutions.com';

  // Run each command sequentially with delay to avoid rate limits
  const A = await sshCmd('A: nodejs/ folder', `ls -la ${B}/nodejs/`);
  console.log(A); await delay(3000);

  const B2 = await sshCmd('B: DO_NOT_UPLOAD_HERE folder', `ls -la ${B}/DO_NOT_UPLOAD_HERE/ 2>/dev/null || echo "FOLDER DOES NOT EXIST"`);
  console.log(B2); await delay(3000);

  const C = await sshCmd('C: error_log.txt', `cat ${B}/public_html/error_log.txt 2>/dev/null || cat ${B}/tmp/error_log.txt 2>/dev/null || echo "NO LOG FOUND"`);
  console.log(C); await delay(3000);

  const D = await sshCmd('D: stderr.log', `cat ${B}/stderr.log 2>/dev/null || tail -50 ${B}/nodejs/stderr.log 2>/dev/null || tail -50 ${B}/backendnode/stderr.log 2>/dev/null || echo "NO STDERR LOG FOUND"`);
  console.log(D); await delay(3000);

  const E = await sshCmd('E: public_html/.htaccess', `cat ${B}/public_html/.htaccess`);
  console.log(E);

  // Bonus: check nodejs/server.js 
  await delay(3000);
  const F = await sshCmd('F: nodejs/server.js', `cat ${B}/nodejs/server.js`);
  console.log(F);

  // Bonus: check ALL htaccess files
  await delay(3000);
  const G = await sshCmd('G: ALL .htaccess files', `find ${B}/ -name ".htaccess" -not -path "*/node_modules/*" 2>/dev/null | head -20`);
  console.log(G);
})();
