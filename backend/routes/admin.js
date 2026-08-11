const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

const router = express.Router();

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== "admin" && user.email !== "admin@pulsechat.com")) {
      // Grant auto-admin if first user or email matches admin
      if (user && user.email === "admin@pulsechat.com") {
        user.role = "admin";
        await user.save();
      } else {
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/stats
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ status: "online" });
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Group.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    res.json({
      totalUsers,
      onlineUsers,
      totalMessages,
      totalGroups,
      blockedUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/toggle-block/:userId
router.post("/toggle-block/:userId", auth, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    targetUser.isBlocked = !targetUser.isBlocked;
    await targetUser.save();

    res.json({
      message: `User ${targetUser.username} is now ${targetUser.isBlocked ? "blocked" : "unblocked"}`,
      user: {
        id: targetUser._id,
        username: targetUser.username,
        isBlocked: targetUser.isBlocked,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/message/:messageId
router.delete("/message/:messageId", auth, requireAdmin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    await message.deleteOne();
    res.json({ message: "Message deleted by admin." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
