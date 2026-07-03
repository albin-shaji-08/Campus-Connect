// Script to verify all existing users in the database
// Run this once to allow existing test users to login

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyExistingUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/';
    const dbName = process.env.MONGO_DB || 'CampusConnect';
    
    await mongoose.connect(`${mongoUri}${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all users who are not verified
    const unverifiedUsers = await User.find({ 
      $or: [
        { isEmailVerified: { $exists: false } },
        { isEmailVerified: false }
      ]
    });
    
    console.log(`\nFound ${unverifiedUsers.length} unverified users`);
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified!');
      await mongoose.connection.close();
      return;
    }
    
    // Update all users to be verified
    const result = await User.updateMany(
      {
        $or: [
          { isEmailVerified: { $exists: false } },
          { isEmailVerified: false }
        ]
      },
      {
        $set: {
          isEmailVerified: true
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: ""
        }
      }
    );
    
    console.log(`\n✅ Updated ${result.modifiedCount} users`);
    console.log('✅ All existing users can now login without email verification\n');
    
    // Display updated users
    const verifiedUsers = await User.find({ isEmailVerified: true }).select('name email role');
    console.log('Verified users:');
    verifiedUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('✅ Script completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
verifyExistingUsers();
