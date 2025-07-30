import React from 'react';
import { createBrowserRouter,Navigate } from 'react-router-dom';
import FIrst from '../pages_home二级路由/First';
import Create from '../pages_home二级路由/Create';
import Message from '../pages_home二级路由/Message';
import Mine from '../pages_home二级路由/Mine';
// 页面组件
import Home from '../pages/Home';
import UserManagement from '../pages/UserManagement';

import Login from '../pages/Login';
import NotFound from '../pages/NotFound';

const Router = createBrowserRouter([
  
  {
    path: '/',
    element: <Navigate to="/home" replace />
  },
  {
    path:'/home',
    element:<Home />,
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
    ]
  },
  {
    path:'/users',
    element:<UserManagement />
  },
  {
    path:'/login',
    element:<Login />
  },
  {
    path:'*',
    element:<NotFound />
  }
  
])

export default Router; 