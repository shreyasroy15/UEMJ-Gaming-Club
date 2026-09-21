const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getUploadSignature, uploadFile, uploadUrl } = require('../controllers/uploadController');

// Multer memory storage configuration (max 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and PDF documents for college IDs
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) and PDF documents are allowed'), false);
    }
  },
});

router.post('/signature', protect, getUploadSignature);
router.post('/', protect, upload.single('file'), uploadFile);
router.post('/url', protect, uploadUrl);

module.exports = router;
