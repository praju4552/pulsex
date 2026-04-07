const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established successfully.');
  const cmd = `export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH && cd ~/domains/pulsewritexsolutions.com/backendnode && npm install -g prisma && npx prisma db push --accept-data-loss`;
  console.log('Running command:', cmd);
  
  conn.exec(cmd, { pty: true }, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '82.198.227.43',
  port: 65002,
  username: 'u655334071',
  password: 'EdmalaB@2025' // User provided this password earlier
});

conn.on('error', (err) => {
  console.error('SSH connection failed:', err);
});
