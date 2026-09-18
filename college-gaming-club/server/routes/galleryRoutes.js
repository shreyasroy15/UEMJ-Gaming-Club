const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
  uploadGalleryImages
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

// Multer storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

router
  .route('/')
  .get(getGallery)
  .post(protect, staffOnly, createGalleryItem);

router.post('/upload', protect, staffOnly, upload.array('files', 10), uploadGalleryImages);

router.route('/:id').delete(protect, adminOnly, deleteGalleryItem);

module.exports = router;
