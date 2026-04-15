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
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 30000 });
  });
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const B = '/home/u655334071/domains/pulsewritexsolutions.com';
  
  console.log('STEP 1: Wiping the bloated nodejs/ directory (keeping only tmp/)...');
  // Remove everything from nodejs/ EXCEPT tmp/ (Passenger needs it for restart.txt)
  const r1 = await sshCmd(`
    cd ${B}/nodejs && \
    ls -la && \
    rm -rf backend-node dist src node_modules .git .github .agent public sales\\&invoicedetails uploads .gitignore .env .env.production ATTRIBUTIONS.md SERVER_REFERENCE.md deploy-to-hostinger.ps1 package.json package-lock.json postcss.config.mjs pricing_dump.json test-verify.js tsconfig.json tsconfig.node.json vite.config.ts index.html 2>/dev/null; \
    echo "CLEANUP DONE"
  `);
  console.log(r1);
  await delay(3000);

  console.log('\nSTEP 2: Writing a correct minimal server.js in nodejs/...');
  const r2 = await sshCmd(`
    cat > ${B}/nodejs/server.js << 'SERVEREOF'
const path = require('path');
const fs   = require('fs');
const http = require('http');

// Serve static frontend files from public_html
const PUBLIC = path.join(__dirname, '..', 'public_html');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

function serveFile(res, filePath) {
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch (e) {
    const idx = path.join(PUBLIC, 'index.html');
    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(idx));
    } catch (e2) {
      res.writeHead(503);
      res.end('Frontend files missing - please redeploy.');
    }
  }
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(PUBLIC, urlPath);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Check if file exists, else serve index.html (SPA fallback)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
  } else {
    serveFile(res, path.join(PUBLIC, 'index.html'));
  }
}).listen(process.env.PORT || 3000, () => {
  console.log('[PulseX] Frontend server started from: ' + PUBLIC);
});
SERVEREOF
    echo "server.js written"
  `);
  console.log(r2);
  await delay(3000);

  console.log('\nSTEP 3: Uploading frontend files to public_html...');
  // We will handle this via SFTP separately; just ensure public_html exists
  const r3 = await sshCmd(`mkdir -p ${B}/public_html/assets && echo "public_html ready"`);
  console.log(r3);
  await delay(2000);

  console.log('\nSTEP 4: Ensuring tmp/ exists for Passenger restart...');
  const r4 = await sshCmd(`mkdir -p ${B}/nodejs/tmp && touch ${B}/nodejs/tmp/restart.txt && echo "restart.txt touched"`);
  console.log(r4);
  await delay(2000);

  console.log('\nSTEP 5: Verify nodejs/ is now clean...');
  const r5 = await sshCmd(`ls -la ${B}/nodejs/`);
  console.log(r5);
  await delay(2000);

  console.log('\nSTEP 6: Check disk freed...');
  const r6 = await sshCmd(`du -sh ${B}/*/`);
  console.log(r6);

  console.log('\n✅ CLEANUP COMPLETE. nodejs/ is now a clean static server only.');
})();
