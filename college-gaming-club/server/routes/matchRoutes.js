const express = require('express');
const router = express.Router();
const {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getMatches)
  .post(protect, staffOnly, createMatch);

router
  .route('/:id')
  .get(getMatchById)
  .put(protect, staffOnly, updateMatch)
  .delete(protect, adminOnly, deleteMatch);

module.exports = router;
