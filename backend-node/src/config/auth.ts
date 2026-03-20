export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
export const TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback-refresh-secret-key';
export const SALT_ROUNDS = 12;
