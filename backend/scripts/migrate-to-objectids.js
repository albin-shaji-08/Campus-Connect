/* Migration script
 * Converts Event.created_by (string user_id) to ObjectId of User/Admin
 * Converts Registration.student_id (string user_id) to ObjectId of User
 * Safe to re-run (idempotent) — skips documents already ObjectId
 * Usage: node scripts/migrate-to-objectids.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function connect() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function migrateEvents() {
  console.log('Migrating Event.created_by...');
  const events = await Event.find({});
  for (const ev of events) {
    const cb = ev.created_by;
    // if already ObjectId-like, skip
    if (mongoose.Types.ObjectId.isValid(cb) && typeof cb !== 'string') continue;
    try {
      // First try to find Admin by email (some earlier code used admin email)
      let user = await Admin.findOne({ email: cb });
      if (!user) {
        // Try find User by user_id
        user = await User.findOne({ user_id: cb });
      }
      if (user) {
        ev.created_by = user._id;
        await ev.save();
        console.log(`Updated Event ${ev._id} created_by -> ${user._id}`);
      } else {
        console.warn(`Could not find user/admin for created_by value '${cb}' on event ${ev._id}`);
      }
    } catch (err) {
      console.error('Error migrating event', ev._id, err.message);
    }
  }
}

async function migrateRegistrations() {
  console.log('Migrating Registration.student_id...');
  const regs = await Registration.find({});
  for (const reg of regs) {
    const sid = reg.student_id;
    if (mongoose.Types.ObjectId.isValid(sid) && typeof sid !== 'string') continue;
    try {
      const user = await User.findOne({ user_id: sid });
      if (user) {
        reg.student_id = user._id;
        await reg.save();
        console.log(`Updated Registration ${reg._id} student_id -> ${user._id}`);
      } else {
        console.warn(`Could not find user for student_id '${sid}' on registration ${reg._id}`);
      }
    } catch (err) {
      console.error('Error migrating registration', reg._id, err.message);
    }
  }
}

async function run() {
  try {
    await connect();
    await migrateEvents();
    await migrateRegistrations();
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
