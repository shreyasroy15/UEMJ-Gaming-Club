const express = require('express');
const router = express.Router();
const {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getGallery)
  .post(protect, staffOnly, createGalleryItem);

router.route('/:id').delete(protect, adminOnly, deleteGalleryItem);

module.exports = router;
