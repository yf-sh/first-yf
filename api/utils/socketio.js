// 引入socketio模块
const { Server } = require('socket.io');
// 引入jsonwebtoken模块
const jwt = require('jsonwebtoken');
// 引入logger模块
const Message = require('../models/Message');
const { Usermodel: User } = require('../models/User'); // 添加User模型引用
const { logger } = require('./logger');
// 创建socketio服务实例
class SocketIOService {
  constructor(server) {
    // 初始化socketio服务实例
    this.io = new Server(server, {
      cors: {
        // 允许跨域请求
        origin: process.env.FRONTEND_URL || "http://localhost:9527",
        methods: ["GET", "POST"],
        // 允许携带认证信息
        credentials: true
      }
    });
    this.clients = new Map(); // 存储连接的客户端
    // 初始化socketio服务实例
    this.setupSocketIO();
  }

  // 设置socketio服务实例到路由中
  setupSocketIO() {
    // 身份验证中间件
    this.io.use((socket, next) => {
      // 验证socket连接
      this.authenticateSocket(socket, next);
    });

    // 监听连接事件
    this.io.on('connection', (socket) => {
      // 处理连接事件
      this.handleConnection(socket);
    });

    logger.info('Socket.IO 服务器已启动');
  }

  // 身份验证中间件
  async authenticateSocket(socket, next) {
    try {
      // 从socket连接中获取认证token
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('未提供认证token'));
      }

      // 验证JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // 从token中提取用户信息
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.userInfo = decoded;
      
