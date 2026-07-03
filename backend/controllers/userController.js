// controllers/userController.js
const User = require('../models/User');

exports.updateProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.profilePic = req.file?.path;
    await user.save();

    res.status(200).json({ msg: "Profile picture updated", profilePic: user.profilePic });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId; // set by authMiddleware
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const allowed = ['student', 'organizer', 'admin'];
    const filter = {};
    if (role && allowed.includes(role)) filter.role = role;

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin: create an organizer account
exports.createOrganizer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Name, email and password are required' });

    // ensure unique email
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User already exists' });

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    // generate user_id similar to registerUser
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

    const user = await User.create({
      user_id,
      name,
      email,
      password: hash,
      role: 'organizer',
      dept: null,
      student_id: null
    });

    res.status(201).json({ msg: 'Organizer created', user: { _id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};