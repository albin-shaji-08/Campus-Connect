const Event = require('../models/Event');

module.exports = async (req, res, next) => {
  // Require authentication first (authMiddleware should set req.userRole & req.userId)
  if (!req.userRole) return res.status(401).json({ msg: 'Not authenticated' });

  if (req.userRole === 'admin') return next();

  if (req.userRole === 'organizer') {
    // Check ownership of the event. Event id can be in params or body
    // Be defensive: req.body may be undefined for multipart/form-data requests when multer runs after this middleware.
    const body = req.body || {};
    const eventId = req.params.eventId || req.params.id || body.event_id || body.eventId;
    if (!eventId) return res.status(400).json({ msg: 'Event id required' });
    const event = await Event.findById(eventId).select('created_by');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.created_by.toString() !== req.userId.toString()) {
      return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }
    return next();
  }

  return res.status(403).json({ msg: 'Access denied' });
};
