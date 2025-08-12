import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSocketIOClient, getSocketIOClient, disconnectSocketIO } from '../utils/socketio'
import tokenManager from '../utils/tokenManager'
import '../styles/chat.scss'
import { useParams } from 'react-router-dom'
import { UserService } from '../api/userService'
import { MessageService } from '../api/messageService'
// 导入emoji
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { SmileOutline, AddCircleOutline, FolderOutline, PictureOutline, CameraOutline, AudioOutline, VideoOutline } from 'antd-mobile-icons'
import { Button } from 'antd-mobile'
import TextField from '@mui/material/TextField';
// 导入音视频通话组件
import VideoCall from '../components/VideoCall'
import '../styles/videoCall.scss'

export default function Chat() {
    // 路由跳转
    const toNav = useNavigate()
    // 表情
    let [emoFlag, setEmo] = useState(false)
    // more
    let [moreFlag, setMore] = useState(false)
    // 获取目标用户id
    const { targetUserId } = useParams()
    console.log('====================================');
    console.log(targetUserId, '用户id');
    console.log('====================================');
    // token
    const token = localStorage.getItem('token')
    // 用户id
    const [userId, setUserId] = useState<any>(null)
    let [targetUser, setTargetUser] = useState<any>(null)
    // 消息列表
    const [messages, setMessages] = useState<any[]>([])
    // 输入消息
    const [inputMessage, setInputMessage] = useState('')
    // 是否连接
    const [isConnected, setIsConnected] = useState(false)
    // 用户登录状态
    const [isUserStatus, setIsUserStatus] = useState(false)
    // Socket.IO 客户端
    const socketIOClientRef = useRef<any>(null)
    // 音视频通话状态
    const [isInCall, setIsInCall] = useState(false)
    // 通话类型
    const [callType, setCallType] = useState<'audio' | 'video'>('audio')
    // 来电信息
    const [incomingCallInfo, setIncomingCallInfo] = useState<{
        isIncoming: boolean;
        offer: RTCSessionDescriptionInit | null;
    }>({
        isIncoming: false,
        offer: null
    })


    //通过检查 localStorage 中的 token 来判断用户是否已登录
    const checkAuthStatus = (): boolean => {
        if (!tokenManager.isAuthenticated()) {
            setIsUserStatus(false)
            return false
        }

        setIsUserStatus(true)
        return true
    }

    // 获取用户信息
    const getUserInfo = async () => {
        try {
            const userInfo = await UserService.getUserInfo(targetUserId as string)
            console.log('获取到的目标用户信息:', userInfo)
            setTargetUser(userInfo)
            return userInfo
        } catch (error) {
            console.error('获取目标用户信息失败:', error)
            // 如果获取失败，设置默认用户信息
            setTargetUser({
                _id: targetUserId,
                username: '未知用户',
                nickname: '未知用户',
                avatar: '/uploads/default-avatar.png'
            })
            return null
        }
    }

    // 判断消息是否为自己发送的
    const isOwnMessage = (message: any): boolean => {
        if (!message.data?.userId || !userId) {
            return false
        }
        return message.data.userId === userId
    }

    // 判断消息是否应该显示在当前聊天中（只显示当前用户和目标用户之间的消息）
    const shouldShowMessage = (message: any): boolean => {
        if (!userId || !targetUserId) {
            return false
        }

        // 检查消息是否来自当前用户或目标用户
        const messageFromUserId = message.data?.userId || message.from
        const messageToUserId = message.data?.targetUserId || message.to

        return (
            (messageFromUserId === userId && messageToUserId === targetUserId) ||
            (messageFromUserId === targetUserId && messageToUserId === userId)
        )
    }

    // 连接 Socket.IO 的函数
    const connectSocketIO = async () => {
        // 检查用户登录状态
        if (!checkAuthStatus()) {
            console.log('用户未登录，无法连接 Socket.IO')
            return
        }

        try {
            // 从 localStorage 获取 token
            const token = localStorage.getItem('token')
            if (!token) {
                console.error('未找到认证 token')
                return
            }

            // 创建 Socket.IO 客户端
            const socketIOClient = createSocketIOClient({
                url: 'http://localhost:9527', // Socket.IO 服务器地址
                token: token,
                onConnect: () => {
                    console.log('Socket.IO 连接已建立')
                    setIsConnected(true)
                },
                // 收到广播消息
                onBroadcast: (data: any) => {
                    console.log('收到广播消息:', data)
                    // 私聊中不显示广播消息
                },
                // 收到私信
                onPrivateMessage: (data: any) => {
                    console.log('收到私信:', data)
                    // 只显示与当前目标用户相关的私信
                    if (data.from === targetUserId || data.to === targetUserId) {
                        const newMessage = {
                            _id: data.messageId || `temp_${Date.now()}`,
                            data: {
                                message: data.message,
                                username: data.fromUsername || '未知用户',
                                timestamp: data.timestamp || Date.now(),
                                userId: data.from,
                                targetUserId: data.to || targetUserId,
                                messageId: data.messageId,
                                type: data.type || 'text',
                                isRead: false
                            }
                        }
                        
                        setMessages(prev => {
                            // 检查是否已存在相同ID的消息
                            const exists = prev.some(msg => msg._id === newMessage._id)
                            if (!exists) {
                                return [...prev, newMessage]
                            }
                            return prev
                        })
                    }
                },
                // 断开连接
                onDisconnect: () => {
                    console.log('Socket.IO 连接已关闭')
                    setIsConnected(false)
                },
                // 连接错误
                onError: (error: Error) => {
                    console.error('Socket.IO 连接错误:', error)
                    setIsConnected(false)
                },
                reconnectInterval: 3000,
                maxReconnectAttempts: 5
            })

            socketIOClientRef.current = socketIOClient

            // 建立连接
            await socketIOClient.connect()

            // 添加音视频通话事件监听器
            const socket = socketIOClient.getSocket()
            if (socket) {
                // 处理来电事件
                const handleIncomingCall = (data: any) => {
                    console.log('收到来电:', data)
                    // 设置通话类型和状态
                    setCallType(data.callType || 'audio')
                    setIncomingCallInfo({
                        isIncoming: true,
                        offer: data.offer
                    })
                    // 存储来电者信息
                    setTargetUser(data.fromUser)
                    setIsInCall(true)
                }

                // 处理通话响应事件
                const handleCallResponse = (data: any) => {
                    console.log('收到通话响应:', data)
                    // 如果对方拒绝通话，结束通话
                    if (!data.accepted) {
                        setIsInCall(false)
                    }
                }

                // 处理ICE候选事件
                const handleIceCandidate = (data: any) => {
                    console.log('收到ICE候选:', data)
                    // ICE候选处理在VideoCall组件中进行
                }

                // 处理通话结束事件
                const handleCallEnd = (data: any) => {
                    console.log('通话结束:', data)
                    setIsInCall(false)
                }

                // 注册事件监听器
                socket.on('incoming_call', handleIncomingCall)
                socket.on('call_response', handleCallResponse)
                socket.on('ice_candidate', handleIceCandidate)
                socket.on('call_end', handleCallEnd)

                // 组件卸载时清理事件监听器
                return () => {
                    socket.off('incoming_call', handleIncomingCall)
                    socket.off('call_response', handleCallResponse)
                    socket.off('ice_candidate', handleIceCandidate)
                    socket.off('call_end', handleCallEnd)
                }
            }
        } catch (error) {
            console.error('连接 Socket.IO 失败:', error)
        }
    }

    // 发送私信消息
    const sendMessage = () => {
        if (!inputMessage.trim() || !socketIOClientRef.current || !targetUserId) return

        const messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const timestamp = Date.now()

        // 发送私信而不是广播
        socketIOClientRef.current.sendPrivateMessage(targetUserId, inputMessage)

        // 立即在本地添加发送的消息
        const newMessage = {
            _id: messageId,
            data: {
                message: inputMessage,
                timestamp: timestamp,
                userId: userId,
                targetUserId: targetUserId,
                type: 'text',
                isRead: false,
                username: '我' // 发送者显示为"我"
            }
        }

        setMessages(prev => [...prev, newMessage])
        setInputMessage('')
    }

    // 处理回车键发送消息
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // 阻止默认行为
            e.preventDefault()
            // 发送消息
            sendMessage()
        }
    }

    // 发起语音通话
    const handleAudioCall = async () => {
        if (!targetUserId || !isUserStatus) {
            alert('请先登录后再发起通话')
            return
        }

        try {
            // 立即申请音频权限
            console.log('正在申请音频权限...')
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            })
            console.log('音频权限申请成功')

            // 立即停止流，避免占用设备
            stream.getTracks().forEach(track => track.stop())

            // 设置通话类型和状态
            setCallType('audio')
            setIncomingCallInfo({
                isIncoming: false,
                offer: null
            })
            setIsInCall(true)
        } catch (error) {
            console.error('申请音频权限失败:', error)
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('需要麦克风权限才能进行语音通话，请在浏览器设置中允许访问麦克风')
                } else if (error.name === 'NotFoundError') {
                    alert('未找到麦克风设备，请检查设备连接')
                } else {
                    alert(`申请音频权限失败: ${error.message}`)
                }
            } else {
                alert('申请音频权限失败，请检查设备权限设置')
            }
        }
    }

    // 发起视频通话
    const handleVideoCall = async () => {
        if (!targetUserId || !isUserStatus) {
            alert('请先登录后再发起通话')
            return
        }

        try {
            // 立即申请音视频权限
            console.log('正在申请音视频权限...')
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            console.log('音视频权限申请成功')

            // 立即停止流，避免占用设备
            stream.getTracks().forEach(track => track.stop())

            // 设置通话类型和状态
            setCallType('video')
            setIncomingCallInfo({
                isIncoming: false,
                offer: null
            })
            setIsInCall(true)
        } catch (error) {
            console.error('申请音视频权限失败:', error)
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('需要摄像头和麦克风权限才能进行视频通话，请在浏览器设置中允许访问摄像头和麦克风')
                } else if (error.name === 'NotFoundError') {
                    alert('未找到摄像头或麦克风设备，请检查设备连接')
                } else if (error.name === 'NotReadableError') {
                    alert('摄像头或麦克风被其他应用占用，请关闭其他应用后重试')
                } else {
                    alert(`申请音视频权限失败: ${error.message}`)
                }
            } else {
                alert('申请音视频权限失败，请检查设备权限设置')
            }
        }
    }

    // 结束通话
    const handleCallEnd = () => {
        setIsInCall(false)
        setIncomingCallInfo({
            isIncoming: false,
            offer: null
        })
    }

    // 监听 localStorage 变化，实时更新登录状态
    useEffect(() => {
        // 获取当前用户信息
        const token = tokenManager.getAccessToken()
        if (token) {
            // 通过verifyToken获取用户信息
            const getUserData = async () => {
                try {
                    const userInfo = await tokenManager.verifyToken()
                    if (userInfo.code === 200 && userInfo.data && userInfo.data.userId) {
                        setUserId(userInfo.data.userId)
                        console.log('从token验证获取到用户ID:', userInfo.data.userId)
                    }
                } catch (error) {
                    console.error('验证token失败:', error)
                }
            }
            
            getUserData()
            // 获取目标用户信息
            getUserInfo()
        }

        const handleStorageChange = () => {
            checkAuthStatus()
        }

        // 监听 storage 事件（跨标签页同步）
        window.addEventListener('storage', handleStorageChange)

        // 初始检查登录状态
        checkAuthStatus()

        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    useEffect(() => {
        // 获取目标用户信息和历史消息
        const initializeChat = async () => {
            try {
                if (targetUserId) {
                    console.log('准备获取用户信息，targetUserId:', targetUserId, '类型:', typeof targetUserId);
                    const userData = await UserService.getUserInfo(targetUserId as string);
                    console.log('获取到的用户信息:', userData);
                    setTargetUser(userData);

                    // 获取历史消息
                    if (isUserStatus) {
                        try {
                            const historyResponse = await MessageService.getMessageHistory(targetUserId as string);
                            console.log('获取到的历史消息:', historyResponse);
                            
                            if (historyResponse && historyResponse.messages) {
                                const formattedMessages = historyResponse.messages.map(msg => ({
                                    _id: msg._id || msg.messageId,
                                    data: {
                                        message: msg.content,
                                        username: msg.sender?.username || '未知用户',
                                        timestamp: new Date(msg.createdAt).getTime(),
                                        userId: msg.sender?._id,
                                        targetUserId: msg.receiver?._id,
                                        messageId: msg.messageId,
                                        type: msg.type || 'text',
                                        isRead: msg.isRead || false
                                    }
                                }));
                                setMessages(formattedMessages);
                            }
                        } catch (error) {
                            console.error('获取历史消息失败:', error);
                            // 设置空消息列表
                            setMessages([]);
                        }
                    }
                }
            } catch (error) {
                console.error('获取目标用户信息失败:', error);
            }
        };
        // 初始化聊天
        initializeChat();

        // 只有在用户已登录时才连接 Socket.IO
        if (isUserStatus) {
            connectSocketIO()
        }

        // 组件卸载时断开连接
        return () => {
            if (socketIOClientRef.current) {
                socketIOClientRef.current.disconnect()
            }
        }
    }, [isUserStatus, targetUserId])
    // 创建 ref 用于关联 TextField 组件，指定类型为 HTMLInputElement 以修复 TypeScript 错误
    const inputRef = useRef<HTMLInputElement>(null);

    // 监听用户登录状态和连接状态变化，自动聚焦输入框
    useEffect(() => {
        // 只有当用户已登录且已连接时才自动聚焦输入框
        if (inputRef.current && isUserStatus && isConnected) {
            // 延迟 100ms 确保组件完全渲染后再聚焦，避免聚焦失败
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isUserStatus, isConnected]); // 依赖项：当登录状态或连接状态改变时重新执行
    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3><Button onClick={() => toNav(-1)}>返回</Button>{targetUser ? `与 ${targetUser.nickname} 聊天中` : '聊天'}</h3>
                <div className="connection-status">
                    {!isUserStatus ? (
                        <span className="disconnected">未登录</span>
                    ) : isConnected ? (
                        <span className="connected">已连接</span>
                    ) : (
                        <span className="disconnected">未连接</span>
                    )}
                </div>
            </div>

            <div className="chat-box">
                {!isUserStatus ? (
                    <div className="no-messages">请先登录后再使用聊天功能</div>
                ) : !targetUserId ? (
                    <div className="no-messages">请选择聊天对象</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">暂无消息，开始聊天吧！</div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = isOwnMessage(message)
                        return (
                            <div key={message._id || index} className='msg_line'>
                                {isOwn ? <div className='own-message'>
                                    <div className="message-content">
                                        {message.data?.message || '消息内容为空'}
                                    </div>
                                    <div className="message-sender">
                                        我
                                    </div>
                                </div>
                                    : <div className='other-message'>
                                        <div className="message-sender">
                                            {message.data?.username || '未知用户'}
                                        </div>
                                        <div className="message-content">
                                            {message.data?.message || '消息内容为空'}
                                        </div>
                                    </div>}
                            </div>
                        )
                    })
                )}
            </div>

            <div className="chat-input">
                {/* <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={!isUserStatus ? "请先登录..." : "输入消息..."}
                    disabled={!isUserStatus || !isConnected}
                /> */}
                <TextField
                    placeholder={!isUserStatus ? "请先登录..." : "输入消息..."}
                    variant="outlined"
                    // 通过 inputRef 绑定 ref（注意：MUI 中用 inputRef 而非 ref）
                    inputRef={inputRef}
                    fullWidth
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isUserStatus || !isConnected}
                    style={{ width: 200 }}
                    // 自动聚焦：当用户已登录且已连接时自动获取焦点
                    autoFocus={isUserStatus && isConnected}
                    // 输入框的额外属性配置
                    inputProps={{
                        autoComplete: 'off',        // 关闭自动完成功能
                        autoCorrect: 'off',         // 关闭自动纠错功能
                        autoCapitalize: 'sentences', // 句子首字母自动大写
                        enterKeyHint: 'send',       // 移动端回车键显示为"发送"
                        inputMode: 'text'           // 确保在移动设备上弹出文本键盘
                    }}
                />
                <div className='chat-input-left'>
                    {/* 表情 */}
                    <SmileOutline fontSize={30} onClick={() => {
                        setEmo(!emoFlag)
                    }} />
                    {/* 更多 */}
                    <AddCircleOutline fontSize={30} onClick={() => {
                        setMore(!moreFlag)
                    }} />
                    <button
                        onClick={sendMessage}
                        disabled={!isUserStatus || !isConnected || !inputMessage.trim()}
                    >
                        发送
                    </button>
                </div>
            </div>
            {/* 更多 */}
            {moreFlag ? <div className='more'>
                <FolderOutline fontSize={30} className='more_item' />
                <PictureOutline fontSize={30} className='more_item' />
                <CameraOutline fontSize={30} className='more_item' />
                <AudioOutline fontSize={30} className='more_item' onClick={handleAudioCall} />
                <VideoOutline fontSize={30} className='more_item' onClick={handleVideoCall} />
            </div> : null}
            {/* 表情 */}
            {emoFlag ? <Picker data={data} onEmojiSelect={(e: any) => {
                console.log(e, 'emoji');
                setInputMessage(prev => prev + e.native)
            }} /> : null}

            {/* 音视频通话组件 */}
            {isInCall && targetUserId && (
                <VideoCall
                    targetUserId={targetUserId as string}
                    targetUsername={targetUser?.nickname || targetUser?.username || '未知用户'}
                    callType={callType}
                    onCallEnd={handleCallEnd}
                    isIncoming={incomingCallInfo.isIncoming}
                    incomingOffer={incomingCallInfo.offer}
                />
            )}

        </div>
    )
}
