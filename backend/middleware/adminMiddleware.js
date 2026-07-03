// middleware/adminMiddleware.js
// middleware/adminMiddleware.js
// Assumes `authMiddleware` ran before this or that req.userRole is available
const adminMiddleware = (req, res, next) => {
  if (!req.userRole) return res.status(401).json({ msg: 'Not authenticated' });
  if (req.userRole !== 'admin') return res.status(403).json({ msg: 'Access denied: Admins only' });
  // req.userId will be admin DB id when logged in as admin
  req.adminId = req.userId;
  next();
};

module.exports = adminMiddleware;
