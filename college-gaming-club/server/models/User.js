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
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
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
    stats: {
      matchesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      mvpCount: { type: Number, default: 0 },
    },
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
