import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: { userId: string; role: string; institutionId?: string; email?: string };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // Fallback to query param for browser-initiated downloads (window.open)
    if (!token && req.query.token) {
        token = req.query.token as string;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        if (!user || !user.role) return res.status(403).json({ error: 'Token missing role information' });
        req.user = user;
        next();
    });
};

// Flexible role-based access control
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const SUPER_ADMIN_EMAILS = ['pulsewritex@gmail.com'];

        if (req.user.role === 'SUPER_ADMIN') {
            if (req.user.email && SUPER_ADMIN_EMAILS.includes(req.user.email)) {
                return next();
            } else {
                return res.status(403).json({ error: 'Access denied: invalid super admin account' });
            }
        }

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    };
};

// Backward compatibility alias
export const requireAdmin = requireRole(['SUPER_ADMIN']);
