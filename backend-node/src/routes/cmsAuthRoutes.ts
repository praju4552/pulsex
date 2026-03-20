import { Router } from 'express';
import { cmsLogin } from '../controllers/cmsAuthController';

const router = Router();

router.post('/login', cmsLogin);

export default router;
