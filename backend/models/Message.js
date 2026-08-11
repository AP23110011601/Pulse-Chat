const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    // text | image | audio | document
    type: {
      type: String,
      enum: ["text", "image", "audio", "document"],
      default: "text",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: String,
      default: "",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedForUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    forwarded: {
      type: Boolean,
      default: false,
    },
    // sent → delivered → read
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.pre("validate", function () {
  if (this.type === "image") {
    if (!this.imageUrl) {
      throw new Error("imageUrl is required for image messages");
    }
    if (!this.text) this.text = "📷 Photo";
  } else if (this.type === "audio") {
    if (!this.text) this.text = "🎤 Voice message (0:15)";
  } else if (this.type === "document") {
    if (!this.text) this.text = `📄 ${this.fileName || "Document.pdf"}`;
  } else if (!this.text || !this.text.trim()) {
    throw new Error("text is required for text messages");
  }
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ group: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model("Message", messageSchema);
