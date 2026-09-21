const mongoose = require('mongoose');

const pollConfigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'WHAT SHOULD WE PLAY NEXT?',
    },
    activeRound: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    options: {
      type: [String],
      default: ['BGMI', 'Valorant', 'Free Fire Max'],
    },
    lastResetAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PollConfig', pollConfigSchema);
