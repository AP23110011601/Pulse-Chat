const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const { Server } = require("socket.io");
require("dotenv").config({ override: true });



const Message = require("./models/Message");
const User = require("./models/User");
const Group = require("./models/Group");
const gamificationService = require("./services/gamificationService");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");
const aiRoutes = require("./routes/ai");
const adminRoutes = require("./routes/admin");
const requestRoutes =
require("./routes/requests");
const gamificationRoutes = require("./routes/gamification");

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use(
"/api/requests",
requestRoutes
);
app.use("/api/gamification", gamificationRoutes);

app.get("/", (_req, res) => {
  res.send("PulseChat Production API Server Running 🚀");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

async function populateMessage(id) {
  return Message.findById(id)
    .populate("sender", "username profileImage status")
    .populate("receiver", "username profileImage")
    .populate("replyTo", "text sender type imageUrl");
}


// SECURITY CHECK
async function canChat(senderId, receiverId) {

  const sender = await User.findById(senderId);

  if(!sender){
    return false;
  }


  // Check friendship

  const isFriend =
    sender.friends.some(
      id => id.toString() === receiverId.toString()
    );


  // Check block

  const blocked =
    sender.blockedUsers.some(
      id => id.toString() === receiverId.toString()
    );


  if(blocked){
    return false;
  }


  return isFriend;

}

io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log("User connected:", userId, socket.id);

  socket.join(`user:${userId}`);

  try {
    await User.findByIdAndUpdate(
userId,
{
status:"online",
isOnline:true,
lastSeen:new Date()
}
);
    socket.broadcast.emit("user_status", {
      userId,
      status: "online",
      lastSeen: new Date(),
    });

    // Mark undelivered inbox messages as delivered
    const pending = await Message.find({
      receiver: userId,
      group: null,
      status: "sent",
    });

    for (const msg of pending) {
      msg.status = "delivered";
      msg.deliveredAt = new Date();
      await msg.save();
      io.to(`user:${msg.sender}`).emit("message_status", {
        messageId: msg._id,
        status: "delivered",
        deliveredAt: msg.deliveredAt,
      });
    }

    const groups = await Group.find({ members: userId }).select("_id");
    groups.forEach((g) => socket.join(`group:${g._id}`));
  } catch (error) {
    console.log("Connection setup error:", error.message);
  }

  socket.on("join_group", (groupId) => {
    if (groupId) socket.join(`group:${groupId}`);
  });

  // Direct text, image, audio, document message (with optional replyTo)
  socket.on("send_direct_message", async (data, callback) => {
    try {
      const { receiverId, text, type = "text", imageUrl, fileUrl, fileName, fileSize, replyToId, forwarded } = data || {};

      if (!receiverId) {
        callback?.({ error: "receiverId is required" });
        return;
      }
      // FRIEND SECURITY CHECK

const allowed = await canChat(
 userId,
 receiverId
);


if(!allowed){

 callback?.({

  error:
  "Accept friend request before messaging"

 });

 return;

}
const receiver =
await User.findById(receiverId);


if(
 receiver.blockedUsers.includes(userId)
){

 callback?.({

 error:"You are blocked by this user"

 });

 return;

}

      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        text: text?.trim() || (type === "image" ? "📷 Photo" : ""),
        type,
        imageUrl: imageUrl || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileSize: fileSize || "",
        replyTo: replyToId || null,
        forwarded: !!forwarded,
        status: "sent",
      });

      const populated = await populateMessage(message._id);

      // Track gamification
      gamificationService.trackMessageSent(userId);
      gamificationService.trackMessageReceived(receiverId);
      if (type !== 'text') {
        gamificationService.trackFileShared(userId);
      }

      io.to(`user:${receiverId}`).emit("receive_direct_message", populated);
      io.to(`user:${userId}`).emit("receive_direct_message", populated);

      // If receiver is currently connected, mark delivered
      const receiverRoom = io.sockets.adapter.rooms.get(`user:${receiverId}`);
      if (receiverRoom && receiverRoom.size > 0) {
        message.status = "delivered";
        message.deliveredAt = new Date();
        await message.save();
        populated.status = "delivered";
        populated.deliveredAt = message.deliveredAt;
        io.to(`user:${userId}`).emit("message_status", {
          messageId: message._id,
          status: "delivered",
          deliveredAt: message.deliveredAt,
        });
      }

      callback?.({ success: true, message: populated });
    } catch (error) {
      console.log(error);
      callback?.({ error: error.message });
    }
  });

  // Group text, image, audio, document message
  socket.on("send_group_message", async (data, callback) => {
    try {
      const { groupId, text, type = "text", imageUrl, fileUrl, fileName, fileSize, replyToId, forwarded } = data || {};

      if (!groupId) {
        callback?.({ error: "groupId is required" });
        return;
      }

      const group = await Group.findById(groupId);
      if (!group) {
        callback?.({ error: "Group not found" });
        return;
      }

      const isMember = group.members.some((m) => m.toString() === userId);
      if (!isMember) {
        callback?.({ error: "Not a group member" });
        return;
      }

      const message = await Message.create({
        sender: userId,
        group: groupId,
        text: text?.trim() || (type === "image" ? "📷 Photo" : ""),
        type,
        imageUrl: imageUrl || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileSize: fileSize || "",
        replyTo: replyToId || null,
        forwarded: !!forwarded,
        status: "sent",
      });

      const populated = await populateMessage(message._id);
      
      // Track gamification
      gamificationService.trackMessageSent(userId);
      if (type !== 'text') {
        gamificationService.trackFileShared(userId);
      }

      io.to(`group:${groupId}`).emit("receive_group_message", populated);
      callback?.({ success: true, message: populated });
    } catch (error) {
      console.log(error);
      callback?.({ error: error.message });
    }
  });

  // Reaction on message
