import os

def fix_prisma():
    path = r"d:\pulsex(prototyping)\backend-node\prisma\schema.prisma"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Target PrototypingUser credits block
    target = "  credits       Int      @default(0) // Moved from old User model"
    if target not in content:
        # Try alternate whitespace
        target = "  credits     Int      @default(0) // Moved from old User model"
    
    if target in content:
        content = content.replace(target, target + "\n  failedLoginAttempts Int       @default(0)\n  lockedUntil         DateTime?")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ schema.prisma updated")
        return True
    else:
        print("❌ Could not find PrototypingUser credits field in schema.prisma")
        return False

def fix_app_py():
    path = r"d:\pulsex(prototyping)\backend\api\app.py"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    target = 'uvicorn.run(app, host="0.0.0.0", port=8001)'
    if target in content:
        content = content.replace(target, 'uvicorn.run("api.app:app", host="127.0.0.1", port=8001, reload=False)')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ app.py updated")
        return True
    print("❌ Could not find uvicorn.run in app.py")
    return False

def fix_bat():
    path = r"d:\pulsex(prototyping)\START_ALL_SERVERS.bat"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove --host 0.0.0.0 or replace with 127.0.0.1
    if "--host 0.0.0.0" in content:
        content = content.replace("--host 0.0.0.0", "--host 127.0.0.1")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ START_ALL_SERVERS.bat updated")
        return True
    return False

def fix_config_auth():
    path = r"d:\pulsex(prototyping)\backend-node\src\config\auth.ts"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("export const TOKEN_EXPIRY = '24h';", "export const TOKEN_EXPIRY = '15m';\nexport const REFRESH_TOKEN_EXPIRY = '7d';\nexport const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback-refresh-secret-key';")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ config/auth.ts updated")
    return True

fix_prisma()
fix_app_py()
fix_bat()
fix_config_auth()
