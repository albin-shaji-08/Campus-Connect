// models/Event.js
const mongoose = require('mongoose');


// Helper to generate a short unique id for events (used when an existing unique index on event_id exists)
function generateEventId() {
  // Example: 'evt_1672531190123_a1b2'
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const eventSchema = new mongoose.Schema({
  // Legacy or indexed event identifier (some deployments have a unique index on this field).
  // Ensure we always write a non-null value to avoid duplicate key on null.
  event_id: { type: String, unique: true, default: generateEventId },
  title: { type: String, required: true },
  description: { type: String },
  venue: { type: String },
  date: { type: Date, required: true },
  // Registration closing date/time - after this time, no new registrations allowed
  registrationClosesAt: { type: Date, required: true },
  // Maximum number of participants allowed to register
  maxParticipants: { type: Number, required: true, min: 1 },
  // store creator's DB ObjectId (can be User or Admin id)
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  image: { type: String }, // store image path
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
