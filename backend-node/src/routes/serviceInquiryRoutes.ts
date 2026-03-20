import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as InquiryController from '../controllers/serviceInquiryController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'uploads/inquiries';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'inquiry-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_EXTS = ['.gbr', '.zip', '.stl', '.pdf', '.dxf', '.step', '.png', '.jpg'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────────
// Anyone can submit an inquiry (no auth required)
router.post('/', upload.single('attachment'), InquiryController.createInquiry);

// ── ADMIN ONLY ──────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.listInquiries);
router.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.getInquiry);
router.get('/:id/download', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.downloadAttachment);
router.patch('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.updateInquiryStatus);

export default router;
