// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, login, me, verifyEmail, resendVerificationEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/me', authMiddleware, me);

module.exports = router;
