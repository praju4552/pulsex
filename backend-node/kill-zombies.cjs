const { Client } = require('ssh2');

const cmd = "pkill -9 node || true; pkill -9 lsnode || true; echo 'ZOMBIES DEAD'";

async function tryKill() {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          resolve(false);
          return;
        }
        let output = '';
        stream.on('data', (data) => output += data);
        stream.on('close', () => {
          console.log('[SUCCESS] ' + output.trim());
          conn.end();
          resolve(true);
        });
      });
    });
    conn.on('error', (err) => {
      resolve(false);
    });
    
    // Connect
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 10000 });
  });
}

(async () => {
  console.log('Starting aggressive zombie killer. Waiting for a process slot to open up on Hostinger...');
  let attempts = 0;
  while (true) {
    attempts++;
    process.stdout.write(`Attempt ${attempts}... `);
    const success = await tryKill();
    if (success) {
      console.log('✅ Successfully killed the zombie processes!');
      break;
    }
    console.log('Server still locked. Retrying in 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));
  }
})();
