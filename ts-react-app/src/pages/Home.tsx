import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { NavBar, TabBar, Button } from 'antd-mobile';
import {
  AppOutline,
  MessageOutline,
  EditSOutline,
  UserOutline
} from 'antd-mobile-icons';
import './Home.scss';
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const tabs = [
    {
      key: '/home/first',
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: '/home/create',
      title: '创建',
      icon: <EditSOutline />,
    },
    {
      key: '/home/message',
      title: '消息',
      icon: <MessageOutline />,
    },
    {
      key: '/home/mine',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  // 获取用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/login');
  };
  return (
    <div className="home-page">
      {/* <div className="home-header">
        <h1>欢迎回来，{currentUser?.nickname || currentUser?.username || '用户'}！</h1>
        <Button 
          size="small" 
          color="danger" 
          fill="outline"
          onClick={handleLogout}
        >
          登出
        </Button>
      </div> */}
      
      <div className="home-content">
        <Outlet />
      </div>
      
      <div className="home-footer">
        <TabBar onChange={(key) => navigate(key)} style={{position: 'fixed', bottom: 0, left: 0, right: 0,backgroundColor: '#fff'}}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default Home; 