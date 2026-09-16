const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getAnnouncements)
  .post(protect, staffOnly, createAnnouncement);

router
  .route('/:id')
  .get(getAnnouncementById)
  .put(protect, staffOnly, updateAnnouncement)
  .delete(protect, adminOnly, deleteAnnouncement);

module.exports = router;
