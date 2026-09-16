const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthorized'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

const adminOnly = authorize('admin');
const staffOnly = authorize('admin');

module.exports = { authorize, adminOnly, staffOnly };
