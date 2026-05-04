/**
 * deploy-backend-only.cjs — Uploads only the backend dist/ and restarts
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '82.198.227.43', port: 65002,
  username: 'u655334071', password: 'EdmalaB@2025',
  readyTimeout: 30000, keepaliveInterval: 10000,
};
const DOMAIN = '/home/u655334071/domains/pulsewritexsolutions.com';
const REMOTE_BACKEND_DIST = `${DOMAIN}/backendnode/dist`;
const LOCAL_BACKEND_DIST = path.join(__dirname, 'dist');

function sshConnect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn));
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });
}
function sshExec(conn, cmd) {
  return new Promise((resolve) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return resolve('EXEC_ERR: ' + err.message);
      let out = '';
      stream.on('data', d => out += d.toString());
      stream.stderr.on('data', d => out += d.toString());
      stream.on('close', () => resolve(out.trim()));
    });
  });
}
function sftpGet(conn) {
  return new Promise((resolve, reject) => conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp)));
}
function sftpMkdir(sftp, dir) {
  return new Promise(r => sftp.mkdir(dir, () => r()));
}
async function uploadDir(sftp, localDir, remoteDir) {
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = `${remoteDir}/${item}`;
    const stats = fs.statSync(localPath);
    if (stats.isDirectory()) {
      await sftpMkdir(sftp, remotePath);
      await uploadDir(sftp, localPath, remotePath);
    } else if (['.js', '.json'].includes(path.extname(item))) {
      await new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, err => err ? reject(err) : resolve());
      });
      console.log('  ✓', item);
    }
  }
}

(async () => {
  console.log('\n🚀 PulseX — Backend-Only Deploy\n' + '='.repeat(40));

  console.log('\n[1/2] Uploading backend dist/ ...');
  const conn1 = await sshConnect();
  const sftp = await sftpGet(conn1);
  await sftpMkdir(sftp, REMOTE_BACKEND_DIST);
  await uploadDir(sftp, LOCAL_BACKEND_DIST, REMOTE_BACKEND_DIST);
  conn1.end();
  console.log('✅ Backend dist uploaded');

  console.log('\n[2/2] Restarting Passenger ...');
  const conn2 = await sshConnect();
  const r = await sshExec(conn2,
    `mkdir -p ${DOMAIN}/nodejs/tmp && touch ${DOMAIN}/nodejs/tmp/restart.txt && ` +
    `mkdir -p ${DOMAIN}/tmp && touch ${DOMAIN}/tmp/restart.txt && echo RESTART_DONE`
  );
  console.log(r);
  conn2.end();

  console.log('\n' + '='.repeat(40));
  console.log('🎉 Done! Check https://api.pulsewritexsolutions.com/health\n');
})().catch(e => { console.error('❌ Deploy failed:', e.message); process.exit(1); });
