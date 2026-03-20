"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT_ROUNDS = exports.REFRESH_SECRET = exports.REFRESH_TOKEN_EXPIRY = exports.TOKEN_EXPIRY = exports.JWT_SECRET = void 0;
exports.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
exports.TOKEN_EXPIRY = '15m';
exports.REFRESH_TOKEN_EXPIRY = '7d';
exports.REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback-refresh-secret-key';
exports.SALT_ROUNDS = 12;
