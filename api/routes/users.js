var express = require('express');
var router = express.Router();
var User = require('../models/User');
var jwt = require('jsonwebtoken');
require('dotenv').config();


// 用户登录
router.post('/login', function(req, res, next) {
  let {username,password} = req.body;
  User.findOne({username:username},function(err,user){
    if(err){
      res.json({code:500,msg:'服务器错误'});
    }
    if(!user){
      res.json({code:400,msg:'用户不存在'});
    }
    if(user.password !== password){
      res.json({code:400,msg:'密码错误'});
    }
    // 生成JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
  );
    
    res.json({code:200,msg:'登录成功',data:token});
  })
});
// 用户注册
router.post('/register', function(req, res, next) {
  res.send('respond with a resource');
});
// 用户信息编辑（用户编辑信息，审核员审核）
router.post('/edit', function(req, res, next) {
  res.send('respond with a resource');
});
// 用户信息删除（超级管理员）
router.post('/delete', function(req, res, next) {
  res.send('respond with a resource');
});
module.exports = router;
