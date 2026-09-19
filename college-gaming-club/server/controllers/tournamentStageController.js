const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const mongoose = require('mongoose');

// Helper to resolve tournament by ID or slug
const findTournament = async (paramId) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(paramId) && /^[0-9a-fA-F]{24}$/.test(paramId);
  const query = isObjectId ? { _id: paramId } : { slug: paramId };
  return await Tournament.findOne(query);
};

// @desc    Get complete dynamic structure of stages, lobbies, teams & matches
// @route   GET /api/tournaments/:id/stages-structure
// @access  Private (Admin / Staff)
exports.getTournamentStructure = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Populate stages, lobbies, and teams
    await tournament.populate({
      path: 'stages.qualifiedTeams stages.advancedTeams stages.lobbies.teams stages.winner',
      select: 'teamName teamTag teamType captain players status leader createdAt',
      populate: [
        { path: 'captain', select: 'name username email avatar college studentId phone' },
        { path: 'players.user', select: 'name username email avatar college studentId' },
      ],
    });

    // Get all registered teams in the tournament
    const allRegistrations = await TournamentRegistration.find({ tournament: tournament._id })
      .populate('captain', 'name username email avatar college studentId phone')
      .populate('players.user', 'name username email avatar college studentId')
      .sort({ createdAt: 1 });

    // Get all matches for this tournament
    const matches = await Match.find({ tournament: tournament._id })
      .populate('teams', 'teamName teamTag teamType captain')
      .populate('winner', 'teamName teamTag')
      .sort({ matchNumber: 1, scheduledAt: 1 });

    res.status(200).json({
      success: true,
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        slug: tournament.slug,
        game: tournament.game,
        status: tournament.status,
        maxTeams: tournament.maxTeams,
      },
      stages: tournament.stages || [],
      allRegistrations,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new stage/round
// @route   POST /api/tournaments/:id/stages
// @access  Private (Admin / Staff)
exports.createStage = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const { name, order, isFinal } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Stage name is required' });
    }

    const stageOrder = order || (tournament.stages ? tournament.stages.length + 1 : 1);

    // Initial stage: automatically qualify all verified or completed tournament teams by default
    let defaultQualified = [];
    if (!tournament.stages || tournament.stages.length === 0) {
      const existingTeams = await TournamentRegistration.find({
        tournament: tournament._id,
        status: { $in: ['verified', 'complete', 'incomplete'] },
      }).select('_id');
      defaultQualified = existingTeams.map((t) => t._id);
    }

    const newStage = {
      name: name.trim(),
      order: stageOrder,
      status: 'upcoming',
      isFinal: Boolean(isFinal),
      qualifiedTeams: defaultQualified,
      advancedTeams: [],
      lobbies: [],
    };

    if (!tournament.stages) tournament.stages = [];
    tournament.stages.push(newStage);

    await tournament.save();

    const createdStage = tournament.stages[tournament.stages.length - 1];

    res.status(201).json({
      success: true,
      message: `Stage "${createdStage.name}" created successfully`,
      stage: createdStage,
      stages: tournament.stages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stage details (rename, reorder, status, final flag, winner)
// @route   PUT /api/tournaments/:id/stages/:stageId
// @access  Private (Admin / Staff)
exports.updateStage = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const { name, order, status, isFinal, winner } = req.body;
    if (name !== undefined) stage.name = name.trim();
    if (order !== undefined) stage.order = Number(order);
    if (status !== undefined) stage.status = status;
    if (isFinal !== undefined) stage.isFinal = Boolean(isFinal);
    if (winner !== undefined) stage.winner = winner || null;

    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Stage updated successfully',
      stage,
      stages: tournament.stages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a stage and its associated matches
// @route   DELETE /api/tournaments/:id/stages/:stageId
// @access  Private (Admin / Staff)
exports.deleteStage = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    // Delete matches linked to this stage
    await Match.deleteMany({ tournament: tournament._id, stageId: stage._id });

    // Remove subdocument
    stage.deleteOne();
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Stage and associated matches removed',
      stages: tournament.stages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new lobby inside a stage
// @route   POST /api/tournaments/:id/stages/:stageId/lobbies
// @access  Private (Admin / Staff)
exports.createLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const { name, maxTeams, order } = req.body;
    const lobbyName = (name && name.trim()) || `Lobby ${(stage.lobbies?.length || 0) + 1}`;
    const lobbyOrder = order || (stage.lobbies?.length || 0) + 1;

    const newLobby = {
      name: lobbyName,
      maxTeams: maxTeams ? Number(maxTeams) : 25,
      order: lobbyOrder,
      teams: [],
    };

    stage.lobbies.push(newLobby);
    await tournament.save();

    const createdLobby = stage.lobbies[stage.lobbies.length - 1];

    res.status(201).json({
      success: true,
      message: `Lobby "${createdLobby.name}" added to ${stage.name}`,
      lobby: createdLobby,
      stage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lobby (rename, capacity)
// @route   PUT /api/tournaments/:id/stages/:stageId/lobbies/:lobbyId
// @access  Private (Admin / Staff)
exports.updateLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const lobby = stage.lobbies.id(req.params.lobbyId);
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    const { name, maxTeams, order } = req.body;
    if (name !== undefined) lobby.name = name.trim();
    if (maxTeams !== undefined) lobby.maxTeams = Number(maxTeams);
    if (order !== undefined) lobby.order = Number(order);

    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Lobby updated successfully',
      lobby,
      stage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lobby from a stage
// @route   DELETE /api/tournaments/:id/stages/:stageId/lobbies/:lobbyId
// @access  Private (Admin / Staff)
exports.deleteLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const lobby = stage.lobbies.id(req.params.lobbyId);
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    // Delete matches linked to this lobby
    await Match.deleteMany({ tournament: tournament._id, lobbyId: lobby._id });

    lobby.deleteOne();
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Lobby deleted successfully',
      stage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign selected teams to a lobby
// @route   POST /api/tournaments/:id/stages/:stageId/lobbies/:lobbyId/assign-teams
// @access  Private (Admin / Staff)
exports.assignTeamsToLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const lobby = stage.lobbies.id(req.params.lobbyId);
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    const { teamIds } = req.body;
    if (!Array.isArray(teamIds)) {
      return res.status(400).json({ success: false, message: 'teamIds array is required' });
    }

    lobby.teams = teamIds;
    await tournament.save();

    // Also update any scheduled matches for this lobby to have the latest team list
    await Match.updateMany(
      { tournament: tournament._id, lobbyId: lobby._id, status: 'scheduled' },
      { $set: { teams: teamIds } }
    );

    res.status(200).json({
      success: true,
      message: `Assigned ${teamIds.length} teams to ${lobby.name}`,
      lobby,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual Team Qualification & Advance to Next Stage (with Admin Override)
// @route   POST /api/tournaments/:id/stages/:stageId/advance-teams
// @access  Private (Admin / Staff)
exports.manualAdvanceTeams = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const { advancedTeamIds, nextStageId, createNextStage, nextStageName, isFinal, mode = 'replace' } = req.body;

    if (!Array.isArray(advancedTeamIds)) {
      return res.status(400).json({ success: false, message: 'advancedTeamIds array is required' });
    }

    // Save advanced teams in current stage
    stage.advancedTeams = advancedTeamIds;

    let targetStage = null;
    let message = `Qualification saved: ${advancedTeamIds.length} teams marked as qualified in "${stage.name}".`;

    // Case 1: Existing next stage provided
    if (nextStageId) {
      targetStage = tournament.stages.id(nextStageId);
      if (targetStage) {
        if (mode === 'append') {
          const combined = [
            ...(targetStage.qualifiedTeams || []).map(String),
            ...advancedTeamIds.map(String),
          ];
          targetStage.qualifiedTeams = Array.from(new Set(combined));
          message = `Successfully qualified and merged ${advancedTeamIds.length} teams into "${targetStage.name}"! Total eligible: ${targetStage.qualifiedTeams.length}.`;
        } else {
          targetStage.qualifiedTeams = Array.from(new Set(advancedTeamIds.map(String)));
          message = `Successfully qualified and set ${advancedTeamIds.length} teams in "${targetStage.name}"!`;
        }
      }
    } else if (createNextStage && nextStageName && nextStageName.trim()) {
      // Case 2: Create brand new stage with these qualified teams
      const newStage = {
        name: nextStageName.trim(),
        order: tournament.stages.length + 1,
        status: 'upcoming',
        isFinal: Boolean(isFinal),
        qualifiedTeams: advancedTeamIds,
        advancedTeams: [],
        lobbies: [],
      };
      tournament.stages.push(newStage);
      targetStage = tournament.stages[tournament.stages.length - 1];
      message = `Successfully created stage "${newStage.name}" with ${advancedTeamIds.length} qualified teams!`;
    }

    await tournament.save();

    res.status(200).json({
      success: true,
      message,
      currentStage: stage,
      targetStage,
      stages: tournament.stages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin override: manually add or remove teams from a stage's qualified list
// @route   PUT /api/tournaments/:id/stages/:stageId/override-teams
// @access  Private (Admin / Staff)
exports.overrideStageTeams = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const { qualifiedTeamIds } = req.body;
    if (!Array.isArray(qualifiedTeamIds)) {
      return res.status(400).json({ success: false, message: 'qualifiedTeamIds array is required' });
    }

    stage.qualifiedTeams = qualifiedTeamIds;
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Stage eligible teams updated by Admin override',
      stage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Schedule a match inside a lobby
// @route   POST /api/tournaments/:id/stages/:stageId/lobbies/:lobbyId/matches
// @access  Private (Admin / Staff)
exports.createLobbyMatch = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const stage = tournament.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const lobby = stage.lobbies.id(req.params.lobbyId);
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    const {
      title,
      map,
      matchNumber,
      scheduledAt,
      status,
      roomId,
      roomPassword,
      streamUrl,
      notes,
    } = req.body;

    // Determine default match number
    const existingMatches = await Match.find({
      tournament: tournament._id,
      lobbyId: lobby._id,
    });

    const mNumber = matchNumber ? Number(matchNumber) : existingMatches.length + 1;
    const mTitle = (title && title.trim()) || `Match ${mNumber} - ${map || 'Erangel'}`;

    const match = await Match.create({
      tournament: tournament._id,
      stageId: stage._id,
      lobbyId: lobby._id,
      stageName: stage.name,
      lobbyName: lobby.name,
      matchNumber: mNumber,
      title: mTitle,
      map: map || 'Erangel',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: status || 'scheduled',
      roomId: roomId || '',
      roomPassword: roomPassword || '',
      streamUrl: streamUrl || '',
      notes: notes || '',
      teams: lobby.teams || [],
    });

    const populatedMatch = await Match.findById(match._id).populate(
      'teams',
      'teamName teamTag teamType captain'
    );

    res.status(201).json({
      success: true,
      message: `Match ${populatedMatch.matchNumber} scheduled for ${lobby.name}`,
      match: populatedMatch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match in a lobby (credentials, status, scores, winner)
// @route   PUT /api/tournaments/:id/matches/:matchId
// @access  Private (Admin / Staff)
exports.updateLobbyMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const {
      title,
      map,
      matchNumber,
      scheduledAt,
      status,
      roomId,
      roomPassword,
      winner,
      streamUrl,
      notes,
      teams,
    } = req.body;

    if (title !== undefined) match.title = title.trim();
    if (map !== undefined) match.map = map.trim();
    if (matchNumber !== undefined) match.matchNumber = Number(matchNumber);
    if (scheduledAt !== undefined) match.scheduledAt = new Date(scheduledAt);
    if (status !== undefined) match.status = status;
    if (roomId !== undefined) match.roomId = roomId.trim();
    if (roomPassword !== undefined) match.roomPassword = roomPassword.trim();
    if (winner !== undefined) match.winner = winner || null;
    if (streamUrl !== undefined) match.streamUrl = streamUrl;
    if (notes !== undefined) match.notes = notes;
    if (teams !== undefined && Array.isArray(teams)) match.teams = teams;

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('teams', 'teamName teamTag teamType captain')
      .populate('winner', 'teamName teamTag');

    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      match: populatedMatch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a match
// @route   DELETE /api/tournaments/:id/matches/:matchId
// @access  Private (Admin / Staff)
exports.deleteLobbyMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
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
