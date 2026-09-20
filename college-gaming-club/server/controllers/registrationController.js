const Tournament = require('../models/Tournament');
const TournamentForm = require('../models/TournamentForm');
const TournamentRegistration = require('../models/TournamentRegistration');
const TournamentInvitation = require('../models/TournamentInvitation');
const User = require('../models/User');
const { cloudinary, isConfigured: cloudinaryConfigured } = require('../config/cloudinary');
const { sendRegistrationVerificationNotification } = require('../utils/notificationHelper');

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

// Helper to extract Cloudinary publicId if not explicitly stored
const getCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return '';
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    console.error('Error parsing Cloudinary public ID:', e);
  }
  return '';
};

// Helper: check if a player's responses satisfy all required player-level questions (excluding team-level identity proof)
const validatePlayerResponses = (questions, responses = {}) => {
  const playerQuestions = (questions || []).filter(
    (q) =>
      q.scope === 'player' &&
      q.required &&
      q.id !== 'identity_proof' &&
      q.id !== 'student_id_proof' &&
      q.id !== 'team_identity_proof'
  );
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
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const tournament = await Tournament.findOne(query);

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

    const { teamName, teamType, teamTag, teamLogo, teamResponses } = req.body;

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
        message: 'Team name already taken.',
      });
    }

    const allowedTeamTypes = ['UEM Student Team', 'Outside Team', 'Mixed Team'];
    const resolvedTeamType = allowedTeamTypes.includes(teamType) ? teamType : 'UEM Student Team';
    const finalTeamResponses = {
      ...(teamResponses || {}),
      team_type: resolvedTeamType,
    };

    const teamCode = await generateUniqueCode(tournament.game);

    // Auto-prefill Leader Slot 1 with authenticated account profile data
    const leaderPrefill = getAccountPrefillData(req.user);

    // Create registration with Captain / Leader in slot 1
    const registration = await TournamentRegistration.create({
      tournament: tournament._id,
      teamName: teamName.trim(),
      teamType: resolvedTeamType,
      teamTag: (teamTag || teamName.substring(0, 4)).toUpperCase().trim(),
      teamLogo: teamLogo || undefined,
      teamCode,
      captain: req.user.id,
      leader: req.user.id,
      teamResponses: finalTeamResponses,
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

    // Synchronize tournament registeredTeams with TournamentRegistration
    await Tournament.findByIdAndUpdate(tournament._id, {
      $addToSet: {
        registeredTeams: {
          team: registration._id,
          registeredAt: new Date(),
        },
      },
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
    if (error.code === 11000 && error.keyPattern && error.keyPattern.teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name already taken.',
      });
    }
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
      (p) => (p.user?._id || p.user).toString() === req.user.id.toString()
    );

    if (isAlreadyInTeam) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this team',
        registrationId: registration._id,
        tournamentId: tournament._id,
        tournamentSlug: tournament.slug || tournament._id,
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
      responses: playerPrefill instanceof Map ? playerPrefill : new Map(Object.entries(playerPrefill)),
      joinedAt: new Date(),
    });
    registration.markModified('players');

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
      tournamentId: tournament._id,
      tournamentSlug: tournament.slug || tournament._id,
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
      (p) => p.user && (p.user._id ? p.user._id.toString() : p.user.toString()) === req.user.id
    );

    // Enforce authorization: user must belong to this team or be an admin
    if (!currentSlot && !isLeader && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this team workspace',
      });
    }

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
      (p) => (p.user?._id || p.user).toString() === req.user.id.toString()
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
    registration.players[playerIndex].responses = responses instanceof Map ? responses : new Map(Object.entries(responses));
    registration.players[playerIndex].status = 'completed';
    registration.players[playerIndex].completedAt = new Date();
    registration.markModified('players');

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

    const { url: bodyUrl, publicId: bodyPublicId, resourceType: bodyResourceType, fileName: bodyFileName, fileSize: bodyFileSize } = req.body || {};

    let url = '';
    let publicId = '';
    let resourceType = 'raw';
    let fileName = 'Combined_Team_Identity_Proof.pdf';
    let fileSize = 0;

    // Case 1: Direct multipart file upload
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Only PDF documents (.pdf) are allowed. Images and other file types are rejected.',
        });
      }

      const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
      if (ext !== 'pdf') {
        return res.status(400).json({
          success: false,
          message: 'Only .pdf files are accepted.',
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'PDF must be 5 MB or smaller.',
        });
      }

      fileName = req.file.originalname || 'Combined_Team_Identity_Proof.pdf';
      fileSize = req.file.size;

      if (cloudinaryConfigured) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'uemj/private/identity-proofs',
                resource_type: 'auto',
              },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });

          url = uploadResult.secure_url;
          publicId = uploadResult.public_id;
          resourceType = uploadResult.resource_type || 'raw';
        } catch (uploadErr) {
          console.error('Cloudinary upload error:', uploadErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload PDF to secure storage. Please try again.',
          });
        }
      } else {
        url = `data:application/pdf;base64,${req.file.buffer.toString('base64')}`;
        publicId = `dev-upload-${Date.now()}`;
        resourceType = 'raw';
      }
    } else if (bodyUrl && bodyUrl.trim()) {
      // Case 2: JSON payload fallback
      url = bodyUrl.trim();
      publicId = bodyPublicId || '';
      resourceType = bodyResourceType || 'raw';
      fileName = bodyFileName || 'Combined_Team_Identity_Proof.pdf';
      fileSize = Number(bodyFileSize) || 0;

      if (fileSize > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'PDF must be 5 MB or smaller.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a PDF file to upload (maximum 5 MB)',
      });
    }

    // Save old Cloudinary publicId for cleanup after successful save
    const oldPublicId = registration.identityProof?.publicId || getCloudinaryPublicId(registration.identityProof?.url);
    const oldResourceType = registration.identityProof?.resourceType || 'raw';

    // Update team identity proof
    registration.identityProof = {
      url,
      publicId,
      resourceType,
      fileName,
      fileSize,
      submittedAt: new Date(),
      status: 'submitted',
      verificationNotes: '',
    };

    if (!registration.teamResponses) {
      registration.teamResponses = new Map();
    }
    if (registration.teamResponses instanceof Map) {
      registration.teamResponses.set('team_identity_proof', url);
    } else {
      registration.teamResponses.team_identity_proof = url;
    }

    registration.markModified('identityProof');
    registration.markModified('teamResponses');
    await registration.save();

    // Re-evaluate team completion
    await evaluateTeamCompletion(registration, tournament);

    // Delete old Cloudinary asset AFTER successful save (replace flow)
    if (oldPublicId && oldPublicId !== publicId && cloudinaryConfigured && !oldPublicId.startsWith('dev-upload-')) {
      try {
        const types = [oldResourceType, oldResourceType === 'raw' ? 'image' : 'raw'];
        for (const t of types) {
          const destroyRes = await cloudinary.uploader.destroy(oldPublicId, { resource_type: t });
          if (destroyRes?.result === 'ok') break;
        }
      } catch (cleanupErr) {
        console.error('Failed to delete old Cloudinary identity proof asset:', cleanupErr.message);
        // Non-fatal: new upload succeeded, log and continue
      }
    }

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

