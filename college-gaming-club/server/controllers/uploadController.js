const { cloudinary, isConfigured } = require('../config/cloudinary');

// @desc    Generate Cloudinary upload signature for client-side direct upload
// @route   POST /api/upload/signature
// @access  Private
exports.getUploadSignature = async (req, res, next) => {
  try {
    const { folder = 'uemj/public', type = 'public' } = req.body;

    // Allowed folder prefixes
    const targetFolder = type === 'private' ? 'uemj/private/documents' : (folder || 'uemj/public');

    if (!isConfigured) {
      return res.status(200).json({
        success: true,
        configured: false,
        message: 'Cloudinary credentials not set in server .env. Use direct API upload endpoint.',
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: targetFolder,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      configured: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: targetFolder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload file via server (Multipart stream to Cloudinary with fallback)
// @route   POST /api/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to upload',
      });
    }

    const { type = 'public', folder } = req.body;
    const targetFolder = type === 'private' ? 'uemj/private/documents' : (folder || 'uemj/public');

    if (isConfigured) {
      // Upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({
              success: false,
              message: error.message || 'Cloudinary upload failed',
            });
          }

          res.status(200).json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            isPrivate: type === 'private',
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } else {
      // Development fallback when Cloudinary API credentials aren't yet populated
      const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      res.status(200).json({
        success: true,
        url: base64Data,
        publicId: `dev-upload-${Date.now()}`,
        format: req.file.mimetype.split('/')[1] || 'bin',
        bytes: req.file.size,
        isPrivate: type === 'private',
        warning: 'Uploaded using development in-memory data URI because Cloudinary credentials are not set in .env',
      });
    }
  } catch (error) {
    next(error);
  }
};
