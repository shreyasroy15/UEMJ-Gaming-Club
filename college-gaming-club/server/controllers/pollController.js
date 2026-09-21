const PollVote = require('../models/PollVote');
const PollConfig = require('../models/PollConfig');
const User = require('../models/User');

// Helper to get or create active poll config
const getOrCreatePollConfig = async () => {
  let config = await PollConfig.findOne();
  if (!config) {
    config = await PollConfig.create({
      title: 'WHAT SHOULD WE PLAY NEXT?',
      activeRound: 1,
      options: ['BGMI', 'Valorant', 'Free Fire Max'],
    });
  }
  return config;
};

// @desc    Get live poll results & user vote status
// @route   GET /api/polls
// @access  Public
exports.getPollResults = async (req, res) => {
  try {
    const config = await getOrCreatePollConfig();
    const round = config.activeRound || 1;
    const voterId = req.query.voterId || (req.user ? req.user._id.toString() : null);

    // Fetch all votes for the current active round
    const votes = await PollVote.find({ pollRound: round });
    const totalVotes = votes.length;

    // Count votes per game
    const counts = {
      BGMI: 0,
      Valorant: 0,
      'Free Fire Max': 0,
    };

    votes.forEach((v) => {
      if (counts[v.game] !== undefined) {
        counts[v.game] += 1;
      }
    });

    // Calculate percentages and format options
    const options = ['BGMI', 'Valorant', 'Free Fire Max'].map((game) => {
      const count = counts[game] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        game,
        count,
        percentage,
      };
    });

    // Find leading game
    let leadingGame = 'BGMI';
    let maxCount = -1;
    options.forEach((opt) => {
      if (opt.count > maxCount) {
        maxCount = opt.count;
        leadingGame = opt.game;
      }
    });

    // Check if the current client has voted
    let userVotedGame = null;
    if (voterId) {
      const myVote = votes.find(
        (v) => v.voterId === voterId || (req.user && v.user?.toString() === req.user._id.toString())
      );
      if (myVote) {
        userVotedGame = myVote.game;
      }
    }

    // Recent voters for admin telemetry
    const recentVoters = votes
      .slice(-10)
      .reverse()
      .map((v) => ({
        id: v._id,
        voterName: v.voterName || 'Gamer',
        game: v.game,
        createdAt: v.createdAt,
      }));

    res.json({
      success: true,
      data: {
        title: config.title,
        activeRound: round,
        totalVotes,
        leadingGame: totalVotes > 0 ? leadingGame : null,
        options,
        userVotedGame,
        recentVoters,
        lastResetAt: config.lastResetAt,
      },
    });
  } catch (err) {
    console.error('Error fetching poll results:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving poll data' });
  }
};

// @desc    Cast or change a vote in the community poll
// @route   POST /api/polls/vote
// @access  Public (tracked by voterId / user)
exports.castVote = async (req, res) => {
  try {
    const { game, voterId } = req.body;
    const validGames = ['BGMI', 'Valorant', 'Free Fire Max'];

    if (!game || !validGames.includes(game)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game selection. Must be BGMI, Valorant, or Free Fire Max',
      });
    }

    if (!voterId && !req.user) {
      return res.status(400).json({
        success: false,
        message: 'Client voter identifier is required to register a vote',
      });
    }

    const config = await getOrCreatePollConfig();
    const round = config.activeRound || 1;
    const finalVoterId = voterId || req.user._id.toString();

    let voterName = 'Anonymous Gamer';
    let userId = null;

    if (req.user) {
      userId = req.user._id;
      voterName = req.user.name || req.user.username || 'Verified Gamer';
    } else if (req.body.voterName) {
      voterName = req.body.voterName;
    } else {
      voterName = `Gamer #${finalVoterId.slice(-4)}`;
    }

    // Upsert vote for this voterId in the current active round
    const vote = await PollVote.findOneAndUpdate(
      { voterId: finalVoterId, pollRound: round },
      {
        game,
        user: userId,
        voterId: finalVoterId,
        pollRound: round,
        voterName,
        ip: req.ip || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Get fresh total stats
    const allVotes = await PollVote.find({ pollRound: round });
    const totalVotes = allVotes.length;

    const counts = { BGMI: 0, Valorant: 0, 'Free Fire Max': 0 };
    allVotes.forEach((v) => {
      if (counts[v.game] !== undefined) counts[v.game] += 1;
    });

    const options = validGames.map((g) => ({
      game: g,
      count: counts[g],
      percentage: totalVotes > 0 ? Math.round((counts[g] / totalVotes) * 100) : 0,
    }));

    let leadingGame = 'BGMI';
    let max = -1;
    options.forEach((o) => {
      if (o.count > max) {
        max = o.count;
        leadingGame = o.game;
      }
    });

    res.json({
      success: true,
      message: `Vote successfully recorded for ${game}!`,
      data: {
        totalVotes,
        userVotedGame: game,
        leadingGame,
        options,
      },
    });
  } catch (err) {
    console.error('Error casting vote:', err);
    res.status(500).json({ success: false, message: 'Failed to record vote' });
  }
};

// @desc    Reset community poll for next round
// @route   POST /api/polls/reset
// @access  Private (Admin / Staff)
exports.resetPoll = async (req, res) => {
  try {
    const config = await getOrCreatePollConfig();
    config.activeRound += 1;
    config.lastResetAt = new Date();
    await config.save();

    res.json({
      success: true,
      message: `Poll successfully reset. Active round is now Round ${config.activeRound}.`,
      data: {
        activeRound: config.activeRound,
        totalVotes: 0,
        options: config.options.map((g) => ({ game: g, count: 0, percentage: 0 })),
        leadingGame: null,
        userVotedGame: null,
      },
    });
  } catch (err) {
    console.error('Error resetting poll:', err);
    res.status(500).json({ success: false, message: 'Failed to reset poll' });
  }
};
