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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const InquiryController = __importStar(require("../controllers/serviceInquiryController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ensure upload directory exists
const uploadDir = 'uploads/inquiries';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'inquiry-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const ALLOWED_EXTS = ['.gbr', '.zip', '.stl', '.pdf', '.dxf', '.step', '.png', '.jpg'];
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (ALLOWED_EXTS.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('File type not allowed'));
        }
    }
});
// ── PUBLIC ──────────────────────────────────────────────────────────────────────
// Anyone can submit an inquiry (no auth required)
router.post('/', upload.single('attachment'), InquiryController.createInquiry);
// ── ADMIN ONLY ──────────────────────────────────────────────────────────────────
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), InquiryController.listInquiries);
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), InquiryController.getInquiry);
router.get('/:id/download', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), InquiryController.downloadAttachment);
router.patch('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), InquiryController.updateInquiryStatus);
exports.default = router;
