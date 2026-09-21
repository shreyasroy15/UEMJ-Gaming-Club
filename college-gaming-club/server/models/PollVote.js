const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema(
  {
    game: {
      type: String,
      required: [true, 'Please select a game to vote for'],
      enum: ['BGMI', 'Valorant', 'Free Fire Max'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    voterId: {
      type: String,
      required: true,
      index: true,
    },
    pollRound: {
      type: Number,
      default: 1,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    voterName: {
      type: String,
      default: 'Anonymous Gamer',
    },
  },
  { timestamps: true }
);

// Ensure one vote per voterId per poll round
pollVoteSchema.index({ voterId: 1, pollRound: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', pollVoteSchema);
