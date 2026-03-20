"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ptImageUpload = exports.ptUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Main uploads dir (videos + thumbnails)
const uploadDir = path_1.default.join(__dirname, '../../uploads/project-templates');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
// Images sub-dir
const imageDir = path_1.default.join(__dirname, '../../uploads/project-templates/images');
if (!fs_1.default.existsSync(imageDir))
    fs_1.default.mkdirSync(imageDir, { recursive: true });
// ── Shared filename builder ─────────────────────────────────────────────────
const uniqueName = (file) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${unique}${path_1.default.extname(file.originalname)}`;
};
// ── Main (video + thumbnail) storage ────────────────────────────────────────
const mainStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, uniqueName(file)),
});
const videoFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|mov|webm/;
    if (allowed.test(path_1.default.extname(file.originalname).toLowerCase()))
        cb(null, true);
    else
        cb(new Error('Only image and video files are allowed'));
};
exports.ptUpload = (0, multer_1.default)({
    storage: mainStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB
});
// ── Image-only storage (10 MB max, saved to /images sub-dir) ────────────────
const imageStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, imageDir),
    filename: (_req, file, cb) => cb(null, uniqueName(file)),
});
const imageFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    if (allowed.test(path_1.default.extname(file.originalname).toLowerCase()))
        cb(null, true);
    else
        cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
};
exports.ptImageUpload = (0, multer_1.default)({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
