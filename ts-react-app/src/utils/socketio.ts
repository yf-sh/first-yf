import { io, Socket } from 'socket.io-client'


 //Socket.IO消息接口
 //定义客户端与服务端之间传输的消息格式
 
// interface SocketIOMessage {
//   type: string;    // 消息类型，用于区分不同的消息处理逻辑
//   data: any;       // 消息数据，可以是任意类型
// }


 //Socket.IO客户端配置选项接口
 //定义创建Socket.IO连接时需要的参数
interface SocketIOOptions {
  url: string;                                    // Socket.IO服务器地址
  token: string;                                  // JWT认证令牌
  onMessage?: (event: string, data: any) => void; // 接收消息时的回调函数
  onConnect?: () => void;                        // 连接建立时的回调函数
  onDisconnect?: () => void;                     // 连接关闭时的回调函数
  onError?: (error: Error) => void;              // 发生错误时的回调函数
  onUserConnected?: (data: any) => void;         // 用户上线回调
  onUserDisconnected?: (data: any) => void;      // 用户下线回调
  onPrivateMessage?: (data: any) => void;        // 私信消息回调
  onBroadcast?: (data: any) => void;             // 广播消息回调
  onRoomMessage?: (data: any) => void;           // 房间消息回调
  onSystemMessage?: (data: any) => void;         // 系统消息回调
  reconnectInterval?: number;                    // 重连间隔时间（毫秒）
  maxReconnectAttempts?: number;                 // 最大重连次数
}

//Socket.IO客户端类
// 提供Socket.IO连接管理、消息发送接收、自动重连等功能
 
class SocketIOClient {
  private socket: Socket | null = null;          // Socket.IO连接实例
  private options: SocketIOOptions;              // 客户端配置选项
  private reconnectAttempts = 0;                 // 当前重连尝试次数
  private reconnectTimer: number | null = null;  // 重连定时器ID
  private isConnecting = false;                  // 是否正在连接中


  // 构造函数
  // Socket.IO客户端配置选项
  constructor(options: SocketIOOptions) {
    // 合并默认配置和用户配置
    this.options = {
      reconnectInterval: 3000,      // 默认重连间隔3秒
      maxReconnectAttempts: 5,      // 默认最大重连5次
      ...options
    };
  }

  
  // 建立Socket.IO连接

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果正在连接或已经连接，直接返回
      if (this.isConnecting || this.socket?.connected) {
        resolve();
        return;
      }

      this.isConnecting = true;
      
