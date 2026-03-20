"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institutionUserController_1 = require("../controllers/institutionUserController");
const auth_1 = require("../middleware/auth");
const institutionStatsController_1 = require("../controllers/institutionStatsController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = (0, express_1.Router)();
router.post('/create-teacher', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionUserController_1.createTeacher);
router.post('/create-student', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionUserController_1.createStudent);
router.post('/assign-teacher', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionUserController_1.assignTeacher);
router.get('/teachers', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionUserController_1.getTeachers);
router.get('/students', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionUserController_1.getStudents);
// Dashboard stats
router.get('/stats', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), institutionStatsController_1.getInstitutionStats);
// Bulk import from Excel
router.post('/bulk-import', auth_1.authenticateToken, (0, auth_1.requireRole)(['INSTITUTION_ADMIN']), upload.single('file'), institutionStatsController_1.bulkImportUsers);
exports.default = router;
