const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserStatsOverview,
  getUserById,
  createUser,
  createAdminUser,
  updateUser,
  suspendUser,
  activateUser,
  resetUserAccess,
  deleteUser,
  getUserStats,
  getUserActivity,
  exportUsersCsv,
} = require('../controllers/userController');
const { searchUserByUsername } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

// Aggregate statistics for 6 top cards
router.get('/stats/overview', protect, staffOnly, getUserStatsOverview);

// Export filtered users as CSV
router.get('/export', protect, adminOnly, exportUsersCsv);

// Search user by username (existing registration feature preserved)
router.get('/search/:username', protect, searchUserByUsername);

// Create dedicated Admin account
router.post('/create-admin', protect, adminOnly, createAdminUser);

// User CRUD collection
router
  .route('/')
  .get(protect, staffOnly, getUsers)
  .post(protect, adminOnly, createUser);

// User specific actions
router.post('/:id/suspend', protect, adminOnly, suspendUser);
router.post('/:id/activate', protect, adminOnly, activateUser);
router.post('/:id/reset-access', protect, adminOnly, resetUserAccess);
router.get('/:id/stats', protect, staffOnly, getUserStats);
router.get('/:id/activity', protect, staffOnly, getUserActivity);

// User single resource
router
  .route('/:id')
  .get(protect, getUserById)
  .put(protect, (req, res, next) => {
    if (req.user && (req.user._id.toString() === req.params.id || ['admin', 'super_admin'].includes(req.user.role))) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
  }, updateUser)
  .patch(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
