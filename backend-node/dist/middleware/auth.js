"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    // Fallback to query param for browser-initiated downloads (window.open)
    if (!token && req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }
    jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Invalid or expired token' });
        if (!user || !user.role)
            return res.status(403).json({ error: 'Token missing role information' });
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// Flexible role-based access control
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    };
};
exports.requireRole = requireRole;
// Backward compatibility alias
exports.requireAdmin = (0, exports.requireRole)(['SUPER_ADMIN']);
