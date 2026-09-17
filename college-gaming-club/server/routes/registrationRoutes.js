const express = require('express');
const router = express.Router();
const {
  createTeamRegistration,
  joinTeamByCode,
  getRegistrationWorkspace,
  submitPlayerInformation,
  removeTeamMember,
  leaveSquad,
  getPublicTeams,
  getAdminRegistrations,
  verifyRegistration,
  getMyRegistrations,
  uploadTeamIdentityProof,
  transferLeadership,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

// User my-registrations
router.get('/my-tournaments', protect, getMyRegistrations);

// Join team with code
router.post('/join', protect, joinTeamByCode);

// Workspace & submissions
router.get('/:id', protect, getRegistrationWorkspace);
router.put('/:id/player-submission', protect, submitPlayerInformation);
router.put('/:id/team-identity-proof', protect, uploadTeamIdentityProof);
router.put('/:id/transfer-leader', protect, transferLeadership);
router.delete('/:id/members/:userId', protect, removeTeamMember);
router.post('/:id/leave', protect, leaveSquad);

// Admin verification
router.put('/:id/verify', protect, staffOnly, verifyRegistration);

module.exports = router;
