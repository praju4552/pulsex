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
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const db_1 = __importDefault(require("../db"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_FILE = path_1.default.join(process.cwd(), 'auth_debug.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs_1.default.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = yield db_1.default.prototypingUser.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS);
        // Always create as USER role — role elevation is admin-only
        const user = yield db_1.default.prototypingUser.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: hashedPassword,
                role: 'USER',
                credits: 20
            }
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        log(`Login attempt for: ${email}`);
        const user = yield db_1.default.prototypingUser.findUnique({
            where: { email }
        });
        log(`User found in DB: ${user ? 'Yes' : 'No'}`);
        if (!user || !user.password) {
            log('User not found or has no password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        let isValid = false;
        const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        if (isBcryptHash) {
            isValid = yield bcryptjs_1.default.compare(password, user.password);
        }
        // Fallback: if password is stored as plain text
        if (!isValid && (password === user.password)) {
            log('Plain-text password match detected! Auto-hashing for future security...');
            isValid = true;
            try {
                const newHash = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS);
                yield db_1.default.prototypingUser.update({
                    where: { id: user.id },
                    data: { password: newHash }
                });
            }
            catch (hashErr) {
                // Ignore hash error
            }
        }
        if (!isValid) {
            log('Invalid password provided');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, auth_1.JWT_SECRET, { expiresIn: auth_1.TOKEN_EXPIRY });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({ message: 'Login successful', user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.login = login;
