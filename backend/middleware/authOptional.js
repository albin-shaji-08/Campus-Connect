const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Similar to authMiddleware but does NOT return 401 when token is missing/invalid.
// If a valid token is present, sets req.userId and req.userRole; otherwise continues.
const authOptional = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.userId = admin._id;
        req.userRole = 'admin';
      }
      return next();
    }

    const user = await User.findOne({ user_id: decoded.id });
    if (user) {
      req.userId = user._id;
      req.userRole = user.role;
    }
    return next();
  } catch (err) {
    // ignore invalid/expired token and continue as unauthenticated
    return next();
  }
};

module.exports = authOptional;
