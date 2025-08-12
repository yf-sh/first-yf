/**
 * 媒体权限管理工具
 * 提供摄像头和麦克风权限的检查、申请和管理功能
 */

export interface MediaPermissions {
  audio: boolean;
  video: boolean;
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

/**
 * 检查媒体设备权限状态
 * @returns Promise<MediaPermissions> 权限状态对象
 */
export async function checkMediaPermissions(): Promise<MediaPermissions> {
  try {
    // 检查音频权限
    const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    // 检查视频权限
    const videoPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
    return {
      audio: audioPermission.state === 'granted',
      video: videoPermission.state === 'granted'
    };
  } catch (error) {
    console.warn('无法检查权限状态，可能是浏览器不支持:', error);
    // 如果无法检查权限状态，返回默认值
    return { audio: false, video: false };
  }
}

/**
 * 申请媒体设备权限
 * @param constraints 媒体约束
 * @returns Promise<MediaStream> 媒体流
 */
export async function requestMediaPermissions(constraints: MediaConstraints): Promise<MediaStream> {
  try {
    console.log('正在申请媒体设备权限:', constraints);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('媒体设备权限申请成功');
    
    return stream;
  } catch (error) {
    console.error('申请媒体设备权限失败:', error);
    throw createPermissionError(error);
  }
}

/**
 * 申请音频权限
 * @param audioConstraints 音频约束
 * @returns Promise<MediaStream> 音频流
 */
export async function requestAudioPermission(audioConstraints?: MediaTrackConstraints): Promise<MediaStream> {
  return requestMediaPermissions({
    audio: audioConstraints || true,
    video: false
  });
}

/**
 * 申请视频权限
 * @param videoConstraints 视频约束
 * @param audioConstraints 音频约束
 * @returns Promise<MediaStream> 音视频流
 */
export async function requestVideoPermission(
  videoConstraints?: MediaTrackConstraints,
  audioConstraints?: MediaTrackConstraints
): Promise<MediaStream> {
  return requestMediaPermissions({
    audio: audioConstraints || true,
    video: videoConstraints || {
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });
}

/**
 * 测试媒体设备是否可用
 * @param constraints 媒体约束
 * @returns Promise<boolean> 是否可用
 */
export async function testMediaDevices(constraints: MediaConstraints): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // 立即停止流，避免占用设备
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.warn('媒体设备测试失败:', error);
    return false;
  }
}

/**
 * 创建用户友好的权限错误信息
 * @param error 原始错误
 * @returns Error 用户友好的错误信息
 */
function createPermissionError(error: any): Error {
  if (error instanceof Error) {
    switch (error.name) {
      case 'NotAllowedError':
        return new Error('用户拒绝了媒体设备权限请求，请在浏览器设置中允许访问摄像头和麦克风');
      case 'NotFoundError':
        return new Error('未找到摄像头或麦克风设备，请检查设备连接');
      case 'NotReadableError':
        return new Error('摄像头或麦克风被其他应用占用，请关闭其他应用后重试');
      case 'OverconstrainedError':
        return new Error('请求的媒体约束无法满足，请检查设备能力');
      case 'SecurityError':
        return new Error('由于安全限制无法访问媒体设备，请检查HTTPS设置');
      case 'AbortError':
        return new Error('媒体设备权限请求被中断');
      case 'NotSupportedError':
        return new Error('当前浏览器不支持请求的媒体类型');
      default:
        return new Error(`获取媒体设备失败: ${error.message}`);
    }
  } else {
    return new Error('获取媒体设备失败，未知错误');
  }
}

/**
 * 获取设备信息
 * @returns Promise<MediaDeviceInfo[]> 设备信息列表
 */
export async function getMediaDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  } catch (error) {
    console.error('获取设备列表失败:', error);
    return [];
  }
}

/**
 * 获取音频设备列表
 * @returns Promise<MediaDeviceInfo[]> 音频设备列表
 */
export async function getAudioDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await getMediaDevices();
  return devices.filter(device => device.kind === 'audioinput');
}

/**
 * 获取视频设备列表
 * @returns Promise<MediaDeviceInfo[]> 视频设备列表
 */
export async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await getMediaDevices();
  return devices.filter(device => device.kind === 'videoinput');
}

/**
 * 检查是否支持媒体设备API
 * @returns boolean 是否支持
 */
export function isMediaDevicesSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * 检查是否支持权限查询API
 * @returns boolean 是否支持
 */
export function isPermissionsSupported(): boolean {
  return !!(navigator.permissions && navigator.permissions.query);
}
