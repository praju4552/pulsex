const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise((resolve) => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, s) => {
        if (err) { resolve('ERR:' + err.message); c.end(); return; }
        let o = '';
        s.on('data', d => o += d.toString());
        s.stderr.on('data', d => o += d.toString());
        s.on('close', () => { resolve(o.trim()); c.end(); });
      });
    });
    c.on('error', e => resolve('CONN:' + e.message));
    c.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  const D = '~/domains/pulsewritexsolutions.com';

  // 1. What does .htaccess look like RIGHT NOW (after restart)?
  console.log('=== CURRENT .htaccess (after restart) ===');
  console.log(await ssh(`cat ${D}/public_html/.htaccess`));

  // 2. Latest stderr
  console.log('\n=== LATEST stderr.log (last 20 lines) ===');
  console.log(await ssh(`tail -20 ${D}/nodejs/stderr.log`));

  // 3. Check the .builds directory structure
  console.log('\n=== .builds directory ===');
  console.log(await ssh(`find ${D}/public_html/.builds -type f 2>/dev/null | head -20`));

  // 4. Check .builds/config/package.json
  console.log('\n=== .builds/config/package.json ===');
  console.log(await ssh(`cat ${D}/public_html/.builds/config/package.json 2>/dev/null || echo "NOT FOUND"`));

  // 5. Check .builds/config/preload-timestamp.js
  console.log('\n=== preload-timestamp.js ===');
  console.log(await ssh(`cat ${D}/public_html/.builds/config/preload-timestamp.js 2>/dev/null || echo "NOT FOUND"`));

  // 6. What does the Hostinger node app config look like?
  console.log('\n=== Hostinger app config ===');
  console.log(await ssh(`cat ${D}/nodejs/.htaccess 2>/dev/null || echo "NO nodejs/.htaccess"`));
  console.log(await ssh(`cat ${D}/.htaccess 2>/dev/null || echo "NO domain root .htaccess"`));
})();
