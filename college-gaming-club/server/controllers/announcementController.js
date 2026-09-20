const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper slugify
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = { status: 'published' };

    if (category && category !== 'all') {
      query.category = category;
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name username avatar')
      .sort({ pinned: -1, publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single announcement by ID or slug
// @route   GET /api/announcements/:id
// @access  Public
exports.getAnnouncementById = async (req, res, next) => {
  try {
    let announcement;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      announcement = await Announcement.findById(req.params.id).populate(
        'author',
        'name username avatar'
      );
    } else {
      announcement = await Announcement.findOne({ slug: req.params.id }).populate(
        'author',
        'name username avatar'
      );
    }

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin / Staff)
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category, image, pinned, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content',
      });
    }

    const slug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;

    const announcement = await Announcement.create({
      title,
      slug,
      content,
      category: category || 'General',
      image: image || undefined,
      pinned: pinned || false,
      status: status || 'published',
      author: req.user.id,
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'author',
      'name username avatar'
    );

    // Dispatch batch notifications to all users if status is 'published'
    if (announcement.status === 'published') {
      try {
        const allUsers = await User.find({}).select('_id');
        if (allUsers.length > 0) {
          const notifications = allUsers.map((u) => ({
            recipient: u._id,
            sender: req.user.id,
            title: `📢 New Announcement: ${announcement.title}`,
            message: announcement.content.substring(0, 120) + '...',
            type: 'tournament_announcement',
            link: `/news/${announcement.slug || announcement._id}`,
            isRead: false,
          }));
          await Notification.insertMany(notifications);
        }
      } catch (notificationError) {
        console.error('Error dispatching announcements:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    res.status(201).json({
      success: true,
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin / Staff)
exports.updateAnnouncement = async (req, res, next) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const wasPublished = announcement.status === 'published';
    announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('author', 'name username avatar');

    // If status changed to 'published' and wasn't before, dispatch notifications
    if (!wasPublished && announcement.status === 'published') {
      try {
        const allUsers = await User.find({}).select('_id');
        if (allUsers.length > 0) {
          const notifications = allUsers.map((u) => ({
            recipient: u._id,
            sender: req.user.id,
            title: `📢 New Announcement: ${announcement.title}`,
            message: announcement.content.substring(0, 120) + '...',
            type: 'tournament_announcement',
            link: `/news/${announcement.slug || announcement._id}`,
            isRead: false,
          }));
          await Notification.insertMany(notifications);
        }
      } catch (notificationError) {
        console.error('Error dispatching announcements:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
