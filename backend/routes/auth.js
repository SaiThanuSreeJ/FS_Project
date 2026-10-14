const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register route with express-validator
router.post(
  '/register',
  [
    check('name', 'Name is required and must be between 2 and 50 characters')
      .trim()
      .isLength({ min: 2, max: 50 }),
    check('email', 'Please provide a valid email address')
      .isEmail()
      .normalizeEmail(),
    check('password', 'Password must be at least 6 characters').isLength({
      min: 6,
    }),
  ],
  register
);

// Login route with express-validator
router.post(
  '/login',
  [
    check('email', 'Please provide a valid email address').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login
);

// Protected routes
router.get('/me', protect, getMe);
router.put(
  '/profile',
  protect,
  [
    check('name', 'Name must be at least 2 characters')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }),
  ],
  updateProfile
);

module.exports = router;
