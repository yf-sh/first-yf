import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import './index.scss'
import axios from 'axios'
import { Avatar, Space, Dialog } from 'antd-mobile'
import {
  EditSOutline, RightOutline, StarOutline,
  UploadOutline, UndoOutline, RedoOutline, CalendarOutline,
  TextOutline, CameraOutline, PayCircleOutline,
  SmileOutline, HeartOutline, DownlandOutline, BellOutline,
  UserOutline, TeamOutline, SetOutline,
  PhonebookOutline, FileOutline, GiftOutline
} from 'antd-mobile-icons'
import tokenManager from '../../utils/tokenManager'
import UserService from '../../services/userService'
import { setUserStats } from '../../store/slices/userSlice'

export default function Mine() {
  const [user, setUser] = useState<any>([])
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const userStats = useSelector((state: any) => state.user.userStats)

  // 退出登录处理函数
  const handleLogout = () => {
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
  }
  const getUserInfo = async () => {
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
      
      // 获取最新的统计信息
      try {
        const statsResponse = await UserService.getUserStats();
        userData.stats = statsResponse.stats;
        // 同步到Redux store
        dispatch(setUserStats(statsResponse.stats));
      } catch (statsError) {
        console.warn('获取统计信息失败，使用默认值:', statsError);
        // 如果获取统计信息失败，使用默认值
        if (!userData.stats) {
          userData.stats = {
            followers: 0,
            following: 0,
            videos: 0,
            likes: 0,
            views: 0
          };
          // 同步默认值到Redux store
          dispatch(setUserStats(userData.stats));
        }
      }
      
      setUser(userData)
    } catch (error: any) {
      console.error('Failed to get user info:', error)
      
      // 处理403权限错误或401认证错误
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log('Token可能已过期，跳转到登录页')
        tokenManager.clearTokens()
        navigate('/login')
      }
    }
  }
  
  useEffect(() => {
    getUserInfo()
  }, [])
  return (
    <div className='mine-container'>
      {/* 固定的顶部区域 */}
      <div className='fixed-header' onClick={()=>{navigate('/home/mine/setting')}}>
        <div className='user-info'>
          <div className='user-info-left'>
            <Space block direction='vertical'>
              <Avatar src={user.avatar} style={{ '--size': '70px', '--border-radius': '50%' }} />
            </Space>
          </div>
          <div className='user-info-center'>
            <div className='user-info-center-top'>
              <h3>{user.username} <EditSOutline /></h3>
              <p>
                {user.level == 1 ? (<span>LV1</span>) : (user.level == 2 ? (<span>LV2</span>) : (<span>LV3</span>))}
              </p>
            </div>
            <p className='user-info-center-bottom'>正式会员</p>
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
          <div>
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
        <div className='user-menu-bottom'>
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

        <div className='user-video'>
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
          <div>
            <p className='user-menu-item'><DownlandOutline fontSize={24} color='#FF2D92' /></p>
            <p>会员中心</p>
          </div>
          <div>
            <p className='user-menu-item'><BellOutline fontSize={24} color='#FF2D92' /></p>
            <p>我的直播</p>
          </div>
          <div>
            <p className='user-menu-item'><SmileOutline fontSize={24} color='#FF2D92' /></p>
            <p>漫画</p>
          </div>
          <div>
            <p className='user-menu-item'><FileOutline fontSize={24} color='#FF2D92' /></p>
            <p>必火推广</p>
          </div>
          <div>
            <p className='user-menu-item'><SetOutline fontSize={24} color='#FF2D92' /></p>
            <p>创作中心</p>
          </div>
          <div>
            <p className='user-menu-item'><TeamOutline fontSize={24} color='#FF2D92' /></p>
            <p>社区中心</p>
          </div>
          <div>
            <p className='user-menu-item'><PhonebookOutline fontSize={24} color='#FF2D92' /></p>
            <p>能量加油站</p>
          </div>
          <div>
            <p className='user-menu-item'><HeartOutline fontSize={24} color='#FF2D92' /></p>
            <p>哔哩哔哩公益</p>
          </div>
          <div>
            <p className='user-menu-item'><GiftOutline fontSize={24} color='#FF2D92' /></p>
            <p>BW乐园</p>
          </div>
          <div>
            <p className='user-menu-item'><UserOutline fontSize={24} color='#FF2D92' /></p>
            <p>B萌投票</p>
          </div>
        </div>

        <div className='more-services'>
          <h3>更多服务</h3>
        </div>
        
        <div className='service-list'>
          <div className='service-item'>
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


