import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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


  return (
    <div className="home-page">
    
      
      <div className="home-content">
        <Outlet />
      </div>
      
      <div className="home-footer">
        <TabBar 
          activeKey={location.pathname}
          onChange={(key) => navigate(key)} 
          style={{position: 'fixed', bottom: 0, left: 0, right: 0,backgroundColor: '#fff'}}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default Home; 