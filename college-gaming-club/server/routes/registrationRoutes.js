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
  deleteTeamIdentityProof,
  transferLeadership,
  sendTournamentInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/adminMiddleware');

// User my-registrations & invitations
router.get('/my-tournaments', protect, getMyRegistrations);
router.get('/invitations/my', protect, getMyInvitations);
router.post('/invitations/:id/accept', protect, acceptInvitation);
router.post('/invitations/:id/decline', protect, declineInvitation);

// Join team with code
router.post('/join', protect, joinTeamByCode);

const multer = require('multer');

// Multer memory storage configuration for PDF only, strict 5MB limit
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
    if (file.mimetype === 'application/pdf' && ext === 'pdf') {
      cb(null, true);
    } else {
      const err = new Error('PDF must be in .pdf format. Other file types are rejected.');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  },
});

const handlePdfUpload = (req, res, next) => {
  pdfUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'PDF must be 5 MB or smaller.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Only PDF files (.pdf) are allowed.',
      });
    }
    next();
  });
};

// Workspace & submissions
router.get('/:id', protect, getRegistrationWorkspace);
router.post('/:id/invitations', protect, sendTournamentInvitation);
router.put('/:id/player-submission', protect, submitPlayerInformation);
router.put('/:id/team-identity-proof', protect, handlePdfUpload, uploadTeamIdentityProof);
router.delete('/:id/team-identity-proof', protect, deleteTeamIdentityProof);
router.put('/:id/transfer-leader', protect, transferLeadership);
router.delete('/:id/members/:userId', protect, removeTeamMember);
router.post('/:id/leave', protect, leaveSquad);

// Admin verification
router.put('/:id/verify', protect, staffOnly, verifyRegistration);

module.exports = router;
