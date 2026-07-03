const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendEventReminderEmail } = require('../utils/emailService');
const { sendTomorrowReminders } = require('../utils/reminderService');

// Send reminder for a specific event (manual trigger by organizer/admin)
exports.sendEventReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { customMessage } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check authorization (admin or event organizer)
    if (userRole !== 'admin' && event.created_by.toString() !== userId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to send reminders for this event' });
    }

    // Get all registrations
    const registrations = await Registration.find({ event_id: eventId })
      .populate('student_id', 'name email');

    if (registrations.length === 0) {
      return res.status(404).json({ msg: 'No participants registered for this event' });
    }

    // Send emails
    let sentCount = 0;
    let failCount = 0;
    const failedEmails = [];

    for (const registration of registrations) {
      if (registration.student_id && registration.student_id.email) {
        try {
          await sendEventReminderEmail(
            registration.student_id.email,
            registration.student_id.name,
            event,
            customMessage
          );
          sentCount++;
        } catch (emailError) {
          console.error(`Failed to send to ${registration.student_id.email}:`, emailError.message);
          failCount++;
          failedEmails.push(registration.student_id.email);
        }
      }
    }

    res.status(200).json({
      msg: 'Reminder emails sent',
      sent: sentCount,
      failed: failCount,
      failedEmails: failedEmails,
      totalParticipants: registrations.length
    });
  } catch (err) {
    console.error('Error sending event reminder:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Trigger tomorrow's reminders manually (admin only)
exports.triggerTomorrowReminders = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    await sendTomorrowReminders();
    res.status(200).json({ msg: 'Tomorrow reminders triggered successfully' });
  } catch (err) {
    console.error('Error triggering reminders:', err);
    res.status(500).json({ msg: err.message });
  }
};
