import os

def fix_google_auth_frontend():
    path = r"d:\pulsex(prototyping)\src\app\components\prototyping\PrototypingAuth.tsx"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_block = """        // We fetch user info from Google using the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        
        // Custom backend route for exchanging google payload directly into session JWT
        const response = await fetch('/api/prototyping-auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googlePayload: userInfo })
        });"""
    new_block = """        // ✅ Send raw access_token to backend for server-side verification
        const response = await fetch('/api/prototyping-auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });"""
    
    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(path, 'w', encoding='utf-8') as f:
             f.write(content)
        print("✅ Frontend PrototypingAuth.tsx updated")
        return True
    print("❌ Could not find google fetch block in PrototypingAuth.tsx")
    return False

def fix_google_auth_backend():
    path = r"d:\pulsex(prototyping)\backend-node\src\controllers\prototypingAuthController.ts"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_block = """export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { googlePayload } = req.body;
        if (!googlePayload || !googlePayload.email) return res.status(400).json({ error: 'Valid Google payload required' });

        const { email, name, sub: googleId } = googlePayload;"""
    
    new_block = """export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'access_token is required' });

        // ✅ Verify server-side with Google to prevent user-faked profiles
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const googlePayload = await googleRes.json();

        if (!googlePayload || !googlePayload.email) {
             return res.status(401).json({ error: 'Invalid or expired Google token' });
        }

        const { email, name, sub: googleId } = googlePayload;"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(path, 'w', encoding='utf-8') as f:
             f.write(content)
        print("✅ Backend prototypingAuthController.ts google login updated")
        return True
    print("❌ Could not find googleLogin definition in backing response")
    return False

fix_google_auth_frontend()
fix_google_auth_backend()
