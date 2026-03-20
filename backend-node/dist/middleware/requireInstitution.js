"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInstitution = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const ALLOWED_INSTITUTION_ROLES = ['INSTITUTION_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
const requireInstitution = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
        if (!decoded || !decoded.role) {
            return res.status(403).json({ message: 'Token missing role information' });
        }
        if (!ALLOWED_INSTITUTION_ROLES.includes(decoded.role)) {
            return res.status(403).json({ message: 'Unauthorized role for institution access' });
        }
        if (!decoded.institutionId) {
            return res.status(403).json({ message: 'Institution access required' });
        }
        // Attach to request
        req.user = decoded;
        req.institutionId = decoded.institutionId;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.requireInstitution = requireInstitution;
