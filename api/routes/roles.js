var express = require('express');
var router = express.Router();
var Role = require('../models/Role');

/**
 * 获取角色列表
 * @route GET /api/roles/list
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=5] - 每页数量
 * @returns {object} 包含角色列表和分页信息的响应对象
 */
router.get('/list', async function(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const total = await Role.countDocuments({});
    
    // 获取分页数据，包含权限信息
    const data = await Role.find({})
      .populate('permissions')
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // 按创建时间倒序
    
    res.json({
      code: 200,
      msg: '获取角色列表成功',
      data: data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.json({code: 500, msg: '获取角色列表失败'});
  }
});

/**
 * 创建角色
 * @route POST /api/roles/create
 * @param {string} name - 角色名称
 * @param {string} description - 角色描述
 * @param {Array<string>} [permissions] - 权限ID数组
 * @returns {object} 创建的角色对象
 */
router.post('/create', async function(req, res, next) {
  try {
    const { name, description, permissions } = req.body;
    // 验证必填字段
    if (!name || !description) {
      return res.json({code: 400, msg: '请填写所有必填字段'});
    }
    
    // 检查角色名称是否已存在
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.json({code: 400, msg: '角色名称已存在'});
    }
    
    // 创建并保存新角色
    const newRole = new Role({ name, description, permissions });
    const result = await newRole.save();
    res.json({code: 200, msg: '创建角色成功', data: result});
  } catch (error) {
    console.error('创建角色错误:', error);
    res.json({code: 500, msg: '创建角色失败'});
  }
});

/**
 * 编辑角色
 * @route POST /api/roles/edit
 * @param {string} _id - 角色ID
 * @param {string} name - 角色名称
 * @param {string} description - 角色描述
 * @param {Array<string>} [permissions] - 权限ID数组
 * @returns {object} 更新后的角色对象
 */
router.post('/edit', async function(req, res, next) {
  try {
    const { _id, name, description, permissions } = req.body;
    // 验证必填字段
    if (!_id || !name || !description) {
      return res.json({code: 400, msg: '请填写所有必填字段'});
    }
    
    // 检查角色名称是否与其他角色重复
    const existingRole = await Role.findOne({ name, _id: { $ne: _id } });
    if (existingRole) {
      return res.json({code: 400, msg: '角色名称已存在'});
    }
    
    // 更新角色
    const result = await Role.findByIdAndUpdate(_id, { name, description, permissions }, { new: true });
    if (!result) {
      return res.json({code: 400, msg: '角色不存在'});
    }
    
    res.json({code: 200, msg: '修改角色成功', data: result});
  } catch (error) {
    console.error('修改角色错误:', error);
    res.json({code: 500, msg: '修改角色失败'});
  }
})

/**
 * 删除角色
 * @route POST /api/roles/delete
 * @param {string} _id - 角色ID
 * @returns {object} 响应对象
 */
router.post('/delete', async function(req, res, next) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.json({code: 400, msg: '请提供角色ID'});
    }
    
    // 删除角色
    const result = await Role.findByIdAndDelete(_id);
    if (!result) {
      return res.json({code: 400, msg: '角色不存在'});
    }
    
    res.json({code: 200, msg: '删除角色成功'});
  } catch (error) {
    console.error('删除角色错误:', error);
    res.json({code: 500, msg: '删除角色失败'});
  }
})

/**
 * 获取角色详细信息
 * @route GET /api/roles/detail/:id
 * @param {string} id - 角色ID
 * @returns {object} 角色详细信息，包含权限
 */
router.get('/detail/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({code: 400, msg: '请提供角色ID'});
    }
    
    // 获取角色详情并填充权限信息
    const role = await Role.findById(id).populate('permissions');
    if (!role) {
      return res.json({code: 400, msg: '角色不存在'});
    }
    
    res.json({code: 200, msg: '获取角色详情成功', data: role});
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.json({code: 500, msg: '获取角色详情失败'});
  }
})

module.exports = router;