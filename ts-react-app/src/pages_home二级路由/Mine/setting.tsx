import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, NavBar, Tabs } from 'antd-mobile'
import { LeftOutline, UploadOutline } from 'antd-mobile-icons'
import tokenManager from '../../utils/tokenManager'
import axios from 'axios'
import LevelInfo from '../../components/LevelInfo'
import './setting.scss'

export default function Setting() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>({})

  const getUserInfo = async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        console.error('No access token available')
        return
      }
      
      const res = await axios.get('http://localhost:9527/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setUser(res.data.data)
    } catch (error) {
      console.error('Failed to get user info:', error)
    }
  }

  useEffect(() => {
    getUserInfo()
  }, [])

  const tabs = [
    { key: 'home', title: '主页' },
    { key: 'video', title: '投稿' },
    { key: 'collection', title: '收藏' }
  ]

  return (
    <div className='setting-container'>
      {/* 顶部导航 */}
      {/* <NavBar
        className='setting-navbar'
        left={<LeftOutline onClick={() => navigate(-1)} />}
      >
        <div className='navbar-title'></div>
      </NavBar> */}

<LeftOutline onClick={() => navigate(-1)} fontSize={24}/>

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
              <div className='stat-number'>{user.stats==undefined?0:user.stats.videos}</div>
              <div className='stat-label'>粉丝</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>{user.stats==undefined?0:user.stats.following}</div>
              <div className='stat-label'>关注</div>
            </div>
            <div className='stat-item'>
              <div className='stat-number'>{user.stats==undefined?0:user.stats.likes}</div>
              <div className='stat-label'>获赞</div>
            </div>
          </div>
        </div>

        {/* 编辑资料按钮 */}
        <div className='edit-profile-section'>
          <div className='edit-profile-btn'>
            编辑资料
          </div>
        </div>

        {/* 用户详细信息 */}
        <div className='user-details'>
          <div className='user-name-section'>
            <span className='username'>{user.username}</span>
            <span className='vip-badge'>大会员</span>
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
                    <div className='upload-btn'>
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
