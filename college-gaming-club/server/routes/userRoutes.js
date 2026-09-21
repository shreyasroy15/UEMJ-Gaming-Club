const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserStatsOverview,
  getUserById,
  createUser,
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
  .get(protect, staffOnly, getUserById)
  .put(protect, adminOnly, updateUser)
  .patch(protect, adminOnly, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
