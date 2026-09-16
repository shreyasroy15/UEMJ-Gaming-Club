const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Game = require('../models/Game');
const Event = require('../models/Event');

// @desc    Get aggregated stats for Admin Dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin / Staff)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTeams,
      totalTournaments,
      liveTournaments,
      liveMatches,
      upcomingEvents,
      recentUsers,
      recentTournaments,
      teamsLeaderboard,
      games,
    ] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: 'live' }),
      Match.countDocuments({ status: 'live' }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Tournament.find().sort({ createdAt: -1 }).limit(5),
      Team.find().sort({ points: -1, wins: -1 }).limit(5),
      Game.find(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        totalTournaments,
        liveTournaments,
        liveMatches,
        upcomingEvents,
      },
      recentUsers,
      recentTournaments,
      teamsLeaderboard,
      games,
    });
  } catch (error) {
    next(error);
  }
};
