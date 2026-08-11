const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("../middleware/auth");
const userService = require("../services/userService");
const { updateProfileValidation, friendRequestValidation } = require("../middleware/validator");

const router = express.Router();


// =========================
// IMAGE UPLOAD CONFIG
// =========================

const uploadsDir = path.join(__dirname, "..", "uploads");


if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({

destination:(req,file,cb)=>{
    cb(null,uploadsDir);
},

filename:(req,file,cb)=>{

    const unique =
    `${Date.now()}-${Math.round(Math.random()*1000000000)}`;

    cb(
      null,
      unique + path.extname(file.originalname)
    );

}

});


const upload = multer({

storage,

limits:{
 fileSize:5*1024*1024
},

fileFilter:(req,file,cb)=>{

if(file.mimetype.startsWith("image/")){
 cb(null,true);
}
else{
 cb(new Error("Only images allowed"));
}

}

});



// GET FRIENDS OF AUTHENTICATED USER
router.get("/friends", auth, async (req, res) => {
  try {
    const friends = await userService.getFriends(req.user.id);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Existing GET /api/users SEARCH
router.get("/", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const users = await userService.searchUsers(q, req.user.id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET USER'S FRIENDS
router.get("/friends", auth, async (req, res) => {
  try {
    const friends = await userService.getFriends(req.user.id);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// =========================
// GET USER PROFILE
// =========================


router.get("/:id", auth, async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});




// =========================
// SEND FRIEND REQUEST
// =========================


router.post("/request/:id", auth, async (req, res) => {
  try {
    const result = await userService.sendFriendRequest(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// =========================
// ACCEPT REQUEST
// =========================


router.post("/accept/:id", auth, async (req, res) => {
  try {
    const result = await userService.acceptFriendRequest(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// =========================
// REJECT REQUEST
// =========================


router.post("/reject/:id", auth, async (req, res) => {
  try {
    const result = await userService.rejectFriendRequest(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// =========================
// REMOVE FRIEND
// =========================


router.delete("/friend/:id", auth, async (req, res) => {
  try {
    const result = await userService.removeFriend(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET PENDING FRIEND REQUESTS
router.get("/requests/pending", auth, async (req, res) => {
  try {
    const requests = await userService.getPendingRequests(req.user.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SENT FRIEND REQUESTS
router.get("/requests/sent", auth, async (req, res) => {
  try {
    const requests = await userService.getSentRequests(req.user.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






// =========================
// UPDATE PROFILE
// =========================


router.put("/profile", auth, updateProfileValidation, async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});








// =========================
// UPLOAD PROFILE IMAGE
// =========================


router.post("/profile-image", auth, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await userService.updateUserProfile(req.user.id, { profileImage: imageUrl });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports=router;