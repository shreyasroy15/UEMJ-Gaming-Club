const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
exports.getTeams = async (req, res, next) => {
  try {
    const { game, search, sort } = req.query;
    let query = {};

    if (game && game !== 'all') {
      query.game = game;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tag: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { points: -1, wins: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const teams = await Team.find(query)
      .populate('captain', 'name username avatar college')
      .populate('members.user', 'name username avatar college')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Public
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'name username avatar college email')
      .populate('members.user', 'name username avatar college email stats');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res, next) => {
  try {
    const { name, tag, game, logo, description, inGameName } = req.body;

    if (!name || !game) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team name and game',
      });
    }

    // Check duplicate team name
    const existing = await Team.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists',
      });
    }

    const team = await Team.create({
      name,
      tag: tag || name.substring(0, 4).toUpperCase(),
      game,
      logo: logo || undefined,
      description,
      captain: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'captain',
          inGameName: inGameName || req.user.username,
        },
      ],
    });

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { teams: team._id },
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('captain', 'name username avatar')
      .populate('members.user', 'name username avatar');

    res.status(201).json({
      success: true,
      team: populatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);

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
        message: 'Only the team captain or an admin can update this team',
      });
    }

    const { name, tag, logo, description, game, wins, losses, points } = req.body;
    if (name) team.name = name;
    if (tag) team.tag = tag;
    if (logo) team.logo = logo;
    if (description) team.description = description;
    if (game) team.game = game;

    // Admin can update stats directly
    if (req.user.role === 'admin') {
      if (wins !== undefined) team.wins = wins;
      if (losses !== undefined) team.losses = losses;
      if (points !== undefined) team.points = points;
      team.matchesPlayed = (team.wins || 0) + (team.losses || 0);
    }

    await team.save();

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

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
        message: 'Only the team captain or an admin can delete this team',
      });
    }

    // Remove team reference from all members
    const memberIds = team.members.map((m) => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { teams: team._id } }
    );

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to team (by username or email)
// @route   POST /api/teams/:id/members
// @access  Private
exports.addMember = async (req, res, next) => {
  try {
    const { usernameOrEmail, inGameName, role } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.captain.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the team captain or an admin can add members',
      });
    }

    const player = await User.findOne({
      $or: [
        { username: usernameOrEmail.toLowerCase().trim() },
        { email: usernameOrEmail.toLowerCase().trim() },
      ],
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found with that username or email',
      });
    }

    // Check if already in team
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === player._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'This player is already a member of this team',
      });
    }

    team.members.push({
      user: player._id,
      role: role || 'starter',
      inGameName: inGameName || player.username,
    });

    await team.save();

    await User.findByIdAndUpdate(player._id, {
      $addToSet: { teams: team._id },
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('captain', 'name username avatar')
      .populate('members.user', 'name username avatar college');

    res.status(200).json({
      success: true,
      message: `${player.name} added to ${team.name}`,
      team: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.captain.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the captain or admin can remove members',
      });
    }

    if (team.captain.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the captain. Transfer captaincy first or delete the team.',
      });
    }

    team.members = team.members.filter((m) => m.user.toString() !== userId);
    await team.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { teams: team._id },
    });

    res.status(200).json({
      success: true,
      message: 'Member removed from team',
      team,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
exports.leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.captain.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Captain cannot leave team. Transfer captaincy first.',
      });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== req.user.id
    );
    await team.save();

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { teams: team._id },
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the team',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer captaincy
// @route   PUT /api/teams/:id/transfer-captain
// @access  Private
exports.transferCaptain = async (req, res, next) => {
  try {
    const { newCaptainId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (team.captain.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the current captain or an admin can transfer captaincy',
      });
    }

    const isMember = team.members.some(
      (m) => m.user.toString() === newCaptainId
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'New captain must be a member of the team',
      });
    }

    team.captain = newCaptainId;
    team.members.forEach((m) => {
      if (m.user.toString() === newCaptainId) m.role = 'captain';
      else if (m.user.toString() === req.user.id) m.role = 'starter';
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Captaincy transferred successfully',
      team,
    });
  } catch (error) {
    next(error);
  }
};
