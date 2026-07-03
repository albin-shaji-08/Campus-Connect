// Admin: Get all registered users for a specific event
exports.getRegistrationsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    // Find all tickets for this event, populate user details
    const tickets = await Ticket.find({ event: eventId })
      .populate('user', 'name email dept student_id role');
    // Return only user info (and optionally ticket info)
    const registrations = tickets.map(ticket => ({
      user: ticket.user,
      ticketId: ticket._id,
      status: ticket.status,
      bookedAt: ticket.createdAt
    }));
    res.status(200).json(registrations);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

// Book Ticket (one per user per event, no payment)
exports.bookTicket = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.userId;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // Check if user already has a ticket for this event
    const existing = await Ticket.findOne({ user: userId, event: eventId });
    if (existing) {
      // User already registered for this event
      return res.status(400).json({ msg: "You have already registered for this event." });
    }

    if (event.availableTickets < 1) {
      return res.status(400).json({ msg: "No tickets available" });
    }

    event.availableTickets -= 1;
    await event.save();

    const ticket = await Ticket.create({
      user: userId,
      event: event._id,
      quantity: 1,
      totalPrice: 0 // No payment
    });

    res.status(201).json({ msg: "Ticket booked", ticket });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// User: Get my tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.userId }).populate('event');
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('event').populate('user', 'email');
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: Update ticket status
exports.updateTicket = async (req, res) => {
  try {
    const updated = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json({ msg: 'Ticket updated', ticket: updated });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
