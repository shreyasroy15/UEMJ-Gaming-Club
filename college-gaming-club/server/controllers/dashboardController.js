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
      pendingTeams,
      totalTournaments,
      liveTournaments,
      liveMatches,
      totalMatches,
      upcomingMatches,
      upcomingEvents,
      recentUsers,
      recentTournaments,
      teamsLeaderboard,
      liveMatchesList,
      recentMatchesList,
      games,
    ] = await Promise.all([
      User.countDocuments(),
      TournamentRegistration.countDocuments({ status: { $ne: 'rejected' } }),
      TournamentRegistration.countDocuments({ status: { $in: ['verified', 'complete'] } }),
      TournamentRegistration.countDocuments({ status: 'pending' }),
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: { $in: ['live', 'ongoing'] } }),
      Match.countDocuments({ status: 'live' }),
      Match.countDocuments(),
      Match.countDocuments({ status: { $in: ['upcoming', 'scheduled'] } }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(6),
      Tournament.find().sort({ createdAt: -1 }).limit(6),
      TournamentRegistration.find({ status: { $in: ['verified', 'complete'] } })
        .populate('tournament', 'name game banner')
        .populate('captain', 'name username')
        .sort({ updatedAt: -1 })
        .limit(20)
        .then((regs) => {
          const seen = new Set();
          return regs.filter((reg) => {
            const captainId = reg.captain?._id?.toString() || reg.captain?.toString();
            if (!captainId || seen.has(captainId)) return false;
            seen.add(captainId);
            return true;
          }).slice(0, 8);
        }),
      Match.find({ status: 'live' })
        .populate('tournament', 'name game banner')
        .populate('teams', 'teamName teamTag')
        .populate('teamA teamB winner')
        .sort({ updatedAt: -1 })
        .limit(6),
      Match.find()
        .populate('tournament', 'name game banner')
        .populate('teams', 'teamName teamTag')
        .populate('teamA teamB winner')
        .sort({ scheduledAt: -1, createdAt: -1 })
        .limit(6),
      Game.find(),
    ]);

    const enrichedRecentUsers = await Promise.all(
      recentUsers.map(async (userDoc) => {
        const u = userDoc.toObject ? userDoc.toObject() : userDoc;
        const rawTeam = (u.teamName || '').trim();
        const isFreeAgent =
          !rawTeam ||
          rawTeam.toLowerCase() === 'free agent' ||
          rawTeam.toLowerCase() === 'none' ||
          rawTeam.toLowerCase() === 'solo';

        const teamDoc = await Team.findOne({
          $or: [{ captain: u._id }, { 'members.user': u._id }],
        }).select('name isVerified game tag').lean();

        if (teamDoc) {
          return {
            ...u,
            teamInfo: {
              name: teamDoc.name,
              isFreeAgent: false,
              isVerified: Boolean(teamDoc.isVerified),
              tag: teamDoc.tag || '',
            },
          };
        }

        if (!isFreeAgent) {
          const namedTeam = await Team.findOne({
            name: new RegExp(`^${rawTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          }).select('name isVerified tag').lean();

          return {
            ...u,
            teamInfo: {
              name: namedTeam ? namedTeam.name : rawTeam,
              isFreeAgent: false,
              isVerified: Boolean(namedTeam?.isVerified),
              tag: namedTeam?.tag || '',
            },
          };
        }

        return {
          ...u,
          teamInfo: {
            name: 'Free Agent',
            isFreeAgent: true,
            isVerified: null,
            tag: '',
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        activeTeams,
        pendingTeams,
        totalTournaments,
        liveTournaments,
        liveMatches,
        totalMatches,
        upcomingMatches,
        upcomingEvents,
      },
      recentUsers: enrichedRecentUsers,
      recentTournaments,
      teamsLeaderboard,
      liveMatchesList,
      recentMatchesList,
      games,
    });
  } catch (error) {
    next(error);
  }
};
