const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { searchUserByUsername } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.route('/').get(getUsers);
router.get('/search/:username', protect, searchUserByUsername);
router
  .route('/:id')
  .get(getUserById)
  .put(protect, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
