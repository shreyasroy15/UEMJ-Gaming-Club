const express = require('express');
const router = express.Router();
const {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  updateTournamentStatus,
  deleteTournament,
  toggleRegistration,
  registerTeam,
  generateBracket,
  verifyLobbyAccess,
} = require('../controllers/tournamentController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');
const formRoutes = require('./formRoutes');
const {
  createTeamRegistration,
  getPublicTeams,
  getAdminRegistrations,
  deregisterFromTournament,
} = require('../controllers/registrationController');
const {
  getTournamentStructure,
  createStage,
  updateStage,
  deleteStage,
  createLobby,
  updateLobby,
  deleteLobby,
  assignTeamsToLobby,
  manualAdvanceTeams,
  overrideStageTeams,
  createLobbyMatch,
  updateLobbyMatch,
  deleteLobbyMatch,
  createDirectLobby,
  updateDirectLobby,
  deleteDirectLobby,
  assignTeamsToDirectLobby,
  createDirectLobbyMatch,
  createLobbyFromSelectedTeams,
  recordMatchResults,
} = require('../controllers/tournamentStageController');

// Nested form routes: /api/tournaments/:id/form
router.use('/:id/form', formRoutes);

// Tournament registration endpoints
router.post('/:id/registrations/create-team', protect, createTeamRegistration);
router.post('/:id/deregister', protect, deregisterFromTournament);
router.get('/:id/public-teams', getPublicTeams);
router.get('/:id/admin-registrations', protect, staffOnly, getAdminRegistrations);

// Direct Tournament Lobby Routes (Esports Manager Flow)
router.post('/:id/lobbies/:lobbyId/access', protect, verifyLobbyAccess);
router.post('/:id/lobbies', protect, staffOnly, createDirectLobby);
router.put('/:id/lobbies/:lobbyId', protect, staffOnly, updateDirectLobby);
router.delete('/:id/lobbies/:lobbyId', protect, staffOnly, deleteDirectLobby);
router.post('/:id/lobbies/:lobbyId/assign-teams', protect, staffOnly, assignTeamsToDirectLobby);
router.post('/:id/lobbies/:lobbyId/matches', protect, staffOnly, createDirectLobbyMatch);
router.post('/:id/lobbies/create-from-teams', protect, staffOnly, createLobbyFromSelectedTeams);

// Dynamic Stages, Lobbies, Matches & Qualification Routes (Backwards Compatibility)
router.get('/:id/stages-structure', protect, staffOnly, getTournamentStructure);
router.post('/:id/stages', protect, staffOnly, createStage);
router.put('/:id/stages/:stageId', protect, staffOnly, updateStage);
router.delete('/:id/stages/:stageId', protect, staffOnly, deleteStage);

router.post('/:id/stages/:stageId/lobbies', protect, staffOnly, createLobby);
router.put('/:id/stages/:stageId/lobbies/:lobbyId', protect, staffOnly, updateLobby);
router.delete('/:id/stages/:stageId/lobbies/:lobbyId', protect, staffOnly, deleteLobby);

router.post('/:id/stages/:stageId/lobbies/:lobbyId/assign-teams', protect, staffOnly, assignTeamsToLobby);
router.post('/:id/stages/:stageId/advance-teams', protect, staffOnly, manualAdvanceTeams);
router.put('/:id/stages/:stageId/override-teams', protect, staffOnly, overrideStageTeams);

router.post('/:id/stages/:stageId/lobbies/:lobbyId/matches', protect, staffOnly, createLobbyMatch);
router.post('/:id/matches/:matchId/results', protect, staffOnly, recordMatchResults);
router.put('/:id/matches/:matchId', protect, staffOnly, updateLobbyMatch);
router.delete('/:id/matches/:matchId', protect, staffOnly, deleteLobbyMatch);

router
  .route('/')
  .get(getTournaments)
  .post(protect, staffOnly, createTournament);

router
  .route('/:id')
  .get(optionalAuth, getTournamentById)
  .put(protect, staffOnly, updateTournament)
  .patch(protect, staffOnly, updateTournamentStatus)
  .delete(protect, adminOnly, deleteTournament);

router.patch('/:id/status', protect, staffOnly, updateTournamentStatus);
router.patch('/:id/toggle-registration', protect, staffOnly, toggleRegistration);

router.post('/:id/register', protect, registerTeam);
router.post('/:id/generate-bracket', protect, staffOnly, generateBracket);

module.exports = router;

