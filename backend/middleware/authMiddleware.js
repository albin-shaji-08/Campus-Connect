const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  // Support token from cookie or Authorization header (Bearer) to make local dev easier
  let token = req.cookies?.token;
  if (!token && req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Token contains { id, role } where id may be user_id (string) or admin._id
    if (decoded.role === 'admin') {
      // id is admin DB _id
      const admin = await Admin.findById(decoded.id);
      if (!admin) return res.status(401).json({ msg: 'Admin not found' });
      req.userId = admin._id;
      req.userRole = 'admin';
      return next();
    }

    // For normal users (student/organizer), id is user.user_id (string)
    const user = await User.findOne({ user_id: decoded.id });
    if (!user) return res.status(401).json({ msg: 'User not found' });
    req.userId = user._id; // MongoDB ObjectId
    req.userRole = user.role; // 'student' or 'organizer'
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
