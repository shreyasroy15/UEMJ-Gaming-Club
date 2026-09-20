const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    tag: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 5,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
    },
    game: {
      type: String,
      required: [true, 'Game is required'],
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['captain', 'starter', 'substitute'],
          default: 'starter',
        },
        inGameName: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    description: {
      type: String,
      default: 'A competitive esports squad ready to dominate.',
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Team', teamSchema);
