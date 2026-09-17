const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTournamentForm,
  saveTournamentForm,
  applyFormPreset,
} = require('../controllers/formController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

// /api/tournaments/:id/form
router.get('/', getTournamentForm);
router.put('/', protect, staffOnly, saveTournamentForm);
router.post('/preset', protect, staffOnly, applyFormPreset);

module.exports = router;
