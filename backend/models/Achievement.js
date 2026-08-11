const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'first_message',
      'social_butterfly', // 10 friends
      'group_creator',
      'night_owl', // Messages between 10PM-6AM
      'early_bird', // Messages between 6AM-10AM
      'emoji_master', // 100 emoji reactions
      'file_sharer', // Share 10 files
      'streak_week', // 7 day streak
      'streak_month', // 30 day streak
      'popular', // Receive 100 messages
      'explorer' // Try all features
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  progress: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    required: true
  },
  unlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date,
    default: null
  },
  xpReward: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

achievementSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
