const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  // 关注者ID
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  // 被关注者ID
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  // 关注时间
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建复合索引，确保同一个用户不能重复关注同一个人
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 为查询优化创建索引
followSchema.index({ followerId: 1, createdAt: -1 });
followSchema.index({ followingId: 1, createdAt: -1 });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;