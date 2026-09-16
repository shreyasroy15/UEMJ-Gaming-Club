const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Tournaments', 'LAN Parties', 'Ceremonies', 'Setups', 'Community'],
      default: 'Tournaments',
    },
    event: {
      type: String,
      default: 'College Esports 2025',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gallery', gallerySchema);
