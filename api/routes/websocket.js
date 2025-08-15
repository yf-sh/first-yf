const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// 获取Socket.IO服务实例
let socketIOService = null;

// 设置Socket.IO服务实例的方法
function setWebSocketService(service) {
  socketIOService = service;
}

// 获取Socket.IO连接统计信息
router.get('/stats', auth, (req, res) => {
  try {
    if (!socketIOService) {
      return res.status(503).json({
        success: false,
        message: 'Socket.IO服务未启动'
      });
    }
// 获取连接统计信息
    const stats = socketIOService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取Socket.IO统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

// 发送广播消息（管理员功能）
router.post('/broadcast', auth, (req, res) => {
  try {
    if (!socketIOService) {
      return res.status(503).json({
        success: false,
        message: 'Socket.IO服务未启动'
      });
    }

    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 检查用户权限（这里可以根据需要添加权限检查）
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    // 发送广播消息
    socketIOService.broadcast('admin_broadcast', {
      message,
      from: req.user.userId,
      fromUsername: req.user.username,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: '广播消息已发送'
    });
  } catch (error) {
    logger.error('发送广播消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送广播消息失败'
    });
  }
});

// 发送私信给特定用户
router.post('/private-message', auth, (req, res) => {
  try {
    if (!socketIOService) {
      return res.status(503).json({
        success: false,
        message: 'Socket.IO服务未启动'
      });
    }

    const { targetUserId, message } = req.body;
    
    if (!targetUserId || !message) {
      return res.status(400).json({
        success: false,
        message: '目标用户ID和消息内容不能为空'
      });
    }

    socketIOService.sendToUser(targetUserId, 'private_message', {
      from: req.user.userId,
      fromUsername: req.user.username,
      message,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: '私信已发送'
    });
  } catch (error) {
    logger.error('发送私信失败:', error);
    res.status(500).json({
      success: false,
      message: '发送私信失败'
    });
  }
});

// 获取在线用户列表
router.get('/online-users', auth, (req, res) => {
  try {
    if (!socketIOService) {
      return res.status(503).json({
        success: false,
        message: 'Socket.IO服务未启动'
      });
    }

    const stats = socketIOService.getStats();
    res.json({
      success: true,
      data: {
        onlineUsers: stats.connectedUsers,
        totalCount: stats.totalConnections
      }
    });
  } catch (error) {
    logger.error('获取在线用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取在线用户列表失败'
    });
  }
});

module.exports = { router, setWebSocketService }; 