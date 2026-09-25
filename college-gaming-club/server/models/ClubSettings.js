const mongoose = require('mongoose');

const clubSettingsSchema = new mongoose.Schema(
  {
    whatsapp: {
      groupName: {
        type: String,
        default: 'UEMJ Gaming Club Official',
        trim: true,
      },
      link: {
        type: String,
        default: 'https://chat.whatsapp.com/invite',
        trim: true,
      },
      qrCode: {
        type: String,
        default: '',
        trim: true,
      },
      description: {
        type: String,
        default: 'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
        trim: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClubSettings', clubSettingsSchema);
