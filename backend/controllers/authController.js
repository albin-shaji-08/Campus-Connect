// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { sendVerificationEmail } = require('../utils/emailService');

const createToken = (id, role, expiresIn = '3d') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

exports.registerUser = async (req, res) => {

  const { name, email, password, confirmPassword, role, dept, student_id } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }

  if (!name || !email || !password || !role || !dept) {
    return res.status(400).json({ msg: 'All fields are required' });
  }

  if (role === 'student' && !student_id) {
    return res.status(400).json({ msg: 'Student ID is required for students' });
  }

  // Generate unique random user_id
  function generateUserId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  let user_id;
  let isUnique = false;
  while (!isUnique) {
    user_id = generateUserId();
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.findOne({ user_id });
    if (!exists) isUnique = true;
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const user = await User.create({
      user_id,
      name,
      email,
      password: hash,
      role,
      dept,
      student_id: role === 'student' ? student_id : null,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      res.status(201).json({ 
        msg: 'Registration successful! Please check your email to verify your account.',
        userId: user.user_id,
        email: user.email,
        emailSent: true
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(201).json({ 
        msg: 'Registration successful but verification email failed to send. Please use resend option.',
        userId: user.user_id,
        email: user.email,
        emailSent: false
      });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// Unified login for both user and admin
exports.login = async (req, res) => {
  const { email, password, remember } = req.body; // remember: boolean flag from client

  // choose token lifetime
  const tokenExpiry = remember ? '30d' : '3d';
  const cookieMaxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 3 * 24 * 60 * 60 * 1000; // ms

  try {
      // Try admin first to avoid shadowing by any User with same email
      let admin = await Admin.findOne({ email });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
        const token = createToken(admin._id, 'admin', tokenExpiry);
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          path: '/',
          maxAge: cookieMaxAge,
        });
        return res.status(200).json({ msg: "Login successful", role: 'admin', token, expiresIn: tokenExpiry });
      }

      // Then try user (by email or user_id)
      let user = await User.findOne({ $or: [ { email }, { user_id: email } ] });
      if (user) {
        // Check if email is verified
        if (!user.isEmailVerified) {
          return res.status(403).json({ 
            msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
            emailVerified: false,
            email: user.email
          });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
        const token = createToken(user.user_id, user.role, tokenExpiry);
        // set cookie for user
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          path: '/',
          maxAge: cookieMaxAge,
        });
        return res.status(200).json({ msg: "Login successful", role: user.role, token, expiresIn: tokenExpiry });
      }

    // Not found
    return res.status(400).json({ msg: "User or Admin not found" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Return basic info about the currently authenticated user
exports.me = async (req, res) => {
  try {
    // authMiddleware sets req.userId and req.userRole
    if (!req.userId) return res.status(401).json({ msg: 'Not authenticated' });
    return res.status(200).json({ userId: req.userId, role: req.userRole });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ msg: 'Verification token is required' });
    }

    // First check if user exists with this token (active or expired)
    let user = await User.findOne({
      emailVerificationToken: token
    });

    // If user found but already verified
    if (user && user.isEmailVerified) {
      return res.status(200).json({ msg: 'Email already verified! You can log in now.' });
    }

    // Check if token is valid and not expired
    user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ msg: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    await sendVerificationEmail(email, user.name, verificationToken);

    res.status(200).json({ msg: 'Verification email sent successfully! Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ msg: err.message });
  }
};
