const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validators
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio must be less than 200 characters'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  validate
];

// User validators
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio must be less than 200 characters'),
  body('status')
    .optional()
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Invalid status'),
  body('theme')
    .optional()
    .isIn(['dark', 'light'])
    .withMessage('Invalid theme'),
  validate
];

// Message validators
const sendMessageValidation = [
  body('receiverId')
    .optional()
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid group ID'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message must be less than 5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'audio', 'document'])
    .withMessage('Invalid message type'),
  validate
];

// Group validators
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  validate
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  validate
];

// Friend request validators
const friendRequestValidation = [
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  updateProfileValidation,
  sendMessageValidation,
  createGroupValidation,
  updateGroupValidation,
  friendRequestValidation
};