      try {
        // 创建Socket.IO连接实例
        this.socket = io(this.options.url, {
          auth: {
            token: this.options.token
          },
          query: {
            token: this.options.token
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.options.maxReconnectAttempts,
          reconnectionDelay: this.options.reconnectInterval,
          timeout: 20000
        });
        
        // 连接建立成功时的回调
        this.socket.on('connect', () => {
          console.log('Socket.IO连接已建立');
          this.isConnecting = false;
          this.reconnectAttempts = 0;  // 重置重连计数
          this.options.onConnect?.();  // 调用用户定义的回调
          resolve();
        });
        
        // 连接建立时的回调
        this.socket.on('connection_established', (data) => {
          console.log('Socket.IO连接已确认:', data);
        });

        // 用户上线事件
        this.socket.on('user_connected', (data) => {
          console.log('用户上线:', data);
          this.options.onUserConnected?.(data);
        });

        // 用户下线事件
        this.socket.on('user_disconnected', (data) => {
          console.log('用户下线:', data);
          this.options.onUserDisconnected?.(data);
        });

        // 广播消息事件
        this.socket.on('broadcast', (data) => {
          console.log('收到广播消息:', data);
          this.options.onBroadcast?.(data);
        });

        // 私信消息事件
        this.socket.on('private_message', (data) => {
          console.log('收到私信:', data);
          this.options.onPrivateMessage?.(data);
        });

        // 房间消息事件
        this.socket.on('room_message', (data) => {
          console.log('收到房间消息:', data);
          this.options.onRoomMessage?.(data);
        });

        // 系统消息事件
        this.socket.on('system_message', (data) => {
          console.log('收到系统消息:', data);
          this.options.onSystemMessage?.(data);
        });

        // 管理员广播事件
        this.socket.on('admin_broadcast', (data) => {
          console.log('收到管理员广播:', data);
          this.options.onBroadcast?.(data);
        });

        // 私信发送确认事件
        this.socket.on('private_message_sent', (data) => {
          console.log('私信发送确认:', data);
        });

        // 房间相关事件
        this.socket.on('room_joined', (data) => {
          console.log('已加入房间:', data);
        });

        this.socket.on('room_left', (data) => {
          console.log('已离开房间:', data);
        });

        this.socket.on('user_joined_room', (data) => {
          console.log('用户加入房间:', data);
        });

        this.socket.on('user_left_room', (data) => {
          console.log('用户离开房间:', data);
        });

        // 心跳检测
        this.socket.on('pong', (data) => {
          console.log('收到心跳响应:', data);
        });
        
        // 连接关闭时的回调
        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO连接已关闭:', reason);
          this.isConnecting = false;
          this.options.onDisconnect?.();  // 调用用户定义的回调
          
          // 如果不是主动断开且未超过最大重连次数，则尝试重连
          if (reason !== 'io client disconnect' && this.reconnectAttempts < this.options.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        });
        
        // 连接发生错误时的回调
        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO连接错误:', error);
          this.isConnecting = false;
          this.options.onError?.(error);  // 调用用户定义的错误处理回调
          reject(error);
        });

        // 重连尝试事件
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Socket.IO重连尝试 ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // 重连成功事件
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`Socket.IO重连成功，尝试次数: ${attemptNumber}`);
          this.reconnectAttempts = 0;
        });

        // 重连失败事件
        this.socket.on('reconnect_failed', () => {
          console.log('Socket.IO重连失败，已达到最大尝试次数');
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  

  // 安排重连任务
  // 在指定时间后尝试重新连接Socket.IO 
  private scheduleReconnect(): void {
    // 清除之前的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // 增加重连尝试次数
    this.reconnectAttempts++;
    console.log(`尝试重连Socket.IO (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    // 设置重连定时器
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Socket.IO重连失败:', error);
      });
    }, this.options.reconnectInterval);
  }


  // 发送消息到服务端
  emit(event: string, data?: any): void {
    // 检查连接状态，只有连接打开时才能发送消息
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO未连接，无法发送消息');
    }
  }

  
  //  发送ping消息（心跳检测）
  //  用于保持连接活跃，检测连接状态
  ping(): void {
    this.emit('ping');
  }


  //  发送广播消息
  //  向所有连接的客户端发送消息
  broadcast(message: string): void {
    this.emit('broadcast', { message });
  }

  
  /**
   * 发送私信消息
   * 向指定用户发送私信
   * @param targetUserId 目标用户ID
   * @param message 私信内容
   */
  sendPrivateMessage(targetUserId: string, message: string): void {
    this.emit('private_message', { 
      targetUserId, 
      message,
      type: 'text',
      timestamp: Date.now()
    });
  }

  /**
   * 加入房间
   * @param roomName 房间名称
   */
  joinRoom(roomName: string): void {
    this.emit('join_room', roomName);
  }

  /**
   * 离开房间
   * @param roomName 房间名称
   */
  leaveRoom(roomName: string): void {
    this.emit('leave_room', roomName);
  }

  /**
   * 发送房间消息
   * @param roomName 房间名称
   * @param message 消息内容
   */
  sendRoomMessage(roomName: string, message: string): void {
    this.emit('room_message', { roomName, message });
  }

  /**
   * 发送通话请求
   * @param targetUserId 目标用户ID
   * @param offer WebRTC offer
   * @param callType 通话类型
   */
  sendCallRequest(targetUserId: string, offer: RTCSessionDescriptionInit, callType: 'audio' | 'video'): void {
    this.emit('call_request', { 
      targetUserId, 
      offer, 
      callType,
      fromUserId: localStorage.getItem('userId'),
      fromUsername: localStorage.getItem('username')
    });
  }

  /**
   * 发送通话响应
   * @param targetUserId 目标用户ID
   * @param answer WebRTC answer
   * @param accepted 是否接受通话
   */
  sendCallResponse(targetUserId: string, answer?: RTCSessionDescriptionInit, accepted: boolean = true): void {
    this.emit('call_response', { 
      targetUserId, 
      answer, 
      accepted 
    });
  }

  /**
   * 发送ICE候选
   * @param targetUserId 目标用户ID
   * @param candidate ICE候选
   */
  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit): void {
    this.emit('ice_candidate', { 
      targetUserId, 
      candidate 
    });
  }

  /**
   * 结束通话
   * @param targetUserId 目标用户ID
   */
  endCall(targetUserId: string): void {
    this.emit('call_end', { targetUserId });
  }

  /**
   * 监听特定事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * 取消监听特定事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * 断开Socket.IO连接
   * 清理定时器并关闭连接
   */
  disconnect(): void {
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭Socket.IO连接
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 获取Socket.IO连接状态
   * @returns boolean 连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 获取Socket.IO实例
   * @returns Socket | null Socket.IO实例
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 全局Socket.IO客户端实例，用于单例模式管理
let globalSocketIOClient: SocketIOClient | null = null;

/**
 * 创建Socket.IO客户端实例
 * 如果已存在实例，会先断开旧连接再创建新实例
 * @param options Socket.IO配置选项
 * @returns SocketIOClient 客户端实例
 */
export const createSocketIOClient = (options: SocketIOOptions): SocketIOClient => {
  // 如果已存在全局实例，先断开连接
  if (globalSocketIOClient) {
    globalSocketIOClient.disconnect();
  }
  
  // 创建新的Socket.IO客户端实例
  globalSocketIOClient = new SocketIOClient(options);
  return globalSocketIOClient;
};

/**
 * 获取全局Socket.IO客户端实例
 * @returns SocketIOClient | null 客户端实例或null
 */
export const getSocketIOClient = (): SocketIOClient | null => {
  return globalSocketIOClient;
};

/**
 * 断开全局Socket.IO连接
 * 清理全局实例引用
 */
export const disconnectSocketIO = (): void => {
  if (globalSocketIOClient) {
    globalSocketIOClient.disconnect();
    globalSocketIOClient = null;
  }
};

export default SocketIOClient; 