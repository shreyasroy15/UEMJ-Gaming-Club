const express = require('express');
const router = express.Router();
const {
  getPollResults,
  castVote,
  resetPoll,
} = require('../controllers/pollController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

// Public endpoints (with optional auth to detect logged in gamer)
router.get('/', optionalAuth, getPollResults);
router.post('/vote', optionalAuth, castVote);

// Admin endpoint to reset / start a new poll cycle
router.post('/reset', protect, staffOnly, resetPoll);

module.exports = router;
