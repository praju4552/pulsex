import { Router } from 'express';
import multer from 'multer';
import { parsePCBGerber, renderPCBGerber } from '../controllers/pcbController';

const router = Router();

// Keep file in memory for parsing (max 100 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// POST /api/pcb/parse-gerber
router.post('/parse-gerber', upload.single('gerberFile'), parsePCBGerber);

// POST /api/pcb/render-gerber  — returns SVG renders
router.post('/render-gerber', upload.single('gerberFile'), renderPCBGerber);

export default router;

