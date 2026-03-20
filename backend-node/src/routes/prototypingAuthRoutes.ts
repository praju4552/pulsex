import { Router } from 'express';
import { signup, login, googleLogin, whatsappRequestOtp, whatsappVerifyOtp, updateProfile } from '../controllers/prototypingAuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/whatsapp/request-otp', whatsappRequestOtp);
router.post('/whatsapp/verify', whatsappVerifyOtp);
// Requires valid JWT — userId is read from the token, not request body
router.post('/update-profile', authenticateToken, updateProfile);

export default router;
