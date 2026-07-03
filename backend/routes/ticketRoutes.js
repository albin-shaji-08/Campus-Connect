const express = require('express');
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  getAllTickets,
  deleteTicket,
  updateTicket
} = require('../controllers/ticketController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// User routes
router.post('/book', authMiddleware, bookTicket);
router.get('/my', authMiddleware, getMyTickets);


// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllTickets);
router.get('/event/:eventId', authMiddleware, adminMiddleware, require('../controllers/ticketController').getRegistrationsByEvent);
router.delete('/:id', authMiddleware, adminMiddleware, deleteTicket);
router.patch('/:id', authMiddleware, adminMiddleware, updateTicket);

module.exports = router;
