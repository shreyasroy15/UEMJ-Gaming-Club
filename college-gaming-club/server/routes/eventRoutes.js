const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  registerForEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { staffOnly, adminOnly } = require('../middleware/adminMiddleware');

router
  .route('/')
  .get(getEvents)
  .post(protect, staffOnly, createEvent);

router
  .route('/:id')
  .get(getEventById)
  .put(protect, staffOnly, updateEvent)
  .delete(protect, adminOnly, deleteEvent);

router.post('/:id/register', protect, registerForEvent);

module.exports = router;
