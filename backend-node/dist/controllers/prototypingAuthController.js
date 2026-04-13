"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappVerifyOtp = exports.whatsappRequestOtp = exports.updateProfile = exports.googleLogin = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../config/auth");
const db_1 = __importDefault(require("../db"));
const google_auth_library_1 = require("google-auth-library");
// In production, move to .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';
const googleClient = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields (name, phone, email, password) are required' });
        }
        // Validate password containing numeric and special char
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one number and one special character (!@#$%^&* etc.)' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        const existingUser = yield db_1.default.prototypingUser.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS);
        const user = yield db_1.default.prototypingUser.create({
            data: {
                name,
                phone,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        res.status(201).json({ message: 'Prototyping user registered successfully', user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Prototyping Signup Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phone, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and Password are required' });
        }
        const protoUser = yield db_1.default.prototypingUser.findUnique({
            where: { email }
        });
        if (!protoUser || !protoUser.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (protoUser.lockedUntil && protoUser.lockedUntil > new Date()) {
            const mins = Math.ceil((protoUser.lockedUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s)` });
        }
        const isValid = yield bcryptjs_1.default.compare(password, protoUser.password);
        if (!isValid) {
            const attempts = protoUser.failedLoginAttempts + 1;
            const locked = attempts >= 5;
            yield db_1.default.prototypingUser.update({
                where: { id: protoUser.id },
                data: { failedLoginAttempts: attempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : null }
            });
            return res.status(401).json({ error: locked ? 'Account locked due to 5 consecutive failed logins' : 'Invalid credentials' });
        }
        yield db_1.default.prototypingUser.update({
            where: { id: protoUser.id },
            data: { failedLoginAttempts: 0, lockedUntil: null }
        });
        const token = jsonwebtoken_1.default.sign({ userId: protoUser.id, role: protoUser.role, email: protoUser.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: protoUser.id }, process.env.REFRESH_SECRET || 'fallback-refresh-secret', { expiresIn: '7d' });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // set to true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const { password: _ } = protoUser, userWithoutPassword = __rest(protoUser, ["password"]);
        res.json({ message: 'Login successful', user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Prototyping Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.login = login;
/**
 * Handle Google Login via UserInfo Payload
 */
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { access_token } = req.body;
        if (!access_token)
            return res.status(400).json({ error: 'access_token is required' });
        // ✅ Verify server-side with Google to prevent user-faked profiles
        const googleRes = yield fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const googlePayload = yield googleRes.json();
        if (!googlePayload || !googlePayload.email) {
            return res.status(401).json({ error: 'Invalid or expired Google token' });
        }
        const { email, name, sub: googleId } = googlePayload;
        let user = yield db_1.default.prototypingUser.findUnique({ where: { email } });
        if (!user) {
            user = yield db_1.default.prototypingUser.create({
                data: {
                    email,
                    name: name || 'Google User',
                    googleId,
                    role: 'USER'
                }
            });
        }
        else if (!user.googleId) {
            // Link existing account
            user = yield db_1.default.prototypingUser.update({
                where: { id: user.id },
                data: { googleId }
            });
        }
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({ message: 'Google login successful', user: userWithoutPassword, token: jwtToken });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});
exports.googleLogin = googleLogin;
/**
 * Update User Profile
 */
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, phone, streetAddress, apartment, city, state, zip, country, secondaryLabel, secondaryStreetAddress, secondaryApartment, secondaryCity, secondaryState, secondaryZip, secondaryCountry } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = yield db_1.default.prototypingUser.update({
            where: { id: userId },
            data: {
                name,
                phone,
                streetAddress,
                apartment,
                city,
                state,
                zip,
                country,
                secondaryLabel,
                secondaryStreetAddress,
                secondaryApartment,
                secondaryCity,
                secondaryState,
                secondaryZip,
                secondaryCountry
            }
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
    }
    catch (error) {
        console.error('Prototyping Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.updateProfile = updateProfile;
/**
 * WhatsApp OTP Request
 */
const whatsappRequestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = req.body;
        if (!phone)
            return res.status(400).json({ error: 'Phone number required' });
        const otp = (crypto_1.default.randomBytes(3).readUIntBE(0, 3) % 900000 + 100000).toString();
        const hashedOtp = yield bcryptjs_1.default.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
        yield db_1.default.verificationCode.create({
            data: {
                phone,
                otp: hashedOtp,
                expiresAt
            }
        });
        // [DEV MODE] Log OTP and return in response
        console.log(`[WHATSAPP-DEV] OTP for ${phone}: ${otp}`);
        res.json({
            message: 'OTP generated and sent',
            devModeOtp: otp
        });
    }
    catch (error) {
        console.error('WhatsApp request error:', error);
        res.status(500).json({ error: 'Failed to process WhatsApp request' });
    }
});
exports.whatsappRequestOtp = whatsappRequestOtp;
/**
 * WhatsApp OTP Verification
 */
const whatsappVerifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            return res.status(400).json({ error: 'Phone and OTP required' });
        const record = yield db_1.default.verificationCode.findFirst({
            where: { phone, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        });
        if (!record) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        const isValidOtp = yield bcryptjs_1.default.compare(otp, record.otp);
        if (!isValidOtp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }
        yield db_1.default.verificationCode.deleteMany({ where: { phone } });
        let user = yield db_1.default.prototypingUser.findUnique({ where: { phone } });
        if (!user) {
            user = yield db_1.default.prototypingUser.create({
                data: {
                    email: `${phone}@whatsapp-user.local`,
                    name: 'WhatsApp User',
                    phone,
                    whatsappId: phone,
                    role: 'USER'
                }
            });
        }
        else if (!user.whatsappId) {
            user = yield db_1.default.prototypingUser.update({
                where: { id: user.id },
                data: { whatsappId: phone }
            });
        }
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({ message: 'WhatsApp login successful', user: userWithoutPassword, token: jwtToken });
    }
    catch (error) {
        console.error('WhatsApp Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});
exports.whatsappVerifyOtp = whatsappVerifyOtp;
