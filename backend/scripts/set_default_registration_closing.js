/**
 * Migration script to add default registrationClosesAt for existing events
 * Run this once to populate the new required field for all existing events
 * 
 * Usage: node backend/scripts/set_default_registration_closing.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

async function migrateEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find events without registrationClosesAt field
    const eventsToUpdate = await Event.find({ 
      registrationClosesAt: { $exists: false } 
    });

    console.log(`Found ${eventsToUpdate.length} events without registrationClosesAt`);

    if (eventsToUpdate.length === 0) {
      console.log('No events need to be updated. Migration complete!');
      process.exit(0);
    }

    let updated = 0;
    for (const event of eventsToUpdate) {
      // Set registrationClosesAt to the event date
      // This means registrations will be open until the event starts
      event.registrationClosesAt = event.date;
      await event.save();
      updated++;
      console.log(`Updated event: ${event.title} (${event._id})`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} events.`);
    console.log('All events now have registrationClosesAt set to their event date.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateEvents();
