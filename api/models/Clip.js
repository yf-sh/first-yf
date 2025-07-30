const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
    // 标题
    title: {
        type: String,
        required: true,
        default: null
    },
    // 用户id
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 浏览量
    views: {
        type: Number,
        default: 0
    },
    // 点赞量
    likes: {
        type: Number,
        default: 0
    },
    // 收藏量
    collections: {
        type: Number,
        default: 0
    },
    // 评论
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    // 上传时间
    uploadTime: {
        type: Date,
        default: Date.now
    },
    // 审核时间
    auditTime: {
        type: Date,
        default: null
    },
    // 状态
    status: {
        type: String,
        enum: ['待审核', '待发布','草稿箱','已发布','已删除'],
    }
})