const ClubSettings = require('../models/ClubSettings');

// Helper to get or initialize default settings
const getOrCreateSettings = async () => {
  let settings = await ClubSettings.findOne();
  if (!settings) {
    settings = await ClubSettings.create({
      whatsapp: {
        groupName: 'UEMJ Gaming Club Official',
        link: 'https://chat.whatsapp.com/invite',
        qrCode: '',
        description: 'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
        isActive: true,
      },
    });
  }
  return settings;
};

// @desc    Get public site settings (WhatsApp group info, etc.)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      settings: {
        whatsapp: settings.whatsapp || {
          groupName: 'UEMJ Gaming Club Official',
          link: '',
          qrCode: '',
          description: '',
          isActive: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full site settings (Admin)
// @route   GET /api/settings
// @access  Private (Admin / Staff)
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update site settings (WhatsApp group link, QR code, etc.)
// @route   PUT /api/settings
// @access  Private (Admin / Staff)
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await getOrCreateSettings();

    const { whatsapp } = req.body;

    if (whatsapp) {
      settings.whatsapp = {
        ...settings.whatsapp.toObject(),
        ...whatsapp,
      };
    }

    settings.updatedBy = req.user.id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Club settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};
