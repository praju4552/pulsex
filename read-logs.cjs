const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established successfully.');
  const cmd = `cat ~/domains/pulsewritexsolutions.com/public_html/error_log.txt && echo "------" && cat ~/domains/pulsewritexsolutions.com/server-crash.log`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
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
  password: 'EdmalaB@2025'
});

conn.on('error', (err) => {
  console.error('SSH connection failed:', err);
});
