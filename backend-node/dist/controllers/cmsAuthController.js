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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmsLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
// Hardcoded CMS admin credentials
const CMS_ADMIN_EMAIL = 'pulsewritexsolutions@gmail.com';
const CMS_ADMIN_PASSWORD = 'EdmalaB@2025';
const cmsLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }
        if (email !== CMS_ADMIN_EMAIL || password !== CMS_ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: 'cms-admin', role: 'SUPER_ADMIN', email: CMS_ADMIN_EMAIL }, auth_1.JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            success: true,
            token,
            admin: { email: CMS_ADMIN_EMAIL, name: 'Pulse X Admin', role: 'SUPER_ADMIN' },
        });
    }
    catch (error) {
        console.error('[cmsLogin]', error);
        return res.status(500).json({ success: false, error: 'Login failed.' });
    }
});
exports.cmsLogin = cmsLogin;
