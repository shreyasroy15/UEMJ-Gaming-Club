const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Game = require('../models/Game');
const Event = require('../models/Event');
const TournamentRegistration = require('../models/TournamentRegistration');

// @desc    Get aggregated stats for Admin Dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin / Staff)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTeams,
      activeTeams,
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
      TournamentRegistration.countDocuments({ status: { $ne: 'rejected' } }),
      TournamentRegistration.countDocuments({ status: { $in: ['verified', 'complete'] } }),
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: { $in: ['live', 'ongoing'] } }),
      Match.countDocuments({ status: 'live' }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Tournament.find().sort({ createdAt: -1 }).limit(5),
      TournamentRegistration.find({ status: { $in: ['verified', 'complete'] } })
        .populate('tournament', 'name game')
        .populate('captain', 'name username')
        .sort({ updatedAt: -1 })
        .limit(6),
      Game.find(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        activeTeams,
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
