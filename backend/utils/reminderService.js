const cron = require('node-cron');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendEventReminderEmail } = require('./emailService');

// Function to send reminders for events happening tomorrow
async function sendTomorrowReminders() {
  try {
    console.log('🔍 Checking for events happening tomorrow...');

    // Get tomorrow's date range (start and end of day)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find events happening tomorrow
    const tomorrowEvents = await Event.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      }
    });

    if (tomorrowEvents.length === 0) {
      console.log('✅ No events happening tomorrow');
      return;
    }

    console.log(`📧 Found ${tomorrowEvents.length} event(s) happening tomorrow`);

    // Process each event
    for (const event of tomorrowEvents) {
      try {
        // Get all registrations for this event
        const registrations = await Registration.find({ event_id: event._id })
          .populate('student_id', 'name email');

        if (registrations.length === 0) {
          console.log(`⚠️  No participants for event: ${event.title}`);
          continue;
        }

        console.log(`📬 Sending reminders to ${registrations.length} participant(s) for: ${event.title}`);

        // Send email to each participant
        let sentCount = 0;
        let failCount = 0;

        for (const registration of registrations) {
          if (registration.student_id && registration.student_id.email) {
            try {
              await sendEventReminderEmail(
                registration.student_id.email,
                registration.student_id.name,
                event
              );
              sentCount++;
            } catch (emailError) {
              console.error(`❌ Failed to send reminder to ${registration.student_id.email}:`, emailError.message);
              failCount++;
            }
          }
        }

        console.log(`✅ Event: ${event.title} - Sent: ${sentCount}, Failed: ${failCount}`);
      } catch (eventError) {
        console.error(`❌ Error processing event ${event.title}:`, eventError.message);
      }
    }

    console.log('✅ Reminder job completed');
  } catch (error) {
    console.error('❌ Error in reminder service:', error);
  }
}

// Schedule reminder job to run daily at 9 AM
function startReminderScheduler() {
  // Cron format: second minute hour day month weekday
  // '0 9 * * *' = Every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('\n⏰ Running scheduled reminder job at', new Date().toLocaleString());
    sendTomorrowReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Change to your timezone
  });

  console.log('✅ Reminder scheduler started - will run daily at 9:00 AM');
}

module.exports = {
  startReminderScheduler,
  sendTomorrowReminders
};
