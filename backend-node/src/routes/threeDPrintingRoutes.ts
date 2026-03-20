import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as ThreeDController from '../controllers/threeDPrintingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'uploads/3dmodels';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.stl', '.obj', '.step', '.stp', '.3mf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only STL, OBJ, STEP, and 3MF files are allowed'));
    }
  },
});

// Endpoints
router.post('/upload', upload.single('modelFile'), ThreeDController.uploadAndProcess);
router.get('/status/:fileId', ThreeDController.getFileStatus);
router.post('/order', ThreeDController.createOrder);
// File download requires authentication - 3D model files are customer property
router.get('/download/:fileId', authenticateToken, ThreeDController.downloadFile);

export default router;
