const Tournament = require('../models/Tournament');
const TournamentForm = require('../models/TournamentForm');
const TournamentRegistration = require('../models/TournamentRegistration');
const User = require('../models/User');

// Helper to generate unique team code
const generateUniqueCode = async (game) => {
  const cleanGame = (game || 'BGMI').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'GAME';
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 15) {
    attempts++;
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    code = `${cleanGame}-${randomChars}`;
    const existing = await TournamentRegistration.findOne({ teamCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// Helper: check if a player's responses satisfy all required player-level questions
const validatePlayerResponses = (questions, responses = {}) => {
  const playerQuestions = (questions || []).filter((q) => q.scope === 'player' && q.required);
  const errors = [];

  for (const q of playerQuestions) {
    const val = responses instanceof Map ? responses.get(q.id) : responses[q.id];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      errors.push(`Missing required field: ${q.label}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper: check and update team completion status
const evaluateTeamCompletion = async (registration, tournament) => {
  const minRequiredStarters = tournament.minTeamSize || 4;

  // Find starter slots (including captain/leader who is slot 1)
  const starters = registration.players.filter(
    (p) => p.role === 'captain' || p.role === 'starter'
  );

  const completedStarters = starters.filter((p) => p.status === 'completed');
  const startersSatisfied = starters.length >= minRequiredStarters && completedStarters.length >= minRequiredStarters;

  // Check if team-level identity proof is required by the form
  const form = await TournamentForm.findOne({ tournament: tournament._id });
  const hasIdentityProofQuestion = form?.questions?.some(
    (q) => q.scope === 'team' && (q.id === 'team_identity_proof' || q.id === 'identity_proof') && q.required
  );

  // If team identity proof is required, it must be uploaded!
  const hasUploadedProof = Boolean(
    (registration.identityProof && registration.identityProof.url) ||
    (registration.teamResponses && (
      (registration.teamResponses instanceof Map
        ? (registration.teamResponses.get('team_identity_proof') || registration.teamResponses.get('identity_proof'))
        : (registration.teamResponses.team_identity_proof || registration.teamResponses.identity_proof))
    ))
  );

  const isComplete = startersSatisfied && (!hasIdentityProofQuestion || hasUploadedProof);

  if (isComplete && registration.status === 'incomplete') {
    registration.status = 'complete';
    registration.completedAt = new Date();
  } else if (!isComplete && registration.status === 'complete') {
    registration.status = 'incomplete';
  }

  await registration.save();
  return registration;
};

// Helper: extract user account profile data for auto-prefill
const getAccountPrefillData = (user) => {
  if (!user) return {};
  return {
    player_name: user.name || '',
    email: user.email || '',
    college_name: user.college || '',
    college_id: user.studentId || '',
    phone_number: user.phone || '',
    profile_photo: user.avatar || '',
  };
};

// @desc    Create a new team registration for tournament
// @route   POST /api/tournaments/:id/registrations/create-team
// @access  Private
exports.createTeamRegistration = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Check status
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Registrations are closed for this tournament',
      });
    }

    // Check deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this tournament',
      });
    }

    // Check max teams
    const currentTeamsCount = await TournamentRegistration.countDocuments({ tournament: tournament._id });
    if (currentTeamsCount >= (tournament.maxTeams || 16)) {
      return res.status(400).json({
        success: false,
        message: 'Tournament has reached maximum team capacity',
      });
    }

    // Rule: One-team-per-tournament rule enforced on backend
    const existingParticipation = await TournamentRegistration.findOne({
      tournament: tournament._id,
      $or: [
        { captain: req.user.id },
        { leader: req.user.id },
        { 'players.user': req.user.id },
      ],
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: `You are already registered in team "${existingParticipation.teamName}" for this tournament. Each participant can only join one team per tournament.`,
        registrationId: existingParticipation._id,
      });
    }

    const { teamName, teamTag, teamLogo, teamResponses } = req.body;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a team name',
      });
    }

    // Check duplicate team name in this tournament
    const duplicateTeam = await TournamentRegistration.findOne({
      tournament: tournament._id,
      teamName: { $regex: `^${teamName.trim()}$`, $options: 'i' },
    });

    if (duplicateTeam) {
      return res.status(400).json({
        success: false,
        message: 'A team with this name has already registered for this tournament',
      });
    }

    const teamCode = await generateUniqueCode(tournament.game);

    // Auto-prefill Leader Slot 1 with authenticated account profile data
    const leaderPrefill = getAccountPrefillData(req.user);

    // Create registration with Captain / Leader in slot 1
    const registration = await TournamentRegistration.create({
      tournament: tournament._id,
      teamName: teamName.trim(),
      teamTag: (teamTag || teamName.substring(0, 4)).toUpperCase().trim(),
      teamLogo: teamLogo || undefined,
      teamCode,
      captain: req.user.id,
      leader: req.user.id,
      teamResponses: teamResponses || {},
      identityProof: {
        url: '',
        status: 'pending',
      },
      players: [
        {
          user: req.user.id,
          role: 'captain',
          slotNumber: 1,
          status: 'joined',
          responses: leaderPrefill,
          joinedAt: new Date(),
        },
      ],
      status: 'incomplete',
    });

    // Populate user details for return
    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar email')
      .populate('leader', 'name username avatar email')
      .populate('players.user', 'name username avatar email');

    res.status(201).json({
      success: true,
      message: `Team "${registration.teamName}" created! Share team code ${teamCode} with your squad.`,
      registration: populated,
      teamCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join team using team code or invite link
// @route   POST /api/registrations/join
// @access  Private
exports.joinTeamByCode = async (req, res, next) => {
  try {
    const { teamCode } = req.body;

    if (!teamCode || !teamCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a team invite code',
      });
    }

    const cleanCode = teamCode.trim().toUpperCase();

    const registration = await TournamentRegistration.findOne({ teamCode: cleanCode })
      .populate('tournament');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No team found with this invite code. Please verify and try again.',
      });
    }

    const tournament = registration.tournament;

    // Check tournament status & deadline
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Tournament registration is closed',
      });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this tournament',
      });
    }

    // Check if player is already in this team
    const isAlreadyInTeam = registration.players.some(
      (p) => p.user.toString() === req.user.id
    );

    if (isAlreadyInTeam) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this team',
        registrationId: registration._id,
        registration,
      });
    }

    // Rule: One-team-per-tournament rule enforced on backend
    const inAnotherTeam = await TournamentRegistration.findOne({
      tournament: tournament._id,
      _id: { $ne: registration._id },
      $or: [
        { captain: req.user.id },
        { leader: req.user.id },
        { 'players.user': req.user.id },
      ],
    });

    if (inAnotherTeam) {
      return res.status(400).json({
        success: false,
        message: `You are already registered in team "${inAnotherTeam.teamName}" for this tournament. Each participant can only join one team per tournament.`,
      });
    }

    // Check team capacity
    const maxCapacity = tournament.maxTeamSize || 5;
    if (registration.players.length >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `This team is already full (${registration.players.length}/${maxCapacity} players)`,
      });
    }

    // Determine slot and role
    const minStarters = tournament.minTeamSize || 4;
    const currentStarters = registration.players.filter((p) => p.role === 'starter' || p.role === 'captain').length;
    const role = currentStarters < minStarters ? 'starter' : 'substitute';
    const nextSlot = registration.players.length + 1;

    // Auto-prefill joined player slot with authenticated account data
    const playerPrefill = getAccountPrefillData(req.user);

    registration.players.push({
      user: req.user.id,
      role,
      slotNumber: nextSlot,
      status: 'joined',
      responses: playerPrefill,
      joinedAt: new Date(),
    });

    // Save and re-evaluate
    await evaluateTeamCompletion(registration, tournament);

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar')
      .populate('leader', 'name username avatar')
      .populate('players.user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: `Successfully joined ${registration.teamName}! Complete your player information.`,
      registrationId: registration._id,
      registration: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registration workspace details (team status, roster checklist, form schema, prefill data)
// @route   GET /api/registrations/:id
// @access  Private
exports.getRegistrationWorkspace = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id)
      .populate('captain', 'name username avatar email college studentId phone')
      .populate('leader', 'name username avatar email college studentId phone')
      .populate('players.user', 'name username avatar email college studentId phone')
      .populate('tournament');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    const form = await TournamentForm.findOne({ tournament: registration.tournament._id });

    // Identify user's role in this registration
    const isLeader = (registration.leader?._id || registration.captain?._id || registration.captain).toString() === req.user.id;
    const currentSlot = registration.players.find(
      (p) => p.user._id.toString() === req.user.id
    );

    // Completion and order evaluation
    const tournament = registration.tournament;
    const minRequiredStarters = tournament.minTeamSize || 4;
    const starters = registration.players.filter((p) => p.role === 'captain' || p.role === 'starter');
    const completedStarters = starters.filter((p) => p.status === 'completed');
    const canUploadIdentityProof = starters.length >= minRequiredStarters && completedStarters.length >= minRequiredStarters;

    const identityProofDeadline = tournament.identityProofDeadline || tournament.registrationDeadline;
    const isIdentityProofDeadlinePassed = identityProofDeadline ? new Date() > new Date(identityProofDeadline) : false;

    // Pre-fill data from authenticated user profile
    const accountPrefill = getAccountPrefillData(req.user);

    // Merge missing responses with account data
    let mergedResponses = {};
    if (currentSlot && currentSlot.responses) {
      mergedResponses = currentSlot.responses instanceof Map
        ? Object.fromEntries(currentSlot.responses)
        : { ...currentSlot.responses };
    }
    for (const [k, v] of Object.entries(accountPrefill)) {
      if (!mergedResponses[k] && v) {
        mergedResponses[k] = v;
      }
    }

    res.status(200).json({
      success: true,
      registration,
      form,
      canUploadIdentityProof,
      identityProofDeadline,
      isIdentityProofDeadlinePassed,
      currentUserState: {
        isCaptain: isLeader,
        isLeader,
        isMember: Boolean(currentSlot),
        role: currentSlot ? currentSlot.role : null,
        slotNumber: currentSlot ? currentSlot.slotNumber : null,
        status: currentSlot ? currentSlot.status : null,
        responses: mergedResponses,
        accountPrefill,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit / Update player-specific tournament responses (No player-level identity proof)
// @route   PUT /api/registrations/:id/player-submission
// @access  Private
exports.submitPlayerInformation = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    const tournament = await Tournament.findById(registration.tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Find player slot for authenticated user
    const playerIndex = registration.players.findIndex(
      (p) => p.user.toString() === req.user.id
    );

    if (playerIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team roster',
      });
    }

    const form = await TournamentForm.findOne({ tournament: tournament._id });
    const { responses } = req.body;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Please submit your responses object',
      });
    }

    // Validate required player questions (ignoring any team questions or legacy identity_proof)
    if (form && form.questions) {
      const validation = validatePlayerResponses(form.questions, responses);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0] || 'Please complete all required player questions',
          errors: validation.errors,
        });
      }
    }

    // Update user profile with phone or studentId if provided and user lacks it
    if (responses.phone_number || responses.college_id) {
      const userUpdates = {};
      if (responses.phone_number && !req.user.phone) userUpdates.phone = responses.phone_number;
      if (responses.college_id && !req.user.studentId) userUpdates.studentId = responses.college_id;
      if (Object.keys(userUpdates).length > 0) {
        User.findByIdAndUpdate(req.user.id, userUpdates).catch(() => {});
      }
    }

    // Update player responses & mark completed
    registration.players[playerIndex].responses = responses;
    registration.players[playerIndex].status = 'completed';
    registration.players[playerIndex].completedAt = new Date();

    // Check if team is now complete
    await evaluateTeamCompletion(registration, tournament);

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar')
      .populate('leader', 'name username avatar')
      .populate('players.user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Your player tournament information has been submitted successfully!',
      registration: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload / Update Team-Level Combined Identity Proof PDF
// @route   PUT /api/registrations/:id/team-identity-proof
// @access  Private (Team members / Captain)
exports.uploadTeamIdentityProof = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    const tournament = await Tournament.findById(registration.tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Check authorization: must be a member of the team (or admin)
    const isMember = registration.players.some((p) => p.user.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only registered members of this team can upload the team identity proof',
      });
    }

    // Check identity proof submission deadline
    const deadline = tournament.identityProofDeadline || tournament.registrationDeadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Identity proof submission deadline has passed. Uploads and updates are closed for users.',
      });
    }

    // Check completion order: All required players must have completed their details first!
    const minRequiredStarters = tournament.minTeamSize || 4;
    const starters = registration.players.filter((p) => p.role === 'captain' || p.role === 'starter');
    const completedStarters = starters.filter((p) => p.status === 'completed');

    if (starters.length < minRequiredStarters || completedStarters.length < minRequiredStarters) {
      return res.status(400).json({
        success: false,
        message: `All ${minRequiredStarters} required team members must complete their individual player details before the team identity proof PDF can be uploaded. (${completedStarters.length}/${minRequiredStarters} completed)`,
      });
    }

    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the uploaded PDF document URL',
      });
    }

    // Update team identity proof
    registration.identityProof = {
      url: url.trim(),
      submittedAt: new Date(),
      status: 'submitted',
      verificationNotes: '',
    };

    if (!registration.teamResponses) {
      registration.teamResponses = new Map();
    }
    if (registration.teamResponses instanceof Map) {
      registration.teamResponses.set('team_identity_proof', url.trim());
    } else {
      registration.teamResponses.team_identity_proof = url.trim();
    }

    // Re-evaluate team completion
    await evaluateTeamCompletion(registration, tournament);

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar email')
      .populate('leader', 'name username avatar email')
      .populate('players.user', 'name username avatar email');

    res.status(200).json({
      success: true,
      message: 'Team Identity Proof PDF uploaded successfully!',
      registration: populated,
      identityProof: populated.identityProof,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer team leadership to another registered squad member
// @route   PUT /api/registrations/:id/transfer-leader
// @access  Private (Current Leader or Admin)
exports.transferLeadership = async (req, res, next) => {
  try {
    const { newLeaderUserId } = req.body;
    if (!newLeaderUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the new team leader user ID',
      });
    }

    const registration = await TournamentRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    const currentLeaderId = (registration.leader || registration.captain).toString();
    const isCurrentLeader = currentLeaderId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCurrentLeader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the current team leader or an admin can transfer leadership',
      });
    }

    // Target must be an existing member in the team
    const targetMember = registration.players.find(
      (p) => p.user.toString() === newLeaderUserId.toString()
    );

    if (!targetMember) {
      return res.status(400).json({
        success: false,
        message: 'The selected user is not a member of this team roster',
      });
    }

    // Swap roles
    registration.players.forEach((p) => {
      if (p.user.toString() === newLeaderUserId.toString()) {
        p.role = 'captain';
      } else if (p.role === 'captain') {
        p.role = 'starter';
      }
    });

    registration.captain = newLeaderUserId;
    registration.leader = newLeaderUserId;
    await registration.save();

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar email')
      .populate('leader', 'name username avatar email')
      .populate('players.user', 'name username avatar email');

    res.status(200).json({
      success: true,
      message: 'Leadership successfully transferred to selected squad member',
      registration: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Captain / Admin removes a member from the squad
// @route   DELETE /api/registrations/:id/members/:userId
// @access  Private
exports.removeTeamMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const registration = await TournamentRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    const isCaptain = (registration.leader || registration.captain).toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCaptain && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader or an admin can remove team members',
      });
    }

    if ((registration.leader || registration.captain).toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader from roster. Transfer leadership first.',
      });
    }

    registration.players = registration.players.filter(
      (p) => p.user.toString() !== userId
    );

    // Re-index slots
    registration.players.forEach((p, idx) => {
      p.slotNumber = idx + 1;
    });

    const tournament = await Tournament.findById(registration.tournament);
    await evaluateTeamCompletion(registration, tournament);

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar')
      .populate('leader', 'name username avatar')
      .populate('players.user', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Member removed from squad',
      registration: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave squad (member leaves on their own)
// @route   POST /api/registrations/:id/leave
// @access  Private
exports.leaveSquad = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration squad not found',
      });
    }

    if ((registration.leader || registration.captain).toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave the team. Transfer leadership or disband squad first.',
      });
    }

    registration.players = registration.players.filter(
      (p) => p.user.toString() !== req.user.id
    );

    // Re-index slots
    registration.players.forEach((p, idx) => {
      p.slotNumber = idx + 1;
    });

    const tournament = await Tournament.findById(registration.tournament);
    await evaluateTeamCompletion(registration, tournament);

    res.status(200).json({
      success: true,
      message: 'You have left the tournament squad',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public teams for tournament (Privacy-safe: NO emails, phones, college IDs, or ID card PDFs)
// @route   GET /api/tournaments/:id/public-teams
// @access  Public
exports.getPublicTeams = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const form = await TournamentForm.findOne({ tournament: tournament._id });
    const publicQuestionIds = new Set(
      (form?.questions || [])
        .filter((q) => q.isPublic)
        .map((q) => q.id)
    );

    const registrations = await TournamentRegistration.find({
      tournament: tournament._id,
      status: { $in: ['complete', 'verified'] }, // only show complete/confirmed teams publicly
    })
      .populate('captain', 'name username avatar')
      .populate('leader', 'name username avatar')
      .populate('players.user', 'name username avatar');

    // Build sanitized public output - Identity proof is STRICTLY EXCLUDED
    const sanitizedTeams = registrations.map((reg) => {
      // Filter public team responses (never include identity proof)
      const safeTeamResponses = {};
      if (reg.teamResponses) {
        for (const [key, val] of (reg.teamResponses instanceof Map ? reg.teamResponses : Object.entries(reg.teamResponses))) {
          if (publicQuestionIds.has(key) && key !== 'team_identity_proof' && key !== 'identity_proof') {
            safeTeamResponses[key] = val;
          }
        }
      }

      // Filter public player information
      const safePlayers = reg.players.map((p) => {
        const safePlayerResponses = {};
        if (p.responses) {
          for (const [key, val] of (p.responses instanceof Map ? p.responses : Object.entries(p.responses))) {
            if (publicQuestionIds.has(key) && key !== 'phone_number' && key !== 'college_id' && key !== 'identity_proof') {
              safePlayerResponses[key] = val;
            }
          }
        }

        return {
          slotNumber: p.slotNumber,
          role: p.role,
          name: safePlayerResponses.player_name || p.user?.name || 'Player',
          ign: safePlayerResponses.game_ign || safePlayerResponses.ign || p.user?.username || 'Player',
          photo: safePlayerResponses.profile_photo || p.user?.avatar || '',
          college: safePlayerResponses.college_name || '',
          status: p.status,
        };
      });

      return {
        _id: reg._id,
        teamName: reg.teamName,
        teamTag: reg.teamTag,
        teamLogo: reg.teamLogo,
        captain: {
          name: reg.captain?.name || 'Leader',
          username: reg.captain?.username || 'Leader',
          avatar: reg.captain?.avatar,
        },
        leader: {
          name: (reg.leader || reg.captain)?.name || 'Leader',
          username: (reg.leader || reg.captain)?.username || 'Leader',
          avatar: (reg.leader || reg.captain)?.avatar,
        },
        status: reg.status,
        teamResponses: safeTeamResponses,
        players: safePlayers,
        registeredAt: reg.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: sanitizedTeams.length,
      teams: sanitizedTeams,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List all registrations for a tournament with full verification details & ONE Team Identity PDF
// @route   GET /api/admin/tournaments/:id/registrations
// @access  Private (Admin / Staff)
exports.getAdminRegistrations = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const { status } = req.query;
    let query = { tournament: tournament._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const registrations = await TournamentRegistration.find(query)
      .populate('captain', 'name username email avatar college studentId phone')
      .populate('leader', 'name username email avatar college studentId phone')
      .populate('players.user', 'name username email avatar college studentId phone')
      .sort({ createdAt: -1 });

    const form = await TournamentForm.findOne({ tournament: tournament._id });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
      form,
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        game: tournament.game,
        minTeamSize: tournament.minTeamSize || 4,
        maxTeamSize: tournament.maxTeamSize || 5,
        maxTeams: tournament.maxTeams || 16,
        registrationDeadline: tournament.registrationDeadline,
        identityProofDeadline: tournament.identityProofDeadline || tournament.registrationDeadline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Verify or reject team registration and identity proof
// @route   PUT /api/admin/registrations/:id/verify
// @access  Private (Admin / Staff)
exports.verifyRegistration = async (req, res, next) => {
  try {
    const { status, identityProofStatus, verificationNotes } = req.body;

    const registration = await TournamentRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    if (status) {
      if (!['verified', 'rejected', 'complete', 'incomplete'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be verified, rejected, complete, or incomplete',
        });
      }
      registration.status = status;
    }

    if (identityProofStatus) {
      if (!['pending', 'submitted', 'verified', 'rejected'].includes(identityProofStatus)) {
        return res.status(400).json({
          success: false,
          message: 'identityProofStatus must be pending, submitted, verified, or rejected',
        });
      }
      if (!registration.identityProof) {
        registration.identityProof = {};
      }
      registration.identityProof.status = identityProofStatus;
    }

    if (verificationNotes !== undefined) {
      registration.verificationNotes = verificationNotes;
      if (registration.identityProof) {
        registration.identityProof.verificationNotes = verificationNotes;
      }
    }

    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration verification updated successfully',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tournament registrations for current user
// @route   GET /api/registrations/my-tournaments
// @access  Private
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await TournamentRegistration.find({
      $or: [
        { 'players.user': req.user.id },
        { captain: req.user.id },
        { leader: req.user.id },
      ],
    })
      .populate('tournament', 'name slug game banner status registrationDeadline identityProofDeadline startDate')
      .populate('captain', 'name username avatar')
      .populate('leader', 'name username avatar')
      .populate('players.user', 'name username avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};
