const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/authMiddleware');
const organizerOrAdmin = require('../middleware/organizerOrAdmin');
const adminMiddleware = require('../middleware/adminMiddleware');

// Send reminder for specific event (organizer or admin)
router.post('/event/:eventId', authMiddleware, organizerOrAdmin, reminderController.sendEventReminder);

// Trigger tomorrow's reminders manually (admin only)
router.post('/trigger-tomorrow', authMiddleware, adminMiddleware, reminderController.triggerTomorrowReminders);

module.exports = router;
