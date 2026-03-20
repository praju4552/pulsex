import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Main uploads dir (videos + thumbnails)
const uploadDir = path.join(__dirname, '../../uploads/project-templates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Images sub-dir
const imageDir = path.join(__dirname, '../../uploads/project-templates/images');
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// ── Shared filename builder ─────────────────────────────────────────────────
const uniqueName = (file: Express.Multer.File) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${unique}${path.extname(file.originalname)}`;
};

// ── Main (video + thumbnail) storage ────────────────────────────────────────
const mainStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, uniqueName(file)),
});

const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|mov|webm/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image and video files are allowed'));
};

export const ptUpload = multer({
    storage: mainStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB
});

// ── Image-only storage (10 MB max, saved to /images sub-dir) ────────────────
const imageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, imageDir),
    filename: (_req, file, cb) => cb(null, uniqueName(file)),
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
};

export const ptImageUpload = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
