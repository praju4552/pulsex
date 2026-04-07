"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pcbController_1 = require("../controllers/pcbController");
const router = (0, express_1.Router)();
// ── Gerber upload directory ───────────────────────────────────────────────────
const GERBER_UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads/gerbers');
if (!fs_1.default.existsSync(GERBER_UPLOAD_DIR)) {
    fs_1.default.mkdirSync(GERBER_UPLOAD_DIR, { recursive: true });
}
// ── Allowed Gerber extensions ─────────────────────────────────────────────────
const ALLOWED_GERBER_EXTENSIONS = [
    '.zip', '.rar', '.gbr', '.gtl', '.gbl',
    '.gto', '.gbo', '.gts', '.gbs', '.drl', '.xln',
];
// ── Multer: diskStorage (prevents OOM from large in-memory buffers) ───────────
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, GERBER_UPLOAD_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            cb(null, safe);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB — sufficient for any Gerber zip
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (ALLOWED_GERBER_EXTENSIONS.includes(ext))
            return cb(null, true);
        cb(new Error(`Invalid file type. Allowed: ${ALLOWED_GERBER_EXTENSIONS.join(', ')}`));
    },
});
// POST /api/pcb/parse-gerber
router.post('/parse-gerber', upload.single('gerberFile'), pcbController_1.parsePCBGerber);
// POST /api/pcb/render-gerber  — returns SVG renders
router.post('/render-gerber', upload.single('gerberFile'), pcbController_1.renderPCBGerber);
exports.default = router;
