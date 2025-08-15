import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd-mobile';
import '../styles/videoCall.scss'
import { getSocketIOClient } from '../utils/socketio';

// 视频通话组件属性接口
interface VideoCallProps {
  targetUserId: string;
  targetUsername: string;
  callType: 'audio' | 'video';
  onCallEnd: () => void;
  isIncoming?: boolean;
  incomingOffer?: RTCSessionDescriptionInit | null;
}

interface CallState {
  // 是否为来电
  isIncoming: boolean;
  // 是否为去电
  isOutgoing: boolean;
  // 是否已连接
  isConnected: boolean;
  // 是否静音
  isMuted: boolean;
  // 是否关闭视频
  isVideoOff: boolean;
  // 本地媒体流
  localStream: MediaStream | null;
  // 远程媒体流 
  remoteStream: MediaStream | null;
  // 是否正在获取媒体流
  isGettingMedia: boolean;
  // 媒体获取错误信息
  mediaError: string | null;
  // 是否交换了视频位置
  isVideoSwapped: boolean;
  
  incomingOffer: RTCSessionDescriptionInit | null;
}

// 视频通话组件
const VideoCall: React.FC<VideoCallProps> = ({
  targetUserId,
  targetUsername,
  callType,
  onCallEnd,
  isIncoming = false,
  incomingOffer = null
}) => {
  // 通话状态管理
  const [callState, setCallState] = useState<CallState>({
    isIncoming: isIncoming,
    isOutgoing: !isIncoming,
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    localStream: null,
    remoteStream: null,
    isGettingMedia: false,
    mediaError: null,
    isVideoSwapped: false,
    incomingOffer: incomingOffer
  });

  // DOM引用
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef(getSocketIOClient());

  // WebRTC 配置 - 使用Google的STUN服务器进行NAT穿透
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 交换视频位置
  const swapVideos = () => {
    setCallState(prev => ({ ...prev, isVideoSwapped: !prev.isVideoSwapped }));
    
    // 立即执行视频交换
    setTimeout(() => {
      const { localStream, remoteStream, isVideoSwapped } = callState;
      
      if (localVideoRef.current && remoteVideoRef.current) {
        if (isVideoSwapped) {
          // 交换状态：主视频显示本地，右上角显示远程
          if (localStream) {
            remoteVideoRef.current.srcObject = localStream;
            console.log('交换后：主视频显示本地流');
          }
          if (remoteStream) {
            localVideoRef.current.srcObject = remoteStream;
            console.log('交换后：右上角显示远程流');
          }
        } else {
          // 正常状态：主视频显示远程，右上角显示本地
          if (remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log('交换后：主视频显示远程流');
          }
          if (localStream) {
            localVideoRef.current.srcObject = localStream;
            console.log('交换后：右上角显示本地流');
          }
        }
      }
    }, 100);
  };

  // 绑定视频流到对应的视频元素
  const bindVideoStreams = () => {
    const { localStream, remoteStream, isVideoSwapped } = callState;
    
    console.log('绑定视频流:', { localStream: !!localStream, remoteStream: !!remoteStream, isVideoSwapped });
    
    if (localVideoRef.current && remoteVideoRef.current) {
      // 先清除现有的srcObject
      localVideoRef.current.srcObject = null;
      remoteVideoRef.current.srcObject = null;
      
      // 等待一帧后再设置新的srcObject
      requestAnimationFrame(() => {
        // 本地视频流始终绑定到右上角（localVideoRef）
        if (localStream) {
          localVideoRef.current!.srcObject = localStream;
          console.log('右上角绑定本地流成功');
        } else {
          console.warn('本地流不存在，无法绑定到右上角');
        }
        
        // 远程视频流绑定到主视频区域（remoteVideoRef）
        if (remoteStream) {
          remoteVideoRef.current!.srcObject = remoteStream;
          console.log('主视频绑定远程流成功');
        } else {
          console.log('远程流不存在，主视频区域保持空白');
        }
      });
    }
  };

  // 监听视频交换状态变化，重新绑定视频流
  useEffect(() => {
    if (callState.localStream || callState.remoteStream) {
      bindVideoStreams();
    }
  }, [callState.isVideoSwapped, callState.localStream, callState.remoteStream]);

  // 确保本地视频流立即绑定到右上角
  useEffect(() => {
    if (callState.localStream && localVideoRef.current) {
      console.log('确保本地视频流绑定到右上角');
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // 初始化本地媒体流
  const initLocalStream = async (): Promise<MediaStream> => {
    try {
      console.log('开始申请媒体设备权限...');
      setCallState(prev => ({ ...prev, isGettingMedia: true, mediaError: null }));
      
      // 根据通话类型设置媒体约束，使用更宽松的约束
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280, min: 320, max: 1920 },
          height: { ideal: 720, min: 240, max: 1080 },
          frameRate: { ideal: 30, min: 15, max: 60 },
          facingMode: 'user'
        } : false
      };

      console.log('媒体约束:', constraints);

      // 获取用户媒体设备
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('媒体设备权限申请成功，获取到流:', stream);
      
      // 检查流中的轨道
      const tracks = stream.getTracks();
      console.log('媒体轨道数量:', tracks.length);
      tracks.forEach(track => {
        console.log('轨道类型:', track.kind, '轨道ID:', track.id, '轨道状态:', track.readyState);
      });
      
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream, 
        isGettingMedia: false,
        mediaError: null 
      }));

      // 将本地流绑定到右上角视频元素
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('本地视频元素已绑定媒体流');
        
        // 添加事件监听器
        localVideoRef.current.onloadedmetadata = () => {
          console.log('本地视频元数据已加载');
        };
        
        localVideoRef.current.oncanplay = () => {
          console.log('本地视频可以播放');
        };
        
        localVideoRef.current.onerror = (e) => {
          console.error('本地视频错误:', e);
        };
      } else {
        console.warn('本地视频元素引用不存在');
      }

      // 延迟绑定视频流，确保DOM已完全渲染
      setTimeout(() => {
        bindVideoStreams();
      }, 100);

      return stream;
    } catch (error) {
      console.error('获取媒体设备失败:', error);
      
      let errorMessage = '获取媒体设备失败';
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '用户拒绝了媒体设备权限请求，请在浏览器设置中允许访问摄像头和麦克风';
            break;
          case 'NotFoundError':
            errorMessage = '未找到摄像头或麦克风设备，请检查设备连接';
            break;
          case 'NotReadableError':
            errorMessage = '摄像头或麦克风被其他应用占用，请关闭其他应用后重试';
            break;
          case 'OverconstrainedError':
            errorMessage = '请求的媒体约束无法满足，请检查设备能力';
            break;
          case 'SecurityError':
            errorMessage = '由于安全限制无法访问媒体设备，请检查HTTPS设置';
            break;
          default:
            errorMessage = `获取媒体设备失败: ${error.message}`;
        }
      }
      
      setCallState(prev => ({ 
        ...prev, 
        isGettingMedia: false, 
        mediaError: errorMessage 
      }));
      
      throw new Error(errorMessage);
    }
  };

  // 创建RTCPeerConnection连接
  const createPeerConnection = (): RTCPeerConnection => {
    console.log('创建WebRTC连接...');
    const pc = new RTCPeerConnection(rtcConfiguration);

    // 监听远程媒体流
    pc.ontrack = (event) => {
      console.log('收到远程媒体流:', event.streams);
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        setCallState(prev => ({ ...prev, remoteStream }));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('远程视频元素已绑定媒体流');
          
          // 添加事件监听器
          remoteVideoRef.current.onloadedmetadata = () => {
            console.log('远程视频元数据已加载');
          };
          
          remoteVideoRef.current.oncanplay = () => {
            console.log('远程视频可以播放');
          };
          
          remoteVideoRef.current.onerror = (e) => {
            console.error('远程视频错误:', e);
          };
        } else {
          console.warn('远程视频元素引用不存在');
        }
        
        // 延迟绑定视频流，确保DOM已完全渲染
        setTimeout(() => {
          bindVideoStreams();
        }, 100);
      }
    };

    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('发送ICE候选:', event.candidate);
        socketRef.current?.sendIceCandidate(targetUserId, event.candidate);
      }
    };

    // 监听连接状态变化
    pc.onconnectionstatechange = () => {
      console.log('WebRTC连接状态变化:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, isConnected: true }));
        console.log('WebRTC连接已建立');
      } else if (pc.connectionState === 'failed') {
        console.error('WebRTC连接失败');
      }
    };

    // 监听ICE连接状态
    pc.oniceconnectionstatechange = () => {
      console.log('ICE连接状态:', pc.iceConnectionState);
    };

    // 监听信令状态
    pc.onsignalingstatechange = () => {
      console.log('信令状态:', pc.signalingState);
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // 发起通话
  const initiateCall = async () => {
    try {
      console.log('开始发起通话...');
      setCallState(prev => ({ ...prev, isOutgoing: true }));

      // 获取本地媒体流
      console.log('正在获取本地媒体流...');
      const stream = await initLocalStream();
      console.log('本地媒体流获取成功');
      
      // 创建WebRTC连接
      const pc = createPeerConnection();
      console.log('WebRTC连接已创建');
      
      // 将本地媒体流添加到连接中
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('媒体轨道已添加到连接:', track.kind);
      });

      // 创建SDP offer
      console.log('正在创建SDP offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('SDP offer已创建并设置');

      // 通过Socket.IO发送通话请求
      console.log('正在发送通话请求...');
      socketRef.current?.sendCallRequest(targetUserId, offer, callType);
      console.log('通话请求已发送');

    } catch (error) {
      console.error('发起通话失败:', error);
      
      let errorMessage = '发起通话失败';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setCallState(prev => ({ ...prev, isOutgoing: false }));
    }
  };

  // 接听通话
  const acceptCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('接听通话...');
      setCallState(prev => ({ ...prev, isIncoming: false, isConnected: true }));

      // 获取本地媒体流
      const stream = await initLocalStream();
      
      // 创建WebRTC连接
      const pc = createPeerConnection();
      
      // 将本地媒体流添加到连接中
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('媒体轨道已添加到连接:', track.kind);
      });

      // 设置远程描述（offer）
      console.log('设置远程描述...');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('远程描述已设置');

      // 创建SDP answer
      console.log('创建SDP answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('SDP answer已创建并设置');

      // 发送answer给发起方
      console.log('发送answer给发起方...');
      socketRef.current?.sendCallResponse(targetUserId, answer, true);
      console.log('answer已发送');

    } catch (error) {
      console.error('接听通话失败:', error);
      alert('接听通话失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 组件挂载时自动发起通话（仅限主动发起的情况）
  useEffect(() => {
    if (!callState.isIncoming && !callState.isOutgoing && !callState.isConnected) {
      initiateCall();
    }
  }, []);

  useEffect(() => {
    // 处理来电状态变化
    setCallState(prev => ({...prev, isIncoming, isOutgoing: !isIncoming}));
  }, [isIncoming]);

  // 拒绝通话
  const rejectCall = () => {
    socketRef.current?.sendCallResponse(targetUserId, undefined, false);
    setCallState(prev => ({ ...prev, isIncoming: false }));
    onCallEnd();
  };

  // 结束通话
  const endCall = () => {
    console.log('结束通话...');
    
    // 关闭WebRTC连接
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 停止所有媒体轨道
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('停止轨道:', track.kind);
      });
    }

    // 通知对方通话结束
    socketRef.current?.endCall(targetUserId);
    onCallEnd();
  };

  // 切换静音状态
  const toggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
        console.log('静音状态:', !audioTrack.enabled);
      }
    }
  };

  // 切换视频状态
  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
        console.log('视频状态:', !videoTrack.enabled);
      }
    }
  };

  // Socket.IO 事件监听器设置
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      if (data.fromUserId === targetUserId) {
        console.log('收到来电:', data);
        setCallState(prev => ({
          ...prev,
          isIncoming: true,
          incomingOffer: data.offer
        }));
      }
    };

    const handleCallResponse = (data: any) => {
      if (data.fromUserId === targetUserId) {
        console.log('收到通话响应:', data);
        if (data.accepted && data.answer) {
          // 对方接受通话，设置远程描述
          if (peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            ).then(() => {
              console.log('远程描述已设置');
            }).catch(error => {
              console.error('设置远程描述失败:', error);
            });
          }
        } else {
          // 对方拒绝通话
          setCallState(prev => ({ ...prev, isOutgoing: false }));
          onCallEnd();
        }
      }
    };

    const handleIceCandidate = (data: any) => {
      if (data.fromUserId === targetUserId && data.candidate) {
        console.log('收到ICE候选:', data.candidate);
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          ).then(() => {
            console.log('ICE候选已添加');
          }).catch(error => {
            console.error('添加ICE候选失败:', error);
          });
        }
      }
    };

    const handleCallEnd = (data: any) => {
      if (data.fromUserId === targetUserId) {
        console.log('对方结束通话');
        endCall();
      }
    };

    // 注册事件监听器
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_response', handleCallResponse);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_end', handleCallEnd);

    // 组件卸载时清理事件监听器
    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_response', handleCallResponse);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_end', handleCallEnd);
    };
  }, [targetUserId, onCallEnd]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      console.log('VideoCall组件卸载，清理资源...');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (callState.localStream) {
        callState.localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 显示媒体错误
  if (callState.mediaError) {
    return (
      <div className="video-call-container">
        <div className="media-error">
          <h3>媒体设备错误</h3>
          <p>{callState.mediaError}</p>
          <Button color="danger" onClick={onCallEnd}>关闭</Button>
        </div>
      </div>
    );
  }



  return (
    <div className="video-call-container">
      {/* 视频显示区域 */}
      <div className="video-area">
        {callType === 'video' && (
          <>
            {/* 主视频区域 - 显示远程视频或本地视频（根据交换状态） */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="main-video"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            
            {/* 右上角小视频 - 显示本地视频或远程视频（根据交换状态） */}
            <div 
              className="corner-video-container"
              onClick={swapVideos}
              title="点击交换视频位置"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="corner-video"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  backgroundColor: '#333'
                }}
              />
              {/* 交换提示 */}
              <div className="swap-hint">
                <span>点击交换</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 通话信息显示 */}
      <div className="call-info">
        <h3>{targetUsername}</h3>
        <p>
          {callState.isGettingMedia && '正在获取媒体设备...'}
          {callState.isIncoming && '来电...'}
          {callState.isOutgoing && '正在呼叫...'}
          {callState.isConnected && '通话中'}
        </p>
        {callState.mediaError && (
          <p className="error-message">{callState.mediaError}</p>
        )}
        
        {/* 视频交换状态提示 */}
        {callType === 'video' && (
          <p className="swap-status">
            当前显示: {callState.isVideoSwapped ? '本地视频' : '远程视频'} 
            (右上角: {callState.isVideoSwapped ? '远程视频' : '本地视频'})
          </p>
        )}
      </div>

      {/* 通话控制按钮 */}
      <div className="call-controls">
        {callState.isIncoming ? (
          // 来电时的按钮：接听/拒绝
          <>
            <Button
              color="success"
              size="large"
              onClick={() => {
                if (callState.incomingOffer) {
                  acceptCall(callState.incomingOffer);
                }
              }}
            >
              接听
            </Button>
            <Button
              color="danger"
              size="large"
              onClick={rejectCall}
            >
              拒绝
            </Button>
          </>
        ) : (
          // 通话中的按钮：结束/视频切换/静音
          <>
            <Button
              color="danger"
              size="large"
              onClick={endCall}
            >
              结束
            </Button>

            {/* 视频通话时显示视频切换按钮 */}
            {callType === 'video' && (
              <Button
                size="large"
                onClick={toggleVideo}
              >
                {callState.isVideoOff ? '开启视频' : '关闭视频'}
              </Button>
            )}

            <Button
              size="large"
              onClick={toggleMute}
            >
              {callState.isMuted ? '取消静音' : '静音'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;