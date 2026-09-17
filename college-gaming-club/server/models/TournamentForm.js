const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ['team', 'player'],
      required: true,
      default: 'player',
    },
    label: {
      type: String,
      required: [true, 'Question label is required'],
      trim: true,
    },
    helpText: {
      type: String,
      default: '',
      trim: true,
    },
    fieldType: {
      type: String,
      enum: [
        'short_text',
        'long_text',
        'number',
        'email',
        'phone',
        'multiple_choice',
        'dropdown',
        'checkbox',
        'image_upload',
        'file_upload',
      ],
      required: [true, 'Field type is required'],
    },
    required: {
      type: Boolean,
      default: true,
    },
    options: {
      type: [String],
      default: [],
    },
    placeholder: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const tournamentFormSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TournamentForm', tournamentFormSchema);
