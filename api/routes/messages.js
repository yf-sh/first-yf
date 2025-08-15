// 用户间的通信消息
var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken: auth } = require('../middleware/auth');
const Message = require('../models/Message');
const { Usermodel: User } = require('../models/User'); // 修复User模型导入
const { logger } = require('../utils/logger');

// 获取与指定用户的消息历史
router.get('/history/:targetUserId', auth, async function (req, res, next) {
    try {
        const { targetUserId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await Message.getMessagesBetweenUsers(
            req.user.userId,
            targetUserId,
            parseInt(limit),
            skip
        );

        // 标记消息为已读
        await Message.markAllAsRead(req.user.userId, targetUserId);

        res.json({
            code: 200,
            msg: '获取消息历史成功',
            data: {
                messages: messages.reverse(), // 按时间正序返回
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: messages.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('获取消息历史失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取消息历史失败',
            data: null
        });
    }
});

// 获取用户的所有未读消息数量
router.get('/unread-count', auth, async function (req, res, next) {
    try {
        const count = await Message.getUnreadCount(req.user.userId);
        res.json({
            code: 200,
            msg: '获取未读消息数量成功',
            data: { unreadCount: count }
        });
    } catch (error) {
        logger.error('获取未读消息数量失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取未读消息数量失败',
            data: null
        });
    }
});

// 获取用户的私信会话列表
router.get('/conversations', auth, async function (req, res, next) {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        const skip = (page - 1) * limit;

        logger.info(`获取会话列表 - 请求参数: page=${page}, limit=${limit}, userId=${userId}`);

        // 验证userId是否为有效的ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            logger.warn(`无效的用户ID格式: ${userId}`);
            return res.status(400).json({
                code: 400,
                msg: '无效的用户ID格式',
                data: null
            });
        }

        // 将userId转换为ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        logger.info(`转换后的ObjectId: ${userObjectId}`);

        // 获取用户参与的所有私信会话
        const conversations = await Message.aggregate([
            {
                // 匹配发送者或接收者为当前用户
                $match: {
                    $or: [
                        { sender: userObjectId },
                        { receiver: userObjectId }
                    ],
                    // 状态不为已删除
                    status: { $ne: 'deleted' },
                    // 类型为文本
                    type:  'text' 
                }
            },
            {
                $addFields: {
                    // 确定对话的另一方用户ID
                    otherUser: {
                        $cond: {
                            if: { $eq: ['$sender', userObjectId] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    },
                    // 确定消息方向
                    isOutgoing: { $eq: ['$sender', userObjectId] }
                }
            },
            {
                $group: {
                    _id: '$otherUser',
                    // 分组中的最后一条消息（最新消息）
                    lastMessage: { $last: '$$ROOT' },
                    // 未读消息数
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    // 条件
                                    $and: [
                                        // 消息接受者
                                        { $eq: ['$receiver', userObjectId] },
                                        // 未读
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,//满足条件+1
                                0//不满足+0
                            ]
                        }
                    },
                    // 统计该会话总消息数
                    totalMessages: { $sum: 1 }
                }
            },
            // 按创建时间降序排序
            {
                $sort: { 'lastMessage.createdAt': -1 }
            },
            // 分页
            {
                $skip: skip
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        logger.info(`聚合查询结果: ${conversations.length} 个会话`);

        // 检查是否有会话数据
        if (conversations.length === 0) {
            logger.info('未找到会话数据，返回空列表');
            return res.json({
                code: 200,
                msg: '获取私信会话列表成功',
                data: {
                    conversations: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        hasMore: false
                    }
                }
            });
        }

        // 填充用户信息
        const populatedConversations = await Message.populate(conversations, [
            // 填充用户信息
            {
                path: '_id',
                select: 'username nickname avatar',
                model: User
            },
            // 填充发送者信息
            {
                path: 'lastMessage.sender',
                select: 'username nickname avatar',
                model: User
            },
            // 填充接收者信息
            {
                path: 'lastMessage.receiver',
                select: 'username nickname avatar',
                model: User
            }
        ]);

        // 格式化返回数据
        const formattedConversations = populatedConversations.map(conv => ({
            userId: conv._id._id,
            username: conv._id.username,
            nickname: conv._id.nickname,
            avatar: conv._id.avatar,
            lastMessage: {
                content: conv.lastMessage.content,
                type: conv.lastMessage.type,
                timestamp: conv.lastMessage.createdAt,
                isOutgoing: conv.lastMessage.isOutgoing
            },
            unreadCount: conv.unreadCount,
            totalMessages: conv.totalMessages
        }));

        res.json({
            code: 200,
            msg: '获取私信会话列表成功',
            data: {
                conversations: formattedConversations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: formattedConversations.length === parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('获取私信会话列表失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取私信会话列表失败',
            data: null
        });
    }
});

// 发送系统消息（管理员功能）
router.post('/send-system', auth, async function (req, res, next) {
    try {
        const { receiverId, content, title = '系统通知', metadata = {} } = req.body;

        // 检查权限：只有管理员可以发送系统消息
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                code: 403,
                msg: '权限不足，只有管理员可以发送系统消息',
                data: null
            });
        }

        if (!receiverId || !content) {
            return res.status(400).json({
                code: 400,
                msg: '接收者ID和消息内容不能为空',
                data: null
            });
        }

        // 验证receiverId是否为有效的ObjectId
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                code: 400,
                msg: '无效的接收者ID格式',
                data: null
            });
        }

        // 创建系统消息
        const systemMessage = await Message.create({
            sender: '689853d5b8489ca4c93d02ac', // 系统用户ID
            receiver: receiverId,
            content: content,
            type: 'system',
            title: title,
            metadata: metadata
        });

        // 填充用户信息
        await systemMessage.populate('sender', 'username nickname avatar', User);
        await systemMessage.populate('receiver', 'username nickname avatar', User);

        // 通过Socket.IO发送系统消息给目标用户
        const socketIOService = require('../utils/socketio');
        if (global.socketIOService) {
            global.socketIOService.sendToUser(receiverId, 'system_message', {
                messageId: systemMessage.messageId,
                title: title,
                message: content,
                timestamp: systemMessage.createdAt,
                type: 'system',
                metadata: metadata
            });
        }

        res.json({
            code: 200,
            msg: '系统消息发送成功',
            data: systemMessage
        });
    } catch (error) {
        logger.error('发送系统消息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '发送系统消息失败',
            data: null
        });
    }
});

