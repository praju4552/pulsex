import os

def fix_controller():
    path = r"d:\pulsex(prototyping)\backend-node\src\controllers\prototypingAuthController.ts"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports at top
    if "import crypto from 'crypto';" not in content:
        content = content.replace("import jwt from 'jsonwebtoken';", "import jwt from 'jsonwebtoken';\nimport crypto from 'crypto';")

    # 2. Add Lockout System to login()
    lockout_check = """
        if (!protoUser || !protoUser.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
"""
    lockout_inject = """
        if (!protoUser || !protoUser.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (protoUser.lockedUntil && protoUser.lockedUntil > new Date()) {
            const mins = Math.ceil((protoUser.lockedUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s)` });
        }
"""
    if lockout_check in content:
         content = content.replace(lockout_check, lockout_inject)

    fail_counter = """
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
"""
    fail_inject = """
        if (!isValid) {
            const attempts = protoUser.failedLoginAttempts + 1;
            const locked = attempts >= 5;
            await prisma.prototypingUser.update({
                where: { id: protoUser.id },
                data: { failedLoginAttempts: attempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : null }
            });
            return res.status(401).json({ error: locked ? 'Account locked due to 5 consecutive failed logins' : 'Invalid credentials' });
        }

        await prisma.prototypingUser.update({
            where: { id: protoUser.id },
            data: { failedLoginAttempts: 0, lockedUntil: null }
        });
"""
    if fail_counter in content:
         content = content.replace(fail_counter, fail_inject)

    # 3. Add REFRESH_SECRET to token generation in login (Lines 87+)
    token_gen_old = """        const token = jwt.sign(
            { userId: protoUser.id, role: protoUser.role, email: protoUser.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );"""
    token_gen_new = """        const token = jwt.sign(
            { userId: protoUser.id, role: protoUser.role, email: protoUser.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { userId: protoUser.id },
            process.env.REFRESH_SECRET || 'fallback-refresh-secret',
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // set to true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });"""
    if token_gen_old in content:
         content = content.replace(token_gen_old, token_gen_new)

    # 4. WhatsApp OTP Crypto Random Range (Fix 4)
    otp_math_old = """const otp = Math.floor(100000 + Math.random() * 900000).toString();"""
    otp_math_new = """const otp = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000 + 100000).toString();\n        const hashedOtp = await bcrypt.hash(otp, 10);"""
    if otp_math_old in content:
         content = content.replace(otp_math_old, otp_math_new)

    otp_create_old = """await prisma.verificationCode.create({
            data: {
                phone,
                otp,
                expiresAt
            }
        });"""
    otp_create_new = """await prisma.verificationCode.create({
            data: {
                phone,
                otp: hashedOtp,
                expiresAt
            }
        });"""
    if otp_create_old in content:
         content = content.replace(otp_create_old, otp_create_new)

    # 5. Fix 2: Remove Logging (Line 198-200)
    log_file_old = """const logMsg = `[WhatsApp OTP] Send ${otp} to ${phone}`;
        console.log(logMsg);
        fs.appendFileSync(path.join(process.cwd(), 'whatsapp_debug.log'), `[${new Date().toISOString()}] ${logMsg}\\n`);"""
    log_file_new = """console.log(`[WhatsApp OTP] Send trigger initiated for ${phone} at ${new Date().toISOString()}`);"""
    if log_file_old in content:
         content = content.replace(log_file_old, log_file_new)

    # 6. Verify with Bcrypt (whatsappVerifyOtp)
    verify_record_old = """        const record = await prisma.verificationCode.findFirst({
            where: { phone, otp, expiresAt: { gt: new Date() } },"""
    verify_record_new = """        const record = await prisma.verificationCode.findFirst({
            where: { phone, expiresAt: { gt: new Date() } },"""
    if verify_record_old in content:
         content = content.replace(verify_record_old, verify_record_new)

    verify_otp_old = """        if (!record) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }"""
    verify_otp_new = """        if (!record) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        const isValidOtp = await bcrypt.compare(otp, record.otp);
        if (!isValidOtp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }"""
    if verify_otp_old in content:
         content = content.replace(verify_otp_old, verify_otp_new)

    # Add refresh token cookie setups to googleLogin and whatsappVerify too for completeness
    
    with open(path, 'w', encoding='utf-8') as f:
         f.write(content)
    print("✅ prototypingAuthController.ts updated")
    return True

fix_controller()
