import { Router } from 'express';
import { getPublicPriceConfig } from '../controllers/cmsAdminController';

const router = Router();

router.get('/:key', getPublicPriceConfig);

export default router;
