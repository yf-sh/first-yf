var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// 导入路由模块
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var clipsRouter = require('./routes/clips');
var rolesRouter = require('./routes/roles');
var managersRouter = require('./routes/managers');
var permissionsRouter = require('./routes/permissions');
// 导入数据库连接模块
var connectDB = require('./config/database');

// 加载环境变量
require('dotenv').config();
// 导入CORS中间件
var cors = require('cors');

// 创建Express应用
var app = express();


// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 使用中间件
app.use(logger('dev')); // 日志中间件
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: false })); // 解析URL编码请求体
app.use(cookieParser()); // 解析Cookie
// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
// 启用CORS
app.use(cors());

// 注册路由
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/clips', clipsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/managers', managersRouter);
app.use('/api/permissions', permissionsRouter);

// 404错误处理
app.use(function(req, res, next) {
  next(createError(404));
});

// 全局错误处理
app.use(function(err, req, res, next) {
  // 设置本地变量，仅在开发环境提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;