// This file is kept for backward compatibility.
// The actual implementation now lives in auth.ts as requireRole(['SUPER_ADMIN'])
import { requireRole } from './auth';

export const requireAdmin = requireRole(['SUPER_ADMIN']);
