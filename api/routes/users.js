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

// 获取用户列表
router.get('/list', async function(req, res, next) {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    let query = {};
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // 获取总数
    const total = await User.countDocuments(query);
    
    // 获取用户列表
    const users = await User.find(query)
      .select('-password -refreshToken') // 排除敏感字段
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: users,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 获取用户详情
router.get('/detail/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -refreshToken');
    
    if (!user) {
      return res.json({ code: 404, msg: '用户不存在' });
    }
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 删除用户
router.delete('/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.json({ code: 404, msg: '用户不存在' });
    }
    
    res.json({
      code: 200,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 更新用户状态
router.put('/:id/status', async function(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password -refreshToken');
    
    if (!user) {
      return res.json({ code: 404, msg: '用户不存在' });
    }
    
    res.json({
      code: 200,
      msg: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

module.exports = router;
