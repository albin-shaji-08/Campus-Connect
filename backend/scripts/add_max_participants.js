/**
 * Migration script to add default maxParticipants for existing events
 * Run this once to populate the new required field for all existing events
 * 
 * Usage: node backend/scripts/add_max_participants.js
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

    // Find events without maxParticipants field
    const eventsToUpdate = await Event.find({ 
      maxParticipants: { $exists: false } 
    });

    console.log(`Found ${eventsToUpdate.length} events without maxParticipants`);

    if (eventsToUpdate.length === 0) {
      console.log('No events need to be updated. Migration complete!');
      process.exit(0);
    }

    let updated = 0;
    for (const event of eventsToUpdate) {
      // Set default maxParticipants to 100
      // You can adjust this number based on your needs
      event.maxParticipants = 100;
      await event.save();
      updated++;
      console.log(`Updated event: ${event.title} (${event._id}) - maxParticipants set to 100`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} events.`);
    console.log('All events now have maxParticipants set to 100 by default.');
    console.log('Organizers can edit this value for each event as needed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateEvents();
