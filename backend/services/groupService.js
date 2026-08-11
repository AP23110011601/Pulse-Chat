const Group = require('../models/Group');
const User = require('../models/User');

class GroupService {
  async createGroup(creatorId, { name, description, groupImage, memberIds = [] }) {
    if (!name) {
      throw new Error('Group name is required');
    }

    if (name.length < 3) {
      throw new Error('Group name must be at least 3 characters');
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      throw new Error('User not found');
    }

    const friendIds = (creator.friends || []).map((id) => id.toString());
    const validMembers = [creatorId];

    for (const id of memberIds) {
      if (String(id) !== String(creatorId)) {
        if (!friendIds.includes(String(id))) {
          throw new Error('You can only add users who have accepted your friend request.');
        }
        validMembers.push(id);
      }
    }

    const group = await Group.create({
      name,
      description: description || '',
      groupImage: groupImage || '',
      admin: creatorId,
      members: validMembers,
    });

    return await this.getGroupById(group._id);
  }

  async getGroupById(groupId) {
    const group = await Group.findById(groupId)
      .populate('admin', 'username profileImage')
      .populate('members', 'username profileImage status');

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }

  async getUserGroups(userId) {
   const groups = await Group.find({ members: userId })
      .populate('admin', 'username profileImage')
      .populate('members', 'username profileImage status')
      .sort({ updatedAt: -1 });

    return groups;
  }

  async updateGroup(groupId, userId, updates) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() !== userId) {
      throw new Error('Only admin can update group');
    }

    const allowedUpdates = ['name', 'description', 'groupImage'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    Object.assign(group, filteredUpdates);
    await group.save();

    return await this.getGroupById(groupId);
  }

  async addMember(groupId, adminId, newMemberId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() !== adminId) {
      throw new Error('Only admin can add members');
    }

    if (group.members.includes(newMemberId)) {
      throw new Error('User is already a member');
    }

    group.members.push(newMemberId);
    await group.save();

    return await this.getGroupById(groupId);
  }

  async removeMember(groupId, adminId, memberId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() !== adminId) {
      throw new Error('Only admin can remove members');
    }

    if (group.admin.toString() === memberId) {
      throw new Error('Cannot remove admin from group');
    }

    group.members = group.members.filter(id => id.toString() !== memberId);
    await group.save();

    return await this.getGroupById(groupId);
  }

  async leaveGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() === userId) {
      throw new Error('Admin cannot leave group. Transfer admin first or delete group');
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    return { message: 'Left group successfully' };
  }

  async deleteGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() !== userId) {
      throw new Error('Only admin can delete group');
    }

    await Group.findByIdAndDelete(groupId);

    return { message: 'Group deleted successfully' };
  }

  async transferAdmin(groupId, currentAdminId, newAdminId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.admin.toString() !== currentAdminId) {
      throw new Error('Only current admin can transfer admin rights');
    }

    if (!group.members.includes(newAdminId)) {
      throw new Error('New admin must be a group member');
    }

    group.admin = newAdminId;
    await group.save();

    return await this.getGroupById(groupId);
  }

  async searchGroups(query, userId) {
    const groups = await Group.find({
      name: { $regex: query, $options: 'i' },
      members: userId
    })
    .populate('admin', 'username profileImage')
    .populate('members', 'username profileImage status')
    .limit(20);

    return groups;
  }
}

module.exports = new GroupService();
