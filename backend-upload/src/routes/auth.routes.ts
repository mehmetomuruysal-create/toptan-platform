import { Router } from 'express';
import { register, login, verifyEmail } from '../controllers/auth.controller';
import { googleOAuth, appleOAuth } from '../controllers/oauth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);

router.post('/oauth/google', googleOAuth);
router.post('/oauth/apple', appleOAuth);

// Test için güvenli (protected) endpoint
router.get('/me', protect, (req, res) => {
    res.status(200).json({ status: 'success', data: { user: req.user } });
});

export default router;
