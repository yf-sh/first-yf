var express = require('express');
var router = express.Router();
var Manager = require('../models/Manager');
var jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET

/**
 * 管理员登录
 * @route POST /api/managers/login
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {object} 包含token的响应对象
 */
router.post('/login',async function (req, res, next) {
    let {username,password} = req.body;
    console.log(username,password);
    
    // 查找用户
    let aa = await Manager.findOne({ username: username })
    console.log(aa);
    if (!aa) {
        res.json({ code: 400, msg: '用户不存在' });
        return;
      }
      // 验证密码
      if (aa.password !== password) {
        res.json({ code: 400, msg: '密码错误' });
        return;
      }
      // 生成JWT Token
    const token = jwt.sign(
        { userId: aa._id, username: aa.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
      res.json({ code: 200, msg: '登录成功', data: {token:token} });
    }

)



/**
 * 管理员退出
 * @route POST /api/managers/logout
 * @returns {object} 响应对象
 */
router.post('/logout', function (req, res, next) {
  res.json({ code: 200, msg: '退出成功' });
})

/**
 * 添加管理员
 * @route POST /api/managers/add
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} [role] - 角色ID
 * @param {Array<string>} [permissions] - 权限ID数组
 * @returns {object} 创建的管理员对象
 */
router.post('/add', async function(req, res, next) {
  try {
    const { 
      username, 
      password, 
      role, 
      permissions 
    } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.json({code: 400, msg: '请填写用户名和密码'});
    }
    
    // 检查用户名是否已存在
    const existingManager = await Manager.findOne({ username });
    if (existingManager) {
      return res.json({code: 400, msg: '用户名已存在'});
    }
    
    // 创建管理员数据对象
    const managerData = {
      username,
      password,
      role: role || null,
      permissions: permissions || []
    };
    
    // 保存到数据库
    const newManager = new Manager(managerData);
    const result = await newManager.save();
    res.json({code: 200, msg: '添加管理员成功', data: result});
  } catch (error) {
    console.error('添加管理员错误:', error);
    res.json({code: 500, msg: '添加管理员失败'});
  }
})

/**
 * 更新管理员
 * @route POST /api/managers/update
 * @param {string} _id - 管理员ID
 * @param {string} username - 用户名
 * @param {string} [password] - 密码(可选)
 * @param {string} [role] - 角色ID
 * @param {Array<string>} [permissions] - 权限ID数组
 * @returns {object} 更新后的管理员对象
 */
router.post('/update', async function(req, res, next) {
  try {
    const { 
      _id, 
      username, 
      password,
     
      role, 
      permissions 
    } = req.body;
    
    // 验证必填字段
    if (!_id || !username) {
      return res.json({code: 400, msg: '请填写管理员ID和用户名'});
    }
    
    // 检查用户名是否与其他管理员重复
    const existingManager = await Manager.findOne({ username, _id: { $ne: _id } });
    if (existingManager) {
      return res.json({code: 400, msg: '用户名已存在'});
    }
    
    // 创建更新数据对象
    const updateData = {
      username,
      password,
      role: role || null,
      permissions: permissions || []
    };
    
    // 更新数据库
    const result = await Manager.findByIdAndUpdate(_id, updateData, { new: true });
    if (!result) {
      return res.json({code: 400, msg: '管理员不存在'});
    }
    
    res.json({code: 200, msg: '更新管理员成功', data: result});
  } catch (error) {
    console.error('更新管理员错误:', error);
    res.json({code: 500, msg: '更新管理员失败'});
  }
})

/**
 * 删除管理员
 * @route POST /api/managers/delete
 * @param {string} _id - 管理员ID
 * @returns {object} 响应对象
 */
router.post('/delete', async function(req, res, next) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.json({code: 400, msg: '请提供管理员ID'});
    }
    
    // 从数据库删除
    const result = await Manager.findByIdAndDelete(_id);
    if (!result) {
      return res.json({code: 400, msg: '管理员不存在'});
    }
    
    res.json({code: 200, msg: '删除管理员成功'});
  } catch (error) {
    console.error('删除管理员错误:', error);
    res.json({code: 500, msg: '删除管理员失败'});
  }
})

/**
 * 获取管理员列表
 * @route GET /api/managers/list
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=5] - 每页数量
 * @returns {object} 包含管理员列表和分页信息的响应对象
 */
router.get('/list', async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const total = await Manager.countDocuments({});
    
    // 获取分页数据，包含角色和权限信息
    const data = await Manager.find({})
      .populate('role')
      .populate('permissions')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // 按创建时间倒序
    
    res.json({
      code: 200,
      msg: '获取管理员列表成功',
      data: data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.json({code: 500, msg: '获取管理员列表失败'});
  }
})

module.exports = router;