// Reaction on message
socket.on(
  "react_message",
  async ({ messageId, emoji, targetRoom }, callback) => {

    try {

      const message = await Message.findById(messageId);


      if (!message) {
        return callback?.({
          error: "Message not found"
        });
      }



      // SECURITY CHECK

      let allowed = false;


      // Direct message

      if (message.group === null) {

        allowed =
          message.sender.toString() === userId ||
          message.receiver.toString() === userId;

      }



      // Group message

      else {

        const group =
          await Group.findById(message.group);


        if(group){

          allowed =
          group.members.some(
            member =>
            member.toString() === userId
          );

        }

      }



      if(!allowed){

        return callback?.({

          error:
          "You are not allowed to react to this message"

        });

      }




      // Initialize reactions

      if(!message.reactions){

        message.reactions=[];

      }



      // Remove old reaction from same user

      message.reactions =
      message.reactions.filter(
        r =>
        r.user.toString() !== userId
      );




      // Add new reaction

      if(emoji){

        message.reactions.push({

          user:userId,

          emoji

        });

      }



      await message.save();

      // Track gamification
      gamificationService.trackReaction(userId);

      const payload = {

        messageId:message._id,

        reactions:message.reactions

      };




      // Send update

      if(targetRoom){

        io.to(targetRoom)
        .emit(
          "message_reacted",
          payload
        );

      }
      else{


        if(message.group){

          io.to(
            `group:${message.group}`
          )
          .emit(
            "message_reacted",
            payload
          );


        }
        else{


          io.to(
            `user:${message.sender}`
          )
          .emit(
            "message_reacted",
            payload
          );


          io.to(
            `user:${message.receiver}`
          )
          .emit(
            "message_reacted",
            payload
          );


        }

      }



      callback?.({

        success:true,

        reactions:
        message.reactions

      });



    } catch(error){


      console.log(
        "Reaction error:",
        error.message
      );


      callback?.({

        error:error.message

      });


    }

  }
);
  // Delete message
  socket.on("delete_message", async ({ messageId, mode, targetRoom }, callback) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return callback?.({ error: "Message not found" });

      if (mode === "everyone") {
        if (message.sender.toString() !== userId) {
          return callback?.({ error: "Unauthorized delete" });
        }
        message.isDeletedForEveryone = true;
        message.text = "🚫 This message was deleted";
        await message.save();

        if (targetRoom) {
          io.to(targetRoom).emit("message_deleted", { messageId, mode: "everyone" });
        }
      } else {
        if (!message.deletedForUsers.includes(userId)) {
          message.deletedForUsers.push(userId);
          await message.save();
        }
      }
      callback?.({ success: true });
    } catch (error) {
      callback?.({ error: error.message });
    }
  });

  // Mark direct messages from a user as read
  socket.on("mark_direct_read", async ({ senderId }, callback) => {
    try {
      if (!senderId) return;

      const now = new Date();
      const unread = await Message.find({
        group: null,
        sender: senderId,
        receiver: userId,
        status: { $ne: "read" },
      });

      const ids = [];
      for (const msg of unread) {
        msg.status = "read";
        msg.readAt = now;
        await msg.save();
        ids.push(msg._id);
        io.to(`user:${senderId}`).emit("message_status", {
          messageId: msg._id,
          status: "read",
          readAt: now,
        });
      }

      callback?.({ success: true, updated: ids.length });
    } catch (error) {
      callback?.({ error: error.message });
    }
  });

  socket.on("typing_direct", ({ receiverId, isTyping }) => {
    if (!receiverId) return;
    io.to(`user:${receiverId}`).emit("typing_direct", {
      userId,
      isTyping: !!isTyping,
    });
  });

  socket.on("typing_group", ({ groupId, isTyping, username }) => {
    if (!groupId) return;
    socket.to(`group:${groupId}`).emit("typing_group", {
      userId,
      groupId,
      username,
      isTyping: !!isTyping,
    });
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", userId);
    try {
      const lastSeen = new Date();
      await User.findByIdAndUpdate(
userId,
{
status:"offline",
isOnline:false,
lastSeen
}
);
      socket.broadcast.emit("user_status", {
        userId,
        status: "offline",
        lastSeen,
      });
    } catch (error) {
      console.log(error.message);
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI, { family: 4 })
  .then(() => {
    console.log("MongoDB connected successfully");
    // #region agent log
    fetch('http://127.0.0.1:7889/ingest/1500680a-d9e0-4248-82c6-c132eb092c8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b050cb'},body:JSON.stringify({sessionId:'b050cb',runId:'startup',hypothesisId:'B',location:'server.js:mongo',message:'mongo_connected',data:{ok:true},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
    // #region agent log
    fetch('http://127.0.0.1:7889/ingest/1500680a-d9e0-4248-82c6-c132eb092c8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b050cb'},body:JSON.stringify({sessionId:'b050cb',runId:'startup',hypothesisId:'B',location:'server.js:mongo',message:'mongo_failed',data:{error:error.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  });

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`PulseChat Server running on http://${HOST}:${PORT}`);
  // #region agent log
  fetch('http://127.0.0.1:7889/ingest/1500680a-d9e0-4248-82c6-c132eb092c8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b050cb'},body:JSON.stringify({sessionId:'b050cb',runId:'startup',hypothesisId:'A',location:'server.js:listen',message:'backend_started',data:{port:PORT,host:HOST,mongoUriSet:!!process.env.MONGO_URI},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
});
