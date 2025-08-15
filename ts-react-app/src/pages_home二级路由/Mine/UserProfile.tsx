import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Button, Toast, Tabs } from 'antd-mobile';
import { 
  LeftOutline, 
  UserOutline, 
  MessageOutline, 
  StarOutline,
  MoreOutline,
  PlayOutline
} from 'antd-mobile-icons';
import FollowService from '../../api/followService';
import { getCurrentUserId, getUserFollowedUps, setUserFollowedUps, getUserRecentVisited, setUserRecentVisited } from '../../utils/userHelper';

import './UserProfile.scss';

// 解析粉丝数量，支持"111.3万"这样的格式
const parseFollowerCount = (followerStr: string): number => {
  if (!followerStr) return 0;
  
  // 如果包含"万"，需要特殊处理
  if (followerStr.includes('万')) {
    const numStr = followerStr.replace('万', '').replace(/[^\d.]/g, '');
    const num = parseFloat(numStr);
    return Math.floor(num * 10000); // 转换为实际数字
  }
  
  // 否则直接解析数字
  const num = parseInt(followerStr.replace(/[^\d]/g, '') || '0');
  return num || 0;
};

// 解析播放量，支持"111.3万播放"这样的格式并返回数值
const parseViewCount = (viewStr: string): number => {
  if (!viewStr) return 0;
  
  // 如果包含"万"，需要特殊处理
  if (viewStr.includes('万')) {
    const numStr = viewStr.replace('万播放', '').replace('万', '').replace(/[^\d.]/g, '');
    const num = parseFloat(numStr);
    return Math.floor(num * 10000); // 转换为实际数字
  }
  
  // 否则直接解析数字
  const num = parseInt(viewStr.replace(/[^\d]/g, '') || '0');
  return num || 0;
};

// 计算用户所有视频的总播放量
const calculateTotalViews = (videos: any[]): number => {
  if (!videos || videos.length === 0) return 0;
  
  return videos.reduce((total, video) => {
    const viewCount = parseViewCount(video.views || '');
    return total + viewCount;
  }, 0);
};


