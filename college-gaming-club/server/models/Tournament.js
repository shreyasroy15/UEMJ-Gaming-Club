const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    game: {
      type: String,
      required: [true, 'Game is required'],
    },
    banner: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rules: {
      type: [String],
      default: [
        'All players must be verified college students.',
        'Cheating, exploiting, or unsportsmanlike conduct results in immediate disqualification.',
        'Teams must check in 15 minutes prior to scheduled match time.',
        'Tournament admins reserve the right to rule on discrepancies.',
      ],
    },
    format: {
      type: String,
      enum: ['Single Elimination', 'Double Elimination', 'Round Robin', 'Swiss'],
      default: 'Single Elimination',
    },
    prizePool: {
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR (₹)' },
      first: { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third: { type: Number, default: 0 },
    },
    entryFee: {
      type: Number,
      default: 0, // 0 = Free
    },
    maxTeams: {
      type: Number,
      default: 16,
    },
    registeredTeams: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    registrationDeadline: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    organizer: {
      type: String,
      default: 'UEM Gaming Club Esports Committee',
    },
    streamUrl: {
      type: String,
      default: 'https://twitch.tv',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
