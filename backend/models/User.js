const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['student', 'organizer', 'admin'], required: true },
    dept: {
      type: String,
      required: function() {
        // dept is required for students only
        return this.role === 'student';
      }
    },
    student_id: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          // If role is student, student_id is required
          if (this.role === 'student') return !!v;
          return true;
        },
        message: 'student_id is required for students.'
      }
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
