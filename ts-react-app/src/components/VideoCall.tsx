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
  callStatus?: 'idle' | 'calling' | 'incoming' | 'connected';
}

interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isGettingMedia: boolean;
  mediaError: string | null;
  isVideoSwapped: boolean;
}

// 视频通话组件
const VideoCall: React.FC<VideoCallProps> = ({
  targetUserId,
  targetUsername,
  callType,
  onCallEnd,
  isIncoming = false,
  incomingOffer = null,
  callStatus = 'idle'
}) => {
  // 通话状态管理
  const [callState, setCallState] = useState<CallState>({
    isIncoming: isIncoming,
    isOutgoing: !isIncoming,
    isConnected: false,
    isMuted: false,
    isVideoOff: true, // 默认视频关闭
    localStream: null,
    remoteStream: null,
    isGettingMedia: false,
    mediaError: null,
    isVideoSwapped: false
  });

  // DOM引用
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef(getSocketIOClient());

  // WebRTC 配置
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 绑定本地视频流到右上角
  const bindLocalVideo = (stream: MediaStream) => {
    if (localVideoRef.current && stream) {
      console.log('绑定本地视频流到右上角');
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(e => console.log('本地视频播放失败:', e));
    }
  };

  // 绑定远程视频流到主区域
  const bindRemoteVideo = (stream: MediaStream) => {
    if (remoteVideoRef.current && stream) {
      console.log('绑定远程视频流到主区域');
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(e => console.log('远程视频播放失败:', e));
    }
  };

  // 初始化本地媒体流
  const initLocalStream = async (): Promise<MediaStream> => {
    try {
      console.log('开始申请媒体设备权限...');
      setCallState(prev => ({ ...prev, isGettingMedia: true, mediaError: null }));
      
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
      
      // 检查设备权限
      if (navigator.mediaDevices) {
        console.log('getUserMedia API 可用');
      } else {
        throw new Error('浏览器不支持 getUserMedia API');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('媒体设备权限申请成功，获取到流:', stream);
      
      // 验证流是否有效
      if (!stream || stream.getTracks().length === 0) {
        throw new Error('获取到的媒体流无效或为空');
      }

      // 检查轨道状态
      const tracks = stream.getTracks();
      console.log('媒体轨道数量:', tracks.length);
      tracks.forEach(track => {
        console.log('轨道类型:', track.kind, '轨道ID:', track.id, '轨道状态:', track.readyState);
        if (track.readyState === 'ended') {
          console.warn('轨道已结束:', track.kind);
        }
      });
      
      // 如果视频默认关闭，则禁用视频轨道
      if (callType === 'video' && callState.isVideoOff) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          console.log('视频轨道已禁用（默认关闭状态）');
        }
      }
      
      // 立即绑定本地视频流到右上角
      bindLocalVideo(stream);
      
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream, 
        isGettingMedia: false,
        mediaError: null 
      }));

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
          case 'AbortError':
            errorMessage = '媒体设备访问被中止，请重试';
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
        console.log('远程流详情:', {
          id: remoteStream.id,
          tracks: remoteStream.getTracks().length,
          active: remoteStream.active
        });
        
        setCallState(prev => ({ ...prev, remoteStream }));
        
        // 立即绑定远程视频流到主区域
        bindRemoteVideo(remoteStream);
      } else {
        console.warn('ontrack事件触发但没有有效的流');
      }
    };

    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('发送ICE候选:', event.candidate);
        socketRef.current?.sendIceCandidate(targetUserId, event.candidate);
      } else {
        console.log('ICE候选收集完成');
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
        setCallState(prev => ({ ...prev, isConnected: false }));
      } else if (pc.connectionState === 'disconnected') {
        console.warn('WebRTC连接断开');
        setCallState(prev => ({ ...prev, isConnected: false }));
      }
    };

    // 监听ICE连接状态
    pc.oniceconnectionstatechange = () => {
      console.log('ICE连接状态:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('ICE连接失败，可能需要检查STUN服务器配置');
      }
    };

    // 监听信令状态
    pc.onsignalingstatechange = () => {
      console.log('信令状态:', pc.signalingState);
      if (pc.signalingState === 'closed') {
        console.warn('信令状态已关闭');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // 发起通话
  const initiateCall = async () => {
    try {
      console.log('开始发起通话...');
      setCallState(prev => ({ ...prev, isOutgoing: true }));

      // 根据通话类型获取媒体流
      let stream: MediaStream;
      if (callType === 'video') {
        // 视频通话：获取包含视频的流
        console.log('正在获取视频流...');
        stream = await initLocalStream();
        console.log('视频流获取成功');
      } else {
        // 音频通话：只获取音频流
        const audioConstraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        };
        console.log('正在获取音频流...');
        stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        console.log('音频流获取成功');
        
        // 设置本地流状态
        setCallState(prev => ({ ...prev, localStream: stream }));
      }
      
      // 创建WebRTC连接
      const pc = createPeerConnection();
      console.log('WebRTC连接已创建');
      
      // 将媒体流添加到连接中
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('轨道已添加到连接:', track.kind);
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

      // 发起方：将本方本地视频流作为远程流显示，模拟对方的视频
      if (callType === 'video' && stream) {
        console.log('发起方：将本方本地视频流作为远程流显示');
        setCallState(prev => ({ ...prev, remoteStream: stream }));
        bindRemoteVideo(stream);
        console.log('发起方：远程视频元素已绑定本方本地流');
      }

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

      // 检查是否为临时 offer（用于音频通话）
      if (offer.sdp === 'temp-sdp') {
        console.log('收到临时 offer，等待发起方创建真实 offer...');
        console.log('发送通话响应，通知对方通话已被接受...');
        socketRef.current?.sendCallResponse(targetUserId, undefined, true);
        console.log('通话响应已发送');
        return;
      }

      // 根据通话类型获取媒体流
      let stream: MediaStream;
      if (callType === 'video') {
        // 视频通话：获取包含视频的流
        console.log('正在获取视频流...');
        stream = await initLocalStream();
        console.log('视频流获取成功');
        
        // 接听方：将本方本地视频流作为远程流显示，模拟对方的视频
        if (stream) {
          console.log('接听方：将本方本地视频流作为远程流显示');
          setCallState(prev => ({ ...prev, remoteStream: stream }));
          bindRemoteVideo(stream);
          console.log('接听方：远程视频元素已绑定本方本地流');
        }
      } else {
        // 音频通话：只获取音频流
        const audioConstraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        };
        console.log('正在获取音频流...');
        stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        console.log('音频流获取成功');
        
        // 设置本地流状态
        setCallState(prev => ({ ...prev, localStream: stream }));
      }
      
      // 创建WebRTC连接
      const pc = createPeerConnection();
      
      // 将媒体流添加到连接中
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('轨道已添加到连接:', track.kind);
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
      console.log('组件挂载，自动发起通话');
      initiateCall();
    }
  }, []);

  // 同步外部传入的callStatus与内部状态
  useEffect(() => {
    if (callStatus === 'connected' && !callState.isConnected) {
      console.log('外部状态显示已连接，更新内部连接状态');
      setCallState(prev => ({ ...prev, isConnected: true }));
      
      // 在通话连接后，如果还没有远程流，将本地流作为远程流显示
      if (callType === 'video' && callState.localStream && !callState.remoteStream) {
        console.log('通话已连接，将本地流作为远程流显示');
        setCallState(prev => ({ ...prev, remoteStream: prev.localStream }));
        bindRemoteVideo(callState.localStream);
        console.log('远程视频元素已绑定本地流');
      }
    } else if (callStatus === 'idle' && callState.isConnected) {
      console.log('外部状态显示空闲，重置内部连接状态');
      setCallState(prev => ({ ...prev, isConnected: false }));
    }
  }, [callStatus, callState.isConnected, callType, callState.localStream, callState.remoteStream]);

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
  const toggleVideo = async () => {
    if (callState.localStream) {
      // 如果已有本地流，检查是否有视频轨道
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // 切换视频轨道状态
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
        console.log('视频状态:', !videoTrack.enabled);
      } else {
        // 没有视频轨道，需要重新获取包含视频的流
        try {
          console.log('重新获取包含视频的媒体流...');
          const newStream = await initLocalStream();
          
          // 更新WebRTC连接
          if (peerConnectionRef.current) {
            // 移除旧的音频轨道
            const oldAudioTrack = callState.localStream?.getAudioTracks()[0];
            if (oldAudioTrack) {
              const sender = peerConnectionRef.current.getSenders().find(s => 
                s.track?.kind === 'audio'
              );
              if (sender) {
                peerConnectionRef.current.removeTrack(sender);
                console.log('旧音频轨道已移除');
              }
            }
            
            // 添加新的音频和视频轨道
            newStream.getTracks().forEach(track => {
              peerConnectionRef.current!.addTrack(track, newStream);
              console.log('新轨道已添加到连接:', track.kind);
            });
          }
          
          setCallState(prev => ({ ...prev, isVideoOff: false }));
          console.log('视频已开启');
        } catch (error) {
          console.error('开启视频失败:', error);
          alert('开启视频失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
      }
    } else {
      // 如果没有本地流，尝试获取媒体流
      try {
        console.log('手动获取媒体流...');
        const stream = await initLocalStream();
        console.log('手动获取成功，获取到流:', stream);
        
        // 更新WebRTC连接
        if (peerConnectionRef.current) {
          stream.getTracks().forEach(track => {
            peerConnectionRef.current!.addTrack(track, stream);
            console.log('轨道已添加到连接:', track.kind);
          });
        }
        
        setCallState(prev => ({ ...prev, isVideoOff: false }));
        console.log('视频已开启');
      } catch (error) {
        console.error('手动获取失败:', error);
        alert('获取视频设备失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
    }
  };

  // 交换视频流显示
  const swapVideoStreams = () => {
    console.log('swapVideoStreams 被调用');
    console.log('当前状态:', {
      localStream: !!callState.localStream,
      remoteStream: !!callState.remoteStream,
      isVideoSwapped: callState.isVideoSwapped
    });
    
    // 检查是否有可用的流
    if (!callState.localStream && !callState.remoteStream) {
      console.log('没有可用的视频流');
      return;
    }

    console.log('交换视频流显示...');
    
    // 切换交换状态
    setCallState(prev => ({ ...prev, isVideoSwapped: !prev.isVideoSwapped }));
    
    // 根据交换状态绑定不同的流
    if (callState.isVideoSwapped) {
      // 交换后：主视频显示本地流（如果有），右上角显示远程流（如果有）
      console.log('执行交换：主视频显示本地流，右上角显示远程流');
      
      if (callState.localStream) {
        bindRemoteVideo(callState.localStream);
        console.log('主视频已绑定本地流');
      } else {
        // 如果没有本地流，主视频显示黑色背景
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          console.log('主视频已清空（无本地流）');
        }
      }
      
      if (callState.remoteStream) {
        bindLocalVideo(callState.remoteStream);
        console.log('右上角已绑定远程流');
      } else {
        // 如果没有远程流，右上角显示黑色背景
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          console.log('右上角已清空（无远程流）');
        }
      }
      
      console.log('视频流已交换');
    } else {
      // 正常状态：主视频显示远程流（如果有），右上角显示本地流（如果有）
      console.log('执行恢复：主视频显示远程流，右上角显示本地流');
      
      if (callState.remoteStream) {
        bindRemoteVideo(callState.remoteStream);
        console.log('主视频已绑定远程流');
      } else {
        // 如果没有远程流，主视频显示黑色背景
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          console.log('主视频已清空（无远程流）');
        }
      }
      
      if (callState.localStream) {
        bindLocalVideo(callState.localStream);
        console.log('右上角已绑定本地流');
      } else {
        // 如果没有本地流，右上角显示黑色背景
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          console.log('右上角已清空（无本地流）');
        }
      }
      
      console.log('视频流已恢复');
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
          isIncoming: true
        }));
      }
    };

    const handleCallResponse = (data: any) => {
      if (data.fromUserId === targetUserId) {
        console.log('收到通话响应:', data);
        if (data.accepted) {
          if (data.answer) {
            // 对方接受通话，并且提供了 answer，设置远程描述
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
            // 对方接受通话，但没有提供 answer（临时 offer 的情况）
            console.log('对方已接受通话，等待后续的 WebRTC 信令交换');
          }
          
          // 发起方：如果还没有远程流，将本地流作为远程流显示
          if (callType === 'video' && callState.localStream && !callState.remoteStream) {
            console.log('发起方：对方已接受通话，将本地流作为远程流显示');
            setCallState(prev => ({ ...prev, remoteStream: prev.localStream }));
            bindRemoteVideo(callState.localStream);
            console.log('发起方：远程视频元素已绑定本地流');
          }
        } else {
          // 对方拒绝通话
          console.log('对方拒绝通话');
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
      {/* 调试信息 - 开发时显示 */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <div>本地流: {callState.localStream ? '✅' : '❌'}</div>
          <div>远程流: {callState.remoteStream ? '✅' : '❌'}</div>
          <div>本地视频元素: {localVideoRef.current ? '✅' : '❌'}</div>
          <div>远程视频元素: {remoteVideoRef.current ? '✅' : '❌'}</div>
          <div>通话状态: {callStatus}</div>
          <div>连接状态: {callState.isConnected ? '已连接' : '未连接'}</div>
          <div>视频状态: {callState.isVideoOff ? '关闭' : '开启'}</div>
        </div>
      )}

      {/* 视频显示区域 - 仅在视频通话时显示 */}
      {callType === 'video' && (
        <div className="video-area">
          {/* 主视频区域 - 显示远程视频 */}
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
            onLoadedMetadata={() => console.log('远程视频元数据已加载')}
            onCanPlay={() => console.log('远程视频可以播放')}
            onError={(e) => console.error('远程视频错误:', e)}
          />
          
          {/* 右上角小视频 - 显示本地视频 */}
          <div className="corner-video-container">
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
              onClick={swapVideoStreams}
              onLoadedMetadata={() => console.log('本地视频元数据已加载')}
              onCanPlay={() => console.log('本地视频可以播放')}
              onError={(e) => console.error('本地视频错误:', e)}
            />
          </div>
        </div>
      )}

      {/* 通话信息显示 */}
      <div className="call-info">
        <h3>{targetUsername}</h3>
        <p>
          {callState.isGettingMedia && '正在获取媒体设备...'}
          {callStatus === 'incoming' && '来电...'}
          {callStatus === 'calling' && '正在呼叫...'}
          {callStatus === 'connected' && '通话中'}
        </p>
        {callState.mediaError && (
          <p className="error-message">{callState.mediaError}</p>
        )}
        
        {/* 视频状态提示 */}
        {callType === 'video' && (
          <p className="swap-status">
            当前显示: 远程视频 (右上角: 本地视频)
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
                if (incomingOffer) {
                  acceptCall(incomingOffer);
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