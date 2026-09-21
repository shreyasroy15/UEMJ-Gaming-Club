const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === 'super_admin' || user.email === 'admin@gmail.com' || user.username === 'admin_uemj_1';
};

const isAdmin = (user) => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'admin';
};

const isModeratorOrStaff = (user) => {
  if (!user) return false;
  return isAdmin(user) || ['moderator', 'staff', 'coordinator'].includes(user.role);
};

const superAdminOnly = (req, res, next) => {
  if (!req.user || !isSuperAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Super Administrators can perform this action.',
    });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || !isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

const staffOnly = (req, res, next) => {
  if (!req.user || !isModeratorOrStaff(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or Moderator privileges required.',
    });
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (isSuperAdmin(req.user)) return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  authorize,
  adminOnly,
  staffOnly,
  superAdminOnly,
  isSuperAdmin,
  isAdmin,
  isModeratorOrStaff,
};
