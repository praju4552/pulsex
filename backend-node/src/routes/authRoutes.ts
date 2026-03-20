import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/test-json', (req, res) => {
    res.json({ receivedBody: req.body, contentType: req.headers['content-type'] });
});

export default router;
