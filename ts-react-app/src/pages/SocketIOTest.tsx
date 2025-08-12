import React, { useState, useEffect } from 'react'
import { createSocketIOClient, getSocketIOClient, disconnectSocketIO } from '../utils/socketio'
import { tokenUtils } from '../utils/tokenUtils'
import { useAuth } from '../hooks/useUser'
import '../styles/chat.scss'

export default function SocketIOTest() {
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('未连接')
  const { user: currentUser } = useAuth()

  // 检查认证状态
  const checkAuthStatus = (): boolean => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsAuthenticated(false)
      return false
    }

    if (tokenUtils.isTokenExpired()) {
      console.log('Token 已过期，清除本地存储')
      tokenUtils.clearAuth()
      setIsAuthenticated(false)
      return false
    }

    setIsAuthenticated(true)
    return true
  }

  // 连接 Socket.IO
  const connectSocketIO = async () => {
    if (!checkAuthStatus()) {
      console.log('用户未登录，无法连接 Socket.IO')
      setConnectionStatus('未登录')
      return
    }

    try {
      setConnectionStatus('连接中...')
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('未找到认证 token')
        setConnectionStatus('Token 无效')
        return
      }

      const socketIOClient = createSocketIOClient({
        url: 'http://localhost:9527',
        token: token,
        onConnect: () => {
          console.log('Socket.IO 连接已建立')
          setIsConnected(true)
          setConnectionStatus('已连接')
          addMessage('系统', 'Socket.IO 连接已建立', 'system')
        },
        onBroadcast: (data: any) => {
          console.log('收到广播消息:', data)
          addMessage(data.fromUsername || '广播', data.message, 'broadcast')
        },
        onPrivateMessage: (data: any) => {
          console.log('收到私信:', data)
          addMessage(data.fromUsername || '私信', data.message, 'private')
        },
        onUserConnected: (data: any) => {
          console.log('用户上线:', data)
          addMessage('系统', `${data.username} 已上线`, 'system')
        },
        onUserDisconnected: (data: any) => {
          console.log('用户下线:', data)
          addMessage('系统', `${data.username} 已下线`, 'system')
        },
        onDisconnect: () => {
          console.log('Socket.IO 连接已关闭')
          setIsConnected(false)
          setConnectionStatus('已断开')
          addMessage('系统', 'Socket.IO 连接已关闭', 'system')
        },
        onError: (error: Error) => {
          console.error('Socket.IO 连接错误:', error)
          setIsConnected(false)
          setConnectionStatus('连接错误')
          addMessage('系统', `连接错误: ${error.message}`, 'error')
        },
        reconnectInterval: 3000,
        maxReconnectAttempts: 5
      })

      await socketIOClient.connect()
    } catch (error) {
      console.error('连接 Socket.IO 失败:', error)
      setConnectionStatus('连接失败')
      addMessage('系统', `连接失败: ${error}`, 'error')
    }
  }

  // 添加消息到列表
  const addMessage = (sender: string, content: string, type: 'system' | 'broadcast' | 'private' | 'error' | 'sent') => {
    const newMessage = {
      id: Date.now(),
      sender,
      content,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, newMessage])
  }

  // 发送广播消息
  const sendBroadcast = () => {
    if (!inputMessage.trim() || !isConnected) return

    const socketIOClient = getSocketIOClient()
    if (socketIOClient) {
      socketIOClient.broadcast(inputMessage)
      addMessage('我', inputMessage, 'sent')
      setInputMessage('')
    }
  }

  // 发送私信
  const sendPrivateMessage = () => {
    if (!inputMessage.trim() || !isConnected) return

    const socketIOClient = getSocketIOClient()
    if (socketIOClient) {
      // 这里可以添加目标用户ID输入
      const targetUserId = 'test-user-id' // 示例用户ID
      socketIOClient.sendPrivateMessage(targetUserId, inputMessage)
      addMessage('我', `私信给 ${targetUserId}: ${inputMessage}`, 'sent')
      setInputMessage('')
    }
  }

  // 发送心跳
  const sendPing = () => {
    const socketIOClient = getSocketIOClient()
    if (socketIOClient) {
      socketIOClient.ping()
      addMessage('我', '发送心跳检测', 'system')
    }
  }

  // 处理回车键发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendBroadcast()
    }
  }

  useEffect(() => {
    checkAuthStatus()
    connectSocketIO()

    return () => {
      disconnectSocketIO()
    }
  }, [])

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Socket.IO 测试页面</h2>
        <div className="connection-status">
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="chat-box">
        {!isAuthenticated ? (
          <div className="no-messages">请先登录后再使用 Socket.IO 功能</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">暂无消息，等待连接...</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-sender">{message.sender}</div>
                <div className="message-text">{message.content}</div>
                <div className="message-time">{message.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={!isAuthenticated ? "请先登录..." : "输入消息..."}
          disabled={!isAuthenticated || !isConnected}
        />
        <button
          onClick={sendBroadcast}
          disabled={!isAuthenticated || !isConnected || !inputMessage.trim()}
        >
          广播
        </button>
        <button
          onClick={sendPrivateMessage}
          disabled={!isAuthenticated || !isConnected || !inputMessage.trim()}
        >
          私信
        </button>
        <button
          onClick={sendPing}
          disabled={!isAuthenticated || !isConnected}
        >
          心跳
        </button>
      </div>

      <div className="connection-info">
        <p>认证状态: {isAuthenticated ? '已登录' : '未登录'}</p>
        <p>连接状态: {connectionStatus}</p>
        <p>用户信息: {currentUser ? `${currentUser.username} (${currentUser.id})` : '未获取'}</p>
      </div>
    </div>
  )
} 