const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');

class MessageService {
  async populateMessage(id) {
    return Message.findById(id)
      .populate('sender', 'username profileImage status')
      .populate('receiver', 'username profileImage')
      .populate('replyTo', 'text sender type imageUrl');
  }

  async sendDirectMessage(senderId, data) {
    const { receiverId, text, type = 'text', imageUrl, fileUrl, fileName, fileSize, replyToId, forwarded } = data;

    if (!receiverId) {
      throw new Error('receiverId is required');
    }

    // Security check - verify friendship
    const allowed = await this.canChat(senderId, receiverId);
    if (!allowed) {
      throw new Error('Accept friend request before messaging');
    }

    // Check if sender is blocked by receiver
    const receiver = await User.findById(receiverId);
    if (receiver.blockedUsers.includes(senderId)) {
      throw new Error('You are blocked by this user');
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: type === 'image' ? text?.trim() || '📷 Photo' : text?.trim() || '',
      type,
      imageUrl: type === 'image' ? imageUrl : '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || '',
      replyTo: replyToId || null,
      forwarded: !!forwarded,
      status: 'sent',
    });

    return await this.populateMessage(message._id);
  }

  async sendGroupMessage(senderId, data) {
    const { groupId, text, type = 'text', imageUrl, fileUrl, fileName, fileSize, replyToId, forwarded } = data;

    if (!groupId) {
      throw new Error('groupId is required');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const isMember = group.members.some((m) => m.toString() === senderId);
    if (!isMember) {
      throw new Error('Not a group member');
    }

    const message = await Message.create({
      sender: senderId,
      group: groupId,
      text: type === 'image' ? text?.trim() || '📷 Photo' : text?.trim() || '',
      type,
      imageUrl: type === 'image' ? imageUrl : '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || '',
      replyTo: replyToId || null,
      forwarded: !!forwarded,
      status: 'sent',
    });

    return await this.populateMessage(message._id);
  }

  async canChat(senderId, receiverId) {
    const sender = await User.findById(senderId);
    if (!sender) {
      return false;
    }

    const isFriend = sender.friends.some(id => id.toString() === receiverId.toString());
    const blocked = sender.blockedUsers.some(id => id.toString() === receiverId.toString());

    if (blocked) {
      return false;
    }

    return isFriend;
  }

  async getDirectMessages(userId, otherUserId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      group: null,
      isDeletedForEveryone: false,
      deletedForUsers: { $ne: userId }
    })
    .populate('sender', 'username profileImage status')
    .populate('receiver', 'username profileImage')
    .populate('replyTo', 'text sender type imageUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return messages.reverse();
  }

  async getGroupMessages(groupId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      group: groupId,
      isDeletedForEveryone: false
    })
    .populate('sender', 'username profileImage status')
    .populate('replyTo', 'text sender type imageUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return messages.reverse();
  }

  async markAsRead(senderId, receiverId) {
    const now = new Date();
    const unread = await Message.find({
      group: null,
      sender: senderId,
      receiver: receiverId,
      status: { $ne: 'read' },
    });

    const ids = [];
    for (const msg of unread) {
      msg.status = 'read';
      msg.readAt = now;
      await msg.save();
      ids.push(msg._id);
    }

    return { success: true, updated: ids.length, messageIds: ids };
  }

  async deleteMessage(messageId, userId, mode = 'me') {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (mode === 'everyone') {
      if (message.sender.toString() !== userId) {
        throw new Error('Unauthorized delete');
      }
      message.isDeletedForEveryone = true;
      message.text = '🚫 This message was deleted';
      await message.save();
      return { messageId, mode: 'everyone' };
    } else {
      if (!message.deletedForUsers.includes(userId)) {
        message.deletedForUsers.push(userId);
        await message.save();
      }
      return { success: true };
    }
  }

  async reactToMessage(messageId, userId, emoji) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Security check
    let allowed = false;
    if (message.group === null) {
      allowed = message.sender.toString() === userId || message.receiver.toString() === userId;
    } else {
      const group = await Group.findById(message.group);
      if (group) {
        allowed = group.members.some(member => member.toString() === userId);
      }
    }

    if (!allowed) {
      throw new Error('You are not allowed to react to this message');
    }

    // Initialize reactions
    if (!message.reactions) {
      message.reactions = [];
    }

    // Remove old reaction from same user
    message.reactions = message.reactions.filter(r => r.user.toString() !== userId);

    // Add new reaction
    if (emoji) {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    return {
      messageId: message._id,
      reactions: message.reactions
    };
  }

  async searchMessages(userId, query, type = 'all') {
    const searchQuery = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      text: { $regex: query, $options: 'i' },
      isDeletedForEveryone: false,
      deletedForUsers: { $ne: userId }
    };

    if (type !== 'all') {
      searchQuery.type = type;
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(50);

    return messages;
  }

  async getUnreadCount(userId) {
    const count = await Message.countDocuments({
      receiver: userId,
      status: { $ne: 'read' },
      group: null
    });

    return count;
  }
}

module.exports = new MessageService();
