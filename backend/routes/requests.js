const express = require("express");
const router = express.Router();

const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const auth = require("../middleware/auth");
const userService = require("../services/userService");



// ===============================
// SEND FRIEND REQUEST
// ===============================

router.post("/send", auth, async(req,res)=>{

try{

const {receiverId}=req.body;


if(!receiverId){
 return res.status(400).json({
  error:"Receiver id required"
 });
}


if(receiverId === req.user.id){

 return res.status(400).json({
  error:"Cannot send request to yourself"
 });

}



const sender = await User.findById(req.user.id);

const receiver = await User.findById(receiverId);


if(!receiver){

 return res.status(404).json({
  error:"User not found"
 });

}



// CHECK BLOCK

if(
 sender.blockedUsers.includes(receiverId) ||
 receiver.blockedUsers.includes(req.user.id)
){

 return res.status(403).json({
  error:"User blocked"
 });

}



// ALREADY FRIENDS

if(
 sender.friends.includes(receiverId)
){

 return res.status(400).json({
  error:"Already friends"
 });

}




// EXISTING REQUEST

const exists =
await FriendRequest.findOne({

sender:req.user.id,
receiver:receiverId,
status:"pending"

});


if(exists){

return res.status(400).json({

error:"Request already sent"

});

}




const request =
await FriendRequest.create({

sender:req.user.id,
receiver:receiverId,
status:"pending"

});



// STORE REQUEST TRACKING

await User.findByIdAndUpdate(
req.user.id,
{
$addToSet:{
friendRequestsSent:receiverId
}
}
);



await User.findByIdAndUpdate(
receiverId,
{
$addToSet:{
friendRequestsReceived:req.user.id
}
}
);



res.json(request);



}catch(error){

res.status(500).json({
error:error.message
});

}


});






// ===============================
// ACCEPT REQUEST
// ===============================


router.post("/accept/:id",auth,async(req,res)=>{

try{


const request =
await FriendRequest.findById(req.params.id);



if(!request){

return res.status(404).json({
error:"Request not found"
});

}




// ONLY RECEIVER CAN ACCEPT

if(
request.receiver.toString()
!== req.user.id
){

return res.status(403).json({

error:"Not allowed"

});

}



request.status="accepted";

await request.save();





// ADD BOTH USERS

await User.findByIdAndUpdate(

request.sender,

{

$addToSet:{
friends:req.user.id
},

$pull:{
friendRequestsSent:req.user.id
}

}

);



await User.findByIdAndUpdate(

req.user.id,

{

$addToSet:{
friends:request.sender
},

$pull:{
friendRequestsReceived:request.sender
}

}

);



res.json({

message:"Friend added successfully"

});



}catch(error){

res.status(500).json({

error:error.message

});

}


});








// ===============================
// REJECT REQUEST
// ===============================


router.post("/reject/:id",auth,async(req,res)=>{

try{


const request =
await FriendRequest.findById(req.params.id);



if(!request){

return res.status(404).json({

error:"Request not found"

});

}



if(
request.receiver.toString()
!==req.user.id
){

return res.status(403).json({

error:"Not allowed"

});

}



request.status="rejected";

await request.save();



// REMOVE TRACKING


await User.findByIdAndUpdate(
request.sender,
{
$pull:{
friendRequestsSent:req.user.id
}
}
);



await User.findByIdAndUpdate(
req.user.id,
{
$pull:{
friendRequestsReceived:request.sender
}
}
);



res.json({

message:"Request rejected"

});



}catch(error){

res.status(500).json({

error:error.message

});

}


});







// ===============================
// GET RECEIVED REQUESTS
// ===============================


router.get("/received",auth,async(req,res)=>{

try{


const requests =
await FriendRequest.find({

receiver:req.user.id,
status:"pending"

})
.populate(
"sender",
"username profileImage status"
);



res.json(requests);



}catch(error){

res.status(500).json({

error:error.message

});

}

});







// ===============================
// GET SENT REQUESTS
// ===============================


router.get("/sent",auth,async(req,res)=>{


try{


const requests =
await FriendRequest.find({

sender:req.user.id,
status:"pending"

})
.populate(
"receiver",
"username profileImage status"
);



res.json(requests);



}catch(error){

res.status(500).json({

error:error.message

});

}


});



module.exports = router;