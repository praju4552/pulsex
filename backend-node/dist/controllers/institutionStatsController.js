"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.bulkImportUsers = exports.getInstitutionStats = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../config/auth");
const XLSX = __importStar(require("xlsx"));
// GET /api/institution-admin/stats
const getInstitutionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const [totalTeachers, totalStudents, totalAssignments] = yield Promise.all([
            db_1.default.user.count({ where: { role: 'TEACHER', institutionId } }),
            db_1.default.user.count({ where: { role: 'STUDENT', institutionId } }),
            db_1.default.teacherStudent.count({ where: { institutionId } })
        ]);
        // Get institution name
        const institution = yield db_1.default.institution.findUnique({
            where: { id: institutionId },
            select: { name: true }
        });
        res.json({
            institutionName: (institution === null || institution === void 0 ? void 0 : institution.name) || 'Unknown',
            totalTeachers,
            totalStudents,
            totalAssignments,
            totalUsers: totalTeachers + totalStudents,
            // Dummy enrichment stats (as requested by user)
            completionRate: 82,
            avgSkillLevel: 4,
            activeCourses: 12,
            tokensUsed: 842,
            tokensTotal: 1000
        });
    }
    catch (error) {
        console.error('Error fetching institution stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.getInstitutionStats = getInstitutionStats;
// POST /api/institution-admin/bulk-import
const bulkImportUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Parse Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }
        const results = { created: 0, skipped: 0, errors: [] };
        for (const row of rows) {
            const name = row.name || row.Name || '';
            const email = row.email || row.Email || '';
            const password = row.password || row.Password || '';
            const roleRaw = (row.role || row.Role || 'STUDENT').toUpperCase().trim();
            const role = roleRaw === 'TEACHER' ? 'TEACHER' : 'STUDENT';
            if (!name || !email || !password) {
                results.errors.push(`Row skipped: missing name/email/password for "${email || name || 'unknown'}"`);
                results.skipped++;
                continue;
            }
            try {
                // Check if user already exists
                const existing = yield db_1.default.user.findUnique({ where: { email } });
                if (existing) {
                    results.errors.push(`${email}: already exists, skipped`);
                    results.skipped++;
                    continue;
                }
                const hashedPassword = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS || 10);
                yield db_1.default.user.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        rawPassword: password,
                        role,
                        institutionId
                    }
                });
                results.created++;
            }
            catch (err) {
                results.errors.push(`${email}: ${err.message}`);
                results.skipped++;
            }
        }
        res.json(Object.assign({ success: true, message: `Import complete: ${results.created} created, ${results.skipped} skipped` }, results));
    }
    catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Bulk import failed: ' + error.message });
    }
});
exports.bulkImportUsers = bulkImportUsers;
