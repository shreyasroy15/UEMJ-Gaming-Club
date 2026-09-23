const crypto = require('crypto');
const User = require('../models/User');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const { isSuperAdmin } = require('../middleware/adminMiddleware');
const { getCapitalLetterAvatarUrl } = require('../utils/avatar');

// Helper to normalize roles for display/queries
const normalizeRole = (role) => {
  if (role === 'student') return 'player';
  return role || 'player';
};

// Helper to resolve detailed team info and verification status (CURRENT TEAM ONLY)
const resolveTeamInfo = async (u, captainIds = []) => {
  const rawTeam = (u.teamName || '').trim();
  const isFreeAgent =
    !rawTeam ||
    rawTeam.toLowerCase() === 'free agent' ||
    rawTeam.toLowerCase() === 'none' ||
    rawTeam.toLowerCase() === 'solo';

  // 1. Check if user is an active member or captain in an existing Team
  let teamDoc = await Team.findOne({
    $or: [
      { captain: u._id },
      { 'members.user': u._id },
    ],
  })
    .select('name isVerified game members tag captain')
    .lean();

  if (teamDoc) {
    const isCaptain = Boolean(
      (teamDoc.captain && teamDoc.captain.toString() === u._id.toString()) ||
      u.role === 'captain' ||
      captainIds.includes(u._id.toString())
    );
    return {
      name: teamDoc.name,
      tag: teamDoc.tag || '',
      isFreeAgent: false,
      isVerified: Boolean(teamDoc.isVerified),
      teamId: teamDoc._id,
      teamType: 'team',
      roleInTeam: isCaptain ? 'Captain' : 'Player',
      game: teamDoc.game || u.game || (u.games && u.games[0]) || 'BGMI',
      memberCount: Array.isArray(teamDoc.members) ? teamDoc.members.length : 1,
    };
  }

  // 2. If user has a current team name assigned to their profile (and not free agent)
  if (!isFreeAgent) {
    const teamRegex = new RegExp(`^${rawTeam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const namedTeam = await Team.findOne({ name: teamRegex })
      .select('name isVerified game members tag captain')
      .lean();

    if (namedTeam) {
      const isCaptain = Boolean(
        (namedTeam.captain && namedTeam.captain.toString() === u._id.toString()) ||
        u.role === 'captain' ||
        captainIds.includes(u._id.toString())
      );
      return {
        name: namedTeam.name,
        tag: namedTeam.tag || '',
        isFreeAgent: false,
        isVerified: Boolean(namedTeam.isVerified),
        teamId: namedTeam._id,
        teamType: 'team',
        roleInTeam: isCaptain ? 'Captain' : 'Player',
        game: namedTeam.game || u.game || (u.games && u.games[0]) || 'BGMI',
        memberCount: Array.isArray(namedTeam.members) ? namedTeam.members.length : 1,
      };
    }

    const sameTeamUsers = await User.countDocuments({
      teamName: teamRegex,
      isDeleted: false,
    });

    return {
      name: rawTeam,
      tag: '',
      isFreeAgent: false,
      isVerified: false,
      teamId: null,
      teamType: 'custom',
      roleInTeam: u.role === 'captain' ? 'Captain' : 'Player',
      game: u.game || (u.games && u.games[0]) || 'BGMI',
      memberCount: sameTeamUsers || 1,
    };
  }

  // 3. User has no active team: ALWAYS Free Agent
  return {
    name: 'Free Agent',
    isFreeAgent: true,
    isVerified: null,
    teamId: null,
    teamType: null,
    roleInTeam: 'Solo Player',
    game: u.game || (u.games && u.games[0]) || 'BGMI',
    memberCount: 0,
    tag: '',
  };
};

// @desc    Get all users with server-side pagination & filtering
// @route   GET /api/users
// @access  Private (Staff / Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      game = '',
      team = '',
      tab = 'all',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Base query: exclude soft-deleted users
    let query = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      status: { $ne: 'deleted' },
    };

    // Retrieve captain IDs from active teams
    const teamCaptains = await Team.distinct('captain');
    const captainIds = [...new Set(teamCaptains.map((id) => id && id.toString()))].filter(Boolean);

    // Tab-based pre-filtering
    if (tab === 'players') {
      query.role = { $in: ['player', 'student'] };
    } else if (tab === 'captains') {
      query.$or = [{ _id: { $in: captainIds } }, { role: 'captain' }];
    } else if (tab === 'admins') {
      query.role = { $in: ['admin', 'super_admin'] };
    } else if (tab === 'pending') {
      query.status = 'pending';
    } else if (tab === 'suspended') {
      query.status = 'suspended';
    }

    // Role filter override
    if (role && role !== 'all') {
      const lowerRole = role.toLowerCase();
      if (lowerRole === 'player') {
        query.role = { $in: ['player', 'student'] };
      } else if (lowerRole === 'captain') {
        query.$or = [{ _id: { $in: captainIds } }, { role: 'captain' }];
      } else if (lowerRole === 'admin') {
        query.role = { $in: ['admin', 'super_admin'] };
      } else {
        query.role = lowerRole;
      }
    }

    // Status filter override
    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    // Game filter
    if (game && game !== 'all') {
      const gameRegex = new RegExp(`^${game}$`, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ game: gameRegex }, { games: gameRegex }],
      });
    }

    // Team filter
    if (team && team !== 'all') {
      query.teamName = { $regex: team, $options: 'i' };
    }

    // Debounced text search
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
          { gameId: searchRegex },
          { college: searchRegex },
          { teamName: searchRegex },
        ],
      });
    }

    const totalCount = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Enrich users with live team verification status if available
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const teamInfo = await resolveTeamInfo(u, captainIds);

        const isCaptain = Boolean(
          u.role === 'captain' ||
          teamInfo.roleInTeam === 'Captain' ||
          captainIds.includes(u._id.toString())
        );
        const displayRole = ['admin', 'super_admin'].includes(u.role)
          ? 'admin'
          : isCaptain
          ? 'captain'
          : 'player';

        return {
          ...u,
          role: displayRole,
          rawRole: u.role,
          status: u.status || 'active',
          game: u.game || (u.games && u.games[0]) || 'BGMI',
          gameId: u.gameId || `@${u.username}`,
          teamInfo,
        };
      })
    );

    // Get list of distinct team names for filter dropdown and team assignment
    const [userTeams, clubTeams] = await Promise.all([
      User.distinct('teamName', { teamName: { $nin: ['', null, 'Free Agent', 'free agent', 'Solo'] }, isDeleted: false }),
      Team.distinct('name'),
    ]);
    const distinctTeams = [...new Set([...userTeams, ...clubTeams].filter(Boolean))].sort();

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      teamsList: distinctTeams.filter(Boolean),
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get real-time aggregate statistics for 6 top cards
// @route   GET /api/users/stats/overview
// @access  Private (Staff / Admin)
exports.getUserStatsOverview = async (req, res, next) => {
  try {
    const baseFilter = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      status: { $ne: 'deleted' },
    };

    // Retrieve captain IDs from active teams
    const teamCaptains = await Team.distinct('captain');
    const captainIds = [...new Set(teamCaptains.map((id) => id && id.toString()))].filter(Boolean);

    const [
      totalUsers,
      admins,
      pending,
      suspended,
    ] = await Promise.all([
      User.countDocuments(baseFilter),
      User.countDocuments({ ...baseFilter, role: { $in: ['admin', 'super_admin'] } }),
      User.countDocuments({ ...baseFilter, status: 'pending' }),
      User.countDocuments({ ...baseFilter, status: 'suspended' }),
    ]);

    const captains = await User.countDocuments({
      ...baseFilter,
      $or: [{ _id: { $in: captainIds } }, { role: 'captain' }],
    });

    const players = Math.max(0, totalUsers - admins);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        players,
        captains,
        admins,
        pending,
        suspended,
      },
      trends: {
        totalUsers: 'Active collegiate roster',
        players: 'Registered student gamers',
        captains: `${captains} team captains`,
        admins: 'Administrator accounts',
        pending: 'Requires verification',
        suspended: 'Restricted access',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user with complete profile, team & stats
// @route   GET /api/users/:id
// @access  Private (Staff / Admin)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user || user.status === 'deleted' || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found or has been deactivated',
      });
    }

    // Resolve team info with verification
    const teamInfo = await resolveTeamInfo(user);

    res.status(200).json({
      success: true,
      user: {
        ...user,
        role: normalizeRole(user.role),
        rawRole: user.role,
        status: user.status || 'active',
        game: user.game || (user.games && user.games[0]) || 'BGMI',
        gameId: user.gameId || `@${user.username}`,
        teamInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user with validation & duplicate checks
// @route   POST /api/users
// @access  Private (Admin / Super Admin)
exports.createUser = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      password,
      college,
      game,
      gameId,
      role = 'player',
      team = '',
      teamName = '',
      status = 'active',
    } = req.body;

    if (!name || !username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, Username, and Email are strictly required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Check duplicate username
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please pick another.',
      });
    }

    // Role privilege escalation check
    const targetRole = role.toLowerCase();
    if (['admin', 'super_admin'].includes(targetRole) && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can create Admin accounts.',
      });
    }

    const initialPassword = password || 'Welcome@UEMJ2026!';
    const userRole = targetRole === 'player' ? 'student' : targetRole;

    const newUser = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: initialPassword,
      college: college ? college.trim() : 'University of Engineering & Management (UEM)',
      game: game || 'BGMI',
      games: game ? [game] : ['BGMI'],
      gameId: gameId ? gameId.trim() : `@${cleanUsername}`,
      role: userRole,
      teamName: team || teamName || '',
      status: status.toLowerCase() || 'active',
      avatar: getCapitalLetterAvatarUrl(name, cleanUsername),
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        ...userObj,
        role: normalizeRole(userObj.role),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Field';
      return res.status(400).json({
        success: false,
        message: `Duplicate value detected: ${field} is already in use.`,
      });
    }
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id or PATCH /api/users/:id
// @access  Private (Admin / Super Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const userToEdit = await User.findById(req.params.id);
    if (!userToEdit) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const {
      name,
      username,
      email,
      college,
      bio,
      avatar,
      game,
      gameId,
      role,
      teamName,
      status,
    } = req.body;

    // Check duplicate username if changing
    if (username && username.toLowerCase().trim() !== userToEdit.username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim(), _id: { $ne: userToEdit._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username is already in use by another player.',
        });
      }
      userToEdit.username = username.toLowerCase().trim();
    }

    // Check duplicate email if changing
    if (email && email.toLowerCase().trim() !== userToEdit.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: userToEdit._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already associated with another account.',
        });
      }
      userToEdit.email = email.toLowerCase().trim();
    }

    if (name) userToEdit.name = name.trim();
    if (college) userToEdit.college = college.trim();
    if (bio !== undefined) userToEdit.bio = bio;
    if (avatar !== undefined) {
      if (!avatar || avatar.includes('photo-1566492031773-4f4e44671857')) {
        userToEdit.avatar = getCapitalLetterAvatarUrl(userToEdit.name, userToEdit.username);
      } else {
        userToEdit.avatar = avatar.trim();
      }
    } else if (name && (!userToEdit.avatar || userToEdit.avatar.includes('ui-avatars.com') || userToEdit.avatar.includes('photo-1566492031773-4f4e44671857'))) {
      userToEdit.avatar = getCapitalLetterAvatarUrl(userToEdit.name, userToEdit.username);
    }
    if (game) {
      userToEdit.game = game;
      if (!userToEdit.games.includes(game)) userToEdit.games.push(game);
    }
    if (gameId !== undefined) userToEdit.gameId = gameId.trim();
    if (teamName !== undefined) userToEdit.teamName = teamName.trim();
    if (status) userToEdit.status = status.toLowerCase();


    // Check role elevation permissions
    if (role && role !== userToEdit.role) {
      const normalizedTarget = role.toLowerCase();
      const isTargetAdmin = ['admin', 'super_admin'].includes(normalizedTarget);
      const isCurrentAdmin = ['admin', 'super_admin'].includes(userToEdit.role);

      if ((isTargetAdmin || isCurrentAdmin) && !isSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Only Super Administrators can assign or modify Administrator roles.',
        });
      }

      userToEdit.role = normalizedTarget === 'player' ? 'student' : normalizedTarget;
    }

    await userToEdit.save();

    const result = userToEdit.toObject();
    delete result.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...result,
        role: normalizeRole(result.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend user
// @route   POST /api/users/:id/suspend
// @access  Private (Admin)
exports.suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Do not allow suspending another admin unless caller is super admin
    if (['admin', 'super_admin'].includes(user.role) && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend an Administrator account without Super Admin clearance.',
      });
    }

    user.status = 'suspended';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been suspended`,
      status: 'suspended',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   POST /api/users/:id/activate
// @access  Private (Admin)
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been activated`,
      status: 'active',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user access / generate reset token
// @route   POST /api/users/:id/reset-access
// @access  Private (Admin)
exports.resetUserAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    res.status(200).json({
      success: true,
      message: `Access reset credentials generated for ${user.name}`,
      resetToken,
      expiresAt: user.resetPasswordExpire,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete user (preserves historical tournament match data)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (['admin', 'super_admin'].includes(user.role) && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Administrators can delete Admin accounts.',
      });
    }

    // Soft delete to protect matches and registrations
    user.isDeleted = true;
    user.status = 'deleted';
    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} removed successfully (historical records preserved)`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user real tournament & match statistics
// @route   GET /api/users/:id/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Stats tracking has been removed - return empty response for backward compatibility
    res.status(200).json({
      success: true,
      stats: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity history
// @route   GET /api/users/:id/activity
// @access  Private
exports.getUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const registrations = await TournamentRegistration.find({
      $or: [
        { captain: user._id },
        { leader: user._id },
        { 'players.user': user._id },
      ],
    })
      .populate('tournament', 'title game')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activityTimeline = [];

    // Account creation event
    activityTimeline.push({
      id: 'act_joined',
      type: 'account_created',
      title: 'Joined UEM Gaming Club',
      description: `Registered student esports account affiliated with ${user.college || 'UEM Jaipur'}`,
      timestamp: user.createdAt,
      icon: 'UserPlus',
      badgeColor: 'cyan',
    });

    // Tournament registration events
    registrations.forEach((reg, idx) => {
      activityTimeline.push({
        id: `act_reg_${reg._id}`,
        type: 'tournament_registration',
        title: `Enrolled in ${reg.tournament?.title || 'Championship Tournament'}`,
        description: `Squad ${reg.teamName} (${reg.isVerified ? 'Verified' : 'Pending Review'})`,
        timestamp: reg.createdAt,
        icon: 'Trophy',
        badgeColor: reg.isVerified ? 'green' : 'orange',
      });
    });

    // Profile update event
    if (user.updatedAt && user.updatedAt.getTime() !== user.createdAt.getTime()) {
      activityTimeline.push({
        id: 'act_update',
        type: 'profile_updated',
        title: 'Profile Updated',
        description: 'Updated competitive preferences, game credentials, and contact info',
        timestamp: user.updatedAt,
        icon: 'ShieldCheck',
        badgeColor: 'purple',
      });
    }

    // Sort descending by timestamp
    activityTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      activity: activityTimeline,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export filtered users to CSV
// @route   GET /api/users/export
// @access  Private (Admin)
exports.exportUsersCsv = async (req, res, next) => {
  try {
    const { search = '', role = '', status = '', game = '', team = '', tab = 'all' } = req.query;

    let query = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      status: { $ne: 'deleted' },
    };

    if (tab === 'players') query.role = { $in: ['player', 'student'] };
    else if (tab === 'captains') query.role = 'captain';
    else if (tab === 'admins') query.role = { $in: ['admin', 'super_admin'] };
    else if (tab === 'pending') query.status = 'pending';
    else if (tab === 'suspended') query.status = 'suspended';

    if (role && role !== 'all') {
      const lower = role.toLowerCase();
      query.role = lower === 'player' ? { $in: ['player', 'student'] } : lower;
    }
    if (status && status !== 'all') query.status = status.toLowerCase();
    if (game && game !== 'all') query.game = new RegExp(`^${game}$`, 'i');
    if (team && team !== 'all') query.teamName = { $regex: team, $options: 'i' };

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { username: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { gameId: { $regex: s, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

    const headers = ['ID', 'Name', 'Username', 'Email', 'College', 'Game', 'Game ID', 'Role', 'Status', 'Team', 'Joined Date'];
    const csvRows = [headers.join(',')];

    users.forEach((u) => {
      const row = [
        u._id,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.username || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.college || '').replace(/"/g, '""')}"`,
        `"${(u.game || 'BGMI').replace(/"/g, '""')}"`,
        `"${(u.gameId || `@${u.username}`).replace(/"/g, '""')}"`,
        `"${normalizeRole(u.role).toUpperCase()}"`,
        `"${(u.status || 'ACTIVE').toUpperCase()}"`,
        `"${(u.teamName || 'Free Agent').replace(/"/g, '""')}"`,
        `"${new Date(u.createdAt).toISOString().split('T')[0]}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="uem_gaming_club_users.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
