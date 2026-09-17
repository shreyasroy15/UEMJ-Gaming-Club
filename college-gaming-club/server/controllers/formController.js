const Tournament = require('../models/Tournament');
const TournamentForm = require('../models/TournamentForm');
const { getBgmiDefaultQuestions, getFreeFireDefaultQuestions } = require('../utils/defaultForms');

// @desc    Get form schema for a tournament (auto-initializes default if not present)
// @route   GET /api/tournaments/:id/form
// @access  Public
exports.getTournamentForm = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    let form = await TournamentForm.findOne({ tournament: tournament._id });

    if (!form) {
      // Auto-generate appropriate default form based on game
      const isBgmi = tournament.game.toLowerCase().includes('bgmi') || tournament.name.toLowerCase().includes('bgmi');
      const isFreeFire = tournament.game.toLowerCase().includes('free fire') || tournament.name.toLowerCase().includes('free fire');

      let defaultQuestions = [];
      if (isBgmi) {
        defaultQuestions = getBgmiDefaultQuestions();
      } else if (isFreeFire) {
        defaultQuestions = getFreeFireDefaultQuestions();
      } else {
        defaultQuestions = getBgmiDefaultQuestions(); // universal fallback template
      }

      form = await TournamentForm.create({
        tournament: tournament._id,
        title: `${tournament.name} - Registration Form`,
        description: `Official squad registration questionnaire for ${tournament.name}. Please complete all team and player fields accurately.`,
        isPublished: true,
        questions: defaultQuestions,
      });

      tournament.registrationForm = form._id;
      await tournament.save();
    }

    res.status(200).json({
      success: true,
      form,
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        game: tournament.game,
        banner: tournament.banner,
        minTeamSize: tournament.minTeamSize || 4,
        maxTeamSize: tournament.maxTeamSize || 5,
        allowSubstitutes: tournament.allowSubstitutes !== false,
        maxSubstitutes: tournament.maxSubstitutes || 1,
        registrationDeadline: tournament.registrationDeadline,
        status: tournament.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update tournament form schema
// @route   PUT /api/tournaments/:id/form
// @access  Private (Admin / Staff)
exports.saveTournamentForm = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    const { title, description, isPublished, questions, teamConfig } = req.body;

    if (!title || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide form title and an array of questions',
      });
    }

    // Validate each question has required keys
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.id || !q.label || !q.fieldType || !q.scope) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} is missing required fields (id, label, fieldType, or scope)`,
        });
      }
    }

    let form = await TournamentForm.findOne({ tournament: tournament._id });

    if (form) {
      form.title = title;
      if (description !== undefined) form.description = description;
      if (isPublished !== undefined) form.isPublished = isPublished;
      form.questions = questions;
      await form.save();
    } else {
      form = await TournamentForm.create({
        tournament: tournament._id,
        title,
        description: description || '',
        isPublished: isPublished !== false,
        questions,
      });

      tournament.registrationForm = form._id;
    }

    // Update tournament team sizing rules if provided
    if (teamConfig) {
      if (teamConfig.minTeamSize !== undefined) tournament.minTeamSize = Number(teamConfig.minTeamSize);
      if (teamConfig.maxTeamSize !== undefined) tournament.maxTeamSize = Number(teamConfig.maxTeamSize);
      if (teamConfig.allowSubstitutes !== undefined) tournament.allowSubstitutes = Boolean(teamConfig.allowSubstitutes);
      if (teamConfig.maxSubstitutes !== undefined) tournament.maxSubstitutes = Number(teamConfig.maxSubstitutes);
    }
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament form saved successfully',
      form,
      tournament: {
        _id: tournament._id,
        minTeamSize: tournament.minTeamSize,
        maxTeamSize: tournament.maxTeamSize,
        allowSubstitutes: tournament.allowSubstitutes,
        maxSubstitutes: tournament.maxSubstitutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset form questions to preset (BGMI or Free Fire)
// @route   POST /api/tournaments/:id/form/preset
// @access  Private (Admin / Staff)
exports.applyFormPreset = async (req, res, next) => {
  try {
    const { preset } = req.body; // 'bgmi' | 'free_fire'
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    let questions = [];
    if (preset === 'free_fire') {
      questions = getFreeFireDefaultQuestions();
    } else {
      questions = getBgmiDefaultQuestions();
    }

    let form = await TournamentForm.findOne({ tournament: tournament._id });

    if (form) {
      form.questions = questions;
      await form.save();
    } else {
      form = await TournamentForm.create({
        tournament: tournament._id,
        title: `${tournament.name} - Registration Form`,
        description: `Official registration form for ${tournament.name}`,
        isPublished: true,
        questions,
      });
      tournament.registrationForm = form._id;
      await tournament.save();
    }

    res.status(200).json({
      success: true,
      message: `Form reset to ${preset.toUpperCase()} preset successfully`,
      form,
    });
  } catch (error) {
    next(error);
  }
};
