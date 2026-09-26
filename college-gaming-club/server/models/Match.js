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
      default: '',
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
    teamModel: {
      type: String,
      enum: ['TournamentRegistration', 'Team'],
      default: 'TournamentRegistration',
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'teamModel',
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'teamModel',
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
    results: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TournamentRegistration',
        },
        teamName: {
          type: String,
          default: '',
        },
        teamTag: {
          type: String,
          default: '',
        },
        position: {
          type: Number,
          default: 0,
        },
        kills: {
          type: Number,
          default: 0,
        },
        positionPoints: {
          type: Number,
          default: 0,
        },
        killPoints: {
          type: Number,
          default: 0,
        },
        bonusPoints: {
          type: Number,
          default: 0,
        },
        totalPoints: {
          type: Number,
          default: 0,
        },
      },
    ],
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
