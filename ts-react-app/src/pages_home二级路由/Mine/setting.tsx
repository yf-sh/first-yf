import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Avatar, Tabs } from 'antd-mobile'
import { LeftOutline, UploadOutline } from 'antd-mobile-icons'
import tokenManager from '../../utils/tokenManager'
import { setUserStats } from '../../store/slices/userSlice'
import UserService from '../../services/userService'
import { getUserFollowedUps } from '../../utils/userHelper'
import axios from 'axios'
import LevelInfo from '../../components/LevelInfo'
import './setting.scss'

export default function Setting() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [user, setUser] = useState<any>({})
  const userStats = useSelector((state: any) => state.user.userStats)

  const getUserInfo = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        // console.error('No access token available')
        navigate('/login')
        return
      }
      
      const res = await axios.get('http://localhost:9527/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // 获取基本用户信息
      let userData = res.data.data;
      
      // 获取本地实际的关注数量
      const getLocalFollowingCount = () => {
        try {
          const followedUps = getUserFollowedUps();
          return followedUps.length;
        } catch (error) {
          // console.error('获取本地关注数量失败:', error);
          return 0;
        }
      };

      // 获取最新的统计信息
      try {
        const statsResponse = await UserService.getUserStats();
        const localFollowingCount = getLocalFollowingCount();
        
        // 使用本地实际关注数量，其他数据使用服务器返回值
        userData.stats = {
          ...statsResponse.stats,
          following: localFollowingCount // 使用本地实际关注数量
        };
        
        // 同步到Redux store
        dispatch(setUserStats(userData.stats));
      } catch (statsError) {
        // console.warn('获取统计信息失败，使用本地数据:', statsError);
        const localFollowingCount = getLocalFollowingCount();
        
        // 如果获取统计信息失败，使用本地数据和默认值
        userData.stats = {
          followers: 0,
          following: localFollowingCount, // 使用本地实际关注数量
          videos: 0,
          likes: 0,
          views: 0
        };
        
        // 同步到Redux store
        dispatch(setUserStats(userData.stats));
      }
      
      setUser(userData)
    } catch (error: any) {
      // console.error('Failed to get user info:', error)
      
      // 401错误由TokenManager的拦截器自动处理，这里只处理其他错误
      if (error.response?.status === 403) {
        // 403是权限不足错误，不是token过期
        console.log('权限不足')
        // 可以显示权限不足的提示，但不需要退出登录
      } else if (error.message === 'Token refresh failed' || error.response?.status === 401) {
        // 只有当TokenManager刷新失败时才跳转登录
        console.log('Token刷新失败，跳转到登录页')
        navigate('/login')
      }
    }
  }, [navigate, dispatch])

  useEffect(() => {
    getUserInfo()
    
    // 监听storage变化，实时更新用户数据 - 使用节流
    let storageTimeout: number | null = null;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key?.includes('followedUps')) {
        if (storageTimeout) clearTimeout(storageTimeout);
        storageTimeout = window.setTimeout(() => {
          // console.log('Setting页面检测到存储数据变化，重新获取用户信息');
          getUserInfo();
        }, 300); // 300ms节流
      }
    };
    
    // 监听自定义事件（用于同一页面内的数据更新）
    let updateTimeout: number | null = null;
    const handleUserStatsUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = window.setTimeout(() => {
        // console.log('Setting页面检测到用户统计数据更新');
        getUserInfo();
      }, 200); // 200ms节流
    };

    // 监听关注状态变化
    let followTimeout: number | null = null;
    const handleFollowStateChange = () => {
      if (followTimeout) clearTimeout(followTimeout);
      followTimeout = window.setTimeout(() => {
        // console.log('Setting页面检测到关注状态变化，重新获取用户信息');
        getUserInfo();
      }, 200); // 200ms节流
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userStatsUpdated', handleUserStatsUpdate);
    window.addEventListener('followStateChanged', handleFollowStateChange);
    
    return () => {
      if (storageTimeout) clearTimeout(storageTimeout);
      if (updateTimeout) clearTimeout(updateTimeout);
      if (followTimeout) clearTimeout(followTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userStatsUpdated', handleUserStatsUpdate);
      window.removeEventListener('followStateChanged', handleFollowStateChange);
    };
  }, [getUserInfo])

  const tabs = useMemo(() => [
    { key: 'home', title: '主页' },
    { key: 'video', title: '投稿' },
    { key: 'collection', title: '收藏' }
  ], []);

  // 优化导航函数
  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleEditClick = useCallback(() => {
    navigate('/home/mine/edit');
  }, [navigate]);

  const handleMembershipClick = useCallback(() => {
    navigate('/home/mine/membership');
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    navigate('/home/create');
  }, [navigate]);

  return (
    <div className='setting-container'>
      {/* 顶部导航 */}
      <LeftOutline onClick={handleBackClick} fontSize={24}/>

      {/* 用户信息区域 */}
      <div className='user-profile-section'>
        {/* 头像和统计信息 */}
        <div className='profile-header'>
          <div className='avatar-section'>
            <Avatar 
              src={user.avatar || ''} 
              className='profile-avatar'
              style={{ 
                '--size': '80px',
                '--border-radius': '50%',
                backgroundColor: '#e8f4fd'
              }}
            />
          </div>
          
          <div className='stats-section'>
            <div className='stat-item'>
              <div className='stat-number'>{(userStats?.followers) || (user.stats?.followers) || 0}</div>
              <div className='stat-label'>粉丝</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>{(userStats?.following) || (user.stats?.following) || 0}</div>
              <div className='stat-label'>关注</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>{(userStats?.likes) || (user.stats?.likes) || 0}</div>
              <div className='stat-label'>获赞</div>
            </div>
          </div>
        </div>

        {/* 编辑资料按钮 */}
        <div className='edit-profile-section'>
          <div className='edit-profile-btn' onClick={handleEditClick}>
            编辑资料
          </div>
        </div>

        {/* 用户详细信息 */}
        <div className='user-details'>
          <div className='user-name-section'>
            <span className='username'>{user.username}</span>
            {user.membership?.isActive ? (
              <span className='vip-badge active'>大会员</span>
            ) : (
              <span className='vip-badge inactive' onClick={handleMembershipClick}>
                开通会员
              </span>
            )}
            <span className='level-badge'>粉丝勋章</span>
            <span className='achievement-badge'>成就勋章</span>
          </div>

          <div className='user-bio'>
            {user.bio || '这个人很神秘，什么都没有写'}
            <span className='detail-link'>详情</span>
          </div>

          <div className='user-location'>
            <span className='location-icon'>📍</span>
            <span className='location-text'>IP属地：河北</span>
            <span className='school-info'>+ 添加学校信息</span>
          </div>
        </div>
      </div>

      {/* 等级信息 */}
      <LevelInfo />

      {/* 内容标签 */}
      <div className='content-tabs'>
        <Tabs>
          {tabs.map(tab => (
            <Tabs.Tab title={tab.title} key={tab.key}>
              <div className='tab-content'>
                {tab.key === 'video' && (
                  <div className='video-upload-section'>
                    <div className='upload-icon'>
                      <UploadOutline fontSize={48} />
                    </div>
                    <div className='upload-text'>
                      发布第一个视频，领新人福利
                    </div>
                    <div className='upload-btn' onClick={handleCreateClick}>
                      我要投稿
                    </div>
                    <div className='creator-center'>
                      去创作中心领奖 &gt;
                    </div>
                  </div>
                )}
                {tab.key === 'home' && (
                  <div className='empty-content'>
                    <div>暂无内容</div>
                  </div>
                )}
                {tab.key === 'collection' && (
                  <div className='empty-content'>
                    <div>暂无收藏</div>
                  </div>
                )}
              </div>
            </Tabs.Tab>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
