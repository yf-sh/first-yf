var express = require('express');
var router = express.Router();
var Manager = require('../models/manager');
var jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET

// 登录
router.post('/login', function (req, res, next) {
    let {username,password} = req.body;
    Manager.findOne({ username: username }, function (err, manager) {
        if (err) {
            res.json({ code: 500, msg: '服务器错误' });
        }
        if (!manager) {
            res.json({ code: 400, msg: '用户不存在' });
        }
        if (manager.password !== password) {
            res.json({ code: 400, msg: '密码错误' });
            return;
        }
        // 生成JWT Token
    const token = jwt.sign(
        { userId: manager._id, username: manager.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
        res.json({ code: 200, msg: '登录成功', data: token });
    })
})
// 退出
router.post('/logout', function (req, res, next) {
  res.json({ code: 200, msg: '退出成功' });
})
// 获取列表
router.get('/list', function (req, res, next) {
  res.json({ code: 200, msg: '获取列表成功' });
})

module.exports = router;

