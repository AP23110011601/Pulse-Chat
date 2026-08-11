const express = require("express");
const auth = require("../middleware/auth");
const authService = require("../services/authService");
const { registerValidation, loginValidation, forgotPasswordValidation } = require("../middleware/validator");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// REGISTER
// POST /api/auth/register
router.post("/register", authLimiter, registerValidation, async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.log("Register Error:", error);
    return res.status(400).json({ error: error.message });
  }
});

// LOGIN
// POST /api/auth/login
router.post("/login", authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.log("Login Error:", error);
    const statusCode = error.message.includes('blocked') ? 403 : 401;
    res.status(statusCode).json({ error: error.message });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", forgotPasswordValidation, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// GET CURRENT USER
router.get("/me", auth, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// LOGOUT
router.post("/logout", auth, async (req, res) => {
  try {
    const result = await authService.logout(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CURRENT USER
router.get("/me", auth, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (error) {
    const statusCode = error.message.includes('blocked') ? 403 : 404;
    res.status(statusCode).json({ error: error.message });
  }
});

module.exports = router;