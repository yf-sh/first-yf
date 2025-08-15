
//  WebSocket消息接口
//  定义客户端与服务端之间传输的消息格式
 
interface WebSocketMessage {
  type: string;    // 消息类型，用于区分不同的消息处理逻辑
  data: any;       // 消息数据，可以是任意类型
}


//  WebSocket客户端配置选项接口
// 定义创建WebSocket连接时需要的参数

interface WebSocketOptions {
  url: string;                                    // WebSocket服务器地址
  token: string;                                  // JWT认证令牌
  onMessage?: (message: WebSocketMessage) => void; // 接收消息时的回调函数
  onOpen?: () => void;                           // 连接建立时的回调函数
  onClose?: () => void;                          // 连接关闭时的回调函数
  onError?: (error: Event) => void;              // 发生错误时的回调函数
  reconnectInterval?: number;                    // 重连间隔时间（毫秒）
  maxReconnectAttempts?: number;                 // 最大重连次数
}

  // WebSocket客户端类
  // 提供WebSocket连接管理、消息发送接收、自动重连等功能

class WebSocketClient {
  private ws: WebSocket | null = null;           // WebSocket连接实例
  private options: WebSocketOptions;             // 客户端配置选项
  private reconnectAttempts = 0;                 // 当前重连尝试次数
  private reconnectTimer: number | null = null;  // 重连定时器ID（浏览器环境返回number）
  private isConnecting = false;                  // 是否正在连接中


  // 构造函数

  constructor(options: WebSocketOptions) {
    // 合并默认配置和用户配置
    this.options = {
      reconnectInterval: 3000,      // 默认重连间隔3秒
      maxReconnectAttempts: 5,      // 默认最大重连5次
      ...options
    };
  }

  // 建立WebSocket连接
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果正在连接或已经连接，直接返回
      if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;
      
      try {
        // 构建WebSocket URL，将JWT token作为URL参数传递
        const wsUrl = new URL(this.options.url);
        wsUrl.searchParams.set('token', this.options.token);
        
        // 创建WebSocket连接实例
        this.ws = new WebSocket(wsUrl.toString());
        
        // 连接建立成功时的回调
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.isConnecting = false;
          this.reconnectAttempts = 0;  // 重置重连计数
          this.options.onOpen?.();     // 调用用户定义的回调
          resolve();
        };
        
        // 接收服务端消息时的回调
        this.ws.onmessage = (event) => {
          try {
            // 解析JSON格式的消息
            const message: WebSocketMessage = JSON.parse(event.data);
            this.options.onMessage?.(message);  // 调用用户定义的消息处理回调
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };
        
        // 连接关闭时的回调
        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code, event.reason);
          this.isConnecting = false;
          this.options.onClose?.();  // 调用用户定义的回调
          
          // 如果不是主动关闭（code !== 1000）且未超过最大重连次数，则尝试重连
          if (event.code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };
        
        // 连接发生错误时的回调
        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.isConnecting = false;
          this.options.onError?.(error);  // 调用用户定义的错误处理回调
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  
  //  安排重连任务
  //  在指定时间后尝试重新连接WebSocket
  private scheduleReconnect(): void {
    // 清除之前的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // 增加重连尝试次数
    this.reconnectAttempts++;
    console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    // 设置重连定时器
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket重连失败:', error);
      });
    }, this.options.reconnectInterval);
  }
 
  //  发送消息到服务端
  send(message: WebSocketMessage): void {
    // 检查连接状态，只有连接打开时才能发送消息
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));  // 将消息对象序列化为JSON字符串发送
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  
    // 发送ping消息（心跳检测）
    // 用于保持连接活跃，检测连接状态
  ping(): void {
    this.send({
      type: 'ping',
      data: { timestamp: Date.now() }  // 包含当前时间戳
    });
  }

 
    // 发送广播消息
    // 向所有连接的客户端发送消息
  broadcast(message: string): void {
    this.send({
      type: 'broadcast',
      data: { message }
    });
  }

 
    // 发送私信消息
    // 向指定用户发送私信
  sendPrivateMessage(targetUserId: string, message: string): void {
    this.send({
      type: 'private_message',
      data: { targetUserId, message }
    });
  }

  
  //  断开WebSocket连接
  //  清理定时器并关闭连接
  disconnect(): void {
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭WebSocket连接
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');  // 1000表示正常关闭
      this.ws = null;
    }
  }

 
  //  获取WebSocket连接状态
  getReadyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }


    // 检查WebSocket是否已连接
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 全局WebSocket客户端实例，用于单例模式管理
let globalWebSocketClient: WebSocketClient | null = null;


  // 创建WebSocket客户端实例
  // 如果已存在实例，会先断开旧连接再创建新实例
export const createWebSocketClient = (options: WebSocketOptions): WebSocketClient => {
  // 如果已存在全局实例，先断开连接
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
  }
  
  // 创建新的WebSocket客户端实例
  globalWebSocketClient = new WebSocketClient(options);
  return globalWebSocketClient;
};


  // 获取全局WebSocket客户端实例
export const getWebSocketClient = (): WebSocketClient | null => {
  return globalWebSocketClient;
};


  // 断开全局WebSocket连接
  // 清理全局实例引用
export const disconnectWebSocket = (): void => {
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
    globalWebSocketClient = null;
  }
};

export default WebSocketClient; 