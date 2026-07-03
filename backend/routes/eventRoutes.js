const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authOptional = require('../middleware/authOptional');
const organizerOrAdmin = require('../middleware/organizerOrAdmin');
const upload = require('../middleware/uploadMiddleware');

// Allow admin or authenticated organizer to create event. authMiddleware sets req.userRole
router.post('/', authMiddleware, upload.single('image'), (req, res, next) => {
  // Only admin or organizer may create events
  if (req.userRole !== 'admin' && req.userRole !== 'organizer') {
    return res.status(403).json({ msg: 'Only admin or organizer can create events' });
  }
  next();
}, createEvent);
router.get('/', authOptional, getEvents);
router.get('/:id', getEventById);
// Allow admin or organizer (owner) to update/delete
router.put('/:id', authMiddleware, organizerOrAdmin, upload.single('image'), updateEvent);
router.delete('/:id', authMiddleware, organizerOrAdmin, deleteEvent);

module.exports = router;
