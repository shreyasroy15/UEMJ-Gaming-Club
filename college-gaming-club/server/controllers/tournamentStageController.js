const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const mongoose = require('mongoose');
const { sendMatchNotification } = require('../utils/notificationHelper');

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
      .populate('results.team', 'teamName teamTag captain')
      .sort({ matchNumber: 1, scheduledAt: 1 });

    // If no stages exist, auto-initialize a default stage so lobbies can be added seamlessly
    if (!tournament.stages || tournament.stages.length === 0) {
      tournament.stages = [
        {
          name: 'Main Stage',
          order: 1,
          status: 'upcoming',
          isFinal: false,
          qualifiedTeams: allRegistrations.map((r) => r._id),
          advancedTeams: [],
          lobbies: [],
        },
      ];
      await tournament.save();
    }

    // Flatten all lobbies for direct lobby-first navigation
    const allLobbies = [];
    (tournament.stages || []).forEach((stage) => {
      (stage.lobbies || []).forEach((lobby) => {
        allLobbies.push({
          _id: lobby._id,
          stageId: stage._id,
          stageName: stage.name,
          name: lobby.name,
          maxTeams: lobby.maxTeams || 25,
          status: lobby.status || 'upcoming',
          order: lobby.order || 1,
          teams: lobby.teams || [],
        });
      });
    });

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
      lobbies: allLobbies,
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

    // Check if any team is unverified
    if (teamIds.length > 0) {
      const unverifiedRegistrations = await TournamentRegistration.find({
        _id: { $in: teamIds },
        isVerified: false,
      });

      if (unverifiedRegistrations.length > 0) {
        const names = unverifiedRegistrations.map((t) => t.teamName).join(', ');
        return res.status(400).json({
          success: false,
          message: `Unverified teams cannot be assigned to lobbies: ${names}. Please verify all teams before assigning.`,
        });
      }
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

    // Automatic status logic: If Room ID & Password are provided, switch match to 'live' if scheduled
    const hasCredentials = Boolean(
      (match.roomId && match.roomId.trim()) ||
      (match.roomPassword && match.roomPassword.trim())
    );
    if (hasCredentials && match.status === 'scheduled') {
      match.status = 'live';
    }

    await match.save();

    // Automatic status logic: If Room ID & Password provided, switch parent lobby status to 'running' and tournament to 'ongoing'
    if (hasCredentials) {
      const tournament = await findTournament(req.params.id);
      if (tournament) {
        let changed = false;
        if (match.lobbyId && tournament.stages) {
          for (const stage of tournament.stages) {
            const lobby = stage.lobbies && stage.lobbies.id(match.lobbyId);
            if (lobby && lobby.status !== 'running') {
              lobby.status = 'running';
              changed = true;
              break;
            }
          }
        }
        if (tournament.status === 'upcoming' || tournament.status === 'registration-open' || tournament.status === 'on-hold') {
          tournament.status = 'ongoing';
          changed = true;
        }
        if (changed) {
          await tournament.save();
        }
      }
    }

    const populatedMatch = await Match.findById(match._id)
      .populate('teams', 'teamName teamTag teamType captain')
      .populate('winner', 'teamName teamTag');

    // Send notifications to participating squads
    const tournamentForNotif = await findTournament(req.params.id);
    if (tournamentForNotif) {
      let notifTitle = `⏱️ Match Updated: ${populatedMatch.stageName || populatedMatch.round} Match #${populatedMatch.matchNumber}`;
      let notifMessage = `Match schedule/details have been updated. Map: ${populatedMatch.map || 'Erangel'}. Tap to view fixtures.`;
      let notifType = 'match_update';

      if (roomId || roomPassword) {
        notifTitle = `🔑 Lobby Credentials Released: ${populatedMatch.stageName || populatedMatch.round} ${populatedMatch.lobbyName ? '• ' + populatedMatch.lobbyName : ''}`;
        notifMessage = `Room ID: ${populatedMatch.roomId}. Lobby room password has been released. Tap to view and copy credentials.`;
        notifType = 'match_credentials';
      } else if (populatedMatch.status === 'live') {
        notifTitle = `🔴 Match Is Now LIVE: ${populatedMatch.stageName || populatedMatch.round} Match #${populatedMatch.matchNumber}`;
        notifMessage = `Match #${populatedMatch.matchNumber} is now live! Join your assigned room in-game.`;
        notifType = 'match_live';
      }

      sendMatchNotification({
        match: populatedMatch,
        tournament: tournamentForNotif,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
      }).catch((e) => console.error('Match notification error:', e));
    }

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

// ==========================================
// DIRECT TOURNAMENT LOBBY ENDPOINTS
// (Streamlined for esports organizer workflow)
// ==========================================

// @desc    Create a lobby directly in a tournament
// @route   POST /api/tournaments/:id/lobbies
// @access  Private (Admin / Staff)
exports.createDirectLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    // Auto-create base stage if needed
    if (!tournament.stages || tournament.stages.length === 0) {
      tournament.stages = [
        {
          name: 'Main Stage',
          order: 1,
          status: 'upcoming',
          isFinal: false,
          qualifiedTeams: [],
          advancedTeams: [],
          lobbies: [],
        },
      ];
    }

    const stage = tournament.stages[0];
    const { name, maxTeams, status = 'upcoming', teamIds = [] } = req.body;
    const lobbyName = (name && name.trim()) || `Lobby ${(stage.lobbies?.length || 0) + 1}`;

    const newLobby = {
      name: lobbyName,
      maxTeams: maxTeams ? Number(maxTeams) : 25,
      status: status === 'running' ? 'running' : 'upcoming',
      order: (stage.lobbies?.length || 0) + 1,
      teams: Array.isArray(teamIds) ? teamIds : [],
    };

    stage.lobbies.push(newLobby);
    await tournament.save();

    const createdLobby = stage.lobbies[stage.lobbies.length - 1];

    res.status(201).json({
      success: true,
      message: `Lobby "${createdLobby.name}" created successfully`,
      lobby: createdLobby,
      stageId: stage._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a tournament lobby (rename, capacity, status)
// @route   PUT /api/tournaments/:id/lobbies/:lobbyId
// @access  Private (Admin / Staff)
exports.updateDirectLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    let foundLobby = null;
    for (const stage of tournament.stages || []) {
      const lobby = stage.lobbies?.id(req.params.lobbyId);
      if (lobby) {
        foundLobby = lobby;
        break;
      }
    }

    if (!foundLobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    const { name, maxTeams, status } = req.body;
    if (name !== undefined) foundLobby.name = name.trim();
    if (maxTeams !== undefined) foundLobby.maxTeams = Number(maxTeams);
    if (status !== undefined) foundLobby.status = status;

    await tournament.save();

    res.status(200).json({
      success: true,
      message: `Lobby "${foundLobby.name}" updated`,
      lobby: foundLobby,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tournament lobby
// @route   DELETE /api/tournaments/:id/lobbies/:lobbyId
// @access  Private (Admin / Staff)
exports.deleteDirectLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    let foundLobby = null;
    for (const stage of tournament.stages || []) {
      const lobby = stage.lobbies?.id(req.params.lobbyId);
      if (lobby) {
        foundLobby = lobby;
        lobby.deleteOne();
        break;
      }
    }

    if (!foundLobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    await Match.deleteMany({ tournament: tournament._id, lobbyId: req.params.lobbyId });
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Lobby and associated matches deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign teams to a tournament lobby
// @route   POST /api/tournaments/:id/lobbies/:lobbyId/assign-teams
// @access  Private (Admin / Staff)
exports.assignTeamsToDirectLobby = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    let foundLobby = null;
    for (const stage of tournament.stages || []) {
      const lobby = stage.lobbies?.id(req.params.lobbyId);
      if (lobby) {
        foundLobby = lobby;
        break;
      }
    }

    if (!foundLobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found' });
    }

    const { teamIds, mode = 'set' } = req.body;
    if (!Array.isArray(teamIds)) {
      return res.status(400).json({ success: false, message: 'teamIds array required' });
    }

    if (teamIds.length > 0) {
      const unverifiedRegistrations = await TournamentRegistration.find({
        _id: { $in: teamIds },
        status: { $ne: 'verified' },
      });

      if (unverifiedRegistrations.length > 0) {
        const names = unverifiedRegistrations.map((t) => t.teamName).join(', ');
        return res.status(400).json({
          success: false,
          message: `Unverified teams cannot be assigned to lobbies: ${names}. Please verify all teams before assigning.`,
        });
      }
    }

    if (mode === 'append') {
      const current = (foundLobby.teams || []).map(String);
      foundLobby.teams = Array.from(new Set([...current, ...teamIds.map(String)]));
    } else {
      foundLobby.teams = teamIds;
    }

    await tournament.save();

    // Sync teams to any scheduled matches in this lobby
    await Match.updateMany(
      { tournament: tournament._id, lobbyId: foundLobby._id, status: 'scheduled' },
      { $set: { teams: foundLobby.teams } }
    );

    res.status(200).json({
      success: true,
      message: `Assigned ${foundLobby.teams.length} teams to ${foundLobby.name}`,
      lobby: foundLobby,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Direct create match/round in a lobby
// @route   POST /api/tournaments/:id/lobbies/:lobbyId/matches
// @access  Private (Admin / Staff)
exports.createDirectLobbyMatch = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    let foundLobby = null;
    let foundStage = null;
    for (const stage of tournament.stages || []) {
      const lobby = stage.lobbies?.id(req.params.lobbyId);
      if (lobby) {
        foundLobby = lobby;
        foundStage = stage;
        break;
      }
    }

    if (!foundLobby) {
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

    const existingCount = await Match.countDocuments({
      tournament: tournament._id,
      lobbyId: foundLobby._id,
    });

    const mNumber = matchNumber ? Number(matchNumber) : existingCount + 1;
    const mTitle = (title && title.trim()) || `Round ${mNumber}`;

    const hasCredentials = Boolean(roomId && roomId.trim() && roomPassword && roomPassword.trim());
    const mStatus = hasCredentials ? 'live' : (status || 'scheduled');

    if (hasCredentials) {
      let changed = false;
      if (foundLobby.status !== 'running') {
        foundLobby.status = 'running';
        changed = true;
      }
      if (tournament.status === 'upcoming' || tournament.status === 'registration-open' || tournament.status === 'on-hold') {
        tournament.status = 'ongoing';
        changed = true;
      }
      if (changed) {
        await tournament.save();
      }
    }

    const match = await Match.create({
      tournament: tournament._id,
      stageId: foundStage._id,
      lobbyId: foundLobby._id,
      stageName: foundStage.name,
      lobbyName: foundLobby.name,
      matchNumber: mNumber,
      title: mTitle,
      map: map || 'Erangel',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: mStatus,
      roomId: roomId ? roomId.trim() : '',
      roomPassword: roomPassword ? roomPassword.trim() : '',
      streamUrl: streamUrl || '',
      notes: notes || '',
      teams: foundLobby.teams || [],
    });

    const populatedMatch = await Match.findById(match._id).populate(
      'teams',
      'teamName teamTag teamType captain'
    );

    sendMatchNotification({
      match: populatedMatch,
      tournament,
      title: hasCredentials
        ? `🔑 Match Credentials: ${populatedMatch.stageName} • ${populatedMatch.lobbyName}`
        : `🎮 New Match Scheduled: ${populatedMatch.stageName} • Match #${populatedMatch.matchNumber}`,
      message: hasCredentials
        ? `Room ID: ${populatedMatch.roomId}. Lobby room password has been released. Tap to view.`
        : `Match #${populatedMatch.matchNumber} scheduled for ${populatedMatch.lobbyName}. Map: ${populatedMatch.map}. Tap to view fixtures.`,
      type: hasCredentials ? 'match_credentials' : 'match_update',
    }).catch((e) => console.error('Match schedule notification error:', e));

    res.status(201).json({
      success: true,
      message: `${populatedMatch.title} scheduled for ${foundLobby.name}`,
      match: populatedMatch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new lobby by selecting top teams across multiple lobbies (e.g. Finals Lobby)
// @route   POST /api/tournaments/:id/lobbies/create-from-teams
// @access  Private (Admin / Staff)
exports.createLobbyFromSelectedTeams = async (req, res, next) => {
  try {
    const tournament = await findTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const { name, maxTeams, selectedTeamIds = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Lobby name is required' });
    }

    const uniqueTeamIds = Array.from(new Set(selectedTeamIds.map(String)));

    if (uniqueTeamIds.length > 0) {
      const unverifiedRegistrations = await TournamentRegistration.find({
        _id: { $in: uniqueTeamIds },
        isVerified: false,
      });

      if (unverifiedRegistrations.length > 0) {
        const names = unverifiedRegistrations.map((t) => t.teamName).join(', ');
        return res.status(400).json({
          success: false,
          message: `Unverified teams cannot be assigned to lobbies: ${names}. Please verify all teams before creating the lobby.`,
        });
      }
    }

    if (!tournament.stages || tournament.stages.length === 0) {
      tournament.stages = [
        {
          name: 'Main Stage',
          order: 1,
          status: 'upcoming',
          isFinal: false,
          qualifiedTeams: [],
          advancedTeams: [],
          lobbies: [],
        },
      ];
    }

    const stage = tournament.stages[0];

    const newLobby = {
      name: name.trim(),
      maxTeams: maxTeams ? Number(maxTeams) : Math.max(25, uniqueTeamIds.length),
      status: 'upcoming',
      order: (stage.lobbies?.length || 0) + 1,
      teams: uniqueTeamIds,
    };

    stage.lobbies.push(newLobby);
    await tournament.save();

    const createdLobby = stage.lobbies[stage.lobbies.length - 1];

    res.status(201).json({
      success: true,
      message: `Created "${createdLobby.name}" with ${uniqueTeamIds.length} qualified teams!`,
      lobby: createdLobby,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record round results, team rankings, kills, bonus and points
// @route   POST /api/tournaments/:id/matches/:matchId/results
// @access  Private (Admin / Staff)
exports.recordMatchResults = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const { results, status = 'completed' } = req.body;
    if (!Array.isArray(results)) {
      return res.status(400).json({ success: false, message: 'results array is required' });
    }

    // Format results
    const formattedResults = results.map((r) => ({
      team: r.team?._id || r.team || r.teamId,
      teamName: r.teamName || '',
      teamTag: r.teamTag || '',
      position: Number(r.position) || 0,
      kills: Number(r.kills) || 0,
      positionPoints: Number(r.positionPoints) || 0,
      killPoints: Number(r.killPoints) || 0,
      bonusPoints: Number(r.bonusPoints) || 0,
      totalPoints:
        Number(r.totalPoints) ||
        Number(r.positionPoints || 0) + Number(r.killPoints || 0) + Number(r.bonusPoints || 0),
    }));

    match.results = formattedResults;
    match.status = status;

    // Automatically set match.winner to the 1st place team
    const winnerEntry = formattedResults.find((r) => r.position === 1);
    if (winnerEntry && winnerEntry.team) {
      match.winner = winnerEntry.team;
    }

    await match.save();

    // Recalculate and update cumulative points in TournamentRegistration for all teams in tournament
    const allCompletedMatches = await Match.find({
      tournament: match.tournament,
      status: 'completed',
    });

    const teamCumulativeMap = {};
    allCompletedMatches.forEach((m) => {
      (m.results || []).forEach((resItem) => {
        if (!resItem.team) return;
        const tid = resItem.team.toString();
        if (!teamCumulativeMap[tid]) {
          teamCumulativeMap[tid] = { totalPoints: 0, matchesPlayed: 0 };
        }
        teamCumulativeMap[tid].totalPoints += Number(resItem.totalPoints || 0);
        teamCumulativeMap[tid].matchesPlayed += 1;
      });
    });

    // Update each registered team's cumulative points
    const updatePromises = Object.entries(teamCumulativeMap).map(([tid, stats]) =>
      TournamentRegistration.findByIdAndUpdate(tid, {
        $set: { points: stats.totalPoints, matchesPlayed: stats.matchesPlayed },
      })
    );
    await Promise.all(updatePromises);

    const populatedMatch = await Match.findById(match._id)
      .populate('teams', 'teamName teamTag teamType captain')
      .populate('winner', 'teamName teamTag')
      .populate('results.team', 'teamName teamTag captain');

    // Send notifications to squads with direct link to Points Table
    const tournamentForNotif = await findTournament(req.params.id);
    if (tournamentForNotif) {
      sendMatchNotification({
        match: populatedMatch,
        tournament: tournamentForNotif,
        title: `🏆 Match Results Recorded: ${populatedMatch.stageName || populatedMatch.round} Match #${populatedMatch.matchNumber}`,
        message: `Results for Match #${populatedMatch.matchNumber} in ${populatedMatch.lobbyName || 'Lobby'} have been recorded! Check updated standings.`,
        type: 'match_results',
        customLink: `/tournaments/${tournamentForNotif.slug || tournamentForNotif._id}?tab=leaderboard`,
      }).catch((e) => console.error('Results notification error:', e));
    }

    res.status(200).json({
      success: true,
      message: `Results recorded for ${populatedMatch.title || 'Round'} successfully!`,
      match: populatedMatch,
    });
  } catch (error) {
    next(error);
  }
};


