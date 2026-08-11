const express = require('express');
const auth = require('../middleware/auth');
const gamificationService = require('../services/gamificationService');

const router = express.Router();

// GET /api/gamification/stats - Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await gamificationService.getUserStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/achievements - Get user achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    const achievements = await gamificationService.getAchievements(req.user.id);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await gamificationService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamification/discovery - Get discovery feed
router.get('/discovery', auth, async (req, res) => {
  try {
    const feed = await gamificationService.getDiscoveryFeed(req.user.id);
    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/gamification/track-feature - Track feature usage
router.post('/track-feature', auth, async (req, res) => {
  try {
    const { feature } = req.body;
    if (!feature) {
      return res.status(400).json({ error: 'Feature name is required' });
    }
    
    const stats = await gamificationService.trackFeatureUsed(req.user.id, feature);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
