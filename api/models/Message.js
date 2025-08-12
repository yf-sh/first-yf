const mongoose = require('mongoose');

// 导入User模型
const { Usermodel: User } = require('./User');

// 消息类型枚举
const MESSAGE_TYPES = {
  TEXT: 'text',           // 文本消息
  IMAGE: 'image',         // 图片消息
  FILE: 'file',           // 文件消息
  VOICE: 'voice',         // 语音消息
  VIDEO: 'video',         // 视频消息
  SYSTEM: 'system'        // 系统消息
};

// 消息状态枚举
const MESSAGE_STATUS = {
  SENT: 'sent',           // 已发送
  DELIVERED: 'delivered', // 已送达
  READ: 'read',           // 已读
  RECALLED: 'recalled',   // 已撤回
  DELETED: 'deleted'      // 已删除
};

// 用户间的通信消息
const messageSchema = new mongoose.Schema({
    // 发送者
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // 接收者
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // 消息内容
    content: {
        type: String,
        required: true,
        maxlength: 1000, // 限制消息长度
        trim: true
    },
    // 消息类型
    type: {
        type: String,
        enum: Object.values(MESSAGE_TYPES),
        default: MESSAGE_TYPES.TEXT,
        required: true
    },
    // 消息状态
    status: {
        type: String,
        enum: Object.values(MESSAGE_STATUS),
        default: MESSAGE_STATUS.SENT,
        required: true
    },
    // 消息元数据（用于存储额外信息，如图片URL、文件信息等）
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // 消息ID（用于消息撤回、编辑等功能）
    messageId: {
        type: String,
        // unique: true,
        required: false  // 改为可选，由预保存中间件自动生成
    },
    // 回复的消息ID（用于回复功能）
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    // 消息是否已读
    isRead: {
        type: Boolean,
        default: false
    },
    // 阅读时间
    readAt: {
        type: Date,
        default: null
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 复合索引：用于快速查询两个用户之间的消息
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

// 生成唯一消息ID的中间件
messageSchema.pre('save', function(next) {
    if (!this.messageId) {
        this.messageId = `${this.sender}_${this.receiver}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// 实例方法：标记为已读
messageSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.status = MESSAGE_STATUS.READ;
    this.readAt = new Date();
    return this.save();
};

// 实例方法：撤回消息
messageSchema.methods.recall = function() {
    this.status = MESSAGE_STATUS.RECALLED;
    return this.save();
};

// 静态方法：获取两个用户之间的消息
messageSchema.statics.getMessagesBetweenUsers = function(userId1, userId2, limit = 50, skip = 0) {
    return this.find({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 }
        ],
        status: { $ne: MESSAGE_STATUS.DELETED }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username nickname avatar', User)
    .populate('receiver', 'username nickname avatar', User)
    .populate('replyTo', 'content type');
};

// 静态方法：获取用户未读消息数量
messageSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        receiver: userId,
        isRead: false,
        status: { $ne: MESSAGE_STATUS.DELETED }
    });
};

// 静态方法：标记用户的所有消息为已读
messageSchema.statics.markAllAsRead = function(userId, senderId) {
    return this.updateMany(
        {
            receiver: userId,
            sender: senderId,
            isRead: false,
            status: { $ne: MESSAGE_STATUS.DELETED }
        },
        {
            isRead: true,
            status: MESSAGE_STATUS.READ,
            readAt: new Date()
        }
    );
};

const Message = mongoose.model('Message', messageSchema);

// 导出枚举值
Message.MESSAGE_TYPES = MESSAGE_TYPES;
Message.MESSAGE_STATUS = MESSAGE_STATUS;

module.exports = Message;