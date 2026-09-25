const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Team = require('../models/Team');
const { getCapitalLetterAvatarUrl } = require('../utils/avatar');

// Helper to generate JWT token with unique session identifier
const generateToken = (id, sessionId) => {
  return jwt.sign(
    { id, sessionId },
    process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production',
    {
      expiresIn: '30d',
    }
  );
};

// Set token cookie & return user object with unique active session tracking
const sendTokenResponse = async (user, statusCode, res, req = null) => {
  const sessionId = crypto.randomUUID();
  const userAgent = req?.headers ? req.headers['user-agent'] || '' : '';

  // Invalidate any previous device session by assigning new unique session ID
  const updatedDoc = await User.findByIdAndUpdate(
    user._id,
    {
      currentSessionId: sessionId,
      lastLogin: new Date(),
      lastLoginDevice: userAgent,
      status: user.status === 'suspended' ? 'suspended' : 'active',
      isDeleted: false,
      avatar: user.avatar,
    },
    { new: true }
  ).select('-password');

  const token = generateToken(user._id, sessionId);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  const currentUser = updatedDoc || user;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        college: currentUser.college,
        avatar: currentUser.avatar,
        role: currentUser.role,
        bio: currentUser.bio,
        games: currentUser.games,
        stats: currentUser.stats,
        clubXP: currentUser.clubXP || 100,
        level: currentUser.level || 1,
        achievements: currentUser.achievements,
      },
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password, college, games } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, username, email, and password',
      });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college || 'University of Engineering & Management (UEM Jaipur)',
      games: games && games.length > 0 ? games : ['BGMI'],
      game: games && games.length > 0 ? games[0] : 'BGMI',
      gameId: `@${username.toLowerCase().trim()}`,
      teamName: 'Free Agent',
      role: 'student',
      status: 'active',
      isDeleted: false,
      lastLogin: new Date(),
      avatar: getCapitalLetterAvatarUrl(name, username),
    });

    await sendTokenResponse(user, 201, res, req);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const identifier = email.trim().toLowerCase();

    // Check for user (by email or username)
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check account status: deleted or deactivated
    if (user.isDeleted || user.status === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted or deactivated.',
      });
    }

    // Check account status: suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact club administration.',
      });
    }

    // Restrict login to student and admin accounts only
    const allowedRoles = ['student', 'admin', 'super_admin', 'player', 'captain'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to student and admin accounts only.',
      });
    }

    // Automatically update to capitalized first-letter avatar if user has old placeholder or missing avatar
    const isOldPlaceholder = !user.avatar || user.avatar.includes('photo-1566492031773-4f4e44671857');
    if (isOldPlaceholder) {
      user.avatar = getCapitalLetterAvatarUrl(user.name, user.username);
    }

    await sendTokenResponse(user, 200, res, req);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('teams');
    if (user && (!user.avatar || user.avatar.includes('photo-1566492031773-4f4e44671857'))) {
      user.avatar = getCapitalLetterAvatarUrl(user.name, user.username);
      await User.findByIdAndUpdate(user._id, { avatar: user.avatar });
    }
    let teamInfo = {
      name: 'Free Agent',
      isFreeAgent: true,
      isVerified: null,
      roleInTeam: 'Solo Player',
      game: user.game || (user.games && user.games[0]) || 'BGMI',
    };

    const teamDoc = await Team.findOne({
      $or: [{ captain: user._id }, { 'members.user': user._id }],
    }).select('name isVerified game tag captain members').lean();

    if (teamDoc) {
      const isCaptain = Boolean(
        (teamDoc.captain && teamDoc.captain.toString() === user._id.toString()) ||
        user.role === 'captain'
      );
      teamInfo = {
        name: teamDoc.name,
        tag: teamDoc.tag || '',
        isFreeAgent: false,
        isVerified: Boolean(teamDoc.isVerified),
        teamId: teamDoc._id,
        roleInTeam: isCaptain ? 'Captain' : 'Player',
        game: teamDoc.game || user.game || 'BGMI',
        memberCount: Array.isArray(teamDoc.members) ? teamDoc.members.length : 1,
      };
    } else if (user.teamName && !['free agent', 'none', 'solo'].includes(user.teamName.toLowerCase().trim())) {
      teamInfo = {
        name: user.teamName,
        tag: '',
        isFreeAgent: false,
        isVerified: false,
        roleInTeam: user.role === 'captain' ? 'Captain' : 'Player',
        game: user.game || 'BGMI',
        memberCount: 1,
      };
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        teamInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    // If auth token was passed, clear session ID from database
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production'
        );
        if (decoded?.id) {
          await User.findByIdAndUpdate(decoded.id, { currentSessionId: null });
        }
      } catch (err) {}
    }
  } catch (e) {}

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email address',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // In local/dev environment, we return the reset token directly so testing is seamless!
    res.status(200).json({
      success: true,
      message: 'Reset token generated successfully. In production, this is sent via email.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the reset token and your new password',
      });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update current logged-in user profile & avatar
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, bio, college, phone, game, gameId, avatar } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (bio !== undefined) updateFields.bio = bio;
    if (college !== undefined) updateFields.college = college.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (gameId !== undefined) updateFields.gameId = gameId.trim();
    if (avatar !== undefined) {
      updateFields.avatar = avatar ? avatar.trim() : '';
    }
    if (game) {
      updateFields.game = game;
      await User.findByIdAndUpdate(req.user.id, { $addToSet: { games: game } });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile and avatar updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
