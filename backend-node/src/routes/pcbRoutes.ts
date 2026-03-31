import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parsePCBGerber, renderPCBGerber } from '../controllers/pcbController';

const router = Router();

// ── Gerber upload directory ───────────────────────────────────────────────────
const GERBER_UPLOAD_DIR = path.join(__dirname, '../../uploads/gerbers');
if (!fs.existsSync(GERBER_UPLOAD_DIR)) {
  fs.mkdirSync(GERBER_UPLOAD_DIR, { recursive: true });
}

// ── Allowed Gerber extensions ─────────────────────────────────────────────────
const ALLOWED_GERBER_EXTENSIONS = [
  '.zip', '.rar', '.gbr', '.gtl', '.gbl',
  '.gto', '.gbo', '.gts', '.gbs', '.drl', '.xln',
];

// ── Multer: diskStorage (prevents OOM from large in-memory buffers) ───────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, GERBER_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB — sufficient for any Gerber zip
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_GERBER_EXTENSIONS.includes(ext)) return cb(null, true);
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_GERBER_EXTENSIONS.join(', ')}`));
  },
});

// POST /api/pcb/parse-gerber
router.post('/parse-gerber', upload.single('gerberFile'), parsePCBGerber);

// POST /api/pcb/render-gerber  — returns SVG renders
router.post('/render-gerber', upload.single('gerberFile'), renderPCBGerber);

export default router;

