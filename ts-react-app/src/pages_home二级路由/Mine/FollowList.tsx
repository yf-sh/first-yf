import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Toast } from 'antd-mobile';
import { LeftOutline, UserOutline, ClockCircleOutline } from 'antd-mobile-icons';
import FollowService from '../../api/followService';
import { 
  getCurrentUserId, 
  getUserFollowedUps, 
  setUserFollowedUps, 
  getUserRecentVisited, 
  setUserRecentVisited 
} from '../../utils/userHelper';
import './FollowList.scss';

// 定义数据类型
interface Video {
  id: number;
  title: string;
  views: string;
  thumbnail: string;
}

interface RecentVisitedUser {
  id: number;
  userId: string;
  name: string;
  desc: string;
  followers: string;
  avatar: string;
  videos: Video[];
}

const FollowList: React.FC = () => {
  const navigate = useNavigate();
  const [recentVisitedList, setRecentVisitedList] = useState<RecentVisitedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 从本地缓存加载最近访问列表
  const loadRecentVisitedList = useCallback(() => {
    try {
      setLoading(true);
      
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.log('用户未登录，显示空列表');
        setRecentVisitedList([]);
        return;
      }
      
      // 获取用户特定的访问记录
      const visitedList = getUserRecentVisited(currentUserId);
      
      // console.log('加载最近访问列表:', visitedList);
      setRecentVisitedList(visitedList);
      // console.log('设置最近访问列表完成，共', visitedList.length, '个用户');
    } catch (error) {
      // console.error('加载最近访问列表失败:', error);
      setRecentVisitedList([]); // 确保出错时显示空列表
    } finally {
      setLoading(false);
    }
  }, []);

  // 清除访问记录（同时取消关注）
  const handleClearVisited = useCallback(async (userId: string) => {
    try {
      // 找到要清除的用户信息
      const userToRemove = recentVisitedList.find(user => user.userId === userId);
      if (!userToRemove) {
        Toast.show({
          content: '用户信息不存在',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      // 先尝试取消关注（如果用户已关注的话）
      try {
        await FollowService.unfollowUser(userId);
        // console.log('已取消关注用户:', userId);
      } catch (error: any) {
        // 如果用户本来就没有关注，或者其他错误，继续执行清除本地记录
        // console.log('取消关注时出现错误，可能用户未关注:', error);
      }
      
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        Toast.show({
          content: '用户未登录',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      // 更新用户特定的followedUps状态（从中移除）
      try {
        const followedUpsArray = getUserFollowedUps(currentUserId);
        const updatedFollowedUps = followedUpsArray.filter((id: number) => id !== userToRemove.id);
        setUserFollowedUps(updatedFollowedUps, currentUserId);
        // console.log('已从followedUps中移除用户ID:', userToRemove.id);
      } catch (error) {
        console.error('更新followedUps失败:', error);
      }
      
      // 从最近访问列表中移除该用户
      setRecentVisitedList(prev => {
        const newList = prev.filter(user => user.userId !== userId);
        // 更新用户特定的访问记录
        setUserRecentVisited(newList, currentUserId);
        return newList;
      });

      // 触发全局状态更新事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('followStateChanged'));
      
      Toast.show({
        content: '已清除访问记录',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('清除访问记录失败:', error);
      Toast.show({
        content: '清除记录失败，请重试',
        icon: 'fail',
        duration: 2000
      });
    }
  }, [recentVisitedList]);

  // 清空所有访问记录（同时取消所有关注）
  const handleClearAllVisited = useCallback(async () => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        Toast.show({
          content: '用户未登录',
          icon: 'fail',
          duration: 2000
        });
        return;
      }

      // 获取当前访问列表中的所有用户ID
      const userIds = recentVisitedList.map(user => user.userId);
      const userIdNumbers = recentVisitedList.map(user => user.id);
      
      // 批量取消关注
      const unfollowPromises = userIds.map(async (userId) => {
        try {
          await FollowService.unfollowUser(userId);
          // console.log('已取消关注用户:', userId);
        } catch (error) {
          // 忽略单个用户取消关注失败的错误
          // console.log('取消关注用户失败:', userId, error);
        }
      });
      
      // 等待所有取消关注操作完成
      await Promise.allSettled(unfollowPromises);
      
      // 清空用户特定的followedUps状态
      try {
        const followedUpsArray = getUserFollowedUps(currentUserId);
        // 过滤掉所有要清除的用户ID
        const updatedFollowedUps = followedUpsArray.filter((id: number) => !userIdNumbers.includes(id));
        setUserFollowedUps(updatedFollowedUps, currentUserId);
        // console.log('已从followedUps中移除所有用户ID:', userIdNumbers);
      } catch (error) {
        console.error('更新followedUps失败:', error);
      }
      
      // 清空本地记录
      setRecentVisitedList([]);
      setUserRecentVisited([], currentUserId);

      // 触发全局状态更新事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('followStateChanged'));
      
      Toast.show({
        content: '已清空所有访问记录',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('清空访问记录失败:', error);
      Toast.show({
        content: '清空记录失败，请重试',
        icon: 'fail',
        duration: 2000
      });
    }
  }, [recentVisitedList]);

  // 跳转到用户详情
  const handleUserClick = useCallback((user: RecentVisitedUser) => {
    // 跳转到用户详情页
    navigate(`/home/mine/setting/${user.userId}`);
  }, [navigate]);

  // 返回上一页
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 跳转到发现页面
  const handleGoDiscover = useCallback(() => {
    navigate('/home/first');
  }, [navigate]);

  // 统计信息计算
  const statsInfo = useMemo(() => ({
    totalCount: recentVisitedList?.length || 0,
    isEmpty: !recentVisitedList || recentVisitedList.length === 0
  }), [recentVisitedList]);

  useEffect(() => {
    loadRecentVisitedList();
  }, [loadRecentVisitedList]);

  return (
    <div className="follow-list-container">
      {/* 顶部导航栏 */}
      <div className="follow-header">
        <div className="header-left">
          <LeftOutline 
            onClick={handleBack} 
            fontSize={24}
            className="back-icon"
          />
        </div>
        <div className="header-center">
          <h1 className="page-title">最近访问</h1>
          {!statsInfo.isEmpty && (
            <span className="follow-count">({statsInfo.totalCount})</span>
          )}
        </div>
        <div className="header-right">
          {!statsInfo.isEmpty && (
            <Button
              size="mini"
              color="danger"
              fill="none"
              onClick={handleClearAllVisited}
              style={{ fontSize: '12px', padding: '2px 8px' }}
            >
              清空
            </Button>
          )}
          <ClockCircleOutline fontSize={24} className="clock-icon" />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="follow-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : !statsInfo.isEmpty ? (
          <>
            {/* 最近访问列表 */}
            <div className="follow-list">
              {recentVisitedList.map((user, index) => (
                <div key={user.id} className="follow-item" style={{'--delay': `${index * 0.1}s`} as React.CSSProperties}>
                  <div className="user-card">
                    <div className="user-info" onClick={() => handleUserClick(user)}>
                      <div className="avatar-section">
                        <Avatar
                          src={user.avatar}
                          style={{ '--size': '56px' }}
                          fallback={<UserOutline />}
                          className="user-avatar"
                        />
                        <div className="online-indicator"></div>
                      </div>
                      
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-desc">{user.desc || '这个人很神秘，什么都没有写...'}</div>
                        <div className="user-stats">
                          <div className="stats-container">
                            <span className="stat-item">
                              <span className="stat-number">{user.followers}</span>
                              <span className="stat-label">粉丝</span>
                            </span>
                            <span className="stat-divider">•</span>
                            <span className="stat-item">
                              <span className="stat-number">{user.videos?.length || 0}</span>
                              <span className="stat-label">作品</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="action-section">
                      <Button
                        color="danger"
                        fill="outline"
                        size="small"
                        onClick={() => handleClearVisited(user.userId)}
                        className="unfollow-btn"
                      >
                        清除记录
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 底部统计 */}
            <div className="follow-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <ClockCircleOutline />
                </div>
                <div className="summary-text">
                  最近访问了 <span className="highlight-number">{statsInfo.totalCount}</span> 位创作者
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 空状态 */
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-icon">
                <ClockCircleOutline />
              </div>
              <div className="empty-decoration"></div>
            </div>
            <div className="empty-content">
              <h3 className="empty-title">暂无访问记录</h3>
              <p className="empty-subtitle">浏览感兴趣的创作者，开始你的探索之旅</p>
              <Button 
                color="primary" 
                size="large"
                onClick={handleGoDiscover}
                className="discover-btn"
              >
                去发现
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowList;