const express = require('express');
const router = express.Router();
const {
  getGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
} = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getGames)
  .post(protect, adminOnly, createGame);

router
  .route('/:id')
  .get(getGameById)
  .put(protect, adminOnly, updateGame)
  .delete(protect, adminOnly, deleteGame);

module.exports = router;
