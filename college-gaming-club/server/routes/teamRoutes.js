const express = require('express');
const router = express.Router();
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  leaveTeam,
  transferCaptain,
  verifyTeam,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

router.route('/').get(getTeams).post(protect, createTeam);

router
  .route('/:id')
  .get(getTeamById)
  .put(protect, updateTeam)
  .delete(protect, deleteTeam);

router.put('/:id/verify', protect, staffOnly, verifyTeam);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);
router.post('/:id/leave', protect, leaveTeam);
router.put('/:id/transfer-captain', protect, transferCaptain);

module.exports = router;
