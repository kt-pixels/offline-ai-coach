const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.get('/me', protect, asyncHandler(getMe));
router.put('/profile', protect, asyncHandler(updateProfile));

module.exports = router;
