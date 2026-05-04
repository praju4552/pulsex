/**
 * deploy.cjs — Full SSH Deploy Script
 * Uploads backend dist/, uploads frontend dist/, runs prisma db push, restarts Passenger.
 * Usage: node deploy.cjs
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '82.198.227.43',
  port: 65002,
  username: 'u655334071',
  password: 'EdmalaB@2025',
  readyTimeout: 30000,
  keepaliveInterval: 10000,
};

const DOMAIN = '/home/u655334071/domains/pulsewritexsolutions.com';
const REMOTE_BACKEND_DIST = `${DOMAIN}/backendnode/dist`;
const REMOTE_PRISMA       = `${DOMAIN}/backendnode/prisma`;
const LOCAL_BACKEND_DIST  = path.join(__dirname, 'dist');
const LOCAL_PRISMA        = path.join(__dirname, 'prisma');
const LOCAL_FRONTEND_DIST = path.join(__dirname, '..', 'dist');

// ── Helpers ────────────────────────────────────────────────────────────────

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
      if (err) return resolve({ ok: false, out: 'EXEC_ERR: ' + err.message });
      let out = '';
      stream.on('data', d => out += d.toString());
      stream.stderr.on('data', d => out += d.toString());
      stream.on('close', () => resolve({ ok: true, out: out.trim() }));
    });
  });
}

function sftpGet(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      resolve(sftp);
    });
  });
}

function sftpMkdir(sftp, dir) {
  return new Promise(r => sftp.mkdir(dir, () => r()));
}

function sftpPut(sftp, local, remote) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(local, remote, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Recursively upload a local directory to a remote path (filters to .js/.json/.ts/.sql)
async function uploadDir(sftp, localDir, remoteDir, allFiles = false) {
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const localPath  = path.join(localDir, item);
    const remotePath = `${remoteDir}/${item}`;
    const stats = fs.statSync(localPath);
    if (stats.isDirectory()) {
      await sftpMkdir(sftp, remotePath);
      await uploadDir(sftp, localPath, remotePath, allFiles);
    } else {
      const ext = path.extname(item);
      if (allFiles || ['.js', '.json', '.ts', '.sql', '.prisma'].includes(ext)) {
        try {
          await sftpPut(sftp, localPath, remotePath);
          console.log('  ✓', item);
        } catch (e) {
          console.error('  ✗', item, e.message);
        }
      }
    }
  }
}

// Walk all files in a directory
function walkAll(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkAll(full, list);
    else list.push(full);
  }
  return list;
}

// ── Main Deploy ────────────────────────────────────────────────────────────

(async () => {
  console.log('\n🚀 PulseX SSH Deploy\n' + '='.repeat(50));

  // ── Step 1: Upload backend dist/ ──────────────────────────────────────
  console.log('\n[1/5] Uploading backend dist/ ...');
  {
    const conn = await sshConnect();
    const sftp = await sftpGet(conn);
    await sftpMkdir(sftp, REMOTE_BACKEND_DIST);
    await uploadDir(sftp, LOCAL_BACKEND_DIST, REMOTE_BACKEND_DIST);
    conn.end();
    console.log('✅ Backend dist uploaded');
  }

  // ── Step 2: Upload prisma schema + migrations ─────────────────────────
  console.log('\n[2/5] Uploading prisma schema + migrations ...');
  {
    const conn = await sshConnect();
    const sftp = await sftpGet(conn);
    await sftpMkdir(sftp, REMOTE_PRISMA);
    await uploadDir(sftp, LOCAL_PRISMA, REMOTE_PRISMA, false);
    conn.end();
    console.log('✅ Prisma schema uploaded');
  }

  // ── Step 3: Upload frontend dist/ ─────────────────────────────────────
  console.log('\n[3/5] Uploading frontend dist/ ...');
  {
    const conn = await sshConnect();
    const sftp  = await sftpGet(conn);
    await sshExec(conn, `mkdir -p ${DOMAIN}/public_html/assets`);
    const files = walkAll(LOCAL_FRONTEND_DIST);
    console.log(`  Uploading ${files.length} files...`);
    for (const file of files) {
      const remotePath = file
        .replace(LOCAL_FRONTEND_DIST, `${DOMAIN}/public_html`)
        .replace(/\\/g, '/');
      try {
        await sftpPut(sftp, file, remotePath);
        console.log('  ✓', path.basename(file));
      } catch (e) {
        console.error('  ✗', path.basename(file), e.message);
      }
    }
    conn.end();
    console.log('✅ Frontend uploaded');
  }

  // ── Step 4: Run prisma db push (applies new billing/GST columns) ──────
  console.log('\n[4/5] Running prisma db push on server ...');
  {
    const conn = await sshConnect();
    const r = await sshExec(conn,
      `export PATH=/opt/alt/alt-nodejs18/root/usr/bin:$PATH && ` +
      `cd ${DOMAIN}/backendnode && ` +
      `./node_modules/.bin/prisma db push --accept-data-loss 2>&1 | tail -15`
    );
    console.log(r.out);
    conn.end();
    console.log('✅ Database schema updated');
  }

  // ── Step 5: Restart Passenger ─────────────────────────────────────────
  console.log('\n[5/5] Restarting Passenger ...');
  {
    const conn = await sshConnect();
    const r = await sshExec(conn,
      `mkdir -p ${DOMAIN}/nodejs/tmp && ` +
      `touch ${DOMAIN}/nodejs/tmp/restart.txt && ` +
      `mkdir -p ${DOMAIN}/tmp && ` +
      `touch ${DOMAIN}/tmp/restart.txt && ` +
      `echo "RESTART_DONE"`
    );
    console.log(r.out);
    conn.end();
    console.log('✅ Passenger restarted');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Deploy complete! Check https://pulsewritexsolutions.com');
  console.log('   API: https://api.pulsewritexsolutions.com/health\n');
})().catch(e => {
  console.error('\n❌ Deploy failed:', e.message);
  process.exit(1);
});
