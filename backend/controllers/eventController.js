// controllers/eventController.js
const Event = require('../models/Event');
const User = require('../models/User');
const Admin = require('../models/Admin');

// ✅ Create Event
exports.createEvent = async (req, res) => {
  try {

    const { title, description, venue, date, registrationClosesAt, maxParticipants } = req.body;
    const image = req.file ? req.file.path : null;

    // Validate date presence and correctness
    if (!date) return res.status(400).json({ msg: 'Event date is required' });
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return res.status(400).json({ msg: 'Invalid event date' });

    // Validate registration closing date
    if (!registrationClosesAt) return res.status(400).json({ msg: 'Registration closing date is required' });
    const parsedClosingDate = new Date(registrationClosesAt);
    if (isNaN(parsedClosingDate.getTime())) return res.status(400).json({ msg: 'Invalid registration closing date' });
    
    // Ensure registration closing is before event date
    if (parsedClosingDate >= parsedDate) {
      return res.status(400).json({ msg: 'Registration closing date must be before event date' });
    }

    // Validate maxParticipants
    if (!maxParticipants) return res.status(400).json({ msg: 'Maximum participants is required' });
    const parsedMaxParticipants = parseInt(maxParticipants, 10);
    if (isNaN(parsedMaxParticipants) || parsedMaxParticipants < 1) {
      return res.status(400).json({ msg: 'Maximum participants must be at least 1' });
    }

    // created_by: store MongoDB ObjectId of creator (admin or user)
    if (!req.userId || !req.userRole) return res.status(401).json({ msg: 'User not authenticated' });
    // Only admin or organizer may create events
    if (req.userRole !== 'admin' && req.userRole !== 'organizer') return res.status(403).json({ msg: 'Only admin or organizer can create events' });
    const event = await Event.create({
      title,
      description,
      venue,
      date: parsedDate,
      registrationClosesAt: parsedClosingDate,
      maxParticipants: parsedMaxParticipants,
      created_by: req.userId,
      image
    });

    res.status(201).json({ msg: 'Event created', event });
  } catch (err) {
    console.error('Create Event Error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ✅ Read All Events
exports.getEvents = async (req, res) => {
  try {
    // If client requests their own events with ?created_by=me, require authentication
    if (req.query.created_by === 'me') {
      if (!req.userId) return res.status(401).json({ msg: 'Not authenticated' });
      // return events created by the authenticated user (organizer or admin)
      const events = await Event.find({ created_by: req.userId }).sort({ date: 1 });
      return res.status(200).json(events);
    }

    // Build filter query
    const filter = {};
    
    // Filter by organizer (created_by)
    if (req.query.organizer) {
      filter.created_by = req.query.organizer;
    }

    // Build sort query
    let sortQuery = {};
    const sortBy = req.query.sortBy || 'date'; // default sort by date
    const sortOrder = req.query.sortOrder || 'asc'; // default ascending (upcoming first)
    
    if (sortBy === 'date') {
      sortQuery.date = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'title') {
      sortQuery.title = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortQuery.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    // Fetch events with populated created_by field for organizer info
    const User = require('../models/User');
    const Admin = require('../models/Admin');
    
    const events = await Event.find(filter).sort(sortQuery);
    
    // Populate created_by with name from User or Admin
    const populatedEvents = await Promise.all(events.map(async (event) => {
      const eventObj = event.toObject();
      
      // Try to find in User collection first
      let creator = await User.findById(event.created_by).select('name email role');
      
      // If not found, try Admin collection
      if (!creator) {
        creator = await Admin.findById(event.created_by).select('email');
        if (creator) {
          creator = { name: 'Admin', email: creator.email, role: 'admin' };
        }
      }
      
      eventObj.created_by = creator || { name: 'Unknown', email: '', role: 'unknown' };
      return eventObj;
    }));

    res.status(200).json(populatedEvents);
  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ✅ Get Single Event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    
    // Try to populate creator info from User or Admin
    let creator = await User.findById(event.created_by).select('name email role').lean();
    if (!creator) {
      creator = await Admin.findById(event.created_by).select('email').lean();
      if (creator) {
        creator.role = 'admin';
        creator.name = 'Admin'; // Default name for admin
      }
    }
    
    if (creator) {
      event.created_by = creator;
    }
    
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ✅ Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { date, registrationClosesAt, maxParticipants, ...rest } = req.body;

    // Only allow updating allowed fields
    const { title, description, venue } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (venue) updateData.venue = venue;
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ msg: 'Invalid event date' });
      updateData.date = parsedDate;
    }
    if (registrationClosesAt) {
      const parsedClosingDate = new Date(registrationClosesAt);
      if (isNaN(parsedClosingDate.getTime())) return res.status(400).json({ msg: 'Invalid registration closing date' });
      updateData.registrationClosesAt = parsedClosingDate;
    }
    if (maxParticipants !== undefined) {
      const parsedMaxParticipants = parseInt(maxParticipants, 10);
      if (isNaN(parsedMaxParticipants) || parsedMaxParticipants < 1) {
        return res.status(400).json({ msg: 'Maximum participants must be at least 1' });
      }
      updateData.maxParticipants = parsedMaxParticipants;
    }
    
    // If both date and registrationClosesAt are being updated, validate their relationship
    if (updateData.date && updateData.registrationClosesAt) {
      if (updateData.registrationClosesAt >= updateData.date) {
        return res.status(400).json({ msg: 'Registration closing date must be before event date' });
      }
    }
    
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Require authentication
    if (!req.userId || !req.userRole) return res.status(401).json({ msg: 'Not authenticated' });

    // Ownership/role check: admins can update any event, organizers can update only their events
    if (req.userRole !== 'admin') {
      if (req.userRole !== 'organizer') return res.status(403).json({ msg: 'Access denied' });
      // verify ownership
      const ev = await Event.findById(req.params.id).select('created_by');
      if (!ev) return res.status(404).json({ msg: 'Event not found' });
      if (ev.created_by.toString() !== req.userId.toString()) return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }

    // Debug: log incoming params and update payload size
    console.log('UpdateEvent called for id:', req.params.id, 'updateData keys:', Object.keys(updateData));

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: 'No valid fields provided to update' });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.status(200).json({ msg: 'Event updated', event });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ✅ Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    // Require authentication
    if (!req.userId || !req.userRole) return res.status(401).json({ msg: 'Not authenticated' });

    // Only admins or owning organizers may delete
    if (req.userRole !== 'admin') {
      if (req.userRole !== 'organizer') return res.status(403).json({ msg: 'Access denied' });
      const ev = await Event.findById(req.params.id).select('created_by');
      if (!ev) return res.status(404).json({ msg: 'Event not found' });
      if (ev.created_by.toString() !== req.userId.toString()) return res.status(403).json({ msg: 'Access denied: not the event owner' });
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.status(200).json({ msg: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
