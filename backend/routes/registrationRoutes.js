const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const organizerOrAdmin = require('../middleware/organizerOrAdmin');

// Student registers for event
router.post('/register', authMiddleware, registrationController.registerForEvent);

// Student unregisters from event
router.delete('/unregister', authMiddleware, registrationController.unregisterFromEvent);

// Public: get registration count for an event
router.get('/event/:eventId/count', registrationController.getRegistrationCount);

// Export registrations as CSV (organizer/admin only)
router.get('/event/:eventId/export/csv', authMiddleware, organizerOrAdmin, registrationController.exportRegistrationsCSV);

// Export registrations as PDF (organizer/admin only)
router.get('/event/:eventId/export/pdf', authMiddleware, organizerOrAdmin, registrationController.exportRegistrationsPDF);

// Admin/Organizer: get all registrations for an event (owner or admin)
router.get('/event/:eventId', authMiddleware, organizerOrAdmin, registrationController.getRegistrationsByEvent);

// Student: get all events registered for
router.get('/my', authMiddleware, registrationController.getMyRegistrations);

module.exports = router;
