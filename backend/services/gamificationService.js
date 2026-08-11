const Achievement = require('../models/Achievement');
const UserStats = require('../models/UserStats');
const User = require('../models/User');

class GamificationService {
  async getUserStats(userId) {
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      stats = await UserStats.create({
        userId,
        level: 1,
        xp: 0,
        xpToNextLevel: 100
      });
    }
    
    return stats;
  }

  async getAchievements(userId) {
    const achievements = await Achievement.find({ userId })
      .sort({ unlockedAt: -1, createdAt: -1 });
    
    return achievements;
  }

  async trackMessageSent(userId) {
    const stats = await this.getUserStats(userId);
    stats.totalMessagesSent += 1;
    
    // Track hour
    const hour = new Date().getHours();
    stats.messagesByHour.set(hour.toString(), (stats.messagesByHour.get(hour.toString()) || 0) + 1);
    
    await stats.updateStreak();
    await stats.addXP(1); // 1 XP per message
    
    // Check achievements
    await this.checkFirstMessageAchievement(userId, stats);
    await this.checkStreakAchievements(userId, stats);
    
    return stats;
  }

  async trackMessageReceived(userId) {
    const stats = await this.getUserStats(userId);
    stats.totalMessagesReceived += 1;
    await stats.save();
    
    await this.checkPopularAchievement(userId, stats);
    
    return stats;
  }

  async trackReaction(userId) {
    const stats = await this.getUserStats(userId);
    stats.totalReactions += 1;
    await stats.addXP(2); // 2 XP per reaction
    
    await this.checkEmojiMasterAchievement(userId, stats);
    
    return stats;
  }

  async trackFileShared(userId) {
    const stats = await this.getUserStats(userId);
    stats.totalFilesShared += 1;
    await stats.addXP(5); // 5 XP per file
    
    await this.checkFileSharerAchievement(userId, stats);
    
    return stats;
  }

  async trackGroupCreated(userId) {
    const stats = await this.getUserStats(userId);
    stats.totalGroupsCreated += 1;
    await stats.addXP(20); // 20 XP per group
    
    await this.checkGroupCreatorAchievement(userId, stats);
    
    return stats;
  }

  async trackFriendAdded(userId) {
    const stats = await this.getUserStats(userId);
    stats.friendCount += 1;
    await stats.addXP(10); // 10 XP per friend
    
    await this.checkSocialButterflyAchievement(userId, stats);
    
    return stats;
  }

  async trackFeatureUsed(userId, feature) {
    const stats = await this.getUserStats(userId);
    await stats.trackFeature(feature);
    await stats.addXP(5); // 5 XP for trying new features
    
    await this.checkExplorerAchievement(userId, stats);
    
    return stats;
  }

  async checkFirstMessageAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'first_message' });
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'first_message',
        title: 'First Steps',
        description: 'Send your first message',
        icon: '🚀',
        rarity: 'common',
        progress: 1,
        target: 1,
        unlocked: true,
        unlockedAt: new Date(),
        xpReward: 10
      });
      await stats.addXP(10);
    }
  }

  async checkSocialButterflyAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'social_butterfly' });
    const target = 10;
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'social_butterfly',
        title: 'Social Butterfly',
        description: `Add ${target} friends`,
        icon: '🦋',
        rarity: 'rare',
        progress: stats.friendCount,
        target,
        unlocked: stats.friendCount >= target,
        unlockedAt: stats.friendCount >= target ? new Date() : null,
        xpReward: 50
      });
    } else if (!achievement.unlocked && stats.friendCount >= target) {
      achievement.progress = stats.friendCount;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(50);
    } else {
      achievement.progress = stats.friendCount;
      await achievement.save();
    }
  }

  async checkGroupCreatorAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'group_creator' });
    const target = 1;
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'group_creator',
        title: 'Community Builder',
        description: 'Create your first group',
        icon: '👥',
        rarity: 'rare',
        progress: stats.totalGroupsCreated,
        target,
        unlocked: stats.totalGroupsCreated >= target,
        unlockedAt: stats.totalGroupsCreated >= target ? new Date() : null,
        xpReward: 30
      });
    } else if (!achievement.unlocked && stats.totalGroupsCreated >= target) {
      achievement.progress = stats.totalGroupsCreated;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(30);
    } else {
      achievement.progress = stats.totalGroupsCreated;
      await achievement.save();
    }
  }

  async checkEmojiMasterAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'emoji_master' });
    const target = 100;
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'emoji_master',
        title: 'Emoji Master',
        description: `React with ${target} emojis`,
        icon: '😎',
        rarity: 'epic',
        progress: stats.totalReactions,
        target,
        unlocked: stats.totalReactions >= target,
        unlockedAt: stats.totalReactions >= target ? new Date() : null,
        xpReward: 100
      });
    } else if (!achievement.unlocked && stats.totalReactions >= target) {
      achievement.progress = stats.totalReactions;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(100);
    } else {
      achievement.progress = stats.totalReactions;
      await achievement.save();
    }
  }

  async checkFileSharerAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'file_sharer' });
    const target = 10;
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'file_sharer',
        title: 'File Sharer',
        description: `Share ${target} files`,
        icon: '📁',
        rarity: 'common',
        progress: stats.totalFilesShared,
        target,
        unlocked: stats.totalFilesShared >= target,
        unlockedAt: stats.totalFilesShared >= target ? new Date() : null,
        xpReward: 25
      });
    } else if (!achievement.unlocked && stats.totalFilesShared >= target) {
      achievement.progress = stats.totalFilesShared;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(25);
    } else {
      achievement.progress = stats.totalFilesShared;
      await achievement.save();
    }
  }

  async checkStreakAchievements(userId, stats) {
    // Week streak
    const weekAchievement = await Achievement.findOne({ userId, type: 'streak_week' });
    const weekTarget = 7;
    
    if (!weekAchievement) {
      await Achievement.create({
        userId,
        type: 'streak_week',
        title: 'Week Warrior',
        description: `Maintain a ${weekTarget} day streak`,
        icon: '🔥',
        rarity: 'rare',
        progress: stats.currentStreak,
        target: weekTarget,
        unlocked: stats.currentStreak >= weekTarget,
        unlockedAt: stats.currentStreak >= weekTarget ? new Date() : null,
        xpReward: 75
      });
    } else if (!weekAchievement.unlocked && stats.currentStreak >= weekTarget) {
      weekAchievement.progress = stats.currentStreak;
      weekAchievement.unlocked = true;
      weekAchievement.unlockedAt = new Date();
      await weekAchievement.save();
      await stats.addXP(75);
    } else {
      weekAchievement.progress = stats.currentStreak;
      await weekAchievement.save();
    }

    // Month streak
    const monthAchievement = await Achievement.findOne({ userId, type: 'streak_month' });
    const monthTarget = 30;
    
    if (!monthAchievement) {
      await Achievement.create({
        userId,
        type: 'streak_month',
        title: 'Monthly Legend',
        description: `Maintain a ${monthTarget} day streak`,
        icon: '⭐',
        rarity: 'legendary',
        progress: stats.currentStreak,
        target: monthTarget,
        unlocked: stats.currentStreak >= monthTarget,
        unlockedAt: stats.currentStreak >= monthTarget ? new Date() : null,
        xpReward: 200
      });
    } else if (!monthAchievement.unlocked && stats.currentStreak >= monthTarget) {
      monthAchievement.progress = stats.currentStreak;
      monthAchievement.unlocked = true;
      monthAchievement.unlockedAt = new Date();
      await monthAchievement.save();
      await stats.addXP(200);
    } else {
      monthAchievement.progress = stats.currentStreak;
      await monthAchievement.save();
    }
  }

  async checkPopularAchievement(userId, stats) {
    const achievement = await Achievement.findOne({ userId, type: 'popular' });
    const target = 100;
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'popular',
        title: 'Popular',
        description: `Receive ${target} messages`,
        icon: '💬',
        rarity: 'rare',
        progress: stats.totalMessagesReceived,
        target,
        unlocked: stats.totalMessagesReceived >= target,
        unlockedAt: stats.totalMessagesReceived >= target ? new Date() : null,
        xpReward: 50
      });
    } else if (!achievement.unlocked && stats.totalMessagesReceived >= target) {
      achievement.progress = stats.totalMessagesReceived;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(50);
    } else {
      achievement.progress = stats.totalMessagesReceived;
      await achievement.save();
    }
  }

  async checkExplorerAchievement(userId, stats) {
    const allFeatures = [
      'send_message',
      'send_image',
      'send_file',
      'create_group',
      'add_reaction',
      'reply_message',
      'forward_message',
      'use_ai_reply',
      'use_ai_translate',
      'use_ai_summary'
    ];
    
    const achievement = await Achievement.findOne({ userId, type: 'explorer' });
    
    if (!achievement) {
      await Achievement.create({
        userId,
        type: 'explorer',
        title: 'Explorer',
        description: 'Try all app features',
        icon: '🗺️',
        rarity: 'legendary',
        progress: stats.featuresUsed.length,
        target: allFeatures.length,
        unlocked: stats.featuresUsed.length >= allFeatures.length,
        unlockedAt: stats.featuresUsed.length >= allFeatures.length ? new Date() : null,
        xpReward: 300
      });
    } else if (!achievement.unlocked && stats.featuresUsed.length >= allFeatures.length) {
      achievement.progress = stats.featuresUsed.length;
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      await achievement.save();
      await stats.addXP(300);
    } else {
      achievement.progress = stats.featuresUsed.length;
      await achievement.save();
    }
  }

  async getLeaderboard(limit = 10) {
    const leaderboard = await UserStats.find()
      .populate('userId', 'username profileImage')
      .sort({ level: -1, xp: -1 })
      .limit(limit);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: entry.userId,
      level: entry.level,
      xp: entry.xp,
      totalMessages: entry.totalMessagesSent
    }));
  }

  async getDiscoveryFeed(userId) {
    const user = await User.findById(userId);
    const stats = await this.getUserStats(userId);
    
    // Suggest users based on activity
    const activeUsers = await User.find({
      _id: { $ne: userId },
      isOnline: true,
      _id: { $nin: [...user.friends, ...user.blockedUsers] }
    })
    .select('username profileImage bio status')
    .limit(5);

    // Suggest features not yet tried
    const allFeatures = [
      { id: 'send_image', name: 'Send Images', icon: '📷', description: 'Share photos with friends' },
      { id: 'send_file', name: 'Share Files', icon: '📎', description: 'Send documents and files' },
      { id: 'create_group', name: 'Create Groups', icon: '👥', description: 'Start group conversations' },
      { id: 'add_reaction', name: 'React to Messages', icon: '😀', description: 'Express yourself with emojis' },
      { id: 'use_ai_reply', name: 'AI Smart Reply', icon: '🤖', description: 'Get intelligent reply suggestions' },
      { id: 'use_ai_translate', name: 'AI Translation', icon: '🌍', description: 'Translate messages instantly' },
    ];

    const untriedFeatures = allFeatures.filter(
      feature => !stats.featuresUsed.includes(feature.id)
    );

    return {
      activeUsers,
      untriedFeatures,
      suggestedActions: this.getSuggestedActions(stats)
    };
  }

  getSuggestedActions(stats) {
    const actions = [];
    
    if (stats.friendCount < 5) {
      actions.push({
        type: 'social',
        title: 'Make New Friends',
        description: 'Add more friends to unlock achievements',
        icon: '👋'
      });
    }
    
    if (stats.currentStreak < 3) {
      actions.push({
        type: 'streak',
        title: 'Keep Your Streak Alive',
        description: 'Send messages daily to maintain your streak',
        icon: '🔥'
      });
    }
    
    if (stats.totalGroupsCreated === 0) {
      actions.push({
        type: 'group',
        title: 'Create a Group',
        description: 'Start a group chat with your friends',
        icon: '👥'
      });
    }
    
    if (stats.totalReactions < 10) {
      actions.push({
        type: 'reaction',
        title: 'React More',
        description: 'React to messages to earn XP',
        icon: '😀'
      });
    }

    return actions;
  }
}

module.exports = new GamificationService();