// 获取系统消息
router.get('/system', auth, async function (req, res, next) {
    try {
        const { page = 1, limit = 20, userId } = req.query;
        const skip = (page - 1) * limit;

        logger.info(`获取系统消息 - 请求参数: page=${page}, limit=${limit}, userId=${userId}`);

        // 验证userId是否为有效的ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            logger.warn(`无效的用户ID格式: ${userId}`);
            return res.status(400).json({
                code: 400,
                msg: '无效的用户ID格式',
                data: null
            });
        }

        // 将userId转换为ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 查询系统消息：type为'system'且receiver为当前用户
        const systemMessages = await Message.find({
            // 类型为系统消息
            type: 'system',
            receiver: userObjectId,
            status: { $ne: 'deleted' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'username nickname avatar', User)
        .populate('receiver', 'username nickname avatar', User);

        // 获取总数
        const totalCount = await Message.countDocuments({
            type: 'system',
            receiver: userObjectId,
            status: { $ne: 'deleted' }
        });

        logger.info(`找到 ${systemMessages.length} 条系统消息，总数: ${totalCount}`);

        res.json({
            code: 200,
            msg: '获取系统消息成功',
            data: {
                messages: systemMessages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    hasMore: skip + systemMessages.length < totalCount
                }
            }
        });
    } catch (error) {
        logger.error('获取系统消息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取系统消息失败',
            data: null
        });
    }
});

