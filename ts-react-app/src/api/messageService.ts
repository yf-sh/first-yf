import { request } from './api';

// 消息相关接口类型定义
// 消息类型
export interface Message {
  _id: string;
  messageId: string;
  sender: {
    _id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    username: string;
    nickname?: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'recalled' | 'deleted';
  metadata?: any;
  replyTo?: Message;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 创建消息请求
export interface CreateMessageRequest {
  receiver: string;
  content: string;
  type?: string;
  metadata?: any;
}

// 消息历史响应
export interface MessageHistoryResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// 消息统计
export interface MessageStats {
  totalMessages: number;
  unreadCount: number;
  todayMessages: number;
}

// 私信会话类型
export interface Conversation {
  userId: string;
  username: string;
  nickname?: string;
  avatar?: string;
  lastMessage: {
    content: string;
    type: string;
    timestamp: Date;
    isOutgoing: boolean;
  };
  unreadCount: number;
  totalMessages: number;
}

// 私信会话列表响应
export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    userId: string;
    hasMore: boolean;
  };
}

// 消息服务类
export class MessageService {
  // 获取用户的私信会话列表
  static async getConversations(page = 1, limit = 20, userId: string): Promise<ConversationListResponse> {
    try {
      const response = await request.get<ConversationListResponse>('/messages/conversations', {
        params: { page, limit, userId }
      });
      return response.data;
    } catch (error) {
      console.error('获取私信会话列表失败:', error);
      throw error;
    }
  }

  // 获取与指定用户的消息历史
  static async getMessageHistory(targetUserId: string, page = 1, limit = 50): Promise<MessageHistoryResponse> {
    try {
      const response = await request.get<MessageHistoryResponse>(`/messages/history/${targetUserId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取消息历史失败:', error);
      throw error;
    }
  }

  // 获取系统消息
  static async getSystemMessages(userId: string, page = 1, limit = 20): Promise<MessageHistoryResponse> {
    try {
      const response = await request.get<MessageHistoryResponse>('/messages/system', {
        params: { userId, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取系统消息失败:', error);
      throw error;
    }
  }

  // 获取未读消息数量
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await request.get<{ unreadCount: number }>('/messages/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      throw error;
    }
  }

  // 创建新消息
  static async createMessage(messageData: CreateMessageRequest): Promise<Message> {
    try {
      const response = await request.post<Message>('/messages/create', messageData);
      return response.data;
    } catch (error) {
      console.error('创建消息失败:', error);
      throw error;
    }
  }

  // 标记消息为已读
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await request.post(`/messages/mark-read/${messageId}`);
    } catch (error) {
      console.error('标记消息已读失败:', error);
      throw error;
    }
  }

  // 撤回消息
  static async recallMessage(messageId: string): Promise<void> {
    try {
      await request.post(`/messages/recall/${messageId}`);
    } catch (error) {
      console.error('撤回消息失败:', error);
      throw error;
    }
  }

  // 删除消息
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await request.post(`/messages/${messageId}`);
    } catch (error) {
      console.error('删除消息失败:', error);
      throw error;
    }
  }

  // 获取消息统计信息
  static async getMessageStats(): Promise<MessageStats> {
    try {
      const response = await request.get<MessageStats>('/messages/stats');
      return response.data;
    } catch (error) {
      console.error('获取消息统计失败:', error);
      throw error;
    }
  }
}

export default MessageService; 