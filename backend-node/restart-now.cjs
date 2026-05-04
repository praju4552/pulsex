const { Client } = require('ssh2');

function runSSH(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve({ ok: false, out: 'EXEC_ERR: ' + err.message }); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { resolve({ ok: true, out: out.trim() }); conn.end(); });
      });
    });
    conn.on('error', (e) => resolve({ ok: false, out: 'CONN_ERR: ' + e.message }));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  // Step 1: Just restart Passenger - the code is already on the server from the last deploy!
  console.log('Step 1: Restarting Passenger...');
  let r = await runSSH('mkdir -p ~/domains/pulsewritexsolutions.com/nodejs/tmp && touch ~/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt && mkdir -p ~/domains/pulsewritexsolutions.com/tmp && touch ~/domains/pulsewritexsolutions.com/tmp/restart.txt && echo RESTART_DONE');
  console.log(r.out);

  if (!r.ok) {
    console.log('SSH blocked. Will need to use Hostinger Web Terminal.');
    process.exit(1);
  }

  // Step 2: Verify server.js exists
  console.log('\nStep 2: Checking server.js...');
  r = await runSSH('head -3 ~/domains/pulsewritexsolutions.com/nodejs/server.js');
  console.log(r.out);

  // Step 3: Verify public_html has index.html
  console.log('\nStep 3: Checking public_html...');
  r = await runSSH('ls -la ~/domains/pulsewritexsolutions.com/public_html/');
  console.log(r.out);

  // Step 4: Check .htaccess
  console.log('\nStep 4: Checking .htaccess...');
  r = await runSSH('cat ~/domains/pulsewritexsolutions.com/public_html/.htaccess');
  console.log(r.out);

  console.log('\n✅ Done. Check https://pulsewritexsolutions.com now!');
})();