// 创建新消息（通过Socket.IO发送消息时同时保存到数据库）
router.post('/create', auth, async function (req, res, next) {
    try {
        const { receiver, content, type = Message.MESSAGE_TYPES.TEXT, metadata = {} } = req.body;

        if (!receiver || !content) {
            return res.status(400).json({
                code: 400,
                msg: '接收者和消息内容不能为空',
                data: null
            });
        }

        const message = await Message.create({
            sender: req.user.userId,
            receiver,
            content,
            type,
            metadata
        });

        // 填充发送者和接收者信息
        await message.populate('sender', 'username nickname avatar', User);
        await message.populate('receiver', 'username nickname avatar', User);

        res.json({
            code: 200,
            msg: '消息创建成功',
            data: message
        });
    } catch (error) {
        logger.error('创建消息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '创建消息失败',
            data: null
        });
    }
});

// 标记消息为已读
router.post('/mark-read/:messageId', auth, async function (req, res, next) {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                code: 404,
                msg: '消息不存在',
                data: null
            });
        }

        // 只能标记发给自己的消息为已读
        if (message.receiver.toString() !== req.user.userId) {
            return res.status(403).json({
                code: 403,
                msg: '无权限操作此消息',
                data: null
            });
        }

        await message.markAsRead();

        res.json({
            code: 200,
            msg: '消息已标记为已读',
            data: null
        });
    } catch (error) {
        logger.error('标记消息已读失败:', error);
        res.status(500).json({
            code: 500,
            msg: '标记消息已读失败',
            data: null
        });
    }
});

// 撤回消息
router.post('/recall/:messageId', auth, async function (req, res, next) {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                code: 404,
                msg: '消息不存在',
                data: null
                
            });
        }

        // 只能撤回自己发送的消息
        if (message.sender.toString() !== req.user.userId) {
            return res.status(403).json({
                code: 403,
                msg: '只能撤回自己发送的消息',
                data: null
            });
        }

        // 只能撤回2分钟内的消息
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (message.createdAt < twoMinutesAgo) {
            return res.status(400).json({
                code: 400,
                msg: '只能撤回2分钟内的消息',
                data: null
            });
        }

        await message.recall();

        res.json({
            code: 200,
            msg: '消息已撤回',
            data: null
        });
    } catch (error) {
        logger.error('撤回消息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '撤回消息失败',
            data: null
        });
    }
});

// 删除消息（软删除）
router.post('/:messageId', auth, async function (req, res, next) {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                code: 404,
                msg: '消息不存在',
                data: null
            });
        }

        // 只能删除自己发送或接收的消息
        if (message.sender.toString() !== req.user.userId &&
            message.receiver.toString() !== req.user.userId) {
            return res.status(403).json({
                code: 403,
                msg: '无权限删除此消息',
                data: null
            });
        }

        message.status = Message.MESSAGE_STATUS.DELETED;
        await message.save();

        res.json({
            code: 200,
            msg: '消息已删除',
            data: null
        });
    } catch (error) {
        logger.error('删除消息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '删除消息失败',
            data: null
        });
    }
});

// 获取消息统计信息
router.get('/stats', auth, async function (req, res, next) {
    try {
        const totalMessages = await Message.countDocuments({
            $or: [
                { sender: req.user.userId },
                { receiver: req.user.userId }
            ],
            status: { $ne: 'deleted' }
        });

        const unreadCount = await Message.getUnreadCount(req.user.userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMessages = await Message.countDocuments({
            sender: req.user.userId,
            createdAt: { $gte: today },
            status: { $ne: 'deleted' }
        });

        res.json({
            code: 200,
            msg: '获取消息统计成功',
            data: {
                totalMessages,
                unreadCount,
                todayMessages
            }
        });
    } catch (error) {
        logger.error('获取消息统计失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取消息统计失败',
            data: null
        });
    }
});

module.exports = router;