      next();
    } catch (error) {
      logger.error('Socket.IO 认证失败:', error);
      next(new Error('认证失败'));
    }
  }

  // 处理连接事件 
  handleConnection(socket) {
    const { userId, username } = socket;
    
    // 存储客户端连接
    this.clients.set(userId, {
      socket,
      userId,
      username,
      userInfo: socket.userInfo,
      connectedAt: new Date()
    });

    logger.info(`用户 ${username} (ID: ${userId}) 已连接 Socket.IO`);

    // 发送连接成功消息
    socket.emit('connection_established', {
      userId,
      message: 'Socket.IO 连接已建立'
    });

    // 广播用户上线消息
    socket.broadcast.emit('user_connected', {
      userId,
      username,
      timestamp: Date.now()
    });

    // 处理消息
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
    // 处理广播消息
    socket.on('broadcast', (data) => {
      this.handleBroadcast(socket, data);
    });
    // 处理私信消息
    socket.on('private_message', (data) => {
      this.handlePrivateMessage(socket, data);
    });
    // 处理加入房间
    socket.on('join_room', (roomName) => {
      this.handleJoinRoom(socket, roomName);
    });
    // 处理离开房间
    socket.on('leave_room', (roomName) => {
      this.handleLeaveRoom(socket, roomName);
    });
    // 处理房间消息
    socket.on('room_message', (data) => {
      this.handleRoomMessage(socket, data);
    });

    // 处理通话请求
    socket.on('call_request', (data) => {
      this.handleCallRequest(socket, data);
    });
    // 处理通话响应
    socket.on('call_response', (data) => {
      this.handleCallResponse(socket, data);
    });
    // 处理ICE候选
    socket.on('ice_candidate', (data) => {
      this.handleIceCandidate(socket, data);
    });
    // 处理通话结束
    socket.on('call_end', (data) => {
      this.handleCallEnd(socket, data);
    });
    // 处理offer
    socket.on('offer', (data) => {
      this.handleOffer(socket, data);
    });
    // 处理answer
    socket.on('answer', (data) => {
      this.handleAnswer(socket, data);
    });
    // 处理断开连接
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // 处理错误
    socket.on('error', (error) => {
      logger.error(`Socket.IO 错误 - 用户 ${username} (ID: ${userId}):`, error);
      this.handleDisconnection(socket);
    });
  }

  // 处理广播消息
  handleBroadcast(socket, data) {
    const { userId, username } = socket;
    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的广播消息:`, data);

    this.io.emit('broadcast', {
      from: userId,
      fromUsername: username,
      message: data.message,
      timestamp: Date.now()
    });
  }

  // 处理私信消息
  async handlePrivateMessage(socket, data) {
    const { userId, username } = socket;
    const { targetUserId, message, type = 'text', metadata = {} } = data;

    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的私信:`, data);

    try {
      // 保存消息到数据库
      const savedMessage = await Message.create({
        sender: userId,
        receiver: targetUserId,
        content: message,
        type,
        metadata
      });

      // 填充用户信息
      await savedMessage.populate('sender', 'username nickname avatar', User);
      await savedMessage.populate('receiver', 'username nickname avatar', User);

      // 发送给目标用户
      this.sendToUser(targetUserId, 'private_message', {
        from: userId,
        fromUsername: username,
        message,
        messageId: savedMessage.messageId,
        timestamp: savedMessage.createdAt,
        type: savedMessage.type,
        metadata: savedMessage.metadata
      });

      // 发送确认消息给发送者
      socket.emit('private_message_sent', {
        to: targetUserId,
        message,
        messageId: savedMessage.messageId,
        timestamp: savedMessage.createdAt,
        type: savedMessage.type,
        metadata: savedMessage.metadata
      });

      logger.info(`私信已保存到数据库，消息ID: ${savedMessage.messageId}`);
    } catch (error) {
      logger.error('保存私信到数据库失败:', error);
      
      // 即使保存失败，也要发送消息给目标用户
      this.sendToUser(targetUserId, 'private_message', {
        from: userId,
        fromUsername: username,
        message,
        timestamp: Date.now()
      });

      socket.emit('private_message_sent', {
        to: targetUserId,
        message,
        timestamp: Date.now()
      });
    }
  }

  // 处理加入房间
  handleJoinRoom(socket, roomName) {
    const { userId, username } = socket;
    socket.join(roomName);
    
    logger.info(`用户 ${username} (ID: ${userId}) 加入房间: ${roomName}`);
    
    socket.emit('room_joined', { roomName });
    socket.to(roomName).emit('user_joined_room', {
      userId,
      username,
      roomName,
      timestamp: Date.now()
    });
  }

  // 处理离开房间
  handleLeaveRoom(socket, roomName) {
    const { userId, username } = socket;
    socket.leave(roomName);
    
    logger.info(`用户 ${username} (ID: ${userId}) 离开房间: ${roomName}`);
    
    socket.emit('room_left', { roomName });
    socket.to(roomName).emit('user_left_room', {
      userId,
      username,
      roomName,
      timestamp: Date.now()
    });
  }

  // 处理房间消息
  handleRoomMessage(socket, data) {
    const { userId, username } = socket;
    const { roomName, message } = data;

    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的房间消息:`, data);

    this.io.to(roomName).emit('room_message', {
      from: userId,
      fromUsername: username,
      roomName,
      message,
      timestamp: Date.now()
    });
  }

  // 处理断开连接
  handleDisconnection(socket) {
    const { userId, username } = socket;
    this.clients.delete(userId);
    
    logger.info(`用户 ${username} (ID: ${userId}) 已断开 Socket.IO 连接`);

    // 广播用户下线消息
    socket.broadcast.emit('user_disconnected', {
      userId,
      username,
      timestamp: Date.now()
    });
  }

  // 发送消息给特定用户
  sendToUser(userId, event, data) {
    const client = this.clients.get(userId);
    if (client) {
      client.socket.emit(event, data);
    }
  }

  // 广播消息给所有连接的客户端
  broadcast(event, data, excludeUserId = null) {
    this.io.emit(event, data);
  }

  // 发送消息给特定房间
  sendToRoom(roomName, event, data) {
    this.io.to(roomName).emit(event, data);
  }

  // 获取连接统计信息
  getStats() {
    const connectedUsers = Array.from(this.clients.entries()).map(([userId, client]) => ({
      userId,
      username: client.username,
      connectedAt: client.connectedAt
    }));
    
    return {
      totalConnections: this.clients.size,
      connectedUsers,
      timestamp: new Date()
    };
  }

  // 处理通话请求
  handleCallRequest(socket, data) {
    const { userId, username } = socket;
    const { targetUserId, offer, callType, fromUserId, fromUsername } = data;

    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的通话请求:`, data);

    // 发送通话请求给目标用户
    this.sendToUser(targetUserId, 'incoming_call', {
      fromUserId: socket.userId,
      fromUsername: socket.username,
      offer,
      callType,
      timestamp: Date.now()
    });
  }

  // 处理通话响应
  handleCallResponse(socket, data) {
    const { userId, username } = socket;
    const { targetUserId, answer, accepted } = data;

    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的通话响应:`, data);

    // 发送通话响应给目标用户
    this.sendToUser(targetUserId, 'call_response', {
      fromUserId: userId,
      fromUsername: username,
      answer,
      accepted,
      timestamp: Date.now()
    });
  }

  // 处理ICE候选
  handleIceCandidate(socket, data) {
    const { userId, username } = socket;
    const { targetUserId, candidate } = data;

    logger.info(`收到来自用户 ${username} (ID: ${userId}) 的ICE候选:`, data);

    // 转发ICE候选给目标用户
    this.sendToUser(targetUserId, 'ice_candidate', {
      fromUserId: userId,
      fromUsername: username,
      candidate,
      timestamp: Date.now()
    });
  }

  // 处理通话结束
  handleCallEnd(socket, data) {
    const { userId, username } = socket;
    const { targetUserId } = data;

    logger.info(`用户 ${username} (ID: ${userId}) 结束通话`);

    // 通知目标用户通话结束
    this.sendToUser(targetUserId, 'call_end', {
      fromUserId: userId,
      fromUsername: username,
      timestamp: Date.now()
    });
  }

  // 关闭所有连接
  closeAll() {
    this.clients.forEach((client) => {
      client.socket.disconnect();
    });
    this.clients.clear();
  }
}

module.exports = SocketIOService;