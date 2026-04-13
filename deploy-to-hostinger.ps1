# ═══════════════════════════════════════════════════════════════════════
# PulseX Manual Deployment Script for Hostinger
# Run this in PowerShell: .\deploy-to-hostinger.ps1
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ── Collect credentials ──
$SSH_HOST = Read-Host "Enter Hostinger SSH Host (e.g. xxx.hostinger.com)"
$SSH_USER = Read-Host "Enter Hostinger SSH Username"
$SSH_PASS = Read-Host "Enter Hostinger SSH Password" -AsSecureString
$SSH_PASS_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SSH_PASS))
$SSH_PORT = 65002
$REMOTE_BASE = "~/domains/pulsewritexsolutions.com"

Write-Host "`n=== Step 1: Building Backend ===" -ForegroundColor Cyan
Set-Location "d:\pulsex(prototyping)\backend-node"
npm install
npm run build
Write-Host "Backend build complete." -ForegroundColor Green

Write-Host "`n=== Step 2: Building Frontend ===" -ForegroundColor Cyan
Set-Location "d:\pulsex(prototyping)"
$env:VITE_API_URL = "https://api.pulsewritexsolutions.com"
$env:VITE_GOOGLE_CLIENT_ID = "835363988192-jr2ftrbtlklhui007gosnstjqca77m71.apps.googleusercontent.com"
$env:VITE_RAZORPAY_KEY_ID = "rzp_live_SaYqVVu3DybnJx"
npm install
npm run build
Write-Host "Frontend build complete." -ForegroundColor Green

Write-Host "`n=== Step 3: Uploading to Hostinger via SCP ===" -ForegroundColor Cyan

# Upload server.js bootloader
Write-Host "Uploading server.js..."
scp -P $SSH_PORT "d:\pulsex(prototyping)\server.js" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/"

# Upload backend dist
Write-Host "Uploading backend dist..."
scp -r -P $SSH_PORT "d:\pulsex(prototyping)\backend-node\dist" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload backend prisma
Write-Host "Uploading backend prisma..."
scp -r -P $SSH_PORT "d:\pulsex(prototyping)\backend-node\prisma" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload backend package files
Write-Host "Uploading package.json..."
scp -P $SSH_PORT "d:\pulsex(prototyping)\backend-node\package.json" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"
scp -P $SSH_PORT "d:\pulsex(prototyping)\backend-node\package-lock.json" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload frontend
Write-Host "Uploading frontend dist..."
scp -r -P $SSH_PORT "d:\pulsex(prototyping)\dist\*" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/public_html/"
scp -P $SSH_PORT "d:\pulsex(prototyping)\dist\.htaccess" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/public_html/"

Write-Host "`n=== Step 4: Installing deps & restarting on server ===" -ForegroundColor Cyan

$REMOTE_COMMANDS = @"
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:`$PATH
export CI=1

echo '=== Installing backend dependencies ==='
cd $REMOTE_BASE/backendnode
npm install
chmod -R +x ./node_modules/.bin/
./node_modules/.bin/prisma generate
npm prune --omit=dev

echo '=== Restarting Node.js ==='
mkdir -p $REMOTE_BASE/tmp
touch $REMOTE_BASE/tmp/restart.txt
pkill -f 'node dist/app.js' || true
sleep 2
echo '=== Deploy complete ==='
"@

ssh -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" $REMOTE_COMMANDS

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Frontend: https://pulsewritexsolutions.com" -ForegroundColor Yellow
Write-Host "Backend:  https://api.pulsewritexsolutions.com/health" -ForegroundColor Yellow
