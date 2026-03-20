import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';

// Hardcoded CMS admin credentials
const CMS_ADMIN_EMAIL = 'pulsewritexsolutions@gmail.com';
const CMS_ADMIN_PASSWORD = 'EdmalaB@2025';

export const cmsLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (email !== CMS_ADMIN_EMAIL || password !== CMS_ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: 'cms-admin', role: 'SUPER_ADMIN', email: CMS_ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      admin: { email: CMS_ADMIN_EMAIL, name: 'Pulse X Admin', role: 'SUPER_ADMIN' },
    });
  } catch (error: any) {
    console.error('[cmsLogin]', error);
    return res.status(500).json({ success: false, error: 'Login failed.' });
  }
};
