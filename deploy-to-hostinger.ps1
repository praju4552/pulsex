# ═══════════════════════════════════════════════════════════════════════
# PulseX Manual Deployment Script for Hostinger
# Run this in PowerShell: .\deploy-to-hostinger.ps1
#
# VERIFIED PATHS:
#   server.js      → ~/domains/pulsewritexsolutions.com/nodejs/server.js
#   backend dist   → ~/domains/pulsewritexsolutions.com/backendnode/dist/
#   frontend dist  → ~/domains/pulsewritexsolutions.com/public_html/
#   Node.js path   → /opt/alt/alt-nodejs18/root/usr/bin (Node 18, matches Passenger)
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ── Collect credentials ──
$SSH_HOST = Read-Host "Enter Hostinger SSH Host (e.g. 82.198.227.43)"
$SSH_USER = Read-Host "Enter Hostinger SSH Username"
$SSH_PASS = Read-Host "Enter Hostinger SSH Password" -AsSecureString
$SSH_PASS_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SSH_PASS))
$SSH_PORT = 65002
$REMOTE_BASE = "~/domains/pulsewritexsolutions.com"
$LOCAL_ROOT = "d:\pulsex(prototyping)"

# ═══════════════════════════════════════════════════════════════════════
# STEP 1: Build Backend
# ═══════════════════════════════════════════════════════════════════════
Write-Host "`n=== Step 1: Building Backend ===" -ForegroundColor Cyan
Set-Location "$LOCAL_ROOT\backend-node"
npm install
npm run build
Write-Host "Backend build complete." -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════
# STEP 2: Build Frontend
# ═══════════════════════════════════════════════════════════════════════
Write-Host "`n=== Step 2: Building Frontend ===" -ForegroundColor Cyan
Set-Location "$LOCAL_ROOT"
$env:VITE_API_URL = "https://api.pulsewritexsolutions.com"
$env:VITE_GOOGLE_CLIENT_ID = "835363988192-jr2ftrbtlklhui007gosnstjqca77m71.apps.googleusercontent.com"
$env:VITE_RAZORPAY_KEY_ID = "rzp_live_SaYqVVu3DybnJx"
npm install
npm run build
Write-Host "Frontend build complete." -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════
# STEP 3: Upload to Hostinger via SCP
# ═══════════════════════════════════════════════════════════════════════
Write-Host "`n=== Step 3: Uploading to Hostinger via SCP ===" -ForegroundColor Cyan

# Upload server.js bootloader → nodejs/ (where Passenger looks for it)
Write-Host "Uploading server.js to nodejs/..."
scp -P $SSH_PORT "$LOCAL_ROOT\server.js" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/nodejs/server.js"

# Upload backend dist → backendnode/dist/ (NOT backend-node/)
Write-Host "Uploading backend dist..."
scp -r -P $SSH_PORT "$LOCAL_ROOT\backend-node\dist" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload backend prisma schema
Write-Host "Uploading backend prisma..."
scp -r -P $SSH_PORT "$LOCAL_ROOT\backend-node\prisma" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload backend package files
Write-Host "Uploading package.json..."
scp -P $SSH_PORT "$LOCAL_ROOT\backend-node\package.json" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"
scp -P $SSH_PORT "$LOCAL_ROOT\backend-node\package-lock.json" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backendnode/"

# Upload frontend (additive — does NOT wipe existing files)
Write-Host "Uploading frontend dist..."
scp -P $SSH_PORT "$LOCAL_ROOT\dist\index.html" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/public_html/"
scp -r -P $SSH_PORT "$LOCAL_ROOT\dist\assets" "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/public_html/"

# ═══════════════════════════════════════════════════════════════════════
# STEP 4: Install deps, prisma generate, restart via Passenger
# ═══════════════════════════════════════════════════════════════════════
Write-Host "`n=== Step 4: Installing deps & restarting on server ===" -ForegroundColor Cyan

$REMOTE_COMMANDS = @"
# Use Node 18 (matches what Passenger/Hostinger actually runs)
export PATH=/opt/alt/alt-nodejs18/root/usr/bin:`$PATH
export CI=1

echo '=== Node version ==='
node -v

echo '=== Installing backend dependencies ==='
cd $REMOTE_BASE/backendnode
npm install
chmod -R +x ./node_modules/.bin/

echo '=== Running prisma generate ==='
./node_modules/.bin/prisma generate

echo '=== Pushing schema to database ==='
CI=1 FORCE_COLOR=0 ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss < /dev/null || echo 'db push failed or timed out, continuing'

npm prune --omit=dev

echo '=== Protecting nodejs/ (removing stray files) ==='
cd $REMOTE_BASE/nodejs
for item in `$(ls -A); do
  case "`$item" in
    server.js|tmp|stderr.log) ;; 
    *) rm -rf "`$item"; echo "  removed: `$item" ;;
  esac
done

echo '=== Injecting DB connection limit (fixing uv_thread assertion) ==='
if grep -q "DATABASE_URL" $REMOTE_BASE/backendnode/.env; then
  # If connection_limit is not already present, append it to the DATABASE_URL line
  if ! grep -q "connection_limit" $REMOTE_BASE/backendnode/.env; then
    sed -i -e 's|?.*"|?connection_limit=2"|' -e 's|"$|?connection_limit=2"|' $REMOTE_BASE/backendnode/.env
  fi
fi

echo '=== Injecting PassengerSpawnMethod direct into API .htaccess ==='
find $REMOTE_BASE -name ".htaccess" -path "*/backendnode/*" -exec sed -i -e '/PassengerSpawnMethod direct/d' -e '1i PassengerSpawnMethod direct' {} \;
find $REMOTE_BASE/public_html -name ".htaccess" -exec sed -i -e '/PassengerSpawnMethod direct/d' -e '1i PassengerSpawnMethod direct' {} \;

echo '=== Restarting Passenger ==='
mkdir -p $REMOTE_BASE/nodejs/tmp
touch $REMOTE_BASE/nodejs/tmp/restart.txt
mkdir -p $REMOTE_BASE/tmp
touch $REMOTE_BASE/tmp/restart.txt


echo '=== Verifying public_html ==='
ls -la $REMOTE_BASE/public_html/

echo '=== Deploy complete ==='
"@

ssh -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" $REMOTE_COMMANDS

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Frontend: https://pulsewritexsolutions.com" -ForegroundColor Yellow
Write-Host "Backend:  https://api.pulsewritexsolutions.com/health" -ForegroundColor Yellow
