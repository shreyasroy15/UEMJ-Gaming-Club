const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);

module.exports = router;
