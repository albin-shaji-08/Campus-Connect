// routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const { createBanner, getBanners, deleteBanner, updateBanner } = require('../controllers/bannerController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', authMiddleware, adminMiddleware, upload.single('bannerImage'), createBanner); // Admin adds banner
router.get('/', getBanners);             // Public: fetch all banners for carousel
router.delete('/:id', authMiddleware, adminMiddleware, deleteBanner); // Admin deletes banner
router.patch('/:id', authMiddleware, adminMiddleware, upload.single('bannerImage'), updateBanner);

module.exports = router;
