const mongoose = require('mongoose');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';

async function run() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;
    const indexes = await db.collection('events').indexes();
    console.log('Current indexes on events:', indexes.map(i => i.name));

    const target = indexes.find(i => i.name === 'event_id_1');
    if (!target) {
      console.log('No event_id_1 index found. Nothing to do.');
      process.exit(0);
    }

    await db.collection('events').dropIndex('event_id_1');
    console.log('Dropped index event_id_1 successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to drop index:', err.message);
    process.exit(1);
  }
}

run();
