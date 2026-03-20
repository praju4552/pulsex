"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
// This file is kept for backward compatibility.
// The actual implementation now lives in auth.ts as requireRole(['SUPER_ADMIN'])
const auth_1 = require("./auth");
exports.requireAdmin = (0, auth_1.requireRole)(['SUPER_ADMIN']);
