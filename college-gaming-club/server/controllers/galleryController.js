const Gallery = require('../models/Gallery');

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
      .populate('uploadedBy', 'name username')
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

// @desc    Create gallery item
// @route   POST /api/gallery
// @access  Private (Staff / Admin)
exports.createGalleryItem = async (req, res, next) => {
  try {
    const { title, image, description, category, event } = req.body;

    if (!title || !image) {
      return res.status(400).json({
        success: false,
        message: 'Title and image URL are required',
      });
    }

    const item = await Gallery.create({
      title,
      image,
      description,
      category: category || 'Tournaments',
      event: event || 'College Gaming 2025',
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      galleryItem: item,
    });
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
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted',
    });
  } catch (error) {
    next(error);
  }
};