// @desc    Delete / Remove Team-Level Combined Identity Proof PDF
// @route   DELETE /api/registrations/:id/team-identity-proof
// @access  Private (Team members / Captain)
exports.deleteTeamIdentityProof = async (req, res, next) => {
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
        message: 'Only registered members of this team can remove the team identity proof',
      });
    }

    // Check identity proof submission deadline
    const deadline = tournament.identityProofDeadline || tournament.registrationDeadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Identity proof submission deadline has passed. Removal is no longer allowed.',
      });
    }

    // Check that there is actually something to delete
    if (!registration.identityProof?.url) {
      return res.status(400).json({
        success: false,
        message: 'No identity proof document to remove.',
      });
    }

    const publicIdToDelete = registration.identityProof.publicId || getCloudinaryPublicId(registration.identityProof.url);
    const resourceType = registration.identityProof.resourceType || 'raw';

    // Delete from Cloudinary first
    if (publicIdToDelete && cloudinaryConfigured && !publicIdToDelete.startsWith('dev-upload-')) {
      try {
        let destroyed = false;
        const types = [resourceType, resourceType === 'raw' ? 'image' : 'raw'];
        for (const t of types) {
          const destroyRes = await cloudinary.uploader.destroy(publicIdToDelete, { resource_type: t });
          if (destroyRes?.result === 'ok') {
            destroyed = true;
            break;
          }
        }
      } catch (cloudErr) {
        console.error('Cloudinary deletion failed:', cloudErr.message);
        return res.status(500).json({
          success: false,
          message: 'Unable to remove identity proof. Please try again.',
        });
      }
    }

    // Clear identity proof from registration
    registration.identityProof = {
      url: '',
      publicId: '',
      resourceType: 'raw',
      fileName: '',
      fileSize: 0,
      submittedAt: undefined,
      status: 'pending',
      verificationNotes: '',
    };

    // Clear from teamResponses
    if (registration.teamResponses) {
      if (registration.teamResponses instanceof Map) {
        registration.teamResponses.delete('team_identity_proof');
        registration.teamResponses.delete('identity_proof');
      } else {
        delete registration.teamResponses.team_identity_proof;
        delete registration.teamResponses.identity_proof;
      }
    }

    registration.markModified('identityProof');
    registration.markModified('teamResponses');
    await registration.save();

    // Re-evaluate team completion (may drop back to incomplete)
    await evaluateTeamCompletion(registration, tournament);

    const populated = await TournamentRegistration.findById(registration._id)
      .populate('captain', 'name username avatar email')
      .populate('leader', 'name username avatar email')
      .populate('players.user', 'name username avatar email');

    res.status(200).json({
      success: true,
      message: 'Team identity proof removed successfully.',
      registration: populated,
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

    const leaderId = (registration.leader?._id || registration.leader || registration.captain?._id || registration.captain)?.toString();
    const captainId = (registration.captain?._id || registration.captain)?.toString();
    const currentUserId = req.user.id.toString();
    const isLeader = (leaderId === currentUserId) || (captainId === currentUserId);
    const isAdmin = req.user.role === 'admin';

    if (!isLeader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader or an admin can remove team members',
      });
    }

    if (leaderId === userId.toString() || captainId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader from roster. Transfer leadership first.',
      });
    }

    registration.players = registration.players.filter(
      (p) => (p.user?._id || p.user).toString() !== userId.toString()
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
      message: 'Member removed from squad successfully',
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
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const tournament = await Tournament.findOne(query);

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
      status: { $ne: 'rejected' }, // show all active teams publicly
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
        teamType: reg.teamType || 'UEM Student Team',
        points: reg.points || 0,
        matchesPlayed: reg.matchesPlayed || 0,
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
    const tQuery = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const tournament = await Tournament.findOne(tQuery);

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
    const { status, identityProofStatus } = req.body;
    const verificationNotes =
      req.body.verificationNotes !== undefined
        ? req.body.verificationNotes
        : req.body.reason !== undefined
        ? req.body.reason
        : undefined;

    const registration = await TournamentRegistration.findById(req.params.id)
      .populate('tournament', 'name slug game')
      .populate('captain', 'name username')
      .populate('leader', 'name username');

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
      if (status === 'verified') {
        registration.isVerified = true;
        registration.verifiedAt = new Date();
      } else if (status === 'rejected') {
        registration.isVerified = false;
        if (!registration.identityProof) {
          registration.identityProof = {};
        }
        registration.identityProof.status = 'rejected';
      }
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
      if (identityProofStatus === 'verified') {
        registration.status = 'verified';
        registration.isVerified = true;
        registration.verifiedAt = new Date();
      } else if (identityProofStatus === 'rejected') {
        registration.status = 'rejected';
        registration.isVerified = false;
      }
    }

    if (verificationNotes !== undefined) {
      registration.verificationNotes = verificationNotes;
      if (!registration.identityProof) {
        registration.identityProof = {};
      }
      registration.identityProof.verificationNotes = verificationNotes;
    }

    await registration.save();

    // Determine notification trigger
    const effectiveStatus =
      status === 'rejected' || identityProofStatus === 'rejected'
        ? 'rejected'
        : status === 'verified' || identityProofStatus === 'verified'
        ? 'verified'
        : null;

    if (effectiveStatus) {
      if (effectiveStatus === 'rejected') {
        const tourneyId = registration.tournament?._id || registration.tournament;
        if (tourneyId) {
          await Tournament.updateOne(
            { _id: tourneyId },
            {
              $pull: {
                'stages.$[].lobbies.$[].teams': registration._id,
                'stages.$[].qualifiedTeams': registration._id,
                'stages.$[].advancedTeams': registration._id,
              },
            }
          ).catch((err) => console.error('Error removing rejected team from tournament lobbies:', err));

          const Match = require('../models/Match');
          await Match.updateMany(
            { tournament: tourneyId, status: 'scheduled' },
            { $pull: { teams: registration._id } }
          ).catch((err) => console.error('Error removing rejected team from scheduled matches:', err));
        }
      }

      sendRegistrationVerificationNotification({
        registration,
        tournament: registration.tournament,
        status: effectiveStatus,
        reason: verificationNotes || registration.verificationNotes || req.body.reason || '',
      }).catch((e) => console.error('Verification notification error:', e));
    }

    res.status(200).json({
      success: true,
      message: `Registration ${effectiveStatus === 'rejected' ? 'rejected' : 'verified'} successfully`,
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

// @desc    Deregister user from a tournament (or leave/delete team if leader)
// @route   POST /api/tournaments/:id/deregister
// @access  Private
exports.deregisterFromTournament = async (req, res, next) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const tournamentDoc = await Tournament.findOne(query);

    if (!tournamentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const tournamentId = tournamentDoc._id;
    const userId = req.user.id;

    // Find registration where user is captain, leader, or player
    const registration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      $or: [
        { captain: userId },
        { leader: userId },
        { 'players.user': userId },
      ],
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered in any team for this tournament',
      });
    }

    const currentLeaderId = (registration.leader || registration.captain).toString();
    const isLeader = currentLeaderId === userId.toString();
    const remainingPlayers = registration.players.filter((p) => p.user.toString() !== userId.toString());

    if (isLeader) {
      if (remainingPlayers.length === 0) {
        // Team has no other members -> automatically delete the team
        await TournamentRegistration.findByIdAndDelete(registration._id);
        // Clean up all invitations for this team completely
        await TournamentInvitation.deleteMany({ registration: registration._id });

        // Also clean up tournament registeredTeams if present
        await Tournament.findByIdAndUpdate(tournamentId, {
          $pull: { registeredTeams: { team: registration._id } },
        });

        return res.status(200).json({
          success: true,
          message: 'You have deregistered from the tournament. Your team has been disbanded.',
          action: 'disbanded',
        });
      } else {
        // Team has other members -> transfer leadership to next available player (slot 2 or first remaining)
        const nextLeader = remainingPlayers[0];
        nextLeader.role = 'captain';
        registration.captain = nextLeader.user;
        registration.leader = nextLeader.user;
        registration.players = remainingPlayers;

        // Re-index remaining players
        registration.players.forEach((p, idx) => {
          p.slotNumber = idx + 1;
        });

        const tournament = await Tournament.findById(tournamentId);
        await evaluateTeamCompletion(registration, tournament);

        return res.status(200).json({
          success: true,
          message: 'You have deregistered from the tournament. Team leadership has been transferred to your teammate.',
          action: 'left',
          newLeader: nextLeader.user,
        });
      }
    } else {
      // Normal member leaving
      registration.players = remainingPlayers;
      registration.players.forEach((p, idx) => {
        p.slotNumber = idx + 1;
      });

      const tournament = await Tournament.findById(tournamentId);
      await evaluateTeamCompletion(registration, tournament);

      return res.status(200).json({
        success: true,
        message: 'You have deregistered from the tournament team.',
        action: 'left',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Search user by exact username
// @route   GET /api/users/search/:username
// @access  Private
exports.searchUserByUsername = async (req, res, next) => {
  try {
    const rawUsername = (req.params.username || '').trim().toLowerCase();
    if (!rawUsername) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a username to search',
      });
    }

    const targetUser = await User.findOne({ username: rawUsername })
      .select('name username avatar college');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        avatar: targetUser.avatar,
        college: targetUser.college,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Team leader sends tournament invite to an existing user by username
// @route   POST /api/registrations/:id/invitations
// @access  Private (Team Leader)
exports.sendTournamentInvitation = async (req, res, next) => {
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

    // Check leader permission
    const currentLeaderId = (registration.leader || registration.captain).toString();
    if (currentLeaderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader can invite players',
      });
    }

    // Check capacity
    const maxCapacity = tournament.maxTeamSize || 5;
    if (registration.players.length >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Your team is already full (${registration.players.length}/${maxCapacity} players)`,
      });
    }

    // Check deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Tournament registration deadline has passed',
      });
    }

    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a username to invite',
      });
    }

    const targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself to your own team',
      });
    }

    // Check if target user is already in this team
    const alreadyInTeam = registration.players.some(
      (p) => p.user.toString() === targetUser._id.toString()
    );
    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: `@${targetUser.username} is already a member of this team roster`,
      });
    }

    // Check if target user is already registered in another team for this tournament
    const alreadyRegistered = await TournamentRegistration.findOne({
      tournament: tournament._id,
      $or: [
        { captain: targetUser._id },
        { leader: targetUser._id },
        { 'players.user': targetUser._id },
      ],
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: `@${targetUser.username} is already participating in another team ("${alreadyRegistered.teamName}") for this tournament.`,
      });
    }

    // Check active pending invitations (Prevent duplicate active invitations)
    const activeInvitation = await TournamentInvitation.findOne({
      registration: registration._id,
      recipient: targetUser._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (activeInvitation) {
      return res.status(400).json({
        success: false,
        message: `An active invitation has already been sent to @${targetUser.username}.`,
      });
    }

    // Create new invitation
    const invitation = await TournamentInvitation.create({
      tournament: tournament._id,
      registration: registration._id,
      sender: req.user.id,
      recipient: targetUser._id,
      status: 'pending',
    });

    const populated = await TournamentInvitation.findById(invitation._id)
      .populate('recipient', 'name username avatar college')
      .populate('sender', 'name username avatar');

    res.status(201).json({
      success: true,
      message: `Tournament invitation sent to @${targetUser.username}!`,
      invitation: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's incoming tournament invitations
// @route   GET /api/registrations/invitations/my
// @access  Private
exports.getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await TournamentInvitation.find({
      recipient: req.user.id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('tournament', 'name slug game banner status registrationDeadline')
      .populate({
        path: 'registration',
        select: 'teamName teamTag teamCode captain leader players',
        populate: [
          { path: 'leader', select: 'name username avatar' },
          { path: 'captain', select: 'name username avatar' },
        ],
      })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept tournament invitation
// @route   POST /api/registrations/invitations/:id/accept
// @access  Private
exports.acceptInvitation = async (req, res, next) => {
  try {
    const invitation = await TournamentInvitation.findById(req.params.id)
      .populate('tournament')
      .populate('registration');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (invitation.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this invitation',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`,
      });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired',
      });
    }

    const registration = await TournamentRegistration.findById(invitation.registration._id);
    if (!registration) {
      invitation.status = 'cancelled';
      await invitation.save();
      return res.status(404).json({
        success: false,
        message: 'The team for this invitation no longer exists',
      });
    }

    const tournament = await Tournament.findById(invitation.tournament._id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Check registration deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this tournament',
      });
    }

    // Check if player is already in this team
    const isAlreadyInTeam = registration.players.some(
      (p) => (p.user?._id || p.user).toString() === req.user.id.toString()
    );

    if (isAlreadyInTeam) {
      invitation.status = 'accepted';
      await invitation.save();
      return res.status(200).json({
        success: true,
        message: `You are already part of ${registration.teamName}! Complete your player information now.`,
        registrationId: registration._id,
        tournamentId: tournament._id,
        tournamentSlug: tournament.slug || tournament._id,
      });
    }

    // Verify user is not already registered in another team for this tournament
    const alreadyRegistered = await TournamentRegistration.findOne({
      tournament: tournament._id,
      _id: { $ne: registration._id },
      $or: [
        { captain: req.user.id },
        { leader: req.user.id },
        { 'players.user': req.user.id },
      ],
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: `You are already registered in team "${alreadyRegistered.teamName}" for this tournament. Each participant can only join one team per tournament.`,
      });
    }

    // Check team capacity
    const maxCapacity = tournament.maxTeamSize || 5;
    if (registration.players.length >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Team "${registration.teamName}" is already full`,
      });
    }

    // Add player to team
    const minStarters = tournament.minTeamSize || 4;
    const currentStarters = registration.players.filter((p) => p.role === 'starter' || p.role === 'captain').length;
    const role = currentStarters < minStarters ? 'starter' : 'substitute';
    const nextSlot = registration.players.length + 1;
    const playerPrefill = getAccountPrefillData(req.user);

    registration.players.push({
      user: req.user.id,
      role,
      slotNumber: nextSlot,
      status: 'joined', // not complete until required player fields are filled
      responses: playerPrefill instanceof Map ? playerPrefill : new Map(Object.entries(playerPrefill)),
      joinedAt: new Date(),
    });
    registration.markModified('players');

    await evaluateTeamCompletion(registration, tournament);

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    // Cancel any other invitations for this user in the same tournament
    await TournamentInvitation.updateMany(
      {
        tournament: tournament._id,
        recipient: req.user.id,
        _id: { $ne: invitation._id },
        status: 'pending',
      },
      { status: 'cancelled' }
    );

    res.status(200).json({
      success: true,
      message: `You have joined ${registration.teamName}! Complete your player information now.`,
      registrationId: registration._id,
      tournamentId: tournament._id,
      tournamentSlug: tournament.slug || tournament._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline tournament invitation
// @route   POST /api/registrations/invitations/:id/decline
// @access  Private
exports.declineInvitation = async (req, res, next) => {
  try {
    const invitation = await TournamentInvitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (invitation.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this invitation',
      });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation declined.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getIdentityProofSecureUrl = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id);
    if (!registration || !registration.identityProof?.url) {
      return res.status(404).json({ success: false, message: 'Identity proof not found' });
    }

    // Check authorization: must be member or admin
    const isAdmin = req.user.role === 'admin';
    const currentUserId = req.user.id.toString();
    const isMember = registration.players.some((p) => (p.user?._id || p.user)?.toString() === currentUserId);
    const isCaptain = (registration.captain?._id || registration.captain)?.toString() === currentUserId;
    const isLeader = (registration.leader?._id || registration.leader)?.toString() === currentUserId;

    if (!isMember && !isAdmin && !isCaptain && !isLeader) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const publicId = registration.identityProof.publicId || getCloudinaryPublicId(registration.identityProof.url);

    // Generate secure signed API download URL to bypass Cloudinary CDN PDF ACL restriction
    let signedUrl = registration.identityProof.url;
    if (cloudinaryConfigured && publicId && !publicId.startsWith('dev-upload-')) {
      try {
        signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: registration.identityProof.resourceType || 'image',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        });
      } catch (signErr) {
        console.warn('Could not generate private_download_url:', signErr.message);
        signedUrl = registration.identityProof.url;
      }
    }

    res.status(200).json({
      success: true,
      url: signedUrl,
      fileName: registration.identityProof.fileName || 'Combined_Team_Identity_Proof.pdf',
      fileSize: registration.identityProof.fileSize || 0,
      streamUrl: `/api/registrations/${registration._id}/identity-proof-file`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream Identity Proof PDF file directly to browser (handles iframes & avoids CDN ACL)
// @route   GET /api/registrations/:id/identity-proof-file
// @access  Private (Team members / Captain / Admin)
exports.streamIdentityProofFile = async (req, res, next) => {
  try {
    const registration = await TournamentRegistration.findById(req.params.id);
    if (!registration || !registration.identityProof?.url) {
      return res.status(404).json({ success: false, message: 'Identity proof not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const currentUserId = req.user.id.toString();
    const isMember = registration.players.some((p) => (p.user?._id || p.user)?.toString() === currentUserId);
    const isCaptain = (registration.captain?._id || registration.captain)?.toString() === currentUserId;
    const isLeader = (registration.leader?._id || registration.leader)?.toString() === currentUserId;

    if (!isMember && !isAdmin && !isCaptain && !isLeader) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const publicId = registration.identityProof.publicId || getCloudinaryPublicId(registration.identityProof.url);

    // If development in-memory data URI
    if (registration.identityProof.url.startsWith('data:application/pdf;base64,')) {
      const base64Data = registration.identityProof.url.split(';base64,').pop();
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${registration.identityProof.fileName || 'Combined_Team_Identity_Proof.pdf'}"`);
      return res.send(pdfBuffer);
    }

    // Generate signed download URL
    let downloadUrl = registration.identityProof.url;
    if (cloudinaryConfigured && publicId && !publicId.startsWith('dev-upload-')) {
      try {
        downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: registration.identityProof.resourceType || 'image',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 7200,
        });
      } catch (e) {
        console.warn('Error signing download url for stream:', e.message);
      }
    }

    const fetchRes = await fetch(downloadUrl);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({
        success: false,
        message: 'Unable to stream identity proof document',
      });
    }

    const fileName = registration.identityProof.fileName || 'Combined_Team_Identity_Proof.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    const arrayBuffer = await fetchRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    next(error);
  }
};

