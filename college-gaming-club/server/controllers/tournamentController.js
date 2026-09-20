const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

// Helper to slugify tournament name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
exports.getTournaments = async (req, res, next) => {
  try {
    const { status, game, search, sort } = req.query;
    let query = {};

    if (status && status !== 'all') {
      if (status === 'ongoing' || status === 'live') {
        query.status = { $in: ['ongoing', 'live'] };
      } else {
        query.status = status;
      }
    }

    if (game && game !== 'all') {
      query.game = game;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let sortOption = { startDate: 1 };
    if (sort === 'prize') sortOption = { 'prizePool.total': -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const tournaments = await Tournament.find(query)
      .populate('registeredTeams.team', 'name tag logo')
      .populate('createdBy', 'name username')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tournament by ID or slug
// @route   GET /api/tournaments/:id
// @access  Public
exports.getTournamentById = async (req, res, next) => {
  try {
    let tournament;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      tournament = await Tournament.findById(req.params.id)
        .populate({
          path: 'registeredTeams.team',
          populate: { path: 'captain members.user', select: 'name username avatar' },
        })
        .populate('createdBy', 'name username');
    } else {
      tournament = await Tournament.findOne({ slug: req.params.id })
        .populate({
          path: 'registeredTeams.team',
          populate: { path: 'captain members.user', select: 'name username avatar' },
        })
        .populate('createdBy', 'name username');
    }

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Populate lobbies and teams in stages
    await tournament.populate({
      path: 'stages.lobbies.teams stages.qualifiedTeams stages.winner',
      select: 'teamName teamTag teamLogo captain players status points matchesPlayed',
      populate: [
        { path: 'captain', select: 'name username avatar' },
      ],
    });

    // Also fetch matches for this tournament populated with teams and results
    const matches = await Match.find({ tournament: tournament._id })
      .populate('teamA', 'name tag logo')
      .populate('teamB', 'name tag logo')
      .populate({
        path: 'teams',
        select: 'teamName teamTag teamLogo captain leader players points matchesPlayed',
        populate: [
          { path: 'captain', select: 'name username avatar' },
          { path: 'leader', select: 'name username avatar' },
        ],
      })
      .populate('winner', 'name tag logo teamName teamTag teamLogo')
      .populate({
        path: 'results.team',
        select: 'teamName teamTag teamLogo captain points matchesPlayed',
        populate: { path: 'captain', select: 'name username avatar' },
      })
      .sort({ matchNumber: 1, scheduledAt: 1 });

    // Determine authorization for lobby passwords
    const isStaffUser = req.user && (req.user.role === 'admin' || req.user.role === 'staff' || req.user.role === 'coordinator');
    const currentUserId = req.user?._id?.toString();

    const sanitizedMatches = matches.map((m) => {
      const matchObj = m.toObject();

      let isAssignedToThisLobby = Boolean(isStaffUser);
      if (!isAssignedToThisLobby && currentUserId && matchObj.teams) {
        isAssignedToThisLobby = matchObj.teams.some((team) => {
          if (!team) return false;
          const capId = (team.captain?._id || team.captain)?.toString();
          const leadId = (team.leader?._id || team.leader)?.toString();
          if (capId === currentUserId || leadId === currentUserId) return true;
          if (team.players && Array.isArray(team.players)) {
            return team.players.some(
              (p) => (p.user?._id || p.user)?.toString() === currentUserId
            );
          }
          return false;
        });
      }

      // Password security: ONLY show roomPassword to players of squads in that lobby or staff
      if (!isAssignedToThisLobby) {
        matchObj.roomPassword = '';
        matchObj.isPasswordLocked = true;
      } else {
        matchObj.isPasswordLocked = false;
      }

      matchObj.isAssignedToThisLobby = isAssignedToThisLobby;
      return matchObj;
    });

    // Extract unified allLobbies (Filter out rejected teams)
    const allLobbies = [];
    (tournament.stages || []).forEach((stage) => {
      (stage.lobbies || []).forEach((l) => {
        allLobbies.push({
          _id: l._id,
          stageId: stage._id,
          stageName: stage.name,
          name: l.name,
          maxTeams: l.maxTeams || 25,
          status: l.status || 'upcoming',
          order: l.order || 1,
          teams: (l.teams || []).filter(
            (t) => t && t.status !== 'rejected' && (!t.identityProof || t.identityProof.status !== 'rejected')
          ),
        });
      });
    });

    res.status(200).json({
      success: true,
      tournament,
      matches: sanitizedMatches,
      lobbies: allLobbies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tournament
// @route   POST /api/tournaments
// @access  Private (Admin)
exports.createTournament = async (req, res, next) => {
  try {
    const {
      name,
      game,
      banner,
      description,
      rules,
      format,
      prizePool,
      entryFee,
      maxTeams,
      minTeamSize,
      maxTeamSize,
      allowSubstitutes,
      maxSubstitutes,
      registrationDeadline,
      identityProofDeadline,
      startDate,
      endDate,
      status,
      organizer,
      streamUrl,
    } = req.body;

    if (!name || !game || !banner || !description || !registrationDeadline || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required tournament fields',
      });
    }

    const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`;

    const tournament = await Tournament.create({
      name,
      slug,
      game,
      banner,
      description,
      rules: rules || undefined,
      format: format || 'Single Elimination',
      prizePool: prizePool || { total: 10000, currency: 'INR (₹)' },
      entryFee: entryFee || 0,
      maxTeams: maxTeams || 16,
      minTeamSize: minTeamSize || 4,
      maxTeamSize: maxTeamSize || 5,
      allowSubstitutes: allowSubstitutes !== false,
      maxSubstitutes: maxSubstitutes !== undefined ? maxSubstitutes : 1,
      registrationDeadline,
      identityProofDeadline: identityProofDeadline || registrationDeadline,
      startDate,
      endDate,
      status: status || 'upcoming',
      organizer: organizer || 'UEM Gaming Club',
      streamUrl: streamUrl || 'https://twitch.tv',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Admin)
exports.updateTournament = async (req, res, next) => {
  try {
    let tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update tournament status (ongoing/running, on-hold, registration-open, upcoming, completed)
// @route   PATCH /api/tournaments/:id/status
// @access  Private (Admin / Staff)
exports.updateTournamentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['upcoming', 'registration-open', 'ongoing', 'live', 'on-hold', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed values: ${allowed.join(', ')}`,
      });
    }

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      message: `Tournament status updated to "${status}"`,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Admin)
exports.deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Delete associated matches
    await Match.deleteMany({ tournament: tournament._id });
    await tournament.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tournament and associated matches deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a team for tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
exports.registerTeam = async (req, res, next) => {
  try {
    const { teamId, teamName, inGameName, tag } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Rule 6: Only authenticated students or admin can register
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authenticated college students can register for tournaments',
      });
    }

    // Check tournament status
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this tournament',
      });
    }

    // Check registration deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this tournament',
      });
    }

    // Check if tournament is full
    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'This tournament has reached the maximum number of teams',
      });
    }

    let team;
    if (teamId) {
      team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found',
        });
      }

      // Must be captain or admin
      if (team.captain.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only the team captain or an admin can register the team',
        });
      }
    } else if (teamName) {
      // Find existing team or create new squad for student
      team = await Team.findOne({ name: { $regex: `^${teamName.trim()}$`, $options: 'i' } });
      if (!team) {
        team = await Team.create({
          name: teamName.trim(),
          tag: (tag || teamName.substring(0, 4)).toUpperCase().trim(),
          game: tournament.game,
          captain: req.user.id,
          members: [
            {
              user: req.user.id,
              role: 'captain',
              inGameName: inGameName || req.user.username,
            },
          ],
        });
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { teams: team._id },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please select an existing team or provide a team name',
      });
    }

    // Rule 8: Check if team or user is already registered in this tournament
    const userTeams = await Team.find({
      $or: [{ captain: req.user.id }, { 'members.user': req.user.id }],
    }).select('_id');
    const userTeamIds = userTeams.map((t) => t._id.toString());

    const alreadyRegistered = tournament.registeredTeams.some((reg) =>
      reg.team && (reg.team.toString() === team._id.toString() || userTeamIds.includes(reg.team.toString()))
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this tournament',
      });
    }

    tournament.registeredTeams.push({
      team: team._id,
      registeredAt: new Date(),
    });

    await tournament.save();

    const registrationId = `REG-${tournament._id.toString().slice(-4).toUpperCase()}-${team._id.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    res.status(200).json({
      success: true,
      message: `${team.name} successfully registered for ${tournament.name}!`,
      registrationId,
      tournament: tournament.name,
      team: team.name,
      tournamentData: tournament,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate bracket & matches for tournament
// @route   POST /api/tournaments/:id/generate-bracket
// @access  Private (Admin)
exports.generateBracket = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('registeredTeams.team');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const teams = tournament.registeredTeams.map((r) => r.team).filter(Boolean);

    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 registered teams to generate brackets',
      });
    }

    // Clear existing matches
    await Match.deleteMany({ tournament: tournament._id });

    // Build single-elimination bracket rounds
    const matchesToCreate = [];
    const count = teams.length;

    // Determine round name for initial matches
    let roundName = 'Round 1';
    if (count <= 2) roundName = 'Grand Final';
    else if (count <= 4) roundName = 'Semi Finals';
    else if (count <= 8) roundName = 'Quarter Finals';

    let matchNumber = 1;
    for (let i = 0; i < count; i += 2) {
      if (i + 1 < count) {
        matchesToCreate.push({
          tournament: tournament._id,
          round: roundName,
          roundIndex: 1,
          matchNumber: matchNumber++,
          teamA: teams[i]._id,
          teamB: teams[i + 1]._id,
          status: 'scheduled',
          scheduledAt: new Date(tournament.startDate.getTime() + (matchNumber - 1) * 3600000),
        });
      }
    }

    const createdMatches = await Match.insertMany(matchesToCreate);
    tournament.status = 'live';
    await tournament.save();

    res.status(201).json({
      success: true,
      message: `Generated ${createdMatches.length} bracket matches`,
      matches: createdMatches,
    });
  } catch (error) {
    next(error);
  }
};
