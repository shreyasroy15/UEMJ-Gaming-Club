const Gallery = require('../models/Gallery');
const { cloudinary, isConfigured } = require('../config/cloudinary');

// @desc    Get gallery items
// @route   GET /api/gallery
// @access  Public
exports.getGallery = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    const gallery = await Gallery.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gallery.length,
      gallery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple gallery items
// @route   POST /api/gallery/upload
// @access  Private (Staff / Admin)
exports.uploadGalleryImages = async (req, res, next) => {
  try {
    const { category, event, captions } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    let parsedCaptions = [];
    if (captions) {
      try {
        parsedCaptions = typeof captions === 'string' ? JSON.parse(captions) : captions;
      } catch (e) {
        parsedCaptions = [captions];
      }
    }

    // Process files
    const uploadPromises = files.map((file, index) => {
        return new Promise((resolve) => {
            if (isConfigured) {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'gallery', resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.warn('Cloudinary upload error, using fallback:', error.message);
                            resolve({
                                title: parsedCaptions[index] || file.originalname || 'Gallery Image',
                                image: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                                publicId: `dev-upload-${Date.now()}-${index}`,
                                category: category || 'Tournaments',
                                event: event || 'College Esports 2025',
                                uploadedBy: req.user?.id || req.user?._id
                            });
                        } else {
                            resolve({
                                title: parsedCaptions[index] || file.originalname || 'Gallery Image',
                                image: result.secure_url,
                                publicId: result.public_id,
                                category: category || 'Tournaments',
                                event: event || 'College Esports 2025',
                                uploadedBy: req.user?.id || req.user?._id
                            });
                        }
                    }
                );
                uploadStream.end(file.buffer);
            } else {
                // Fallback to base64 data URI when Cloudinary is not configured
                resolve({
                    title: parsedCaptions[index] || file.originalname || 'Gallery Image',
                    image: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    publicId: `dev-upload-${Date.now()}-${index}`,
                    category: category || 'Tournaments',
                    event: event || 'College Esports 2025',
                    uploadedBy: req.user?.id || req.user?._id
                });
            }
        });
    });

    const galleryItemsData = await Promise.all(uploadPromises);
    const items = await Gallery.insertMany(galleryItemsData);

    res.status(201).json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

// @desc    Create gallery item (maintaining original path)
// @route   POST /api/gallery
// @access  Private (Staff / Admin)
exports.createGalleryItem = async (req, res, next) => {
  try {
    const { title, image, description, category, event } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }
    const item = await Gallery.create({
      title: title || 'Gallery Image',
      image,
      publicId: `url-${Date.now()}`,
      description: description || '',
      category: category || 'Tournaments',
      event: event || 'College Esports 2025',
      uploadedBy: req.user?.id || req.user?._id,
    });
    res.status(201).json({ success: true, galleryItem: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
exports.deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    // Delete from Cloudinary if not a manual item
    if (item.publicId && item.publicId !== 'manual' && isConfigured) {
        await cloudinary.uploader.destroy(item.publicId);
    }

    await item.deleteOne();

    res.status(200).json({ success: true, message: 'Gallery item deleted' });
  } catch (error) {
    next(error);
  }
};
