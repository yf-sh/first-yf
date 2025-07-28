const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户等级配置
const LEVEL_CONFIG = {
  1: { name: '新手', exp: 0, benefits: ['基础功能'] },
  2: { name: '初级', exp: 100, benefits: ['基础功能', '评论功能'] },
  3: { name: '中级', exp: 500, benefits: ['基础功能', '评论功能', '上传视频'] },
  4: { name: '高级', exp: 1000, benefits: ['基础功能', '评论功能', '上传视频', '直播功能'] },
  5: { name: '专家', exp: 2000, benefits: ['所有功能', '优先推荐'] }
};

// 会员类型配置
const MEMBERSHIP_TYPES = {
  basic: { name: '基础会员', price: 19.9, benefits: ['无广告', '高清视频'] },
  premium: { name: '高级会员', price: 39.9, benefits: ['无广告', '高清视频', '专属客服'] },
  vip: { name: 'VIP会员', price: 99.9, benefits: ['所有权益', '优先审核', '专属标识'] }
};

const userSchema = new mongoose.Schema({
  // 基本信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
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
      enum: Object.keys(MEMBERSHIP_TYPES),
      default: null
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },

  // 角色权限
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],

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
  for (let level = 5; level > this.level; level--) {
    if (this.experience >= LEVEL_CONFIG[level].exp) {
      this.level = level;
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
userSchema.statics.getLevelConfig = () => LEVEL_CONFIG;

// 静态方法：获取会员类型配置
userSchema.statics.getMembershipTypes = () => MEMBERSHIP_TYPES;

module.exports = mongoose.model('User', userSchema); 