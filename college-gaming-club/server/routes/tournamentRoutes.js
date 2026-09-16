const express = require('express');
const router = express.Router();
const {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  registerTeam,
  generateBracket,
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getTournaments)
  .post(protect, staffOnly, createTournament);

router
  .route('/:id')
  .get(getTournamentById)
  .put(protect, staffOnly, updateTournament)
  .delete(protect, adminOnly, deleteTournament);

router.post('/:id/register', protect, registerTeam);
router.post('/:id/generate-bracket', protect, staffOnly, generateBracket);

module.exports = router;
