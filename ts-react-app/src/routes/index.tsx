import React from 'react';
import { createBrowserRouter,Navigate } from 'react-router-dom';
import FIrst from '../pages_home二级路由/First';
import Create from '../pages_home二级路由/Create';
import Message from '../pages_home二级路由/Message';
import Mine from '../pages_home二级路由/Mine';
import Chat from '../pages/Chat';
// 页面组件
import Home from '../pages/Home';
import UserManagement from '../pages/UserManagement';

import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import Setting from '../pages_home二级路由/Mine/setting';
import EditProfile from '../pages_home二级路由/Mine/EditProfile';
import Membership from '../pages_home二级路由/Mine/Membership';
import FollowList from '../pages_home二级路由/Mine/FollowList';
import UserProfile from '../pages_home二级路由/Mine/UserProfile';
const Router = createBrowserRouter([
  
  {
    path: '/',
    element: <Navigate to="/home" replace />
  },
  {
    path:'/home',
    element:(
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children:[
      {
        path:'/home/first',
        element:<FIrst />
      },
      {
        path:'/home/create',
        element:<Create />
      },
      {
        path:'/home/message',
        element:<Message />
      },
      {
        path:'/home/mine',
        element:<Mine />
      },
      {
        path:'/home/mine/setting',
        element:<Setting />
      },
      {
        path:'/home/mine/edit',
        element:<EditProfile />
      },
      {
        path:'/home/mine/membership',
        element:<Membership />
      },
      {
        path:'/home/mine/follow-list',
        element:<FollowList />
      },
      {
        path:'/home/mine/setting/:userId',
        element:<UserProfile />
      },
    ]
  },
  {
    path:'/users',
    element:(
      <ProtectedRoute>
        <UserManagement />
      </ProtectedRoute>
    )
  },
  {
    path:'/login',
    element:(
      <ProtectedRoute>
        <Login />
      </ProtectedRoute>
    )
  },
  {
    path:'*',
    element:<NotFound />
  },
  {
    path:'/chat',
    element:<Chat/>
  },
  {
    path:'/chat/:targetUserId',
    element:<Chat/>
  },
  
])

export default Router; 