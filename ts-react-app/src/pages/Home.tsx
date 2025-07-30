import React,{useState} from 'react';
import { Outlet,useNavigate } from 'react-router-dom';
import { NavBar,TabBar } from 'antd-mobile';
import {
  AppOutline,
  MessageOutline,
  UnorderedListOutline,
  UserOutline,
  MessageFill
} from 'antd-mobile-icons';
const Home: React.FC = () => {
  const toNav = useNavigate();
  const tabs = [
    {
      key: '/home/first',
      title: '首页',
      icon: <AppOutline />,
      
    },
    {
      key: '/home/create',
      title: '创作',
      icon: <UnorderedListOutline />,
      badge: '5',
    },
    {
      key: '/home/message',
      title: '消息',
      icon: (active: boolean) =>
        active ? <MessageFill /> : <MessageOutline />,
      badge: '99+',
    },
    {
      key: '/home/mine',
      title: '我的',
      icon: <UserOutline />,
    },
  ]

  // const [activeKey, setActiveKey] = useState('todo')
  const back = () => {
    toNav(-1)
  }
  return (
    <div className="home-page">
      <NavBar
      onBack={back}
      >
        前端社区
      </NavBar>
      <Outlet />
      <TabBar 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      }}
      >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} onClick={() => toNav(item.key)} />
          ))}
        </TabBar>
    </div>
  );
};

export default Home; 