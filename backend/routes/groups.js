const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Group = require("../models/Group");
const User = require("../models/User");
const auth = require("../middleware/auth");
const groupService = require("../services/groupService");
const { createGroupValidation, updateGroupValidation } = require("../middleware/validator");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `group-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
});

async function populateGroup(groupId) {
  return Group.findById(groupId)
    .populate("admin", "username profileImage status")
    .populate("members", "username profileImage status");
}

// GET /api/groups — groups current user belongs to
router.get("/", auth, async (req, res) => {
  try {
    const groups = await groupService.getUserGroups(req.user.id);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups — create group
router.post("/", auth, createGroupValidation, async (req, res) => {
  try {
    const { name, description, groupImage, memberIds } = req.body;
    const group = await groupService.createGroup(req.user.id, { name, description, groupImage, memberIds });
    
    // Track gamification
    const gamificationService = require('../services/gamificationService');
    await gamificationService.trackGroupCreated(req.user.id);
    
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/groups/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id);
    res.json(group);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// PUT /api/groups/:id — update name / image (admin only)
router.put("/:id", auth, updateGroupValidation, async (req, res) => {
  try {
    const group = await groupService.updateGroup(req.params.id, req.user.id, req.body);
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/groups/:id/image — upload group profile image (admin)
router.post(
  "/:id/image",
  auth,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);

      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      if (group.admin.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only admin can update group image." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded." });
      }

      group.profileImage = `/uploads/${req.file.filename}`;
      await group.save();

      res.json(await populateGroup(group._id));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/groups/:id/members — add members (admin)
router.post("/:id/members", auth, async (req, res) => {
  try {
    const { memberIds = [] } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only admin can add members." });
    }

    const adminUser = await User.findById(req.user.id);
    const friendIds = (adminUser?.friends || []).map((f) => f.toString());

    for (const id of memberIds) {
      if (!friendIds.includes(String(id))) {
        return res.status(400).json({
          error: "You can only add users who have accepted your friend request.",
        });
      }

      if (!group.members.some((m) => m.toString() === String(id))) {
        const userObj = await User.findById(id);
        if (userObj) group.members.push(id);
      }
    }

    await group.save();
    res.json(await populateGroup(group._id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/groups/:id/members/:userId — remove member (admin or self-leave)
router.delete("/:id/members/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    const targetId = req.params.userId;
    const isAdmin = group.admin.toString() === req.user.id;
    const isSelf = targetId === req.user.id;

    if (!isAdmin && !isSelf) {
      return res
        .status(403)
        .json({ error: "Only admin can remove other members." });
    }

    if (targetId === group.admin.toString() && group.members.length > 1) {
      return res
        .status(400)
        .json({ error: "Admin cannot leave while other members remain. Transfer admin first or remove members." });
    }

    group.members = group.members.filter((m) => m.toString() !== targetId);
    await group.save();

    res.json(await populateGroup(group._id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
