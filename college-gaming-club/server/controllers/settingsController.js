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
      whatsappGroups: [
        {
          name: 'Main Community',
          category: 'General',
          link: 'https://chat.whatsapp.com/invite',
          qrCode: '',
          description: 'Official club community for all game updates, fixtures, and campus events.',
          isActive: true,
          isDefault: true,
        },
      ],
    });
  } else if (!settings.whatsappGroups || settings.whatsappGroups.length === 0) {
    // Migration: populate whatsappGroups from legacy whatsapp field if empty
    settings.whatsappGroups = [
      {
        name: settings.whatsapp?.groupName || 'Main Community',
        category: 'General',
        link: settings.whatsapp?.link || 'https://chat.whatsapp.com/invite',
        qrCode: settings.whatsapp?.qrCode || '',
        description:
          settings.whatsapp?.description ||
          'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
        isActive: settings.whatsapp?.isActive !== false,
        isDefault: true,
      },
    ];
    await settings.save();
  }
  return settings;
};

// @desc    Get public site settings (All active WhatsApp groups + primary group)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    // Filter only active groups for public users
    const allGroups = settings.whatsappGroups || [];
    const activeGroups = allGroups.filter((g) => g.isActive !== false);

    // Pick primary default group, or first active group, or legacy fallback
    const primaryGroup =
      activeGroups.find((g) => g.isDefault) ||
      activeGroups[0] || {
        groupName: settings.whatsapp?.groupName || 'UEMJ Gaming Club Official',
        link: settings.whatsapp?.link || '',
        qrCode: settings.whatsapp?.qrCode || '',
        description: settings.whatsapp?.description || '',
        isActive: settings.whatsapp?.isActive !== false,
      };

    res.status(200).json({
      success: true,
      settings: {
        whatsapp: {
          groupName: primaryGroup.name || primaryGroup.groupName || 'UEMJ Gaming Club Official',
          link: primaryGroup.link || '',
          qrCode: primaryGroup.qrCode || '',
          description: primaryGroup.description || '',
          isActive: primaryGroup.isActive !== false,
        },
        whatsappGroups: activeGroups,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full site settings for admin (All WhatsApp groups, active & inactive)
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

// @desc    Update site settings (Single group or list of multiple WhatsApp groups)
// @route   PUT /api/settings
// @access  Private (Admin / Staff)
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await getOrCreateSettings();

    const { whatsapp, whatsappGroups } = req.body;

    // Update multiple groups if provided
    if (Array.isArray(whatsappGroups)) {
      settings.whatsappGroups = whatsappGroups.map((g, idx) => ({
        _id: g._id,
        name: g.name ? g.name.trim() : `Group ${idx + 1}`,
        category: g.category || 'General',
        link: g.link ? g.link.trim() : '',
        qrCode: g.qrCode ? g.qrCode.trim() : '',
        description: g.description ? g.description.trim() : '',
        isActive: g.isActive !== false,
        isDefault: Boolean(g.isDefault),
      }));

      // Ensure at least one group is marked as default
      const hasDefault = settings.whatsappGroups.some((g) => g.isDefault);
      if (!hasDefault && settings.whatsappGroups.length > 0) {
        settings.whatsappGroups[0].isDefault = true;
      }

      // Synchronize the primary group to legacy whatsapp field for backward compatibility
      const defGroup = settings.whatsappGroups.find((g) => g.isDefault) || settings.whatsappGroups[0];
      if (defGroup) {
        settings.whatsapp = {
          groupName: defGroup.name,
          link: defGroup.link,
          qrCode: defGroup.qrCode,
          description: defGroup.description,
          isActive: defGroup.isActive,
        };
      }
    } else if (whatsapp) {
      // Legacy single-group update
      settings.whatsapp = {
        ...settings.whatsapp.toObject(),
        ...whatsapp,
      };

      // Also update or seed the default group in whatsappGroups
      if (settings.whatsappGroups && settings.whatsappGroups.length > 0) {
        const defIndex = settings.whatsappGroups.findIndex((g) => g.isDefault);
        const targetIndex = defIndex >= 0 ? defIndex : 0;
        settings.whatsappGroups[targetIndex].name = whatsapp.groupName || settings.whatsappGroups[targetIndex].name;
        settings.whatsappGroups[targetIndex].link = whatsapp.link || settings.whatsappGroups[targetIndex].link;
        settings.whatsappGroups[targetIndex].qrCode = whatsapp.qrCode !== undefined ? whatsapp.qrCode : settings.whatsappGroups[targetIndex].qrCode;
        settings.whatsappGroups[targetIndex].description = whatsapp.description || settings.whatsappGroups[targetIndex].description;
        settings.whatsappGroups[targetIndex].isActive = whatsapp.isActive !== undefined ? whatsapp.isActive : settings.whatsappGroups[targetIndex].isActive;
      }
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
