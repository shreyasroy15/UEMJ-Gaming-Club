const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.route('/').get(getUsers);
router
  .route('/:id')
  .get(getUserById)
  .put(protect, updateUser)
  .delete(protect, adminOnly, deleteUser);

module.exports = router;
