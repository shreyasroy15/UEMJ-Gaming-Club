const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    stageName: {
      type: String,
      default: '',
    },
    lobbyName: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: 'Match',
    },
    map: {
      type: String,
      default: 'Erangel',
    },
    roomId: {
      type: String,
      default: '',
      trim: true,
    },
    roomPassword: {
      type: String,
      default: '',
      trim: true,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentRegistration',
      },
    ],
    round: {
      type: String,
      default: 'Round 1',
    },
    roundIndex: {
      type: Number,
      default: 1,
    },
    matchNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    scoreA: {
      type: Number,
      default: 0,
    },
    scoreB: {
      type: Number,
      default: 0,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentRegistration',
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed'],
      default: 'scheduled',
    },
    streamUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Match', matchSchema);
