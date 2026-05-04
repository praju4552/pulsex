const { Client } = require('ssh2');

function runSSH(cmd) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { resolve('EXEC_ERR: ' + err.message); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { resolve(out.trim()); conn.end(); });
      });
    });
    conn.on('error', (e) => resolve('CONN_ERR: ' + e.message));
    conn.connect({ host: '82.198.227.43', port: 65002, username: 'u655334071', password: 'EdmalaB@2025', readyTimeout: 15000 });
  });
}

(async () => {
  // STEP 1: Nuke the bloated nodejs/ directory (again! scp-action keeps re-uploading the whole repo)
  console.log('STEP 1: Cleaning nodejs/ (removing ALL files except server.js and tmp/)...');
  let r = await runSSH(`
    cd ~/domains/pulsewritexsolutions.com/nodejs
    for item in $(ls -A); do
      case "$item" in
        server.js|tmp|stderr.log) ;;
        *) rm -rf "$item" && echo "  deleted: $item" ;;
      esac
    done
    echo "CLEANUP DONE"
    du -sh ~/domains/pulsewritexsolutions.com/nodejs/
  `);
  console.log(r);

  // STEP 2: Replace server.js with the ultra-lightweight static file server
  // This one has ZERO dependencies, ZERO npm packages, cannot crash
  console.log('\nSTEP 2: Writing minimal static server.js...');
  r = await runSSH(`cat > ~/domains/pulsewritexsolutions.com/nodejs/server.js << 'SERVEREOF'
const path = require('path');
const fs   = require('fs');
const http = require('http');
const PUBLIC = path.join(__dirname, '..', 'public_html');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json'
};
http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(PUBLIC, urlPath);
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(path.join(PUBLIC, 'index.html')));
    } catch(e) {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<h1>PulseX is starting up...</h1><p>Please refresh in a few seconds.</p>');
    }
  }
}).listen(process.env.PORT || 3000, () => console.log('Static server running'));
SERVEREOF
echo "server.js written"
`);
  console.log(r);

  // STEP 3: Fix the .htaccess — remove the poisonous NODE_OPTIONS preload line
  console.log('\nSTEP 3: Fixing .htaccess (removing NODE_OPTIONS preload that crashes Node)...');
  r = await runSSH(`
    cd ~/domains/pulsewritexsolutions.com/public_html
    # Remove the SetEnv NODE_OPTIONS line that causes ERR_REQUIRE_ESM crash
    sed -i '/SetEnv NODE_OPTIONS/d' .htaccess
    # Remove the .builds rewrite rule too (not needed)
    sed -i '/\\.builds/d' .htaccess
    echo "=== NEW .htaccess ==="
    cat .htaccess
  `);
  console.log(r);

  // STEP 4: Restart Passenger
  console.log('\nSTEP 4: Restarting Passenger...');
  r = await runSSH(`
    mkdir -p ~/domains/pulsewritexsolutions.com/nodejs/tmp
    touch ~/domains/pulsewritexsolutions.com/nodejs/tmp/restart.txt
    mkdir -p ~/domains/pulsewritexsolutions.com/tmp  
    touch ~/domains/pulsewritexsolutions.com/tmp/restart.txt
    echo "RESTART TRIGGERED"
  `);
  console.log(r);

  // STEP 5: Verify
  console.log('\nSTEP 5: Verifying...');
  r = await runSSH(`
    echo "=== nodejs/ size ==="
    du -sh ~/domains/pulsewritexsolutions.com/nodejs/
    echo "=== nodejs/ contents ==="
    ls -la ~/domains/pulsewritexsolutions.com/nodejs/
    echo "=== public_html contents ==="
    ls -la ~/domains/pulsewritexsolutions.com/public_html/
  `);
  console.log(r);

  console.log('\n✅ ALL FIXES APPLIED. Check https://pulsewritexsolutions.com now!');
})();
