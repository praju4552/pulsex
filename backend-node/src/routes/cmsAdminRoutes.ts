import { Router } from 'express';
import { getDashboardStats, listUsers, getUserDetail, getPricingConfigs, updatePricingConfig, getAllOrders, getAllPayments } from '../controllers/cmsAdminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All CMS admin routes require SUPER_ADMIN
router.use(authenticateToken, requireRole(['SUPER_ADMIN']));

router.get('/stats', getDashboardStats);
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.get('/pricing', getPricingConfigs);
router.patch('/pricing', updatePricingConfig);
router.get('/orders', getAllOrders);
router.get('/payments', getAllPayments);

export default router;
