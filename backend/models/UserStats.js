const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Gamification stats
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  xpToNextLevel: {
    type: Number,
    default: 100
  },
  // Activity stats
  totalMessagesSent: {
    type: Number,
    default: 0
  },
  totalMessagesReceived: {
    type: Number,
    default: 0
  },
  totalReactions: {
    type: Number,
    default: 0
  },
  totalFilesShared: {
    type: Number,
    default: 0
  },
  totalGroupsCreated: {
    type: Number,
    default: 0
  },
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  // Time-based stats
  messagesByHour: {
    type: Map,
    of: Number,
    default: {}
  },
  // Discovery stats
  featuresUsed: {
    type: [String],
    default: []
  },
  // Social stats
  friendCount: {
    type: Number,
    default: 0
  },
  groupCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userStatsSchema.methods.addXP = function(amount) {
  this.xp += amount;
  
  while (this.xp >= this.xpToNextLevel) {
    this.xp -= this.xpToNextLevel;
    this.level += 1;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
  }
  
  return this.save();
};

userStatsSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day, no change
  } else if (diffDays === 1) {
    // Next day, increment streak
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    // Streak broken
    this.currentStreak = 1;
  }
  
  this.lastActiveDate = new Date();
  return this.save();
};

userStatsSchema.methods.trackFeature = function(feature) {
  if (!this.featuresUsed.includes(feature)) {
    this.featuresUsed.push(feature);
  }
  return this.save();
};

module.exports = mongoose.model('UserStats', userStatsSchema);
