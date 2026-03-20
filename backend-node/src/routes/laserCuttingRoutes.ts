import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as LaserController from '../controllers/laserCuttingController';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'uploads/laser';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.dxf', '.svg', '.pdf', '.ai', '.eps', '.png', '.jpg', '.jpeg', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only DXF, SVG, PDF, AI, EPS, PNG, JPG, and BMP files are allowed'));
    }
  },
});

// Public endpoints
router.post('/upload', upload.single('designFile'), LaserController.uploadDesign);
router.get('/status/:fileId', LaserController.getFileStatus);
router.post('/calculate-price', LaserController.calculatePriceEndpoint);
router.get('/materials', LaserController.getMaterials);
router.post('/order', LaserController.createOrder);

export default router;
