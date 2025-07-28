# 前端社区应用 - API后端设计

## 项目结构
```
api/
├── config/                 # 配置文件
│   ├── database.js        # 数据库配置
│   ├── redis.js           # Redis配置
│   └── upload.js          # 文件上传配置
├── controllers/           # 控制器层
│   ├── authController.js  # 认证控制器
│   ├── userController.js  # 用户控制器
│   ├── videoController.js # 视频控制器
│   ├── messageController.js # 消息控制器
│   └── adminController.js # 管理控制器
├── middleware/            # 中间件
│   ├── auth.js           # 认证中间件
│   ├── upload.js         # 文件上传中间件
│   ├── rateLimit.js      # 限流中间件
│   └── security.js       # 安全检测中间件
├── models/               # 数据模型
│   ├── User.js          # 用户模型
│   ├── Video.js         # 视频模型
│   ├── Role.js          # 角色模型
│   ├── Permission.js    # 权限模型
│   └── Message.js       # 消息模型
├── routes/              # 路由
│   ├── auth.js         # 认证路由
│   ├── users.js        # 用户路由
│   ├── videos.js       # 视频路由
│   ├── messages.js     # 消息路由
│   └── admin.js        # 管理路由
├── services/           # 业务逻辑层
│   ├── authService.js  # 认证服务
│   ├── videoService.js # 视频服务
│   ├── aiService.js    # AI服务
│   └── uploadService.js # 上传服务
├── utils/              # 工具函数
│   ├── jwt.js         # JWT工具
│   ├── validation.js  # 数据验证
│   └── response.js    # 统一响应格式
└── websocket/         # WebSocket
    └── chatServer.js  # 聊天服务器
```

## 核心功能模块

### 1. 用户认证系统
- JWT token认证
- 用户注册/登录
- 密码加密存储
- 角色权限验证

### 2. 视频管理系统
- 视频上传（支持大文件）
- 内容合规检测
- 视频状态管理
- 视频信息CRUD

### 3. 消息系统
- WebSocket实时通信
- 私信功能
- 智能客服机器人
- 消息历史记录

### 4. 权限管理系统
- 角色管理
- 权限分配
- 等级系统
- 会员机制

### 5. 安全防护
- 请求限流
- 内容安全检测
- 文件上传安全
- SQL注入防护 