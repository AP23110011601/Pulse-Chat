const rateLimit = require('express-rate-limit');

// General rate limiter for API endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for message sending
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many messages, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 uploads per hour
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many file uploads, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI features
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 AI requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many AI requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  aiLimiter
};
