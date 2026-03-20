import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { initiatePayment, verifyPayment } from '../controllers/paymentController';

const router = Router();

router.post('/create-order', authenticateToken, initiatePayment);
router.post('/verify', authenticateToken, verifyPayment);

export default router;