const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  // 加载用户资料
  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        Toast.show({
          content: '用户ID无效',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        Toast.show({
          content: '请先登录',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      // 从本地缓存的最近访问记录中获取用户数据
      const recentVisited = getUserRecentVisited(currentUserId);
      const userData = recentVisited.find(user => user.userId === userId);
      
      if (!userData) {
        Toast.show({
          content: '用户不存在或未在访问记录中',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      // 将 recentVisited 的数据格式转换为详情页需要的格式
      const profileData = {
        ...userData,
        username: userData.name || userData.userId,
        bio: userData.desc || '这个人很神秘，什么都没有写...',
        location: '未知',
        level: 1,
        stats: {
          followers: parseFollowerCount(userData.followers || '0'),
          following: Math.floor(Math.random() * 50) + 10, // 随机生成10-59的关注数
          videos: userData.videos?.length || 0,
          likes: Math.floor(Math.random() * 1000000) + 100000, // 随机生成10万-109万的获赞数
          views: calculateTotalViews(userData.videos || []) // 计算所有视频的总播放量
        },
        membership: {
          isActive: false,
          level: 'normal'
        }
      };
      setUserProfile(profileData);

      // 检查是否已关注
      const followedUps = getUserFollowedUps(currentUserId);
      if (userData.id) {
        setIsFollowing(followedUps.includes(userData.id));
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
      Toast.show({
        content: '加载用户资料失败',
        icon: 'fail',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 处理关注/取消关注
  const handleFollowToggle = useCallback(async () => {
    if (!userProfile || !userId) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      Toast.show({
        content: '请先登录',
        icon: 'fail',
        duration: 2000
      });
      return;
    }

    try {
      setFollowLoading(true);

      if (isFollowing) {
        // 取消关注
        await FollowService.unfollowUser(userId);
        
        // 更新本地关注状态
        const followedUps = getUserFollowedUps(currentUserId);
        const updatedFollowedUps = followedUps.filter(id => id !== userProfile.id);
        setUserFollowedUps(updatedFollowedUps, currentUserId);
        
        // 同时从访问记录中删除该用户
        const recentVisited = getUserRecentVisited(currentUserId);
        const updatedRecentVisited = recentVisited.filter(user => user.userId !== userId);
        setUserRecentVisited(updatedRecentVisited, currentUserId);
        
        setIsFollowing(false);
        Toast.show({
          content: '已取消关注并清除访问记录',
          icon: 'success',
          duration: 2000
        });
        
        // 延迟返回上一页，让用户看到提示
        setTimeout(() => {
          navigate(-1);
        }, 1000);
      } else {
        // 关注
        await FollowService.followUser(userId);
        
        // 更新本地状态
        const followedUps = getUserFollowedUps(currentUserId);
        const updatedFollowedUps = [...followedUps, userProfile.id];
        setUserFollowedUps(updatedFollowedUps, currentUserId);
        
        setIsFollowing(true);
        Toast.show({
          content: '关注成功',
          icon: 'success',
          duration: 2000
        });
      }

      // 触发全局状态更新
      window.dispatchEvent(new CustomEvent('followStateChanged'));
    } catch (error: any) {
      console.error('关注操作失败:', error);
      Toast.show({
        content: error?.message || '操作失败，请重试',
        icon: 'fail',
        duration: 2000
      });
    } finally {
      setFollowLoading(false);
    }
  }, [userProfile, userId, isFollowing]);

  // 返回上一页
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (userId) {
      navigate(`/chat/${userId}`);
    }
  }, [navigate, userId]);

  // 分享用户
  const handleShare = useCallback(() => {
    Toast.show({
      content: '分享功能开发中',
      icon: 'loading',
      duration: 2000
    });
  }, []);

  // 更多操作
  const handleMore = useCallback(() => {
    Toast.show({
      content: '更多功能开发中',
      icon: 'loading',
      duration: 2000
    });
  }, []);

  // 格式化数字
  const formatNumber = useCallback((num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  }, []);

  // Tab配置
  const tabs = useMemo(() => [
    { key: 'videos', title: '动态' },
    { key: 'dynamic', title: '投稿' },
    { key: 'info', title: '资料' }
  ], []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile-container">
        <div className="error-state">
          <p>用户不存在</p>
          <Button onClick={handleBack}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* 顶部导航栏 */}
      <div className="profile-header">
        <div className="header-left">
          <LeftOutline 
            onClick={handleBack} 
            fontSize={24}
            className="back-icon"
          />
        </div>
        <div className="header-center">
          <h1 className="page-title">{userProfile.name}</h1>
        </div>
        <div className="header-right">
          <StarOutline 
            fontSize={22} 
            className="action-icon"
            onClick={handleShare}
          />
          <MoreOutline 
            fontSize={22} 
            className="action-icon"
            onClick={handleMore}
          />
        </div>
      </div>

      {/* 用户信息区域 */}
      <div className="user-info-section">
        {/* 头像和基本信息 */}
        <div className="user-basic-info">
          <div className="avatar-section">
            <Avatar
              src={userProfile.avatar}
              style={{ '--size': '80px' }}
              fallback={<UserOutline />}
              className="user-avatar"
            />
            {userProfile.membership?.isActive && (
              <div className="vip-badge">大会员</div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{userProfile.name}</div>
            <div className="username">@{userProfile.username}</div>
            <div className="user-bio">{userProfile.bio}</div>
            <div className="user-location">📍 {userProfile.location}</div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="user-stats">
          <div className="stat-item">
            <div className="stat-number">{formatNumber(userProfile.stats.followers)}</div>
            <div className="stat-label">粉丝</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{userProfile.stats.following}</div>
            <div className="stat-label">关注</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(userProfile.stats.likes)}</div>
            <div className="stat-label">获赞</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(userProfile.stats.views)}</div>
            <div className="stat-label">播放</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <Button
            color={isFollowing ? "default" : "primary"}
            fill={isFollowing ? "outline" : "solid"}
            size="large"
            onClick={handleFollowToggle}
            loading={followLoading}
            className="follow-btn"
          >
            {isFollowing ? '已关注' : '+ 关注'}
          </Button>
          <Button
            color="primary"
            fill="outline"
            size="large"
            onClick={handleSendMessage}
            className="message-btn"
          >
            <MessageOutline fontSize={16} />
            私信
          </Button>
        </div>
      </div>



      {/* 内容标签页 */}
      <div className="content-tabs">
        <Tabs>
          {tabs.map(tab => (
            <Tabs.Tab title={tab.title} key={tab.key}>
              <div className="tab-content">
                {tab.key === 'videos' && (
                  <div className="videos-grid">
                    {userProfile.videos?.map((video: any) => (
                      <div key={video.id} className="video-card">
                        <div className="video-thumbnail">
                          <img src={video.thumbnail} alt={video.title} />
                          <div className="video-duration">{video.duration}</div>
                          <div className="play-overlay">
                            <PlayOutline fontSize={24} />
                          </div>
                        </div>
                        <div className="video-info">
                          <div className="video-title">{video.title}</div>
                          <div className="video-stats">{video.views}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tab.key === 'dynamic' && (
                  <div className="empty-content">
                    <div>暂无投稿</div>
                  </div>
                )}
                {tab.key === 'info' && (
                  <div className="info-content">
                    <div>暂无资料</div>
                  </div>
                )}
              </div>
            </Tabs.Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;