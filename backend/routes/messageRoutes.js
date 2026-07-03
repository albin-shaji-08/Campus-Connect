const express = require('express');
const router = express.Router();
const { getMessages, createMessage, deleteMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/', createMessage); // anyone can send
router.get('/', authMiddleware, adminMiddleware, getMessages); // admin only
router.delete('/:id', authMiddleware, adminMiddleware, deleteMessage); // admin only

module.exports = router;
