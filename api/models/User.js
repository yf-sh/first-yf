const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户等级配置
const USER_LEVEL= [
  { level: 1, name: '小白', exp: 0, benefits: ['内容浏览','评论功能'] },
  { level: 2, name: '初级', exp: 1000, benefits: ['内容浏览', '评论功能','发布帖子'] },
  { level: 3, name: '中级', exp: 5000, benefits: ['内容浏览', '评论功能','发布帖子', '上传视频'] },
  { level: 4, name: '高级', exp: 10000, benefits: ['内容浏览', '评论功能','发布帖子', '上传视频', '直播功能'] },
  { level: 5, name: '专家', exp: 20000, benefits: ['所有功能', '优先推荐'] }
];

// 会员类型配置
const MEMBER_TYPES = [
  { type: 'vip', name: '社区会员', benefits: ['专属标识','VIP内容浏览'] }
];

const userSchema = new mongoose.Schema({
  // 用户名
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 16
  },
  // 邮箱
  email: {
    type: String,
    default: null,
    lowercase: true
  },
  // 密码
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // 昵称
  nickname: {
    type: String,
    trim: true,
    maxlength: 20
  },
  // 头像
  avatar: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  // 简介
  bio: {
    type: String,
    maxlength: 200
  },

  // 等级系统
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },

  // 会员系统
  membership: {
    type: {
      type: String,
      enum: MEMBER_TYPES.map(m => m.type),
      default: null
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },



  // 统计信息
  stats: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    videos: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },

  // 状态
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },

  // 时间戳
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 实例方法：增加经验值
userSchema.methods.addExperience = async function(exp) {
  this.experience += exp;
  
  // 检查是否升级
  for (let i = USER_LEVEL.length - 1; i >= 0; i--) {
    const levelConfig = USER_LEVEL[i];
    if (this.experience >= levelConfig.exp && this.level < levelConfig.level) {
      this.level = levelConfig.level;
      break;
    }
  }
  
  await this.save();
  return this;
};

// 实例方法：检查会员状态
userSchema.methods.checkMembership = function() {
  if (!this.membership.isActive) return false;
  
  const now = new Date();
  return this.membership.endDate > now;
};

// 静态方法：获取等级配置
userSchema.statics.getLevelConfig = () => USER_LEVEL;

// 静态方法：获取会员类型配置
userSchema.statics.getMembershipTypes = () => MEMBER_TYPES;

// 新增：根据等级获取配置
userSchema.statics.getLevelConfigByLevel = (level) => {
  return USER_LEVEL.find(config => config.level === level);
};

// 新增：根据会员类型获取配置
userSchema.statics.getMembershipConfigByType = (type) => {
  return MEMBER_TYPES.find(membership => membership.type === type);
};

module.exports = mongoose.model('User', userSchema); 