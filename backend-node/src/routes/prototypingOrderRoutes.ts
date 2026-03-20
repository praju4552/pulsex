import { Router } from 'express';
import {
  createPrototypingOrder,
  listPrototypingOrders,
  getPrototypingOrder,
  updatePrototypingOrder,
  listUserPrototypingOrders,
  trackPrototypingOrder,
  downloadPrototypingDocument,
} from '../controllers/prototypingOrderController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// ── PUBLIC routes (no token required) ─────────────────────────────────────────
// Allow guest order placement and public order tracking status
router.post('/', createPrototypingOrder);
router.get('/track/:orderRef', trackPrototypingOrder);

// ── AUTHENTICATED USER routes ──────────────────────────────────────────────────
// User must be logged in to view their orders or download their documents
router.get('/user/:userId', authenticateToken, listUserPrototypingOrders);
router.get('/:id/download', authenticateToken, downloadPrototypingDocument);

// ── ADMIN-ONLY routes ──────────────────────────────────────────────────────────
// Must be whitelisted SUPER_ADMIN email (prajwalshetty4552@gmail.com or pulsewritexsolutions@gmail.com)
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), listPrototypingOrders);
router.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), getPrototypingOrder);
router.patch('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), updatePrototypingOrder);

export default router;

