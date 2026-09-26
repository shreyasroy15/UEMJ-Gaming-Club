const Match = require('../models/Match');
const Team = require('../models/Team');

// @desc    Get matches
// @route   GET /api/matches
// @access  Public
exports.getMatches = async (req, res, next) => {
  try {
    const { tournament, status, team } = req.query;
    let query = {};

    if (tournament) query.tournament = tournament;
    if (status && status !== 'all') query.status = status;
    if (team) {
      query.$or = [{ teamA: team }, { teamB: team }];
    }

    const matches = await Match.find(query)
      .populate('tournament', 'name game banner status format')
      .populate('teamA', 'name teamName tag teamTag logo teamLogo players captain')
      .populate('teamB', 'name teamName tag teamTag logo teamLogo players captain')
      .populate('teams', 'teamName teamTag teamType captain players')
      .populate('winner', 'name tag logo teamName teamTag teamLogo')
      .sort({ scheduledAt: 1 });

    // Filter out any ghost matches where tournament reference no longer exists
    const validMatches = matches.filter((m) => m.tournament && m.tournament._id);

    res.status(200).json({
      success: true,
      count: validMatches.length,
      matches: validMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Public
exports.getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament', 'name game banner rules')
      .populate('teamA')
      .populate('teamB')
      .populate('winner');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    res.status(200).json({
      success: true,
      match,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create match
// @route   POST /api/matches
// @access  Private (Admin)
exports.createMatch = async (req, res, next) => {
  try {
    const match = await Match.create(req.body);

    const populatedMatch = await Match.findById(match._id)
      .populate('tournament', 'name game')
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo');

    res.status(201).json({
      success: true,
      match: populatedMatch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match (scores, winner, status)
// @route   PUT /api/matches/:id
// @access  Private (Admin)
exports.updateMatch = async (req, res, next) => {
  try {
    let match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    const wasCompleted = match.status === 'completed';
    const { scoreA, scoreB, winner, status, scheduledAt, streamUrl, round } = req.body;

    if (scoreA !== undefined) match.scoreA = Number(scoreA);
    if (scoreB !== undefined) match.scoreB = Number(scoreB);
    if (winner !== undefined) match.winner = winner || null;
    if (status) match.status = status;
    if (scheduledAt) match.scheduledAt = scheduledAt;
    if (streamUrl !== undefined) match.streamUrl = streamUrl;
    if (round) match.round = round;

    await match.save();

    // If match was just marked completed with a winner, update team stats!
    if (!wasCompleted && match.status === 'completed' && match.winner) {
      const winnerId = match.winner.toString();
      const loserId =
        match.teamA && match.teamA.toString() === winnerId
          ? match.teamB
          : match.teamA;

      await Team.findByIdAndUpdate(winnerId, {
        $inc: { wins: 1, matchesPlayed: 1, points: 3 },
      });

      if (loserId) {
        await Team.findByIdAndUpdate(loserId, {
          $inc: { losses: 1, matchesPlayed: 1 },
        });
      }
    }

    const updatedMatch = await Match.findById(match._id)
      .populate('tournament', 'name game')
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo')
      .populate('winner', 'name tag logo');

    res.status(200).json({
      success: true,
      match: updatedMatch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private (Admin)
exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    await match.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
