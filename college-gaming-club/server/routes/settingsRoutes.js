const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getSettings,
  updateSettings,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

// Public route to fetch WhatsApp link & QR
router.get('/public', getPublicSettings);

// Admin / Staff configuration routes
router.get('/', protect, staffOnly, getSettings);
router.put('/', protect, staffOnly, updateSettings);

module.exports = router;
