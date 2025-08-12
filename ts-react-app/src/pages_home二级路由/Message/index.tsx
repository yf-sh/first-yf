import React, { useState, useEffect } from 'react'
import './index.scss'
import img1 from '../../assets/images/1.gif'
// 导入socketio
import { createSocketIOClient, getSocketIOClient, disconnectSocketIO } from '../../utils/socketio'
// 导入token工具
import tokenManager from '../../utils/tokenManager'
import { UserService } from '../../api/userService'
import { useNavigate } from 'react-router-dom'
import { MessageService } from '../../api/messageService'
import type { Conversation } from '../../api/messageService'
import axios from 'axios'



// 通知类型
interface Notification {
  id: string
  type: 'system' | 'like' | 'comment' | 'follow'
  title: string
  content: string
  isRead: boolean
  createdAt: string
  avatar?: string
}

export default function Message() {
  // 路由跳转
  const toNav = useNavigate();
  // token - 使用正确的token键名
  const token = localStorage.getItem('token') || localStorage.getItem('refreshToken')
  // 获取当前用户
  let [userId,setUserId] = useState<string>('')
  // 标签切换
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications')
  // 通知列表
  const [notifications, setNotifications] = useState<Notification[]>([])
  // 私信会话列表
  const [conversations, setConversations] = useState<Conversation[]>([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 连接状态
  const [isConnected, setIsConnected] = useState(false)
  // 错误状态
  const [error, setError] = useState<string | null>(null)
  // 连接重试次数
  const [retryCount, setRetryCount] = useState(0)



  // 清理重复通知的函数
  const cleanDuplicateNotifications = (notifications: Notification[]): Notification[] => {
    const seen = new Set()
    return notifications.filter(notification => {
      // 使用内容和类型作为去重依据
      const key = `${notification.type}_${notification.content}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  // 获取系统消息历史记录
  const fetchSystemMessages = async (userId: string) => {
    try {
      console.log('开始获取系统消息历史记录...')
      
      // 调用API获取系统消息
      const response = await MessageService.getSystemMessages(userId)
      console.log('API返回的系统消息数据:', response)
      
      if (response && response.messages) {
        // 将系统消息转换为通知格式
        const systemNotifications: Notification[] = response.messages.map((msg: any) => ({
          id: msg.messageId || msg._id,
          type: msg.type,
          title: msg.title || '系统通知',
          content: msg.content,
          isRead: msg.isRead || false,
          createdAt: new Date(msg.createdAt).toLocaleString()
        }))
        
        setNotifications(prev => {
          // 过滤掉现有的系统通知，避免重复
          const nonSystemNotifications = prev.filter(n => n.type !== 'system')
          // 添加新的系统消息
          return [...systemNotifications, ...nonSystemNotifications]
        })
        
        console.log(`成功加载 ${systemNotifications.length} 条系统消息`)
      }
    } catch (error) {
      console.error('获取系统消息失败:', error)
      setNotifications([])
     
    }
  }

  // 获取私信会话列表
  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true)
      console.log('开始获取私信会话列表...')
      
      const response = await MessageService.getConversations(1, 10, userId)
      console.log('API返回的会话数据:', response)
      
      if (response && response.conversations) {
        setConversations(response.conversations)
        console.log(`成功加载 ${response.conversations.length} 个会话`)
      } else {
        console.warn('API返回数据格式异常:', response)
        setConversations([])
      }
    } catch (error) {
      console.error('获取私信会话列表失败:', error)
      // 显示用户友好的错误信息
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  // 连接 Socket.IO 的函数
  const connectSocketIO = async () => {
    // 检查用户登录状态和token
    if (!token) {
      const errorMsg = '未找到token，无法连接 Socket.IO'
      console.log(errorMsg)
      setError(errorMsg)
      return
    }

    try {
      // 清除之前的错误
      setError(null)
      
      // 验证token并获取用户信息
      const userInfo = await tokenManager.verifyToken()
      if (userInfo.code !== 200) {
        const errorMsg = 'token验证失败，无法连接 Socket.IO'
        console.log(errorMsg)
        setError(errorMsg)
        return
      }

      console.log('token验证成功，开始连接Socket.IO...')

      // 创建 Socket.IO 客户端
      const socketIOClient = createSocketIOClient({
        url: 'http://localhost:9527', // Socket.IO 服务器地址
        token: token,
        onConnect: () => {
          console.log('Socket.IO 连接已建立')
          setIsConnected(true)
          setError(null) // 连接成功时清除错误
          setRetryCount(0) // 重置重试次数
        },
        onPrivateMessage: (data: any) => {
          console.log('收到私信:', data)
          // 更新私信会话列表
          handleNewMessage(data)
        },
        onBroadcast: (data: any) => {
          console.log('收到广播消息:', data)
          // 添加系统通知，避免重复
          setNotifications(prev => {
            const broadcastId = `broadcast_${data.timestamp || Date.now()}`
            // 检查是否已经存在相同的广播消息
            const exists = prev.some(n => n.id === broadcastId)
            if (!exists) {
              const newNotification: Notification = {
                id: broadcastId,
                type: 'system',
                title: '系统广播',
                content: data.message,
                isRead: false,
                createdAt: new Date(data.timestamp).toLocaleString()
              }
              return [newNotification, ...prev]
            }
            return prev
          })
        },
        // 添加系统消息监听
        onSystemMessage: (data: any) => {
          console.log('收到系统消息:', data)
          // 添加系统通知到通知列表，避免重复
          setNotifications(prev => {
            const messageId = data.messageId || `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            // 检查是否已经存在相同的消息
            const exists = prev.some(n => n.id === messageId)
            if (!exists) {
              const newNotification: Notification = {
                id: messageId,
                type: 'system',
                title: data.title || '系统通知',
                content: data.message,
                isRead: false,
                createdAt: new Date(data.timestamp).toLocaleString()
              }
              return [newNotification, ...prev]
            }
            return prev
          })
        },
        onDisconnect: () => {
          console.log('Socket.IO 连接已关闭')
          setIsConnected(false)
          setError('连接已断开，请检查网络状态')
        },
        onError: (error: Error) => {
          console.error('Socket.IO 连接错误:', error)
          setIsConnected(false)
          setError(`连接错误: ${error.message}`)
          setRetryCount(prev => prev + 1)
        },
        reconnectInterval: 3000,
        maxReconnectAttempts: 5
      })

      // 建立连接
      await socketIOClient.connect()
    } catch (error) {
      const errorMsg = `连接 Socket.IO 失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error(errorMsg)
      setError(errorMsg)
      setRetryCount(prev => prev + 1)
    }
  }

  // 处理新消息，更新会话列表
  const handleNewMessage = (data: any) => {
    console.log('处理新消息:', data)
    
    const senderId = data.from
    const senderName = data.fromUsername
    const messageContent = data.message
    const timestamp = new Date(data.timestamp)
    const isOutgoing = senderId === userId // 判断是否为发送的消息

    setConversations(prev => {
      console.log('当前会话列表:', prev)
      
      // 确定对话的另一方用户ID
      const otherUserId = isOutgoing ? data.to : senderId
      const otherUserName = isOutgoing ? data.toUsername || '未知用户' : senderName
      
      // 查找是否已存在该用户的会话
      const existingIndex = prev.findIndex(conv => conv.userId === otherUserId)
      
      if (existingIndex >= 0) {
        // 更新现有会话
        const updatedConversations = [...prev]
        updatedConversations[existingIndex] = {
          ...updatedConversations[existingIndex],
          lastMessage: {
            content: messageContent,
            type: 'text',
            timestamp: timestamp,
            isOutgoing: isOutgoing
          },
          unreadCount: isOutgoing 
            ? updatedConversations[existingIndex].unreadCount // 发送的消息不增加未读数
            : updatedConversations[existingIndex].unreadCount + 1, // 接收的消息增加未读数
          totalMessages: updatedConversations[existingIndex].totalMessages + 1
        }
        
        // 将该会话移到顶部
        const conversation = updatedConversations.splice(existingIndex, 1)[0]
        console.log('更新现有会话:', conversation)
        return [conversation, ...updatedConversations]
      } else {
        // 创建新会话
        const newConversation: Conversation = {
          userId: otherUserId,
          username: otherUserName,
          nickname: otherUserName,
          avatar: '/uploads/default-avatar.png',
          lastMessage: {
            content: messageContent,
            type: 'text',
            timestamp: timestamp,
            isOutgoing: isOutgoing
          },
          unreadCount: isOutgoing ? 0 : 1, // 发送的消息未读数为0
          totalMessages: 1
        }
        
        console.log('创建新会话:', newConversation)
        return [newConversation, ...prev]
      }
    })
  }
// 通过token获取当前用户id
const getUserId = async () => {
    try {
      let userInfo = await tokenManager.verifyToken()
      if (userInfo.code === 200 && userInfo.data && userInfo.data.userId) {
        return userInfo.data.userId
      } else {
        console.error('获取用户ID失败:', userInfo)
        return ''
      }
    } catch (error) {
      console.error('验证token时出错:', error)
      return ''
    }
  }

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // 检查用户是否已登录
        if (!tokenManager.isAuthenticated()) {
          console.log('用户未登录，跳转到登录页面')
          toNav('/login')
          return
        }

        // 通过token获取当前用户id
        let currentUserId = await getUserId()
        if (!currentUserId) {
          console.error('无法获取用户ID，跳转到登录页面')
          toNav('/login')
          return
        }

        console.log('获取到用户ID:', currentUserId)
        setUserId(currentUserId)

        // 获取私信会话列表
        await fetchConversations(currentUserId)

        // 获取系统消息历史记录
        await fetchSystemMessages(currentUserId)

        // 连接 Socket.IO
        await connectSocketIO()
      } catch (error) {
        console.error('初始化用户信息失败:', error)
        toNav('/login')
      }
    }

    fetchUserInfo()

    // 组件卸载时断开连接
    return () => {
      disconnectSocketIO()
    }
  }, [])



  // 清理通知列表中的重复项
  useEffect(() => {
    if (notifications.length > 0) {
      const cleanedNotifications = cleanDuplicateNotifications(notifications)
      if (cleanedNotifications.length !== notifications.length) {
        console.log(`清理重复通知: ${notifications.length} -> ${cleanedNotifications.length}`)
        setNotifications(cleanedNotifications)
      }
    }
  }, [notifications])

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '🔔'
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      case 'follow':
        return '👤'
      default:
        return '📢'
    }
  }

  // 获取通知类型名称
  const getNotificationTypeName = (type: string) => {
    switch (type) {
      case 'system':
        return '系统'
      case 'like':
        return '点赞'
      case 'comment':
        return '评论'
      case 'follow':
        return '关注'
      default:
        return '其他'
    }
  }

  // 格式化时间
  const formatTime = (timeString: string | Date) => {
    const date = typeof timeString === 'string' ? new Date(timeString) : timeString
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString()
    }
  }

  // 标记通知为已读
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  // 点击私信会话，跳转到聊天页面
  const handleConversationClick = (conversation: Conversation) => {
    // 跳转到与用户的私信聊天页面
    toNav(`/chat/${conversation.userId}`)
  }

  // 刷新会话列表
  const handleRefreshConversations = async () => {
    if (!userId) {
      console.error('用户ID未设置，无法刷新会话')
      return
    }
    
    try {
      setLoading(true)
      await fetchConversations(userId)
      console.log('会话列表刷新成功')
    } catch (error) {
      console.error('刷新会话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 刷新系统消息
  const handleRefreshSystemMessages = async () => {
    if (!userId) {
      console.error('用户ID未设置，无法刷新系统消息')
      return
    }
    
    try {
      await fetchSystemMessages(userId)
      console.log('系统消息刷新成功')
    } catch (error) {
      console.error('刷新系统消息失败:', error)
    }
  }

  // 重新连接Socket.IO
  const handleReconnectSocket = async () => {
    try {
      console.log('尝试重新连接Socket.IO...')
      setError(null) // 清除之前的错误
      await connectSocketIO()
    } catch (error) {
      console.error('重新连接Socket.IO失败:', error)
      const errorMsg = `重新连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      setError(errorMsg)
    }
  }

  return (
    <div className="message-container">
      {/* 标题栏 */}
      <div className="message-header">
        <h2>消息中心</h2>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">● 在线</span>
          ) : (
            <span className="disconnected">○ 离线</span>
          )}
          {error && (
            <span 
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#ff4d4f',
                color: 'white',
                borderRadius: '4px',
                display: 'inline-block',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={error}
            >
              ⚠️ {error}
            </span>
          )}
          {retryCount > 0 && (
            <span 
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#faad14',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              重试: {retryCount}
            </span>
          )}
       
          <button 
            onClick={handleRefreshConversations}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            刷新会话
          </button>
          <button 
            onClick={handleRefreshSystemMessages}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              background: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新系统消息
          </button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="message-tabs">
        <div 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <span className="tab-icon">🔔</span>
          <span className="tab-text">通知</span>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="badge">{notifications.filter(n => !n.isRead).length}</span>
          )}
        </div>
        <div 
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <span className="tab-icon">💬</span>
          <span className="tab-text">私信</span>
          {conversations.filter(c => c.unreadCount > 0).length > 0 && (
            <span className="badge">{conversations.filter(c => c.unreadCount > 0).length}</span>
          )}
        </div>
      </div>
      {/* 内容区域 */}
      <div className="message-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : (
          <>
            

            {/* 通知列表 */}
            {activeTab === 'notifications' && (
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>暂无通知</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-header">
                          <span className="notification-type">
                            {getNotificationTypeName(notification.type)}
                          </span>
                          <span className="notification-time">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-text">{notification.content}</div>
                      </div>
                      {!notification.isRead && <div className="unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 私信会话列表 */}
            {activeTab === 'messages' && (
              <div className="messages-list">
                {conversations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    
                    <p>暂无私信</p>
                  </div>
                ) : (
                  
                  conversations.map(conversation => (
                    
                    <div 
                      key={conversation.userId} 
                      className={`message-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      
                      <div className="message-avatar">
                        <img 
                          src={img1}
                          alt=''
                          onError={(e) => {
                            e.currentTarget.src = '/uploads/default-avatar.png'
                          }}
                        />
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">
                            {conversation.nickname || conversation.username}
                          </span>
                          <span className="message-time">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="message-text">
                          {conversation.lastMessage.isOutgoing ? '我: ' : ''}
                          {conversation.lastMessage.content}
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="unread-badge">{conversation.unreadCount}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
} 