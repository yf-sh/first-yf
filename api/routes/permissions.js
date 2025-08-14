var express = require('express');
var router = express.Router();

const Permission = require('../models/Permission');

/**
 * 获取权限列表
 * @route GET /api/permissions/list
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=5] - 每页数量
 * @returns {object} 包含权限列表和分页信息的响应对象
 */
router.get('/list',async function(req,res,next){
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const total = await Permission.countDocuments({});
    
    // 获取分页数据
    const data = await Permission.find({})
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // 按创建时间倒序
    
    res.json({
      code: 200,
      msg: '获取权限列表成功',
      data: data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.json({code: 500, msg: '获取权限列表失败'});
  }
})

/**
 * 添加权限
 * @route POST /api/permissions/add
 * @param {string} name - 权限名称
 * @param {string} description - 权限描述
 * @param {string} code - 权限代码
 * @param {string} type - 权限类型
 * @returns {object} 创建的权限对象
 */
router.post('/add', async function(req, res, next) {
  try {
    const { name, description, code, type } = req.body;
    
    // 验证必填字段
    if (!name || !description || !code || !type) {
      return res.json({code: 400, msg: '请填写所有必填字段'});
    }
    
    // 检查权限名称是否已存在
    const existingName = await Permission.findOne({ name });
    if (existingName) {
      return res.json({code: 400, msg: '权限名称已存在'});
    }
    
    // 检查权限代码是否已存在
    const existingCode = await Permission.findOne({ code });
    if (existingCode) {
      return res.json({code: 400, msg: '权限代码已存在'});
    }
    
    // 创建新权限
    const newPermission = new Permission({
      name,
      description,
      code,
      type
    });
    
    const result = await newPermission.save();
    res.json({code: 200, msg: '添加权限成功', data: result});
  } catch (error) {
    console.error('添加权限错误:', error);
    res.json({code: 500, msg: '添加权限失败'});
  }
})

/**
 * 删除权限
 * @route POST /api/permissions/delete
 * @param {string} _id - 权限ID
 * @returns {object} 响应对象
 */
router.post('/delete', async function(req, res, next) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.json({code: 400, msg: '缺少权限ID'});
    }
    
    // 删除权限
    const result = await Permission.findByIdAndDelete(_id);
    if (!result) {
      return res.json({code: 404, msg: '权限不存在'});
    }
    
    res.json({code: 200, msg: '删除权限成功'});
  } catch (error) {
    console.error('删除权限错误:', error);
    res.json({code: 500, msg: '删除权限失败'});
  }
})

/**
 * 更新权限
 * @route POST /api/permissions/update
 * @param {string} _id - 权限ID
 * @param {string} [name] - 权限名称
 * @param {string} [description] - 权限描述
 * @param {string} [code] - 权限代码
 * @param {string} [type] - 权限类型
 * @returns {object} 更新后的权限对象
 */
router.post('/update', async function(req, res, next) {
  try {
    const { _id, name, description, code, type } = req.body;
    if (!_id) {
      return res.json({code: 400, msg: '缺少权限ID'});
    }
    
    // 创建更新数据对象
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (code) updateData.code = code;
    if (type) updateData.type = type;
    
    // 更新权限
    const result = await Permission.findByIdAndUpdate(_id, updateData, { new: true });
    if (!result) {
      return res.json({code: 404, msg: '权限不存在'});
    }
    
    res.json({code: 200, msg: '更新权限成功', data: result});
  } catch (error) {
    console.error('更新权限错误:', error);
    res.json({code: 500, msg: '更新权限失败'});
  }
})

module.exports = router;