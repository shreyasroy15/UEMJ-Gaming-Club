const mongoose = require('mongoose');

const playerSlotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['captain', 'starter', 'substitute'],
      default: 'starter',
    },
    slotNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['joined', 'completed'],
      default: 'joined',
    },
    responses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const tournamentRegistrationSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    teamType: {
      type: String,
      enum: ['UEM Student Team', 'Outside Team', 'Mixed Team'],
      default: 'UEM Student Team',
      required: true,
    },
    teamTag: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 6,
      required: false,
    },
    teamLogo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
    },
    teamCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    identityProof: {
      url: { type: String, default: '' },
      submittedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'rejected'],
        default: 'pending',
      },
      verificationNotes: { type: String, default: '' },
    },
    teamResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    players: [playerSlotSchema],
    status: {
      type: String,
      enum: ['incomplete', 'complete', 'verified', 'rejected'],
      default: 'incomplete',
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure team name uniqueness per tournament
tournamentRegistrationSchema.index({ tournament: 1, teamName: 1 }, { unique: true });

module.exports = mongoose.model('TournamentRegistration', tournamentRegistrationSchema);
