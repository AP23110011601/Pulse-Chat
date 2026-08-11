const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `chat-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// GET /api/messages/direct/:userId — 1:1 history
router.get("/direct/:userId", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const me = req.user.id;

    const messages = await Message.find({
      group: null,
      deletedForUsers: { $ne: me },
      $or: [
        { sender: me, receiver: otherId },
        { sender: otherId, receiver: me },
      ],
    })
      .populate("sender", "username profileImage")
      .populate("replyTo", "text sender type imageUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/group/:groupId — group history
router.get("/group/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: "Not a member of this group." });

    const messages = await Message.find({
      group: req.params.groupId,
      deletedForUsers: { $ne: req.user.id },
    })
      .populate("sender", "username profileImage")
      .populate("replyTo", "text sender type imageUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/conversations — DMs + unread counts
router.get("/conversations", auth, async (req, res) => {
  try {
    const me = req.user.id;

    const messages = await Message.find({
      group: null,
      deletedForUsers: { $ne: me },
      $or: [{ sender: me }, { receiver: me }],
    })
      .populate("sender", "username profileImage status lastSeen")
      .populate("receiver", "username profileImage status lastSeen")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const other = msg.sender._id.toString() === me ? msg.receiver : msg.sender;
      if (!other || seen.has(other._id.toString())) continue;
      seen.add(other._id.toString());

      const unreadCount = await Message.countDocuments({
        group: null,
        sender: other._id,
        receiver: me,
        status: { $ne: "read" },
      });

      conversations.push({
        user: {
          id: other._id,
          username: other.username,
          profileImage: other.profileImage,
          status: other.status,
          lastSeen: other.lastSeen,
        },
        lastMessage: {
          text: msg.isDeletedForEveryone ? "🚫 Message deleted" : msg.text,
          type: msg.type,
          createdAt: msg.createdAt,
          senderId: msg.sender._id,
          status: msg.status,
        },
        unreadCount,
      });
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/search?q=query
router.get("/search", auth, async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query.trim()) return res.json([]);

    const messages = await Message.find({
      text: { $regex: query, $options: "i" },
      deletedForUsers: { $ne: req.user.id },
      $or: [{ sender: req.user.id }, { receiver: req.user.id }, { group: { $ne: null } }],
    })
      .populate("sender", "username profileImage")
      .populate("receiver", "username")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/upload-image
router.post("/upload-image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded." });
    const imageUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname || req.file.filename;
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    res.json({ imageUrl, fileUrl: imageUrl, fileName, fileSize });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/upload-file (Audio / Documents / Files)
router.post("/upload-file", auth, upload.single("file"), async (req, res) => {
  try {
    console.log("/api/messages/upload-file headers:", req.headers['content-type']);
    console.log("/api/messages/upload-file req.file:", req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, filename: req.file.filename } : null);
    if (!req.file) {
      console.log("/api/messages/upload-file: multer did not parse file, req.body keys:", Object.keys(req.body));
      return res.status(400).json({ error: "No file uploaded." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname || req.file.filename;
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName || req.file.filename);
    const imageUrl = isImage ? fileUrl : "";

    console.log("/api/messages/upload-file: uploaded", { fileName, fileSize, fileUrl, imageUrl });
    res.json({ fileUrl, fileName, fileSize, imageUrl });
  } catch (error) {
    console.error("/api/messages/upload-file error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/:id/delete
router.post("/:id/delete", auth, async (req, res) => {
  try {
    const { mode } = req.body; // "me" or "everyone"
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (mode === "everyone") {
      if (message.sender.toString() !== req.user.id) {
        return res.status(403).json({ error: "You can only delete your own messages for everyone." });
      }
      message.isDeletedForEveryone = true;
      message.text = "🚫 This message was deleted";
      await message.save();
    } else {
      if (!message.deletedForUsers.includes(req.user.id)) {
        message.deletedForUsers.push(req.user.id);
        await message.save();
      }
    }

    res.json({ success: true, messageId: message._id, mode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/:id/react
router.post("/:id/react", auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Remove existing reaction by user if present
    message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user.id);
    if (emoji) {
      message.reactions.push({ user: req.user.id, emoji });
    }
    await message.save();

    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/direct/:userId/read
router.post("/direct/:userId/read", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const me = req.user.id;
    const now = new Date();

    const result = await Message.updateMany(
      {
        group: null,
        sender: otherId,
        receiver: me,
        status: { $ne: "read" },
      },
      { $set: { status: "read", readAt: now } }
    );

    res.json({ updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
