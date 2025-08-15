import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Card, Button, Avatar, Grid, InfiniteScroll, PullToRefresh, NavBar, Toast } from 'antd-mobile';
import { useDispatch } from 'react-redux';
import BackToTop from '../../components/BackToTop';
import UserService from '../../services/userService';
import { updateFollowingCount, setUserStats } from '../../store/slices/userSlice';
import { awardFollowExp } from '../../utils/experienceManager';
import { 
  getCurrentUserId, 
  getUserFollowedUps, 
  setUserFollowedUps, 
  getUserRecentVisited, 
  setUserRecentVisited,
  migrateUserData 
} from '../../utils/userHelper';
import './index.scss';

// 基础模拟数据
const baseUpData = [
  {
    id: 1,
    userId: 'test-user-1', // 暂时使用简单的测试ID
    name: '哔哩哔哩弹幕网',
    desc: '官方账号',
    followers: '111.3万',
    avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 1, title: '李艺彤 x 洛天依 (CONNECT-心)', views: '111.3万播放', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=80&fit=crop' },
      { id: 2, title: '【全球回顾】BILIBILI 16周年庆', views: '67.6万播放', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=120&h=80&fit=crop' },
      { id: 3, title: '对谈《你得关注腾不懂的三个理由》', views: '10万播放', thumbnail: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=120&h=80&fit=crop' }
    ]
  },
  
  {
    id: 2,
    userId: 'test-user-2', // 暂时使用简单的测试ID
    name: '好奇星人知识嗨',
    desc: '泛知识官方账号',
    followers: '262万',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 4, title: '简小智：我们真的愿意正视的性教育！', views: '262万播放', thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=120&h=80&fit=crop' },
      { id: 5, title: '不吃这很友善怎么回答？减肥的总想...', views: '164万播放', thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=120&h=80&fit=crop' },
      { id: 6, title: '用AI进行房屋人测控，它竟然为了真的...', views: '64.5万播放', thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=120&h=80&fit=crop' }
    ]
  },

  {
    id: 3,
    userId: 'test-user-3', // 暂时使用简单的测试ID
    name: '哔哩哔哩番剧',
    desc: '番剧官方账号',
    followers: '2.1万',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 7, title: '小确日常：第5话 性', views: '2.1万播放', thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=80&fit=crop' },
      { id: 8, title: '她与者：第5话 任', views: '1.1万播放', thumbnail: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=120&h=80&fit=crop' },
      { id: 9, title: '流光曲之夜：第5话', views: '1.3万播放', thumbnail: 'https://imgessl.kugou.com/stdmusic/20220923/20220923013016961025.jpg' }
    ]
  },
  {
    id: 4,
    userId: '60d5ecb54f123a001f123459', // 模拟的MongoDB ObjectId
    name: '科技前沿探索',
    desc: '科技博主',
    followers: '89.5万',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 10, title: 'ChatGPT最新功能解析', views: '45.2万播放', thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=120&h=80&fit=crop' },
      { id: 11, title: '苹果Vision Pro深度体验', views: '67.8万播放', thumbnail: 'https://img0.baidu.com/it/u=820814403,651182230&fm=253&app=138&f=JPEG?w=942&h=800' },
      { id: 12, title: '新能源汽车技术革命', views: '32.1万播放', thumbnail: 'https://q2.itc.cn/q_70/images01/20240919/bccdc62c7d794aef81a41aff6768fbfe.jpeg' }
    ]
  },
  {
    id: 5,
    userId: '60d5ecb54f123a001f12345a', // 模拟的MongoDB ObjectId
    name: '美食探险家',
    desc: '美食达人',
    followers: '156.7万',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 13, title: '日式料理制作全攻略', views: '78.9万播放', thumbnail: 'https://qcloud.dpfile.com/pc/B97a1afg0O4ajyNsts8sn0h6J0AW57-NHyjRtPN-hsekjN8bNUIedMn0CzPJ61Sv.jpg' },
      { id: 14, title: '街头小吃寻味之旅', views: '124.3万播放', thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&h=80&fit=crop' },
      { id: 15, title: '法式甜点制作秘籍', views: '91.2万播放', thumbnail: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=120&h=80&fit=crop' }
    ]
  },
  {
    id: 6,
    userId: '60d5ecb54f123a001f12345b', // 模拟的MongoDB ObjectId
    name: '旅行摄影师',
    desc: '旅行博主',
    followers: '73.4万',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
    videos: [
      { id: 16, title: '新疆风光摄影之旅', views: '156.8万播放', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=80&fit=crop' },
      { id: 17, title: '日本樱花季拍摄指南', views: '89.6万播放', thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=120&h=80&fit=crop' },
      { id: 18, title: '冰岛极光追寻记', views: '203.7万播放', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=120&h=80&fit=crop' }
    ]
  }
];

// 模拟加载延迟
const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

// 模拟获取数据的函数
const mockLoadData = async (page: number): Promise<UpData[]> => {
  await sleep(1000); // 模拟网络延迟
  
  const pageSize = 3;
  const startIndex = (page - 1) * pageSize;
  
  // 循环使用基础数据
  const data: UpData[] = [];
  for (let i = 0; i < pageSize; i++) {
    const sourceIndex = (startIndex + i) % baseUpData.length;
    const sourceItem = baseUpData[sourceIndex];
    
    data.push({
      ...sourceItem,
      id: startIndex + i + 1000, // 确保ID唯一
      name: page > 1 && i === 0 ? `${sourceItem.name} (第${page}页)` : sourceItem.name,
      videos: sourceItem.videos.map(video => ({
        ...video,
        id: video.id + (startIndex + i) * 100 // 确保视频ID也唯一
      }))
    });
  }
  
  return data;
};

// 定义数据类型
interface Video {
  id: number;
  title: string;
  views: string;
  thumbnail: string;
}

interface UpData {
  id: number;
  userId: string;
  name: string;
  desc: string;
  followers: string;
  avatar: string;
  videos: Video[];
}

export default function Create() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('all');
  const [upData, setUpData] = useState<UpData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followedUps, setFollowedUps] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentVisited, setRecentVisited] = useState<UpData[]>([]);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showFollowedOverlay, setShowFollowedOverlay] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [sessionFollowedList, setSessionFollowedList] = useState<UpData[]>([]);
  const [followingInProgress, setFollowingInProgress] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const visitedListRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { key: 'all', title: '全部' },
    { key: 'video', title: '视频' }
  ];

  // 初始化数据
  useEffect(() => {
    // 进行数据迁移（仅在首次运行时）
    migrateUserData();
    loadInitialData();
    loadPersistedData();
  }, []);

  // 监听关注状态变化
  useEffect(() => {
    const handleFollowStateChange = () => {
      console.log('监听到关注状态变化，重新加载持久化数据');
      loadPersistedData();
    };

    // 添加事件监听器
    window.addEventListener('followStateChanged', handleFollowStateChange);

    // 清理函数
    return () => {
      window.removeEventListener('followStateChanged', handleFollowStateChange);
    };
  }, []);

  // 加载持久化数据
  const loadPersistedData = () => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.log('用户未登录，使用空数据');
        setFollowedUps(new Set<number>());
        setRecentVisited([]);
        setSessionFollowedList([]);
        setIsDataLoaded(true);
        return;
      }

      // 加载用户特定的关注状态
      const followedUpsArray = getUserFollowedUps(currentUserId);
      const followedSet = new Set<number>(followedUpsArray);
      setFollowedUps(followedSet);

      // 加载用户特定的访问历史
      const visitedList = getUserRecentVisited(currentUserId);
      setRecentVisited(visitedList);
      
      // 设置会话关注列表（只包含当前关注的UP主）
      const currentlyFollowed = visitedList.filter((up: UpData) => followedSet.has(up.id));
      setSessionFollowedList(currentlyFollowed);
      
      // 标记数据已加载
      setIsDataLoaded(true);
      
      console.log(`已加载用户 ${currentUserId} 的数据: 关注${followedUpsArray.length}人, 访问记录${visitedList.length}条`);
    } catch (error) {
      console.error('加载持久化数据失败:', error);
      setIsDataLoaded(true);
    }
  };

  // 检测是否可滚动
  useEffect(() => {
    const checkScrollable = () => {
      if (visitedListRef.current) {
        const { scrollWidth, clientWidth } = visitedListRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    // 延迟检查以确保DOM已更新
    const timer = setTimeout(checkScrollable, 100);
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [recentVisited]);

  // 保存关注状态到 localStorage
  useEffect(() => {
    if (isDataLoaded) {
      try {
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          setUserFollowedUps([...followedUps], currentUserId);
        }
      } catch (error) {
        console.error('保存关注状态失败:', error);
      }
    }
  }, [followedUps, isDataLoaded]);

  // 保存访问历史到 localStorage
  useEffect(() => {
    if (isDataLoaded) {
      try {
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          setUserRecentVisited(recentVisited, currentUserId);
        }
      } catch (error) {
        console.error('保存访问历史失败:', error);
      }
    }
  }, [recentVisited, isDataLoaded]);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      const data = await mockLoadData(1);
      setUpData(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  // 加载更多数据
  const loadMoreData = async () => {
    try {
      const nextPage = currentPage + 1;
      const newData = await mockLoadData(nextPage);
      
      if (newData.length > 0) {
        setUpData(prev => [...prev, ...newData]);
        setCurrentPage(nextPage);
        
        // 模拟最多加载10页
        if (nextPage >= 10) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('加载更多数据失败:', error);
    }
  };

  // 更新用户统计数据到localStorage
  const updateUserStatsInStorage = (followingChange: number) => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const currentFollowing = user.stats?.following || 0;
        const newFollowingCount = Math.max(0, currentFollowing + followingChange);
        
        const updatedStats = {
          ...user.stats,
          following: newFollowingCount
        };
        
        const updatedUser = {
          ...user,
          stats: updatedStats
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch(setUserStats(updatedStats));
        
        // 触发自定义事件通知其他组件更新
        window.dispatchEvent(new CustomEvent('userStatsUpdated', { 
          detail: { stats: updatedStats } 
        }));
        
        console.log('用户统计数据已更新:', updatedStats);
      }
    } catch (error) {
      console.error('更新用户统计数据失败:', error);
    }
  };

  // 处理关注/取消关注
  const handleFollowToggle = async (upId: number) => {
    // 防止重复点击
    if (followingInProgress.has(upId)) {
      return;
    }

    setFollowingInProgress(prev => new Set(prev).add(upId));

    try {
      const upInfo = upData.find(up => up.id === upId);
      if (!upInfo) {
        Toast.show('UP主信息不存在');
        return;
      }

      const isCurrentlyFollowed = followedUps.has(upId);

      if (isCurrentlyFollowed) {
        // 取消关注
        console.log('准备取消关注UP主:', upInfo.name, 'userId:', upInfo.userId);
        await UserService.unfollowUser(upInfo.userId);
        setFollowedUps(prev => {
          const newSet = new Set(prev);
          newSet.delete(upId);
          return newSet;
        });
        // 更新Redux中的关注数量和localStorage
        dispatch(updateFollowingCount(-1));
        updateUserStatsInStorage(-1);
        Toast.show('已取消关注');
      } else {
        // 关注
        console.log('准备关注UP主:', upInfo.name, 'userId:', upInfo.userId);
        await UserService.followUser(upInfo.userId);
        setFollowedUps(prev => new Set(prev).add(upId));
        
        // 更新Redux中的关注数量和localStorage
        dispatch(updateFollowingCount(1));
        updateUserStatsInStorage(1);
        
        // 奖励关注经验值
        awardFollowExp(upInfo.userId);
        
        // 添加到最常访问
        setRecentVisited(prevVisited => {
          const exists = prevVisited.some(visited => visited.id === upId);
          if (!exists) {
            return [...prevVisited, upInfo];
          }
          return prevVisited;
        });
        
        // 添加到会话关注列表
        setSessionFollowedList(prevSession => {
          const exists = prevSession.some(up => up.id === upId);
          if (!exists) {
            return [...prevSession, upInfo];
          }
          return prevSession;
        });
        
        Toast.show('关注成功');
      }
    } catch (error: any) {
      console.error('关注操作失败:', error);
      Toast.show(error.message || '操作失败，请重试');
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(upId);
        return newSet;
      });
    }
  };

  // 下拉刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 重置数据状态
      setCurrentPage(1);
      setHasMore(true);
      
      // 重新加载第一页数据
      const data = await mockLoadData(1);
      setUpData(data);
      
      // 可选：清除关注状态
      // setFollowedUps(new Set());
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 显示关注列表覆盖层
  const handleShowFollowedOverlay = () => {
    // 在显示关注列表时，更新sessionFollowedList，过滤掉已取消关注的UP主
    setSessionFollowedList(prev => prev.filter(up => followedUps.has(up.id)));
    setShowFollowedOverlay(true);
  };

  // 隐藏关注列表覆盖层
  const handleHideFollowedOverlay = () => {
    setShowFollowedOverlay(false);
  };

  // 获取会话关注列表中的UP主
  const getAllFollowedUps = () => {
    return sessionFollowedList;
  };

  return (
    <>
      <PullToRefresh
      onRefresh={handleRefresh}
      renderText={status => {
        switch (status) {
          case 'pulling':
            return '下拉即可刷新'
          case 'canRelease':
            return '释放立即刷新'
          case 'refreshing':
            return '正在刷新数据中...'
          case 'complete':
            return '刷新完成'
        }
      }}
    >
      <div className="create-page" ref={containerRef}>
        {/* 顶部选项卡 */}
        <div className="tabs-container">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {tabs.map(tab => (
              <Tabs.Tab title={tab.title} key={tab.key} />
            ))}
          </Tabs>
        </div>

        {/* 最常访问区域 */}
        {recentVisited.filter(up => followedUps.has(up.id)).length > 0 && (
          <div className={`recent-visited-section ${isScrollable ? 'scrollable' : ''}`}>
            <div className="section-header">
              <span className="section-title">最常访问</span>
              <span className="more-btn" onClick={handleShowFollowedOverlay}>更多 &gt;</span>
            </div>
            <div className="visited-list" ref={visitedListRef}>
              {recentVisited.filter(up => followedUps.has(up.id)).map((up: UpData) => (
                <div key={up.id} className="visited-item">
                  <div className="visited-avatar">
                    <Avatar src={up.avatar} className="visited-avatar-img" />
                  </div>
                  <div className="visited-name">{up.name.length > 4 ? up.name.slice(0, 4) + '...' : up.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {recentVisited.filter(up => followedUps.has(up.id)).length === 0 && (
          <div className="notice-section">
            <div className="notice-title">你还没有关注过UP主哦</div>
            <div className="notice-desc">关注更多的UP主，精彩内容不错过</div>
          </div>
        )}

        <hr className="divider" />

        {/* 推荐UP主 */}
        <div className="recommend-section">
          <div className="section-title">猜你喜欢的UP主</div>

          {upData.map((up: UpData, index: number) => (
            <React.Fragment key={up.id}>
              <Card className="up-card">
                <div className="up-header">
                  <div className="up-info">
                    <Avatar src={up.avatar} className="up-avatar" />
                    <div className="up-details">
                      <div className="up-name">{up.name}</div>
                      <div className="up-desc">{up.desc}</div>
                    </div>
                  </div>
                  <Button 
                    color={followedUps.has(up.id) ? "default" : "primary"} 
                    size="small" 
                    className={`follow-btn ${followedUps.has(up.id) ? 'followed' : ''}`}
                    fill={followedUps.has(up.id) ? "solid" : "outline"}
                    onClick={() => handleFollowToggle(up.id)}
                    loading={followingInProgress.has(up.id)}
                  >
                    <span>{followedUps.has(up.id) ? '已关注' : '+ 关注'}</span>
                  </Button>
                </div>

                {/* 视频网格 */}
                <div className="video-grid">
                  {up.videos.map((video: Video) => (
                    <div key={video.id} className="video-item">
                      <div className="video-thumbnail">
                        <img src={video.thumbnail} alt={video.title} />
                        <div className="video-views">{video.views}</div>
                      </div>
                      <div className="video-title">{video.title}</div>
                    </div>
                  ))}
                </div>
              </Card>
              {index < upData.length - 1 && <hr className="divider" />}
            </React.Fragment>
          ))}

          {/* 无限滚动组件 */}
          <InfiniteScroll
            loadMore={loadMoreData}
            hasMore={hasMore}
            threshold={10}
          >
            {hasMore ? (
              <span>正在加载更多...</span>
            ) : (
              <span>没有更多内容了</span>
            )}
          </InfiniteScroll>
        </div>

        {/* 返回顶部按钮 */}
        <BackToTop />
      </div>
    </PullToRefresh>

      {/* 关注列表覆盖层 */}
      {showFollowedOverlay && (
        <div className="followed-overlay">
          <NavBar 
            
            onBack={handleHideFollowedOverlay}
            className="overlay-navbar"
          >
            我的关注
          </NavBar>
          
          <div className="overlay-content">
            {getAllFollowedUps().length > 0 ? (
              <div className="followed-list">
                {getAllFollowedUps().map((up: UpData) => (
                  <div key={up.id} className="followed-item">
                    <div className="followed-avatar">
                      <Avatar src={up.avatar} className="followed-avatar-img" />
                    </div>
                    <div className="followed-info">
                      <div className="followed-name">{up.name}</div>
                      <div className="followed-desc">{up.desc}</div>
                      <div className="followed-followers">{up.followers}粉丝</div>
                    </div>
                    <Button
                      size="small"
                      fill="outline"
                      color="default"
                      className={`follow-toggle-btn ${followedUps.has(up.id) ? 'followed' : 'unfollowed'}`}
                      onClick={() => handleFollowToggle(up.id)}
                      loading={followingInProgress.has(up.id)}
                    >
                      {followedUps.has(up.id) ? '取消关注' : '+关注'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-followed">
                <div className="empty-text">暂无关注的UP主</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
