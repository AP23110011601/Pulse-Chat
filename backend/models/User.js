const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },


  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },


  password: {
    type: String,
    required: true,
    minlength: 6,
  },


  profileImage: {
    type: String,
    default: "",
  },


  bio: {
    type: String,
    default: "Learning Full Stack Development",
    maxlength: 200,
  },


  // Online status

  status: {
    type: String,
    enum:[
      "online",
      "offline",
      "away",
      "busy"
    ],
    default:"offline",
  },


  isOnline:{
    type:Boolean,
    default:false,
  },


  lastSeen:{
    type:Date,
    default:Date.now,
  },


  // ROLE

  role:{
    type:String,
    enum:[
      "user",
      "admin"
    ],
    default:"user",
  },


  // ADMIN BLOCK

  isBlocked:{
    type:Boolean,
    default:false,
  },


  // THEME

  theme:{
    type:String,
    enum:[
      "dark",
      "light"
    ],
    default:"dark",
  },


  /*
    FRIEND SYSTEM

    Only accepted users are stored here.

    Example:

    User A friends:
    [
      User B
    ]

    User B friends:
    [
      User A
    ]

  */

  friends:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
    }
  ],



  /*
     BLOCK SYSTEM

     User can block another user
     Blocked users cannot message
  */

  blockedUsers:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
    }
  ],



  /*
      Request tracking

      Before accepting:

      A sends request to B

      A:
      friendRequestsSent:[B]


      B:
      friendRequestsReceived:[A]

  */


  friendRequestsSent:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
    }
  ],



  friendRequestsReceived:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
    }
  ],



},

{
 timestamps:{
   createdAt:true,
   updatedAt:true,
 }
}

);


// Faster search


module.exports = mongoose.model(
 "User",
 userSchema
);