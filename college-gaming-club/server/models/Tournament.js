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
    minTeamSize: {
      type: Number,
      default: 4,
    },
    maxTeamSize: {
      type: Number,
      default: 5,
    },
    allowSubstitutes: {
      type: Boolean,
      default: true,
    },
    maxSubstitutes: {
      type: Number,
      default: 1,
    },
    registrationForm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TournamentForm',
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
    identityProofDeadline: {
      type: Date,
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
      enum: ['upcoming', 'registration-open', 'ongoing', 'live', 'completed', 'cancelled'],
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
    stages: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 1,
        },
        status: {
          type: String,
          enum: ['upcoming', 'ongoing', 'completed'],
          default: 'upcoming',
        },
        isFinal: {
          type: Boolean,
          default: false,
        },
        winner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TournamentRegistration',
        },
        // Eligible teams allowed to be assigned in this stage's lobbies
        qualifiedTeams: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TournamentRegistration',
          },
        ],
        // Teams marked/advanced by Admin to qualify for the next stage (with manual override)
        advancedTeams: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TournamentRegistration',
          },
        ],
        lobbies: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            order: {
              type: Number,
              default: 1,
            },
            maxTeams: {
              type: Number,
              default: 25,
            },
            status: {
              type: String,
              enum: ['upcoming', 'running'],
              default: 'upcoming',
            },
            teams: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TournamentRegistration',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
