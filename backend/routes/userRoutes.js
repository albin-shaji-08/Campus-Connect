// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { updateProfilePic, getProfile, getAllUsers, deleteUser } = require('../controllers/userController');

const userMiddleware = require('../middleware/userMiddleware');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// POST /api/users/profile-pic
router.post('/profile-pic', userMiddleware, upload.single('profilePic'), updateProfilePic);
router.get('/profile', authMiddleware, getProfile);
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);
router.put('/profile-pic', authMiddleware, upload.single('profilePic'), updateProfilePic);

// Admin: create organizer
router.post('/organizer', authMiddleware, adminMiddleware, (req, res, next) => {
	// delegate to controller
	next();
}, require('../controllers/userController').createOrganizer);

module.exports = router;
