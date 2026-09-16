const Game = require('../models/Game');
const Tournament = require('../models/Tournament');

// Helper to slugify
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');

// @desc    Get all games
// @route   GET /api/games
// @access  Public
exports.getGames = async (req, res, next) => {
  try {
    const games = await Game.find({ active: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: games.length,
      games,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single game by ID or slug
// @route   GET /api/games/:id
// @access  Public
exports.getGameById = async (req, res, next) => {
  try {
    let game;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      game = await Game.findById(req.params.id);
    } else {
      game = await Game.findOne({ slug: req.params.id });
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    const tournaments = await Tournament.find({ game: game.name }).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      game,
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create game
// @route   POST /api/games
// @access  Private (Admin)
exports.createGame = async (req, res, next) => {
  try {
    const { name, genre, platform, logo, banner, description, teamSize } = req.body;

    if (!name || !genre || !logo || !banner || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields for the game',
      });
    }

    const slug = slugify(name);
    const game = await Game.create({
      name,
      slug,
      genre,
      platform: platform || 'PC / Mobile',
      logo,
      banner,
      description,
      teamSize: teamSize || 5,
    });

    res.status(201).json({
      success: true,
      game,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private (Admin)
exports.updateGame = async (req, res, next) => {
  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      game,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Private (Admin)
exports.deleteGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    await game.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
