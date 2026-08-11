const User = require('../models/User');

class UserService {
  sanitizeUser(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      status: user.status,
      role: user.role || 'user',
      isBlocked: user.isBlocked || false,
      theme: user.theme || 'dark',
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateUserProfile(userId, updates) {
    const allowedUpdates = ['username', 'bio', 'profileImage', 'status', 'theme'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  async searchUsers(query, currentUserId) {
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } }
      ]
    })
    .select('-password')
    .limit(20);

    return users.map(user => this.sanitizeUser(user));
  }

  async getFriends(userId) {
    const user = await User.findById(userId)
      .populate('friends', 'username profileImage status bio lastSeen');

    if (!user) {
      throw new Error('User not found');
    }

    return user.friends.map(friend => this.sanitizeUser(friend));
  }

  async sendFriendRequest(senderId, receiverId) {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    // Check if already friends
    if (sender.friends.includes(receiverId)) {
      throw new Error('Already friends');
    }

    // Check if request already sent
    if (sender.friendRequestsSent.includes(receiverId)) {
      throw new Error('Friend request already sent');
    }

    // Check if blocked
    if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
      throw new Error('Cannot send friend request - user blocked');
    }

    sender.friendRequestsSent.push(receiverId);
    receiver.friendRequestsReceived.push(senderId);

    await sender.save();
    await receiver.save();

    return { message: 'Friend request sent' };
  }

  async acceptFriendRequest(userId, requesterId) {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      throw new Error('User not found');
    }

    if (!user.friendRequestsReceived.includes(requesterId)) {
      throw new Error('No friend request from this user');
    }

    // Add to friends list
    user.friends.push(requesterId);
    requester.friends.push(userId);

    // Remove from requests
    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== requesterId);
    requester.friendRequestsSent = requester.friendRequestsSent.filter(id => id.toString() !== userId);

    await user.save();
    await requester.save();

    return { message: 'Friend request accepted' };
  }

  async rejectFriendRequest(userId, requesterId) {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      throw new Error('User not found');
    }

    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== requesterId);
    requester.friendRequestsSent = requester.friendRequestsSent.filter(id => id.toString() !== userId);

    await user.save();
    await requester.save();

    return { message: 'Friend request rejected' };
  }

  async removeFriend(userId, friendId) {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      throw new Error('User not found');
    }

    if (!user.friends.includes(friendId)) {
      throw new Error('Not friends with this user');
    }

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    return { message: 'Friend removed' };
  }

  async blockUser(userId, userIdToBlock) {
    if (userId === userIdToBlock) {
      throw new Error('Cannot block yourself');
    }

    const user = await User.findById(userId);
    const userToBlock = await User.findById(userIdToBlock);

    if (!user || !userToBlock) {
      throw new Error('User not found');
    }

    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
    }

    // Remove from friends if friends
    user.friends = user.friends.filter(id => id.toString() !== userIdToBlock);
    userToBlock.friends = userToBlock.friends.filter(id => id.toString() !== userId);

    await user.save();
    await userToBlock.save();

    return { message: 'User blocked' };
  }

  async unblockUser(userId, userIdToUnblock) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userIdToUnblock);
    await user.save();

    return { message: 'User unblocked' };
  }

  async getPendingRequests(userId) {
    const user = await User.findById(userId)
      .populate('friendRequestsReceived', 'username profileImage bio status');

    if (!user) {
      throw new Error('User not found');
    }

    return user.friendRequestsReceived.map(requester => this.sanitizeUser(requester));
  }

  async getSentRequests(userId) {
    const user = await User.findById(userId)
      .populate('friendRequestsSent', 'username profileImage bio status');

    if (!user) {
      throw new Error('User not found');
    }

    return user.friendRequestsSent.map(request => this.sanitizeUser(request));
  }

  async updateOnlineStatus(userId, status, isOnline) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = status;
    user.isOnline = isOnline;
    user.lastSeen = new Date();

    await user.save();

    return {
      userId,
      status,
      isOnline,
      lastSeen: user.lastSeen
    };
  }

  async getOnlineUsers(userId) {
    const users = await User.find({
      _id: { $ne: userId },
      isOnline: true
    })
    .select('-password')
    .limit(50);

    return users.map(user => this.sanitizeUser(user));
  }
}

module.exports = new UserService();
