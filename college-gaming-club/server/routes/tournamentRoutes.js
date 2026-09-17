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
const formRoutes = require('./formRoutes');
const {
  createTeamRegistration,
  getPublicTeams,
  getAdminRegistrations,
  deregisterFromTournament,
} = require('../controllers/registrationController');

// Nested form routes: /api/tournaments/:id/form
router.use('/:id/form', formRoutes);

// Tournament registration endpoints
router.post('/:id/registrations/create-team', protect, createTeamRegistration);
router.post('/:id/deregister', protect, deregisterFromTournament);
router.get('/:id/public-teams', getPublicTeams);
router.get('/:id/admin-registrations', protect, staffOnly, getAdminRegistrations);

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
