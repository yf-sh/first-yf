import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import './index.scss'
import axios from 'axios'
import { Avatar, Space, Dialog, Toast } from 'antd-mobile'
import {
  EditSOutline, RightOutline, StarOutline,
  UploadOutline, UndoOutline, RedoOutline, CalendarOutline,
  TextOutline, CameraOutline, PayCircleOutline,
  DownlandOutline, BellOutline,
} from 'antd-mobile-icons'
import tokenManager from '../../utils/tokenManager'
import { getUserFollowedUps } from '../../utils/userHelper'
import UserService from '../../services/userService'
import { setUserStats } from '../../store/slices/userSlice'

export default function Mine() {
  const [user, setUser] = useState<any>({})
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const userStats = useSelector((state: any) => state.user.userStats)


  // 退出登录处理函数
  const handleLogout = useCallback(() => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          // 调用后端登出接口
          await UserService.logout()
          // 清除本地token（userService.logout已经调用了tokenManager.clearTokens）
          // 跳转到登录页面
          navigate('/login')
        } catch (error) {
          console.error('退出登录失败:', error)
          // 即使后端接口失败，也要清除本地token并跳转
          tokenManager.clearTokens()
          navigate('/login')
        }
      }
    })
  }, [navigate])
  // 检查会员是否过期
  const checkMembershipExpiry = useCallback((): { isValid: boolean; message?: string } => {
    if (!user?.membership) {
      return { isValid: true }; // 没有会员信息，可以开通
    }

    const { isActive, endDate } = user.membership;
    
    if (!isActive) {
      return { isValid: true }; // 会员未激活，可以开通
    }

    if (endDate) {
      const now = new Date();
      const membershipEndDate = new Date(endDate);
      
      if (membershipEndDate > now) {
        // 会员还未过期
        const remainingDays = Math.ceil((membershipEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          isValid: false, 
          message: `您的会员还有${remainingDays}天到期，暂无需开通新会员` 
        };
      }
    }

    return { isValid: true }; // 会员已过期，可以开通
  }, [user?.membership]);

  // 处理开通会员点击事件
  const handleMembershipClick = useCallback(() => {
    const membershipCheck = checkMembershipExpiry();
    if (!membershipCheck.isValid) {
      Toast.show(membershipCheck.message || '会员还未过期');
      return;
    }
    navigate('/home/mine/membership');
  }, [checkMembershipExpiry, navigate]);

  const getUserInfo = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        console.error('No access token available')
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
          console.error('获取本地关注数量失败:', error);
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
        console.warn('获取统计信息失败，使用本地数据:', statsError);
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
      console.error('Failed to get user info:', error)
      
      // 401错误由TokenManager的拦截器自动处理，这里只处理其他错误
      if (error.response?.status === 403) {
        // 403是权限不足错误，不是token过期
        console.log('权限不足')
        // 可以显示权限不足的提示，但不需要退出登录
      } else if (error.message === 'Token refresh failed') {
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
      if (e.key === 'user' || e.key === 'followedUps') {
        if (storageTimeout) clearTimeout(storageTimeout);
        storageTimeout = window.setTimeout(() => {
          console.log('检测到存储数据变化，重新获取用户信息');
          getUserInfo();
        }, 300); // 300ms节流
      }
    };
    
    // 监听自定义事件（用于同一页面内的数据更新）
    let updateTimeout: number | null = null;
    const handleUserStatsUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = window.setTimeout(() => {
        console.log('检测到用户统计数据更新');
        getUserInfo();
      }, 200); // 200ms节流
    };

    // 监听关注状态变化
    let followTimeout: number | null = null;
    const handleFollowStateChange = () => {
      if (followTimeout) clearTimeout(followTimeout);
      followTimeout = window.setTimeout(() => {
        console.log('检测到关注状态变化，重新获取用户信息');
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

  // 使用 useMemo 优化用户等级显示
  const userLevelDisplay = useMemo(() => {
    if (!user.level) return <span>LV1</span>;
    return user.level === 1 ? <span>LV1</span> : 
           user.level === 2 ? <span>LV2</span> : <span>LV3</span>;
  }, [user.level]);

  // 优化导航函数
  const handleSettingClick = useCallback(() => {
    navigate('/home/mine/setting');
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    navigate('/home/create');
  }, [navigate]);

  const handleFollowListClick = useCallback(() => {
    navigate('/home/mine/follow-list');
  }, [navigate]);

  // 处理客服聊天
  const handleCustomerServiceClick = useCallback(() => {
    // 使用固定的客服ID跳转到聊天页面
    const customerServiceId = 'customer-service-001';
    navigate(`/chat/${customerServiceId}`);
  }, [navigate]);

  return (
    <div className='mine-container'>
      {/* 固定的顶部区域 */}
      <div className='fixed-header' >
        <div className='user-info' onClick={handleSettingClick}>
          <div className='user-info-left'>
            <Space block direction='vertical'>
              <Avatar src={user.avatar} style={{ '--size': '70px', '--border-radius': '50%' }} />
            </Space>
          </div>
          <div className='user-info-center'>
            <div className='user-info-center-top'>
              <h3>{user.username || '用户'} <EditSOutline /></h3>
              <p>{userLevelDisplay}</p>
            </div>
            <p 
              className={`user-info-center-bottom ${user.membership?.isActive ? 'active' : 'inactive'}`}
              onClick={user.membership?.isActive ? undefined : handleMembershipClick}
              style={{ cursor: user.membership?.isActive ? 'default' : 'pointer' }}
            >
              {user.membership?.isActive ? '大会员' : '开通会员'}
            </p>
          </div>
          <div className='user-info-right'>
            <p>空间<RightOutline /></p>
          </div>
        </div>

        <div className='user-menu-top'>
          <div>
            <h3>{(userStats?.videos) || (user.stats?.videos) || 0}</h3>
            <p>动态</p>
          </div>
          <div>|</div>
          <div onClick={handleFollowListClick}>
            <h3>{(userStats?.following) || (user.stats?.following) || 0}</h3>
            <p>关注</p>
          </div>
          <div>|</div>
          <div>
            <h3>{(userStats?.followers) || (user.stats?.followers) || 0}</h3>
            <p>粉丝</p>
          </div>
          <div>|</div>
          <div>
            <h3>{(userStats?.likes) || (user.stats?.likes) || 0}</h3>
            <p>获赞</p>
          </div>
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className='scrollable-content'>
        <div className='user-menu-bottom' onClick={handleMembershipClick}>
          <div className='user-menu-bottom-item1'>
            <h3>开通大会员</h3>
            <p>开通后可享受会员权益</p>
          </div>
          <div className='user-menu-bottom-item2'>
            <p>会员中心</p>
          </div>
        </div>

        <div className='user-menu'>
          <div>
            <p className='user-menu-item'><UploadOutline fontSize={24} color='#00AEEC' /></p>
            <p>离线缓存</p>
          </div>
          <div>
            <p className='user-menu-item'><UndoOutline fontSize={24} color='#00AEEC' /></p>
            <p>历史记录</p>
          </div>
          <div>
            <p className='user-menu-item'><StarOutline fontSize={24} color='#00AEEC' /></p>
            <p>我的收藏</p>
          </div>
          <div>
            <p className='user-menu-item'><RedoOutline fontSize={24} color='#00AEEC' /></p>
            <p>稍后再看</p>
          </div>
        </div>

        <div className='user-video' onClick={handleCreateClick}>
          <div className='user-video-left'>
            <h3>发布你的第一个视频</h3>
            <p>分享你的创作故事，与大家一起进步！</p>
          </div>
          <div className='user-video-right'>
            <p>有奖发布</p>
          </div>
        </div>

        <div className='user-recommend-service'>
          <h3>推荐服务</h3>
        </div>
        <div className='user-menu-grid'>
          <div>
            <p className='user-menu-item'><CalendarOutline fontSize={24} color='#FF2D92' /></p>
            <p>我的课程</p>
          </div>
          <div>
            <p className='user-menu-item'><TextOutline fontSize={24} color='#FF2D92' /></p>
            <p>免流量服务</p>
          </div>
          <div>
            <p className='user-menu-item'><StarOutline fontSize={24} color='#FF2D92' /></p>
            <p>个性装扮</p>
          </div>
          <div>
            <p className='user-menu-item'><PayCircleOutline fontSize={24} color='#FF2D92' /></p>
            <p>我的钱包</p>
          </div>
          <div>
            <p className='user-menu-item'><CameraOutline fontSize={24} color='#FF2D92' /></p>
            <p>游戏中心</p>
          </div>
          <div onClick={handleMembershipClick}>
            <p className='user-menu-item'><DownlandOutline fontSize={24} color='#FF2D92' /></p>
            <p>会员中心</p>
          </div>
          <div>
            <p className='user-menu-item'><BellOutline fontSize={24} color='#FF2D92' /></p>
            <p>我的直播</p>
          </div>
        </div>

        <div className='more-services'>
          <h3>更多服务</h3>
        </div>
        
        <div className='service-list'>
          <div className='service-item' onClick={handleCustomerServiceClick}>
            <div className='service-left'>
              <span className='service-icon'>🎧</span>
              <span className='service-text'>联系客服</span>
            </div>
            <RightOutline className='service-arrow' />
          </div>
          
          <div className='service-item'>
            <div className='service-left'>
              <span className='service-icon'>🎵</span>
              <span className='service-text'>听视频</span>
            </div>
            <div className='service-right'>
              <span className='notification-dot'></span>
              <RightOutline className='service-arrow' />
            </div>
          </div>
          
          <div className='service-item'>
            <div className='service-left'>
              <span className='service-icon'>🛡️</span>
              <span className='service-text'>未成年人守护</span>
            </div>
            <RightOutline className='service-arrow' />
          </div>
          
          <div className='service-item' onClick={handleLogout}>
            <div className='service-left'>
              <span className='service-icon'>⚙️</span>
              <span className='service-text'>退出登录</span>
            </div>
            <RightOutline className='service-arrow' />
          </div>
        </div>

        <div style={{ height: '40px' }}>
          {/* 底部间距，确保所有内容可见 */}
        </div>
      </div>
    </div>
  )
}


