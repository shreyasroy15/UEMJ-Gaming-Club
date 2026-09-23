const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    college: {
      type: String,
      default: 'University of Engineering & Management (UEM)',
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'player', 'captain', 'moderator', 'admin', 'super_admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'rejected', 'deleted'],
      default: 'active',
    },
    game: {
      type: String,
      default: 'BGMI',
    },
    gameId: {
      type: String,
      default: '',
      trim: true,
    },
    teamName: {
      type: String,
      default: '',
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    bio: {
      type: String,
      default: 'Casual gamer & esports enthusiast.',
      maxlength: 300,
    },
    games: [
      {
        type: String,
      },
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    clubXP: {
      type: Number,
      default: 100,
    },
    level: {
      type: Number,
      default: 1,
    },
    achievements: [
      {
        title: String,
        badge: String,
        awardedAt: { type: Date, default: Date.now },
        description: String,
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
      type: Date,
    },
    currentSessionId: {
      type: String,
      default: null,
      index: true,
    },
    lastLoginDevice: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
