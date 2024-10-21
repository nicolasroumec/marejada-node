import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/enroll', authController.enroll)

router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
})

export default router;